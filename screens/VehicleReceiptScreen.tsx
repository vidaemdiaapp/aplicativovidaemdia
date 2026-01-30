import React from 'react';
import {
    CheckCircle2, Download, Share2, ArrowLeft,
    FileText, CreditCard, Calendar, ShieldCheck,
    Zap, ChevronRight, MessageSquare, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const VehicleReceiptScreen: React.FC = () => {
    const navigate = useNavigate();

    // Mock Receipt Data
    const receiptData = {
        total: 2450.00,
        method: 'Cartão de Crédito (12x)',
        date: '24 Out 2023, 14:30',
        authCode: '098.AF2.990.812',
        items: [
            { id: 1, label: 'IPVA 2024', detail: 'Cota Única - Final Placa 5', icon: <LandmarkIcon className="w-5 h-5 text-primary-500" /> },
            { id: 2, label: 'Licenciamento Anual', detail: 'Exercício 2024', icon: <FileText className="w-5 h-5 text-primary-500" /> },
            { id: 3, label: 'Multa Renainf', detail: 'Excesso de Velocidade', icon: <AlertTriangleIcon className="w-5 h-5 text-rose-500" /> },
        ]
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* ═══════════════════════════════════════════════════════════════
                HEADER
            ═══════════════════════════════════════════════════════════════ */}
            <header className="px-6 pt-12 pb-6 flex items-center justify-between">
                <button onClick={() => navigate('/vehicle-center')} className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <ArrowLeft className="w-6 h-6 text-slate-600" />
                </button>
                <h1 className="font-black text-slate-900 tracking-tight">Comprovante</h1>
                <button className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-400">
                    <Share2 className="w-6 h-6" />
                </button>
            </header>

            <div className="px-6 flex flex-col items-center">
                {/* SUCCESS ANIMATION (MOCK) */}
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-8 relative">
                    <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" strokeWidth={3} />
                </div>

                <div className="text-center mb-10">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Pagamento Realizado!</h2>
                    <p className="text-slate-400 text-sm font-medium mt-2 max-w-[240px] mx-auto">
                        Sua transação foi processada e os débitos foram liquidados.
                    </p>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    RECEIPT DETAILS CARD
                ═══════════════════════════════════════════════════════════════ */}
                <div className="w-full bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden mb-10">
                    <div className="h-1.5 w-full bg-gradient-to-r from-primary-500 via-primary-400 to-orange-400"></div>
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Total Pago</p>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">R$ {receiptData.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-slate-50">
                            <DetailRow label="Método de Pagamento" value={receiptData.method} />
                            <DetailRow label="Data da Transação" value={receiptData.date} />
                            <DetailRow label="Cód. Autenticação" value={receiptData.authCode} isMono />
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    PAID ITEMS LIST
                ═══════════════════════════════════════════════════════════════ */}
                <div className="w-full mb-8">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Itens Pagos</h4>
                    <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden">
                        {receiptData.items.map((item, idx) => (
                            <div key={item.id} className={`p-4 flex items-center gap-4 ${idx !== receiptData.items.length - 1 ? 'border-b border-slate-50' : ''}`}>
                                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                                    {item.icon}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-800 text-sm leading-tight">{item.label}</p>
                                    <p className="text-[10px] font-medium text-slate-400 mt-0.5 uppercase tracking-tighter">{item.detail}</p>
                                </div>
                                <div className="px-3 py-1 bg-emerald-50 rounded-full text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                                    Pago
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    AI ASSISTANT BOX
                ═══════════════════════════════════════════════════════════════ */}
                <div className="w-full bg-primary-50/50 rounded-[2.5rem] p-8 border border-primary-100 relative overflow-hidden mb-12">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-primary-600" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-700">Próximos Passos</span>
                    </div>
                    <p className="text-slate-700 text-sm font-medium leading-relaxed">
                        Olá! Sou o seu assistente. Note que o seu licenciamento será atualizado nos sistemas do Detran em até <span className="font-black">24 horas úteis</span>.
                    </p>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    ACTIONS
                ═══════════════════════════════════════════════════════════════ */}
                <div className="w-full space-y-3 px-2">
                    <button className="w-full bg-primary-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-primary-200 active:scale-[0.98] transition-all">
                        <Download className="w-5 h-5" />
                        Baixar Comprovante PDF
                    </button>
                    <button
                        onClick={() => navigate('/vehicle-center')}
                        className="w-full bg-white text-slate-600 py-5 rounded-2xl font-black text-sm uppercase tracking-widest border border-slate-100 hover:bg-slate-50 transition-all active:scale-[0.98]"
                    >
                        Voltar para Veículos
                    </button>
                </div>
            </div>
        </div>
    );
};

const DetailRow = ({ label, value, isMono = false }: { label: string, value: string, isMono?: boolean }) => (
    <div className="flex justify-between items-center text-[11px]">
        <span className="text-slate-400 font-medium uppercase tracking-wider">{label}</span>
        <span className={`${isMono ? 'font-mono' : 'font-black'} text-slate-900 text-right`}>{value}</span>
    </div>
);

const LandmarkIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="21" x2="21" y2="21"></line>
        <line x1="3" y1="7" x2="21" y2="7"></line>
        <polyline points="3 7 12 2 21 7"></polyline>
        <line x1="5" y1="21" x2="5" y2="7"></line>
        <line x1="9" y1="21" x2="9" y2="7"></line>
        <line x1="15" y1="21" x2="15" y2="7"></line>
        <line x1="19" y1="21" x2="19" y2="7"></line>
    </svg>
);

const AlertTriangleIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
);
