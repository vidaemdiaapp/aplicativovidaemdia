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
        <div className="bg-white border border-slate-100 rounded-[32px] p-8 text-slate-900 relative overflow-hidden group shadow-sm transition-all hover:shadow-md">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2 font-mono">Resumo Executivo Fiscal</p>
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Exercício {estimate.year}</h2>
                    </div>
                    <div className="bg-primary-500 text-white p-4 rounded-[20px] shadow-lg shadow-primary-500/20 active:scale-95 transition-all">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-10">
                    <div className="space-y-1">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest pl-0.5">Renda Bruta Anual</p>
                        <p className="text-xl font-bold text-slate-800 tracking-tight">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimate.income_monthly * 12)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest pl-0.5">Deduções Totais</p>
                        <p className="text-xl font-bold text-emerald-600 tracking-tight">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimate.total_deductions_year || 0)}</p>
                    </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-8 flex justify-between items-center shadow-inner">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Base de Cálculo Projetada</span>
                    <span className="text-sm font-bold text-slate-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.max((estimate.income_monthly * 12) - (estimate.total_deductions_year || 0), 0))}
                    </span>
                </div>

                <div className="flex items-center justify-between pt-8 border-t border-slate-100">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-0.5">Imposto Estimado</p>
                        <p className="text-3xl font-bold text-slate-900 tracking-tighter">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimate.estimated_tax_yearly)}
                        </p>
                    </div>
                    <div className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border shadow-sm ${estimate.is_exempt
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : 'bg-primary-50 text-primary-600 border-primary-100'}`}>
                        {estimate.is_exempt ? 'Isento' : 'Alíquota Efetiva'}
                    </div>
                </div>

                <button
                    onClick={() => navigate('/assistant', { state: { initialMessage: '🦁 Elara, como eu posso reduzir legalmente esse imposto de renda estimado através de deduções?' } })}
                    className="w-full mt-10 py-5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-bold uppercase tracking-widest text-slate-600 transition-all active:scale-[0.98] shadow-sm hover:shadow-md"
                >
                    Estratégias de Redução
                    <ChevronRight className="w-4 h-4 text-primary-500 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};
