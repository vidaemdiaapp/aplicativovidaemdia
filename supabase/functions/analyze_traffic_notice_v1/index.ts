import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

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

const TRAFFIC_RULES = {
    "leve": { points: 3, base_value: 88.38 },
    "media": { points: 4, base_value: 130.16 },
    "grave": { points: 5, base_value: 195.23 },
    "gravissima": { points: 7, base_value: 293.47 }
};

const SYSTEM_PROMPT = `
Você é um especialista em Processamento de Multas de Trânsito no Brasil.
Sua tarefa é extrair dados de uma notificação de autuação ou multa de trânsito (Auto de Infração).

REGRAS CRÍTICAS:
1) IDIOMA: Responda em Português (PT-BR).
2) DATA DA INFRAÇÃO: Procure pela data que ocorreu o fato. Converta para o formato ISO (YYYY-MM-DD). Ex: "26/01/2024" vira "2024-01-26".
3) NATUREZA: Identifique se é "leve", "media", "grave" ou "gravissima". Isso é essencial.
4) VALOR (AMOUNT): Se houver um valor em reais (R$), extraia. Se não houver, deixe nulo (o sistema calculará pela natureza).
5) CÓDIGO/DESCRIÇÃO: Extraia o código da infração (ex: 501-0) e uma breve descrição do que ocorreu.
6) FORMATO: Responda APENAS em JSON puro, sem campos vazios se possível.

FORMATO DE SAÍDA:
{
  "plate": "ABC1234",
  "date": "2024-01-26",
  "time": "10:30",
  "location": "Endereço completo",
  "nature": "grave",
  "issuer": "CET, PRF, DETRAN...",
  "infraction_code": "501-0",
  "description": "Excesso de velocidade em até 20%",
  "summary_human": "Breve explicação amigável do que houve.",
  "confidence": 0.95
}
`;

Deno.serve(async (req) => {
    const origin = req.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const apiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY");
        const modelName = Deno.env.get("GEMINI_MODEL_NAME") || "models/gemini-2.0-flash";

        if (!apiKey) throw new Error("GEMINI_API_KEY missing");

        const { document_id, storage_path, household_id } = await req.json();

        if (!storage_path) throw new Error("No storage path provided");

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
        const mimeType = isPdf ? 'application/pdf' : 'image/*';

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
            extraction.amount = rule.base_value;
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
