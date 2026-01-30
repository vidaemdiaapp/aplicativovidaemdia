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
        <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm relative overflow-hidden group">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-[100px] -mr-8 -mt-8 transition-all group-hover:bg-emerald-500/10"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner group-hover:bg-emerald-50 transition-colors">
                        <Receipt className="w-6 h-6 text-emerald-500" />
                    </div>
                    <button
                        onClick={onOpenPastaFiscal}
                        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-all bg-emerald-50 px-5 py-3 rounded-2xl border border-emerald-100 shadow-sm active:scale-95"
                    >
                        Pasta Fiscal
                        <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div className="space-y-1 mb-10">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest pl-0.5">Créditos de Dedução (Ano)</p>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDeductions)}
                    </h2>
                </div>

                <div className={`p-6 rounded-2xl flex items-center gap-4 transition-all border shadow-inner ${hasDeductions ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-100'
                    }`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${hasDeductions ? 'bg-white text-emerald-500 border border-emerald-50' : 'bg-white text-slate-300 border border-slate-50'}`}>
                        <Calculator className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        {hasDeductions ? (
                            <>
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Impacto no Imposto Devido</p>
                                <p className="text-lg font-bold text-slate-900 tracking-tight">
                                    - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimatedSaving)}
                                </p>
                            </>
                        ) : (
                            <p className="text-[13px] font-medium text-slate-400 italic leading-snug">
                                Nenhum comprovante capturado. Médicos, psicólogos e educação reduzem seu imposto final.
                            </p>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => navigate('/assistant', { state: { initialMessage: '💡 Elara, me ajude a identificar se eu tenho mais algum gasto que pode ser deduzido no meu Imposto de Renda?' } })}
                    className="w-full mt-10 py-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-slate-900/10"
                >
                    <Plus className="w-4 h-4 text-emerald-400" />
                    Hack de Dedução
                </button>
            </div>
        </div>
    );
};
