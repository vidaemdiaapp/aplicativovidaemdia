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
        <div className="bg-slate-900 border border-amber-500/20 rounded-[32px] p-8 text-white relative overflow-hidden group shadow-2xl">
            {/* Background Accent - Golden Mist */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[60px] -ml-16 -mb-16"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/60 mb-2 font-mono">Elite Fiscal Summary</p>
                        <h2 className="text-3xl font-black text-white">Exercício {estimate.year}</h2>
                    </div>
                    <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-3 rounded-2xl shadow-[0_10px_20px_rgba(245,158,11,0.3)]">
                        <ShieldCheck className="w-6 h-6 text-slate-900" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Renda Bruta Anual</p>
                        <p className="text-xl font-black text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimate.income_monthly * 12)}</p>
                    </div>
                    <div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Deduções Totais</p>
                        <p className="text-xl font-black text-emerald-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimate.total_deductions_year || 0)}</p>
                    </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-5 border border-white/5 mb-6 backdrop-blur-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400">Base de Cálculo Projetada</span>
                        <span className="text-sm font-black text-white italic">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.max((estimate.income_monthly * 12) - (estimate.total_deductions_year || 0), 0))}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-800">
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Imposto Estimado</p>
                        <p className="text-3xl font-black text-white tracking-tighter">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimate.estimated_tax_yearly)}
                        </p>
                    </div>
                    <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${estimate.is_exempt
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                        {estimate.is_exempt ? 'Isento' : 'Alíquota Efetiva'}
                    </div>
                </div>

                <button
                    onClick={() => navigate('/assistant', { state: { initialMessage: '🦁 Elara, como eu posso reduzir legalmente esse imposto de renda estimado através de deduções?' } })}
                    className="w-full mt-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.1em] text-amber-500 transition-all border border-amber-500/10 group-hover:border-amber-500/30"
                >
                    Estratégias de Redução
                    <ChevronRight className="w-4 h-4 opacity-40 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};
