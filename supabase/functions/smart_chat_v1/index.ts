import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Definite CORS configuration as requested by USER
const allowedOrigins = new Set([
    "http://localhost:3000",
    "http://localhost:3001",
]);

function getCorsHeaders(origin: string | null) {
    const o = origin && allowedOrigins.has(origin) ? origin : "*";
    return {
        "Access-Control-Allow-Origin": o,
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
    };
}

// System configuration for IRPF 2026 and safety rules
const SYSTEM_PROMPT_LOCKED = `
Você é o assistente oficial do aplicativo Vida em Dia, um especialista educacional em "Vida Adulta" e Imposto de Renda.

IMPORTANTE: Responda SEMPRE em português brasileiro (pt-BR).

OBJETIVO: Responder a pergunta do usuário com clareza, tom pedagógico (foco explicativo) e humanizado.
REGRAS:
1) IDIOMA: Responda obrigatoriamente em português brasileiro (PT-BR), mesmo se a pergunta estiver em outro idioma.
2) BASE DE CONHECIMENTO: Priorize regras de 2026.
3) VALIDAÇÃO: Se a resposta não for direta ou for vaga, oriente o usuário a detalhar.
4) FORMATO: Única e exclusivamente JSON válido.
5) SEGURANÇA: Não realize cálculos exatos de restituição sem dados oficiais.

FORMATO DE SAÍDA (JSON):
{
  "answer_text": "Sua resposta humanizada aqui.",
  "answer_json": {
    "domain": "irpf|finance|general",
    "key_facts": [{ "label": "Título", "value": "Fato" }],
    "suggested_next_actions": ["Ação 1", "Ação 2"]
  },
  "sources": [{ "url": "...", "title": "..." }],
  "confidence_level": "high|medium|low",
  "ttl_days": 7
}
`;

Deno.serve(async (req) => {
    console.log(`[smart_chat_v1] Incoming request: ${req.method} ${req.url}`);

    const origin = req.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);

    // Preflight (CORS)
    if (req.method === "OPTIONS") {
        console.log("[smart_chat_v1] Handling OPTIONS preflight for origin:", origin);
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const apiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY");
        const modelName = Deno.env.get("GEMINI_MODEL_NAME") || "models/gemini-2.0-flash";

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error("[smart_chat_v1] Missing Supabase environment variables");
            throw new Error("Supabase config missing (URL/Key).");
        }
        if (!apiKey) {
            console.error("[smart_chat_v1] Missing Gemini API Key");
            throw new Error("Chave GEMINI_API_KEY não encontrada nos Segredos do Supabase.");
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        let body;
        try {
            body = await req.json();
            console.log("[smart_chat_v1] Received body:", JSON.stringify(body).slice(0, 200));
        } catch (e) {
            console.error("[smart_chat_v1] Error parsing JSON body:", e.message);
            throw new Error("Corpo da requisição inválido (JSON esperado).");
        }

        const { question, domain = 'general', user_id } = body; // user_id is optional for now, but good to have

        if (!question) {
            console.warn("[smart_chat_v1] Question missing in request body");
            throw new Error("Pergunta não identificada no corpo da requisição.");
        }

        // 1. Normalize and Hash (Enhanced for Intent Caching)
        // Normalized key now includes domain to separate concerns
        const normalized = `${domain}:${question.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s]/gi, '')
            .replace(/\s+/g, ' ')
            .trim()}`;

        const msgUint8 = new TextEncoder().encode(normalized);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const qHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // 2. Cache check (with Expiration)
        const { data: cached, error: cacheError } = await supabaseAdmin
            .from('knowledge_facts')
            .select('*')
            .eq('question_hash', qHash)
            .gt('valid_until', new Date().toISOString())
            .maybeSingle();

        if (cacheError) {
            console.error("[smart_chat_v1] Database error during cache check:", cacheError.message);
        }

        // Check for expiration if column exists (it does after migration)
        let isExpired = false;
        if (cached && cached.expires_at && new Date(cached.expires_at) < new Date()) {
            isExpired = true;
            console.log("[smart_chat_v1] Cache hit but expired for hash:", qHash);
        }

        if (cached && !isExpired) {
            console.log("[smart_chat_v1] Cache hit for hash:", qHash);
            await supabaseAdmin.from('knowledge_audit').insert({ fact_id: cached.id, event: 'used' });
            return new Response(JSON.stringify({ ...cached, is_cached: true }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        console.log(`[smart_chat_v1] Cache miss (Expired: ${isExpired}). Calling Gemini (${modelName}) for question:`, question.slice(0, 100));

        // 3. Call Gemini
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `${SYSTEM_PROMPT_LOCKED}\n\nPergunta: ${question}` }] }],
                generationConfig: { response_mime_type: "application/json" }
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            console.error("[smart_chat_v1] Gemini API Error Response:", JSON.stringify(errData));
            throw new Error(`Gemini API Error: ${errData.error?.message || response.statusText}`);
        }

        const geminiRaw = await response.json();
        const content = geminiRaw.candidates?.[0]?.content?.parts?.[0]?.text;

        // Cost Calculation (Approximation)
        // Gemini 1.0 Pro: Input $0.50/1M, Output $1.50/1M (Pricing varies, using approximation)
        // Gemini 2.0 Flash: Much cheaper
        const usageMetadata = geminiRaw.usageMetadata || {};
        const promptTokens = usageMetadata.promptTokenCount || 0;
        const candidatesTokens = usageMetadata.candidatesTokenCount || 0;

        // Estimate Cost (Flash rates: Input $0.10/1M, Output $0.40/1M approx)
        const costInput = (promptTokens / 1000000) * 0.10;
        const costOutput = (candidatesTokens / 1000000) * 0.40;
        const totalCost = costInput + costOutput;

        // Log Usage
        if (user_id) {
            await supabaseAdmin.from('ai_usage_logs').insert({
                user_id: user_id,
                model: modelName,
                tokens_input: promptTokens,
                tokens_output: candidatesTokens,
                cost_estimated: totalCost,
                domain: domain,
                action_type: 'chat'
            });
        }

        if (!content) {
            console.error("[smart_chat_v1] Gemini returned empty content");
            throw new Error("AI retornou resultado vazio.");
        }

        let geminiOutput;
        try {
            geminiOutput = JSON.parse(content);
        } catch (e) {
            console.error("[smart_chat_v1] Error parsing Gemini JSON output:", content);
            throw new Error("Erro ao processar resposta da IA.");
        }

        // 4. Save to Cache
        let validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + (geminiOutput.ttl_days || 7));

        // Set hard expiration for facts (e.g., 30 days) to force revalidation
        let expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const { data: fact, error: insertError } = await supabaseAdmin.from('knowledge_facts').upsert({
            domain,
            question_hash: qHash,
            question_text: question,
            question_normalized: normalized,
            answer_text: geminiOutput.answer_text,
            answer_json: geminiOutput.answer_json || {},
            sources: geminiOutput.sources || [],
            confidence_level: geminiOutput.confidence_level || 'medium',
            valid_until: validUntil.toISOString(),
            expires_at: expiresAt.toISOString(),
            last_verified_at: new Date().toISOString(),
            model_provider: 'gemini',
            model_name: modelName
        }, { onConflict: 'question_hash' }).select().single();

        if (insertError) {
            console.error("[smart_chat_v1] Error inserting into knowledge_facts:", insertError.message);
        } else if (fact) {
            await supabaseAdmin.from('knowledge_audit').insert({ fact_id: fact.id, event: 'created' });
            console.log("[smart_chat_v1] Cache created/updated for hash:", qHash);
        }

        return new Response(JSON.stringify({ ...geminiOutput, is_cached: false }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (e) {
        console.error("[smart_chat_v1] Catch block error:", e.message);
        return new Response(JSON.stringify({
            ok: false,
            error: String(e.message),
            answer_text: `⚠️ Desculpe, tive um problema técnico: ${e.message}.`
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200, // Return 200 for graceful handling in assistant.ts
        });
    }
});

