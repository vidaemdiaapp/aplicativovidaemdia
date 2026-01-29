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
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 pb-24 text-white selection:bg-emerald-500/30">
            {/* Header */}
            <header className="px-6 pt-16 pb-8 sticky top-0 bg-slate-950/80 backdrop-blur-xl z-20 border-b border-slate-800/50">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate('/financial-dashboard')}
                        className="flex items-center gap-2 text-slate-500 hover:text-white transition-all group"
                    >
                        <div className="p-2 rounded-full group-hover:bg-slate-800">
                            <ChevronLeft className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Retorno</span>
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 transition-all active:scale-90 shadow-xl"
                        >
                            <RefreshCw className={`w-5 h-5 text-emerald-400 ${syncing ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="w-11 h-11 rounded-2xl bg-emerald-500 flex items-center justify-center hover:bg-emerald-400 transition-all active:scale-90 shadow-[0_10px_20px_rgba(16,185,129,0.3)]"
                        >
                            <Plus className="w-6 h-6 text-slate-950" />
                        </button>
                    </div>
                </div>

                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tighter">Patrimônio</h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Visão Consolidada</p>
                    </div>
                </div>
            </header>

            <div className="p-6 space-y-8">

                <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 relative overflow-hidden group shadow-2xl">
                    {/* Background Accents */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px] -mr-24 -mt-24"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[60px] -ml-16 -mb-16"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2 font-mono">Total Balance (Elite)</p>
                                <h2 className="text-4xl font-black text-white tracking-tighter">{formatCurrency(summary.total_value)}</h2>
                            </div>
                            <div className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl border transition-all ${summary.yield_percentage >= 0
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                }`}>
                                {summary.yield_percentage >= 0 ? (
                                    <TrendingUp className="w-5 h-5" />
                                ) : (
                                    <TrendingDown className="w-5 h-5" />
                                )}
                                <span className="text-sm font-black tracking-tight">
                                    {summary.yield_percentage >= 0 ? '+' : ''}{summary.yield_percentage.toFixed(2)}%
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-800">
                            <div>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Custo de Aquisição</p>
                                <p className="text-xl font-black text-white">{formatCurrency(summary.total_invested)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Rendimento Bruto</p>
                                <p className={`text-xl font-black ${summary.total_yield >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {summary.total_yield >= 0 ? '+' : ''}{formatCurrency(summary.total_yield)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setShowOpenFinance(true)}
                    className="w-full bg-slate-900 border border-blue-500/20 rounded-[32px] p-6 flex items-center justify-between group hover:border-blue-500/50 transition-all relative overflow-hidden shadow-2xl"
                >
                    {/* Animated Background Ray */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[60px] -mr-32 -mt-32 animate-pulse"></div>

                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Landmark className="w-7 h-7 text-white" />
                        </div>
                        <div className="text-left">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-black text-white uppercase tracking-widest">Open Finance</p>
                                <span className="bg-blue-500/20 text-blue-400 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-[0.1em] border border-blue-500/30">Simulação Ativa</span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed uppercase tracking-wider">
                                Conecte contas e veja seus investimentos<br />atualizados automaticamente
                            </p>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-blue-500 group-hover:translate-x-1 transition-all">
                        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white" />
                    </div>
                </button>

                {/* Chart Section */}
                <section className="px-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">
                            Evolução Patrimonial
                        </h3>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">6 meses</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                        <div style={{ width: '100%', height: 180 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fill: '#64748B', fontSize: 10 }}
                                        axisLine={{ stroke: '#334155' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: '#64748B', fontSize: 10 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1E293B',
                                            border: '1px solid #334155',
                                            borderRadius: '8px'
                                        }}
                                        labelStyle={{ color: '#94A3B8' }}
                                        formatter={(value: number) => [formatCurrency(value), 'Patrimônio']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#10B981"
                                        strokeWidth={2}
                                        fill="url(#colorValue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </section>

                {/* Allocation Chart */}
                <section className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 mt-10">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-8">
                        Composição do Portfólio
                    </h3>
                    <div className="flex items-center gap-10">
                        <div style={{ width: 140, height: 140 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={summary.allocations}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {summary.allocations.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} cornerRadius={4} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex-1 space-y-3">
                            {summary.allocations.map((alloc, idx) => {
                                const config = TYPE_CONFIG[alloc.type as keyof typeof TYPE_CONFIG];
                                const Icon = config?.icon || Wallet;
                                return (
                                    <div key={idx} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.1)]"
                                                style={{ backgroundColor: alloc.color }}
                                            />
                                            <Icon className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                                            <span className="text-[11px] font-bold text-slate-400 group-hover:text-white transition-colors">{config?.label}</span>
                                        </div>
                                        <span className="text-xs font-black text-white">{alloc.percentage.toFixed(0)}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </div>

            {/* Investments List */}
            <section className="px-6 mt-10">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Seus Ativos</h3>
                        <p className="text-sm font-bold text-white">Detalhamento da Carteira</p>
                    </div>
                    <span className="text-[10px] bg-slate-800 px-3 py-1 rounded-full text-slate-500 font-black uppercase tracking-widest">{investments.length} Ativos</span>
                </div>

                <div className="space-y-4">
                    {investments.map(inv => {
                        const config = TYPE_CONFIG[inv.type];
                        const Icon = config?.icon || Wallet;
                        const yieldValue = inv.current_value - inv.invested_value;
                        const isPositive = yieldValue >= 0;

                        return (
                            <div
                                key={inv.id}
                                className="bg-slate-900 border border-slate-800 rounded-[24px] p-6 hover:border-slate-700 transition-all group relative overflow-hidden active:scale-[0.98]"
                            >
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="flex items-start gap-4">
                                        <div
                                            className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner"
                                            style={{ backgroundColor: `${config.color}15` }}
                                        >
                                            <Icon className="w-6 h-6" style={{ color: config.color }} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{inv.name}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{inv.institution}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        {inv.is_automatic && (
                                            <div className="px-3 py-1 bg-blue-500/10 rounded-xl border border-blue-500/20 mb-2">
                                                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Sincronizado</span>
                                            </div>
                                        )}
                                        <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>

                                <div className="flex justify-between items-end mt-8 pt-6 border-t border-slate-800/50">
                                    <div>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Posição Atual</p>
                                        <p className="text-xl font-black text-white tracking-tighter">{formatCurrency(inv.current_value)}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className={`flex items-center justify-end gap-1 mb-0.5 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            <span className="text-xs font-black uppercase tracking-widest">
                                                {isPositive ? '+' : ''}{formatCurrency(yieldValue)}
                                            </span>
                                        </div>
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${isPositive ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>
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
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-end justify-center">
            <div className="bg-slate-900 w-full max-w-lg rounded-t-[40px] p-8 border-t border-slate-800 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
                {/* Decoration */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-slate-800 rounded-full mt-4"></div>

                <div className="flex justify-between items-center mt-6 mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Elite Connections</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Open Finance Portal</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="bg-blue-500/5 border border-blue-500/20 rounded-3xl p-6 flex gap-4 mb-10 items-start">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-blue-400 uppercase tracking-widest mb-1">Modo Simulação Ativo</p>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed uppercase tracking-wider">
                            Escolha qualquer instituição abaixo para simular uma conexão segura de Open Finance 2.0. Nenhum dado real será acessado.
                        </p>
                    </div>
                </div>

                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {BANKS.map(bank => (
                        <div
                            key={bank.id}
                            className="flex items-center justify-between p-5 bg-slate-800/40 border border-slate-800 rounded-3xl hover:border-slate-700 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl shadow-inner border border-white/5">
                                    {bank.logo}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{bank.name}</p>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-0.5">Instituição Parceira</p>
                                </div>
                            </div>
                            <button
                                onClick={() => !bank.connected && handleConnect(bank.id)}
                                disabled={connecting === bank.id}
                                className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${bank.connected
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : connecting === bank.id
                                        ? 'bg-slate-800 text-slate-500'
                                        : 'bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/20'
                                    }`}
                            >
                                {bank.connected ? (
                                    <div className="flex items-center gap-2">
                                        <Check className="w-4 h-4" />
                                        CONECTADO
                                    </div>
                                ) : connecting === bank.id ? (
                                    <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
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
                    className="w-full mt-10 bg-emerald-500 hover:bg-emerald-400 p-5 rounded-[24px] font-black text-slate-950 uppercase tracking-widest text-xs transition-all shadow-[0_15px_30px_rgba(16,185,129,0.2)] active:scale-[0.98]"
                >
                    Sincronizar Patrimônio Simulado
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
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
            <div className="bg-slate-900 w-full max-w-lg rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-black text-white">Novo Investimento</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Type */}
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-2">Tipo</label>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.entries(TYPE_CONFIG).map(([key, config]) => {
                                const Icon = config.icon;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setForm({ ...form, type: key as Investment['type'] })}
                                        className={`p-3 rounded flex flex-col items-center gap-1 transition-colors ${form.type === key
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="text-[10px] font-bold">{config.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Nome</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Ex: CDB 120% CDI, IVVB11..."
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    {/* Institution */}
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Instituição</label>
                        <input
                            type="text"
                            value={form.institution}
                            onChange={(e) => setForm({ ...form, institution: e.target.value })}
                            placeholder="Ex: XP, Nubank, Rico..."
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    {/* Values */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Valor Atual</label>
                            <input
                                type="number"
                                value={form.current_value || ''}
                                onChange={(e) => setForm({ ...form, current_value: parseFloat(e.target.value) || 0 })}
                                placeholder="0,00"
                                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Valor Investido</label>
                            <input
                                type="number"
                                value={form.invested_value || ''}
                                onChange={(e) => setForm({ ...form, invested_value: parseFloat(e.target.value) || 0 })}
                                placeholder="0,00"
                                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={saving || !form.name.trim() || form.current_value <= 0}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:cursor-not-allowed p-4 rounded font-bold text-white transition-colors mt-2"
                    >
                        {saving ? 'Salvando...' : 'Adicionar Investimento'}
                    </button>
                </div>
            </div>
        </div>
    );
};
