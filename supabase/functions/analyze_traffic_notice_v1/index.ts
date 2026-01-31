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
Sua tarefa é extrair dados de uma notificação de autuação ou multa de trânsito.

REGRAS:
1) IDIOMA: Sempre em Português (PT-BR).
2) EXTRAÇÃO: Identifique Placa, Data, Hora, Local, Natureza (Leve, Média, Grave, Gravíssima), Órgão Autuador e Código da Infração.
3) RESUMO: Crie um resumo humanizado explicando o que aconteceu e as consequências.
4) FORMATO: Responda APENAS em JSON.

FORMATO DE SAÍDA:
{
  "plate": "ABC1234",
  "date": "2024-01-26",
  "time": "10:30",
  "location": "Av. Paulista, 1000",
  "nature": "grave",
  "points": 5,
  "amount": 195.23,
  "issuer": "CET/SP",
  "infraction_code": "501-0",
  "description": "Excesso de velocidade...",
  "summary_human": "Você recebeu uma multa por...",
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
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

        const isPdf = storage_path.toLowerCase().endsWith('.pdf');
        const mimeType = isPdf ? 'application/pdf' : 'image/jpeg';

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
                        { text: "Analise este documento de trânsito." }
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
        const natureKey = extraction.nature?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        const rule = TRAFFIC_RULES[natureKey as keyof typeof TRAFFIC_RULES];

        if (rule) {
            extraction.points = rule.points;
            extraction.amount = rule.base_value;
        }

        // Sprint 22 Decision Logic
        const isSerious = natureKey === 'grave' || natureKey === 'gravissima';
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
