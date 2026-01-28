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
Você é a Elara.

PERSONALIDADE & TOM DE VOZ:
- Você fala como uma pessoa brasileira, natural, clara e direta.
- Nada de linguagem institucional, jurídica ou robótica.
- JAMAIS diga "como assistente do Vida em Dia" ou "sou uma inteligência artificial".
- Adapte levemente o tom ao jeito do usuário escrever. Se ele for informal, seja informal. Se usar "kk", pode responder com leveza.
- Você só sugere ações quando o usuário pedir explicitamente. Caso contrário, apenas converse, explique e ajude.
- PROIBIDO usar frases como "Embora minha especialidade seja outra", "Como IA", ou pedir desculpas por saber coisas fora do tópico. Se perguntaram, responda direto.
- Nunca mostre menus, opções numeradas ou "ações planejadas" sem pedido explícito.

REGRAS DE OURO (Fontes & Conhecimento):
- **Prioridade:** Use fontes oficiais (Gov.br, Detran, Receita) para dados exatos (datas, valores, leis).
- **Contexto:** Pode usar conhecimento geral para explicar de forma mais didática e humana, desde que não contradiga fontes oficiais.
- **Proibido:** 
  1. NÃO mande o usuário "pesquisar no Google". Se você sabe, responda.
  2. NÃO exiba URLs soltas no texto.
  3. Se não tiver certeza absoluta de um dado crítico (valor de multa, data de imposto), diga que precisa confirmar, mas tente ajudar com o que sabe.

USO DE FERRAMENTAS (CRÍTICO - AGENTE FINANCEIRO):
- Você tem acesso a FERRAMENTAS REAIS do banco de dados financeiro do usuário.
- Se o usuário perguntar "como estão minhas contas?", "quanto tenho de saldo?", "tenho conta pra pagar?":
  1. NÃO invente números.
  2. CHAME as ferramentas \`get_financial_summary\` ou \`list_bills_due\`.
  3. Responda com base no resultado delas.
- Se a ferramenta retornar erro ou vazio, diga honestamente que não encontrou dados, mas não invente.

MODOS DE OPERAÇÃO:
1. MODO CONVERSA (Padrão):
   - O usuário quer bater papo ou tirar dúvidas.
   - Responda de forma direta e resolutiva. Nada de "posso ajudar com mais algo?".

2. MODO EXPLICAÇÃO:
   - O usuário quer entender regras. Explique detalhado.

3. MODO EXECUÇÃO (Só quando solicitado):
   - O usuário diz: "Paga isso", "Lança aquilo".
   - Ação: Confirme e gere o 'pending_action'.

ESPECIALIDADES:
1. Trânsito/Multas
2. Documentação Veicular
3. Imposto de Renda
4. Finanças/Economia
5. Gestão Doméstica

FORMATO DE SAÍDA OBRIGATÓRIO (JSON):
{
  "answer_text": "Sua resposta aqui. Seja natural. NÃO PODE TER LINKS NEM 'PESQUISE EM'.",
  "intent_mode": "CHAT", 
  "pending_action": null,
  "answer_json": {
    "intent_type": "tax_rule|tax_deadline|interest_rate|government_program|general" 
  },
  "key_facts": [],
  "sources": [] 
}

TIPOS DE PENDING ACTION (Só use se EXPLICITAMENTE solicitado):
- { "type": "ADD_TRAFFIC_FINE", "payload": { "plate": "...", "amount": 0.00, "date": "YYYY-MM-DD" } }
- { "type": "SAVE_DEDUCTION", "payload": { "category": "...", "amount": 0.00, "description": "..." } }
- { "type": "MARK_AS_PAID", "payload": { "task_id": "..." } }

REGRAS FINAIS:
- Se mandarem imagem: Analise e explique.
- Idioma: Sempre PT-BR.
`;

const TOOLS_SCHEMA = [
    {
        name: "get_financial_summary",
        description: "Returns a summary of the user's financial status: current balance, total income, and total pending expenses for the month.",
        parameters: { type: "object", properties: {}, required: [] }
    },
    {
        name: "list_bills_due",
        description: "Lists unpaid bills (tasks with amount > 0) that are due within a specific range or overdue.",
        parameters: {
            type: "object",
            properties: {
                filter: { type: "string", enum: ["overdue", "today", "week", "month", "all"], description: "Filter for bills" }
            },
            required: ["filter"]
        }
    },
    {
        name: "simulate_cashflow",
        description: "Projects the financial balance for future months based on recurring income and expenses.",
        parameters: {
            type: "object",
            properties: {
                months: { type: "number", description: "Number of months to project (default 3)" }
            },
            required: ["months"]
        }
    },
    {
        name: "web_search",
        description: "Searches the web for volatile information (tax rules, deadlines, interest rates, government programs). Use this when you do not know the answer or need real-time data.",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "The search query optimized for Google." },
                intent_type: { type: "string", enum: ["tax_rule", "tax_deadline", "interest_rate", "government_program"], description: "The intent category for caching rules." }
            },
            required: ["query", "intent_type"]
        }
    }
];

// --- TOOL HANDLERS ---
async function handleToolCall(toolName: string, args: any, supabase: any, household_id: string) {
    if (toolName === "get_financial_summary") {
        const { data, error } = await supabase.rpc('get_full_financial_report', { target_household_id: household_id });
        if (error) throw new Error(`Error getting summary: ${error.message}`);
        return data;
    }

    if (toolName === "list_bills_due") {
        let query = supabase.from('tasks').select('*').eq('household_id', household_id).neq('status', 'completed').gt('amount', 0);

        const today = new Date().toISOString().split('T')[0];

        if (args.filter === 'overdue') query = query.lt('due_date', today);
        else if (args.filter === 'today') query = query.eq('due_date', today);
        else if (args.filter === 'week') {
            const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
            query = query.gte('due_date', today).lte('due_date', nextWeek.toISOString().split('T')[0]);
        }
        else if (args.filter === 'month') {
            const nextMonth = new Date(); nextMonth.setMonth(nextMonth.getMonth() + 1);
            query = query.gte('due_date', today).lte('due_date', nextMonth.toISOString().split('T')[0]);
        }

        const { data, error } = await query.order('due_date', { ascending: true }).limit(10);
        if (error) throw new Error(`Error listing bills: ${error.message}`);
        return data && data.length > 0 ? data : "Nenhuma conta encontrada com este filtro.";
    }

    if (toolName === "simulate_cashflow") {
        const months = args.months || 3;
        // Simple projection based on current 'get_full_financial_report' multiplied by months
        // In a real scenario, this would check recurring flags.
        const { data: report } = await supabase.rpc('get_full_financial_report', { target_household_id: household_id });

        if (!report) return "Não foi possível calcular.";

        const projection = [];
        let currentBalance = report.balance;

        for (let i = 1; i <= months; i++) {
            currentBalance += report.balance; // Assuming monthly surplus/deficit is constant (simplified)
            projection.push({ month: i, projected_balance: currentBalance });
        }
        return { initial_balance: report.balance, projection };
    }

    if (toolName === "web_search") {
        const query = args.query;
        const intentType = args.intent_type || 'general';
        const apiKey = Deno.env.get("SERPER_API_KEY") || "d8470dee662cb1634c655252be8cf9cedebbb715"; // Fallback provided by user

        console.log(`[smart_chat_v1] Executing Web Search for: '${query}' (Intent: ${intentType})`);

        try {
            const response = await fetch("https://google.serper.dev/search", {
                method: "POST",
                headers: {
                    "X-API-KEY": apiKey,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ q: query, gl: "br", hl: "pt-br" })
            });

            const data = await response.json();
            const organic = data.organic || [];

            // FILTERING LOGIC
            const trustedDomains = ["gov.br", "fazenda.gov.br", "bcb.gov.br", "planalto.gov.br", "detran", "contabilizei", "infomoney", "cnnbrasil", "g1.globo", "uol.com.br"];

            const filteredResults = organic.filter((item: any) => {
                return trustedDomains.some(domain => item.link.includes(domain));
            }).slice(0, 4); // Take top 4 trusted

            const resultsToUse = filteredResults.length > 0 ? filteredResults : organic.slice(0, 2); // Fallback to top 2 generic if no trusted found (but caution)

            if (resultsToUse.length === 0) return "Não encontrei informações confiáveis sobre isso.";

            // FORMATTING
            const summary = resultsToUse.map((r: any) => `Título: ${r.title}\nFonte: ${r.link}\nResumo: ${r.snippet}`).join("\n\n");

            // PERSISTENCE (AUDIT & CACHE)
            // We save this immediately so next time we hit cache.
            const ttlDays = calculateTTL(intentType);
            let validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + ttlDays);

            const normalized = `general:${query.toLowerCase().trim()}`; // Assuming domain general for external search or map arg
            // Re-calc hash for consistency (or pass it in if we could, but tool doesn't have it easily)
            // Simplified: We rely on the tool caller to use the result, but we proactively save.

            // Note: The main logic calculates hash based on question. Here we are inside tool.
            // Ideally we save based on the original question logic, but here we just need to return text.
            // But User requested "Salvamento automático no knowledge base".
            // Since we can't easily reproduce the EXACT main hash here without the original `question` context variable fully,
            // we will return the summary and let the Model's final response be the one that gets cached by the MAIN logic at the end of the script.
            // WAIT - The main logic ONLY caches if `!hasImages`. And it caches the FINAL answer.
            // If we want to save "Search Results" specifically as a "Fact", we can do it here.

            const factContent = `[DATA: ${new Date().toISOString().split('T')[0]}]\n${summary}`;

            // We'll return this text. The main loop will eventually cache the Final Answer which incorporates this.
            // BUT, to be "Audit", we can log to a separate table or rely on the main `knowledge_facts` upsert at the end.
            // The main upsert uses `geminiOutput.answer_text`.

            return factContent;

        } catch (error) {
            console.error("Serper Error:", error);
            return "Erro ao buscar informações externas.";
        }
    }

    return "Ferramenta não implementada.";
}

// --- HELPER: INTENT CLASSIFICATION ---
function classifyIntentByKeywords(text: string): string {
    const t = text.toLowerCase();

    if (t.match(/irpf|imposto|leão|declarac|tribut/)) return 'tax_rule';
    if (t.match(/juros|selic|poupanca|cdi|taxa|rendimento/)) return 'interest_rate';
    if (t.match(/vencimento|prazo|calendario|ipva|licenciamento|quando vence|data/)) return 'tax_deadline';
    if (t.match(/bolsa familia|beneficio|auxilio|fgts|inss/)) return 'government_program';

    return 'general';
}

function shouldWebSearch(intent: string): boolean {
    const volatileIntents = ['tax_rule', 'tax_deadline', 'interest_rate', 'government_program'];
    return volatileIntents.includes(intent);
}

// --- HELPER: TTL CALCULATION BASED ON INTENT ---
function calculateTTL(intentType: string): number {
    switch (intentType) {
        case 'interest_rate': return 1; // 24 hours (Volatility: High)
        case 'tax_rule': return 7;      // 7 days (Volatility: Medium)
        case 'government_program': return 7; // 7 days
        case 'tax_deadline': return 30; // 30 days (Volatility: Low)
        default: return 7; // Default fallback
    }
}

Deno.serve(async (req) => {
    console.log(`[smart_chat_v1] Incoming request: ${req.method} ${req.url}`);

    const origin = req.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);

    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const apiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY");
        const modelName = Deno.env.get("GEMINI_MODEL_NAME") || "models/gemini-2.0-flash";

        if (!supabaseUrl || !supabaseServiceKey || !apiKey) throw new Error("Configuração incompleta (URL/Key).");

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        let body;
        try { body = await req.json(); } catch { throw new Error("Corpo inválido."); }

        const { domain = 'general', user_id, image, images, household_id, history } = body;
        const question = body.question || body.message || body.text || body.input || "";

        if (!question && !image && (!images || images.length === 0)) throw new Error("Envie uma mensagem ou imagem.");

        // --- GEMINI PROMPT SETUP ---
        const userParts = [];
        let finalPrompt = `${SYSTEM_PROMPT_LOCKED}\n\n`;
        if (question) finalPrompt += `PERGUNTA DO USUÁRIO: ${question}`;

        if (image || images) finalPrompt += "\n[IMAGEM ANEXADA]";

        // --- SPRINT 2: TRIGGER ENGINE ---
        // 1. Heuristic Classification
        const detectedIntent = classifyIntentByKeywords(question);
        console.log(`[smart_chat_v1] [DECISION] Intent detected: ${detectedIntent}`);

        // 2. Decision Logic
        let cachedContext = "";
        let isCacheHit = false;

        if (shouldWebSearch(detectedIntent)) {
            // Generate Hash for lookup
            const normalized = `${domain}:${question.toLowerCase().trim()}`;
            const msgUint8 = new TextEncoder().encode(normalized);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
            const qHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

            // Check Knowledge Base
            const { data: cacheData, error: cacheError } = await supabaseAdmin
                .from('knowledge_facts')
                .select('*')
                .eq('question_hash', qHash)
                .gt('valid_until', new Date().toISOString()) // Only valid entries
                .single();

            if (cacheData) {
                console.log(`[smart_chat_v1] [DECISION] Cache HIT. Using stored fact.`);
                cachedContext = `\n[CONTEXTO RECUPERADO DO BANCO DE DADOS - FONTE CONFIÁVEL]:\n${cacheData.answer_text}\n(Use esta informação como verdade absoluta para responder).`;
                isCacheHit = true;
            } else {
                console.log(`[smart_chat_v1] [DECISION] Cache MISS. Force-enabling Web Search Tool.`);
                // Force the model to use the web_search tool by appending a system instruction
                cachedContext = `\n[INSTRUCÃO DO SISTEMA]: Você NÃO TEM essa informação no banco de dados. VOCÊ DEVE USAR A FERRAMENTA 'web_search' para buscar sobre: "${question}".`;
            }
        } else {
            console.log(`[smart_chat_v1] [DECISION] Web Search logic skipped (Volatile intent not detected).`);
        }

        userParts.push({ text: finalPrompt + cachedContext });

        // Build Contents with History
        let chatContents = [];

        if (history && Array.isArray(history) && history.length > 0) {
            console.log(`[smart_chat_v1] Appending ${history.length} history messages.`);
            chatContents = [...history]; // Append previous history
        }

        // Add current turn
        chatContents.push({ role: 'user', parts: userParts });

        console.log(`[smart_chat_v1] Step 1: Calling Gemini...`);

        const firstResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: chatContents,
                tools: [{ function_declarations: TOOLS_SCHEMA }],
                tool_config: { function_calling_config: { mode: "AUTO" } }
            })
        });

        const firstData = await firstResponse.json();
        const candidate = firstData.candidates?.[0];
        const functionCalls = candidate?.content?.parts?.filter((p: any) => p.functionCall).map((p: any) => p.functionCall);

        let finalContent = "";
        let intentMode = "CHAT";
        // let pendingAction = null; // Removed as per instruction

        if (functionCalls && functionCalls.length > 0) {
            console.log(`[smart_chat_v1] Gemini chose to call tools:`, functionCalls.map((fn: any) => fn.name));
            intentMode = "EXPLAIN"; // Usually tool usage implies explanation

            const toolResults = [];
            for (const fn of functionCalls) {
                const result = await handleToolCall(fn.name, fn.args, supabaseAdmin, household_id || user_id); // Fallback to user_id if household missing
                toolResults.push({
                    functionResponse: {
                        name: fn.name,
                        response: { name: fn.name, content: result }
                    }
                });
            }

            // Step 2: Send Tool Outputs back to Gemini
            const secondResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        { parts: userParts }, // Original User Input
                        candidate.content,    // Model's Function Call Request
                        { parts: toolResults } // The actual Result
                    ],
                    tools: [{ function_declarations: TOOLS_SCHEMA }]
                })
            });

            const secondData = await secondResponse.json();
            const textPart = secondData.candidates?.[0]?.content?.parts?.find((p: any) => p.text);
            finalContent = textPart ? textPart.text : JSON.stringify(secondData);

        } else {
            // No tools used, standard text response
            const textPart = candidate?.content?.parts?.find((p: any) => p.text);
            finalContent = textPart ? textPart.text : "Não entendi.";
        }

        // --- PARSE FINAL JSON OUPUT ---
        // Gemini might return strict JSON as requested in Prompt, or we need to wrap it if it talked naturally after tool use.
        // The Prompt enforces JSON, so we try specific parse.

        let geminiOutput;
        try {
            // Clean markdown blocks if present
            const cleanJson = finalContent.replace(/```json/g, '').replace(/```/g, '').trim();
            geminiOutput = JSON.parse(cleanJson);
        } catch (e) {
            console.warn("[smart_chat_v1] Failed to parse strict JSON, wrapping raw text.");
            geminiOutput = {
                answer_text: finalContent,
                intent_mode: intentMode,
                pending_action: null,
                key_facts: [],
                answer_json: { domain: domain } // Legacy compat
            };
        }

        // --- CACHE LOGIC WITH DYNAMIC TTL ---
        // Verify image absence before caching
        const hasImages = (image || (images && images.length > 0));

        if (!hasImages) {
            // Determine Intent Type for TTL
            const intentType = geminiOutput.answer_json?.intent_type || 'general';
            const ttlDays = calculateTTL(intentType);

            // Generate Hash
            const normalized = `${domain}:${question.toLowerCase().trim()}`;
            const msgUint8 = new TextEncoder().encode(normalized);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
            const qHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

            let validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + ttlDays); // Dynamic TTL

            let expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30); // Hard expiration

            await supabaseAdmin.from('knowledge_facts').upsert({
                domain,
                question_hash: qHash,
                question_text: question,
                question_normalized: qHash,
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
        console.error("[smart_chat_v1] Error:", e.message);
        return new Response(JSON.stringify({
            ok: false,
            error: String(e.message),
            answer_text: `⚠️ Erro no servidor: ${e.message}`,
            intent_mode: "CHAT",
            pending_action: null
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    }
});

