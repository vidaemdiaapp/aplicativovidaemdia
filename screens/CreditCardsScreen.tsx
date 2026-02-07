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
            <div className="min-h-screen bg-surface flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin"></div>
                    <p className="text-slate-400 text-sm font-medium animate-pulse uppercase tracking-widest">Processando cartões...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pb-24 text-text-primary overflow-x-hidden">
            {/* ═══════════════════════════════════════════════════════════════
                HEADER & NAVIGATION
            ═══════════════════════════════════════════════════════════════ */}
            <header className="px-6 pt-16 pb-8 bg-surface-elevated border-b border-border-color shadow-sm sticky top-0 z-30 lg:rounded-b-[40px]">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/financial-dashboard')}
                            className="w-12 h-12 rounded-2xl bg-white border border-border-color text-text-muted hover:text-primary-600 transition-all active:scale-90 shadow-sm flex items-center justify-center"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-text-primary tracking-tight leading-none">Cartões</h1>
                            <p className="text-text-muted text-[11px] font-bold uppercase tracking-widest mt-1">Crédito & Débito</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="w-12 h-12 rounded-2xl bg-primary-500 text-white hover:bg-primary-600 transition-all active:scale-90 shadow-lg shadow-primary-500/20 flex items-center justify-center"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>

                <div className="card p-6 border-l-4 border-l-primary-500">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em]">Fatura Total Acumulada</p>
                        <div className="px-3 py-1 bg-primary-50 rounded-full border border-primary-100">
                            <span className="text-[9px] text-primary-600 font-black uppercase tracking-widest leading-none">
                                {cards.length} {cards.length === 1 ? 'Cartão' : 'Cartões'}
                            </span>
                        </div>
                    </div>
                    <p className="text-4xl font-black text-text-primary tracking-tight mb-4">{formatCurrency(getTotalBalance())}</p>
                    <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                        <div
                            className={`h-full ${getUsageColor(getTotalLimit() > 0 ? (getTotalBalance() / getTotalLimit()) * 100 : 0)} transition-all duration-1000 ease-out shadow-sm`}
                            style={{ width: `${getTotalLimit() > 0 ? (getTotalBalance() / getTotalLimit()) * 100 : 0}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between mt-3 px-1">
                        <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">Limite Disponível</span>
                        <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">{formatCurrency(getTotalLimit() - getTotalBalance())}</span>
                    </div>
                </div>
            </header>

            {/* Cards Carousel */}
            {cards.length === 0 ? (
                <div className="px-6 py-12">
                    <div className="card-premium p-12 text-center bg-white/50 border-dashed">
                        <CreditCardIcon className="w-16 h-16 text-primary-100 mx-auto mb-4" />
                        <h3 className="text-lg font-black text-text-primary mb-2">Sem cartões</h3>
                        <p className="text-text-muted text-sm font-bold uppercase tracking-widest mb-6">Centralize suas faturas aqui</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
                        >
                            Adicionar Cartão
                        </button>
                    </div>
                </div>
            ) : (
                <div className="px-6 py-8">
                    <div className="flex gap-6 overflow-x-auto pb-8 -mx-6 px-6 no-scrollbar">
                        {cards.map((card) => (
                            <div
                                key={card.id}
                                onClick={() => handleCardSelect(card)}
                                className={`flex-shrink-0 w-80 h-48 rounded-[32px] p-6 cursor-pointer transition-all duration-500 relative overflow-hidden group ${selectedCard?.id === card.id
                                    ? 'ring-8 ring-primary-500/5 scale-105 shadow-2xl'
                                    : 'hover:scale-[1.02] shadow-lg opacity-80 hover:opacity-100'
                                    }`}
                                style={{
                                    background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}AA 100%)`
                                }}
                            >
                                {/* Glassmorphism decorative elements */}
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-[80px] group-hover:bg-white/20 transition-all duration-700"></div>
                                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-[60px]"></div>

                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div>
                                        <p className="text-white/60 text-[8px] font-black uppercase tracking-[0.2em] leading-none mb-1">Apelido do Cartão</p>
                                        <span className="text-white text-sm font-black uppercase tracking-widest">
                                            {card.name}
                                        </span>
                                    </div>
                                    <div className="w-12 h-8 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-sm">
                                        <span className="text-white text-[10px] font-black italic tracking-tighter">
                                            {BRAND_LOGOS[card.brand] || 'CARD'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-6 relative z-10">
                                    <p className="text-white/50 text-[8px] font-black uppercase tracking-[0.2em] leading-none mb-1">Gasto Acumulado</p>
                                    <p className="text-white text-3xl font-black tracking-tight drop-shadow-sm">{formatCurrency(card.current_balance)}</p>
                                </div>

                                <div className="flex justify-between items-end relative z-10">
                                    <div>
                                        <p className="text-white/90 text-[11px] font-black tracking-[0.3em] font-mono">
                                            •••• {card.last_four_digits || '0000'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-black/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                                        <p className="text-white text-[9px] font-black uppercase tracking-widest">Dia {card.due_day}</p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Add Card Button */}
                        <div
                            onClick={() => setShowAddModal(true)}
                            className="flex-shrink-0 w-80 h-48 rounded-[32px] border-3 border-dashed border-slate-100 bg-white/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary-200 hover:bg-white hover:shadow-xl transition-all active:scale-95 group"
                        >
                            <div className="w-16 h-16 rounded-[22px] bg-slate-50 flex items-center justify-center group-hover:bg-primary-50 transition-all duration-300">
                                <Plus className="w-8 h-8 text-slate-300 group-hover:text-primary-500" />
                            </div>
                            <span className="text-text-muted group-hover:text-primary-600 text-[10px] font-black uppercase tracking-[0.2em] mt-5 transition-colors">
                                Adicionar Novo
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Third Party Expenses Alert */}
            {thirdPartyExpenses.length > 0 && (
                <section className="px-6 mb-10">
                    <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
                                <Users className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-[15px] font-bold text-text-primary">Despesas com Terceiros</p>
                                <p className="text-xs text-amber-600 font-medium tracking-tight">
                                    {thirdPartyExpenses.length} reembolsos pendentes
                                </p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {thirdPartyExpenses.slice(0, 3).map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex justify-between items-center p-4 bg-white/60 rounded-2xl border border-amber-200/50 backdrop-blur-sm"
                                >
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{tx.title}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                                            {tx.third_party_name} • {tx.third_party_type === 'reembolso' ? 'Reembolso' : 'Rateio'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[15px] font-bold text-amber-600">
                                            {formatCurrency(tx.amount)}
                                        </span>
                                        <button
                                            onClick={() => creditCardsService.markAsReimbursed(tx.id).then(loadData)}
                                            className="w-10 h-10 rounded-xl bg-white text-emerald-500 flex items-center justify-center hover:bg-emerald-50 shadow-sm border border-slate-100 active:scale-90 transition-all"
                                        >
                                            <Check className="w-5 h-5" />
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
                <section className="px-6 mb-12">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                                Transações
                            </h3>
                            <p className="text-xs text-slate-400 font-medium">Linha do tempo do {selectedCard.name}</p>
                        </div>
                        <button
                            onClick={() => setShowTransactionModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary-50 text-primary-600 rounded-xl text-xs font-bold hover:bg-primary-100 transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4" /> Registrar Compra
                        </button>
                    </div>

                    {/* Usage Bar */}
                    <div className="bg-white border border-border-color rounded-3xl p-6 shadow-sm mb-6">
                        <div className="flex justify-between items-center mb-3 px-1">
                            <span className="text-[11px] text-text-muted font-bold uppercase tracking-widest">Utilização do Limite</span>
                            <span className="text-sm font-bold text-text-primary">
                                {getUsagePercent(selectedCard).toFixed(0)}%
                            </span>
                        </div>
                        <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden mb-5">
                            <div
                                className={`h-full ${getUsageColor(getUsagePercent(selectedCard))} transition-all duration-1000 ease-out`}
                                style={{ width: `${getUsagePercent(selectedCard)}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between px-2">
                            <div className="text-center flex-1">
                                <span className="text-[10px] text-text-muted font-bold uppercase block mb-1">Utilizado</span>
                                <span className="text-[15px] font-bold text-text-primary">{formatCurrency(selectedCard.current_balance)}</span>
                            </div>
                            <div className="w-[1px] h-8 bg-slate-100 mx-4"></div>
                            <div className="text-center flex-1">
                                <span className="text-[10px] text-text-muted font-bold uppercase block mb-1">Disponível</span>
                                <span className="text-[15px] font-bold text-primary-600">{formatCurrency(selectedCard.credit_limit - selectedCard.current_balance)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Transaction List */}
                    {transactions.length === 0 ? (
                        <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Wallet className="w-6 h-6 text-slate-300" />
                            </div>
                            <p className="text-slate-400 text-sm font-medium italic">Nenhuma transação registrada neste cartão</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.slice(0, 10).map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex justify-between items-center p-5 bg-white border border-slate-50 rounded-2xl shadow-sm hover:border-primary-100 hover:shadow-md transition-all group cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${tx.is_third_party
                                            ? 'bg-amber-50 text-amber-500'
                                            : 'bg-slate-50 text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-500'
                                            }`}>
                                            {tx.is_third_party ? (
                                                <Users className="w-6 h-6" />
                                            ) : (
                                                <CreditCardIcon className="w-6 h-6" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[15px] font-bold text-slate-800 group-hover:text-primary-600 transition-colors">
                                                {tx.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-xs text-slate-400 font-medium lowercase">
                                                    {formatDate(tx.transaction_date)}
                                                </p>
                                                {tx.installment_total > 1 && (
                                                    <span className="text-[10px] font-black bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">
                                                        {tx.installment_current}/{tx.installment_total}x
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-slate-900 tracking-tight">
                                            {formatCurrency(tx.amount)}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-medium">Débito</p>
                                    </div>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center">
            <div className="bg-white w-full max-w-lg rounded-t-[40px] p-8 max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8"></div>

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Novo Cartão</h2>
                        <p className="text-sm text-slate-400 font-medium">Cadastre um novo cartão de crédito</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest px-1">
                            Nome do Cartão
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Ex: Nubank, Inter, Itaú..."
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Last 4 digits */}
                        <div className="space-y-2">
                            <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest px-1">
                                Últimos 4 Dígitos
                            </label>
                            <input
                                type="text"
                                maxLength={4}
                                value={form.last_four_digits}
                                onChange={(e) => setForm({ ...form, last_four_digits: e.target.value.replace(/\D/g, '') })}
                                placeholder="0000"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                            />
                        </div>

                        {/* Credit Limit */}
                        <div className="space-y-2">
                            <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest px-1">
                                Limite Crédito
                            </label>
                            <input
                                type="number"
                                value={form.credit_limit || ''}
                                onChange={(e) => setForm({ ...form, credit_limit: parseFloat(e.target.value) || 0 })}
                                placeholder="0,00"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-bold"
                            />
                        </div>
                    </div>

                    {/* Brand */}
                    <div className="space-y-3">
                        <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest px-1 mt-2 block">
                            Bandeira
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {(['visa', 'mastercard', 'elo', 'amex', 'hipercard', 'outros'] as const).map((brand) => (
                                <button
                                    key={brand}
                                    onClick={() => setForm({ ...form, brand })}
                                    className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${form.brand === brand
                                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20 scale-105'
                                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                                        }`}
                                >
                                    {brand}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Closing and Due Day */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest px-1">
                                Fecha Dia
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={31}
                                value={form.closing_day}
                                onChange={(e) => setForm({ ...form, closing_day: parseInt(e.target.value) || 1 })}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest px-1">
                                Vence Dia
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={31}
                                value={form.due_day}
                                onChange={(e) => setForm({ ...form, due_day: parseInt(e.target.value) || 10 })}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-bold"
                            />
                        </div>
                    </div>

                    {/* Color */}
                    <div className="space-y-3">
                        <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest px-1 mt-2 block">
                            Cor do Cartão
                        </label>
                        <div className="flex gap-3 px-1">
                            {CARD_COLORS.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setForm({ ...form, color })}
                                    className={`w-10 h-10 rounded-2xl transition-all shadow-sm ${form.color === color
                                        ? 'ring-4 ring-primary-500/10 scale-110 shadow-md border-2 border-white'
                                        : 'hover:scale-105'
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
                        className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed py-5 rounded-2xl font-bold text-white transition-all mt-6 shadow-xl shadow-primary-500/20 active:scale-[0.98] text-lg"
                    >
                        {saving ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Processando...</span>
                            </div>
                        ) : 'Adicionar Cartão'}
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center">
            <div className="bg-white w-full max-w-lg rounded-t-[40px] p-8 max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8"></div>

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Registar Compra</h2>
                        <p className="text-sm text-slate-400 font-medium">Adicione um novo gasto ao seu cartão</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest px-1">
                            Descrição
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="Ex: Mercado, Netflix, Uber..."
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Amount */}
                        <div className="space-y-2">
                            <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest px-1">
                                Valor
                            </label>
                            <input
                                type="number"
                                value={form.amount || ''}
                                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                                placeholder="0,00"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-bold"
                            />
                        </div>

                        {/* Date */}
                        <div className="space-y-2">
                            <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest px-1">
                                Data
                            </label>
                            <input
                                type="date"
                                value={form.transaction_date}
                                onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                            />
                        </div>
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-3">
                        <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest px-1 block">
                            Categoria
                        </label>
                        <div className="flex gap-2 overflow-x-auto pb-4 -mx-1 px-1 no-scrollbar">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setForm({ ...form, category_id: cat.id })}
                                    className={`flex-shrink-0 px-5 py-3 rounded-2xl text-[13px] font-bold transition-all ${form.category_id === cat.id
                                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20 scale-105'
                                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Installments */}
                    <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest px-1">
                            Número de Parcelas
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min={1}
                                max={24}
                                value={form.installment_total}
                                onChange={(e) => setForm({ ...form, installment_total: parseInt(e.target.value) || 1 })}
                                className="flex-1 accent-primary-500 h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer"
                            />
                            <div className="w-16 h-12 bg-primary-50 rounded-2xl flex items-center justify-center border border-primary-100">
                                <span className="text-primary-600 font-bold">{form.installment_total}x</span>
                            </div>
                        </div>
                    </div>

                    {/* Third Party Toggle */}
                    <div
                        onClick={() => setForm({ ...form, is_third_party: !form.is_third_party })}
                        className={`flex items-center justify-between p-5 rounded-[24px] cursor-pointer transition-all border-2 ${form.is_third_party
                            ? 'bg-amber-50/50 border-amber-200 shadow-sm'
                            : 'bg-slate-50 border-slate-50 hover:border-slate-100'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${form.is_third_party ? 'bg-amber-100 text-amber-600' : 'bg-white text-slate-300'}`}>
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[15px] font-bold text-slate-800">Despesa de Terceiro</p>
                                <p className="text-[11px] text-slate-400 font-medium">Esta compra será rateada ou reembolsada?</p>
                            </div>
                        </div>
                        <div className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${form.is_third_party ? 'bg-amber-500' : 'bg-slate-200'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${form.is_third_party ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </div>

                    {/* Third Party Details */}
                    {form.is_third_party && (
                        <div className="space-y-5 p-6 bg-amber-50/30 border border-amber-100 rounded-3xl animate-in zoom-in-95 duration-200">
                            <div className="space-y-2">
                                <label className="text-[11px] text-amber-600 font-bold uppercase tracking-widest px-1">
                                    Nome da Pessoa
                                </label>
                                <input
                                    type="text"
                                    value={form.third_party_name}
                                    onChange={(e) => setForm({ ...form, third_party_name: e.target.value })}
                                    placeholder="Ex: João, Maria..."
                                    className="w-full bg-white border border-amber-100 rounded-2xl px-5 py-3 text-slate-900 placeholder:text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] text-amber-600 font-bold uppercase tracking-widest px-1">
                                    Tipo de Acordo
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setForm({ ...form, third_party_type: 'reembolso' })}
                                        className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${form.third_party_type === 'reembolso'
                                            ? 'bg-amber-500 text-white shadow-md'
                                            : 'bg-white text-amber-500 border border-amber-100'
                                            }`}
                                    >
                                        Reembolso Total
                                    </button>
                                    <button
                                        onClick={() => setForm({ ...form, third_party_type: 'rateio' })}
                                        className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${form.third_party_type === 'rateio'
                                            ? 'bg-amber-500 text-white shadow-md'
                                            : 'bg-white text-amber-500 border border-amber-100'
                                            }`}
                                    >
                                        Rateio (Divisão)
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={saving || !form.title.trim() || form.amount <= 0}
                        className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed py-5 rounded-2xl font-bold text-white transition-all mt-6 shadow-xl shadow-primary-500/20 active:scale-[0.98] text-lg"
                    >
                        {saving ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Processando...</span>
                            </div>
                        ) : 'Confirmar Compra'}
                    </button>
                </div>
            </div>
        </div>
    );
};
