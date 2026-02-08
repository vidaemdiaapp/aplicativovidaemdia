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
            <div className="min-h-screen bg-surface pb-24">
                <header className="bg-primary-500 pt-14 pb-24 px-6 relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-400/30 rounded-full blur-3xl" />
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-white/20 animate-pulse" />
                        <div className="w-32 h-8 rounded bg-white/20 animate-pulse" />
                    </div>
                </header>
                <div className="px-4 -mt-16 relative z-20">
                    <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-100">
                        <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pb-24 text-text-primary">
            {/* ═══════════════════════════════════════════════════════════════
                HERO: Blue Gradient Header
            ═══════════════════════════════════════════════════════════════ */}
            <header className="bg-primary-500 pt-14 pb-24 px-6 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-400/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-20 w-48 h-48 bg-primary-600/20 rounded-full blur-2xl" />

                <div className="flex items-center justify-between relative z-10 mb-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm text-white/80 hover:bg-white/20 flex items-center justify-center transition-all"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <p className="text-primary-100 text-[10px] font-bold uppercase tracking-widest">Gestão</p>
                            <h1 className="text-white text-2xl font-bold">Rendas</h1>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 flex items-center justify-center transition-all"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* ═══════════════════════════════════════════════════════════════
                FLOATING SUMMARY CARD
            ═══════════════════════════════════════════════════════════════ */}
            <div className="px-4 -mt-16 relative z-20">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 p-6 text-center">
                    <p className="text-slate-500 text-sm font-medium mb-2">Renda Mensal Total</p>
                    <h2 className="text-3xl font-black text-emerald-500">{formatCurrency(totalMonthly)}</h2>
                    <p className="text-slate-400 text-xs font-medium mt-2">
                        Gerenciando {incomes.length} fonte{incomes.length !== 1 ? 's' : ''} de rendimento
                    </p>
                </div>
            </div>

            {/* Filter Chips */}
            <div className="px-6 py-6 flex gap-3 overflow-x-auto no-scrollbar">
                {(['all', 'month', 'week'] as ViewMode[]).map((mode) => (
                    <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${viewMode === mode
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
                            : 'bg-white border border-border-color text-text-muted hover:border-emerald-200'
                            }`}
                    >
                        {mode === 'all' ? 'Todas' : mode === 'month' ? 'Este Mês' : 'Esta Semana'}
                    </button>
                ))}
            </div>

            {/* Incomes List */}
            <div className="px-6 space-y-4 pb-12">
                {incomes.length === 0 ? (
                    <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-sm">
                        <TrendingUp className="w-16 h-16 text-emerald-200 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Nenhuma renda cadastrada</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            Adicione suas fontes de renda para ter uma visão completa das suas finanças.
                        </p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold"
                        >
                            Cadastrar Primeira Renda
                        </button>
                    </div>
                ) : (
                    incomes.map((income) => (
                        <div
                            key={income.id}
                            className="bg-white p-5 rounded-3xl border border-border-color shadow-sm hover:shadow-md transition-all group lg:p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getSourceColor(income.source)}`}>
                                        {income.is_partner ? (
                                            <Users className="w-6 h-6" />
                                        ) : (
                                            <ArrowUpCircle className="w-6 h-6" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{income.description || getSourceLabel(income.source)}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getSourceColor(income.source)}`}>
                                                {getSourceLabel(income.source)}
                                            </span>
                                            {income.is_partner && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-600">
                                                    Parceiro(a)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-emerald-600">
                                        {formatCurrency(income.amount_monthly)}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-medium">por mês</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="flex items-center gap-1 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 text-xs font-bold transition-colors"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    Editar
                                </button>
                                <button
                                    onClick={() => handleDelete(income.id)}
                                    className="flex items-center gap-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 rounded-lg text-rose-600 text-xs font-bold transition-colors"
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

