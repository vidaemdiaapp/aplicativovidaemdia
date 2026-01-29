import React, { useState, useEffect } from 'react';
import {
    TrendingUp, TrendingDown, ChevronLeft, Plus, Wallet, PieChart as PieChartIcon,
    BarChart3, RefreshCw, ExternalLink, Building2, Coins, Landmark, BadgeDollarSign,
    ChevronRight, AlertCircle, Info, X, Check
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
        <div className="min-h-screen bg-slate-950 pb-24 text-white">
            {/* Header */}
            <div className="px-6 pt-16 pb-6">
                <button
                    onClick={() => navigate('/financial-dashboard')}
                    className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-4"
                >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">Voltar</span>
                </button>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-black text-white">Investimentos</h1>
                        <p className="text-sm text-slate-500 mt-1">Seu patrimônio consolidado</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors border border-slate-700"
                        >
                            <RefreshCw className={`w-5 h-5 text-slate-300 ${syncing ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="w-10 h-10 rounded bg-emerald-500 flex items-center justify-center hover:bg-emerald-400 transition-colors"
                        >
                            <Plus className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Portfolio Summary Card */}
            <div className="px-6 mb-6">
                <div className="bg-gradient-to-br from-emerald-900/50 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Patrimônio Total</p>
                            <h2 className="text-4xl font-black text-white">{formatCurrency(summary.total_value)}</h2>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded ${summary.yield_percentage >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                            }`}>
                            {summary.yield_percentage >= 0 ? (
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                            ) : (
                                <TrendingDown className="w-4 h-4 text-rose-500" />
                            )}
                            <span className={`text-sm font-bold ${summary.yield_percentage >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                }`}>
                                {summary.yield_percentage >= 0 ? '+' : ''}{summary.yield_percentage.toFixed(2)}%
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Investido</p>
                            <p className="text-lg font-bold text-white">{formatCurrency(summary.total_invested)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Rendimento</p>
                            <p className={`text-lg font-bold ${summary.total_yield >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {summary.total_yield >= 0 ? '+' : ''}{formatCurrency(summary.total_yield)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Open Finance Banner */}
            <div className="px-6 mb-6">
                <button
                    onClick={() => setShowOpenFinance(true)}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg p-4 flex items-center justify-between group hover:from-blue-500 hover:to-cyan-500 transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                            <Landmark className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-white">Open Finance</p>
                            <p className="text-[10px] text-white/70">Conecte suas contas automaticamente</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/50 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

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
            <section className="px-6 mb-6">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-4">
                    Alocação por Tipo
                </h3>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center gap-6">
                    <div style={{ width: 120, height: 120 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={summary.allocations}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={35}
                                    outerRadius={50}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {summary.allocations.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2">
                        {summary.allocations.map((alloc, idx) => {
                            const config = TYPE_CONFIG[alloc.type as keyof typeof TYPE_CONFIG];
                            const Icon = config?.icon || Wallet;
                            return (
                                <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-sm"
                                            style={{ backgroundColor: alloc.color }}
                                        />
                                        <Icon className="w-3.5 h-3.5 text-slate-400" />
                                        <span className="text-xs text-slate-300">{config?.label}</span>
                                    </div>
                                    <span className="text-xs font-bold text-white">{alloc.percentage.toFixed(0)}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Investments List */}
            <section className="px-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">
                        Seus Investimentos
                    </h3>
                    <span className="text-[10px] text-slate-500">{investments.length} ativos</span>
                </div>
                <div className="space-y-2">
                    {investments.map(inv => {
                        const config = TYPE_CONFIG[inv.type];
                        const Icon = config?.icon || Wallet;
                        const yieldValue = inv.current_value - inv.invested_value;
                        const isPositive = yieldValue >= 0;

                        return (
                            <div
                                key={inv.id}
                                className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                        <div
                                            className="w-10 h-10 rounded flex items-center justify-center"
                                            style={{ backgroundColor: `${config.color}20` }}
                                        >
                                            <Icon className="w-5 h-5" style={{ color: config.color }} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{inv.name}</p>
                                            <p className="text-[10px] text-slate-500">{inv.institution}</p>
                                        </div>
                                    </div>
                                    {inv.is_automatic && (
                                        <div className="px-2 py-0.5 bg-blue-500/10 rounded">
                                            <span className="text-[9px] font-bold text-blue-400 uppercase">Auto</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between items-end mt-3">
                                    <div>
                                        <p className="text-lg font-black text-white">{formatCurrency(inv.current_value)}</p>
                                        <p className="text-[10px] text-slate-500">
                                            Investido: {formatCurrency(inv.invested_value)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {isPositive ? '+' : ''}{formatCurrency(yieldValue)}
                                        </p>
                                        <p className={`text-[10px] ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
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
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
            <div className="bg-slate-900 w-full max-w-lg rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-lg font-black text-white">Open Finance</h2>
                        <p className="text-sm text-slate-500">Conecte suas instituições financeiras</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3 mb-6">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm text-blue-300 font-medium">Seus dados estão seguros</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Utilizamos criptografia de ponta e seguimos todas as normas do Banco Central.
                            Você pode revogar o acesso a qualquer momento.
                        </p>
                    </div>
                </div>

                {/* Banks List */}
                <div className="space-y-2">
                    {BANKS.map(bank => (
                        <div
                            key={bank.id}
                            className="flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-lg"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xl">
                                    {bank.logo}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{bank.name}</p>
                                    {bank.connected && (
                                        <p className="text-[10px] text-emerald-500 font-medium">Conectado</p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => !bank.connected && handleConnect(bank.id)}
                                disabled={connecting === bank.id}
                                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${bank.connected
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : connecting === bank.id
                                        ? 'bg-slate-700 text-slate-400'
                                        : 'bg-blue-500 hover:bg-blue-400 text-white'
                                    }`}
                            >
                                {bank.connected ? (
                                    <Check className="w-4 h-4" />
                                ) : connecting === bank.id ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    'Conectar'
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
                    className="w-full mt-6 bg-emerald-500 hover:bg-emerald-400 p-4 rounded-lg font-bold text-white transition-colors"
                >
                    Sincronizar Dados
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
