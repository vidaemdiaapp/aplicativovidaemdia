import React, { useState, useEffect } from 'react';
import {
    Wallet, ArrowUpCircle, ArrowDownCircle, Plus, Calendar, ChevronRight,
    TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock, CreditCard,
    PiggyBank, Target, BarChart3, Zap, ArrowRight, Bell, Sparkles, LineChart, Landmark, RefreshCw,
    Car, FileText, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { tasksService, Task } from '../services/tasks';
import { budgetLimitsService } from '../services/financial';
import { IncomeRegistrationModal } from '../components/IncomeRegistrationModal';
import { SpendingDonutChart, MonthlyBarChart } from '../components/charts/SpendingChart';
import { BudgetAlertBanner, BudgetAlert } from '../components/BudgetAlertBanner';

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

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const household = await tasksService.getHousehold();
            if (!household) return;

            // Parallel data fetching
            const [dashboardRes, tasksRes] = await Promise.all([
                supabase.rpc('get_financial_dashboard', { target_household_id: household.id }),
                tasksService.getUserTasks()
            ]);

            if (dashboardRes.data) setDashboard(dashboardRes.data);

            // Process tasks
            const today = new Date().toISOString().split('T')[0];
            const weekFromNow = new Date();
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            const weekStr = weekFromNow.toISOString().split('T')[0];

            const getAmount = (a: string | number | undefined): number =>
                typeof a === 'number' ? a : parseFloat(a || '0');

            const overdue = tasksRes.filter(t =>
                t.due_date < today && t.status !== 'completed' && getAmount(t.amount) > 0
            );
            const upcoming = tasksRes.filter(t =>
                t.due_date >= today && t.due_date <= weekStr && t.status !== 'completed' && getAmount(t.amount) > 0
            ).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

            setOverdueBills(overdue.slice(0, 3));
            setUpcomingBills(upcoming.slice(0, 5));

            // Get spending by category
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            const spendingRes = await supabase.rpc('get_spending_by_category', {
                target_household_id: household.id,
                start_date: startDate.toISOString().split('T')[0],
                end_date: today
            });
            if (spendingRes.data) setSpending(spendingRes.data || []);

            // Load budget alerts using RPC
            const alerts = await budgetLimitsService.checkAlerts(household.id);
            setBudgetAlerts(alerts || []);

            // Generate monthly comparison data (last 6 months)
            const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
            const mockMonthlyData = months.map((month) => ({
                month,
                income: dashboardRes.data?.total_income ? dashboardRes.data.total_income * (0.8 + Math.random() * 0.4) : 5000 + Math.random() * 3000,
                expense: dashboardRes.data?.total_commitments ? dashboardRes.data.total_commitments * (0.7 + Math.random() * 0.5) : 3000 + Math.random() * 2500
            }));
            setMonthlyData(mockMonthlyData);


        } catch (error) {
            console.error('[Financial] Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number | undefined | null) =>
        (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.getTime() === today.getTime()) return 'Hoje';
        if (date.getTime() === tomorrow.getTime()) return 'Amanhã';
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    const getCategoryLabel = (id: string) => {
        const map: Record<string, string> = {
            'home': 'Casa/Moradia',
            'housing': 'Moradia',
            'transport': 'Transporte',
            'food': 'Alimentação',
            'health': 'Saúde',
            'leisure': 'Lazer',
            'education': 'Educação',
            'utilities': 'Contas Fixas',
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
            <div className="min-h-screen bg-surface flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin"></div>
                    <p className="text-slate-400 text-sm font-medium animate-pulse uppercase tracking-widest">Processando finanças...</p>
                </div>
            </div>
        );
    }

    const riskConfig = getRiskConfig(dashboard?.risk_level || 'low');
    const RiskIcon = riskConfig.icon;
    const totalSpending = spending.reduce((acc, s) => acc + s.total, 0);

    return (
        <div className="min-h-screen bg-surface pb-24 text-slate-900">
            {/* ═══════════════════════════════════════════════════════════════
                HERO: Refined Balance Display
            ═══════════════════════════════════════════════════════════════ */}
            <div className="bg-white border-b border-slate-100 px-6 pt-16 pb-8 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${riskConfig.bg} mb-3`}>
                            <RiskIcon className={`w-3.5 h-3.5 ${riskConfig.text}`} />
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${riskConfig.text}`}>
                                {riskConfig.label}
                            </span>
                        </div>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">
                            Projeção do Mês
                        </p>
                        <h1 className={`text-4xl font-bold tracking-tight ${dashboard?.status === 'surplus' ? 'text-emerald-600' :
                            dashboard?.status === 'warning' ? 'text-amber-600' : 'text-rose-600'
                            }`}>
                            {dashboard ? formatCurrency(dashboard.balance) : 'R$ 0,00'}
                        </h1>
                    </div>
                    <button
                        onClick={() => loadData()}
                        className="p-3 bg-slate-50 rounded-full text-slate-400 hover:text-primary-500 hover:bg-primary-50 transition-all active:rotate-180 duration-500 shadow-sm"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>

                {/* Main Stats Row - CLICKABLE */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* RENDAS - Clicável e com edição */}
                    <div
                        onClick={() => navigate('/incomes')}
                        className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 border border-slate-100 cursor-pointer hover:border-emerald-200 hover:bg-emerald-50/50 transition-all group active:scale-[0.98]"
                    >
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                            <ArrowUpCircle className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-1">
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Rendas</p>
                                <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                            </div>
                            <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                                {dashboard ? formatCurrency(dashboard.total_income) : 'R$ 0'}
                            </p>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsIncomeModalOpen(true); }}
                            className="w-8 h-8 rounded-lg bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                            title="Editar Renda"
                        >
                            <Plus className="w-4 h-4 text-emerald-600" />
                        </button>
                    </div>

                    {/* CONTAS/DESPESAS - Clicável */}
                    <div
                        onClick={() => navigate('/expenses')}
                        className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 border border-slate-100 cursor-pointer hover:border-rose-200 hover:bg-rose-50/50 transition-all group active:scale-[0.98]"
                    >
                        <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                            <ArrowDownCircle className="w-6 h-6 text-rose-600" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-1">
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Contas</p>
                                <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
                            </div>
                            <p className="text-sm font-bold text-slate-800 group-hover:text-rose-700 transition-colors">
                                {dashboard ? formatCurrency(dashboard.total_bills) : 'R$ 0'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                QUICK ACCESS SECTION — Fast Navigation
            ═══════════════════════════════════════════════════════════════ */}
            <div className="px-6 py-6 overflow-x-auto no-scrollbar">
                <div className="flex gap-4 min-w-max">
                    <QuickAccessButton
                        icon={ShieldCheck}
                        label="Imposto Renda"
                        color="bg-emerald-50 text-emerald-600"
                        onClick={() => navigate('/tax-declaration')}
                    />
                    <QuickAccessButton
                        icon={CreditCard}
                        label="Cartões"
                        color="bg-cyan-50 text-cyan-600"
                        onClick={() => navigate('/credit-cards')}
                    />
                    <QuickAccessButton
                        icon={PiggyBank}
                        label="Cofrinhos"
                        color="bg-rose-50 text-rose-600"
                        onClick={() => navigate('/savings')}
                    />
                    <QuickAccessButton
                        icon={TrendingUp}
                        label="Investir"
                        color="bg-violet-50 text-violet-600"
                        onClick={() => navigate('/investments')}
                    />
                </div>
            </div>

            <div className="px-6 space-y-6">
                {/* ═══════════════════════════════════════════════════════════════
                    ACTION BUTTONS
                ═══════════════════════════════════════════════════════════════ */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => navigate('/new-task', { state: { type: 'immediate' } })}
                        className="bg-primary-500 hover:bg-primary-600 p-5 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95 group shadow-lg shadow-primary-500/20"
                    >
                        <Plus className="w-6 h-6 text-white group-hover:rotate-90 transition-transform" />
                        <span className="text-xs font-bold uppercase text-white">Gasto do Dia</span>
                    </button>
                    <button
                        onClick={() => navigate('/new-task')}
                        className="bg-white border border-slate-200 hover:border-primary-300 p-5 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95 shadow-sm"
                    >
                        <Calendar className="w-6 h-6 text-slate-400" />
                        <span className="text-xs font-bold uppercase text-slate-600">Nova Conta</span>
                    </button>
                </div>


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
                    <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 text-center">
                        <p className="text-2xl font-bold text-rose-500">{dashboard?.overdue_count || 0}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Vencidas</p>
                    </div>
                    <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 text-center">
                        <p className="text-2xl font-bold text-amber-500">{dashboard?.today_count || 0}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Hoje</p>
                    </div>
                    <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 text-center">
                        <p className="text-2xl font-bold text-emerald-500">{dashboard?.week_count || 0}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">7 Dias</p>
                    </div>
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
                        <div className="bg-rose-500/5 border border-rose-500/20 rounded p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle className="w-4 h-4 text-rose-500" />
                                <h3 className="text-xs font-black uppercase tracking-wider text-rose-500">
                                    Contas Vencidas ({overdueBills.length})
                                </h3>
                            </div>
                            <div className="space-y-3">
                                {overdueBills.map(bill => (
                                    <div
                                        key={bill.id}
                                        onClick={() => navigate(`/detail/${bill.id}`)}
                                        className="flex justify-between items-center p-3 bg-slate-900/50 rounded cursor-pointer hover:bg-slate-800/50 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-rose-500/10 flex items-center justify-center">
                                                <Clock className="w-4 h-4 text-rose-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors truncate max-w-[150px]">
                                                    {bill.title}
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-bold">
                                                    Venceu em {formatDate(bill.due_date)}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-black text-rose-400">
                                            {formatCurrency(typeof bill.amount === 'number' ? bill.amount : parseFloat(bill.amount || '0'))}
                                        </p>
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
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800">Próximos Vencimentos</h3>
                        <button onClick={() => navigate('/agenda')} className="text-xs font-bold text-primary-500 hover:text-primary-600 transition-colors uppercase tracking-wider">Ver Agenda</button>
                    </div>

                    <div className="space-y-3">
                        {upcomingBills.length === 0 ? (
                            <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-sm transition-all hover:shadow-md">
                                <CheckCircle2 className="w-12 h-12 text-emerald-200 mx-auto mb-4" />
                                <p className="text-slate-500 text-sm font-medium">Você está em dia!</p>
                            </div>
                        ) : (
                            upcomingBills.map(bill => (
                                <div
                                    key={bill.id}
                                    onClick={() => navigate(`/detail/${bill.id}`)}
                                    className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between hover:border-primary-200 hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
                                            <Clock className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 group-hover:text-primary-600 transition-colors">{bill.title}</p>
                                            <p className="text-xs text-slate-400 font-medium tracking-tight">Vence em {formatDate(bill.due_date)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-slate-900">{formatCurrency(parseFloat(bill.amount?.toString() || '0'))}</p>
                                        <ChevronRight className="w-4 h-4 text-slate-300 ml-auto mt-1 group-hover:translate-x-1 transition-transform" />
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
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   HELPER COMPONENTS
═══════════════════════════════════════════════════════════════ */

const QuickAccessButton: React.FC<{
    icon: any;
    label: string;
    color: string;
    onClick: () => void
}> = ({ icon: Icon, label, color, onClick }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center gap-2 group p-2 min-w-[80px]"
    >
        <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center transition-all group-hover:scale-105 group-active:scale-95 shadow-sm group-hover:shadow-md border border-white/50`}>
            <Icon className="w-7 h-7" />
        </div>
        <span className="text-[11px] font-bold text-slate-600 text-center leading-tight group-hover:text-primary-600 transition-colors">
            {label}
        </span>
    </button>
);
