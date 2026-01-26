import React from 'react';
import { Shield, TrendingUp, Info, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { IRPFEstimate } from '../types';

interface Props {
    estimate: IRPFEstimate | null;
    loading?: boolean;
}

export const IRPFEstimateCard: React.FC<Props> = ({ estimate, loading }) => {
    if (loading) {
        return (
            <div className="bg-slate-900 rounded-[32px] p-8 border border-white/5 animate-pulse">
                <div className="h-4 w-32 bg-white/10 rounded mb-4"></div>
                <div className="h-8 w-48 bg-white/10 rounded mb-2"></div>
                <div className="h-4 w-64 bg-white/10 rounded"></div>
            </div>
        );
    }

    if (!estimate) return null;

    const getStatusColor = () => {
        if (estimate.is_exempt) return 'text-emerald-400 bg-emerald-500/10';
        if (estimate.estimated_tax_monthly > 0 && estimate.tax_rate < 0.2) return 'text-amber-400 bg-amber-500/10';
        return 'text-rose-400 bg-rose-500/10';
    };

    const getStatusLabel = () => {
        if (estimate.is_exempt) return 'Isento de IR 🟢';
        if (estimate.estimated_tax_monthly > 0) return 'Atenção: IR Devido 🟡';
        return 'Verifique seus dados';
    };

    const getHumanMessage = () => {
        if (estimate.is_exempt) {
            return "Pelo que você informou, você está provavelmente isento de pagar imposto de renda este ano.";
        }
        return `Com base na sua renda, a estimativa é que você pague cerca de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimate.estimated_tax_monthly)} por mês.`;
    };

    return (
        <div className="bg-slate-900 shadow-2xl rounded-[32px] p-8 border border-white/10 relative overflow-hidden group">
            {/* Decorative background */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-600/10 rounded-full blur-[60px] group-hover:bg-primary-600/20 transition-all duration-700"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Shield className="w-3 h-3 text-primary-400" />
                            Imposto de Renda (Estimativa)
                        </p>
                        <h3 className={`text-sm font-bold px-3 py-1 rounded-full inline-block ${getStatusColor()}`}>
                            {getStatusLabel()}
                        </h3>
                    </div>
                    <div className="bg-white/5 p-3 rounded-2xl">
                        <TrendingUp className="w-6 h-6 text-slate-400" />
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-tight mb-1">Renda Mensal Considerada</p>
                        <p className="text-2xl font-black text-white">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimate.income_monthly)}
                        </p>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex gap-4 items-start">
                        <Info className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-300 font-medium leading-relaxed">
                            {getHumanMessage()}
                        </p>
                    </div>

                    {!estimate.is_exempt && (
                        <div className="pt-4 border-t border-white/5">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-bold text-slate-400">Estimativa Anual</span>
                                <span className="text-lg font-black text-rose-400">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimate.estimated_tax_yearly)}
                                </span>
                            </div>
                            <button
                                className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 group-active:scale-[0.98]"
                                onClick={() => alert('Sprint 12: Em breve você poderá adicionar suas despesas dedutíveis!')}
                            >
                                O que posso deduzir?
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {estimate.is_exempt && (
                        <div className="flex gap-2 items-center text-[10px] text-emerald-400/60 font-medium italic">
                            <CheckCircle2 className="w-3 h-3" />
                            Valores baseados na tabela oficial de {estimate.year}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6 flex gap-2 items-start opacity-30">
                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                <p className="text-[9px] leading-tight font-medium uppercase tracking-tighter">
                    Este painel é apenas uma simulação e não substitui a declaração oficial ou orientação de um contador.
                </p>
            </div>
        </div>
    );
};
