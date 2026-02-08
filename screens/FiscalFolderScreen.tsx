import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Receipt, Calendar, FileText, ChevronRight, Download, Trash2, Heart, GraduationCap, MoreHorizontal, AlertTriangle, TrendingUp, Users, Banknote, Landmark } from 'lucide-react';
import { taxDeductionsService, TaxDeductibleExpense, DeductionType } from '../services/tax_deductions';
import { useAuth } from '../hooks/useAuth';
import { TaxDocumentUpload } from '../components/TaxDocumentUpload';

export const FiscalFolderScreen: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [deductions, setDeductions] = useState<TaxDeductibleExpense[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | DeductionType>('all');
    const [search, setSearch] = useState('');
    const [showUpload, setShowUpload] = useState(false);
    const currentYear = 2026;

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await taxDeductionsService.getDeductions(currentYear);
            setDeductions(data);
        } catch (error) {
            console.error('Error fetching deductions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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
            case 'medical':
            case 'health': return <Heart className="w-5 h-5 text-rose-500" />;
            case 'education': return <GraduationCap className="w-5 h-5 text-blue-500" />;
            case 'dependent': return <Users className="w-5 h-5 text-purple-500" />;
            case 'pension': return <Banknote className="w-5 h-5 text-amber-500" />;
            case 'pgbl': return <Landmark className="w-5 h-5 text-emerald-500" />;
            default: return <FileText className="w-5 h-5 text-slate-400" />;
        }
    };

    const getLabel = (type: DeductionType) => {
        switch (type) {
            case 'health_plan': return 'Plano de Saúde';
            case 'medical':
            case 'health': return 'Saúde / Clínicas';
            case 'education': return 'Educação';
            case 'dependent': return 'Dependente';
            case 'pension': return 'Pensão Alimentícia';
            case 'pgbl': return 'Previdência PGBL';
            default: return 'Outros';
        }
    };

    const filteredDeductions = deductions.filter(d => {
        if (filter === 'all') return true;
        if (filter === 'medical') return ['medical', 'health', 'health_plan'].includes(d.expense_type);
        return d.expense_type === filter;
    });

    const totalAmount = filteredDeductions.reduce((sum, d) => sum + d.amount, 0);
    const totalSaving = totalAmount * 0.275; // Average tax saving

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Blue Hero Header */}
            <header className="bg-primary-500 pt-14 pb-24 px-6 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-400/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-20 w-48 h-48 bg-primary-600/20 rounded-full blur-2xl" />

                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-white/20 transition-all">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <p className="text-primary-100 text-[10px] font-bold uppercase tracking-widest">Ano-Calendário {currentYear - 1}</p>
                            <h1 className="text-white text-2xl font-bold">Pasta Fiscal</h1>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowUpload(true)}
                        className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center text-primary-500 hover:scale-105 transition-all"
                    >
                        <Receipt className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Floating Filter Card */}
            <div className="px-4 -mt-16 relative z-20">
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-5">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === 'all'
                                ? 'bg-primary-500 text-white shadow-md shadow-primary-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            Tudo
                        </button>
                        <button
                            onClick={() => setFilter('medical')}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === 'medical' || filter === 'health' || filter === 'health_plan'
                                ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
                                : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                }`}
                        >
                            Saúde
                        </button>
                        <button
                            onClick={() => setFilter('education')}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === 'education'
                                ? 'bg-blue-500 text-white shadow-md shadow-blue-200'
                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                }`}
                        >
                            Educação
                        </button>
                        <button
                            onClick={() => setFilter('pgbl')}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === 'pgbl'
                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                }`}
                        >
                            PGBL
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6 pt-4">
                {/* Summary View - Light Theme */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16"></div>

                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Potencial de Dedução {currentYear}</p>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)}
                    </h2>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 uppercase tracking-widest">
                            <TrendingUp className="w-3 h-3" />
                            ~ {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSaving)} OFF em IR
                        </div>
                    </div>
                </div>

                {/* Context Tip */}
                <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl mb-6 flex gap-4 items-start">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                        Nota: Valores baseados no limite máximo de alíquota (27,5%). O abatimento real depende da sua base de cálculo e modalidade de declaração.
                    </p>
                </div>

                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 ml-2">Comprovantes Detectados</h3>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-slate-100" />)}
                    </div>
                ) : filteredDeductions.length > 0 ? (
                    <div className="space-y-3">
                        {filteredDeductions.map((item) => (
                            <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 py-1.5 px-3 bg-emerald-50 text-emerald-600 text-[8px] font-bold uppercase tracking-widest rounded-bl-xl border-l border-b border-emerald-100">
                                    Economiza ~ {(item.amount * 0.275).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </div>

                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    {getIcon(item.expense_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-900 truncate text-sm mb-1">{item.provider_name || 'Estabelecimento'}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{getLabel(item.expense_type)}</span>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-[10px] font-medium text-slate-400">{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                                    </div>

                                    <div className="mt-2 flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${item.confidence_score && item.confidence_score >= 0.8 ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                        <span className={`text-[9px] font-bold uppercase tracking-widest ${item.confidence_score && item.confidence_score >= 0.8 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                            {item.confidence_score && item.confidence_score >= 0.8 ? 'Validado' : 'Ajustar Detalhes'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-900 text-base">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}
                                    </p>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="mt-2 p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center">
                        <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-200">
                            <Receipt className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-700 font-bold text-lg">Pasta Fiscal Vazia</p>
                        <p className="text-slate-400 text-sm mt-2 font-medium leading-relaxed">
                            Carregue recibos hoje e veja<br />seu imposto diminuir em tempo real!
                        </p>
                        <button
                            onClick={() => setShowUpload(true)}
                            className="mt-8 px-8 py-4 bg-primary-500 text-white rounded-2xl font-bold uppercase text-sm tracking-widest shadow-lg shadow-primary-200 active:scale-95 transition-all"
                        >
                            Fazer Primeiro Upload
                        </button>
                    </div>
                )}
            </div>

            {/* Modal de Upload */}
            {showUpload && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-0">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" onClick={() => setShowUpload(false)}></div>
                    <div className="relative w-full max-w-lg animate-in fade-in zoom-in duration-300">
                        <TaxDocumentUpload
                            year={currentYear}
                            onUploadComplete={() => {
                                fetchData();
                            }}
                            onCancel={() => setShowUpload(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
