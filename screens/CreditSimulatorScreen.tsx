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
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="relative mb-6">
                    <div className="w-16 h-16 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin"></div>
                    <Landmark className="absolute inset-0 m-auto w-6 h-6 text-cyan-500 animate-pulse" />
                </div>
                <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em]">Conectando Open Finance...</p>
            </div>
        );
    }

    const totalSpendingInView = filteredTransactions.reduce((acc, t) => acc + t.amount, 0);

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-32">
            <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-cyan-600/10 via-blue-600/5 to-transparent pointer-events-none" />

            <header className="relative px-6 pt-12 pb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-300" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black tracking-tight">Open Finance</h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Simulador Consolidado</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[9px] font-black uppercase tracking-tighter text-emerald-500">Sync Ativo</span>
                </div>
            </header>

            {/* Month Switcher */}
            <div className="px-6 mb-8 flex gap-2">
                <button
                    onClick={() => setSelectedMonth('current')}
                    className={`flex-1 py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedMonth === 'current'
                            ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-600/20'
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}
                >
                    Mês Atual
                </button>
                <button
                    onClick={() => setSelectedMonth('previous')}
                    className={`flex-1 py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedMonth === 'previous'
                            ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-600/20'
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}
                >
                    Mês Anterior
                </button>
            </div>

            <div className="px-6 space-y-8">
                {/* Summary Section */}
                <section className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[32px] p-8 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Layers className="w-32 h-32" />
                    </div>

                    <div className="relative z-10 text-center md:text-left">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4">Total faturas {selectedMonth === 'current' ? 'em andamento' : 'fechadas'}</p>
                        <div className="flex flex-col md:flex-row items-baseline gap-3 mb-8">
                            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-cyan-400">
                                {formatCurrency(totalSpendingInView)}
                            </h2>
                            <span className="text-slate-500 text-sm font-bold">Ref. {selectedMonth === 'current' ? 'Janeiro' : 'Dezembro'}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                                <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Impacto na Renda</p>
                                <p className="text-lg font-black text-rose-400">
                                    {projection?.income ? ((totalSpendingInView / projection.income) * 100).toFixed(0) : 0}%
                                </p>
                            </div>
                            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                                <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Status Projeção</p>
                                <p className={`text-lg font-black ${projection?.status === 'surplus' ? 'text-emerald-400' : 'text-rose-400'
                                    }`}>
                                    {projection?.status === 'surplus' ? 'No Limite' : 'Crítico'}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Categories Filter Bar */}
                <section className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Filtrar por Categoria</h3>
                        {selectedCategory && (
                            <button onClick={() => setSelectedCategory(null)} className="text-[9px] font-black uppercase text-rose-500">Limpar</button>
                        )}
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                                className={`flex-shrink-0 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border ${selectedCategory === cat.id
                                        ? 'bg-white text-slate-950 border-white shadow-xl shadow-white/10'
                                        : 'bg-slate-900 border-slate-800 text-slate-400'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Transactions List */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Filter className="w-3.5 h-3.5 text-cyan-500" />
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
                                        className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-4 flex items-center justify-between group hover:border-slate-700 transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] text-white shadow-lg"
                                                style={{ backgroundColor: card?.color || '#334155' }}
                                            >
                                                {card?.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white">{tx.title}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                    {formatDate(tx.transaction_date)} • {card?.name}
                                                    {tx.installment_total > 1 && <span className="ml-1 text-cyan-500">({tx.installment_current}/{tx.installment_total})</span>}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-white">{formatCurrency(tx.amount)}</p>
                                            <div className="flex items-center justify-end gap-1">
                                                <ArrowUpRight className="w-3 h-3 text-rose-500" />
                                                <span className="text-[9px] font-black text-slate-500 uppercase">Débito</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-[32px]">
                                <Search className="w-10 h-10 text-slate-800 mx-auto mb-4" />
                                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Nenhum gasto encontrado</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Visual Chart Section */}
                <section className="bg-slate-900 border border-slate-800 rounded-[32px] p-8">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-6 text-center">Consumo por Categoria</p>
                    <SpendingDonutChart data={getCategoryData()} size={180} />
                </section>
            </div>

            <div className="fixed bottom-0 inset-x-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
                <button
                    onClick={() => navigate('/credit-cards')}
                    className="w-full h-16 bg-cyan-600 hover:bg-cyan-500 shadow-xl shadow-cyan-600/20 active:scale-95 rounded-2xl flex items-center justify-center gap-3 transition-all group"
                >
                    <RefreshCw className="w-5 h-5 text-white group-hover:rotate-180 transition-transform duration-500" />
                    <span className="text-sm font-black uppercase tracking-[0.2em] text-white">Sincronizar Bancos</span>
                </button>
            </div>
        </div>
    );
};
