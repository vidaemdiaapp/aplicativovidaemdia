import React, { useState } from 'react';
import {
    ChevronLeft, Calculator, CreditCard, ShieldCheck,
    ArrowRight, Info, CheckCircle2, Lock, Landmark, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const VehicleDebtSimulationScreen: React.FC = () => {
    const navigate = useNavigate();
    const [installments, setInstallments] = useState(10);

    // Mock Debt Summary
    const totalDebt = 2450.00;
    const items = [
        { label: 'IPVA 2024', value: 1800.00 },
        { label: 'Licenciamento', value: 150.00 },
        { label: 'Multas (3 itens)', value: 500.00 },
    ];

    // Simple calculation logic
    const interestRate = 0.0094; // 0.94% per month
    const totalWithInterest = totalDebt * (1 + (interestRate * installments));
    const installmentValue = totalWithInterest / installments;
    const discountAmount = 120.00; // Mock discount

    return (
        <div className="min-h-screen bg-slate-50 pb-40">
            {/* ═══════════════════════════════════════════════════════════════
                HEADER
            ═══════════════════════════════════════════════════════════════ */}
            <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur-xl z-50">
                <button onClick={() => navigate(-1)} className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <ChevronLeft className="w-6 h-6 text-slate-600" />
                </button>
                <h1 className="font-black text-slate-900 tracking-tight">Parcelamento de Débitos</h1>
                <div className="w-11" /> {/* Spacer */}
            </header>

            <div className="px-6">
                {/* ═══════════════════════════════════════════════════════════════
                    DEBT SUMMARY CARD
                ═══════════════════════════════════════════════════════════════ */}
                <div className="bg-primary-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-primary-200 relative overflow-hidden mb-10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    <div className="absolute bottom-0 right-6 opacity-20">
                        <Landmark className="w-24 h-24" />
                    </div>

                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-100 mb-2">Total em Aberto</p>
                        <h2 className="text-4xl font-black tracking-tighter mb-8">R$ {totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>

                        <div className="space-y-3 pt-6 border-t border-white/10">
                            {items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm font-medium">
                                    <span className="text-primary-100 opacity-80">{item.label}</span>
                                    <span className="font-bold tracking-tight">R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            ))}
                        </div>

                        <button className="flex items-center gap-1.5 mt-8 text-[10px] font-black uppercase tracking-widest text-primary-100 hover:text-white transition-colors">
                            Ver detalhes dos débitos
                            <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    SIMULATION SECTION
                ═══════════════════════════════════════════════════════════════ */}
                <div className="mb-10">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">Simulador de Parcelas</h3>
                            <p className="text-slate-400 text-xs font-medium">Escolha a melhor opção no cartão de crédito</p>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-sm font-black text-slate-900">Número de parcelas</span>
                            <span className="px-4 py-1.5 bg-primary-50 text-primary-600 rounded-full text-sm font-black">{installments}x</span>
                        </div>

                        <input
                            type="range"
                            min="1"
                            max="12"
                            step="1"
                            value={installments}
                            onChange={(e) => setInstallments(parseInt(e.target.value))}
                            className="w-full h-2.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-primary-600 mb-8"
                        />

                        <div className="bg-primary-50/50 p-6 rounded-[2rem] border border-primary-100 text-center relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-xs font-bold text-slate-500 mb-2">Valor da parcela</p>
                                <div className="text-3xl font-black text-primary-600 tracking-tighter mb-2">
                                    {installments}x de R$ {installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                                <div className="flex flex-col items-center gap-1 mt-4">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Total com juros: R$ {totalWithInterest.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                    <div className="mt-3 px-4 py-1.5 bg-orange-100 rounded-full text-[10px] font-black text-orange-600 uppercase tracking-widest inline-flex items-center gap-1.5">
                                        Economize R$ {discountAmount.toLocaleString('pt-BR')} em multas atrasadas
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    BENEFITS SECTION
                ═══════════════════════════════════════════════════════════════ */}
                <div className="mb-10">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight mb-4">Vantagens de pagar agora</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <BenefitCard icon={<ShieldCheck className="w-5 h-5" />} label="Nome limpo na praça" />
                        <BenefitCard icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />} label="IPVA 2024 quitado" />
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                FOOTER ACTION
            ═══════════════════════════════════════════════════════════════ */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl p-6 border-t border-slate-100 z-[60]">
                <div className="max-w-md mx-auto">
                    <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-4">
                        <Lock className="w-3.5 h-3.5" />
                        Ambiente 100% Seguro
                    </div>
                    <button
                        onClick={() => navigate('/vehicle-receipt')}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-primary-200 transition-all active:scale-[0.98]"
                    >
                        Confirmar Pagamento
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    <div className="flex justify-center gap-6 mt-6 opacity-30">
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
    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
        <div className="p-2 bg-slate-50 rounded-xl">
            {icon}
        </div>
        <span className="text-[10px] font-black text-slate-600 leading-tight tracking-tight uppercase">{label}</span>
    </div>
);
