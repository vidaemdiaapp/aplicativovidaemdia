import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Receipt, Calendar, FileText, ChevronRight, Download, Trash2, Heart, GraduationCap, MoreHorizontal } from 'lucide-react';
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
        const data = await taxDeductionsService.getDeductions();
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

    const filteredDeductions = filter === 'all'
        ? deductions
        : deductions.filter(d => d.expense_type === filter);

    const totalAmount = filteredDeductions.reduce((sum, d) => sum + d.amount, 0);

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            <header className="bg-white p-6 pt-12 pb-4 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full -ml-2">
                        <ArrowLeft className="w-6 h-6 text-slate-700" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-900">Pasta Fiscal</h1>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500'
                            }`}
                    >
                        Tudo
                    </button>
                    <button
                        onClick={() => setFilter('medical')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${filter === 'medical' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-600'
                            }`}
                    >
                        Saúde
                    </button>
                    <button
                        onClick={() => setFilter('education')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${filter === 'education' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'
                            }`}
                    >
                        Educação
                    </button>
                </div>
            </header>

            <div className="p-6">
                {/* Summary View */}
                <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-2xl mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Total Dedutível {new Date().getFullYear()}</p>
                    <h2 className="text-3xl font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)}</h2>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full w-fit">
                        <Download className="w-3 h-3" />
                        PRONTO PARA O IRPF
                    </div>
                </div>

                {/* Context Tip */}
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl mb-8 flex gap-3 items-start">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                        Algumas despesas (como escola e médicos) têm um limite anual de dedução definido pela Receita Federal. O valor total exibido é uma soma bruta.
                    </p>
                </div>

                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 ml-2">Comprovantes Detectados</h3>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-slate-100" />)}
                    </div>
                ) : filteredDeductions.length > 0 ? (
                    <div className="space-y-3">
                        {filteredDeductions.map((item) => (
                            <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all group">
                                <div className="bg-slate-50 p-3 rounded-xl">
                                    {getIcon(item.expense_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-900 truncate text-sm">{item.provider_name || 'Fornecedor não identificado'}</h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">{getLabel(item.expense_type)}</span>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-[10px] font-medium text-slate-400">{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                    {/* Confidence Status badge */}
                                    <div className="mt-2 flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${item.confidence_score && item.confidence_score >= 0.8 ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${item.confidence_score && item.confidence_score >= 0.8 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {item.confidence_score && item.confidence_score >= 0.8 ? 'Alta Confiança' : 'Revisar Detalhes'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-slate-900 text-sm">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}
                                    </p>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center">
                        <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Receipt className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-bold">Nenhuma dedução este ano.</p>
                        <p className="text-slate-400 text-sm mt-1">Carregue boletos de escola ou saúde!</p>
                    </div>
                )}
            </div>
        </div>
    );
};
