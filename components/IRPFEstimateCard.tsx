import React from 'react';
import { Shield, TrendingUp, Info, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { IRPFEstimate } from '../types';

interface Props {
    estimate: IRPFEstimate | null;
    loading?: boolean;
}

export const IRPFEstimateCard: React.FC<Props> = ({ estimate, loading }) => {
    const navigate = useNavigate();
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
        <div className="bg-slate-900 shadow-2xl rounded-[32px] p-8 border border-slate-800 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <Shield className="w-3 h-3 text-emerald-500" />
                            Análise Projetada
                        </p>
                        <h3 className={`text-xs font-black px-4 py-1.5 rounded-xl inline-block uppercase tracking-widest ${getStatusColor()}`}>
                            {getStatusLabel()}
                        </h3>
                    </div>
                    <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
                        <TrendingUp className="w-6 h-6 text-slate-400" />
                    </div>
                </div>

                <div className="space-y-8">
                    <div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Renda Mensal Detectada</p>
                        <p className="text-3xl font-black text-white">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimate.income_monthly)}
                        </p>
                    </div>

                    <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-800 flex gap-4 items-start backdrop-blur-sm">
                        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <div className="space-y-2">
                            <p className="text-sm text-slate-300 font-medium leading-relaxed">
                                {getHumanMessage()}
                            </p>
                            <div className="flex items-center gap-3">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${estimate.confidence === 'high' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                    {estimate.confidence === 'high' ? 'Confiança Alta' : 'Média Confiança'}
                                </span>
                                <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Base 2026</span>
                            </div>
                        </div>
                    </div>

                    {!estimate.is_exempt && (
                        <div className="pt-6 border-t border-slate-800">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Estimativa Anual</span>
                                <span className="text-2xl font-black text-rose-400">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimate.estimated_tax_yearly)}
                                </span>
                            </div>
                            <button
                                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 border border-slate-700 active:scale-95"
                                onClick={() => navigate('/assistant', { state: { initialMessage: '🦁 Elara, me mostre dicas de como reduzir meu IR através de previdência privada ou dependentes.' } })}
                            >
                                Estratégias de Economia
                                <ArrowRight className="w-4 h-4 text-blue-400" />
                            </button>
                        </div>
                    )}

                    {estimate.is_exempt && (
                        <div className="flex gap-2 items-center text-[10px] text-emerald-500/60 font-black uppercase tracking-widest">
                            <CheckCircle2 className="w-3 h-3" />
                            Isenção Garantida pela Regra 2026
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/30 flex gap-3 items-start opacity-40">
                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                <p className="text-[8px] leading-tight font-bold uppercase tracking-widest text-slate-500">
                    DIAGNÓSTICO SIMULADO: ESTES VALORES SÃO PROJEÇÕES BASEADAS NAS REGRAS DE 2026. NÃO SUBSTITUI O PROGRAMA OFICIAL DA RECEITA FEDERAL.
                </p>
            </div>
        </div>
    );
};
