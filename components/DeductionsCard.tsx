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
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className="bg-primary-100 p-3 rounded-2xl">
                        <Receipt className="w-6 h-6 text-primary-600" />
                    </div>
                    <button
                        onClick={onOpenPastaFiscal}
                        className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 transition-colors"
                    >
                        Pasta Fiscal
                        <ArrowUpRight className="w-3 h-3" />
                    </button>
                </div>

                <div className="space-y-1 mb-8">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Deduções Capturadas (Ano)</p>
                    <h2 className="text-3xl font-black text-slate-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDeductions)}
                    </h2>
                </div>

                <div className={`p-5 rounded-2xl flex items-center gap-4 transition-all ${hasDeductions ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-slate-100'
                    }`}>
                    <div className={`p-2 rounded-xl ${hasDeductions ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        <Calculator className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                        {hasDeductions ? (
                            <>
                                <p className="text-[10px] font-black text-emerald-800 uppercase tracking-tight">Economia Estimada em IR</p>
                                <p className="text-sm font-bold text-emerald-600">
                                    ~ {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimatedSaving)}
                                </p>
                            </>
                        ) : (
                            <p className="text-xs font-medium text-slate-500 italic leading-snug">
                                Você ainda não capturou deduções. Sabia que recibos médicos e escola diminuem seu imposto?
                            </p>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => navigate('/assistant', { state: { initialMessage: '💡 Me dá uma dica de como aumentar minhas deduções no IR?' } })}
                    className="w-full mt-6 py-4 rounded-2xl bg-slate-900 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                >
                    <Plus className="w-4 h-4" />
                    Dica de Dedução
                </button>
            </div>
        </div>
    );
};
