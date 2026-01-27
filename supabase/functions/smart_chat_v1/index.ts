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
Você é ELARA, a inteligência oficial do aplicativo Vida em Dia.
PERSONALIDADE:
- Você é humana, empática, inteligente e altamente capaz.
- NUNCA se refira a si mesma como "Assistente Virtual" ou "Robô". Você é a Elara.
- Seu tom é conversacional, acolhedor e profissional, como uma especialista sênior que é amiga do usuário.

ESPECIALIDADES:
1. Direito de Trânsito e Multas (Análise técnica de infrações, defesas, prazos).
2. Documentação Veicular (IPVA, Licenciamento, Transferência).
3. Imposto de Renda (Regras IRPF 2026, deduções, malha fina).
4. Investimentos e Economia (Educação financeira básica e intermediária).
5. Gerenciamento Doméstico (Organização de despesas, manutenção da casa).
6. Leitura de Arquivos (Análise de fotos de multas, notas fiscais, documentos).

REGRAS DE INTERAÇÃO:
1. IDIOMA: Responda SEMPRE em Português Brasileiro (PT-BR).
2. VISÃO: Se receber uma imagem, analise CADA DETALHE (texto, valores, códigos, datas).
3. FORMATO: Responda ÚNICA e EXCLUSIVAMENTE com o JSON abaixo.
4. SEGURANÇA: Para cálculos fiscais complexos, alerte que é uma estimativa.

FORMATO DE SAÍDA (JSON):
{
  "answer_text": "Sua resposta humanizada e completa aqui.",
  "answer_json": {
    "domain": "traffic|irpf|finance|general",
    "key_facts": [{ "label": "Título", "value": "Fato Importante" }],
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
            // Log body metadata but truncate huge image strings
            console.log("[smart_chat_v1] Received body keys:", Object.keys(body));
        } catch (e) {
            console.error("[smart_chat_v1] Error parsing JSON body:", e.message);
            throw new Error("Corpo da requisição inválido (JSON esperado).");
        }

        // Accept standard 'image' (base64) or 'images' array from frontend
        const { question, domain = 'general', user_id, image, images } = body;

        if (!question && !image && (!images || images.length === 0)) {
            console.warn("[smart_chat_v1] Content missing in request (no question or images)");
            throw new Error("Por favor, envie uma pergunta ou uma imagem para análise.");
        }

        // --- PREPARE GEMINI CONTENT PARTS ---
        const userParts = [];

        // 1. Add System Prompt first (in a chat context, usually distinct, but for single-turn API, prepend to parts or use systemInstruction if supported)
        // For simple generateContent, we'll prepend the system prompt to the user text or use it contextually.
        // Better strategy for single-shot: Include it in the text instruction.
        let finalPrompt = `${SYSTEM_PROMPT_LOCKED}\n\n`;
        if (question) finalPrompt += `PERGUNTA DO USUÁRIO: ${question}`;

        // 2. Handle Images (Multimodal)
        // 'image' field (legacy/single) or 'images' array
        const imagesToProcess = images || (image ? [image] : []);

        for (const imgData of imagesToProcess) {
            // Expecting base64 string, potentially with data:image/jpeg;base64, prefix
            // usage: { inline_data: { mime_type: '...', data: '...' } }

            let mimeType = "image/jpeg";
            let cleanBase64 = imgData;

            if (typeof imgData === 'string') {
                if (imgData.includes(';base64,')) {
                    const parts = imgData.split(';base64,');
                    mimeType = parts[0].replace('data:', '');
                    cleanBase64 = parts[1];
                }
            } else if (imgData.base64) {
                // Support object format if sent that way
                cleanBase64 = imgData.base64;
                mimeType = imgData.mimeType || "image/jpeg";
            }

            userParts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: cleanBase64
                }
            });
        }

        // 3. Add Text Part
        userParts.push({ text: finalPrompt });

        // --- CACHE BYPASS FOR IMAGES ---
        // If images are present, we skip cache reading to ensure analysis happens.
        // We could cache based on image hash in future, but for now force live check.
        const hasImages = imagesToProcess.length > 0;
        let qHash = '';

        if (!hasImages && question) {
            // 1. Normalize and Hash
            const normalized = `${domain}:${question.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^\w\s]/gi, '')
                .replace(/\s+/g, ' ')
                .trim()}`;

            const msgUint8 = new TextEncoder().encode(normalized);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            qHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            // 2. Cache Check
            const { data: cached, error: cacheError } = await supabaseAdmin
                .from('knowledge_facts')
                .select('*')
                .eq('question_hash', qHash)
                .gt('valid_until', new Date().toISOString())
                .maybeSingle();

            if (!cacheError && cached) {
                // Check soft expiration
                const isExpired = cached.expires_at && new Date(cached.expires_at) < new Date();

                if (!isExpired) {
                    console.log("[smart_chat_v1] Cache hit for hash:", qHash);
                    await supabaseAdmin.from('knowledge_audit').insert({ fact_id: cached.id, event: 'used' });
                    return new Response(JSON.stringify({ ...cached, is_cached: true }), {
                        headers: { ...corsHeaders, "Content-Type": "application/json" },
                    });
                } else {
                    console.log("[smart_chat_v1] Cache hit but expired, refreshing...");
                }
            }
        }

        console.log(`[smart_chat_v1] Calling Gemini (${modelName}). Images: ${imagesToProcess.length}`);

        // 3. Call Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: userParts }],
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

        // Log basic usage stats if available
        const usageMetadata = geminiRaw.usageMetadata || {};

        // Log Usage to DB
        if (user_id) {
            await supabaseAdmin.from('ai_usage_logs').insert({
                user_id: user_id,
                model: modelName,
                tokens_input: usageMetadata.promptTokenCount || 0,
                tokens_output: usageMetadata.candidatesTokenCount || 0,
                cost_estimated: 0, // Simplified
                domain: domain,
                action_type: hasImages ? 'vision_analysis' : 'chat'
            });
        }

        if (!content) {
            console.error("[smart_chat_v1] Gemini returned empty content");
            throw new Error("A Elara não conseguiu processar sua solicitação no momento.");
        }

        let geminiOutput;
        try {
            geminiOutput = JSON.parse(content);
        } catch (e) {
            console.error("[smart_chat_v1] Error parsing Gemini JSON output:", content);
            // Fallback for non-JSON responses (rare with response_mime_type but possible)
            geminiOutput = {
                answer_text: content,
                answer_json: { domain: domain, key_facts: [], suggested_next_actions: [] }
            };
        }

        // 4. Save to Cache (Only if text-only query)
        // We don't verify images for cache yet, so we skip caching vision results to avoid false positives on different images
        if (!hasImages && qHash) {
            let validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + (geminiOutput.ttl_days || 7));
            let expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30);

            await supabaseAdmin.from('knowledge_facts').upsert({
                domain,
                question_hash: qHash,
                question_text: question,
                question_normalized: qHash, // Storing hash in normalized if text too long
                answer_text: geminiOutput.answer_text,
                answer_json: geminiOutput.answer_json || {},
                sources: geminiOutput.sources || [],
                confidence_level: geminiOutput.confidence_level || 'medium',
                valid_until: validUntil.toISOString(),
                expires_at: expiresAt.toISOString(),
                last_verified_at: new Date().toISOString(),
                model_provider: 'gemini',
                model_name: modelName
            }, { onConflict: 'question_hash' });
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
            answer_text: `⚠️ Desculpe, algo deu errado. Tente novamente. Erro: ${e.message}`,
            answer_json: {}
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200, // Return 200 to show error in chat UI
        });
    }
});

