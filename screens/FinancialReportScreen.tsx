import React, { useState, useEffect } from 'react';
import {
    ChevronLeft, CreditCard, ArrowUpCircle, ArrowDownCircle,
    Calendar, Zap, Home, Car, Utensils, ShoppingBag,
    Heart, Plane, Landmark, MoreHorizontal, FileText,
    Download, Share2, Receipt, Clock, Sparkles, TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { tasksService, Task, Category, Household } from '../services/tasks';
import { budgetLimitsService, BudgetLimit } from '../services/financial';
import { Skeleton } from '../components/Skeleton';

// Icon Map for grouping
const ICON_MAP: Record<string, any> = {
    'food': Utensils,
    'transport': Car,
    'shopping': ShoppingBag,
    'home': Home,
    'utilities': Zap,
    'health': Heart,
    'leisure': Plane,
    'vehicle': Car,
    'taxes': Landmark,
    'salary': ArrowUpCircle,
    'bill': Receipt,
    'immediate': Zap
};

export const FinancialReportScreen: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [household, setHousehold] = useState<Household | null>(null);
    const [dashboard, setDashboard] = useState<any>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [cards, setCards] = useState<any[]>([]);
    const [incomes, setIncomes] = useState<any[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
    const [budgets, setBudgets] = useState<BudgetLimit[]>([]);
    const [comparison, setComparison] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const h = await tasksService.getHousehold();
            setHousehold(h);
            if (!h) return;

            const [dashRes, tasksRes, cardsRes, incomesRes, catsRes, budgetsRes, compRes] = await Promise.all([
                supabase.rpc('get_financial_dashboard', { target_household_id: h.id }),
                tasksService.getUserTasks(),
                supabase.from('credit_cards').select('*').eq('household_id', h.id),
                supabase.from('incomes').select('*').eq('household_id', h.id),
                tasksService.getCategories(),
                budgetLimitsService.getAll(),
                supabase.rpc('get_financial_comparison', { target_household_id: h.id })
            ]);

            setDashboard(Array.isArray(dashRes.data) ? dashRes.data[0] : dashRes.data);
            setTasks(tasksRes);
            setCards(cardsRes.data || []);
            setIncomes(incomesRes.data || []);
            setCategories(catsRes);
            setBudgets(budgetsRes);
            setComparison(compRes.data);
        } catch (error) {
            console.error('[Report] Load fail:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number | undefined | null) =>
        (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const monthName = new Date().toLocaleString('pt-BR', { month: 'long' });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    if (loading) {
        return (
            <div className="min-h-screen bg-surface p-6 space-y-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-40 rounded-3xl" />
                <Skeleton className="h-64 rounded-3xl" />
            </div>
        );
    }

    // Grouping logic
    const fixedExpenses = tasks.filter(t => t.entry_type === 'bill');
    const variableExpenses = tasks.filter(t => t.entry_type === 'immediate' || t.entry_type === 'expense');

    return (
        <div className="min-h-screen bg-slate-50 pb-24 text-slate-900">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 px-6 py-6 sticky top-0 z-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black tracking-tight">Fatura Geral</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{capitalizedMonth} 2026</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            import('react-hot-toast').then(t => t.default.success('Gerando PDF detalhado...'));
                        }}
                        className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => {
                            import('react-hot-toast').then(t => t.default.success('Preparando planilha Excel...'));
                        }}
                        className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="p-6 space-y-6">
                {/* 1. Summary Card */}
                <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Receipt className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-2">Saldo Projetado</p>
                        <h2 className="text-4xl font-black mb-6">{formatCurrency(dashboard?.balance)}</h2>

                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                            <div>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Total Entradas</p>
                                <p className="text-lg font-bold text-emerald-400">{formatCurrency(dashboard?.total_income)}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Total Saídas</p>
                                <p className="text-lg font-bold text-rose-400">-{formatCurrency(dashboard?.total_expenses)}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. Incomes Breakdown */}
                <section>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-2">
                            <ArrowUpCircle className="w-5 h-5 text-emerald-500" />
                            <h3 className="font-bold text-slate-800">Entradas</h3>
                            {(() => {
                                const curr = comparison?.current?.total_income || 0;
                                const prev = comparison?.previous?.total_income || 0;
                                if (prev === 0) return null;
                                const diff = ((curr - prev) / prev) * 100;
                                const isUp = diff >= 0;
                                return (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                        {isUp ? '▲' : '▼'} {Math.abs(Math.round(diff))}%
                                    </span>
                                );
                            })()}
                        </div>
                        <p className="text-sm font-black text-emerald-600">
                            {formatCurrency(incomes.reduce((acc, curr) => acc + parseFloat(curr.amount_monthly?.toString() || '0'), 0))}
                        </p>
                    </div>
                    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
                        {incomes.map(income => (
                            <div key={income.id} className="p-4 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                        <ArrowUpCircle className="w-5 h-5" />
                                    </div>
                                    <p className="font-bold text-slate-700">{income.name}</p>
                                </div>
                                <p className="font-black text-emerald-600">{formatCurrency(income.amount_monthly)}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 3. Fixed Expenses (Bills) */}
                <section>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-2">
                            <Home className="w-5 h-5 text-primary-500" />
                            <h3 className="font-bold text-slate-800">Contas Fixas & Parcelas</h3>
                            {(() => {
                                const curr = comparison?.current?.total_fixed || 0;
                                const prev = comparison?.previous?.total_fixed || 0;
                                if (prev === 0) return null;
                                const diff = ((curr - prev) / prev) * 100;
                                const isDown = diff <= 0;
                                return (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDown ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                        {isDown ? '▼' : '▲'} {Math.abs(Math.round(diff))}%
                                    </span>
                                );
                            })()}
                        </div>
                        <p className="text-sm font-black text-slate-900">
                            {formatCurrency(fixedExpenses.reduce((acc, curr) => acc + parseFloat(curr.amount?.toString() || '0'), 0))}
                        </p>
                    </div>
                    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
                        {fixedExpenses.length === 0 ? (
                            <p className="p-8 text-center text-slate-400 text-sm">Nenhuma conta fixa este mês</p>
                        ) : fixedExpenses.map(bill => (
                            <div key={bill.id} className="p-4 flex justify-between items-center group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bill.status === 'completed' ? 'bg-slate-50 text-slate-400' : 'bg-primary-50 text-primary-500'}`}>
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-700">{bill.title}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {bill.status === 'completed' ? 'Paga ✅' : `Vence ${new Date(bill.due_date!).toLocaleDateString('pt-BR')}`}
                                        </p>
                                    </div>
                                </div>
                                <p className={`font-black ${bill.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{formatCurrency(bill.amount)}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 4. Credit Cards */}
                <section>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-purple-500" />
                            <h3 className="font-bold text-slate-800">Cartões de Crédito</h3>
                        </div>
                        <p className="text-sm font-black text-purple-600">
                            {formatCurrency(cards.reduce((acc, curr) => acc + parseFloat(curr.current_balance?.toString() || '0'), 0))}
                        </p>
                    </div>
                    <div className="grid gap-3">
                        {cards.map(card => (
                            <div key={card.id} className="bg-white rounded-3xl p-5 border border-slate-100 flex justify-between items-center shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
                                        style={{ backgroundColor: card.color || '#8B5CF6' }}
                                    >
                                        <CreditCard className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{card.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Final {card.last_four_digits}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-rose-500">{formatCurrency(card.current_balance)}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Atual</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 5. Daily/Variable Expenses - Grouped & Expandable */}
                <section>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-500" />
                            <h3 className="font-bold text-slate-800">Gastos Variáveis / Dia</h3>
                            {(() => {
                                const curr = comparison?.current?.total_variable || 0;
                                const prev = comparison?.previous?.total_variable || 0;
                                if (prev === 0) return null;
                                const diff = ((curr - prev) / prev) * 100;
                                const isDown = diff <= 0;
                                return (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDown ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                        {isDown ? '▼' : '▲'} {Math.abs(Math.round(diff))}%
                                    </span>
                                );
                            })()}
                        </div>
                        <p className="text-sm font-black text-amber-600">
                            {formatCurrency(variableExpenses.reduce((acc, curr) => acc + parseFloat(curr.amount?.toString() || '0'), 0))}
                        </p>
                    </div>

                    <div className="space-y-3">
                        {variableExpenses.length === 0 ? (
                            <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center text-slate-400 text-sm">
                                Nenhum gasto variável registrado
                            </div>
                        ) : (() => {
                            // Grouping
                            const grouped: Record<string, { total: number, items: Task[] }> = {};
                            variableExpenses.forEach(exp => {
                                const catId = exp.category_id || 'outros';
                                if (!grouped[catId]) grouped[catId] = { total: 0, items: [] };
                                grouped[catId].total += parseFloat(exp.amount?.toString() || '0');
                                grouped[catId].items.push(exp);
                            });

                            return Object.entries(grouped).map(([catId, data]) => {
                                const isExpanded = expandedCategories.includes(catId);
                                const toggleExpand = () => {
                                    setExpandedCategories(prev =>
                                        prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
                                    );
                                };

                                const getCategoryLabel = (id: string) => {
                                    const cat = categories.find(c => c.id === id);
                                    if (cat) return cat.label;
                                    const fallbacks: Record<string, string> = {
                                        'food': 'Alimentação', 'transport': 'Transporte', 'shopping': 'Compras',
                                        'home': 'Casa', 'utilities': 'Contas', 'health': 'Saúde',
                                        'leisure': 'Lazer', 'vehicle': 'Veículo', 'outros': 'Outros'
                                    };
                                    return fallbacks[id] || id;
                                };

                                const Icon = ICON_MAP[catId] || MoreHorizontal;

                                return (
                                    <div key={catId} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden transition-all shadow-sm">
                                        {/* Category Header */}
                                        <button
                                            onClick={toggleExpand}
                                            className="w-full p-5 flex justify-between items-center hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 shadow-inner">
                                                    <Icon className="w-6 h-6" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-bold text-slate-800 text-[15px]">{getCategoryLabel(catId)}</p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{data.items.length} itens</p>
                                                        {(() => {
                                                            const limit = budgets.find(b => b.category_id === catId || (catId === 'outros' && !b.category_id));
                                                            if (!limit) return null;
                                                            const percent = (data.total / limit.limit_amount) * 100;
                                                            return (
                                                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${percent > 90 ? 'text-rose-600 border-rose-100 bg-rose-50' :
                                                                    percent > 70 ? 'text-amber-600 border-amber-100 bg-amber-50' :
                                                                        'text-emerald-600 border-emerald-100 bg-emerald-50'
                                                                    }`}>
                                                                    {Math.round(percent)}% do teto
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="font-black text-slate-900">{formatCurrency(data.total)}</p>
                                                    {(() => {
                                                        const limit = budgets.find(b => b.category_id === catId || (catId === 'outros' && !b.category_id));
                                                        if (!limit) return null;
                                                        return (
                                                            <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                                                <div
                                                                    className={`h-full transition-all duration-1000 ${(data.total / limit.limit_amount) > 0.9 ? 'bg-rose-500' :
                                                                        (data.total / limit.limit_amount) > 0.7 ? 'bg-amber-500' :
                                                                            'bg-emerald-500'
                                                                        }`}
                                                                    style={{ width: `${Math.min((data.total / limit.limit_amount) * 100, 100)}%` }}
                                                                />
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                                <ChevronLeft className={`w-5 h-5 text-slate-300 transition-transform ${isExpanded ? '-rotate-90' : ''}`} />
                                            </div>
                                        </button>

                                        {/* Detailed List */}
                                        {isExpanded && (
                                            <div className="bg-slate-50/50 px-5 pb-5 pt-2 border-t border-slate-50 space-y-3">
                                                {data.items.map(item => (
                                                    <div key={item.id} className="flex justify-between items-center p-3 bg-white rounded-2xl border border-slate-100/50 shadow-sm animate-in fade-in slide-in-from-top-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-2 h-2 rounded-full bg-amber-400" />
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-700">{item.title}</p>
                                                                <p className="text-[10px] text-slate-400 font-medium">
                                                                    {new Date(item.purchase_date || item.created_at).toLocaleDateString('pt-BR')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm font-black text-slate-900">{formatCurrency(item.amount)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </section>

                {/* 6. Smart Recommendation Card */}
                {
                    dashboard?.balance > 0 && dashboard?.overdue_count === 0 && (
                        <section className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-[2.5rem] p-6 text-white shadow-xl shadow-primary-900/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-10">
                                    <Sparkles className="w-16 h-16 text-white" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                            <TrendingUp className="w-6 h-6 text-white" />
                                        </div>
                                        <h4 className="font-bold">Oportunidade Detectada</h4>
                                    </div>
                                    <p className="text-sm text-primary-50/80 mb-6 leading-relaxed">
                                        Identificamos um saldo livre de <span className="font-black text-white">{formatCurrency(dashboard.balance)}</span> projetado para este mês.
                                        Que tal mover <span className="font-bold text-white">R$ 300,00</span> para sua **Reserva de Emergência** agora?
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => navigate('/savings')}
                                            className="flex-1 bg-white text-primary-700 py-3 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all"
                                        >
                                            Poupar Agora
                                        </button>
                                        <button className="px-4 py-3 rounded-2xl bg-white/10 font-bold text-sm border border-white/10">
                                            Ignorar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )
                }
            </div >

            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 flex items-center justify-between z-50">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Resultado do Mês</p>
                    <p className={`text-xl font-black ${dashboard?.balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {formatCurrency(dashboard?.balance)}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/assistant')}
                    className="bg-primary-500 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
                >
                    Análise com IA
                </button>
            </div>
        </div >
    );
};
