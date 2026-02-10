import React, { useState, useEffect } from 'react';
import {
    ChevronLeft, MoreHorizontal, Car, Shield, AlertTriangle,
    CheckCircle2, Info, ArrowRight, Wallet, History, Search,
    Zap, Calendar, Clock, DollarSign, ChevronRight, FileText,
    Sparkles, Download, Share2, Settings, Plus, Edit2, CreditCard,
    RefreshCw, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { zapayService } from '../services/zapay/service';
import { ZapayDebt } from '../services/zapay/types';
import { MOCK_VEHICLE } from '../services/zapay/mocks';

export const VehicleCentralScreen: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [debts, setDebts] = useState<ZapayDebt[]>([]);
    const [isMock, setIsMock] = useState(false);

    // Mock Data for UI stability (Zapay doesn't provide Fipe/Image in Flow 1)
    const vehicle = MOCK_VEHICLE;

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        setIsMock(zapayService.isMockMode());

        const response = await zapayService.getDebts(vehicle.plate, 'SP');

        if (response.error) {
            setError(response.error.message);
        } else {
            setDebts(response.data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const pendingDebts = debts.filter(d => d.status === 'pending' && d.type !== 'fine');
    const paidDebts = debts.filter(d => d.status === 'paid' && d.type !== 'fine');
    const activeFines = debts.filter(d => d.type === 'fine');

    return (
        <div className="min-h-screen bg-slate-50 pb-32">
            {/* ═══════════════════════════════════════════════════════════════
          HEADER (STUCK ON TOP)
      ═══════════════════════════════════════════════════════════════ */}
            <header className="fixed top-0 left-0 right-0 z-[100] px-6 pt-8 pb-4 flex items-center justify-between bg-white/10 backdrop-blur-3xl border-b border-white/10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 text-white hover:bg-white/30 transition-all active:scale-95"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    {isMock && (
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 opacity-80">Ambiente</span>
                            <span className="text-xs font-bold text-white">Sandbox / Mock</span>
                        </div>
                    )}
                </div>

                <h1 className="font-bold text-white text-lg tracking-tight">Meus Veículos</h1>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 text-white hover:bg-white/30 transition-all active:scale-95"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => navigate('/vehicle-edit')}
                        className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 text-white hover:bg-white/30 transition-all active:scale-95"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════════════ */}
            <div className="relative h-64 overflow-hidden">
                <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="w-full h-full object-cover scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-900/40 to-slate-900/60"></div>

                <div className="absolute bottom-12 left-6 right-6">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="flex h-2 w-2 rounded-full bg-warning-500 animate-pulse"></span>
                        <span className="text-[10px] font-bold text-warning-400 uppercase tracking-widest">Status: Em Atenção</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight mb-4">{vehicle.name}</h2>

                    <div className="flex gap-4">
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 px-3.5 py-2 rounded-2xl">
                            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mb-0.5">Placa</p>
                            <p className="text-sm font-bold text-white tracking-wider">{vehicle.plate}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 px-3.5 py-2 rounded-2xl">
                            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mb-0.5">FIPE</p>
                            <p className="text-sm font-bold text-white tracking-wider">R$ {vehicle.fipeValue.toLocaleString('pt-BR')}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative px-6 -mt-8">
                {/* ═══════════════════════════════════════════════════════════════
                    QUICK STATS CARD
                ═══════════════════════════════════════════════════════════════ */}
                <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 flex justify-between items-center mb-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-base">Débitos Pendentes</h3>
                            <p className="text-slate-500 text-xs font-medium">Você possui {debts.length} itens aguardando</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total</p>
                        <p className="text-lg font-bold text-primary-600">R$ {debts.reduce((acc, d) => acc + d.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    DEBT SECTIONS
                ═══════════════════════════════════════════════════════════════ */}
                {loading ? (
                    <div className="space-y-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-40 bg-white rounded-[2.5rem] animate-pulse border border-slate-100"></div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="bg-rose-50 border border-rose-100 p-8 rounded-[2.5rem] text-center">
                        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                        <h4 className="font-bold text-rose-900 mb-2">Ops! Algo deu errado</h4>
                        <p className="text-rose-600 text-sm mb-6">{error}</p>
                        <button onClick={fetchData} className="bg-white text-rose-500 px-6 py-3 rounded-2xl font-bold text-sm shadow-sm border border-rose-100">
                            Tentar Novamente
                        </button>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* 1. DOCUMENTAÇÃO / IPVA */}
                        {pendingDebts.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Documentação & Taxas</h3>
                                        <span className="bg-slate-900 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
                                            {pendingDebts.length}
                                        </span>
                                    </div>
                                    <p className="text-primary-600 text-[10px] font-bold uppercase tracking-widest">Ver Tudo</p>
                                </div>
                                <div className="space-y-4">
                                    {pendingDebts.map(debt => (
                                        <DebtCard key={debt.id} debt={debt} onPay={() => navigate('/vehicle-simulation', {
                                            state: {
                                                debtIds: [debt.id],
                                                totalAmount: debt.amount,
                                                debtTitle: debt.title
                                            }
                                        })} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 2. MULTAS */}
                        {activeFines.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Multas Ativas</h3>
                                        <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
                                            {activeFines.length}
                                        </span>
                                    </div>
                                    <Info className="w-4 h-4 text-slate-300" />
                                </div>
                                <div className="space-y-4">
                                    {activeFines.map(debt => (
                                        <DebtCard key={debt.id} debt={debt} isFine onPay={() => navigate('/vehicle-simulation', {
                                            state: {
                                                debtIds: [debt.id],
                                                totalAmount: debt.amount,
                                                debtTitle: debt.title
                                            }
                                        })} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 3. HISTÓRICO / PAGOS */}
                        {paidDebts.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-5 opacity-50">
                                    <History className="w-4 h-4 text-slate-400" />
                                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Pagos Recentemente</h3>
                                </div>
                                <div className="space-y-4 opacity-70">
                                    {paidDebts.map(debt => (
                                        <DebtCard key={debt.id} debt={debt} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    INFO TILES GRID
                ═══════════════════════════════════════════════════════════════ */}
                <div className="grid grid-cols-2 gap-4 mt-8 mb-8">
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm group active:scale-95 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center mb-3 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
                            <Zap className="w-5 h-5" />
                        </div>
                        <h5 className="font-bold text-slate-900 text-xs leading-tight mb-0.5">Manutenção</h5>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Há 3 meses</p>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm group active:scale-95 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center mb-3 group-hover:bg-success-50 group-hover:text-success-500 transition-colors">
                            <Shield className="w-5 h-5" />
                        </div>
                        <h5 className="font-bold text-slate-900 text-xs leading-tight mb-0.5">Seguro Auto</h5>
                        <p className="text-[9px] font-bold text-success-500 uppercase tracking-widest">Ativo</p>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    PROMO CARD
                ═══════════════════════════════════════════════════════════════ */}
                <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-6 text-white shadow-2xl shadow-primary-200 relative overflow-hidden group mb-10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-400/20 rounded-full -ml-12 -mb-12 blur-2xl"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <Zap className="w-4 h-4 text-primary-200 fill-primary-200" />
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary-100">Parcelamento Inteligente</span>
                        </div>

                        <h3 className="text-xl font-bold leading-tight tracking-tighter mb-4">
                            Em dia com o seu veículo,<br />sem pesar no bolso.
                        </h3>

                        <p className="text-primary-100 text-[11px] font-medium leading-relaxed mb-6 opacity-90 max-w-[200px]">
                            Parcele IPVA, multas e licenciamento em até 12x no cartão com as melhores taxas.
                        </p>

                        <button
                            onClick={() => navigate('/vehicle-debt-simulation')}
                            className="bg-white text-primary-600 px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-primary-50 active:scale-95 transition-all shadow-lg"
                        >
                            Ver Simulação
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="absolute right-4 bottom-6 opacity-10 scale-125 rotate-12">
                        <CreditCard className="w-20 h-20" />
                    </div>
                </div>
            </div>

            {/* FLOATING ACTION BUTTON */}
            <div className="fixed bottom-6 left-6 right-6 z-[90]">
                <button
                    className="w-full bg-primary-600 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-primary-300 active:scale-[0.98] transition-all"
                    onClick={() => navigate('/vehicle-simulation', {
                        state: {
                            debtIds: debts.filter(d => d.status === 'pending').map(d => d.id),
                            totalAmount: debts.filter(d => d.status === 'pending').reduce((acc, d) => acc + d.amount, 0),
                            debtTitle: 'Todos os Débitos Pendentes'
                        }
                    })}
                >
                    <Zap className="w-4 h-4 fill-white" />
                    Quitar Tudo com Desconto
                </button>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

const DebtCard: React.FC<{ debt: ZapayDebt; isFine?: boolean; onPay?: () => void }> = ({ debt, isFine, onPay }) => {
    return (
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            {isFine && <div className="absolute top-0 right-0 w-20 h-20 bg-rose-50 rounded-full -mr-10 -mt-10 blur-2xl"></div>}

            <div className="flex justify-between items-start mb-5 relative z-10">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${debt.status === 'paid' ? 'bg-emerald-50 text-emerald-500' : isFine ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-600'}`}>
                        {isFine ? <AlertTriangle className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-sm">{debt.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            {debt.dueDate && (
                                <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    <Calendar className="w-3 h-3" />
                                    Vence em {new Date(debt.dueDate).toLocaleDateString('pt-BR')}
                                </div>
                            )}
                            {debt.installmentsAllowed && (
                                <div className="px-1.5 py-0.5 bg-primary-50 text-primary-600 rounded-md text-[8px] font-black uppercase tracking-widest">
                                    Até 12x
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-lg font-bold text-slate-900 tracking-tight">R$ {debt.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${debt.status === 'paid' ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {debt.status === 'paid' ? 'Garantido' : 'Pendente'}
                    </p>
                </div>
            </div>

            {debt.status === 'pending' && onPay && (
                <div className="flex gap-3 relative z-10 pt-4 border-t border-slate-50">
                    <button
                        onClick={onPay}
                        className="flex-1 bg-primary-600 text-white py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        Pagar Agora
                        <ArrowRight className="w-4 h-4" />
                    </button>
                    <button className="px-4 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all border border-slate-100">
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>
            )}

            {debt.status === 'paid' && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-50 text-emerald-500">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                        <CheckCircle2 className="w-4 h-4" />
                        Comprovante Disponível
                    </div>
                    <Download className="w-4 h-4" />
                </div>
            )}
        </div>
    );
};
