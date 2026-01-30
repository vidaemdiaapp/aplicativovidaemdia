import React, { useState, useEffect } from 'react';
import {
    TrendingUp, TrendingDown, ChevronLeft, Plus, Wallet, PieChart as PieChartIcon,
    BarChart3, RefreshCw, ExternalLink, Building2, Coins, Landmark, BadgeDollarSign,
    ChevronRight, AlertCircle, Info, X, Check, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { supabase } from '../services/supabase';
import { tasksService } from '../services/tasks';
import { investmentsService, openFinanceService, Investment, PortfolioSummary } from '../services/financial';



interface HistoricalData {
    date: string;
    label: string;
    value: number;
}

// ═══════════════════════════════════════════════════════════════
// Mock Data (Simulated)
// ═══════════════════════════════════════════════════════════════

const MOCK_INVESTMENTS: Investment[] = [
    {
        id: '1',
        name: 'Tesouro Selic 2029',
        type: 'fixed_income',
        institution: 'Tesouro Direto',
        current_value: 15420.50,
        invested_value: 14000,
        yield_rate: 11.25,
        last_updated: new Date().toISOString(),
        is_automatic: true
    },
    {
        id: '2',
        name: 'CDB 120% CDI',
        type: 'fixed_income',
        institution: 'Nubank',
        current_value: 8750.00,
        invested_value: 8000,
        yield_rate: 13.50,
        last_updated: new Date().toISOString(),
        is_automatic: true
    },
    {
        id: '3',
        name: 'IVVB11 - S&P 500',
        type: 'stocks',
        institution: 'XP Investimentos',
        current_value: 12350.80,
        invested_value: 11000,
        yield_rate: 12.28,
        last_updated: new Date().toISOString(),
        is_automatic: false
    },
    {
        id: '4',
        name: 'MXRF11 - FII',
        type: 'real_estate',
        institution: 'Rico',
        current_value: 5200.00,
        invested_value: 5500,
        yield_rate: -5.45,
        last_updated: new Date().toISOString(),
        is_automatic: false
    },
    {
        id: '5',
        name: 'Bitcoin',
        type: 'crypto',
        institution: 'Mercado Bitcoin',
        current_value: 3800.00,
        invested_value: 2500,
        yield_rate: 52.00,
        last_updated: new Date().toISOString(),
        is_automatic: false
    }
];

const MOCK_HISTORY: HistoricalData[] = [
    { date: '2025-08', label: 'Ago', value: 38000 },
    { date: '2025-09', label: 'Set', value: 39500 },
    { date: '2025-10', label: 'Out', value: 41200 },
    { date: '2025-11', label: 'Nov', value: 42800 },
    { date: '2025-12', label: 'Dez', value: 44100 },
    { date: '2026-01', label: 'Jan', value: 45521.30 }
];

const TYPE_CONFIG = {
    stocks: { label: 'Ações/ETFs', icon: TrendingUp, color: '#3B82F6' },
    fixed_income: { label: 'Renda Fixa', icon: Landmark, color: '#10B981' },
    real_estate: { label: 'FIIs', icon: Building2, color: '#8B5CF6' },
    crypto: { label: 'Cripto', icon: Coins, color: '#F59E0B' },
    savings: { label: 'Poupança', icon: Wallet, color: '#6B7280' },
    other: { label: 'Outros', icon: BadgeDollarSign, color: '#EC4899' }
};

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

export const InvestmentsScreen: React.FC = () => {
    const navigate = useNavigate();
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [history, setHistory] = useState<HistoricalData[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showOpenFinance, setShowOpenFinance] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [realInvestments, summaryData] = await Promise.all([
                investmentsService.getAll(),
                investmentsService.getSummary()
            ]);

            if (realInvestments && realInvestments.length > 0) {
                setInvestments(realInvestments as any);
            } else {
                setInvestments(MOCK_INVESTMENTS);
            }

            // For history, we'll keep using mock since we don't have enough data points yet
            setHistory(MOCK_HISTORY);
        } catch (error) {
            console.error('Error loading investments:', error);
            setInvestments(MOCK_INVESTMENTS);
            setHistory(MOCK_HISTORY);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            await openFinanceService.syncData();
            await loadData();
        } catch (error) {
            console.error('Sync error:', error);
        } finally {
            setSyncing(false);
        }
    };

    const getPortfolioSummary = (): PortfolioSummary => {
        const total_value = investments.reduce((acc, inv) => acc + inv.current_value, 0);
        const total_invested = investments.reduce((acc, inv) => acc + inv.invested_value, 0);
        const total_yield = total_value - total_invested;
        const yield_percentage = total_invested > 0 ? (total_yield / total_invested) * 100 : 0;

        // Group by type
        const typeGroups: Record<string, number> = {};
        investments.forEach(inv => {
            typeGroups[inv.type] = (typeGroups[inv.type] || 0) + inv.current_value;
        });

        const allocations = Object.entries(typeGroups).map(([type, value]) => ({
            type,
            value,
            percentage: (value / total_value) * 100,
            color: TYPE_CONFIG[type as keyof typeof TYPE_CONFIG]?.color || '#6B7280'
        })).sort((a, b) => b.value - a.value);

        return { total_value, total_invested, total_yield, yield_percentage, allocations };
    };

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const summary = getPortfolioSummary();

    if (loading) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin"></div>
                    <p className="text-slate-400 text-sm font-medium animate-pulse uppercase tracking-widest leading-none">Analisando carteira...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pb-24 text-slate-900 font-sans">
            {/* Header */}
            <header className="px-6 pt-16 pb-8 sticky top-0 bg-white/80 backdrop-blur-xl z-20 border-b border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate('/financial-dashboard')}
                        className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-primary-600 transition-all active:scale-95 border border-slate-100"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className={`w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all active:scale-90 shadow-sm ${syncing ? 'text-primary-500' : 'text-slate-400'}`}
                        >
                            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="w-12 h-12 rounded-2xl bg-primary-500 flex items-center justify-center hover:bg-primary-600 transition-all active:scale-90 shadow-lg shadow-primary-500/20"
                        >
                            <Plus className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>

                <div className="flex items-end justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Investimentos</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-0.5">Visão Consolidada de Ativos</p>
                    </div>
                </div>
            </header>

            <div className="p-6 space-y-8">

                <div className="bg-white border border-slate-100 rounded-[32px] p-8 relative overflow-hidden group shadow-sm">
                    {/* Background Accents */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/5 rounded-full blur-[80px] -mr-24 -mt-24"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-10">
                            <div className="space-y-1">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-2 font-mono">Consolidado Geral</p>
                                <h2 className="text-4xl font-bold text-slate-900 tracking-tight">{formatCurrency(summary.total_value)}</h2>
                            </div>
                            <div className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border shadow-sm transition-all ${summary.yield_percentage >= 0
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                : 'bg-rose-50 border-rose-100 text-rose-600'
                                }`}>
                                {summary.yield_percentage >= 0 ? (
                                    <TrendingUp className="w-5 h-5" />
                                ) : (
                                    <TrendingDown className="w-5 h-5" />
                                )}
                                <span className="text-[15px] font-bold tracking-tight">
                                    {summary.yield_percentage >= 0 ? '+' : ''}{summary.yield_percentage.toFixed(2)}%
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                            <div className="space-y-1">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 pl-0.5">Total Investido</p>
                                <p className="text-xl font-bold text-slate-700 tracking-tight">{formatCurrency(summary.total_invested)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 pl-0.5">Rendimento</p>
                                <p className={`text-xl font-bold tracking-tight ${summary.total_yield >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {summary.total_yield >= 0 ? '+' : ''}{formatCurrency(summary.total_yield)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setShowOpenFinance(true)}
                    className="w-full bg-white border border-slate-100 rounded-[32px] p-6 flex items-center justify-between group hover:border-primary-100/50 hover:bg-slate-50/30 transition-all relative overflow-hidden shadow-sm"
                >
                    {/* Background Ray */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-[60px] -mr-32 -mt-32"></div>

                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <Landmark className="w-7 h-7 text-primary-500" />
                        </div>
                        <div className="text-left">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-[13px] font-bold text-slate-800 uppercase tracking-widest">Open Finance</p>
                                <span className="bg-primary-50 text-primary-600 text-[8px] font-bold px-2 py-0.5 rounded border border-primary-100 uppercase tracking-widest">Ativo</span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium leading-tight uppercase tracking-widest">
                                Conecte contas e veja seus investimentos<br />centralizados num só lugar
                            </p>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-primary-500 group-hover:translate-x-1 group-hover:shadow-lg transition-all border border-slate-100 group-hover:border-primary-500">
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-white" />
                    </div>
                </button>

                {/* Chart Section */}
                <section>
                    <div className="flex justify-between items-end mb-5 ml-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Evolução Patrimonial</p>
                        <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-slate-50">6 meses</span>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm">
                        <div style={{ width: '100%', height: 200 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #f1f5f9',
                                            borderRadius: '16px',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                                        }}
                                        labelStyle={{ color: '#64748B', fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}
                                        itemStyle={{ fontSize: '11px', fontWeight: 600 }}
                                        formatter={(value: number) => [formatCurrency(value), 'Patrimônio']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#3B82F6"
                                        strokeWidth={3}
                                        fill="url(#colorValue)"
                                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </section>

                {/* Allocation Chart */}
                <section className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-8 pl-0.5">
                        Alocação de Portfólio
                    </h3>
                    <div className="flex items-center gap-10">
                        <div style={{ width: 140, height: 140 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={summary.allocations}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={52}
                                        outerRadius={70}
                                        paddingAngle={6}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {summary.allocations.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} cornerRadius={6} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex-1 space-y-4">
                            {summary.allocations.map((alloc, idx) => {
                                const config = TYPE_CONFIG[alloc.type as keyof typeof TYPE_CONFIG];
                                const Icon = config?.icon || Wallet;
                                return (
                                    <div key={idx} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-2.5 h-2.5 rounded-full shadow-sm"
                                                style={{ backgroundColor: alloc.color }}
                                            />
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner group-hover:scale-110 transition-transform">
                                                <Icon className="w-4 h-4 text-slate-500" style={{ color: alloc.color }} />
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-900 transition-colors uppercase tracking-widest">{config?.label}</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-900">{alloc.percentage.toFixed(0)}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </div>

            {/* Investments List */}
            <section className="px-1 mt-10">
                <div className="flex justify-between items-end mb-6 ml-5">
                    <div className="space-y-1">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Carteira de Ativos</h3>
                        <p className="text-sm font-bold text-slate-900 tracking-tight">Detalhamento Individual</p>
                    </div>
                    <span className="text-[9px] bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-slate-400 font-bold uppercase tracking-widest shadow-inner mr-5">{investments.length} ATIVOS</span>
                </div>

                <div className="space-y-4 px-5">
                    {investments.map(inv => {
                        const config = TYPE_CONFIG[inv.type];
                        const Icon = config?.icon || Wallet;
                        const yieldValue = inv.current_value - inv.invested_value;
                        const isPositive = yieldValue >= 0;

                        return (
                            <div
                                key={inv.id}
                                className="bg-white border border-slate-100 rounded-[28px] p-6 hover:shadow-md transition-all group relative overflow-hidden active:scale-[0.98] shadow-sm"
                            >
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="flex items-start gap-4">
                                        <div
                                            className="w-12 h-12 rounded-2xl flex items-center justify-center border border-slate-50 shadow-inner group-hover:scale-110 transition-transform"
                                            style={{ backgroundColor: `${config.color}10` }}
                                        >
                                            <Icon className="w-6 h-6" style={{ color: config.color }} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[15px] font-bold text-slate-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{inv.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{inv.institution}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        {inv.is_automatic && (
                                            <div className="px-3 py-1.5 bg-primary-50 rounded-xl border border-primary-100 mb-2 shadow-sm">
                                                <span className="text-[8px] font-bold text-primary-600 uppercase tracking-widest">Sincronizado</span>
                                            </div>
                                        )}
                                        <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-primary-50 group-hover:text-primary-500 group-hover:border-primary-100 transition-all">
                                            <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-end mt-8 pt-6 border-t border-slate-50">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 pl-0.5">Saldo Atual</p>
                                        <p className="text-[20px] font-bold text-slate-900 tracking-tight leading-none">{formatCurrency(inv.current_value)}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className={`flex items-center justify-end gap-1 mb-1 font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            <span className="text-[11px] uppercase tracking-widest underline decoration-2 underline-offset-4">
                                                {isPositive ? '+' : ''}{formatCurrency(yieldValue)}
                                            </span>
                                        </div>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest ${isPositive ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>
                                            {isPositive ? '+' : ''}{inv.yield_rate.toFixed(2)}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Open Finance Modal */}
            {showOpenFinance && (
                <OpenFinanceModal onClose={() => setShowOpenFinance(false)} onSync={handleSync} />
            )}

            {/* Add Investment Modal */}
            {showAddModal && (
                <AddInvestmentModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        loadData();
                    }}
                />
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// Open Finance Modal
// ═══════════════════════════════════════════════════════════════

interface OpenFinanceModalProps {
    onClose: () => void;
    onSync: () => void;
}

const BANKS = [
    { id: 'nubank', name: 'Nubank', logo: '💜', connected: true },
    { id: 'itau', name: 'Itaú', logo: '🧡', connected: false },
    { id: 'bradesco', name: 'Bradesco', logo: '❤️', connected: false },
    { id: 'bb', name: 'Banco do Brasil', logo: '💛', connected: false },
    { id: 'santander', name: 'Santander', logo: '❤️', connected: false },
    { id: 'xp', name: 'XP Investimentos', logo: '🖤', connected: true },
    { id: 'btg', name: 'BTG Pactual', logo: '💙', connected: false },
    { id: 'inter', name: 'Banco Inter', logo: '🧡', connected: false }
];

const OpenFinanceModal: React.FC<OpenFinanceModalProps> = ({ onClose, onSync }) => {
    const [connecting, setConnecting] = useState<string | null>(null);

    const handleConnect = async (bankId: string) => {
        setConnecting(bankId);
        // Simulate connection
        await new Promise(resolve => setTimeout(resolve, 2000));
        setConnecting(null);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center">
            <div className="bg-white w-full max-w-lg rounded-t-[40px] p-8 max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8"></div>

                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Open Finance</h2>
                        <p className="text-sm text-slate-400 font-medium">Conecte suas instituições bancárias</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="bg-primary-50 border border-primary-100 rounded-3xl p-6 flex gap-4 mb-10 items-start shadow-inner">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-primary-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Shield className="w-6 h-6 text-primary-500" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[13px] font-bold text-primary-600 uppercase tracking-widest">Protocolo Seguro 2.0</p>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed uppercase tracking-wider">
                            Escolha uma instituição para simular uma conexão segura. Seus dados são criptografados de ponta a ponta.
                        </p>
                    </div>
                </div>

                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 no-scrollbar">
                    {BANKS.map(bank => (
                        <div
                            key={bank.id}
                            className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-slate-100/50 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
                                    {bank.logo}
                                </div>
                                <div>
                                    <p className="text-[15px] font-bold text-slate-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{bank.name}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Instituição Autorizada</p>
                                </div>
                            </div>
                            <button
                                onClick={() => !bank.connected && handleConnect(bank.id)}
                                disabled={connecting === bank.id}
                                className={`px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm active:scale-95 ${bank.connected
                                    ? 'bg-emerald-100 text-emerald-600 border border-emerald-200 cursor-default'
                                    : connecting === bank.id
                                        ? 'bg-slate-100 text-slate-400'
                                        : 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                                    }`}
                            >
                                {bank.connected ? (
                                    <div className="flex items-center gap-2">
                                        <Check className="w-4 h-4" />
                                        CONECTADO
                                    </div>
                                ) : connecting === bank.id ? (
                                    <RefreshCw className="w-4 h-4 animate-spin text-primary-500" />
                                ) : (
                                    'CONECTAR'
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => {
                        onSync();
                        onClose();
                    }}
                    className="w-full mt-10 bg-primary-500 hover:bg-primary-600 p-5 rounded-2xl font-bold text-white uppercase tracking-widest text-xs transition-all shadow-xl shadow-primary-500/20 active:scale-[0.98]"
                >
                    Sincronizar Patrimônio Digital
                </button>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// Add Investment Modal
// ═══════════════════════════════════════════════════════════════

interface AddInvestmentModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const AddInvestmentModal: React.FC<AddInvestmentModalProps> = ({ onClose, onSuccess }) => {
    const [form, setForm] = useState({
        name: '',
        type: 'fixed_income' as Investment['type'],
        institution: '',
        current_value: 0,
        invested_value: 0
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        if (!form.name.trim() || form.current_value <= 0) return;
        setSaving(true);
        // Simulate save
        await new Promise(resolve => setTimeout(resolve, 500));
        setSaving(false);
        onSuccess();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center">
            <div className="bg-white w-full max-w-lg rounded-t-[40px] p-8 max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8"></div>

                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Novo Ativo</h2>
                        <p className="text-sm text-slate-400 font-medium">Cadastre um investimento manualmente</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-8">
                    {/* Type Choice */}
                    <div className="space-y-3">
                        <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest px-1">Selecione o Tipo</label>
                        <div className="grid grid-cols-3 gap-3">
                            {Object.entries(TYPE_CONFIG).map(([key, config]) => {
                                const Icon = config.icon;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setForm({ ...form, type: key as Investment['type'] })}
                                        className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all shadow-sm border ${form.type === key
                                            ? 'bg-primary-500 text-white border-primary-500 shadow-primary-500/20 scale-105'
                                            : 'bg-white text-slate-400 hover:bg-slate-50 border-slate-100 hover:text-slate-600'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-lg ${form.type === key ? 'bg-white/20' : 'bg-slate-50'}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{config.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest px-1">Nome do Ativo</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Ex: CDB 120% CDI, IVVB11..."
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                        />
                    </div>

                    {/* Institution */}
                    <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest px-1">Instituição</label>
                        <input
                            type="text"
                            value={form.institution}
                            onChange={(e) => setForm({ ...form, institution: e.target.value })}
                            placeholder="Ex: XP, Nubank, Rico..."
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                        />
                    </div>

                    {/* Values */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest px-1">Valor Atual</label>
                            <input
                                type="number"
                                value={form.current_value || ''}
                                onChange={(e) => setForm({ ...form, current_value: parseFloat(e.target.value) || 0 })}
                                placeholder="0,00"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest px-1">Capital Investido</label>
                            <input
                                type="number"
                                value={form.invested_value || ''}
                                onChange={(e) => setForm({ ...form, invested_value: parseFloat(e.target.value) || 0 })}
                                placeholder="0,00"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-bold"
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={saving || !form.name.trim() || form.current_value <= 0}
                        className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed py-5 rounded-2xl font-bold text-white transition-all mt-4 shadow-xl shadow-primary-500/20 active:scale-[0.98] text-lg"
                    >
                        {saving ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Processando...</span>
                            </div>
                        ) : 'Confirmar Investimento'}
                    </button>
                </div>
            </div>
        </div>
    );
};
