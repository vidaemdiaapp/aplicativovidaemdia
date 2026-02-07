import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Plus, ArrowUpCircle, Calendar, Edit2, Trash2,
    Users, User, Filter, ChevronRight, TrendingUp
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { incomesService, Income } from '../services/incomes';
import { IncomeRegistrationModal } from '../components/IncomeRegistrationModal';

type ViewMode = 'all' | 'month' | 'week';

export const IncomesScreen: React.FC = () => {
    const navigate = useNavigate();
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('all');
    const [showModal, setShowModal] = useState(false);
    const [totalMonthly, setTotalMonthly] = useState(0);

    useEffect(() => {
        loadIncomes();
    }, []);

    const loadIncomes = async () => {
        setLoading(true);
        try {
            const data = await incomesService.getIncomes();
            setIncomes(data);
            const total = data.reduce((sum, inc) => sum + inc.amount_monthly, 0);
            setTotalMonthly(total);
        } catch (error) {
            console.error('Error loading incomes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta renda?')) return;

        try {
            await incomesService.deleteIncome(id);
            loadIncomes();
        } catch (error) {
            console.error('Error deleting income:', error);
        }
    };

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const getSourceLabel = (source: string) => {
        const labels: Record<string, string> = {
            'salary': 'Salário',
            'freelance': 'Freelance',
            'rental': 'Aluguel',
            'investments': 'Investimentos',
            'benefits': 'Benefícios',
            'pension': 'Aposentadoria',
            'other': 'Outros'
        };
        return labels[source] || source;
    };

    const getSourceColor = (source: string) => {
        const colors: Record<string, string> = {
            'salary': 'bg-emerald-100 text-emerald-600',
            'freelance': 'bg-cyan-100 text-cyan-600',
            'rental': 'bg-amber-100 text-amber-600',
            'investments': 'bg-violet-100 text-violet-600',
            'benefits': 'bg-rose-100 text-rose-600',
            'pension': 'bg-slate-100 text-slate-600',
            'other': 'bg-slate-100 text-slate-500'
        };
        return colors[source] || 'bg-slate-100 text-slate-500';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
                    <p className="text-slate-400 text-sm font-medium animate-pulse">Carregando rendas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pb-24 text-text-primary">
            {/* ═══════════════════════════════════════════════════════════════
                HEADER & SUMMARY
            ═══════════════════════════════════════════════════════════════ */}
            <header className="px-6 pt-16 pb-8 bg-surface-elevated border-b border-border-color shadow-sm sticky top-0 z-30 lg:rounded-b-[40px]">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-12 h-12 rounded-2xl bg-white border border-border-color text-text-muted hover:text-primary-600 transition-all active:scale-90 shadow-sm flex items-center justify-center"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-text-primary tracking-tight leading-none">Rendas</h1>
                            <p className="text-text-muted text-[11px] font-bold uppercase tracking-widest mt-1">Fontes de Receita</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="w-12 h-12 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all active:scale-90 shadow-lg shadow-emerald-500/20 flex items-center justify-center"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>

                <div className="card p-6 border-l-4 border-l-emerald-500 text-center">
                    <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] mb-2 px-1">
                        Renda Mensal Total
                    </p>
                    <h1 className="text-5xl font-black text-emerald-500 tracking-tight">
                        {formatCurrency(totalMonthly)}
                    </h1>
                    <p className="text-text-secondary text-[11px] font-bold uppercase tracking-widest mt-3 opacity-60">
                        {incomes.length} fonte{incomes.length !== 1 ? 's' : ''} ativa{incomes.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </header>

            <div className="px-6 py-8 flex gap-3 overflow-x-auto no-scrollbar">
                {(['all', 'month', 'week'] as ViewMode[]).map((mode) => (
                    <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${viewMode === mode
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                            : 'bg-white text-text-muted border-white shadow-sm'
                            }`}
                    >
                        {mode === 'all' ? 'Ver Todas' : mode === 'month' ? 'Este Mês' : 'Esta Semana'}
                    </button>
                ))}
            </div>

            <div className="px-6 space-y-4 pb-12">
                {incomes.length === 0 ? (
                    <div className="card-premium p-12 text-center bg-white/50">
                        <TrendingUp className="w-16 h-16 text-emerald-100 mx-auto mb-4" />
                        <h3 className="text-lg font-black text-text-primary mb-2">Nenhuma renda</h3>
                        <p className="text-text-muted text-sm font-bold uppercase tracking-widest mb-6">
                            Registre seus ganhos aqui
                        </p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                        >
                            Cadastrar Rendimento
                        </button>
                    </div>
                ) : (
                    incomes.map((income) => (
                        <div
                            key={income.id}
                            className="card p-5 group lg:p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 border-white shadow-sm ${getSourceColor(income.source)}`}>
                                        {income.is_partner ? (
                                            <Users className="w-7 h-7" />
                                        ) : (
                                            <ArrowUpCircle className="w-7 h-7" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-black text-text-primary tracking-tight truncate group-hover:text-emerald-600 transition-colors">
                                            {income.description || getSourceLabel(income.source)}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${getSourceColor(income.source)}`}>
                                                {getSourceLabel(income.source)}
                                            </span>
                                            {income.is_partner && (
                                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 border border-white">
                                                    Parceiro(a)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-emerald-500 tracking-tight">
                                        {formatCurrency(income.amount_monthly)}
                                    </p>
                                    <p className="text-[9px] text-text-muted font-black uppercase tracking-widest">por mês</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 mt-5 pt-5 border-t border-border-color opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-text-muted text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    Editar
                                </button>
                                <button
                                    onClick={() => handleDelete(income.id)}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-danger-50 hover:bg-danger-500 hover:text-white rounded-xl text-danger-500 text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Excluir
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Income Modal */}
            <IncomeRegistrationModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); }}
                onSuccess={() => {
                    setShowModal(false);
                    loadIncomes();
                }}
            />
        </div>
    );
};

