import React, { useState } from 'react';
import {
    ChevronLeft, Calculator, CreditCard, ShieldCheck,
    ArrowRight, Info, CheckCircle2, Lock, Landmark, ChevronRight, Zap, Loader2, Plus
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { zapayService } from '../services/zapay/service';

export const VehicleDebtSimulationScreen: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { debtIds = [], totalAmount = 0, debtTitle = 'Débitos Diversos' } = location.state || {};

    const [installments, setInstallments] = useState(10);
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card');

    // Card Form State
    const [cardData, setCardData] = useState({
        number: '',
        name: '',
        expiry: '',
        cvv: ''
    });

    // Simulation logic (Zapay Flow 1 returns exact values, but we can keep this for instant feedback)
    const interestRate = paymentMethod === 'pix' ? 0 : 0.0094; // 0.94% per month only for card
    const totalWithInterest = totalAmount * (1 + (interestRate * installments));
    const installmentValue = totalWithInterest / installments;
    const discountAmount = totalAmount * 0.05; // 5% mock discount on fines/late fees

    const handleConfirmPayment = () => {
        setLoading(true);
        // Simulate processing
        setTimeout(() => {
            setLoading(false);
            navigate('/vehicle-receipt');
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-40">
            {/* ═══════════════════════════════════════════════════════════════
                HEADER
            ═══════════════════════════════════════════════════════════════ */}
            <header className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur-xl z-50">
                <button onClick={() => navigate(-1)} className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-100 active:scale-95 transition-all">
                    <ChevronLeft className="w-6 h-6 text-slate-600" />
                </button>
                <h1 className="font-bold text-slate-900 text-lg tracking-tight">Parcelamento de Débitos</h1>
                <div className="w-11" /> {/* Spacer */}
            </header>

            <div className="px-6">
                {/* ═══════════════════════════════════════════════════════════════
                    DEBT SUMMARY CARD
                ═══════════════════════════════════════════════════════════════ */}
                <div className="bg-primary-600 rounded-3xl p-6 text-white shadow-2xl shadow-primary-200 relative overflow-hidden mb-8">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    <div className="absolute bottom-0 right-6 opacity-20">
                        <Landmark className="w-20 h-20" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-100">Total em Aberto</p>
                            <span className="bg-white/10 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest text-white/80 flex items-center gap-1.5 backdrop-blur-md">
                                <Zap className="w-3 h-3 fill-white/80 text-transparent" />
                                Zapay Official
                            </span>
                        </div>
                        <h2 className="text-3xl font-bold tracking-tighter mb-6">R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>

                        <div className="space-y-2.5 pt-5 border-t border-white/10">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-primary-100 font-medium opacity-90">{debtTitle}</span>
                                <span className="font-bold tracking-tight">R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                        <button className="flex items-center gap-2 mt-6 text-[10px] font-bold uppercase tracking-widest text-primary-100 hover:text-white transition-colors">
                            Detalhes dos itens selecionados
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    PAYMENT METHODS SELECTION (TOP)
                ═══════════════════════════════════════════════════════════════ */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Forma de Pagamento</h3>
                        <Info className="w-4 h-4 text-slate-300" />
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setPaymentMethod('card')}
                            className={`flex-1 p-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 active:scale-[0.98] ${paymentMethod === 'card' ? 'border-primary-600 bg-primary-50 ring-4 ring-primary-500/5' : 'border-slate-100 bg-white'}`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${paymentMethod === 'card' ? 'bg-primary-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${paymentMethod === 'card' ? 'text-primary-600' : 'text-slate-400'}`}>Cartão de Crédito</span>
                        </button>
                        <button
                            onClick={() => setPaymentMethod('pix')}
                            className={`flex-1 p-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 active:scale-[0.98] ${paymentMethod === 'pix' ? 'border-primary-600 bg-primary-50 ring-4 ring-primary-500/5' : 'border-slate-100 bg-white'}`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${paymentMethod === 'pix' ? 'bg-primary-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z" />
                                </svg>
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${paymentMethod === 'pix' ? 'text-primary-600' : 'text-slate-400'}`}>Pix à Vista</span>
                        </button>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    SIMULATION SECTION (ONLY FOR CARD)
                ═══════════════════════════════════════════════════════════════ */}
                {paymentMethod === 'card' && (
                    <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-5">Sugestão de Parcelamento</h3>

                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-sm font-bold text-slate-900">Número de parcelas</span>
                                <div className="px-4 py-1.5 bg-primary-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-200">
                                    {installments}x
                                </div>
                            </div>

                            <div className="relative h-1.5 w-full bg-slate-100 rounded-full mb-8 overflow-hidden">
                                <div
                                    className="absolute h-full bg-primary-500 transition-all duration-300"
                                    style={{ width: `${(installments / 12) * 100}%` }}
                                />
                                <input
                                    type="range"
                                    min="1"
                                    max="12"
                                    step="1"
                                    value={installments}
                                    onChange={(e) => setInstallments(parseInt(e.target.value))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                            </div>

                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center relative">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Valor mensal</p>
                                <div className="text-3xl font-bold text-primary-600 tracking-tighter mb-4">
                                    R$ {installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                                <div className="space-y-2.5 pt-5 border-t border-slate-200/50">
                                    <p className="text-[10px] font-bold text-slate-500">
                                        Total parcelado: <span className="text-slate-900">R$ {totalWithInterest.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </p>
                                    <div className="mx-auto px-4 py-1.5 bg-emerald-50 rounded-xl text-[10px] font-bold text-emerald-600 uppercase tracking-widest inline-flex items-center gap-2 border border-emerald-100">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Economize R$ {discountAmount.toLocaleString('pt-BR')} em multas
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    METHOD SPECIFIC CONTENT
                ═══════════════════════════════════════════════════════════════ */}
                {paymentMethod === 'card' ? (
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                                <Plus className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-base">Dados do Cartão</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preencha com atenção</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="group">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2.5 block group-focus-within:text-primary-600 transition-colors">Número do Cartão</label>
                                <div className="relative flex items-center">
                                    <input
                                        type="text"
                                        placeholder="0000 0000 0000 0000"
                                        value={cardData.number}
                                        onChange={e => setCardData({ ...cardData, number: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-base font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:bg-white focus:border-primary-100 transition-all"
                                    />
                                    <CreditCard className="absolute right-6 w-6 h-6 text-slate-300" />
                                </div>
                            </div>
                            <div className="group">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2.5 block group-focus-within:text-primary-600 transition-colors">Nome no Cartão</label>
                                <input
                                    type="text"
                                    placeholder="COMO ESTÁ NO CARTÃO"
                                    value={cardData.name}
                                    onChange={e => setCardData({ ...cardData, name: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-base font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:bg-white focus:border-primary-100 transition-all uppercase"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="group">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2.5 block group-focus-within:text-primary-600 transition-colors">Validade</label>
                                    <input
                                        type="text"
                                        placeholder="MM/AA"
                                        value={cardData.expiry}
                                        onChange={e => setCardData({ ...cardData, expiry: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-base font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:bg-white focus:border-primary-100 transition-all"
                                    />
                                </div>
                                <div className="group">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2.5 block group-focus-within:text-primary-600 transition-colors">CVV</label>
                                    <input
                                        type="password"
                                        placeholder="***"
                                        maxLength={4}
                                        value={cardData.cvv}
                                        onChange={e => setCardData({ ...cardData, cvv: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-base font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:bg-white focus:border-primary-100 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-3xl mb-8 text-center animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-200/50 border border-emerald-100">
                                <svg className="w-10 h-10 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z" />
                                </svg>
                            </div>
                            <h4 className="font-bold text-emerald-900 text-lg mb-2.5">Pagamento via Pix</h4>
                            <div className="text-3xl font-bold text-emerald-600 tracking-tighter mb-5">
                                R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-emerald-700/80 text-[11px] font-medium leading-relaxed max-w-[240px] mx-auto">
                                Gere um QR Code dinâmico. A compensação é em segundos e a baixa do débito é muito mais rápida.
                            </p>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    BENEFITS SECTION
                ═══════════════════════════════════════════════════════════════ */}
                <div className="mb-10">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-5">Vantagens Zapay</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <BenefitCard icon={<ShieldCheck className="w-5 h-5 text-primary-600" />} label="Segurança Bancária" />
                        <BenefitCard icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />} label="Baixa Instantânea" />
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                FOOTER ACTION
            ═══════════════════════════════════════════════════════════════ */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-3xl p-6 border-t border-slate-100 z-[60]">
                <div className="max-w-md mx-auto">
                    <div className="flex items-center justify-center gap-2.5 text-slate-400 font-bold text-[10px] uppercase tracking-[0.15em] mb-5">
                        <Lock className="w-3.5 h-3.5" />
                        Transação Criptografada
                    </div>
                    <button
                        onClick={handleConfirmPayment}
                        disabled={loading}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4.5 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-primary-200 transition-all active:scale-[0.97] disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Validando...
                            </>
                        ) : (
                            <>
                                {paymentMethod === 'pix' ? 'Gerar QR Code Pix' : 'Confirmar Parcelamento'}
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>

                    <div className="flex justify-center gap-6 mt-6 opacity-20 grayscale">
                        <CreditCard className="w-6 h-6" />
                        <Calculator className="w-6 h-6" />
                        <Landmark className="w-6 h-6" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const BenefitCard = ({ icon, label }: { icon: any, label: string }) => (
    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 group hover:border-primary-100 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center transition-colors group-hover:bg-primary-50">
            {icon}
        </div>
        <span className="text-[10px] font-bold text-slate-700 leading-tight uppercase tracking-tight">{label}</span>
    </div>
);
