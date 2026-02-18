import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const allowedOrigins = new Set([
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://localhost:5174",
]);

function getCorsHeaders(origin: string | null) {
    const o = origin && allowedOrigins.has(origin) ? origin : "*";
    return {
        "Access-Control-Allow-Origin": o,
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
    };
}

const TRAFFIC_RULES = {
    "leve": { points: 3, base_value: 88.38 },
    "media": { points: 4, base_value: 130.16 },
    "grave": { points: 5, base_value: 195.23 },
    "gravissima": { points: 7, base_value: 293.47 }
};

const SYSTEM_PROMPT = `
Você é um especialista em Processamento de Multas de Trânsito no Brasil (DETRAN, CET, PRF, DER, etc).
Sua tarefa é extrair TODOS os dados de uma notificação de autuação ou multa de trânsito (Auto de Infração).

## CAMPOS OBRIGATÓRIOS A EXTRAIR:

### IDENTIFICAÇÃO DO VEÍCULO:
- plate: Placa do veículo (formato AAA-0000 ou Mercosul AAA0A00)
- vehicle_brand: Marca do veículo (se visível)
- vehicle_model: Modelo do veículo (se visível)
- vehicle_color: Cor do veículo (se visível)
- renavam: Número RENAVAM (se visível)

### DATA E LOCAL DA INFRAÇÃO:
- date: Data da infração no formato ISO (YYYY-MM-DD). CRÍTICO!
- time: Hora da infração (HH:MM)
- location: Endereço COMPLETO onde ocorreu a infração (rua, número, bairro, cidade, UF)

### DETALHES DA INFRAÇÃO:
- infraction_code: Código da infração (ex: "518-4", "501-0", "745-1")
- description: Descrição COMPLETA da infração conforme CTB (Código de Trânsito Brasileiro)
- legal_article: Artigo do CTB que foi infringido (ex: "Art. 218, II")
- nature: Natureza da infração: "leve", "media", "grave" ou "gravissima"
- points: Pontos na CNH (3, 4, 5 ou 7)
- amount: Valor da multa em reais (apenas número, sem R$)

### ÓRGÃO AUTUADOR:
- issuer: Nome do órgão autuador (DETRAN-SP, PRF, CET, DER, etc)
- auto_number: Número do Auto de Infração
- notification_number: Número da notificação (se diferente)

### PRAZOS E DEFESA:
- notification_date: Data em que a notificação foi emitida
- defense_deadline: Prazo limite para apresentar defesa (se informado)
- payment_deadline: Prazo limite para pagamento (se informado)
- payment_discount_deadline: Prazo para pagamento com desconto (se informado)

### CONDUTOR (se identificado):
- driver_name: Nome do condutor (se informado)
- driver_cnh: Número da CNH do condutor (se informado)

### ANÁLISE PARA DEFESA:
- possible_defenses: Lista de possíveis argumentos de defesa baseados na infração
- formal_inconsistencies: Lista de possíveis inconsistências formais que podem anular a multa

## RESUMO AMIGÁVEL:
- summary_human: Explicação clara e amigável do que aconteceu, incluindo:
  * O que o motorista fez de errado
  * Onde e quando aconteceu
  * Consequências (pontos e valor)
  * Se vale a pena pagar ou defender

## CONFIANÇA:
- confidence: Nível de confiança na extração (0.0 a 1.0)

## REGRAS:
1) Responda APENAS em JSON puro e válido
2) Se um campo não for visível/legível, use null
3) A DATA DA INFRAÇÃO é o campo mais crítico - procure com atenção
4) Diferencie data da INFRAÇÃO da data de EMISSÃO da notificação
5) No summary_human, seja didático e empático com o motorista

FORMATO DE SAÍDA (JSON):
{
  "plate": "ABC1D23",
  "vehicle_brand": "Volkswagen",
  "vehicle_model": "Gol",
  "date": "2024-01-26",
  "time": "10:30",
  "location": "Av. Paulista, 1000 - Bela Vista - São Paulo/SP",
  "infraction_code": "518-4",
  "description": "Transitar em velocidade superior à máxima permitida em até 20%",
  "legal_article": "Art. 218, I do CTB",
  "nature": "media",
  "points": 4,
  "amount": 130.16,
  "issuer": "CET - Companhia de Engenharia de Tráfego",
  "auto_number": "A123456789",
  "defense_deadline": "2024-03-26",
  "possible_defenses": ["Erro na identificação do veículo", "Sinalização inadequada"],
  "formal_inconsistencies": ["Verificar se houve notificação dentro de 30 dias"],
  "summary_human": "Você foi multado por excesso de velocidade (até 20% acima do limite) na Av. Paulista às 10:30 do dia 26/01/2024. Esta é uma infração MÉDIA, com 4 pontos e valor de R$ 130,16. Como é uma infração média sem risco grave, geralmente vale mais a pena pagar com desconto (20% até o vencimento ou 40% via SNE) do que recorrer.",
  "confidence": 0.92
}
`;

Deno.serve(async (req) => {
    const origin = req.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);

    console.log(`[analyze_traffic_notice_v1] Request received from: ${origin}`);

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        console.log("[analyze_traffic_notice_v1] Starting request processing...");

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const apiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY");
        const modelName = Deno.env.get("GEMINI_MODEL_NAME") || "models/gemini-2.0-flash";

        console.log(`[analyze_traffic_notice_v1] Config: URL=${supabaseUrl?.substring(0, 30)}..., Key=${supabaseKey ? 'SET' : 'MISSING'}, ApiKey=${apiKey ? 'SET' : 'MISSING'}`);

        if (!apiKey) throw new Error("GEMINI_API_KEY missing");

        const body = await req.json();
        console.log("[analyze_traffic_notice_v1] Body received:", JSON.stringify(body));

        const { document_id, storage_path, household_id } = body;

        if (!storage_path) throw new Error("No storage path provided");

        console.log(`[analyze_traffic_notice_v1] Processing: storage_path=${storage_path}`);

        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Get Public URL for the file (or download it if using multi-modal)
        // For simplicity with gemini-2.0-flash, we might need the actual data or a public URL if configured.
        // Here we'll download the file bytes to send to Gemini.
        const { data: fileData, error: downloadError } = await supabase.storage
            .from('documents')
            .download(storage_path);

        if (downloadError || !fileData) {
            throw new Error(`Error downloading file: ${downloadError?.message}`);
        }

        const arrayBuffer = await fileData.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < uint8.byteLength; i++) {
            binary += String.fromCharCode(uint8[i]);
        }
        const base64 = btoa(binary);

        const isPdf = storage_path.toLowerCase().endsWith('.pdf');
        const isJpeg = storage_path.toLowerCase().endsWith('.jpg') || storage_path.toLowerCase().endsWith('.jpeg');
        const isPng = storage_path.toLowerCase().endsWith('.png');
        const isWebp = storage_path.toLowerCase().endsWith('.webp');

        let mimeType = 'image/jpeg'; // Default
        if (isPdf) mimeType = 'application/pdf';
        else if (isPng) mimeType = 'image/png';
        else if (isWebp) mimeType = 'image/webp';
        else if (isJpeg) mimeType = 'image/jpeg';

        console.log(`[analyze_traffic_notice_v1] Processing file: ${storage_path}, mimeType: ${mimeType}`);

        // 2. Call Gemini
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: SYSTEM_PROMPT },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: base64
                            }
                        },
                        { text: "Extraia TODOS os dados deste documento de multa, especialmente a DATA e a NATUREZA da infração." }
                    ]
                }],
                generationConfig: { response_mime_type: "application/json" }
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Gemini API Error: ${JSON.stringify(err)}`);
        }

        const result = await response.json();
        const content = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!content) throw new Error("Empty response from AI");

        const extraction = JSON.parse(content);

        // 3. Post-processing lookup & recommendation logic
        const natureText = (extraction.nature || "").toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");

        let foundNature = "";
        for (const key of Object.keys(TRAFFIC_RULES)) {
            if (natureText.includes(key)) {
                foundNature = key;
                break;
            }
        }

        const rule = foundNature ? TRAFFIC_RULES[foundNature as keyof typeof TRAFFIC_RULES] : null;

        if (rule) {
            extraction.nature = foundNature; // Normalize to standard key
            extraction.points = rule.points;
            // extraction.amount = rule.base_value; // REMOVED: Trust the OCR/LLM extracted amount
        }

        // Sprint 22 Decision Logic
        const isSerious = extraction.nature === 'grave' || extraction.nature === 'gravissima';
        if (isSerious) {
            extraction.recommendation = "analyze_defense";
            extraction.recommendation_text = "Esta é uma infração séria. Recomendamos analisar se há inconsistências para uma possível defesa antes de pagar.";
        } else {
            extraction.recommendation = "pay";
            extraction.recommendation_text = "Esta infração é leve/média. Geralmente vale mais a pena pagar com o desconto de 20% ou 40% (via SNE) do que recorrer.";
        }

        extraction.sne_discount_40 = extraction.amount ? (extraction.amount * 0.6).toFixed(2) : null;
        extraction.sne_discount_20 = extraction.amount ? (extraction.amount * 0.8).toFixed(2) : null;

        // Checklist de inconsistências formais (Sprint 22)
        extraction.formal_checklist = [
            { id: 'plate', label: 'Placa condiz com o veículo?', status: 'pending' },
            { id: 'location', label: 'O local da infração existe e é preciso?', status: 'pending' },
            { id: 'deadline', label: 'A notificação chegou em menos de 30 dias?', status: 'pending' },
            { id: 'formatting', label: 'Há erros de preenchimento visíveis?', status: 'pending' }
        ];

        return new Response(JSON.stringify(extraction), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (e) {
        console.error(e);
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
