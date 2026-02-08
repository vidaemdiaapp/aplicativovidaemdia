import React, { useState, useEffect } from 'react';
import {
    PiggyBank, Plus, ChevronLeft, ChevronRight, Target, Sparkles,
    Lock, Unlock, ArrowUpCircle, ArrowDownCircle, X, Calendar,
    TrendingUp, Zap, Gift, Shield, MoreVertical, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { savingsGoalsService, SavingsGoal, SavingsTransaction } from '../services/financial';

const GOAL_TYPES = [
    { id: 'emergency', label: 'Reserva de Emergência', icon: Shield, color: '#10B981' },
    { id: 'objective', label: 'Objetivo Específico', icon: Target, color: '#06B6D4' },
    { id: 'automatic', label: 'Poupança Automática', icon: Zap, color: '#F59E0B' },
    { id: 'tax', label: 'IRPF / Tributos', icon: TrendingUp, color: '#F43F5E' }
];

const GOAL_COLORS = [
    '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6',
    '#EC4899', '#F43F5E', '#F59E0B', '#6B7280'
];

export const SavingsGoalsScreen: React.FC = () => {
    const navigate = useNavigate();
    const [goals, setGoals] = useState<SavingsGoal[]>([]);
    const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
    const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const goalsData = await savingsGoalsService.getAll();
        setGoals(goalsData);
        if (goalsData.length > 0 && !selectedGoal) {
            setSelectedGoal(goalsData[0]);
            loadTransactions(goalsData[0].id);
        }
        setLoading(false);
    };

    const loadTransactions = async (goalId: string) => {
        const txs = await savingsGoalsService.getTransactions(goalId);
        setTransactions(txs);
    };

    const handleGoalSelect = (goal: SavingsGoal) => {
        setSelectedGoal(goal);
        loadTransactions(goal.id);
    };

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short'
        });
    };

    const getProgress = (goal: SavingsGoal) => {
        if (!goal.target_amount || goal.target_amount === 0) return 0;
        return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
    };

    const getTotalSaved = () => goals.reduce((acc, g) => acc + g.current_amount, 0);
    const getTotalTarget = () => goals.reduce((acc, g) => acc + g.target_amount, 0);

    const getGoalTypeConfig = (type: string) => {
        return GOAL_TYPES.find(t => t.id === type) || GOAL_TYPES[0];
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface pb-24">
                <header className="bg-primary-500 pt-14 pb-24 px-6 relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-400/30 rounded-full blur-3xl" />
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-white/20 animate-pulse" />
                        <div className="w-32 h-8 rounded bg-white/20 animate-pulse" />
                    </div>
                </header>
                <div className="px-4 -mt-16 relative z-20">
                    <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-100">
                        <div className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pb-24 text-text-primary">
            {/* ═══════════════════════════════════════════════════════════════
                HERO: Blue Gradient Header
            ═══════════════════════════════════════════════════════════════ */}
            <header className="bg-primary-500 pt-14 pb-24 px-6 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-400/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-20 w-48 h-48 bg-primary-600/20 rounded-full blur-2xl" />

                <div className="flex items-center justify-between relative z-10 mb-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/financial-dashboard')}
                            className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm text-white/80 hover:bg-white/20 flex items-center justify-center transition-all"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <p className="text-primary-100 text-[10px] font-bold uppercase tracking-widest">Poupança</p>
                            <h1 className="text-white text-2xl font-bold">Meus Cofrinhos</h1>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 flex items-center justify-center transition-all"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-white/70 text-sm font-medium pl-14 relative z-10">
                    {goals.length} meta(s) ativa(s)
                </p>
            </header>

            {/* ═══════════════════════════════════════════════════════════════
                FLOATING TOTAL SUMMARY CARD
            ═══════════════════════════════════════════════════════════════ */}
            <div className="px-4 -mt-16 relative z-20">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                            <PiggyBank className="w-7 h-7 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Total Poupado</p>
                            <p className="text-3xl font-black text-slate-800 tracking-tight">{formatCurrency(getTotalSaved())}</p>
                        </div>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-700"
                            style={{ width: `${getTotalTarget() > 0 ? (getTotalSaved() / getTotalTarget()) * 100 : 0}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between mt-3 px-1">
                        <span className="text-xs text-slate-400 font-medium">{((getTotalSaved() / getTotalTarget()) * 100 || 0).toFixed(0)}% do objetivo</span>
                        <span className="text-xs text-slate-400 font-medium">Meta: {formatCurrency(getTotalTarget())}</span>
                    </div>
                </div>
            </div>

            {/* Goals List */}
            {goals.length === 0 ? (
                <div className="px-6 mt-8">
                    <div className="bg-white border border-dashed border-border-color rounded-3xl p-10 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <PiggyBank className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-text-primary font-bold mb-2">Nenhum cofrinho criado</p>
                        <p className="text-text-muted text-sm mb-6 max-w-[220px] mx-auto">Comece sua reserva financeira agora mesmo!</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-bold transition-all shadow-md active:scale-[0.98]"
                        >
                            Criar Cofrinho
                        </button>
                    </div>
                </div>
            ) : (
                <section className="px-6 mt-10 mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-text-muted mb-4 px-1">
                        Seus Cofrinhos
                    </h3>
                    <div className="space-y-4">
                        {goals.map((goal) => {
                            const config = getGoalTypeConfig(goal.goal_type);
                            const Icon = config.icon;
                            const progress = getProgress(goal);

                            return (
                                <div
                                    key={goal.id}
                                    onClick={() => handleGoalSelect(goal)}
                                    className={`p-5 bg-white border rounded-[28px] cursor-pointer transition-all shadow-sm ${selectedGoal?.id === goal.id
                                        ? 'border-primary-500 ring-4 ring-primary-500/5'
                                        : 'border-border-color hover:border-primary-200 hover:shadow-md'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                                                style={{ backgroundColor: `${goal.color}15` }}
                                            >
                                                <Icon className="w-6 h-6" style={{ color: goal.color }} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-text-primary">{goal.name}</p>
                                                <p className="text-[11px] text-text-muted font-medium">{config.label}</p>
                                            </div>
                                        </div>
                                        {goal.is_locked && (
                                            <Lock className="w-4 h-4 text-amber-500" />
                                        )}
                                    </div>

                                    <div className="mb-2">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-2xl font-bold text-text-primary tracking-tight">
                                                {formatCurrency(goal.current_amount)}
                                            </span>
                                            <span className="text-xs font-bold text-text-secondary">
                                                {progress.toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full transition-all duration-1000 ease-out"
                                                style={{
                                                    width: `${progress}%`,
                                                    backgroundColor: goal.color
                                                }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mt-3">
                                        <span className="text-[11px] text-text-muted font-medium">
                                            Meta: {formatCurrency(goal.target_amount)}
                                        </span>
                                        {goal.deadline && (
                                            <span className="text-[11px] text-text-muted font-bold flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(goal.deadline)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Selected Goal Actions */}
            {selectedGoal && !selectedGoal.is_locked && (
                <section className="px-6 mb-8">
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-primary-500 hover:bg-primary-600 p-5 rounded-3xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary-500/20"
                        >
                            <ArrowUpCircle className="w-5 h-5 text-white" />
                            <span className="text-[15px] font-bold text-white">Depositar</span>
                        </button>
                        <button
                            onClick={() => setShowWithdrawModal(true)}
                            className="bg-white border border-border-color hover:border-primary-200 p-5 rounded-3xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                        >
                            <ArrowDownCircle className="w-5 h-5 text-text-secondary" />
                            <span className="text-[15px] font-bold text-text-secondary">Retirar</span>
                        </button>
                    </div>
                </section>
            )}

            {/* Transactions History */}
            {selectedGoal && transactions.length > 0 && (
                <section className="px-6 pb-12">
                    <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-text-muted mb-4 px-1">
                        Histórico - {selectedGoal.name}
                    </h3>
                    <div className="space-y-3">
                        {transactions.slice(0, 10).map((tx) => (
                            <div
                                key={tx.id}
                                className="flex justify-between items-center p-5 bg-white border border-slate-50 rounded-3xl shadow-sm hover:border-primary-100 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${tx.transaction_type === 'deposit'
                                        ? 'bg-emerald-50 text-emerald-500'
                                        : 'bg-rose-50 text-rose-500'
                                        }`}>
                                        {tx.transaction_type === 'deposit' ? (
                                            <ArrowUpCircle className="w-6 h-6" />
                                        ) : (
                                            <ArrowDownCircle className="w-6 h-6" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-text-primary">
                                            {tx.transaction_type === 'deposit' ? 'Depósito' : 'Retirada'}
                                        </p>
                                        <p className="text-[11px] text-text-muted font-medium">
                                            {formatDate(tx.created_at)}
                                            {tx.note && ` • ${tx.note}`}
                                        </p>
                                    </div>
                                </div>
                                <p className={`text-lg font-bold tracking-tight ${tx.transaction_type === 'deposit' ? 'text-emerald-500' : 'text-rose-500'
                                    }`}>
                                    {tx.transaction_type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Modals */}
            <AddGoalModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => {
                    setShowAddModal(false);
                    loadData();
                }}
            />

            {selectedGoal && (
                <>
                    <TransactionModal
                        isOpen={showDepositModal}
                        onClose={() => setShowDepositModal(false)}
                        type="deposit"
                        goalId={selectedGoal.id}
                        goalName={selectedGoal.name}
                        onSuccess={() => {
                            setShowDepositModal(false);
                            loadData();
                            loadTransactions(selectedGoal.id);
                        }}
                    />
                    <TransactionModal
                        isOpen={showWithdrawModal}
                        onClose={() => setShowWithdrawModal(false)}
                        type="withdrawal"
                        goalId={selectedGoal.id}
                        goalName={selectedGoal.name}
                        maxAmount={selectedGoal.current_amount}
                        onSuccess={() => {
                            setShowWithdrawModal(false);
                            loadData();
                            loadTransactions(selectedGoal.id);
                        }}
                    />
                </>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// Add Goal Modal
// ═══════════════════════════════════════════════════════════════

interface AddGoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddGoalModal: React.FC<AddGoalModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [form, setForm] = useState({
        name: '',
        goal_type: 'emergency' as SavingsGoal['goal_type'],
        target_amount: 0,
        deadline: '',
        color: GOAL_COLORS[0],
        icon: 'piggy-bank',
        is_locked: false,
        auto_deposit_enabled: false,
        auto_deposit_amount: 0,
        auto_deposit_frequency: 'monthly' as 'weekly' | 'monthly'
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        if (!form.name.trim() || form.target_amount <= 0) return;

        setSaving(true);
        const result = await savingsGoalsService.create({
            name: form.name,
            goal_type: form.goal_type,
            target_amount: form.target_amount,
            deadline: form.deadline || null,
            color: form.color,
            icon: form.icon,
            is_locked: form.is_locked,
            auto_deposit_enabled: form.auto_deposit_enabled,
            auto_deposit_amount: form.auto_deposit_enabled ? form.auto_deposit_amount : null,
            auto_deposit_frequency: form.auto_deposit_enabled ? form.auto_deposit_frequency : null
        });
        setSaving(false);

        if (result) {
            onSuccess();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center">
            <div className="bg-white w-full max-w-lg rounded-t-[40px] p-8 max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8"></div>
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary tracking-tight">Novo Cofrinho</h2>
                        <p className="text-sm text-text-muted font-medium">Defina sua próxima conquista financeira</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Goal Type */}
                    <div>
                        <label className="text-[11px] text-text-muted font-bold uppercase tracking-widest px-1 block mb-3">
                            Tipo de Meta
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {GOAL_TYPES.map((type) => {
                                const Icon = type.icon;
                                return (
                                    <button
                                        key={type.id}
                                        onClick={() => setForm({ ...form, goal_type: type.id as SavingsGoal['goal_type'], color: type.color })}
                                        className={`p-4 rounded-2xl flex items-center gap-2 transition-all group ${form.goal_type === type.id
                                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20 scale-105'
                                            : 'bg-slate-50 text-text-secondary hover:bg-slate-100'
                                            }`}
                                    >
                                        <Icon className={`w-5 h-5 ${form.goal_type === type.id ? 'text-white' : 'text-text-muted transition-colors group-hover:text-primary-500'}`} />
                                        <span className="text-xs font-bold">{type.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="text-[11px] text-text-muted font-bold uppercase tracking-widest px-1 block mb-2">
                            Nome do Cofrinho
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Ex: Reserva, Viagem, Investimento..."
                            className="w-full bg-slate-50 border border-border-color rounded-2xl px-5 py-4 text-text-primary placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                        />
                    </div>

                    {/* Target Amount */}
                    <div>
                        <label className="text-[11px] text-text-muted font-bold uppercase tracking-widest px-1 block mb-2">
                            Valor da Meta
                        </label>
                        <input
                            type="number"
                            value={form.target_amount || ''}
                            onChange={(e) => setForm({ ...form, target_amount: parseFloat(e.target.value) || 0 })}
                            placeholder="0,00"
                            className="w-full bg-slate-50 border border-border-color rounded-2xl px-5 py-4 text-text-primary placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-bold"
                        />
                    </div>

                    {/* Deadline */}
                    <div>
                        <label className="text-[11px] text-text-muted font-bold uppercase tracking-widest px-1 block mb-2">
                            Data Limite (Opcional)
                        </label>
                        <input
                            type="date"
                            value={form.deadline}
                            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                            className="w-full bg-slate-50 border border-border-color rounded-2xl px-5 py-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                        />
                    </div>

                    {/* Color */}
                    <div>
                        <label className="text-[11px] text-text-muted font-bold uppercase tracking-widest px-1 block mb-3">
                            Cor
                        </label>
                        <div className="flex gap-2">
                            {GOAL_COLORS.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setForm({ ...form, color })}
                                    className={`w-8 h-8 rounded-full transition-all ${form.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : ''
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Lock Toggle */}
                    <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[28px] border border-border-color">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                                <Lock className="w-6 h-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="font-bold text-text-primary">Cofrinho Trancado</p>
                                <p className="text-[11px] text-text-muted font-medium">Impede retiradas até a meta</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setForm({ ...form, is_locked: !form.is_locked })}
                            className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${form.is_locked ? 'bg-amber-500' : 'bg-slate-200'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${form.is_locked ? 'translate-x-6' : ''}`}></div>
                        </button>
                    </div>

                    {/* Auto Deposit Toggle */}
                    <div className="flex items-center justify-between p-3 bg-slate-800 rounded">
                        <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-amber-500" />
                            <div>
                                <p className="text-sm font-bold text-white">Depósito Automático</p>
                                <p className="text-[10px] text-slate-500">Lembrete periódico para poupar</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setForm({ ...form, auto_deposit_enabled: !form.auto_deposit_enabled })}
                            className={`w-12 h-6 rounded-full transition-colors ${form.auto_deposit_enabled ? 'bg-amber-500' : 'bg-slate-700'
                                }`}
                        >
                            <div
                                className={`w-5 h-5 bg-white rounded-full transition-transform ml-0.5 ${form.auto_deposit_enabled ? 'translate-x-6' : ''
                                    }`}
                            ></div>
                        </button>
                    </div>

                    {form.auto_deposit_enabled && (
                        <div className="space-y-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded">
                            <div>
                                <label className="text-[10px] text-amber-500 font-bold uppercase block mb-1">
                                    Valor do Depósito
                                </label>
                                <input
                                    type="number"
                                    value={form.auto_deposit_amount || ''}
                                    onChange={(e) => setForm({ ...form, auto_deposit_amount: parseFloat(e.target.value) || 0 })}
                                    placeholder="0,00"
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-amber-500 font-bold uppercase block mb-2">
                                    Frequência
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setForm({ ...form, auto_deposit_frequency: 'weekly' })}
                                        className={`flex-1 px-3 py-2 rounded text-xs font-bold uppercase transition-colors ${form.auto_deposit_frequency === 'weekly'
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-slate-800 text-slate-400'
                                            }`}
                                    >
                                        Semanal
                                    </button>
                                    <button
                                        onClick={() => setForm({ ...form, auto_deposit_frequency: 'monthly' })}
                                        className={`flex-1 px-3 py-2 rounded text-xs font-bold uppercase transition-colors ${form.auto_deposit_frequency === 'monthly'
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-slate-800 text-slate-400'
                                            }`}
                                    >
                                        Mensal
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={saving || !form.name.trim() || form.target_amount <= 0}
                        className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-slate-100 disabled:text-text-muted disabled:cursor-not-allowed py-5 rounded-2xl font-bold text-white transition-all mt-6 shadow-xl shadow-primary-500/20 active:scale-[0.98] text-lg"
                    >
                        {saving ? 'Criando...' : 'Criar Cofrinho'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// Transaction Modal (Deposit/Withdraw)
// ═══════════════════════════════════════════════════════════════

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'deposit' | 'withdrawal';
    goalId: string;
    goalName: string;
    maxAmount?: number;
    onSuccess: () => void;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
    isOpen,
    onClose,
    type,
    goalId,
    goalName,
    maxAmount,
    onSuccess
}) => {
    const [amount, setAmount] = useState(0);
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        if (amount <= 0) return;
        if (type === 'withdrawal' && maxAmount && amount > maxAmount) return;

        setSaving(true);
        const result = type === 'deposit'
            ? await savingsGoalsService.deposit(goalId, amount, note || undefined)
            : await savingsGoalsService.withdraw(goalId, amount, note || undefined);
        setSaving(false);

        if (result) {
            setAmount(0);
            setNote('');
            onSuccess();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center">
            <div className="bg-white w-full max-w-lg rounded-t-[40px] p-8 max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8"></div>
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary tracking-tight">
                            {type === 'deposit' ? 'Depositar' : 'Retirar'}
                        </h2>
                        <p className="text-sm text-text-muted font-medium">{goalName}</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Amount */}
                    <div>
                        <label className="text-[11px] text-text-muted font-bold uppercase tracking-widest px-1 block mb-2">
                            Valor
                        </label>
                        <input
                            type="number"
                            value={amount || ''}
                            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                            placeholder="0,00"
                            className={`w-full bg-slate-50 border rounded-2xl px-5 py-4 text-text-primary placeholder:text-slate-300 focus:outline-none focus:ring-2 transition-all font-bold ${type === 'deposit'
                                ? 'focus:ring-emerald-500/20 focus:border-emerald-500 border-emerald-100'
                                : 'focus:ring-rose-500/20 focus:border-rose-500 border-rose-100'
                                }`}
                        />
                        {type === 'withdrawal' && maxAmount && (
                            <p className="text-[11px] text-text-muted font-medium mt-2 px-1">
                                Disponível: {maxAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        )}
                    </div>

                    {/* Note */}
                    <div>
                        <label className="text-[11px] text-text-muted font-bold uppercase tracking-widest px-1 block mb-2">
                            Observação (Opcional)
                        </label>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Ex: Bônus, Economia do mês..."
                            className="w-full bg-slate-50 border border-border-color rounded-2xl px-5 py-4 text-text-primary placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={saving || amount <= 0 || (type === 'withdrawal' && maxAmount && amount > maxAmount)}
                        className={`w-full py-5 rounded-2xl font-bold text-white transition-all mt-6 shadow-xl active:scale-[0.98] text-lg ${type === 'deposit'
                            ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                            : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
                            } disabled:bg-slate-100 disabled:text-text-muted disabled:shadow-none disabled:cursor-not-allowed`}
                    >
                        {saving ? 'Processando...' : `Confirmar ${type === 'deposit' ? 'Depósito' : 'Retirada'}`}
                    </button>
                </div>
            </div>
        </div>
    );
};
