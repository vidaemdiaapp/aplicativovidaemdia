import React, { useState, useEffect } from 'react';
import {
    Wallet, ArrowUpCircle, ArrowDownCircle, Plus, Calendar, ChevronRight,
    TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock, CreditCard,
    PiggyBank, Target, BarChart3, Zap, ArrowRight, Bell, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { tasksService, Task } from '../services/tasks';
import { IncomeRegistrationModal } from '../components/IncomeRegistrationModal';

interface DashboardData {
    total_income: number;
    total_commitments: number;
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

        } catch (error) {
            console.error('[Financial] Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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
            'housing': 'Moradia',
            'transport': 'Transporte',
            'food': 'Alimentação',
            'health': 'Saúde',
            'leisure': 'Lazer',
            'education': 'Educação',
            'utilities': 'Contas',
            'vehicle': 'Veículo',
            'outros': 'Outros'
        };
        return map[id] || id;
    };

    const getRiskConfig = (level: string) => {
        switch (level) {
            case 'high': return { bg: 'bg-rose-500/10', text: 'text-rose-500', label: 'RISCO ALTO', icon: AlertTriangle };
            case 'medium': return { bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'ATENÇÃO', icon: Bell };
            default: return { bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'ESTÁVEL', icon: CheckCircle2 };
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Carregando finanças...</p>
                </div>
            </div>
        );
    }

    const riskConfig = getRiskConfig(dashboard?.risk_level || 'low');
    const RiskIcon = riskConfig.icon;
    const totalSpending = spending.reduce((acc, s) => acc + s.total, 0);

    return (
        <div className="min-h-screen bg-slate-950 pb-24 text-white">
            {/* ═══════════════════════════════════════════════════════════════
                HERO: Massive Balance Display (Brutalist)
            ═══════════════════════════════════════════════════════════════ */}
            <div className="relative overflow-hidden">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/50 via-slate-950 to-slate-950"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>

                <div className="relative z-10 px-6 pt-16 pb-8">
                    {/* Risk Badge */}
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded ${riskConfig.bg} mb-6`}>
                        <RiskIcon className={`w-3.5 h-3.5 ${riskConfig.text}`} />
                        <span className={`text-[10px] font-black uppercase tracking-wider ${riskConfig.text}`}>
                            {riskConfig.label}
                        </span>
                    </div>

                    {/* Main Balance */}
                    <div className="mb-2">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">
                            Projeção do Mês
                        </p>
                        <h1 className={`text-5xl md:text-7xl font-black tracking-tight ${dashboard?.status === 'surplus' ? 'text-emerald-400' :
                            dashboard?.status === 'warning' ? 'text-amber-400' : 'text-rose-400'
                            }`}>
                            {dashboard ? formatCurrency(dashboard.balance) : 'R$ 0,00'}
                        </h1>
                    </div>

                    {/* Income / Expenses Row */}
                    <div className="flex gap-6 mt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-emerald-500/10 flex items-center justify-center">
                                <ArrowUpCircle className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Rendas</p>
                                <p className="text-lg font-black text-white">
                                    {dashboard ? formatCurrency(dashboard.total_income) : 'R$ 0'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-rose-500/10 flex items-center justify-center">
                                <ArrowDownCircle className="w-5 h-5 text-rose-500" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Compromissos</p>
                                <p className="text-lg font-black text-white">
                                    {dashboard ? formatCurrency(dashboard.total_commitments) : 'R$ 0'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                QUICK ACTIONS
            ═══════════════════════════════════════════════════════════════ */}
            <div className="px-6 -mt-2 flex gap-3">
                <button
                    onClick={() => setIsIncomeModalOpen(true)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 p-4 rounded flex items-center justify-center gap-2 transition-all active:scale-95 group"
                >
                    <Plus className="w-5 h-5 text-white group-hover:rotate-90 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-tight">Rendas</span>
                </button>
                <button
                    onClick={() => navigate('/new-task')}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 p-4 rounded flex items-center justify-center gap-2 transition-all active:scale-95 border border-slate-700"
                >
                    <Calendar className="w-5 h-5 text-slate-300" />
                    <span className="text-xs font-black uppercase tracking-tight text-slate-300">Nova Conta</span>
                </button>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                QUICK STATS ROW
            ═══════════════════════════════════════════════════════════════ */}
            <div className="px-6 mt-8 grid grid-cols-3 gap-3">
                <div className="bg-slate-900 border border-slate-800 rounded p-4 text-center">
                    <p className="text-3xl font-black text-rose-400">{dashboard?.overdue_count || 0}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Vencidas</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded p-4 text-center">
                    <p className="text-3xl font-black text-amber-400">{dashboard?.today_count || 0}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Hoje</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded p-4 text-center">
                    <p className="text-3xl font-black text-emerald-400">{dashboard?.week_count || 0}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">7 Dias</p>
                </div>
            </div>

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
            <section className="px-6 mt-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">
                        Próximos Vencimentos
                    </h3>
                    <button
                        onClick={() => navigate('/category/all')}
                        className="text-[10px] text-emerald-500 font-bold uppercase flex items-center gap-1 hover:text-emerald-400 transition-colors"
                    >
                        Ver Todas <ChevronRight className="w-3 h-3" />
                    </button>
                </div>

                {upcomingBills.length === 0 ? (
                    <div className="bg-slate-900 border border-dashed border-slate-700 rounded p-8 text-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm font-medium">Nenhuma conta pendente nos próximos 7 dias</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {upcomingBills.map(bill => (
                            <div
                                key={bill.id}
                                onClick={() => navigate(`/detail/${bill.id}`)}
                                className="flex justify-between items-center p-4 bg-slate-900 border border-slate-800 rounded cursor-pointer hover:border-slate-700 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded flex items-center justify-center ${bill.due_date === new Date().toISOString().split('T')[0]
                                        ? 'bg-amber-500/10 text-amber-500'
                                        : 'bg-slate-800 text-slate-400'
                                        }`}>
                                        <Wallet className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors truncate max-w-[180px]">
                                            {bill.title}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">
                                            {formatDate(bill.due_date)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-white">
                                        {formatCurrency(typeof bill.amount === 'number' ? bill.amount : parseFloat(bill.amount || '0'))}
                                    </p>
                                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all ml-auto" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                SPENDING BY CATEGORY
            ═══════════════════════════════════════════════════════════════ */}
            <section className="px-6 mt-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">
                        Gastos por Categoria
                    </h3>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Últimos 30 dias</span>
                </div>

                {spending.length === 0 ? (
                    <div className="bg-slate-900 border border-dashed border-slate-700 rounded p-8 text-center">
                        <BarChart3 className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm font-medium">Sem gastos registrados</p>
                    </div>
                ) : (
                    <div className="bg-slate-900 border border-slate-800 rounded p-4 space-y-4">
                        {spending.slice(0, 4).map((cat, idx) => {
                            const percentage = totalSpending > 0 ? (cat.total / totalSpending) * 100 : 0;
                            const colors = ['bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-slate-500'];
                            return (
                                <div key={cat.category_id || idx}>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-xs font-bold text-slate-300">
                                            {getCategoryLabel(cat.category_id)}
                                        </span>
                                        <span className="text-xs font-black text-white">
                                            {formatCurrency(cat.total)}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded overflow-hidden">
                                        <div
                                            className={`h-full ${colors[idx % colors.length]} transition-all duration-700 ease-out`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                        <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500 uppercase">Total</span>
                            <span className="text-lg font-black text-white">{formatCurrency(totalSpending)}</span>
                        </div>
                    </div>
                )}
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                QUICK ACCESS MODULES
            ═══════════════════════════════════════════════════════════════ */}
            <section className="px-6 mt-8 grid grid-cols-2 gap-3">
                <button
                    onClick={() => navigate('/credit-cards')}
                    className="bg-slate-900 border border-slate-800 rounded p-4 text-left hover:border-slate-700 transition-all group"
                >
                    <div className="w-10 h-10 rounded bg-cyan-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <CreditCard className="w-5 h-5 text-cyan-400" />
                    </div>
                    <p className="text-xs font-black text-white">Cartões</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                        {dashboard?.credit_card_balance ? formatCurrency(dashboard.credit_card_balance) : 'Configurar'}
                    </p>
                </button>

                <button
                    onClick={() => navigate('/savings')}
                    className="bg-slate-900 border border-slate-800 rounded p-4 text-left hover:border-slate-700 transition-all group"
                >
                    <div className="w-10 h-10 rounded bg-emerald-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <PiggyBank className="w-5 h-5 text-emerald-400" />
                    </div>
                    <p className="text-xs font-black text-white">Cofrinhos</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                        {dashboard?.savings_total ? formatCurrency(dashboard.savings_total) : 'Criar meta'}
                    </p>
                </button>

                <button
                    onClick={() => navigate('/investments')}
                    className="bg-slate-900 border border-slate-800 rounded p-4 text-left hover:border-slate-700 transition-all group"
                >
                    <div className="w-10 h-10 rounded bg-amber-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-5 h-5 text-amber-400" />
                    </div>
                    <p className="text-xs font-black text-white">Investimentos</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Ver patrimônio</p>
                </button>

                <button
                    onClick={() => navigate('/tax')}
                    className="bg-slate-900 border border-slate-800 rounded p-4 text-left hover:border-slate-700 transition-all group"
                >
                    <div className="w-10 h-10 rounded bg-rose-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Target className="w-5 h-5 text-rose-400" />
                    </div>
                    <p className="text-xs font-black text-white">Imposto de Renda</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Estimativa IR</p>
                </button>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                AI SUGGESTION (Next Best Action)
            ═══════════════════════════════════════════════════════════════ */}
            <section className="px-6 mt-8 mb-6">
                <div className="bg-gradient-to-r from-emerald-900/30 to-slate-900 border border-emerald-500/20 rounded p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-wider mb-1">
                                Próxima Melhor Ação
                            </p>
                            <p className="text-sm font-bold text-white leading-snug">
                                {overdueBills.length > 0
                                    ? `Você tem ${overdueBills.length} conta(s) atrasada(s). Regularize para evitar juros!`
                                    : dashboard?.status === 'deficit'
                                        ? 'Seu orçamento está no vermelho. Revise seus compromissos.'
                                        : dashboard?.status === 'warning'
                                            ? 'Margem apertada! Considere adiar gastos não essenciais.'
                                            : 'Tudo em ordem! Que tal reservar parte do saldo para um cofrinho?'
                                }
                            </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-emerald-500/50" />
                    </div>
                </div>
            </section>

            {/* Income Modal */}
            <IncomeRegistrationModal
                isOpen={isIncomeModalOpen}
                onClose={() => setIsIncomeModalOpen(false)}
                onSuccess={loadData}
            />
        </div>
    );
};
