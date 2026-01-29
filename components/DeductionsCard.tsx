import React from 'react';
import { Receipt, FileText, ChevronRight, Calculator, Plus, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
    totalDeductions: number;
    estimatedSaving: number;
    onOpenPastaFiscal: () => void;
}

export const DeductionsCard: React.FC<Props> = ({ totalDeductions, estimatedSaving, onOpenPastaFiscal }) => {
    const navigate = useNavigate();
    const hasDeductions = totalDeductions > 0;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-[100px] -mr-8 -mt-8 transition-all group-hover:bg-emerald-500/10"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                    <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700">
                        <Receipt className="w-6 h-6 text-emerald-400" />
                    </div>
                    <button
                        onClick={onOpenPastaFiscal}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-400/10 px-4 py-2 rounded-xl border border-emerald-400/20"
                    >
                        Pasta Fiscal
                        <ArrowUpRight className="w-3 h-3" />
                    </button>
                </div>

                <div className="space-y-1 mb-10">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Créditos de Dedução (Ano)</p>
                    <h2 className="text-3xl font-black text-white tracking-tighter">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDeductions)}
                    </h2>
                </div>

                <div className={`p-6 rounded-2xl flex items-center gap-4 transition-all border ${hasDeductions ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-800/30 border-slate-800'
                    }`}>
                    <div className={`p-3 rounded-xl ${hasDeductions ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
                        <Calculator className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        {hasDeductions ? (
                            <>
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Impacto no Imposto Devido</p>
                                <p className="text-lg font-black text-white">
                                    - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimatedSaving)}
                                </p>
                            </>
                        ) : (
                            <p className="text-xs font-medium text-slate-500 italic leading-snug">
                                Nenhum comprovante capturado. Médicos, psicólogos e educação reduzem seu imposto final.
                            </p>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => navigate('/assistant', { state: { initialMessage: '💡 Elara, me ajude a identificar se eu tenho mais algum gasto que pode ser deduzido no meu Imposto de Renda?' } })}
                    className="w-full mt-8 py-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 border border-slate-700"
                >
                    <Plus className="w-4 h-4 text-emerald-400" />
                    Hack de Dedução
                </button>
            </div>
        </div>
    );
};
