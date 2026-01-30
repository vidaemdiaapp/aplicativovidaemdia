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
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 animate-pulse shadow-sm">
                <div className="h-4 w-32 bg-slate-50 rounded mb-4"></div>
                <div className="h-8 w-48 bg-slate-50 rounded mb-2"></div>
                <div className="h-4 w-64 bg-slate-50 rounded"></div>
            </div>
        );
    }

    if (!estimate) return null;

    const getStatusColor = () => {
        if (estimate.is_exempt) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        if (estimate.estimated_tax_monthly > 0 && estimate.tax_rate < 0.2) return 'text-primary-600 bg-primary-50 border-primary-100';
        return 'text-rose-600 bg-rose-50 border-rose-100';
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
        <div className="bg-white shadow-sm rounded-[32px] p-8 border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-emerald-500" />
                            Análise Projetada
                        </p>
                        <h3 className={`text-[11px] font-bold px-4 py-2 rounded-xl inline-block uppercase tracking-widest border shadow-sm ${getStatusColor()}`}>
                            {getStatusLabel()}
                        </h3>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner group-hover:bg-primary-50 transition-colors">
                        <TrendingUp className="w-6 h-6 text-slate-400 group-hover:text-primary-500 transition-colors" />
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="space-y-1">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest pl-0.5">Renda Mensal Detectada</p>
                        <p className="text-3xl font-bold text-slate-900 tracking-tight">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimate.income_monthly)}
                        </p>
                    </div>

                    <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 flex gap-4 items-start shadow-inner">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110">
                            <Info className="w-5 h-5 text-primary-500" />
                        </div>
                        <div className="space-y-3">
                            <p className="text-[15px] text-slate-600 font-medium leading-relaxed">
                                {getHumanMessage()}
                            </p>
                            <div className="flex items-center gap-3">
                                <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm border ${estimate.confidence === 'high' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-primary-50 text-primary-600 border-primary-100'}`}>
                                    {estimate.confidence === 'high' ? 'Confiança Alta' : 'Média Confiança'}
                                </span>
                                <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Base 2026</span>
                            </div>
                        </div>
                    </div>

                    {!estimate.is_exempt && (
                        <div className="pt-8 border-t border-slate-100">
                            <div className="flex justify-between items-center mb-8">
                                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Estimativa Anual</span>
                                <span className="text-2xl font-bold text-rose-600 tracking-tight">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimate.estimated_tax_yearly)}
                                </span>
                            </div>
                            <button
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg shadow-slate-900/10 active:scale-[0.98]"
                                onClick={() => navigate('/assistant', { state: { initialMessage: '🦁 Elara, me mostre dicas de como reduzir meu IR através de previdência privada ou dependentes.' } })}
                            >
                                Estratégias de Economia
                                <ArrowRight className="w-4 h-4 text-primary-400" />
                            </button>
                        </div>
                    )}

                    {estimate.is_exempt && (
                        <div className="flex gap-3 items-center py-4 px-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            </div>
                            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Isenção Garantida pela Regra 2026</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex gap-3 items-start opacity-60">
                <AlertTriangle className="w-3.5 h-3.5 text-slate-300 mt-0.5 shrink-0" />
                <p className="text-[9px] leading-relaxed font-bold uppercase tracking-widest text-slate-300">
                    DIAGNÓSTICO SIMULADO: ESTES VALORES SÃO PROJEÇÕES BASEADAS NAS REGRAS DE 2026. NÃO SUBSTITUI O PROGRAMA OFICIAL DA RECEITA FEDERAL.
                </p>
            </div>
        </div>
    );
};
