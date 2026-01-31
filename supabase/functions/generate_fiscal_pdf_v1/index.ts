import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { year, estimate, readiness, deductionsSummary, capitalGains, userName } = await req.json();

        if (!year || !estimate) {
            throw new Error("Year and estimate data are required");
        }

        // Initialize jsPDF
        // Note: jspdf in Deno might have limitations with fonts, but standard ones work.
        const doc = new jsPDF();
        const primaryColor = "#0EA5E9"; // primary-500
        const darkColor = "#0F172A";    // slate-900
        const grayColor = "#64748B";    // slate-500

        // 1. Header with Branding
        doc.setFillColor(primaryColor);
        doc.rect(0, 0, 210, 40, "F");

        doc.setTextColor("#FFFFFF");
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("VIDA EM DIA - KIT FISCAL", 20, 25);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`ANO-CALENDÁRIO ${year} | EXERCÍCIO ${year + 1}`, 20, 32);

        // 2. User Info
        doc.setTextColor(darkColor);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`DECLARANTE: ${userName || "Usuário Vida em Dia"}`, 20, 55);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(grayColor);
        doc.text(`Data de Emissão: ${new Date().toLocaleString("pt-BR")}`, 20, 62);

        // Divider
        doc.setDrawColor("#E2E8F0");
        doc.line(20, 68, 190, 68);

        // 3. Status Summary
        doc.setTextColor(darkColor);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("1. RESUMO DA SITUAÇÃO", 20, 80);

        const statusLabel = readiness?.status === 'ready' ? '100% COMPLETO' : 'PENDENTE DE REVISÃO';
        const statusColor = readiness?.status === 'ready' ? "#10B981" : "#F59E0B";

        doc.setTextColor(statusColor);
        doc.setFontSize(11);
        doc.text(`Selo de Prontidão: ${statusLabel}`, 20, 88);

        // Income & Tax Summary
        doc.setTextColor(darkColor);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Rendimentos Brutos:", 20, 100);
        doc.setFont("helvetica", "normal");
        doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimate.income_monthly * 12), 140, 100);

        doc.setFont("helvetica", "bold");
        doc.text("Deduções Identificadas:", 20, 108);
        doc.setFont("helvetica", "normal");
        doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimate.total_deductions_year || 0), 140, 108);

        doc.setFont("helvetica", "bold");
        doc.text("Imposto Estimado (Anual):", 20, 116);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(estimate.is_exempt ? "#10B981" : "#EF4444");
        doc.text(estimate.is_exempt ? "ISENTO" : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimate.estimated_tax_yearly), 140, 116);

        // 4. Detailed Calculations Section
        doc.setTextColor(darkColor);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("2. DETALHAMENTO TRIBUTÁRIO", 20, 132);

        doc.setFontSize(10);
        doc.setTextColor(grayColor);
        doc.text(`Regras aplicadas: Tabela IRPF ${year}`, 20, 138);

        // Box for calculations
        const boxHeight = (capitalGains && capitalGains.estimatedTax > 0) ? 55 : 45;
        doc.setFillColor("#F8FAFC");
        doc.roundedRect(20, 142, 170, boxHeight, 3, 3, "F");

        doc.setTextColor(darkColor);
        doc.setFontSize(11);
        doc.text("Base de Cálculo Líquida:", 30, 152);
        doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.max((estimate.income_monthly * 12) - (estimate.total_deductions_year || 0), 0)), 140, 152);

        doc.text("Alíquota Efetiva:", 30, 162);
        doc.text(`${(estimate.tax_rate * 100).toFixed(2)}%`, 140, 162);

        if (capitalGains && capitalGains.estimatedTax > 0) {
            doc.text("Imposto s/ Ganho de Capital:", 30, 172);
            doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(capitalGains.estimatedTax), 140, 172);

            doc.text("Economia via Deduções:", 30, 187);
            doc.setTextColor("#10B981");
            doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((estimate.total_deductions_year || 0) * 0.275), 140, 187);
        } else {
            doc.text("Economia via Deduções:", 30, 172);
            doc.setTextColor("#10B981");
            doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((estimate.total_deductions_year || 0) * 0.275), 140, 172);
        }

        // 5. Assets & Capital Gains Details
        doc.setTextColor(darkColor);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("3. BENS E GANHOS DE CAPITAL", 20, 205);

        let yPos = 215;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(grayColor);

        if (capitalGains && capitalGains.totalProfit > 0) {
            // Bens Móveis
            if (capitalGains.moveis.items.length > 0) {
                doc.setTextColor(darkColor);
                doc.setFont("helvetica", "bold");
                doc.text("Bens Móveis (Veículos e Outros)", 20, yPos);
                yPos += 7;

                doc.setFontSize(9);
                doc.setTextColor(grayColor);
                doc.text("Item / Descrição", 25, yPos);
                doc.text("Lucro", 130, yPos);
                doc.text("Imposto (15%)", 160, yPos);
                yPos += 2;
                doc.line(20, yPos, 190, yPos);
                yPos += 6;

                doc.setFont("helvetica", "normal");
                doc.setTextColor(darkColor);
                capitalGains.moveis.items.forEach((item: any) => {
                    doc.text(item.name, 25, yPos);
                    doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.profit), 130, yPos);
                    doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.tax), 160, yPos);
                    yPos += 6;
                });
                yPos += 5;
            }

            // Bens Imóveis
            if (capitalGains.imoveis.items.length > 0) {
                doc.setTextColor(darkColor);
                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.text("Bens Imóveis", 20, yPos);
                yPos += 7;

                doc.setFontSize(9);
                doc.setTextColor(grayColor);
                doc.text("Item / Descrição", 25, yPos);
                doc.text("Lucro", 130, yPos);
                doc.text("Imposto (15%)", 160, yPos);
                yPos += 2;
                doc.line(20, yPos, 190, yPos);
                yPos += 6;

                doc.setFont("helvetica", "normal");
                doc.setTextColor(darkColor);
                capitalGains.imoveis.items.forEach((item: any) => {
                    doc.text(item.name, 25, yPos);
                    doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.profit), 130, yPos);
                    doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.tax), 160, yPos);
                    yPos += 6;
                });
                yPos += 5;
            }
        } else {
            doc.text("Nenhum ganho de capital tributável identificado.", 20, yPos);
            yPos += 10;
        }

        yPos += 5; // Extra spacing

        // 6. Checklist of Documents
        doc.setTextColor(darkColor);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("4. PASTA FISCAL (ANEXOS)", 20, yPos);
        yPos += 6;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(grayColor);
        doc.text(`Total de documentos processados: ${deductionsSummary?.count || 0}`, 20, yPos);
        yPos += 8;
        if (readiness?.checklist) {
            readiness.checklist.forEach((item: any) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.setTextColor(item.status === 'done' ? "#10B981" : "#CBD5E1");
                doc.text(item.status === 'done' ? "[X]" : "[ ]", 25, yPos);
                doc.setTextColor(darkColor);
                doc.text(item.label, 35, yPos);
                yPos += 8;
            });
        }

        // Footer
        const pages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pages; i++) {
            doc.setPage(i);
            doc.setTextColor(grayColor);
            doc.setFontSize(8);
            doc.text("Este documento é um guia auxiliar gerado por Inteligência Artificial. Não substitui o PGD da Receita Federal.", 105, 285, { align: "center" });
            doc.text(`Página ${i} de ${pages}`, 190, 285, { align: "right" });
        }

        // Get the PDF as base64
        const pdfBase64 = doc.output("datauristring").split(",")[1];

        return new Response(JSON.stringify({
            success: true,
            pdf_base64: pdfBase64,
            file_name: `Kit_Fiscal_VidaEmDia_${year}.pdf`
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error: any) {
        console.error("[GeneratePDF] Error:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
