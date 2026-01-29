import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Receipt, Calendar, FileText, ChevronRight, Download, Trash2, Heart, GraduationCap, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { taxDeductionsService, TaxDeductibleExpense, DeductionType } from '../services/tax_deductions';
import { useAuth } from '../hooks/useAuth';

export const FiscalFolderScreen: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [deductions, setDeductions] = useState<TaxDeductibleExpense[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<DeductionType | 'all'>('all');

    useEffect(() => {
        loadDeductions();
    }, []);

    const loadDeductions = async () => {
        setLoading(true);
        const currentYear = 2026;
        const data = await taxDeductionsService.getDeductions(currentYear);
        setDeductions(data);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Deseja remover este comprovante da pasta fiscal?')) {
            const success = await taxDeductionsService.deleteDeduction(id);
            if (success) {
                setDeductions(prev => prev.filter(d => d.id !== id));
            }
        }
    };

    const getIcon = (type: DeductionType) => {
        switch (type) {
            case 'health_plan':
            case 'medical': return <Heart className="w-5 h-5 text-rose-500" />;
            case 'education': return <GraduationCap className="w-5 h-5 text-blue-500" />;
            default: return <FileText className="w-5 h-5 text-slate-400" />;
        }
    };

    const getLabel = (type: DeductionType) => {
        switch (type) {
            case 'health_plan': return 'Plano de Saúde';
            case 'medical': return 'Saúde / Clínicas';
            case 'education': return 'Educação';
            default: return 'Outros';
        }
    };

    const totalAmount = filteredDeductions.reduce((sum, d) => sum + d.amount, 0);
    const totalSaving = totalAmount * 0.275; // Average tax saving

    return (
        <div className="min-h-screen bg-slate-950 pb-24 text-white">
            <header className="bg-slate-950/80 backdrop-blur-md p-6 pt-16 pb-6 sticky top-0 z-20 border-b border-slate-800/50">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-800 rounded-full -ml-2 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-400" />
                    </button>
                    <h1 className="text-xl font-black text-white">Pasta Fiscal</h1>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${filter === 'all' ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'bg-slate-900 border-slate-800 text-slate-500'
                            }`}
                    >
                        Tudo
                    </button>
                    <button
                        onClick={() => setFilter('medical')}
                        className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${filter === 'medical' ? 'bg-rose-500 border-rose-500 text-slate-950' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                            }`}
                    >
                        Saúde
                    </button>
                    <button
                        onClick={() => setFilter('education')}
                        className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${filter === 'education' ? 'bg-blue-500 border-blue-500 text-slate-950' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                            }`}
                    >
                        Educação
                    </button>
                </div>
            </header>

            <div className="p-6">
                {/* Summary View - Reimagined */}
                <div className="bg-slate-900 rounded-[32px] p-8 border border-slate-800 shadow-2xl mb-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -mr-24 -mt-24 group-hover:bg-emerald-500/10 transition-colors"></div>

                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Potencial de Dedução 2026</p>
                    <h2 className="text-4xl font-black text-white tracking-tighter mb-4">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)}
                    </h2>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-xl border border-emerald-400/20 uppercase tracking-widest">
                            <TrendingUp className="w-3 h-3" />
                            ~ {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSaving)} OFF em IR
                        </div>
                    </div>
                </div>

                {/* Context Tip */}
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[32px] mb-10 flex gap-4 items-start">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed uppercase tracking-wider">
                        Nota: Valores baseados no limite máximo de alíquota (27,5%). O abatimento real depende da sua base de cálculo e modalidade de declaração.
                    </p>
                </div>

                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 ml-2">Comprovantes Detectados</h3>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-900 rounded-[32px] animate-pulse border border-slate-800" />)}
                    </div>
                ) : filteredDeductions.length > 0 ? (
                    <div className="space-y-4">
                        {filteredDeductions.map((item) => (
                            <div key={item.id} className="bg-slate-900 p-5 rounded-[32px] border border-slate-800 shadow-sm flex items-center gap-5 hover:bg-slate-800/50 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 py-1.5 px-4 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest rounded-bl-2xl border-l border-b border-emerald-500/20">
                                    Economiza ~ {(item.amount * 0.275).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </div>

                                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                                    {getIcon(item.expense_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-white truncate text-sm mb-1">{item.provider_name || 'Estabelecimento'}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{getLabel(item.expense_type)}</span>
                                        <span className="text-slate-700">•</span>
                                        <span className="text-[10px] font-medium text-slate-500">{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                                    </div>

                                    <div className="mt-3 flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${item.confidence_score && item.confidence_score >= 0.8 ? 'bg-emerald-500' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`}></div>
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${item.confidence_score && item.confidence_score >= 0.8 ? 'text-emerald-500/60' : 'text-amber-500/60'}`}>
                                            {item.confidence_score && item.confidence_score >= 0.8 ? 'Validado' : 'Ajustar Detalhes'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-white text-base">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}
                                    </p>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="mt-2 p-2 text-slate-600 hover:text-rose-500 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-24 text-center">
                        <div className="bg-slate-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-800 shadow-xl">
                            <Receipt className="w-8 h-8 text-slate-700" />
                        </div>
                        <p className="text-slate-300 font-black text-lg">Pasta Fiscal Vazia</p>
                        <p className="text-slate-500 text-xs mt-2 font-medium uppercase tracking-widest leading-relaxed">
                            Carregue recibos hoje e veja<br />seu imposto diminuir em tempo real!
                        </p>
                        <button
                            onClick={() => navigate('/upload')}
                            className="mt-8 px-8 py-4 bg-emerald-500 text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-500/10 active:scale-95 transition-all"
                        >
                            Fazer Primeiro Upload
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
