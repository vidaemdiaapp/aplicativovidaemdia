import React from 'react';
import { ShieldCheck, ArrowRight, TrendingUp, Info, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { IRPFEstimate } from '../types';

interface Props {
    estimate: IRPFEstimate;
}

export const LionSummaryCard: React.FC<Props> = ({ estimate }) => {
    const navigate = useNavigate();
    return (
        <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden group shadow-2xl">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Resumo para o Leão</p>
                        <h2 className="text-2xl font-black">Ciclo {estimate.year}</h2>
                    </div>
                    <div className="bg-white/10 p-3 rounded-2xl">
                        <ShieldCheck className="w-6 h-6 text-primary-400" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <p className="text-white/40 text-[10px] font-bold uppercase mb-1">Renda Bruta Anual</p>
                        <p className="text-lg font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimate.income_monthly * 12)}</p>
                    </div>
                    <div>
                        <p className="text-white/40 text-[10px] font-bold uppercase mb-1">Deduções Totais</p>
                        <p className="text-lg font-black text-emerald-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimate.total_deductions_year || 0)}</p>
                    </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-6">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white/60">Base de Cálculo Estimada</span>
                        <span className="text-sm font-black italic">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.max((estimate.income_monthly * 12) - (estimate.total_deductions_year || 0), 0))}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/10">
                    <div>
                        <p className="text-[10px] font-bold text-white/40 uppercase mb-0.5">Imposto Estimado (Anual)</p>
                        <p className="text-2xl font-black text-rose-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimate.estimated_tax_yearly)}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${estimate.is_exempt ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {estimate.is_exempt ? 'Isento' : 'Com Imposto'}
                    </div>
                </div>

                <button
                    onClick={() => navigate('/assistant', { state: { initialMessage: '🦁 Me explique como foi feito o cálculo do meu Imposto de Renda 2026?' } })}
                    className="w-full mt-6 py-4 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-white transition-all border border-white/10"
                >
                    Ver Memória de Cálculo
                    <ChevronRight className="w-4 h-4 opacity-40" />
                </button>
            </div>
        </div>
    );
};
