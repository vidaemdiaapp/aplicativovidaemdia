import { supabase } from './supabase';

/**
 * Sprint 18: Intelligent Knowledge Base (Foundation)
 * Standardization, Hashing, and Domain Policies
 */

export const TRUSTED_DOMAINS = [
    '*.gov.br',
    'planalto.gov.br',
    'senatran.gov.br',
    'detran.*.gov.br',
    '*.jus.br',
    'jusbrasil.com.br',
    'usezapay.com.br',
    'gringo.com.vc',
    'senatran.serpro.gov.br',
    'zuldigital.com.br'
];

/**
 * System Instructions for the Intelligent Assistant
 * These rules are mandatory for all AI generated content.
 */
export const SYSTEM_PROMPT_LOCKED = `
Você é o assistente oficial do aplicativo Vida em Dia.

OBJETIVO: Responder a pergunta do usuário com clareza, em português do Brasil, e com responsabilidade. Você também deve devolver fontes e um JSON estruturado.

REGRAS DE SEGURANÇA (OBRIGATÓRIAS):
1) Não invente valores, pontos, prazos, artigos de lei ou regras. Se não tiver fonte confiável, diga que não sabe.
2) Sempre que citar um fato verificável (número, regra, prazo, desconto, pontos), inclua fonte(s) oficiais.
3) Use linguagem “pode”, “em geral”, “depende” quando houver variação por órgão/estado/caso.
4) Não dê aconselhamento jurídico definitivo. Você pode orientar o usuário sobre passos e documentos.
5) Se faltar informação para concluir, faça até 3 perguntas objetivas.
6) Saída SEMPRE no formato JSON abaixo. Não inclua nada fora do JSON.

FONTES PERMITIDAS: Somente domínios oficiais e confiáveis (*.gov.br, *.jus.br, etc).
`;

export const TTL_MAP: Record<string, number> = {
    // Traffic
    'traffic_general': 365,
    'traffic_links': 90,
    'traffic_procedures': 45, // mid of 30-60
    // IRPF
    'irpf_2026': -1, // Custom logic: end of year
    'irpf_deadlines': 30,
    // Documents
    'docs_models': 180,
    'docs_portals': 60,
    // Default
    'general': 60
};

export const normalizeQuestion = (text: string): string => {
    return text.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^\w\s]/gi, '') // Remove punctuation
        .replace(/\s+/g, ' ') // Collapse spaces
        .trim();
};

/**
 * Calculates the expiration date based on domain/category and model suggestion
 */
export const calculateExpiration = (category: string, modelTTL?: number): string => {
    let finalDays = TTL_MAP[category] || TTL_MAP['general'];

    // Rule: IRPF 2026 Cycle expires on Dec 31st 2026
    if (category === 'irpf_2026') {
        const dec31_2026 = new Date('2026-12-31T23:59:59Z');
        return dec31_2026.toISOString();
    }

    // User rule: Domain default overwrites model, but model suggestion is kept if shorter
    if (modelTTL && modelTTL < finalDays) {
        finalDays = modelTTL;
    }

    const date = new Date();
    date.setDate(date.getDate() + finalDays);
    return date.toISOString();
};

export const hashQuestion = async (text: string): Promise<string> => {
    const normalized = normalizeQuestion(text);
    const msgUint8 = new TextEncoder().encode(normalized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export interface KnowledgeFact {
    id: string;
    domain: string;
    fact_key?: string; // Intent-based caching
    question_hash: string;
    question_text: string;
    question_normalized: string;
    answer_text: string;
    answer_json: any;
    sources: { url: string; title: string; excerpt?: string }[];
    confidence_level: 'high' | 'medium' | 'low';
    valid_until: string;
    model_provider: string;
    model_name: string;
    retrieved_at: string;
}

export const knowledgeService = {
    /**
     * Cache-first knowledge retrieval flow
     */
    getKnowledge: async (domain: string, question: string, factKey?: string): Promise<KnowledgeFact | null> => {
        try {
            const qHash = await hashQuestion(question);

            // 1. Cache first check
            let query = supabase
                .from('knowledge_facts')
                .select('*')
                .eq('domain', domain)
                .gt('valid_until', new Date().toISOString());

            // If we have a fact_key, prioritize that as it allows intent-based reuse
            if (factKey) {
                query = query.eq('fact_key', factKey);
            } else {
                query = query.eq('question_hash', qHash);
            }

            const { data: cached, error } = await query.maybeSingle();

            if (cached) {
                // Audit the hit
                await supabase.from('knowledge_audit').insert({
                    fact_id: cached.id,
                    event: 'used'
                });
                return cached as KnowledgeFact;
            }

            return null; // Not found or expired (flow continues to Gemini in the Function)
        } catch (error) {
            console.error('[Knowledge] Retrieval failed:', error);
            return null;
        }
    },

    /**
     * Validates Gemini output against technical constraints
     */
    validateKnowledge: (data: any, domain: string): { ok: boolean; reason?: string } => {
        // 1. Structure check
        if (!data.answer_text || !data.answer_json || !data.confidence_level) {
            return { ok: false, reason: 'invalid_structure' };
        }

        // 2. Has sources?
        if (!data.sources || data.sources.length === 0) {
            return { ok: false, reason: 'no_sources' };
        }

        // 3. Are sources from allowed domains?
        const isTrusted = data.sources.every((s: any) => {
            try {
                const url = new URL(s.url);
                return TRUSTED_DOMAINS.some(trusted => {
                    const pattern = trusted.replace(/\*/g, '.*');
                    const regex = new RegExp(`^${pattern}$`);
                    return regex.test(url.hostname);
                });
            } catch (e) {
                return false;
            }
        });

        if (!isTrusted) {
            return { ok: false, reason: 'untrusted_sources' };
        }

        // 4. Legal certainty check (anti-hallucination)
        const forbiddenTerms = ["e nula", "garantido", "nao existe duvida", "certeza absoluta", "decisao definitiva"];
        const hasForbidden = forbiddenTerms.some(term =>
            data.answer_text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(term)
        );

        if (hasForbidden) {
            return { ok: false, reason: 'excessive_certainty' };
        }

        return { ok: true };
    },

    /**
     * Stores a new validated fact in the knowledge base
     */
    saveFact: async (fact: Partial<KnowledgeFact> & { ttl_days?: number }): Promise<KnowledgeFact | null> => {
        try {
            const finalFact = {
                ...fact,
                valid_until: fact.valid_until || calculateExpiration(fact.domain || 'general', fact.ttl_days)
            };

            // Remove ttl_days before saving to DB
            delete (finalFact as any).ttl_days;

            const { data, error } = await supabase
                .from('knowledge_facts')
                .upsert(finalFact)
                .select()
                .single();

            if (error) throw error;

            // Audit the creation
            await supabase.from('knowledge_audit').insert({
                fact_id: data.id,
                event: 'created'
            });

            return data as KnowledgeFact;
        } catch (error) {
            console.error('[Knowledge] Saving failed:', error);
            return null;
        }
    }
};
