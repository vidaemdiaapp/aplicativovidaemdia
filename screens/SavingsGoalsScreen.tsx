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
                    onClick={() => navigate('/financial')}
                    className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-4"
                >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">Voltar</span>
                </button>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-black text-white">Meus Cofrinhos</h1>
                        <p className="text-sm text-slate-500 mt-1">{goals.length} meta(s) ativa(s)</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="w-10 h-10 rounded bg-emerald-500 flex items-center justify-center hover:bg-emerald-400 transition-colors"
                    >
                        <Plus className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>

            {/* Total Summary */}
            <div className="px-6 mb-6">
                <div className="bg-gradient-to-r from-emerald-900/50 to-slate-900 border border-emerald-500/20 rounded p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <PiggyBank className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Total Poupado</p>
                            <p className="text-3xl font-black text-emerald-400">{formatCurrency(getTotalSaved())}</p>
                        </div>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-700"
                            style={{ width: `${getTotalTarget() > 0 ? (getTotalSaved() / getTotalTarget()) * 100 : 0}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between mt-2">
                        <span className="text-[10px] text-slate-500">{((getTotalSaved() / getTotalTarget()) * 100 || 0).toFixed(0)}% do objetivo</span>
                        <span className="text-[10px] text-slate-500">Meta: {formatCurrency(getTotalTarget())}</span>
                    </div>
                </div>
            </div>

            {/* Goals List */}
            {goals.length === 0 ? (
                <div className="px-6">
                    <div className="bg-slate-900 border border-dashed border-slate-700 rounded-lg p-8 text-center">
                        <PiggyBank className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium mb-2">Nenhum cofrinho criado</p>
                        <p className="text-slate-600 text-sm mb-4">Comece sua reserva financeira agora!</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 rounded text-sm font-bold transition-colors"
                        >
                            Criar Cofrinho
                        </button>
                    </div>
                </div>
            ) : (
                <section className="px-6 mb-6">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-4">
                        Seus Cofrinhos
                    </h3>
                    <div className="space-y-3">
                        {goals.map((goal) => {
                            const config = getGoalTypeConfig(goal.goal_type);
                            const Icon = config.icon;
                            const progress = getProgress(goal);

                            return (
                                <div
                                    key={goal.id}
                                    onClick={() => handleGoalSelect(goal)}
                                    className={`p-4 bg-slate-900 border rounded cursor-pointer transition-all ${selectedGoal?.id === goal.id
                                            ? 'border-emerald-500'
                                            : 'border-slate-800 hover:border-slate-700'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded flex items-center justify-center"
                                                style={{ backgroundColor: `${goal.color}20` }}
                                            >
                                                <Icon className="w-5 h-5" style={{ color: goal.color }} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{goal.name}</p>
                                                <p className="text-[10px] text-slate-500">{config.label}</p>
                                            </div>
                                        </div>
                                        {goal.is_locked && (
                                            <Lock className="w-4 h-4 text-amber-500" />
                                        )}
                                    </div>

                                    <div className="mb-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xl font-black text-white">
                                                {formatCurrency(goal.current_amount)}
                                            </span>
                                            <span className="text-xs font-bold text-slate-500">
                                                {progress.toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full transition-all duration-700"
                                                style={{
                                                    width: `${progress}%`,
                                                    backgroundColor: goal.color
                                                }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-slate-500">
                                            Meta: {formatCurrency(goal.target_amount)}
                                        </span>
                                        {goal.deadline && (
                                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
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
                <section className="px-6 mb-6">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setShowDepositModal(true)}
                            className="bg-emerald-500 hover:bg-emerald-400 p-4 rounded flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <ArrowUpCircle className="w-5 h-5 text-white" />
                            <span className="text-sm font-bold text-white">Depositar</span>
                        </button>
                        <button
                            onClick={() => setShowWithdrawModal(true)}
                            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-4 rounded flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <ArrowDownCircle className="w-5 h-5 text-slate-300" />
                            <span className="text-sm font-bold text-slate-300">Retirar</span>
                        </button>
                    </div>
                </section>
            )}

            {/* Transactions History */}
            {selectedGoal && transactions.length > 0 && (
                <section className="px-6">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-4">
                        Histórico - {selectedGoal.name}
                    </h3>
                    <div className="space-y-2">
                        {transactions.slice(0, 10).map((tx) => (
                            <div
                                key={tx.id}
                                className="flex justify-between items-center p-4 bg-slate-900 border border-slate-800 rounded"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded flex items-center justify-center ${tx.transaction_type === 'deposit'
                                            ? 'bg-emerald-500/10'
                                            : 'bg-rose-500/10'
                                        }`}>
                                        {tx.transaction_type === 'deposit' ? (
                                            <ArrowUpCircle className="w-5 h-5 text-emerald-500" />
                                        ) : (
                                            <ArrowDownCircle className="w-5 h-5 text-rose-500" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">
                                            {tx.transaction_type === 'deposit' ? 'Depósito' : 'Retirada'}
                                        </p>
                                        <p className="text-[10px] text-slate-500">
                                            {formatDate(tx.created_at)}
                                            {tx.note && ` • ${tx.note}`}
                                        </p>
                                    </div>
                                </div>
                                <p className={`text-sm font-black ${tx.transaction_type === 'deposit' ? 'text-emerald-500' : 'text-rose-500'
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
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
            <div className="bg-slate-900 w-full max-w-lg rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-black text-white">Novo Cofrinho</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Goal Type */}
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-2">
                            Tipo de Meta
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {GOAL_TYPES.map((type) => {
                                const Icon = type.icon;
                                return (
                                    <button
                                        key={type.id}
                                        onClick={() => setForm({ ...form, goal_type: type.id as SavingsGoal['goal_type'], color: type.color })}
                                        className={`p-3 rounded flex items-center gap-2 transition-colors ${form.goal_type === type.id
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="text-xs font-bold">{type.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                            Nome do Cofrinho
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Ex: Viagem, Carro novo, Reserva 6 meses..."
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    {/* Target Amount */}
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                            Valor da Meta
                        </label>
                        <input
                            type="number"
                            value={form.target_amount || ''}
                            onChange={(e) => setForm({ ...form, target_amount: parseFloat(e.target.value) || 0 })}
                            placeholder="0,00"
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    {/* Deadline */}
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                            Data Limite (Opcional)
                        </label>
                        <input
                            type="date"
                            value={form.deadline}
                            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-3 text-white focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    {/* Color */}
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-2">
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
                    <div className="flex items-center justify-between p-3 bg-slate-800 rounded">
                        <div className="flex items-center gap-3">
                            <Lock className="w-5 h-5 text-amber-500" />
                            <div>
                                <p className="text-sm font-bold text-white">Cofrinho Trancado</p>
                                <p className="text-[10px] text-slate-500">Impede retiradas até a meta</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setForm({ ...form, is_locked: !form.is_locked })}
                            className={`w-12 h-6 rounded-full transition-colors ${form.is_locked ? 'bg-amber-500' : 'bg-slate-700'
                                }`}
                        >
                            <div
                                className={`w-5 h-5 bg-white rounded-full transition-transform ml-0.5 ${form.is_locked ? 'translate-x-6' : ''
                                    }`}
                            ></div>
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
                        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:cursor-not-allowed p-4 rounded font-bold text-white transition-colors mt-4"
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
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
            <div className="bg-slate-900 w-full max-w-lg rounded-t-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-lg font-black text-white">
                            {type === 'deposit' ? 'Depositar' : 'Retirar'}
                        </h2>
                        <p className="text-sm text-slate-500">{goalName}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Amount */}
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                            Valor
                        </label>
                        <input
                            type="number"
                            value={amount || ''}
                            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                            placeholder="0,00"
                            className={`w-full bg-slate-800 border rounded px-3 py-3 text-white placeholder:text-slate-600 focus:outline-none ${type === 'deposit'
                                    ? 'border-emerald-500/50 focus:border-emerald-500'
                                    : 'border-rose-500/50 focus:border-rose-500'
                                }`}
                        />
                        {type === 'withdrawal' && maxAmount && (
                            <p className="text-[10px] text-slate-500 mt-1">
                                Disponível: {maxAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        )}
                    </div>

                    {/* Note */}
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                            Observação (Opcional)
                        </label>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Ex: Bônus, Economia do mês..."
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-600"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={saving || amount <= 0 || (type === 'withdrawal' && maxAmount && amount > maxAmount)}
                        className={`w-full p-4 rounded font-bold text-white transition-colors ${type === 'deposit'
                                ? 'bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700'
                                : 'bg-rose-500 hover:bg-rose-400 disabled:bg-slate-700'
                            } disabled:cursor-not-allowed`}
                    >
                        {saving
                            ? 'Processando...'
                            : type === 'deposit'
                                ? 'Confirmar Depósito'
                                : 'Confirmar Retirada'
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};
