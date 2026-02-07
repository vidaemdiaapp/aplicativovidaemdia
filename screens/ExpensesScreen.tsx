import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Plus, Search, Share2, Check,
    Car, ShoppingBag, Utensils, Heart, Home, Film, GraduationCap, Zap,
    Truck, CreditCard, FileText, DollarSign, MoreHorizontal
} from 'lucide-react';
import { tasksService, Task } from '../services/tasks';
import { toast } from 'react-hot-toast';

type ViewMode = 'all' | 'week' | 'month' | 'overdue';
type StatusFilter = 'all' | 'pending' | 'completed';

// Mapeamento de marcas conhecidas → cores, emojis e logos
const BRAND_CONFIG: Record<string, { bg: string; emoji: string; logo?: string }> = {
    // Transporte
    'uber': { bg: 'bg-black', emoji: '🚗', logo: 'https://www.google.com/s2/favicons?domain=uber.com&sz=128' },
    '99': { bg: 'bg-yellow-500', emoji: '🚕', logo: 'https://www.google.com/s2/favicons?domain=99app.com&sz=128' },

    // Streaming/Tech
    'netflix': { bg: 'bg-red-600', emoji: '📺', logo: 'https://www.google.com/s2/favicons?domain=netflix.com&sz=128' },
    'spotify': { bg: 'bg-green-500', emoji: '🎵', logo: 'https://www.google.com/s2/favicons?domain=spotify.com&sz=128' },
    'amazon': { bg: 'bg-orange-400', emoji: '📦', logo: 'https://www.google.com/s2/favicons?domain=amazon.com&sz=128' },
    'prime': { bg: 'bg-blue-500', emoji: '📦', logo: 'https://www.google.com/s2/favicons?domain=primevideo.com&sz=128' },
    'disney': { bg: 'bg-blue-600', emoji: '🏰', logo: 'https://www.google.com/s2/favicons?domain=disneyplus.com&sz=128' },
    'hbo': { bg: 'bg-purple-700', emoji: '🎬', logo: 'https://www.google.com/s2/favicons?domain=hbomax.com&sz=128' },
    'youtube': { bg: 'bg-red-600', emoji: '▶️', logo: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=128' },
    'apple': { bg: 'bg-black', emoji: '🍎', logo: 'https://www.google.com/s2/favicons?domain=apple.com&sz=128' },
    'google': { bg: 'bg-white', emoji: '🔍', logo: 'https://www.google.com/s2/favicons?domain=google.com&sz=128' },

    // Supermercados
    'mercado': { bg: 'bg-yellow-500', emoji: '🛒' },
    'supermercado': { bg: 'bg-green-500', emoji: '🛒' },
    'pao de acucar': { bg: 'bg-orange-500', emoji: '🛒', logo: 'https://www.google.com/s2/favicons?domain=paodeacucar.com&sz=128' },
    'extra': { bg: 'bg-red-500', emoji: '🛒', logo: 'https://www.google.com/s2/favicons?domain=clubeextra.com.br&sz=128' },
    'carrefour': { bg: 'bg-blue-600', emoji: '🛒', logo: 'https://www.google.com/s2/favicons?domain=carrefour.com.br&sz=128' },
    'atacadao': { bg: 'bg-yellow-500', emoji: '🛒', logo: 'https://www.google.com/s2/favicons?domain=atacadao.com.br&sz=128' },

    // E-commerce
    'mercado livre': { bg: 'bg-yellow-400', emoji: '🛍️', logo: 'https://www.google.com/s2/favicons?domain=mercadolivre.com.br&sz=128' },
    'shopee': { bg: 'bg-orange-500', emoji: '🧡', logo: 'https://www.google.com/s2/favicons?domain=shopee.com.br&sz=128' },
    'aliexpress': { bg: 'bg-red-500', emoji: '📦', logo: 'https://www.google.com/s2/favicons?domain=aliexpress.com&sz=128' },
    'magalu': { bg: 'bg-blue-500', emoji: '💙', logo: 'https://www.google.com/s2/favicons?domain=magazineluiza.com.br&sz=128' },
    'americanas': { bg: 'bg-red-600', emoji: '🛍️', logo: 'https://www.google.com/s2/favicons?domain=americanas.com.br&sz=128' },

    // Lojas
    'nike': { bg: 'bg-black', emoji: '👟', logo: 'https://www.google.com/s2/favicons?domain=nike.com&sz=128' },
    'adidas': { bg: 'bg-black', emoji: '👟', logo: 'https://www.google.com/s2/favicons?domain=adidas.com&sz=128' },
    'renner': { bg: 'bg-red-600', emoji: '👕', logo: 'https://www.google.com/s2/favicons?domain=lojasrenner.com.br&sz=128' },
    'c&a': { bg: 'bg-blue-500', emoji: '👗', logo: 'https://www.google.com/s2/favicons?domain=cea.com.br&sz=128' },
    'zara': { bg: 'bg-black', emoji: '👔', logo: 'https://www.google.com/s2/favicons?domain=zara.com&sz=128' },

    // Fast food / Delivery
    'ifood': { bg: 'bg-red-500', emoji: '🍔', logo: 'https://www.google.com/s2/favicons?domain=ifood.com.br&sz=128' },
    'rappi': { bg: 'bg-orange-500', emoji: '🛵', logo: 'https://www.google.com/s2/favicons?domain=rappi.com.br&sz=128' },
    'mcdonald': { bg: 'bg-red-600', emoji: '🍟', logo: 'https://www.google.com/s2/favicons?domain=mcdonalds.com&sz=128' },
    'burger king': { bg: 'bg-orange-600', emoji: '🍔', logo: 'https://www.google.com/s2/favicons?domain=burgerking.com.br&sz=128' },
    'starbucks': { bg: 'bg-green-700', emoji: '☕', logo: 'https://www.google.com/s2/favicons?domain=starbucks.com&sz=128' },
    'subway': { bg: 'bg-green-500', emoji: '🥪', logo: 'https://www.google.com/s2/favicons?domain=subway.com&sz=128' },
    'kfc': { bg: 'bg-red-600', emoji: '🍗', logo: 'https://www.google.com/s2/favicons?domain=kfc.com&sz=128' },
    'pizza': { bg: 'bg-red-600', emoji: '🍕' },

    // Farmácias
    'farmacia': { bg: 'bg-green-600', emoji: '💊' },
    'drogaria': { bg: 'bg-green-600', emoji: '💊' },
    'drogasil': { bg: 'bg-red-600', emoji: '💊', logo: 'https://www.google.com/s2/favicons?domain=drogasil.com.br&sz=128' },
    'droga raia': { bg: 'bg-green-600', emoji: '💊', logo: 'https://www.google.com/s2/favicons?domain=drogaraia.com.br&sz=128' },

    // Postos
    'posto': { bg: 'bg-yellow-500', emoji: '⛽' },
    'gasolina': { bg: 'bg-yellow-500', emoji: '⛽' },
    'shell': { bg: 'bg-yellow-500', emoji: '⛽', logo: 'https://www.google.com/s2/favicons?domain=shell.com&sz=128' },
    'ipiranga': { bg: 'bg-yellow-400', emoji: '⛽', logo: 'https://www.google.com/s2/favicons?domain=ipiranga.com.br&sz=128' },

    // Bancos/Pagamentos
    'nubank': { bg: 'bg-purple-600', emoji: '💜', logo: 'https://www.google.com/s2/favicons?domain=nubank.com.br&sz=128' },
    'itau': { bg: 'bg-orange-500', emoji: '🏦', logo: 'https://www.google.com/s2/favicons?domain=itau.com.br&sz=128' },
    'bradesco': { bg: 'bg-red-600', emoji: '🏦', logo: 'https://www.google.com/s2/favicons?domain=bradesco.com.br&sz=128' },
    'santander': { bg: 'bg-red-600', emoji: '🏦', logo: 'https://www.google.com/s2/favicons?domain=santander.com.br&sz=128' },
    'picpay': { bg: 'bg-green-500', emoji: '💸', logo: 'https://www.google.com/s2/favicons?domain=picpay.com&sz=128' },

    // Outros
    'luz': { bg: 'bg-yellow-400', emoji: '💡' },
    'agua': { bg: 'bg-blue-400', emoji: '💧' },
    'internet': { bg: 'bg-cyan-500', emoji: '🌐' },
    'aluguel': { bg: 'bg-indigo-500', emoji: '🏠' },
    'condominio': { bg: 'bg-slate-600', emoji: '🏢' },
};

// Cores por categoria
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
    'transport': { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    'food': { bg: 'bg-orange-500/20', text: 'text-orange-400' },
    'market': { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
    'health': { bg: 'bg-green-500/20', text: 'text-green-400' },
    'home': { bg: 'bg-indigo-500/20', text: 'text-indigo-400' },
    'leisure': { bg: 'bg-pink-500/20', text: 'text-pink-400' },
    'shopping': { bg: 'bg-purple-500/20', text: 'text-purple-400' },
    'utilities': { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
    'debts': { bg: 'bg-red-500/20', text: 'text-red-400' },
    'salary': { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    'other': { bg: 'bg-slate-500/20', text: 'text-slate-400' },
};

// Ícones por categoria
const CATEGORY_ICONS: Record<string, React.ElementType> = {
    'transport': Car,
    'food': Utensils,
    'market': ShoppingBag,
    'health': Heart,
    'home': Home,
    'leisure': Film,
    'education': GraduationCap,
    'utilities': Zap,
    'vehicle': Truck,
    'shopping': ShoppingBag,
    'debts': CreditCard,
    'taxes': FileText,
    'salary': DollarSign,
    'other': MoreHorizontal,
};

// Emojis por categoria (fallback)
const CATEGORY_EMOJIS: Record<string, string> = {
    'transport': '🚗',
    'food': '🍽️',
    'market': '🛒',
    'health': '💊',
    'home': '🏠',
    'leisure': '🎬',
    'education': '📚',
    'utilities': '💡',
    'vehicle': '🚙',
    'shopping': '🛍️',
    'debts': '💳',
    'taxes': '📋',
    'salary': '💰',
    'other': '📝',
};

export const ExpensesScreen: React.FC = () => {
    const navigate = useNavigate();
    const [expenses, setExpenses] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [totalPending, setTotalPending] = useState(0);
    const [totalPaid, setTotalPaid] = useState(0);
    const [categories, setCategories] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [completing, setCompleting] = useState<string | null>(null);

    useEffect(() => {
        loadExpenses();
    }, [viewMode, statusFilter, selectedMonth]);

    const loadExpenses = async () => {
        setLoading(true);
        try {
            const [tasks, cats] = await Promise.all([
                tasksService.getUserTasks(),
                tasksService.getCategories()
            ]);

            if (cats) setCategories(cats);

            let filtered = [...tasks];

            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];

            const startOfWeek = new Date();
            startOfWeek.setDate(today.getDate() - 7);
            const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

            const endOfWeek = new Date();
            endOfWeek.setDate(today.getDate() + 7);
            const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

            const startOfMonth = new Date(today.getFullYear(), selectedMonth, 1);
            const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

            const endOfMonth = new Date(today.getFullYear(), selectedMonth + 1, 0);
            const endOfMonthStr = endOfMonth.toISOString().split('T')[0];

            const getEffectiveDate = (t: Task) => {
                const raw = t.purchase_date || t.due_date || t.created_at;
                if (!raw) return todayStr;
                return raw.split('T')[0].split(' ')[0];
            };

            // Apply view mode filter
            if (viewMode === 'overdue') {
                filtered = filtered.filter(t => {
                    const date = getEffectiveDate(t);
                    return date < todayStr && t.status !== 'completed';
                });
            } else if (viewMode === 'week') {
                filtered = filtered.filter(t => {
                    const date = getEffectiveDate(t);
                    return date >= startOfWeekStr && date <= endOfWeekStr;
                });
            } else if (viewMode === 'month') {
                filtered = filtered.filter(t => {
                    const date = getEffectiveDate(t);
                    return date >= startOfMonthStr && date <= endOfMonthStr;
                });
            }

            // Apply status filter
            if (statusFilter === 'pending') {
                filtered = filtered.filter(t => t.status !== 'completed');
            } else if (statusFilter === 'completed') {
                filtered = filtered.filter(t => t.status === 'completed');
            }

            // Apply search filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                filtered = filtered.filter(t =>
                    t.title?.toLowerCase().includes(q) ||
                    t.description?.toLowerCase().includes(q)
                );
            }

            // Sort by creation time (most recent first)
            filtered.sort((a, b) => {
                const dateA = new Date(a.created_at || '').getTime() || 0;
                const dateB = new Date(b.created_at || '').getTime() || 0;
                return dateB - dateA;
            });

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

    const handleMarkAsPaid = async (e: React.MouseEvent, expenseId: string) => {
        e.stopPropagation();
        setCompleting(expenseId);
        try {
            const result = await tasksService.completeTask(expenseId);
            if (result) {
                toast.success('Marcado como pago!');
                setExpenses(prev => prev.map(exp =>
                    exp.id === expenseId ? { ...exp, status: 'completed' } : exp
                ));
            } else {
                toast.error('Erro ao marcar como pago');
            }
        } catch (err) {
            console.error(err);
            toast.error('Erro ao processar');
        } finally {
            setCompleting(null);
        }
    };

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const getTimeFromDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const getDateGroupLabel = (dateStr: string) => {
        if (!dateStr) return 'SEM DATA';
        const cleanDate = dateStr.split('T')[0].split(' ')[0];
        const date = new Date(cleanDate + 'T12:00:00');
        if (isNaN(date.getTime())) return 'DATA INVÁLIDA';

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateAtMidnight = new Date(date);
        dateAtMidnight.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (dateAtMidnight.getTime() === today.getTime()) return 'HOJE';
        if (dateAtMidnight.getTime() === yesterday.getTime()) return 'ONTEM';

        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long'
        }).toUpperCase().replace(' DE ', ' DE ');
    };

    const getCategoryLabel = (id: string) => {
        const cat = categories.find(c => c.id === id);
        if (cat) return cat.label?.toUpperCase() || id.toUpperCase();

        const map: Record<string, string> = {
            'home': 'MORADIA', 'housing': 'MORADIA', 'transport': 'TRANSPORTE',
            'food': 'ALIMENTAÇÃO', 'health': 'SAÚDE', 'leisure': 'LAZER',
            'education': 'EDUCAÇÃO', 'utilities': 'CONTAS', 'vehicle': 'VEÍCULO',
            'shopping': 'COMPRAS', 'taxes': 'IMPOSTOS', 'market': 'MERCADO',
            'other': 'OUTROS', 'debts': 'DÍVIDAS', 'salary': 'SALÁRIO'
        };
        return map[id] || id?.toUpperCase() || 'OUTROS';
    };

    const getBrandConfig = (title: string) => {
        const lower = title.toLowerCase();
        for (const [brand, config] of Object.entries(BRAND_CONFIG)) {
            if (lower.includes(brand)) {
                return config;
            }
        }
        return null;
    };

    const getCategoryColors = (categoryId: string) => {
        return CATEGORY_COLORS[categoryId] || CATEGORY_COLORS['other'];
    };

    const getCategoryEmoji = (categoryId: string) => {
        return CATEGORY_EMOJIS[categoryId] || '📝';
    };

    // Group expenses by date
    const groupedExpenses = expenses.reduce((groups, expense) => {
        const dateStr = expense.purchase_date || expense.due_date || expense.created_at || '';
        const label = getDateGroupLabel(dateStr);
        if (!groups[label]) groups[label] = [];
        groups[label].push(expense);
        return groups;
    }, {} as Record<string, Task[]>);

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const currentYear = new Date().getFullYear();

    if (loading) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin"></div>
                    <p className="text-text-secondary text-sm font-medium animate-pulse">Carregando despesas...</p>
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
                            <h1 className="text-2xl font-black text-text-primary tracking-tight leading-none">Despesas</h1>
                            <p className="text-text-muted text-[11px] font-bold uppercase tracking-widest mt-1">Gestão de Gastos</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/new-task', { state: { type: 'immediate' } })}
                        className="w-12 h-12 rounded-2xl bg-primary-500 text-white hover:bg-primary-600 transition-all active:scale-90 shadow-lg shadow-primary-500/20 flex items-center justify-center"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="card p-5 border-l-4 border-l-danger-500">
                        <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-1">A Pagar</p>
                        <p className="text-2xl font-black text-danger-500 tracking-tight">{formatCurrency(totalPending)}</p>
                    </div>
                    <div className="card p-5 border-l-4 border-l-emerald-500">
                        <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-1">Pago</p>
                        <p className="text-2xl font-black text-emerald-500 tracking-tight">{formatCurrency(totalPaid)}</p>
                    </div>
                </div>
            </header>

            <div className="px-6 py-8 space-y-8">
                {/* Search & Filters */}
                <section className="space-y-6">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                            <Search className="w-5 h-5 text-text-muted group-focus-within:text-primary-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por estabelecimento ou descrição..."
                            className="input pl-14 h-16 rounded-3xl text-sm font-bold bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                        {(['month', 'week', 'overdue', 'all'] as ViewMode[]).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${viewMode === mode
                                    ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20'
                                    : 'bg-white text-text-muted border-white shadow-sm'
                                    }`}
                            >
                                {mode === 'month' ? 'Este Mês' : mode === 'week' ? 'Esta Semana' : mode === 'overdue' ? 'Atrasadas' : 'Ver Tudo'}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Expenses List */}
                <section className="space-y-6">
                    {Object.keys(groupedExpenses).length === 0 ? (
                        <div className="card-premium p-12 text-center bg-white/50">
                            <ShoppingBag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-lg font-black text-text-primary mb-2">Nenhum registro</h3>
                            <p className="text-text-muted text-sm font-bold uppercase tracking-widest">
                                Tudo limpo por aqui
                            </p>
                        </div>
                    ) : (
                        (Object.entries(groupedExpenses) as [string, Task[]][]).map(([dateLabel, items]) => (
                            <div key={dateLabel} className="space-y-4">
                                <h2 className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] px-1">
                                    {dateLabel}
                                </h2>

                                <div className="space-y-3">
                                    {items.map((expense) => {
                                        const amount = typeof expense.amount === 'number'
                                            ? expense.amount
                                            : parseFloat(expense.amount || '0');
                                        const brandConfig = getBrandConfig(expense.title || '');
                                        const catColors = getCategoryColors(expense.category_id || 'other');
                                        const time = getTimeFromDate(expense.created_at || '');
                                        const isPaid = expense.status === 'completed';
                                        const isCompleting = completing === expense.id;

                                        const isImmediate = expense.entry_type === 'immediate' ||
                                            expense.entry_type === 'expense' ||
                                            (expense.purchase_date && !expense.due_date);

                                        return (
                                            <div
                                                key={expense.id}
                                                onClick={() => navigate(isImmediate ? `/edit-task/${expense.id}` : `/detail/${expense.id}`)}
                                                className={`card p-5 group ${isPaid ? 'opacity-60 bg-slate-50/50 grayscale-[0.5]' : ''}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    {/* Brand Logo or Icon */}
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border-2 border-white shadow-sm ${brandConfig?.bg || 'bg-slate-700'}`}>
                                                        {brandConfig?.logo ? (
                                                            <img
                                                                src={brandConfig.logo}
                                                                alt=""
                                                                className="w-10 h-10 object-contain"
                                                                onError={(e) => {
                                                                    const parent = e.currentTarget.parentElement;
                                                                    if (parent) {
                                                                        e.currentTarget.style.display = 'none';
                                                                        parent.innerHTML = `<span class="text-2xl">${brandConfig?.emoji || getCategoryEmoji(expense.category_id || 'other')}</span>`;
                                                                    }
                                                                }}
                                                            />
                                                        ) : (
                                                            <span className="text-2xl">{brandConfig?.emoji || getCategoryEmoji(expense.category_id || 'other')}</span>
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className={`font-black text-[16px] truncate tracking-tight transition-colors group-hover:text-primary-600 ${isPaid ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                                                            {expense.title}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${catColors.bg} ${catColors.text}`}>
                                                                {getCategoryLabel(expense.category_id || '')}
                                                            </span>
                                                            <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                                                            <span className="text-[10px] font-bold text-text-muted uppercase">{time || 'Recente'}</span>
                                                        </div>
                                                    </div>

                                                    {/* Amount & Status */}
                                                    <div className="text-right flex items-center gap-4">
                                                        <div>
                                                            <p className={`text-lg font-black tracking-tight ${isPaid ? 'text-text-muted' : 'text-text-primary'}`}>
                                                                -{formatCurrency(amount)}
                                                            </p>
                                                        </div>

                                                        {!isPaid && (
                                                            <button
                                                                onClick={(e) => handleMarkAsPaid(e, expense.id)}
                                                                disabled={isCompleting}
                                                                className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm flex items-center justify-center active:scale-95"
                                                            >
                                                                {isCompleting ? (
                                                                    <div className="w-5 h-5 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                                                ) : (
                                                                    <Check className="w-6 h-6 font-bold" />
                                                                )}
                                                            </button>
                                                        )}
                                                        {isPaid && (
                                                            <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                                                <Check className="w-6 h-6 font-black" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </section>
            </div>
        </div>
    );
};
