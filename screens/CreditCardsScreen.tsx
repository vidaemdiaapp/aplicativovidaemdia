import React, { useState, useEffect } from 'react';
import {
    CreditCard as CreditCardIcon, Plus, ChevronRight, ChevronLeft,
    AlertCircle, Check, X, Wallet, Users, ArrowRight, Clock,
    Calendar, Trash2, Edit2, MoreVertical
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { creditCardsService, CreditCard, CreditCardTransaction } from '../services/financial';
import { tasksService } from '../services/tasks';

interface CardFormData {
    name: string;
    last_four_digits: string;
    brand: CreditCard['brand'];
    credit_limit: number;
    closing_day: number;
    due_day: number;
    color: string;
    is_shared: boolean;
}

const CARD_COLORS = [
    '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6',
    '#EC4899', '#F43F5E', '#F59E0B', '#6B7280'
];

const BRAND_LOGOS: Record<string, string> = {
    'visa': 'VISA',
    'mastercard': 'MC',
    'elo': 'ELO',
    'amex': 'AMEX',
    'hipercard': 'HIPER',
    'outros': '💳'
};

export const CreditCardsScreen: React.FC = () => {
    const navigate = useNavigate();
    const [cards, setCards] = useState<CreditCard[]>([]);
    const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);
    const [transactions, setTransactions] = useState<CreditCardTransaction[]>([]);
    const [thirdPartyExpenses, setThirdPartyExpenses] = useState<CreditCardTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showTransactionModal, setShowTransactionModal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [cardsData, thirdParty] = await Promise.all([
            creditCardsService.getAll(),
            creditCardsService.getThirdPartyExpenses()
        ]);
        setCards(cardsData);
        setThirdPartyExpenses(thirdParty);
        if (cardsData.length > 0 && !selectedCard) {
            setSelectedCard(cardsData[0]);
            loadTransactions(cardsData[0].id);
        }
        setLoading(false);
    };

    const loadTransactions = async (cardId: string) => {
        const txs = await creditCardsService.getTransactions(cardId);
        setTransactions(txs);
    };

    const handleCardSelect = (card: CreditCard) => {
        setSelectedCard(card);
        loadTransactions(card.id);
    };

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const formatDate = (dateStr: string) => {
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short'
        });
    };

    const getUsagePercent = (card: CreditCard) => {
        if (!card.credit_limit || card.credit_limit === 0) return 0;
        return Math.min((card.current_balance / card.credit_limit) * 100, 100);
    };

    const getUsageColor = (percent: number) => {
        if (percent >= 90) return 'bg-rose-500';
        if (percent >= 70) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    const getTotalBalance = () => cards.reduce((acc, c) => acc + c.current_balance, 0);
    const getTotalLimit = () => cards.reduce((acc, c) => acc + c.credit_limit, 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
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
                        <h1 className="text-2xl font-black text-white">Cartões de Crédito</h1>
                        <p className="text-sm text-slate-500 mt-1">{cards.length} cartão(ões) cadastrado(s)</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="w-10 h-10 rounded bg-cyan-500 flex items-center justify-center hover:bg-cyan-400 transition-colors"
                    >
                        <Plus className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>

            {/* Total Summary */}
            <div className="px-6 mb-6">
                <div className="bg-slate-900 border border-slate-800 rounded p-4">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Fatura Total</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">
                            Limite: {formatCurrency(getTotalLimit())}
                        </span>
                    </div>
                    <p className="text-3xl font-black text-white mb-3">{formatCurrency(getTotalBalance())}</p>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${getUsageColor(getTotalLimit() > 0 ? (getTotalBalance() / getTotalLimit()) * 100 : 0)} transition-all duration-700`}
                            style={{ width: `${getTotalLimit() > 0 ? (getTotalBalance() / getTotalLimit()) * 100 : 0}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Cards Carousel */}
            {cards.length === 0 ? (
                <div className="px-6">
                    <div className="bg-slate-900 border border-dashed border-slate-700 rounded-lg p-8 text-center">
                        <CreditCardIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium mb-2">Nenhum cartão cadastrado</p>
                        <p className="text-slate-600 text-sm mb-4">Adicione seu primeiro cartão para monitorar gastos</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 rounded text-sm font-bold transition-colors"
                        >
                            Adicionar Cartão
                        </button>
                    </div>
                </div>
            ) : (
                <div className="px-6 mb-6">
                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide">
                        {cards.map((card) => (
                            <div
                                key={card.id}
                                onClick={() => handleCardSelect(card)}
                                className={`flex-shrink-0 w-72 h-44 rounded-lg p-5 cursor-pointer transition-all duration-300 ${selectedCard?.id === card.id
                                    ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-105'
                                    : 'hover:scale-102'
                                    }`}
                                style={{
                                    background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}99 100%)`
                                }}
                            >
                                {/* Card Content */}
                                <div className="flex justify-between items-start mb-6">
                                    <span className="text-white/80 text-xs font-bold uppercase tracking-wider">
                                        {card.name}
                                    </span>
                                    <span className="text-white text-sm font-black">
                                        {BRAND_LOGOS[card.brand]}
                                    </span>
                                </div>

                                <div className="mb-4">
                                    <p className="text-white/60 text-[10px] font-bold uppercase">Fatura Atual</p>
                                    <p className="text-white text-2xl font-black">{formatCurrency(card.current_balance)}</p>
                                </div>

                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-white/60 text-[10px] font-bold">
                                            •••• {card.last_four_digits || '0000'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white/60 text-[10px] font-bold uppercase">Vence dia</p>
                                        <p className="text-white text-sm font-bold">{card.due_day}</p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Add Card Button */}
                        <div
                            onClick={() => setShowAddModal(true)}
                            className="flex-shrink-0 w-72 h-44 rounded-lg border-2 border-dashed border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500 hover:bg-slate-900/50 transition-all group"
                        >
                            <Plus className="w-8 h-8 text-slate-600 group-hover:text-cyan-500 transition-colors" />
                            <span className="text-slate-600 group-hover:text-cyan-500 text-sm font-bold mt-2 transition-colors">
                                Novo Cartão
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Third Party Expenses Alert */}
            {thirdPartyExpenses.length > 0 && (
                <section className="px-6 mb-6">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <Users className="w-5 h-5 text-amber-500" />
                            <div>
                                <p className="text-sm font-bold text-white">Despesas de Terceiros</p>
                                <p className="text-[10px] text-slate-500">
                                    {thirdPartyExpenses.length} pendente(s) de reembolso
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {thirdPartyExpenses.slice(0, 3).map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex justify-between items-center p-3 bg-slate-900/50 rounded"
                                >
                                    <div>
                                        <p className="text-sm font-bold text-white">{tx.title}</p>
                                        <p className="text-[10px] text-slate-500">
                                            {tx.third_party_name} • {tx.third_party_type === 'reembolso' ? 'Reembolso' : 'Rateio'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-amber-500">
                                            {formatCurrency(tx.amount)}
                                        </span>
                                        <button
                                            onClick={() => creditCardsService.markAsReimbursed(tx.id).then(loadData)}
                                            className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
                                        >
                                            <Check className="w-4 h-4 text-emerald-500" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Selected Card Transactions */}
            {selectedCard && (
                <section className="px-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">
                            Transações - {selectedCard.name}
                        </h3>
                        <button
                            onClick={() => setShowTransactionModal(true)}
                            className="text-[10px] text-cyan-500 font-bold uppercase flex items-center gap-1 hover:text-cyan-400 transition-colors"
                        >
                            <Plus className="w-3 h-3" /> Adicionar
                        </button>
                    </div>

                    {/* Usage Bar */}
                    <div className="bg-slate-900 border border-slate-800 rounded p-4 mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-slate-500">Uso do Limite</span>
                            <span className="text-xs font-bold text-white">
                                {getUsagePercent(selectedCard).toFixed(0)}%
                            </span>
                        </div>
                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${getUsageColor(getUsagePercent(selectedCard))} transition-all duration-700`}
                                style={{ width: `${getUsagePercent(selectedCard)}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between mt-2">
                            <span className="text-[10px] text-slate-500">
                                {formatCurrency(selectedCard.current_balance)}
                            </span>
                            <span className="text-[10px] text-slate-500">
                                {formatCurrency(selectedCard.credit_limit)}
                            </span>
                        </div>
                    </div>

                    {/* Transaction List */}
                    {transactions.length === 0 ? (
                        <div className="bg-slate-900 border border-dashed border-slate-700 rounded p-8 text-center">
                            <Wallet className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-500 text-sm">Nenhuma transação neste cartão</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {transactions.slice(0, 10).map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex justify-between items-center p-4 bg-slate-900 border border-slate-800 rounded hover:border-slate-700 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded flex items-center justify-center ${tx.is_third_party ? 'bg-amber-500/10' : 'bg-slate-800'
                                            }`}>
                                            {tx.is_third_party ? (
                                                <Users className="w-5 h-5 text-amber-500" />
                                            ) : (
                                                <CreditCardIcon className="w-5 h-5 text-slate-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white truncate max-w-[180px]">
                                                {tx.title}
                                            </p>
                                            <p className="text-[10px] text-slate-500">
                                                {formatDate(tx.transaction_date)}
                                                {tx.installment_total > 1 && (
                                                    <span className="ml-2 text-cyan-500">
                                                        {tx.installment_current}/{tx.installment_total}x
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-black text-white">
                                        {formatCurrency(tx.amount)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* Add Card Modal */}
            <AddCardModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => {
                    setShowAddModal(false);
                    loadData();
                }}
            />

            {/* Add Transaction Modal */}
            {selectedCard && (
                <AddTransactionModal
                    isOpen={showTransactionModal}
                    onClose={() => setShowTransactionModal(false)}
                    cardId={selectedCard.id}
                    onSuccess={() => {
                        setShowTransactionModal(false);
                        loadData();
                        loadTransactions(selectedCard.id);
                    }}
                />
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// Add Card Modal
// ═══════════════════════════════════════════════════════════════

interface AddCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [form, setForm] = useState<CardFormData>({
        name: '',
        last_four_digits: '',
        brand: 'visa',
        credit_limit: 0,
        closing_day: 1,
        due_day: 10,
        color: CARD_COLORS[0],
        is_shared: true
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        if (!form.name.trim()) return;

        setSaving(true);
        const result = await creditCardsService.create({
            name: form.name,
            last_four_digits: form.last_four_digits,
            brand: form.brand,
            credit_limit: form.credit_limit,
            current_balance: 0,
            closing_day: form.closing_day,
            due_day: form.due_day,
            color: form.color,
            is_shared: form.is_shared
        });
        setSaving(false);

        if (result) {
            onSuccess();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
            <div className="bg-slate-900 w-full max-w-lg rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-black text-white">Novo Cartão</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                            Nome do Cartão
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Ex: Nubank, Inter, Itaú..."
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                        />
                    </div>

                    {/* Last 4 digits */}
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                            Últimos 4 Dígitos
                        </label>
                        <input
                            type="text"
                            maxLength={4}
                            value={form.last_four_digits}
                            onChange={(e) => setForm({ ...form, last_four_digits: e.target.value.replace(/\D/g, '') })}
                            placeholder="0000"
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                        />
                    </div>

                    {/* Brand */}
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-2">
                            Bandeira
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {(['visa', 'mastercard', 'elo', 'amex', 'hipercard', 'outros'] as const).map((brand) => (
                                <button
                                    key={brand}
                                    onClick={() => setForm({ ...form, brand })}
                                    className={`px-3 py-2 rounded text-xs font-bold uppercase transition-colors ${form.brand === brand
                                        ? 'bg-cyan-500 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                        }`}
                                >
                                    {brand}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Credit Limit */}
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                            Limite de Crédito
                        </label>
                        <input
                            type="number"
                            value={form.credit_limit || ''}
                            onChange={(e) => setForm({ ...form, credit_limit: parseFloat(e.target.value) || 0 })}
                            placeholder="0,00"
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                        />
                    </div>

                    {/* Closing and Due Day */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                                Fecha Dia
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={31}
                                value={form.closing_day}
                                onChange={(e) => setForm({ ...form, closing_day: parseInt(e.target.value) || 1 })}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-3 text-white focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                                Vence Dia
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={31}
                                value={form.due_day}
                                onChange={(e) => setForm({ ...form, due_day: parseInt(e.target.value) || 10 })}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-3 text-white focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                    </div>

                    {/* Color */}
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-2">
                            Cor do Cartão
                        </label>
                        <div className="flex gap-2">
                            {CARD_COLORS.map((color) => (
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

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={saving || !form.name.trim()}
                        className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:cursor-not-allowed p-4 rounded font-bold text-white transition-colors mt-4"
                    >
                        {saving ? 'Salvando...' : 'Adicionar Cartão'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// Add Transaction Modal
// ═══════════════════════════════════════════════════════════════

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    cardId: string;
    onSuccess: () => void;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, cardId, onSuccess }) => {
    const [form, setForm] = useState({
        title: '',
        amount: 0,
        transaction_date: new Date().toISOString().split('T')[0],
        installment_total: 1,
        category_id: '' as string | null,
        is_third_party: false,
        third_party_name: '',
        third_party_type: 'reembolso' as 'reembolso' | 'rateio'
    });
    const [categories, setCategories] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        tasksService.getCategories().then(setCategories);
    }, []);

    const handleSubmit = async () => {
        if (!form.title.trim() || form.amount <= 0) return;

        setSaving(true);
        const result = await creditCardsService.addTransaction({
            card_id: cardId,
            household_id: '',
            title: form.title,
            amount: form.amount,
            transaction_date: form.transaction_date,
            installment_current: 1,
            installment_total: form.installment_total,
            category_id: form.category_id || null,
            is_third_party: form.is_third_party,
            third_party_name: form.is_third_party ? form.third_party_name : null,
            third_party_type: form.is_third_party ? form.third_party_type : null,
            reimbursement_status: 'pending'
        });
        setSaving(false);

        if (result) {
            onSuccess();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
            <div className="bg-slate-900 w-full max-w-lg rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-black text-white">Nova Transação</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                            Descrição
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="Ex: Mercado, Netflix, Uber..."
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                        />
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                            Valor
                        </label>
                        <input
                            type="number"
                            value={form.amount || ''}
                            onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                            placeholder="0,00"
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                        />
                    </div>

                    {/* Date */}
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                            Data
                        </label>
                        <input
                            type="date"
                            value={form.transaction_date}
                            onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-3 text-white focus:outline-none focus:border-cyan-500"
                        />
                    </div>

                    {/* Category Selection */}
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-2">
                            Categoria
                        </label>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setForm({ ...form, category_id: cat.id })}
                                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${form.category_id === cat.id
                                        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Installments */}
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                            Parcelas
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={48}
                            value={form.installment_total}
                            onChange={(e) => setForm({ ...form, installment_total: parseInt(e.target.value) || 1 })}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-3 text-white focus:outline-none focus:border-cyan-500"
                        />
                    </div>

                    {/* Third Party Toggle */}
                    <div className="flex items-center justify-between p-3 bg-slate-800 rounded">
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-amber-500" />
                            <div>
                                <p className="text-sm font-bold text-white">Despesa de Terceiro</p>
                                <p className="text-[10px] text-slate-500">Para cobrança/reembolso</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setForm({ ...form, is_third_party: !form.is_third_party })}
                            className={`w-12 h-6 rounded-full transition-colors ${form.is_third_party ? 'bg-amber-500' : 'bg-slate-700'
                                }`}
                        >
                            <div
                                className={`w-5 h-5 bg-white rounded-full transition-transform ml-0.5 ${form.is_third_party ? 'translate-x-6' : ''
                                    }`}
                            ></div>
                        </button>
                    </div>

                    {/* Third Party Details */}
                    {form.is_third_party && (
                        <div className="space-y-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded">
                            <div>
                                <label className="text-[10px] text-amber-500 font-bold uppercase block mb-1">
                                    Nome do Terceiro
                                </label>
                                <input
                                    type="text"
                                    value={form.third_party_name}
                                    onChange={(e) => setForm({ ...form, third_party_name: e.target.value })}
                                    placeholder="Ex: João, Maria..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-amber-500 font-bold uppercase block mb-2">
                                    Tipo
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setForm({ ...form, third_party_type: 'reembolso' })}
                                        className={`flex-1 px-3 py-2 rounded text-xs font-bold uppercase transition-colors ${form.third_party_type === 'reembolso'
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-slate-800 text-slate-400'
                                            }`}
                                    >
                                        Reembolso
                                    </button>
                                    <button
                                        onClick={() => setForm({ ...form, third_party_type: 'rateio' })}
                                        className={`flex-1 px-3 py-2 rounded text-xs font-bold uppercase transition-colors ${form.third_party_type === 'rateio'
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-slate-800 text-slate-400'
                                            }`}
                                    >
                                        Rateio
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={saving || !form.title.trim() || form.amount <= 0}
                        className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:cursor-not-allowed p-4 rounded font-bold text-white transition-colors mt-4"
                    >
                        {saving ? 'Salvando...' : 'Adicionar Transação'}
                    </button>
                </div>
            </div>
        </div>
    );
};
