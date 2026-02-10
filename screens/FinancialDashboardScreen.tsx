import React, { useState, useEffect } from 'react';
import {
    Wallet, ArrowUpCircle, ArrowDownCircle, Plus, Calendar, ChevronRight,
    TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock, CreditCard,
    PiggyBank, Target, BarChart3, Zap, ArrowRight, Bell, Sparkles, LineChart, Landmark, RefreshCw,
    Car, FileText, ShieldCheck, Utensils, ShoppingBag, Home, Heart, Plane, DollarSign, MoreHorizontal, Receipt
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { tasksService, Category, Task } from '../services/tasks';
import { budgetLimitsService } from '../services/financial';
import { IncomeRegistrationModal } from '../components/IncomeRegistrationModal';
import { SpendingDonutChart, MonthlyBarChart } from '../components/charts/SpendingChart';
import { BudgetAlertBanner, BudgetAlert } from '../components/BudgetAlertBanner';
import { CountUp } from '../components/CountUp';
import { Skeleton } from '../components/Skeleton';

interface DashboardData {
    total_income: number;
    total_bills: number;
    total_immediate: number;
    balance: number;
    status: 'surplus' | 'warning' | 'deficit';
    overdue_count: number;
    today_count: number;
    week_count: number;
    week_total: number;
    credit_card_balance: number;
    savings_total: number;
    risk_level: 'low' | 'medium' | 'high';
}

interface CategorySpending {
    category_id: string;
    total: number;
    count: number;
}

export const FinancialDashboardScreen: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [spending, setSpending] = useState<CategorySpending[]>([]);
    const [upcomingBills, setUpcomingBills] = useState<Task[]>([]);
    const [overdueBills, setOverdueBills] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
    const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>([]);
    const [monthlyData, setMonthlyData] = useState<{ month: string; income: number; expense: number }[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const household = await tasksService.getHousehold();
            if (!household) return;

            // Define dates for filtering used in parallel fetches
            const todayStr = new Date().toISOString().split('T')[0];
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);

            // Parallel data fetching
            const [dashboardRes, tasksRes, catsRes, spendingRes, evolutionData] = await Promise.all([
                supabase.rpc('get_financial_dashboard', { target_household_id: household.id }),
                tasksService.getUserTasks(),
                tasksService.getCategories(),
                supabase.rpc('get_spending_by_category', {
                    target_household_id: household.id,
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: todayStr
                }),
                tasksService.getMonthlyEvolution()
            ]);

            if (catsRes) setCategories(catsRes);
            if (spendingRes.data) setSpending(spendingRes.data || []);
            setMonthlyData(evolutionData);

            let dashboardData: any = null;
            if (dashboardRes.data) {
                dashboardData = Array.isArray(dashboardRes.data) ? dashboardRes.data[0] : dashboardRes.data;
                setDashboard(dashboardData);
            }

            // Define week date for filtering
            const weekFromNow = new Date();
            weekFromNow.setDate(new Date().getDate() + 7);
            const weekStr = weekFromNow.toISOString().split('T')[0];

            // Load budget alerts using RPC
            const alerts = await budgetLimitsService.checkAlerts(household.id);
            setBudgetAlerts(alerts || []);

            // Process overdue and upcoming tasks from tasksRes
            const getAmount = (a: string | number | undefined): number =>
                typeof a === 'number' ? a : parseFloat(a || '0');

            const getEffectiveDate = (t: Task) => {
                const raw = t.due_date || t.purchase_date || t.created_at || '';
                return raw.split('T')[0].split(' ')[0];
            };

            const overdue = tasksRes.filter(t => {
                const date = getEffectiveDate(t);
                return date < todayStr && t.status !== 'completed' && getAmount(t.amount) > 0;
            });

            const upcoming = tasksRes.filter(t => {
                const date = getEffectiveDate(t);
                return date >= todayStr && date <= weekStr && t.status !== 'completed' && getAmount(t.amount) > 0;
            }).sort((a, b) => {
                const dateA = new Date(getEffectiveDate(a)).getTime() || 0;
                const dateB = new Date(getEffectiveDate(b)).getTime() || 0;
                return dateA - dateB;
            });

            setOverdueBills(overdue.slice(0, 3));
            setUpcomingBills(upcoming.slice(0, 5));
        } catch (error) {
            console.error('[Financial] Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number | undefined | null) =>
        (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const formatDate = (dateStr: string | undefined | null) => {
        if (!dateStr) return 'Sem data';
        // Handle ISO strings or simple date strings
        const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        const date = new Date(cleanDate + 'T12:00:00'); // Use noon to avoid timezone shifts
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dateAtMidnight = new Date(date);
        dateAtMidnight.setHours(0, 0, 0, 0);

        if (dateAtMidnight.getTime() === today.getTime()) return 'Hoje';
        if (dateAtMidnight.getTime() === tomorrow.getTime()) return 'Amanhã';
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    const getCategoryLabel = (id: string) => {
        // First try to find in DB categories
        const cat = categories.find(c => c.id === id);
        if (cat) return cat.label;

        // Fallback map for legacy or missing cats
        const map: Record<string, string> = {
            'home': 'Casa/Moradia',
            'housing': 'Moradia',
            'transport': 'Transporte',
            'food': 'Alimentação',
            'health': 'Saúde',
            'leisure': 'Lazer',
            'education': 'Educação',
            'utilities': 'Utilidades/Contas',
            'vehicle': 'Veículo',
            'shopping': 'Compras',
            'taxes': 'Impostos',
            'contracts': 'Contratos',
            'documents': 'Documentos',
            'outros': 'Outros'
        };
        return map[id] || id;
    };

    const getRiskConfig = (level: string) => {
        switch (level) {
            case 'high': return { bg: 'bg-rose-100', text: 'text-rose-600', label: 'Risco Alto', icon: AlertTriangle };
            case 'medium': return { bg: 'bg-amber-100', text: 'text-amber-600', label: 'Atenção', icon: Bell };
            default: return { bg: 'bg-emerald-100', text: 'text-emerald-600', label: 'Estável', icon: CheckCircle2 };
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface pb-24 overflow-x-hidden">
                <header className="bg-primary-500 pt-14 pb-24 px-6 relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-400/30 rounded-full blur-3xl" />
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <Skeleton className="w-24 h-4 mb-2 bg-white/20" />
                            <Skeleton className="w-48 h-10 bg-white/20" />
                        </div>
                        <Skeleton className="w-10 h-10 rounded-xl bg-white/20" />
                    </div>
                </header>
                <div className="px-4 -mt-20 relative z-20">
                    <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-100">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <Skeleton className="h-24 rounded-2xl" />
                            <Skeleton className="h-24 rounded-2xl" />
                        </div>
                        <Skeleton className="h-12 rounded-xl" />
                    </div>
                </div>
                <div className="px-4 mt-6 space-y-4">
                    <Skeleton className="h-32 rounded-2xl" />
                    <Skeleton className="h-48 rounded-2xl" />
                </div>
            </div>
        );
    }

    const riskConfig = getRiskConfig(dashboard?.risk_level || 'low');
    const RiskIcon = riskConfig.icon;
    const totalSpending = spending.reduce((acc, s) => acc + s.total, 0);

    return (
        <div className="min-h-screen bg-surface pb-24 text-text-primary">
            {/* ═══════════════════════════════════════════════════════════════
                HERO: Blue Gradient Header
            ═══════════════════════════════════════════════════════════════ */}
            <header className="bg-primary-500 pt-14 pb-24 px-6 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-400/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-20 w-48 h-48 bg-primary-600/20 rounded-full blur-2xl" />

                <div className="flex justify-between items-start relative z-10 mb-4">
                    <div>
                        <p className="text-primary-100 text-[10px] font-bold uppercase tracking-widest mb-1">Dashboard</p>
                        <h1 className="text-white text-2xl font-bold">Visão Financeira</h1>
                    </div>
                    <button
                        onClick={() => loadData()}
                        className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm text-white/80 hover:bg-white/20 flex items-center justify-center transition-all active:rotate-180 duration-700"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>

                {/* Risk Badge */}
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${riskConfig.bg} border border-white/50 shadow-sm`}>
                    <RiskIcon className={`w-4 h-4 ${riskConfig.text}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${riskConfig.text}`}>
                        Saúde {riskConfig.label}
                    </span>
                </div>
            </header>

            {/* ═══════════════════════════════════════════════════════════════
                FLOATING SUMMARY CARD
            ═══════════════════════════════════════════════════════════════ */}
            <div className="px-4 -mt-16 relative z-20">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
                    {/* Balance Display */}
                    <div className="p-6 pb-4">
                        <p className="text-slate-500 text-sm font-medium mb-2">Saldo Projetado (Mês)</p>
                        <h2 className={`text-4xl font-black tracking-tight ${dashboard?.status === 'surplus' ? 'text-emerald-500' :
                            dashboard?.status === 'warning' ? 'text-amber-500' : 'text-rose-500'
                            }`}>
                            {dashboard ? <CountUp value={dashboard.balance} formatter={formatCurrency} /> : 'R$ 0,00'}
                        </h2>
                    </div>

                    {/* Income/Expense Cards */}
                    <div className="grid grid-cols-2 gap-3 px-4 pb-4">
                        {/* ENTRADAS - VERDE */}
                        <button
                            onClick={() => navigate('/incomes')}
                            className="bg-green-50 hover:bg-green-100 rounded-2xl p-4 text-left transition-all active:scale-98 group"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <ArrowUpCircle className="w-4 h-4 text-green-600" />
                                <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Entradas</span>
                            </div>
                            <p className="text-lg font-black text-slate-800">
                                {dashboard ? formatCurrency(dashboard.total_income) : 'R$ 0'}
                            </p>
                        </button>

                        {/* SAÍDAS - VERMELHO */}
                        <button
                            onClick={() => navigate('/expenses')}
                            className="bg-red-50 hover:bg-red-100 rounded-2xl p-4 text-left transition-all active:scale-98 group"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <ArrowDownCircle className="w-4 h-4 text-red-500" />
                                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Saídas</span>
                            </div>
                            <p className="text-lg font-black text-slate-800">
                                {dashboard ? formatCurrency(dashboard.total_commitments) : 'R$ 0'}
                            </p>
                        </button>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                QUICK ACCESS SECTION — Circular Icons
            ═══════════════════════════════════════════════════════════════ */}
            <section className="px-6 mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-slate-800 text-lg">Atalhos</h2>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    <QuickAccessButton icon={ShieldCheck} label="Imposto" onClick={() => navigate('/tax-declaration')} />
                    <QuickAccessButton icon={CreditCard} label="Cartões" onClick={() => navigate('/credit-cards')} />
                    <QuickAccessButton icon={PiggyBank} label="Cofrinhos" onClick={() => navigate('/savings')} />
                    <QuickAccessButton icon={TrendingUp} label="Investir" onClick={() => navigate('/investments')} />
                </div>

                {/* Action Buttons - Integrated */}
                <div className="grid grid-cols-2 gap-3 mt-5">
                    <button
                        onClick={() => navigate('/new-task', { state: { type: 'immediate' } })}
                        className="bg-primary-500 hover:bg-primary-600 p-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 group shadow-lg shadow-primary-500/20"
                    >
                        <Plus className="w-5 h-5 text-white" />
                        <span className="text-xs font-bold uppercase text-white tracking-wide">Gasto do Dia</span>
                    </button>
                    <button
                        onClick={() => navigate('/new-task')}
                        className="bg-white border border-slate-200 hover:border-primary-300 p-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-sm"
                    >
                        <Calendar className="w-5 h-5 text-slate-500" />
                        <span className="text-xs font-bold uppercase text-slate-600 tracking-wide">Nova Conta</span>
                    </button>
                </div>
            </section>

            <div className="px-6 space-y-6 mt-6">
                {/* ═══════════════════════════════════════════════════════════════
                    SIMULATOR & QUICK STATS
                ═══════════════════════════════════════════════════════════════ */}
                <button
                    onClick={() => navigate('/open-finance')}
                    className="w-full bg-gradient-to-br from-primary-500 to-primary-700 p-6 rounded-3xl flex items-center justify-between shadow-xl shadow-primary-500/20 group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Landmark className="w-16 h-16 text-white" />
                    </div>
                    <div className="flex items-center gap-4 relative z-10 text-left">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                            <Sparkles className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-white">Open Finance</p>
                            <p className="text-xs text-primary-100 font-medium opacity-80">Consolide seus cartões e limites</p>
                        </div>
                    </div>
                    <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="grid grid-cols-3 gap-3">
                    <div className="card p-4 text-center group">
                        <p className="text-2xl font-black text-rose-500 animate-pulse">{dashboard?.overdue_count || 0}</p>
                        <p className="text-[9px] text-text-muted font-black uppercase tracking-widest mt-1">Vencidas</p>
                    </div>
                    <div className="card p-4 text-center group">
                        <p className="text-2xl font-black text-amber-500">{dashboard?.today_count || 0}</p>
                        <p className="text-[9px] text-text-muted font-black uppercase tracking-widest mt-1">Hoje</p>
                    </div>
                    <div className="card p-4 text-center group">
                        <p className="text-2xl font-black text-emerald-500">{dashboard?.week_count || 0}</p>
                        <p className="text-[9px] text-text-muted font-black uppercase tracking-widest mt-1">7 Dias</p>
                    </div>
                </div>

                <div className="px-6 mt-6">
                    <button
                        onClick={() => navigate('/financial-report')}
                        className="w-full bg-slate-100 hover:bg-slate-200 p-4 rounded-2xl flex items-center justify-between transition-all group border border-slate-200/50 shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-slate-600 shadow-sm group-hover:scale-105 transition-transform">
                                <Receipt className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-slate-800">Relatório Consolidado</p>
                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Breackdown completo do mês</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                BUDGET ALERTS (If any)
            ═══════════════════════════════════════════════════════════════ */}
                {budgetAlerts.length > 0 && (
                    <section className="px-6 mt-6">
                        <BudgetAlertBanner alerts={budgetAlerts} compact={budgetAlerts.length > 2} />
                    </section>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                OVERDUE BILLS (If any)
            ═══════════════════════════════════════════════════════════════ */}
                {overdueBills.length > 0 && (
                    <section className="px-6 mt-8">
                        <div className="bg-rose-50 border border-rose-100 rounded-[2.5rem] p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-200">
                                        <AlertTriangle className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-[0.1em] text-rose-600">
                                        Contas Vencidas ({overdueBills.length})
                                    </h3>
                                </div>
                                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest bg-rose-100/50 px-3 py-1 rounded-full">Atenção</span>
                            </div>
                            <div className="space-y-4">
                                {overdueBills.map(bill => (
                                    <div
                                        key={bill.id}
                                        onClick={() => navigate(`/detail/${bill.id}`)}
                                        className="flex justify-between items-center p-4 bg-white rounded-3xl cursor-pointer hover:shadow-md hover:border-rose-200 border border-transparent transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all shadow-inner">
                                                <Clock className="w-6 h-6 text-rose-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[15px] font-bold text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-1">
                                                    {bill.title}
                                                </p>
                                                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                                    Venceu em <span className="text-rose-500 font-bold">{formatDate(bill.due_date)}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-lg font-black text-slate-800">
                                                    {formatCurrency(typeof bill.amount === 'number' ? bill.amount : parseFloat(bill.amount || '0'))}
                                                </p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">A pagar</p>
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-500 transition-all">
                                                <ChevronRight className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    UPCOMING BILLS
                ═══════════════════════════════════════════════════════════════ */}
                <section>
                    <div className="flex justify-between items-center mb-5 px-1">
                        <h3 className="text-lg font-black text-text-primary tracking-tight">Próximos Vencimentos</h3>
                        <button onClick={() => navigate('/agenda')} className="text-[10px] font-black text-primary-600 hover:text-primary-700 transition-colors uppercase tracking-[0.2em]">Agenda completa</button>
                    </div>

                    <div className="space-y-4">
                        {upcomingBills.length === 0 ? (
                            <div className="card p-10 text-center">
                                <CheckCircle2 className="w-14 h-14 text-emerald-200 mx-auto mb-4" />
                                <p className="text-text-secondary text-sm font-bold">Você está em dia!</p>
                            </div>
                        ) : (
                            upcomingBills.map(bill => (
                                <div
                                    key={bill.id}
                                    onClick={() => navigate(`/detail/${bill.id}`)}
                                    className="card p-5 mt-1 flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-primary-50 text-text-muted group-hover:bg-primary-500 group-hover:text-white transition-all flex items-center justify-center shadow-sm">
                                            <Clock className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <p className="font-black text-text-primary group-hover:text-primary-600 transition-colors">{bill.title}</p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <Calendar className="w-3 h-3 text-text-muted" />
                                                <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider">{formatDate(bill.due_date)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-text-primary tracking-tight">{formatCurrency(parseFloat(bill.amount?.toString() || '0'))}</p>
                                        <div className="flex items-center justify-end gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[9px] font-black text-primary-600 uppercase">Pagar</span>
                                            <ChevronRight className="w-3 h-3 text-primary-600" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════════
                    SPENDING BY CATEGORY
                ═══════════════════════════════════════════════════════════════ */}
                <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Gastos por Categoria</h3>
                            <p className="text-xs text-slate-400 font-medium">Últimos 30 dias</p>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-slate-400" />
                        </div>
                    </div>

                    {spending.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-slate-400 text-sm italic">Nenhum gasto registrado</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-slate-50/50 rounded-2xl p-4">
                                <SpendingDonutChart
                                    data={spending.map((cat, idx) => {
                                        const colors = ['#00AEEF', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#64748b'];
                                        return {
                                            category_id: cat.category_id,
                                            label: getCategoryLabel(cat.category_id),
                                            total: cat.total,
                                            count: cat.count,
                                            color: colors[idx % colors.length]
                                        };
                                    })}
                                    size={180}
                                    showLegend={true}
                                />
                            </div>

                            {/* Detailed Category List */}
                            <div className="mt-8 space-y-4">
                                {spending.map((cat, idx) => {
                                    const totalSpending = spending.reduce((acc, curr) => acc + curr.total, 0);
                                    const colors = ['#00AEEF', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#64748b'];
                                    const color = colors[idx % colors.length];
                                    const percentage = totalSpending > 0 ? (cat.total / totalSpending) * 100 : 0;

                                    // Dynamic Category Icon Resolver
                                    const getCatIcon = (id: string) => {
                                        const map: Record<string, any> = {
                                            'food': Utensils,
                                            'transport': Car,
                                            'shopping': ShoppingBag,
                                            'home': Home,
                                            'utilities': Zap,
                                            'health': Heart,
                                            'leisure': Plane,
                                            'vehicle': Car,
                                            'taxes': Landmark,
                                            'contracts': ShieldCheck,
                                            'documents': FileText,
                                            'salary': DollarSign,
                                            'outros': MoreHorizontal
                                        };
                                        return map[id] || MoreHorizontal;
                                    };
                                    const Icon = getCatIcon(cat.category_id);

                                    return (
                                        <div key={cat.category_id} className="flex items-center gap-4 group">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                                                style={{ backgroundColor: `${color}15`, color: color }}
                                            >
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <p className="text-sm font-bold text-slate-700 truncate">
                                                        {getCategoryLabel(cat.category_id)}
                                                    </p>
                                                    <p className="text-sm font-black text-slate-900">
                                                        {formatCurrency(cat.total)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-1000"
                                                            style={{ backgroundColor: color, width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400 w-8 text-right">
                                                        {percentage.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </section>

                {/* ═══════════════════════════════════════════════════════════════
                    MONTHLY EVOLUTION
                ═══════════════════════════════════════════════════════════════ */}
                {monthlyData.length > 0 && (
                    <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Evolução Mensal</h3>
                                <p className="text-xs text-slate-400 font-medium">Dinâmica de entradas e saídas</p>
                            </div>
                            <div className="p-2 bg-slate-50 rounded-lg">
                                <LineChart className="w-5 h-5 text-slate-400" />
                            </div>
                        </div>
                        <div className="h-64 mt-4">
                            <MonthlyBarChart data={monthlyData} height={200} />
                        </div>
                        <div className="flex justify-center gap-6 mt-6">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Receitas</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Despesas</span>
                            </div>
                        </div>
                    </section>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    AI ANALYSIS
                ═══════════════════════════════════════════════════════════════ */}
                <section className="bg-gradient-to-br from-primary-500/5 to-primary-600/10 border border-primary-200 rounded-3xl p-6 mb-8">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm shrink-0">
                            <Sparkles className="w-6 h-6 text-primary-500" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-1.5">Análise Inteligente</h4>
                            <p className="text-slate-700 text-[15px] font-medium leading-relaxed">
                                {overdueBills.length > 0
                                    ? `Identificamos ${overdueBills.length} pendência(s) em atraso. Regularize para manter sua projeção positiva.`
                                    : dashboard?.status === 'surplus'
                                        ? 'Seu orçamento está saudável. Excelente momento para reforçar seus investimentos ou reserva de emergência.'
                                        : 'Atenção aos gastos flexíveis nos próximos dias para garantir que suas contas fixas sejam honradas.'
                                }
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            <IncomeRegistrationModal
                isOpen={isIncomeModalOpen}
                onClose={() => setIsIncomeModalOpen(false)}
                onSuccess={() => {
                    setIsIncomeModalOpen(false);
                    loadData();
                }}
            />
        </div >
    );
};

/* ═══════════════════════════════════════════════════════════════
   HELPER COMPONENTS
═══════════════════════════════════════════════════════════════ */

const QuickAccessButton: React.FC<{
    icon: any;
    label: string;
    onClick: () => void
}> = ({ icon: Icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center gap-2 group active:scale-95 transition-all"
    >
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center transition-all group-hover:bg-slate-200 group-hover:scale-105">
            <Icon className="w-6 h-6 text-slate-600" />
        </div>
        <span className="text-[11px] font-medium text-slate-500 text-center group-hover:text-slate-700">
            {label}
        </span>
    </button>
);
