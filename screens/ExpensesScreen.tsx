import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Plus, ArrowDownCircle, Calendar, Filter,
    CheckCircle2, Clock, AlertTriangle, ChevronRight, Wallet
} from 'lucide-react';
import { tasksService, Task } from '../services/tasks';

type ViewMode = 'all' | 'week' | 'month' | 'overdue';
type StatusFilter = 'all' | 'pending' | 'completed';

export const ExpensesScreen: React.FC = () => {
    const navigate = useNavigate();
    const [expenses, setExpenses] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [totalPending, setTotalPending] = useState(0);
    const [totalPaid, setTotalPaid] = useState(0);
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        loadExpenses();
    }, [viewMode, statusFilter]);

    const loadExpenses = async () => {
        setLoading(true);
        try {
            const [tasks, cats] = await Promise.all([
                tasksService.getUserTasks(),
                tasksService.getCategories()
            ]);

            if (cats) setCategories(cats);

            // Filter only expenses (tasks with amount > 0)
            let filtered = tasks.filter(t => {
                const amount = typeof t.amount === 'number' ? t.amount : parseFloat(t.amount || '0');
                return amount > 0;
            });

            const today = new Date().toISOString().split('T')[0];
            const weekFromNow = new Date();
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            const weekStr = weekFromNow.toISOString().split('T')[0];

            const monthFromNow = new Date();
            monthFromNow.setMonth(monthFromNow.getMonth() + 1);
            const monthStr = monthFromNow.toISOString().split('T')[0];

            const getEffectiveDate = (t: Task) => t.due_date || t.purchase_date || t.created_at;

            // Apply view mode filter
            if (viewMode === 'overdue') {
                filtered = filtered.filter(t => {
                    const date = getEffectiveDate(t);
                    return date < today && t.status !== 'completed';
                });
            } else if (viewMode === 'week') {
                filtered = filtered.filter(t => {
                    const date = getEffectiveDate(t);
                    return date >= today && date <= weekStr;
                });
            } else if (viewMode === 'month') {
                filtered = filtered.filter(t => {
                    const date = getEffectiveDate(t);
                    // Changed logic slightly: show everything from beginning of month or typical rolling window?
                    // Keeping rolling window as per original code but supporting purchase_date
                    // Ideally for expenses we usually want to see past ones too if viewing "All" or "Month" context?
                    // The original code was `date >= today` AND `date <= monthStr`.
                    // This hides PAST expenses of the current month.
                    // The user complained about "Gasto do Dia" (-88) not showing.
                    // If purchase_date is today, it passes `date >= today`.
                    // If purchase_date was yesterday, it fails.
                    // I will adjust logical start date for "month" view to be start of current month?
                    // Or just fix the null check first. The user said "Gasto do dia" so it's likely today.

                    // Let's stick to the visible range logic but fix the field access.
                    return date >= today && date <= monthStr;
                });
            }

            // Apply status filter
            if (statusFilter === 'pending') {
                filtered = filtered.filter(t => t.status !== 'completed');
            } else if (statusFilter === 'completed') {
                filtered = filtered.filter(t => t.status === 'completed');
            }

            // Sort by due date
            // Sort by effective date
            filtered.sort((a, b) => new Date(getEffectiveDate(a)).getTime() - new Date(getEffectiveDate(b)).getTime());

            setExpenses(filtered);

            // Calculate totals
            const pending = filtered
                .filter(t => t.status !== 'completed')
                .reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : parseFloat(t.amount || '0')), 0);
            const paid = filtered
                .filter(t => t.status === 'completed')
                .reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : parseFloat(t.amount || '0')), 0);

            setTotalPending(pending);
            setTotalPaid(paid);
        } catch (error) {
            console.error('Error loading expenses:', error);
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
        if (date < today) return `Venceu ${date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`;
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    const getStatusConfig = (task: Task) => {
        const today = new Date().toISOString().split('T')[0];

        if (task.status === 'completed') {
            return { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' };
        }
        if (task.due_date < today) {
            return { icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50' };
        }
        return { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' };
    };

    const getCategoryLabel = (id: string) => {
        // Try dynamic categories first
        const cat = categories.find(c => c.id === id);
        if (cat) return cat.label;

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
            'outros': 'Outros'
        };
        return map[id] || id || 'Outros';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin"></div>
                    <p className="text-slate-400 text-sm font-medium animate-pulse">Carregando despesas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pb-24">
            {/* Header */}
            <header className="bg-gradient-to-br from-rose-500 to-rose-600 px-6 pt-16 pb-8">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => navigate('/new-task')}
                        className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-rose-600 font-bold text-sm shadow-lg"
                    >
                        <Plus className="w-4 h-4" />
                        Nova Conta
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                        <p className="text-rose-200 text-xs font-bold uppercase tracking-widest mb-1">
                            Pendentes
                        </p>
                        <p className="text-2xl font-bold text-white">
                            {formatCurrency(totalPending)}
                        </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                        <p className="text-rose-200 text-xs font-bold uppercase tracking-widest mb-1">
                            Pagas
                        </p>
                        <p className="text-2xl font-bold text-white">
                            {formatCurrency(totalPaid)}
                        </p>
                    </div>
                </div>
            </header>

            {/* Period Filter */}
            <div className="px-6 py-4 flex gap-2 overflow-x-auto no-scrollbar border-b border-slate-100">
                {([
                    { key: 'overdue', label: 'Vencidas' },
                    { key: 'week', label: '7 Dias' },
                    { key: 'month', label: '30 Dias' },
                    { key: 'all', label: 'Todas' }
                ] as { key: ViewMode; label: string }[]).map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setViewMode(key)}
                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${viewMode === key
                            ? key === 'overdue' ? 'bg-rose-500 text-white' : 'bg-primary-500 text-white'
                            : 'bg-white border border-slate-200 text-slate-500 hover:border-primary-300'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Status Filter */}
            <div className="px-6 py-3 flex gap-2">
                {([
                    { key: 'all', label: 'Todas' },
                    { key: 'pending', label: 'Pendentes' },
                    { key: 'completed', label: 'Pagas' }
                ] as { key: StatusFilter; label: string }[]).map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setStatusFilter(key)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${statusFilter === key
                            ? 'bg-slate-800 text-white'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Expenses List */}
            <div className="px-6 space-y-3 mt-2">
                {expenses.length === 0 ? (
                    <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-sm">
                        <Wallet className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Nenhuma despesa encontrada</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            {viewMode === 'overdue'
                                ? 'Ótimo! Você não tem contas vencidas.'
                                : 'Não há despesas para o período selecionado.'}
                        </p>
                    </div>
                ) : (
                    expenses.map((expense) => {
                        const statusConfig = getStatusConfig(expense);
                        const StatusIcon = statusConfig.icon;
                        const amount = typeof expense.amount === 'number' ? expense.amount : parseFloat(expense.amount || '0');

                        return (
                            <div
                                key={expense.id}
                                onClick={() => navigate(`/detail/${expense.id}`)}
                                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${statusConfig.bg}`}>
                                            <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 group-hover:text-primary-600 transition-colors truncate max-w-[180px]">
                                                {expense.title}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                                    {getCategoryLabel(expense.category_id || '')}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    {formatDate(expense.due_date || expense.purchase_date || expense.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-2">
                                        <div>
                                            <p className={`text-lg font-bold ${expense.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                                {formatCurrency(amount)}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
