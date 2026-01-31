import React from 'react';
import { ShieldCheck, TrendingUp, Info, AlertTriangle, CheckCircle2, ArrowRight, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { IRPFEstimate } from '../types';

interface Props {
    estimate: IRPFEstimate;
    loading?: boolean;
    selectedYear: number;
}

export const TaxSummaryCard: React.FC<Props> = ({ estimate, loading, selectedYear }) => {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 animate-pulse shadow-sm">
                <div className="h-4 w-32 bg-slate-100 rounded mb-4"></div>
                <div className="h-8 w-48 bg-slate-100 rounded mb-2"></div>
                <div className="h-4 w-64 bg-slate-100 rounded"></div>
            </div>
        );
    }

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const annualIncome = estimate.income_monthly * 12;
    const baseCalculo = Math.max(annualIncome - (estimate.total_deductions_year || 0), 0);
    const effectiveRate = annualIncome > 0 ? (estimate.estimated_tax_yearly / annualIncome) * 100 : 0;

    const getStatusColor = () => {
        if (estimate.is_exempt) return 'bg-emerald-50 text-emerald-600 border-emerald-200';
        return 'bg-amber-50 text-amber-600 border-amber-200';
    };

    const getStatusLabel = () => {
        if (estimate.is_exempt) return 'ISENTO 🟢';
        return 'IR DEVIDO 🟡';
    };

    return (
        <div className="bg-white border border-slate-100 rounded-[32px] p-8 text-slate-900 relative overflow-hidden shadow-sm">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2 font-mono">Resumo Fiscal</p>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Exercício {selectedYear}</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${getStatusColor()}`}>
                            {getStatusLabel()}
                        </span>
                        <div className="bg-primary-500 text-white p-3 rounded-2xl shadow-lg shadow-primary-500/20">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* Renda Section */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="space-y-1">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Renda Mensal</p>
                        <p className="text-xl font-bold text-slate-800 tracking-tight">{formatCurrency(estimate.income_monthly)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Renda Anual</p>
                        <p className="text-xl font-bold text-slate-800 tracking-tight">{formatCurrency(annualIncome)}</p>
                    </div>
                </div>

                {/* Deduções e Base de Cálculo */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="space-y-1">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Deduções Totais</p>
                        <p className="text-xl font-bold text-emerald-600 tracking-tight">
                            {(estimate.total_deductions_year || 0) > 0 ? `- ${formatCurrency(estimate.total_deductions_year || 0)}` : 'R$ 0,00'}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Base de Cálculo</p>
                        <p className="text-xl font-bold text-slate-800 tracking-tight">{formatCurrency(baseCalculo)}</p>
                    </div>
                </div>

                {/* Separador */}
                <div className="border-t border-slate-100 my-6"></div>

                {/* Imposto Section */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="bg-slate-50 rounded-2xl p-4 space-y-1 border border-slate-100">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">IR Mensal</p>
                        <p className={`text-2xl font-bold tracking-tight ${estimate.is_exempt ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {estimate.is_exempt ? 'Isento' : formatCurrency(estimate.estimated_tax_monthly)}
                        </p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 space-y-1 border border-slate-100">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">IR Anual</p>
                        <p className={`text-2xl font-bold tracking-tight ${estimate.is_exempt ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {estimate.is_exempt ? 'Isento' : formatCurrency(estimate.estimated_tax_yearly)}
                        </p>
                    </div>
                </div>

                {/* Alíquota Efetiva */}
                {!estimate.is_exempt && (
                    <div className="flex items-center justify-between bg-slate-800 text-white rounded-2xl p-4 mb-6">
                        <span className="text-xs font-bold uppercase tracking-widest text-white/70">Alíquota Efetiva</span>
                        <span className="text-xl font-bold">{effectiveRate.toFixed(2)}%</span>
                    </div>
                )}

                {/* Status Message */}
                {estimate.is_exempt ? (
                    <div className="flex gap-3 items-center py-4 px-5 bg-emerald-50 rounded-2xl border border-emerald-100 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <span className="text-[11px] text-emerald-600 font-bold uppercase tracking-widest">
                            Isenção garantida pelas regras de {selectedYear}
                        </span>
                    </div>
                ) : (
                    <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex gap-4 items-start mb-6">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                            <Info className="w-5 h-5 text-primary-500" />
                        </div>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">
                            Com base na sua renda de {formatCurrency(estimate.income_monthly)}/mês, você pagará aproximadamente {formatCurrency(estimate.estimated_tax_monthly)} de IR por mês.
                        </p>
                    </div>
                )}

                {/* CTA Button */}
                <button
                    onClick={() => navigate('/assistant', { state: { initialMessage: `🦁 Elara, como eu posso reduzir legalmente meu imposto de renda ${selectedYear} através de deduções?` } })}
                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg active:scale-[0.98]"
                >
                    Estratégias de Economia
                    <ArrowRight className="w-4 h-4 text-primary-400" />
                </button>

                {/* Disclaimer */}
                <div className="mt-6 pt-4 border-t border-slate-50 flex gap-3 items-start opacity-60">
                    <AlertTriangle className="w-3.5 h-3.5 text-slate-300 mt-0.5 shrink-0" />
                    <p className="text-[9px] leading-relaxed font-bold uppercase tracking-widest text-slate-300">
                        Projeções baseadas nas regras de {selectedYear}. Não substitui o programa oficial da Receita Federal.
                    </p>
                </div>
            </div>
        </div>
    );
};
