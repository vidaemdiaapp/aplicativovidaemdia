import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
};

interface DocumentAnalysis {
    is_deductible: boolean;
    deduction_category: string | null;
    deduction_amount: number | null;
    confidence_score: number;
    reasoning: string;
    extracted_data: {
        provider_name?: string;
        provider_cnpj?: string;
        provider_cpf?: string;
        date?: string;
        amount?: number;
        description?: string;
        patient_name?: string;
        service_type?: string;
    };
    document_type: string;
}

const ANALYSIS_PROMPT = `Você é um especialista em deduções fiscais do Imposto de Renda brasileiro.
Analise este documento fiscal e retorne APENAS um JSON válido (sem markdown) com a seguinte estrutura:

{
    "is_deductible": true/false,
    "deduction_category": "health" | "education" | "pension" | "pgbl" | "dependent" | "other" | "none",
    "deduction_amount": número ou null,
    "confidence_score": 0.0 a 1.0,
    "reasoning": "explicação breve",
    "extracted_data": {
        "provider_name": "nome do prestador",
        "provider_cnpj": "CNPJ se houver",
        "provider_cpf": "CPF se houver",
        "date": "YYYY-MM-DD ou null",
        "amount": número ou null,
        "description": "descrição curta",
        "patient_name": "nome do paciente/aluno se houver",
        "service_type": "ex: consulta, exame, mensalidade"
    },
    "document_type": "medical_receipt" | "hospital_invoice" | "health_plan" | "education_receipt" | "pension_receipt" | "pgbl_statement" | "income_statement" | "other"
}

REGRAS DE DEDUÇÃO:
- SAÚDE: Consultas, exames, hospitais, dentistas, psicólogos, fisioterapia, planos de saúde. (is_deductible: true, deduction_category: "health")
- EDUCAÇÃO: Mensalidades de escola (infantil, fundamental, médio), faculdade, pós, curso técnico. Cursos de idiomas ou extracurriculares NÃO são dedutíveis. (is_deductible: true, deduction_category: "education")
- OUTROS: Previdência PGBL, pensão alimentícia judicial.
- NÃO DEDUTÍVEL: Compras em farmácia, supermercado, eletrônicos, lazer, contas de consumo (água, luz, telefone). (is_deductible: false, deduction_category: "none")`;

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { document_id } = await req.json();
        if (!document_id) {
            throw new Error("document_id is required");
        }

        console.log(`[Analyze] Processing document: ${document_id}`);

        // Initialize Supabase client
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Fetch document info
        const { data: document, error: fetchError } = await supabase
            .from("tax_documents")
            .select("*")
            .eq("id", document_id)
            .single();

        if (fetchError || !document) {
            throw new Error(`Document not found: ${fetchError?.message}`);
        }

        console.log(`[Analyze] File path: ${document.file_path}`);

        // Download file from storage
        const { data: fileData, error: downloadError } = await supabase.storage
            .from("fiscal-documents")
            .download(document.file_path);

        if (downloadError) {
            throw new Error(`Failed to download file: ${downloadError.message}`);
        }

        console.log(`[Analyze] File downloaded, size: ${fileData.size} bytes`);

        // Convert file to base64 for Gemini
        const arrayBuffer = await fileData.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

        // Call Gemini 2.0 Flash
        const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
        if (!GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY not configured");
        }

        const model = "gemini-2.0-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: ANALYSIS_PROMPT },
                            {
                                inline_data: {
                                    mime_type: document.mime_type,
                                    data: base64
                                }
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.1,
                    topP: 0.8,
                    topK: 40,
                    maxOutputTokens: 1024,
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error: ${errorText}`);
        }

        const result = await response.json();
        const responseText = result.candidates[0].content.parts[0].text;

        console.log(`[Analyze] Gemini response received`);

        let analysis: DocumentAnalysis;
        try {
            // Remove markdown if present
            const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
            analysis = JSON.parse(cleanJson);
        } catch (parseError) {
            console.error("[Analyze] Parse error:", parseError);
            throw new Error("Failed to parse analysis result");
        }

        // Update document with analysis results
        const { error: updateError } = await supabase
            .from("tax_documents")
            .update({
                ocr_processed: true,
                ocr_provider: "gemini-2.0-flash",
                extracted_data: analysis.extracted_data,
                is_deductible: analysis.is_deductible,
                deduction_category: analysis.deduction_category,
                deduction_amount: analysis.deduction_amount,
                confidence_score: analysis.confidence_score,
                ai_reasoning: analysis.reasoning,
                document_type: analysis.document_type,
                status: "processed",
                updated_at: new Date().toISOString()
            })
            .eq("id", document_id);

        if (updateError) {
            console.error("[Analyze] Update error:", updateError);
        }

        return new Response(JSON.stringify({
            success: true,
            document_id: document_id,
            ...analysis
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error: any) {
        console.error("[Analyze] Global error:", error);

        // Update document status to error if possible
        try {
            const supabase = createClient(
                Deno.env.get("SUPABASE_URL") ?? "",
                Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
            );
            const body = await req.json().catch(() => ({}));
            if (body.document_id) {
                await supabase
                    .from("tax_documents")
                    .update({
                        status: "error",
                        error_message: error.message
                    })
                    .eq("id", body.document_id);
            }
        } catch (dbError) {
            console.error("[Analyze] Failed to update error status:", dbError);
        }

        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 200, // Return 200 to allow frontend to handle the success:false
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
