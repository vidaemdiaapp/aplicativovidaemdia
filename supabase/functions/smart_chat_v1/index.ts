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
Você é a Elara, assistente financeira do Vida em Dia.

REGRA DE OURO (DATA FIRST):
- JAMAIS peça informações ao usuário sem antes consultar as ferramentas de imposto (get_tax_profile) e estimativa (estimate_irpf).
- Chame as ferramentas assim que o usuário mencionar "imposto", "IR" ou "leão".
- Só peça dados se o sistema indicar falta de informações essenciais.

PERSONALIDADE:
- Brasileira, clara e direta. Sem tom robótico.
- SEMPRE chame o usuário pelo nome {{USER_NAME}} de forma natural e amigável, especialmente no início ou final da resposta.
- Módulo Fiscal: Use sempre dados do sistema e informe a confiança da estimativa. PROIBIDO USAR PLACEHOLDERS como '[valor da faixa]'. Se o dado não existir, diga que não sabe.

FORMATO DE RESPOSTA OBRIGATÓRIO (JSON):
Sua resposta final DEVE ser um objeto JSON puro, sem markdown extra, contendo:
{
  "answer_text": "Texto da sua resposta aqui",
  "intent_mode": "CHAT",
  "key_facts": [],
  "sources": []
}
`;

const TOOLS_SCHEMA = [
    {
        name: "get_financial_summary",
        description: "Returns a summary of the user's financial status from the app panel: current balance, total income, and total pending expenses. Use this for questions about 'saldo', 'quanto tenho', 'minha conta' (NOT external bank).",
        parameters: { type: "object", properties: {}, required: [] }
    },
    {
        name: "list_bills_due",
        description: "Lists unpaid bills (tasks with amount > 0) that are due within a specific range or overdue. Use for 'contas vencendo', 'contas atrasadas', 'próximos vencimentos'.",
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
        description: "Projects the financial balance for future months based on recurring income and expenses. Use for 'vai sobrar', 'projeção', 'fim do mês'.",
        parameters: {
            type: "object",
            properties: {
                months: { type: "number", description: "Number of months to project (default 3)" }
            },
            required: ["months"]
        }
    },
    {
        name: "get_tax_profile",
        description: "Retrieves the user's current tax profile from the database (incomes, deductions, retained tax). ALWAYS call this before `estimate_irpf`.",
        parameters: {
            type: "object",
            properties: {
                year: { type: "number", description: "Tax year (e.g., 2025, 2026)" }
            },
            required: ["year"]
        }
    },
    {
        name: "estimate_irpf",
        description: "Calculates the estimated Income Tax (IRPF) based on current database values. Returns tax range, rate, and confidence.",
        parameters: {
            type: "object",
            properties: {
                year: { type: "number", description: "Tax year to estimate" }
            },
            required: ["year"]
        }
    },
    {
        name: "list_missing_tax_items",
        description: "Identifies top missing information that would significantly impact tax calculation (e.g., missing dependents, medical expenses).",
        parameters: {
            type: "object",
            properties: {
                year: { type: "number", description: "Tax year" }
            },
            required: ["year"]
        }
    },
    {
        name: "list_transactions",
        description: "Lists the user's expenses/transactions grouped by category. Use for 'meus gastos', 'onde gasto mais', 'despesas do mês'.",
        parameters: {
            type: "object",
            properties: {
                range: { type: "string", enum: ["week", "month", "quarter", "year"], description: "Time range for transactions" }
            },
            required: ["range"]
        }
    },
    {
        name: "vision_extract_fine",
        description: "Extracts traffic fine data from an attached image. Use when user sends an image of a traffic fine/infraction notice.",
        parameters: {
            type: "object",
            properties: {},
            required: []
        }
    },
    {
        name: "create_fine_record",
        description: "Saves an extracted traffic fine as a task in the app. Use after vision_extract_fine successfully extracts data.",
        parameters: {
            type: "object",
            properties: {
                plate: { type: "string", description: "Vehicle plate" },
                date: { type: "string", description: "Infraction date (YYYY-MM-DD)" },
                amount: { type: "number", description: "Fine amount" },
                nature: { type: "string", enum: ["leve", "media", "grave", "gravissima"], description: "Infraction severity" },
                description: { type: "string", description: "Infraction description" },
                discount_deadline: { type: "string", description: "Discount deadline (YYYY-MM-DD)" }
            },
            required: ["plate", "date", "amount", "nature"]
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
async function handleToolCall(toolName: string, args: any, supabase: any, household_id: string, user_id: string) {
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

    if (toolName === "get_tax_profile" || toolName === "estimate_irpf") {
        const year = args.year || new Date().getFullYear();
        // Use RPC get_irpf_estimate for both to get a complete view
        const { data, error } = await supabase.rpc('get_irpf_estimate', {
            target_user_id: user_id,
            target_year: year
        });

        if (error) throw new Error(`Error estimating IRPF: ${error.message}`);
        return data;
    }

    if (toolName === "list_missing_tax_items") {
        const year = args.year || new Date().getFullYear();
        const { data, error } = await supabase.rpc('get_declaration_readiness', {
            target_user_id: user_id,
            target_year: year
        });

        if (error) throw new Error(`Error checking tax readiness: ${error.message}`);

        // Extract top 2 pending items
        const pendingItems = data.checklist
            .filter((item: any) => item.status === 'pending')
            .map((item: any) => ({ item: item.label, impact: "ALTO" }))
            .slice(0, 2);

        return pendingItems.length > 0 ? pendingItems : "Perfil de imposto está completo.";
    }

    // --- NEW TOOL: list_transactions ---
    if (toolName === "list_transactions") {
        const range = args.range || 'month';
        const today = new Date();
        let startDate: string;

        switch (range) {
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                startDate = weekAgo.toISOString().split('T')[0];
                break;
            case 'quarter':
                const quarterAgo = new Date(today);
                quarterAgo.setMonth(quarterAgo.getMonth() - 3);
                startDate = quarterAgo.toISOString().split('T')[0];
                break;
            case 'year':
                startDate = `${today.getFullYear()}-01-01`;
                break;
            case 'month':
            default:
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                startDate = monthAgo.toISOString().split('T')[0];
        }

        const endDate = today.toISOString().split('T')[0];

        // Try RPC first, fallback to direct query
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_transactions_by_category', {
            target_household_id: household_id,
            start_date: startDate,
            end_date: endDate,
            tx_type: 'expense'
        });

        if (!rpcError && rpcData) {
            return {
                ...rpcData,
                range: range,
                tip: rpcData.categories && rpcData.categories.length > 0
                    ? `Sua maior categoria de gastos é ${rpcData.categories[0].category}. Considere revisar esses gastos.`
                    : 'Sem gastos registrados neste período.'
            };
        }

        // Fallback: Use completed tasks with amount as transactions
        const { data: tasks } = await supabase
            .from('tasks')
            .select('category_id, amount')
            .eq('household_id', household_id)
            .eq('status', 'completed')
            .gt('amount', 0)
            .gte('due_date', startDate)
            .lte('due_date', endDate);

        if (!tasks || tasks.length === 0) {
            return {
                categories: [],
                total: 0,
                range: range,
                tip: 'Sem gastos registrados neste período. Que ótimo controle! 🎉'
            };
        }

        // Aggregate by category
        const categoryTotals: Record<string, { total: number; count: number }> = {};
        let total = 0;

        for (const task of tasks) {
            const cat = task.category_id || 'outros';
            if (!categoryTotals[cat]) categoryTotals[cat] = { total: 0, count: 0 };
            categoryTotals[cat].total += task.amount || 0;
            categoryTotals[cat].count += 1;
            total += task.amount || 0;
        }

        const categories = Object.entries(categoryTotals)
            .map(([category, data]) => ({ category, ...data }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);

        return {
            categories,
            total,
            range,
            tip: categories.length > 0
                ? `Sua maior categoria de gastos é "${categories[0].category}" com R$ ${categories[0].total.toFixed(2)}. Avalie se há espaço para economizar.`
                : 'Sem gastos registrados.'
        };
    }

    // --- NEW TOOL: create_fine_record ---
    if (toolName === "create_fine_record") {
        const { plate, date, amount, nature, description, discount_deadline } = args;

        const { data, error } = await supabase.from('tasks').insert({
            title: `Multa: ${plate} - ${nature.toUpperCase()}`,
            category_id: 'vehicle',
            due_date: discount_deadline || date,
            amount: amount,
            description: description || `Infração ${nature.toUpperCase()} registrada em ${date}`,
            status: 'pending',
            health_status: 'risk',
            impact_level: 'high',
            household_id: household_id
        }).select().single();

        if (error) throw new Error(`Error saving fine: ${error.message}`);

        return {
            success: true,
            message: `Multa de R$ ${amount.toFixed(2)} salva com sucesso!`,
            task_id: data?.id,
            due_date: discount_deadline || date
        };
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

// --- HELPER: INTENT CLASSIFICATION (EXPANDED) ---
type AppIntent = 'SALDO' | 'CONTAS' | 'GASTOS' | 'PROJECAO' | 'IRPF' | 'MULTA' | 'INVESTMENTS' | 'tax_rule' | 'tax_deadline' | 'interest_rate' | 'government_program' | 'general';

function classifyIntentByKeywords(text: string): AppIntent {
    const t = text.toLowerCase();

    // APP-SPECIFIC INTENTS (Higher Priority)
    // SALDO: Perguntas sobre saldo/conta do APP (não banco externo)
    if (t.match(/saldo|quanto tenho|minha conta(?!s? do banco| corrente| bancária)|conta do app|balanço|sobrou quanto|tenho quanto/))
        return 'SALDO';

    // CONTAS: Contas a pagar/vencer
    if (t.match(/contas?(?! do banco| bancária| corrente)|vencendo|vencer|pagar hoje|atrasad|próximos? vencimento|compromisso/))
        return 'CONTAS';

    // GASTOS: Despesas e transações
    if (t.match(/gast|onde gasto|gastei|despesas?|quanto paguei|top gastos|maiores gastos|minhas despesas/))
        return 'GASTOS';

    // PROJECAO: Projeção financeira
    if (t.match(/sobrar|projeção|vai sobrar|fim do mês|próximos meses|previsão|falta quanto|vai dar/))
        return 'PROJECAO';

    // IRPF: Imposto de Renda
    if (t.match(/irpf|imposto|leão|declarac|tribut|ir 202|restituição|pagar de ir|minha faixa|faixa do ir/))
        return 'IRPF';

    // MULTA: Multas de trânsito (especialmente com imagem)
    if (t.match(/multa|infração|auto de infração|notificação de multa/))
        return 'MULTA';

    // INVESTMENTS: Patrimônio e investimentos
    if (t.match(/investimento|patrimônio|ações|bolsa|tesouro|bitcoin|cripto|ouro|fii|porfólio|carteira|open finance/))
        return 'INVESTMENTS';

    // WEB SEARCH INTENTS (Lower Priority - External Data)
    if (t.match(/juros|selic|poupanca|cdi|taxa|rendimento/)) return 'interest_rate';
    if (t.match(/vencimento do ipva|prazo|calendario|ipva|licenciamento|quando vence o/)) return 'tax_deadline';
    if (t.match(/bolsa familia|beneficio|auxilio|fgts|inss/)) return 'government_program';
    if (t.match(/tabela progressiva|alíquota|regra do ir|como funciona o ir/)) return 'tax_rule';

    return 'general';
}

// Check if intent requires internal data lookup FIRST (before LLM generates response)
function requiresInternalData(intent: AppIntent): boolean {
    return ['SALDO', 'CONTAS', 'GASTOS', 'PROJECAO', 'IRPF', 'INVESTMENTS'].includes(intent);
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

        // --- MANUAL AUTH VERIFICATION (Because we disabled --verify-jwt) ---
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error("Authorization header missing");
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Unauthorized", message: "Invalid Token" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 401,
            });
        }

        console.log(`[smart_chat_v1] User authenticated: ${user.id}`);

        let body;
        try { body = await req.json(); } catch { throw new Error("Corpo inválido."); }

        // Use authenticated user_id as fallback or override? 
        // For security, strict matching is better, but for flexibility with "household_id" context we accept body vars.
        // We ensure 'user_id' defaults to the authenticated user if missing.
        const { domain = 'general', image, images, household_id, history } = body;
        const user_id = user.id; // Enforce authenticated user

        const question = body.question || body.message || body.text || body.input || "";

        if (!question && !image && (!images || images.length === 0)) throw new Error("Envie uma mensagem ou imagem.");

        // --- FETCH USER PROFILE FOR PERSONALIZATION ---
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('full_name')
            .eq('id', user_id)
            .single();

        const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'usuário';

        // --- GEMINI PROMPT SETUP ---
        const userParts = [];
        let finalPrompt = SYSTEM_PROMPT_LOCKED.replace('{{USER_NAME}}', firstName) + "\n\n";
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

        // --- ROUTER & DATA INJECTION (EXPANDED) ---
        // Block LLM from generic answers - force data-driven responses for app intents

        let routerContext = "";
        const targetId = household_id || user_id;
        const year = new Date().getFullYear();
        let debugInfo: any = { intent: detectedIntent, tools_called: [], data_sources: [] };

        // =====================================================
        // ROUTER: SALDO - "quanto tenho", "minha conta", etc
        // =====================================================
        if (detectedIntent === 'SALDO') {
            console.log(`[smart_chat_v1] ROUTER: Intent is 'SALDO'. Fetching financial summary...`);
            debugInfo.tools_called.push('get_financial_summary');
            debugInfo.data_sources.push('internal_db');

            const { data: report } = await supabaseAdmin.rpc('get_full_financial_report', { target_household_id: targetId });

            if (report && report.total_income > 0) {
                routerContext = `
[CONTEXTO OBRIGATÓRIO - SALDO DO APP VIDA EM DIA]:
Os dados do usuário JÁ FORAM consultados do painel. NÃO peça dados. NÃO confunda com banco externo.

DADOS DO PAINEL:
- Renda Total: R$ ${report.total_income?.toFixed(2) || '0.00'}
- Compromissos: R$ ${report.total_commitments?.toFixed(2) || '0.00'}
- Saldo Disponível: R$ ${report.balance?.toFixed(2) || '0.00'} ${report.status === 'surplus' ? '🟢' : report.status === 'warning' ? '🟡' : '🔴'}
- Status: ${report.status === 'surplus' ? 'Positivo' : report.status === 'warning' ? 'Atenção' : 'Déficit'}

Apresente de forma clara e amigável. Sugira próxima ação baseada no status.
`;
            } else {
                routerContext = `
[CONTEXTO - PAINEL VAZIO]:
Consultei o painel e não há renda cadastrada ainda.
Informe que o usuário pode cadastrar sua renda na seção Financeiro.
NÃO mencione banco externo.
`;
            }
        }

        // =====================================================
        // ROUTER: CONTAS - "contas vencendo", "atrasadas", etc
        // =====================================================
        else if (detectedIntent === 'CONTAS') {
            console.log(`[smart_chat_v1] ROUTER: Intent is 'CONTAS'. Fetching bills...`);
            debugInfo.tools_called.push('list_bills_due');
            debugInfo.data_sources.push('internal_db');

            const today = new Date().toISOString().split('T')[0];
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            const nextWeekStr = nextWeek.toISOString().split('T')[0];

            // Get overdue
            const { data: overdue } = await supabaseAdmin
                .from('tasks')
                .select('title, amount, due_date')
                .eq('household_id', targetId)
                .neq('status', 'completed')
                .gt('amount', 0)
                .lt('due_date', today)
                .order('due_date', { ascending: true })
                .limit(5);

            // Get next 7 days
            const { data: upcoming } = await supabaseAdmin
                .from('tasks')
                .select('title, amount, due_date')
                .eq('household_id', targetId)
                .neq('status', 'completed')
                .gt('amount', 0)
                .gte('due_date', today)
                .lte('due_date', nextWeekStr)
                .order('due_date', { ascending: true })
                .limit(5);

            const overdueList = overdue && overdue.length > 0
                ? overdue.map((b: any) => `• ${b.title}: R$ ${b.amount?.toFixed(2)} (${b.due_date})`).join('\n')
                : 'Nenhuma conta atrasada 🎉';

            const upcomingList = upcoming && upcoming.length > 0
                ? upcoming.map((b: any) => `• ${b.title}: R$ ${b.amount?.toFixed(2)} (${b.due_date})`).join('\n')
                : 'Nenhuma conta nos próximos 7 dias';

            routerContext = `
[CONTEXTO OBRIGATÓRIO - CONTAS DO APP]:
Os dados JÁ FORAM consultados. NÃO peça dados.

⚠️ ATRASADAS (${overdue?.length || 0}):
${overdueList}

📅 PRÓXIMOS 7 DIAS (${upcoming?.length || 0}):
${upcomingList}

Apresente de forma clara. Se houver atrasadas, destaque com urgência.
`;
        }

        // =====================================================
        // ROUTER: GASTOS - "onde gasto mais", "meus gastos", etc
        // =====================================================
        else if (detectedIntent === 'GASTOS') {
            console.log(`[smart_chat_v1] ROUTER: Intent is 'GASTOS'. Fetching transactions...`);
            debugInfo.tools_called.push('list_transactions');
            debugInfo.data_sources.push('internal_db');

            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            const startDate = monthAgo.toISOString().split('T')[0];
            const endDate = new Date().toISOString().split('T')[0];

            // Try RPC first
            const { data: txData } = await supabaseAdmin.rpc('get_transactions_by_category', {
                target_household_id: targetId,
                start_date: startDate,
                end_date: endDate,
                tx_type: 'expense'
            });

            let gastosList = '';
            let totalGastos = 0;

            if (txData && txData.categories && txData.categories.length > 0) {
                gastosList = txData.categories.slice(0, 3).map((c: any, idx: number) =>
                    `${idx + 1}. ${c.category}: R$ ${c.total?.toFixed(2)} (${c.count}x)`
                ).join('\n');
                totalGastos = txData.total || 0;
            } else {
                // Fallback to completed tasks
                const { data: tasks } = await supabaseAdmin
                    .from('tasks')
                    .select('category_id, amount')
                    .eq('household_id', targetId)
                    .eq('status', 'completed')
                    .gt('amount', 0)
                    .gte('due_date', startDate);

                if (tasks && tasks.length > 0) {
                    const catTotals: Record<string, { total: number; count: number }> = {};
                    for (const t of tasks) {
                        const cat = t.category_id || 'outros';
                        if (!catTotals[cat]) catTotals[cat] = { total: 0, count: 0 };
                        catTotals[cat].total += t.amount || 0;
                        catTotals[cat].count += 1;
                        totalGastos += t.amount || 0;
                    }
                    const sorted = Object.entries(catTotals).sort((a, b) => b[1].total - a[1].total).slice(0, 3);
                    gastosList = sorted.map(([cat, data], idx) =>
                        `${idx + 1}. ${cat}: R$ ${data.total.toFixed(2)} (${data.count}x)`
                    ).join('\n');
                } else {
                    gastosList = 'Sem gastos registrados neste período';
                }
            }

            routerContext = `
[CONTEXTO OBRIGATÓRIO - GASTOS DO ÚLTIMO MÊS]:
Os dados JÁ FORAM consultados. NÃO peça dados.

📈 TOP CATEGORIAS:
${gastosList}

💰 Total: R$ ${totalGastos.toFixed(2)}

Apresente de forma clara. Dê uma dica de economia baseada na maior categoria.
`;
        }

        // =====================================================
        // ROUTER: PROJECAO - "vai sobrar", "fim do mês", etc
        // =====================================================
        else if (detectedIntent === 'PROJECAO') {
            console.log(`[smart_chat_v1] ROUTER: Intent is 'PROJECAO'. Simulating cashflow...`);
            debugInfo.tools_called.push('simulate_cashflow');
            debugInfo.data_sources.push('internal_db');

            const { data: report } = await supabaseAdmin.rpc('get_full_financial_report', { target_household_id: targetId });

            if (report) {
                const projections = [];
                let balance = report.balance || 0;
                for (let i = 1; i <= 3; i++) {
                    balance += report.balance || 0; // Simplified: assumes same surplus/deficit each month
                    projections.push({ month: i, balance: balance.toFixed(2) });
                }

                routerContext = `
[CONTEXTO OBRIGATÓRIO - PROJEÇÃO FINANCEIRA]:
Os dados JÁ FORAM consultados. NÃO peça dados.

📊 SITUAÇÃO ATUAL:
- Renda: R$ ${report.total_income?.toFixed(2) || '0.00'}
- Compromissos: R$ ${report.total_commitments?.toFixed(2) || '0.00'}
- Saldo Mensal: R$ ${report.balance?.toFixed(2) || '0.00'}

🔮 PROJEÇÃO (próximos 3 meses):
${projections.map(p => `• Mês ${p.month}: R$ ${p.balance}`).join('\n')}

Status: ${report.balance > 0 ? '🟢 Vai sobrar!' : report.balance === 0 ? '🟡 Empata' : '🔴 Atenção: déficit projetado'}

Apresente de forma clara e otimista se positivo, ou com orientação se negativo.
`;
            } else {
                routerContext = `
[CONTEXTO - DADOS INSUFICIENTES]:
Não há dados suficientes para projeção. Peça ao usuário cadastrar renda e compromissos.
`;
            }
        }

        // =====================================================
        // ROUTER: INVESTMENTS - "meus investimentos", "patrimônio", etc
        // =====================================================
        else if (detectedIntent === 'INVESTMENTS') {
            console.log(`[smart_chat_v1] ROUTER: Intent is 'INVESTMENTS'. Fetching portfolio summary...`);
            debugInfo.tools_called.push('get_portfolio_summary');
            debugInfo.data_sources.push('internal_db');

            const { data: summary } = await supabaseAdmin.rpc('get_portfolio_summary', { target_user_id: user_id });

            if (summary && summary.total_value > 0) {
                routerContext = `
[CONTEXTO OBRIGATÓRIO - SEU PATRIMÔNIO]:
Os dados foram consultados. 
- Total Consolidado: R$ ${summary.total_value.toFixed(2)}
- Rendimento Total: R$ ${summary.total_yield.toFixed(2)} (${summary.yield_percentage.toFixed(2)}%)
- Ativos cadastrados: ${summary.count}

COMPOSIÇÃO:
${summary.allocations?.map((a: any) => `• ${a.type}: ${a.percentage.toFixed(1)}%`).join('\n')}

DICA ELITE:
Lembre o usuário que ele pode sincronizar tudo automaticamente via **Simulação de Open Finance** na tela de Investimentos para manter esses números sempre precisos.
`;
            } else {
                routerContext = `
[CONTEXTO - SEM INVESTIMENTOS]:
Consultei sua carteira e ela ainda está vazia. 
Ação Sugerida: "Para ver seu patrimônio aqui, você pode cadastrar ativos manualmente ou usar nossa **Simulação de Open Finance** na tela de Investimentos para conectar suas contas fictícias e ver a mágica acontecer!"
`;
            }
        }

        // =====================================================
        // ROUTER: IRPF - Imposto de Renda
        // =====================================================
        else if (detectedIntent === 'IRPF') {
            console.log(`[smart_chat_v1] ROUTER: Intent is 'IRPF'. Executing Data-First Strategy with RPCs...`);
            debugInfo.tools_called.push('get_tax_profile', 'estimate_irpf');

            const { data: estimate, error: estError } = await supabaseAdmin.rpc('get_irpf_estimate', {
                target_user_id: user_id,
                target_year: year
            });
            const { data: readiness } = await supabaseAdmin.rpc('get_declaration_readiness', {
                target_user_id: user_id,
                target_year: year
            });

            if (estimate && !estError) {
                routerContext = `
[CONTEXTO OBRIGATÓRIO - IMPOSTO DE RENDA ${year}]:
Os dados do sistema foram consultados via RPC.
- Renda Mensal: R$ ${estimate.income_monthly.toFixed(2)}
- Deduções Anuais: R$ ${estimate.total_deductions_year.toFixed(2)}
- Imposto Mensal Estimado: R$ ${estimate.estimated_tax_monthly.toFixed(2)}
- Alíquota: ${estimate.tax_rate * 100}%
- Confiança: ${estimate.confidence.toUpperCase()}
- Status: ${estimate.is_exempt ? '🟢 ISENTO' : '🔴 A PAGAR'}
- Observação: Se não houver dados de renda cadastrada, o sistema mostrará zero. Relate o que vê.

[CHECKLIST DE COMPLETUDE]:
${readiness?.checklist?.map((c: any) => `- ${c.label}: ${c.status === 'done' ? '✅' : '❌'}`).join('\n')}

IMPORTANTE: 
1. Use os valores ACIMA (Ex: R$ ${estimate.income_monthly.toFixed(2)}) na sua resposta. 
2. JAMAIS use colchetes como '[valor]'. Se o valor for 0, diga que é zero.
3. Seja direto sobre o status (Isento/Pagar).
4. Se a confiança for baixa/média, recomende completar os itens com ❌.
5. Se for a primeira vez que você vê os dados, comemore os números ou ofereça ajuda para reduzir o imposto.
`;
            } else {
                routerContext = `
[CONTEXTO - ERRO OU SEM DADOS]:
Não foi possível obter uma estimativa automática. 
Incentive o usuário a lançar seus rendimentos e despesas no módulo de Imposto de Renda.
`;
            }
        }

        // =====================================================
        // ROUTER: MULTA - (handled by vision tool if image present)
        // =====================================================
        else if (detectedIntent === 'MULTA' && (image || images)) {
            console.log(`[smart_chat_v1] ROUTER: Intent is 'MULTA' with image. Will use vision tool.`);
            // Let Gemini handle with vision_extract_fine tool
            routerContext = cachedContext;
        }

        // =====================================================
        // ROUTER: General / Web Search needed
        // =====================================================
        else {
            routerContext = cachedContext;
        }


        userParts.push({ text: finalPrompt + routerContext });

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
                const result = await handleToolCall(fn.name, fn.args, supabaseAdmin, household_id, user_id);
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
            const cand = secondData.candidates?.[0];
            const textPart = cand?.content?.parts?.find((p: any) => p.text);
            finalContent = textPart ? textPart.text : (cand?.finishReason ? `[Erro: ${cand.finishReason}]` : "Não consegui processar os dados das ferramentas.");

        } else {
            // No tools used, standard text response
            const textPart = candidate?.content?.parts?.find((p: any) => p.text);
            finalContent = textPart ? textPart.text : (candidate?.finishReason ? `[Erro: ${candidate.finishReason}]` : "Não entendi sua mensagem ou o modelo não retornou texto.");
        }

        // --- CLEAN UP RESPONSE ---
        if (!finalContent || finalContent === "Não entendi.") {
            console.warn("[smart_chat_v1] Empty or default response detected. Retrying with simple prompt...");
            // One last fallback to ensure we don't send a blank message
            finalContent = "Desculpe, " + firstName + ", tive um pequeno problema técnico ao processar sua resposta. Pode repetir por favor?";
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

