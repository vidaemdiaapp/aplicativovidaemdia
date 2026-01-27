import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, AlertCircle, Download, ExternalLink, Calendar, Calculator, Info, ShieldCheck, Package, ChevronRight } from 'lucide-react';
import { taxService } from '../services/tax';
import { incomesService } from '../services/incomes';
import { calculateIRPF2026 } from '../services/tax_calculator';
import { IRPFEstimate, IRPFReadiness } from '../types';
import { LionSummaryCard } from '../components/LionSummaryCard';
import { IRPFEstimateCard } from '../components/IRPFEstimateCard';
import { DeductionsCard } from '../components/DeductionsCard';

export const TaxDeclarationScreen: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [estimate, setEstimate] = useState<IRPFEstimate | null>(null);
    const [readiness, setReadiness] = useState<IRPFReadiness | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const currentYear = 2026; // Explicitly targeting 2026 for the new rules cycle

        const [estData, readyData, incomes] = await Promise.all([
            taxService.getIRPFEstimate(currentYear),
            taxService.getDeclarationReadiness(currentYear),
            incomesService.getIncomes()
        ]);

        // If backend doesn't have 2026 data yet, generate a live estimate based on current incomes
        if (!estData || estData.year !== currentYear) {
            const totalMonthlyIncome = incomes.reduce((sum, inc) => sum + inc.amount_monthly, 0);
            const annualIncome = totalMonthlyIncome * 12;
            const totalDeductions = estData?.total_deductions_year || 0;

            const calc = calculateIRPF2026(annualIncome, totalDeductions);

            setEstimate({
                user_id: '', // Not critical for display
                year: currentYear,
                income_monthly: totalMonthlyIncome,
                is_exempt: calc.isExemptByAnnualLimit,
                estimated_tax_monthly: calc.estimatedTaxYearly / 12,
                estimated_tax_yearly: calc.estimatedTaxYearly,
                confidence: 'medium',
                tax_rate: calc.estimatedTaxYearly / (annualIncome || 1),
                total_deductions_year: totalDeductions,
                has_deductions: totalDeductions > 0
            });
        } else {
            setEstimate(estData);
        }

        setReadiness(readyData);
        setLoading(false);
    };

    const handleExport = () => {
        if (!estimate) return;

        const summary = `
RESUMO FISCAL AUXILIAR - VIDA EM DIA
Ano-Base: ${estimate.year}
-----------------------------------------
Renda Bruta Anual: R$ ${(estimate.income_monthly * 12).toFixed(2)}
Deduções Totais: R$ ${(estimate.total_deductions_year || 0).toFixed(2)}
Imposto Estimado: R$ ${estimate.estimated_tax_yearly.toFixed(2)}
-----------------------------------------
ATENÇÃO: Este documento é apenas um guia auxiliar para facilitar
o preenchimento da sua declaração oficial. Não possui valor legal.
DIAGMÓSTICO: ${readiness?.status === 'ready' ? 'PRONTO PARA DECLARAR' : 'PENDÊNCIAS IDENTIFICADAS'}
        `;

        const blob = new Blob([summary], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `resumo_fiscal_${estimate.year}.txt`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const getStatusIcon = (status: string) => {
        if (status === 'done') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
        return <Circle className="w-5 h-5 text-slate-300" />;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-32">
            <header className="bg-white p-6 pt-12 sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-4 mb-2">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full -ml-2">
                        <ArrowLeft className="w-6 h-6 text-slate-700" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-900">Declaração {estimate?.year}</h1>
                </div>
            </header>

            <div className="p-6 space-y-8">
                {/* Readiness Status Header */}
                <div className={`p-6 rounded-[32px] border-2 flex items-center justify-between transition-all ${readiness?.status === 'ready' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'
                    }`}>
                    <div className="flex gap-4 items-center">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${readiness?.status === 'ready' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                            }`}>
                            <Calculator className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className={`font-black uppercase tracking-widest text-[10px] ${readiness?.status === 'ready' ? 'text-emerald-800' : 'text-amber-800'
                                }`}>Seu Status</h3>
                            <p className="text-lg font-black text-slate-900">
                                {readiness?.status === 'ready' ? '🟢 Pronto para declarar' : '🟡 Quase lá...'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Summary Card */}
                {estimate && (
                    <div className="space-y-6">
                        <LionSummaryCard estimate={estimate} />

                        {/* Patrimônio Quick Access (Sprint 14) */}
                        <div
                            onClick={() => navigate('/assets')}
                            className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer active:scale-[0.98] transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-primary-50 transition-colors">
                                    <Package className="w-6 h-6 text-slate-400 group-hover:text-primary-600" />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Patrimônio</h4>
                                    <p className="text-sm font-bold text-slate-900">Gerenciar Bens e Ativos</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </div>

                        <IRPFEstimateCard estimate={estimate} />
                        <DeductionsCard
                            totalDeductions={estimate.total_deductions_year || 0}
                            estimatedSaving={(estimate.total_deductions_year || 0) * 0.275}
                            onOpenPastaFiscal={() => navigate('/fiscal-folder')}
                        />
                    </div>
                )}

                {/* Memória de Cálculo (Sprint 19) */}
                <section className="bg-slate-100 rounded-3xl p-6 border border-slate-200/50">
                    <div className="flex items-center gap-2 mb-4">
                        <Info className="w-4 h-4 text-slate-500" />
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Como Calculamos? (Regras 2026)</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <span className="text-xs text-slate-600 font-medium">Isenção Anual 2026:</span>
                            <span className="text-xs font-bold text-slate-900 text-right">Até R$ 60.000,00</span>
                        </div>
                        <div className="flex justify-between items-start">
                            <span className="text-xs text-slate-600 font-medium">Redutor Gradual:</span>
                            <span className="text-xs font-bold text-slate-900 text-right">R$ 60k a R$ 88,2k</span>
                        </div>
                        <hr className="border-slate-200" />
                        <p className="text-[10px] text-slate-500 leading-relaxed italic">
                            O cálculo acima aplica o redutor gradual de 2026. Se sua renda anual for menor que R$ 60 mil, você provavelmente não terá imposto a pagar sobre o ajuste anual.
                        </p>
                        <button
                            onClick={() => navigate('/assistant', { state: { initialMessage: '🦁 Me explica a nova regra de isenção de 60 mil do IR 2026?' } })}
                            className="w-full py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                        >
                            Ver FAQ de Regras
                            <ExternalLink className="w-3 h-3 opacity-40" />
                        </button>
                    </div>
                </section>

                {/* Checklist Section */}
                <section>
                    <div className="flex justify-between items-end mb-4 ml-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Checklist de Prontidão</h3>
                        <span className="text-[10px] font-bold text-primary-600">{readiness?.completed_count} de {readiness?.total_count} Concluídos</span>
                    </div>
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        {readiness?.checklist.map((item) => (
                            <div key={item.id} className="p-5 flex items-center justify-between border-b border-slate-50 last:border-0">
                                <div className="flex items-center gap-4">
                                    {getStatusIcon(item.status)}
                                    <span className={`text-sm font-bold ${item.status === 'done' ? 'text-slate-900' : 'text-slate-400'}`}>
                                        {item.label}
                                    </span>
                                </div>
                                {item.status === 'pending' && (
                                    <button
                                        className="text-[10px] font-black uppercase text-primary-600 hover:bg-primary-50 px-3 py-2 rounded-xl transition-all"
                                        onClick={() => {
                                            if (item.id === 'income') navigate('/financial-dashboard');
                                            else if (item.id === 'assets') navigate('/assets');
                                            else if (item.id === 'deductions') navigate('/upload');
                                            else navigate('/assistant', { state: { initialMessage: `Como resolvo a pendência de ${item.label}?` } });
                                        }}
                                    >
                                        Resolver
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Export Action */}
                <div className="pt-4">
                    <button
                        onClick={handleExport}
                        className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                        <Download className="w-6 h-6" />
                        Gerar Resumo para Declaração
                    </button>

                    <div className="mt-8 p-4 bg-slate-100 rounded-2xl flex gap-3 items-start opacity-70">
                        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] leading-tight font-medium uppercase tracking-tighter text-slate-500">
                            Atenção: Este resumo é gerado com base nos dados que você forneceu no app (rendas e documentos capturados). Ele serve como guia auxiliar e não substitui o Programa da Receita Federal ou a consultoria de um contador profissional.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
