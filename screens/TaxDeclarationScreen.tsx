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
import { BudgetProgressRing } from '../components/charts/SpendingChart';

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
=========================================
      VIDA EM DIA - KIT FISCAL ${estimate.year}
=========================================
Selo de Prontidão: ${readiness?.status === 'ready' ? '100% COMPLETO' : 'PENDENTE DE REVISÃO'}
Data de Emissão: ${new Date().toLocaleString('pt-BR')}

1. RESUMO DE RENDIMENTOS
-----------------------------------------
Renda Bruta Anual: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimate.income_monthly * 12)}
Renda Média Mensal: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimate.income_monthly)}

2. DEDUÇÕES E ABATIMENTOS
-----------------------------------------
Total de Deduções: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimate.total_deductions_year || 0)}
Economia Estimada: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((estimate.total_deductions_year || 0) * 0.275)}

3. CÁLCULO PROJETADO (Regras 2026)
-----------------------------------------
Base de Cálculo: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.max((estimate.income_monthly * 12) - (estimate.total_deductions_year || 0), 0))}
Imposto Estimado: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimate.estimated_tax_yearly)}
Status: ${estimate.is_exempt ? 'ISENTO' : 'TRIBUTÁVEL'}

4. CHECKLIST DE DOCUMENTOS
-----------------------------------------
${readiness?.checklist.map((item: any) => `[${item.status === 'done' ? 'X' : ' '}] ${item.label}`).join('\n')}

-----------------------------------------
AVISO LEGAL: Este documento foi gerado pela IA da Vida em Dia 
como um guia de conferência técnica. Não substitui o Programa 
Gerador da Declaração (PGD) da Receita Federal.
=========================================
        `;

        const blob = new Blob([summary], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Kit_Fiscal_VidaEmDia_${estimate.year}.txt`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const getStatusIcon = (status: string) => {
        if (status === 'done') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
        return <Circle className="w-5 h-5 text-slate-300" />;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 pb-32 text-white">
            <header className="bg-slate-950/80 backdrop-blur-md p-6 pt-16 pb-6 sticky top-0 z-20 border-b border-slate-800/50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/financial-dashboard')}
                        className="p-2 hover:bg-slate-800 rounded-full -ml-2 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-white">Imposto de Renda</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Exercício {estimate?.year}</p>
                    </div>
                </div>
            </header>

            <div className="p-6 space-y-8">
                {/* Readiness Status Header - Premium Redesign */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-900 border border-slate-800 rounded-[32px] p-6 flex items-center justify-between shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors"></div>

                    <div className="flex gap-4 items-center relative z-10">
                        <div className="relative">
                            <BudgetProgressRing
                                spent={readiness?.completed_count || 0}
                                limit={readiness?.total_count || 5}
                                size={70}
                            />
                        </div>
                        <div>
                            <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-500">Prontidão para Declarar</h3>
                            <p className="text-lg font-black text-white">
                                {readiness?.status === 'ready' ? '🟢 100% Pronto' :
                                    readiness?.status === 'almost' ? '🟡 Quase lá...' : '🔴 Incompleto'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/assistant', { state: { initialMessage: '🦁 Elara, me ajude a completar os itens que faltam para minha declaração de IR?' } })}
                        className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all p-2 relative z-10"
                    >
                        Ajustar
                    </button>
                </div>

                {/* Summary Card */}
                {estimate && (
                    <div className="space-y-6">
                        <LionSummaryCard estimate={estimate} />

                        {/* Patrimônio Quick Access */}
                        <div
                            onClick={() => navigate('/assets')}
                            className="bg-slate-900 p-6 rounded-[32px] border border-slate-800 shadow-sm flex items-center justify-between group cursor-pointer active:scale-[0.98] transition-all hover:bg-slate-800/50"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-slate-800 p-3 rounded-2xl group-hover:bg-blue-500/10 transition-all border border-slate-700">
                                    <Package className="w-6 h-6 text-slate-500 group-hover:text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Patrimônio</h4>
                                    <p className="text-sm font-bold text-white">Bens e Direitos</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-600 group-hover:translate-x-1 transition-transform" />
                        </div>

                        <IRPFEstimateCard estimate={estimate} />
                        <DeductionsCard
                            totalDeductions={estimate.total_deductions_year || 0}
                            estimatedSaving={(estimate.total_deductions_year || 0) * 0.275}
                            onOpenPastaFiscal={() => navigate('/fiscal-folder')}
                        />
                    </div>
                )}

                {/* Memória de Cálculo - Premium Integration */}
                <section className="bg-slate-900 rounded-[32px] p-6 border border-slate-800 shadow-xl">
                    <div className="flex items-center gap-2 mb-4">
                        <Info className="w-4 h-4 text-slate-500" />
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Regras IR 2026 (Simuladas)</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <span className="text-xs text-slate-400 font-medium">Isenção: Atée R$ 60.000,00</span>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase">Novo</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                            A regra de 2026 aplica um redutor gradual. Nosso simulador já está atualizado com estas projeções para você não ter surpresas.
                        </p>
                        <button
                            onClick={() => navigate('/assistant', { state: { initialMessage: '🦁 Me explica detalhadamente a nova regra de isenção de 60 mil do IR 2026 e o redutor gradual?' } })}
                            className="w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl text-[10px] font-black uppercase text-slate-300 transition-all flex items-center justify-center gap-3"
                        >
                            Explicação Detalhada com Elara
                            <ExternalLink className="w-3 h-3 opacity-40" />
                        </button>
                    </div>
                </section>

                {/* Checklist Section - Premium */}
                <section>
                    <div className="flex justify-between items-end mb-4 ml-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Diagnostic de Prontidão</h3>
                    </div>
                    <div className="bg-slate-900 rounded-[32px] border border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-800/50">
                        {readiness?.checklist.map((item) => (
                            <div key={item.id} className="p-5 flex items-center justify-between hover:bg-slate-800/30 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${item.status === 'done' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-600'}`}>
                                        {item.status === 'done' ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-bold ${item.status === 'done' ? 'text-white' : 'text-slate-500'}`}>{item.label}</h4>
                                        <p className="text-[10px] text-slate-600 font-medium uppercase">{item.status === 'done' ? 'Completo' : 'Pendente'}</p>
                                    </div>
                                </div>
                                {item.status === 'pending' && (
                                    <button
                                        className="text-[10px] font-black uppercase text-blue-400 bg-blue-400/10 px-4 py-2 rounded-xl border border-blue-400/20 active:scale-90 transition-all"
                                        onClick={() => {
                                            if (item.id === 'income') navigate('/financial-dashboard');
                                            else if (item.id === 'assets') navigate('/assets');
                                            else if (item.id === 'deductions') navigate('/upload');
                                            else navigate('/assistant', { state: { initialMessage: `🦁 Elara, como eu posso resolver a pendência de "${item.label}" no meu Imposto de Renda?` } });
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
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-6 rounded-[32px] font-black text-lg shadow-[0_20px_50px_rgba(16,185,129,0.2)] hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center justify-center gap-3 active:scale-95 border border-white/10"
                    >
                        <Download className="w-6 h-6" />
                        Gerar Pacote para o Contador
                    </button>

                    <div className="mt-8 p-6 bg-slate-900/50 border border-slate-800 rounded-3xl flex gap-3 items-start">
                        <ShieldCheck className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] leading-relaxed font-bold uppercase tracking-wider text-slate-500">
                            Atenção Profissional: Este resumo é gerado como um guia auxiliar (Ano-Calendário 2025 / Exercício 2026). Não substitui o Programa Oficial da RFB.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
