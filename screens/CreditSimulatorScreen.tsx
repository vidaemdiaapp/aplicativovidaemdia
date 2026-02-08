import React, { useState, useEffect } from 'react';
import {
    CreditCard as CreditCardIcon, TrendingDown, ArrowLeft,
    ShieldCheck, RefreshCw, AlertTriangle, PieChart,
    ChevronRight, Wallet, Landmark, Layers, Zap,
    Filter, Calendar as CalendarIcon, ArrowUpRight, Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { creditCardsService, CreditCard, CreditCardTransaction } from '../services/financial';
import { tasksService } from '../services/tasks';
import { supabase } from '../services/supabase';
import { SpendingDonutChart } from '../components/charts/SpendingChart';

interface ProjectionData {
    income: number;
    fixed_bills: number;
    immediate_spending: number;
    card_debt: number;
    final_balance: number;
    status: 'surplus' | 'warning' | 'deficit';
}

export const CreditSimulatorScreen: React.FC = () => {
    const navigate = useNavigate();
    const [cards, setCards] = useState<CreditCard[]>([]);
    const [allTransactions, setAllTransactions] = useState<CreditCardTransaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<CreditCardTransaction[]>([]);
    const [projection, setProjection] = useState<ProjectionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<'current' | 'previous'>('current');
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const household = await tasksService.getHousehold();
            if (!household) return;

            const [cardsData, dashboardRes, catsData] = await Promise.all([
                creditCardsService.getAll(),
                supabase.rpc('get_financial_dashboard', { target_household_id: household.id }),
                tasksService.getCategories()
            ]);

            setCards(cardsData);
            setCategories(catsData);

            // Fetch current month and previous month transactions
            const allTxs: CreditCardTransaction[] = [];
            for (const card of cardsData) {
                const txs = await creditCardsService.getTransactions(card.id);
                allTxs.push(...txs);
            }
            setAllTransactions(allTxs);

            if (dashboardRes.data) {
                const d = dashboardRes.data;
                setProjection({
                    income: d.total_income,
                    fixed_bills: d.total_bills,
                    immediate_spending: d.total_immediate,
                    card_debt: d.credit_card_balance,
                    final_balance: d.balance,
                    status: d.status
                });
            }
        } catch (error) {
            console.error('[Simulator] Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let filtered = [...allTransactions];

        // Month Filter
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        filtered = filtered.filter(tx => {
            const txDate = new Date(tx.transaction_date + 'T12:00:00');
            if (selectedMonth === 'current') {
                return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
            } else {
                // Simplified previous month logic
                const prevDate = new Date();
                prevDate.setMonth(prevDate.getMonth() - 1);
                return txDate.getMonth() === prevDate.getMonth() && txDate.getFullYear() === prevDate.getFullYear();
            }
        });

        // Category Filter
        if (selectedCategory) {
            filtered = filtered.filter(tx => (tx.category_id || 'outros') === selectedCategory);
        }

        setFilteredTransactions(filtered.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()));
    }, [allTransactions, selectedCategory, selectedMonth]);

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T12:00:00');
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    const getCategoryData = () => {
        const breakdown: Record<string, { total: number, label: string }> = {};
        // Use filtered by month transactions for chart
        const monthTx = allTransactions.filter(tx => {
            const txDate = new Date(tx.transaction_date + 'T12:00:00');
            const now = new Date();
            if (selectedMonth === 'current') {
                return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
            } else {
                const prev = new Date(); prev.setMonth(prev.getMonth() - 1);
                return txDate.getMonth() === prev.getMonth() && txDate.getFullYear() === prev.getFullYear();
            }
        });

        monthTx.forEach(tx => {
            const catId = tx.category_id || 'outros';
            if (!breakdown[catId]) {
                const catInfo = categories.find(c => c.id === catId);
                breakdown[catId] = { total: 0, label: catInfo?.label || 'Outros' };
            }
            breakdown[catId].total += tx.amount;
        });

        return Object.entries(breakdown).map(([id, data]) => ({
            category_id: id,
            label: data.label,
            total: data.total,
            count: monthTx.filter(t => (t.category_id || 'outros') === id).length,
            color: ''
        })).sort((a, b) => b.total - a.total);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="relative mb-6">
                    <div className="w-16 h-16 border-4 border-primary-500/10 border-t-primary-500 rounded-full animate-spin"></div>
                    <Landmark className="absolute inset-0 m-auto w-6 h-6 text-primary-500 animate-pulse" />
                </div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em]">Conectando Open Finance...</p>
            </div>
        );
    }

    const totalSpendingInView = filteredTransactions.reduce((acc, t) => acc + t.amount, 0);

    return (
        <div className="min-h-screen bg-slate-50 pb-32">
            {/* Blue Hero Header */}
            <header className="bg-primary-500 pt-14 pb-20 px-6 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-400/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-20 w-48 h-48 bg-primary-600/20 rounded-full blur-2xl" />

                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-white/20 transition-all"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <p className="text-primary-100 text-[10px] font-bold uppercase tracking-widest">Simulador Consolidado</p>
                            <h1 className="text-white text-2xl font-bold">Open Finance</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5 text-white" />
                        <span className="text-[9px] font-bold uppercase tracking-tighter text-white">Sync Ativo</span>
                    </div>
                </div>
            </header>

            {/* Floating Month Switcher */}
            <div className="px-4 -mt-12 relative z-20 mb-6">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-2 flex gap-2">
                    <button
                        onClick={() => setSelectedMonth('current')}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${selectedMonth === 'current'
                            ? 'bg-primary-500 text-white shadow-md shadow-primary-200'
                            : 'text-slate-500 hover:bg-slate-50'
                            }`}
                    >
                        Mês Atual
                    </button>
                    <button
                        onClick={() => setSelectedMonth('previous')}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${selectedMonth === 'previous'
                            ? 'bg-primary-500 text-white shadow-md shadow-primary-200'
                            : 'text-slate-500 hover:bg-slate-50'
                            }`}
                    >
                        Mês Anterior
                    </button>
                </div>
            </div>

            <div className="px-4 space-y-6">
                {/* Summary Section */}
                <section className="bg-white border border-slate-100 rounded-2xl p-6 overflow-hidden relative shadow-sm">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <Layers className="w-24 h-24 text-primary-500" />
                    </div>

                    <div className="relative z-10">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-3">Total faturas {selectedMonth === 'current' ? 'em andamento' : 'fechadas'}</p>
                        <div className="flex flex-col md:flex-row items-baseline gap-3 mb-6">
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter text-primary-600">
                                {formatCurrency(totalSpendingInView)}
                            </h2>
                            <span className="text-slate-400 text-sm font-medium">Ref. {selectedMonth === 'current' ? 'Janeiro' : 'Dezembro'}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Impacto na Renda</p>
                                <p className="text-lg font-bold text-rose-500">
                                    {projection?.income ? ((totalSpendingInView / projection.income) * 100).toFixed(0) : 0}%
                                </p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Status Projeção</p>
                                <p className={`text-lg font-bold ${projection?.status === 'surplus' ? 'text-emerald-500' : 'text-rose-500'
                                    }`}>
                                    {projection?.status === 'surplus' ? 'No Limite' : 'Crítico'}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Categories Filter Bar */}
                <section className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Filtrar por Categoria</h3>
                        {selectedCategory && (
                            <button onClick={() => setSelectedCategory(null)} className="text-[9px] font-bold uppercase text-rose-500">Limpar</button>
                        )}
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                                className={`flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-all border ${selectedCategory === cat.id
                                    ? 'bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-200'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-primary-200'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Transactions List */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Filter className="w-3.5 h-3.5 text-primary-500" />
                            Extrato Consolidado ({filteredTransactions.length})
                        </h3>
                    </div>

                    <div className="space-y-3">
                        {filteredTransactions.length > 0 ? (
                            filteredTransactions.map(tx => {
                                const card = cards.find(c => c.id === tx.card_id);
                                return (
                                    <div
                                        key={tx.id}
                                        className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between group hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[10px] text-white shadow-sm"
                                                style={{ backgroundColor: card?.color || '#334155' }}
                                            >
                                                {card?.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{tx.title}</p>
                                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                                                    {formatDate(tx.transaction_date)} • {card?.name}
                                                    {tx.installment_total > 1 && <span className="ml-1 text-primary-500">({tx.installment_current}/{tx.installment_total})</span>}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-900">{formatCurrency(tx.amount)}</p>
                                            <div className="flex items-center justify-end gap-1">
                                                <ArrowUpRight className="w-3 h-3 text-rose-500" />
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">Débito</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-16 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                                <Search className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-400 font-medium text-sm">Nenhum gasto encontrado</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Visual Chart Section */}
                <section className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-6 text-center">Consumo por Categoria</p>
                    <SpendingDonutChart data={getCategoryData()} size={180} />
                </section>
            </div>

            <div className="fixed bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
                <button
                    onClick={() => navigate('/credit-cards')}
                    className="w-full h-14 bg-primary-500 hover:bg-primary-600 shadow-lg shadow-primary-200 active:scale-95 rounded-xl flex items-center justify-center gap-3 transition-all group"
                >
                    <RefreshCw className="w-5 h-5 text-white group-hover:rotate-180 transition-transform duration-500" />
                    <span className="text-sm font-bold uppercase tracking-widest text-white">Sincronizar Bancos</span>
                </button>
            </div>
        </div>
    );
};
