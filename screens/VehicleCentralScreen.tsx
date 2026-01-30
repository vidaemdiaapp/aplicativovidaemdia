import React, { useState } from 'react';
import {
    ChevronLeft, MoreHorizontal, Car, Shield, AlertTriangle,
    CheckCircle2, Info, ArrowRight, Wallet, History, Search,
    Zap, Calendar, Clock, DollarSign, ChevronRight, FileText,
    Sparkles, Download, Share2, Settings, Plus, Edit2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const VehicleCentralScreen: React.FC = () => {
    const navigate = useNavigate();

    // Mock Data
    const vehicle = {
        name: 'Toyota Corolla',
        model: 'Altis Premium Hybrid 1.8',
        plate: 'ABC-1234',
        fipeValue: 115000,
        status: 'atencao', // 'ok' | 'atencao' | 'critico'
        image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=800&auto=format&fit=crop'
    };

    const debts = [
        { id: 1, title: 'Licenciamento', value: 160.22, dueDate: '15/10/2024', status: 'pending', year: '2024' },
        { id: 2, title: 'IPVA 2024', value: 4250.00, status: 'paid', year: '2024', details: 'Cota única quitada' },
    ];

    const fines = [
        {
            id: 101,
            title: 'Excesso de Velocidade (20%)',
            value: 195.23,
            date: '12/09/2024',
            location: 'Av. Rebouças, 1200',
            type: 'Gravíssima',
            points: 7,
            status: 'active'
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 pb-32">
            {/* ═══════════════════════════════════════════════════════════════
          HEADER & HERO
      ═══════════════════════════════════════════════════════════════ */}
            <div className="relative h-72">
                <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-black/20"></div>

                <div className="absolute top-12 left-6 right-6 flex justify-between items-center text-white">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl hover:bg-white/30 transition-all"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="font-black text-lg tracking-tight">Central de Veículos</h1>
                    <button
                        onClick={() => navigate('/vehicle-edit')}
                        className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl hover:bg-white/30 transition-all"
                    >
                        <Settings className="w-6 h-6" />
                    </button>
                </div>

                <div className="absolute -bottom-16 left-6 right-6">
                    <div className="bg-white rounded-[2.5rem] p-6 shadow-premium border border-slate-100 relative overflow-hidden">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="flex h-2 w-2 rounded-full bg-warning-500 animate-pulse"></span>
                                    <span className="text-[10px] font-black text-warning-600 uppercase tracking-widest">Status: Em Atenção</span>
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{vehicle.name}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-black text-slate-600 border border-slate-200 uppercase tracking-tighter">Placa: {vehicle.plate}</div>
                                    <button
                                        onClick={() => navigate('/vehicle-edit')}
                                        className="text-primary-600 hover:text-primary-700 transition-colors"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Fipe</p>
                                <p className="text-xl font-black text-accent-orange">R$ {vehicle.fipeValue.toLocaleString('pt-BR')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 mt-24">
                {/* ═══════════════════════════════════════════════════════════════
            DEBTS SECTION
        ═══════════════════════════════════════════════════════════════ */}
                <div className="flex justify-between items-end mb-4">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Pendências e Débitos</h3>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">2024</span>
                </div>

                <div className="space-y-3">
                    {debts.map(debt => (
                        <div
                            key={debt.id}
                            className={`bg-white p-4 rounded-3xl border ${debt.status === 'pending' ? 'border-orange-100 shadow-sm' : 'border-slate-100'} flex items-center gap-4`}
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${debt.status === 'pending' ? 'bg-orange-50 text-orange-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                {debt.status === 'pending' ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-900 text-sm leading-tight">{debt.title}</h4>
                                <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${debt.status === 'pending' ? 'text-orange-500' : 'text-slate-400'}`}>
                                    {debt.status === 'pending' ? `Vencimento: ${debt.dueDate}` : debt.details}
                                </p>
                            </div>
                            {debt.status === 'pending' ? (
                                <button
                                    onClick={() => navigate('/vehicle-simulation')}
                                    className="bg-accent-orange text-white px-4 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-100 active:scale-95 transition-all"
                                >
                                    Pagar Agora
                                </button>
                            ) : (
                                <div className="flex items-center gap-1.5 text-emerald-500 font-black text-[10px] uppercase tracking-widest outline outline-1 outline-emerald-100 px-3 py-1.5 rounded-full">
                                    <span>Pago</span>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* ═══════════════════════════════════════════════════════════════
            FINES SECTION
        ═══════════════════════════════════════════════════════════════ */}
                <div className="flex justify-between items-end mt-8 mb-4">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Multas</h3>
                    <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">1 Ativa</span>
                </div>

                {fines.map(fine => (
                    <div key={fine.id} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">{fine.type} • {fine.points} Pontos</span>
                                <h4 className="text-lg font-black text-slate-900 mt-1 leading-tight tracking-tight">{fine.title}</h4>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-slate-900">R$ {fine.value.toLocaleString('pt-BR')}</p>
                                <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">{fine.date}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                <Search className="w-4 h-4" />
                            </div>
                            <p className="text-[11px] font-medium text-slate-500 italic">{fine.location}</p>
                        </div>

                        <div className="flex gap-2">
                            <button className="flex-1 bg-primary-600 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary-200 active:scale-[0.98] transition-all">
                                <Sparkles className="w-4 h-4" />
                                Contestar com IA
                            </button>
                            <button className="p-3.5 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-colors">
                                <FileText className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}

                {/* ═══════════════════════════════════════════════════════════════
            INFO TILES GRID
        ═══════════════════════════════════════════════════════════════ */}
                <div className="grid grid-cols-2 gap-4 mt-8 mb-8">
                    <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm group active:scale-95 transition-all">
                        <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-3 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
                            <Zap className="w-5 h-5" />
                        </div>
                        <h5 className="font-black text-slate-900 text-sm leading-tight mb-1">Manutenção</h5>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Há 3 meses</p>
                    </div>
                    <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm group active:scale-95 transition-all">
                        <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-3 group-hover:bg-success-50 group-hover:text-success-500 transition-colors">
                            <Shield className="w-5 h-5" />
                        </div>
                        <h5 className="font-black text-slate-900 text-sm leading-tight mb-1">Seguro Auto</h5>
                        <p className="text-[10px] font-bold text-success-500 uppercase tracking-widest">Ativo</p>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
            PROMO CARD
        ═══════════════════════════════════════════════════════════════ */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden mb-10 group shadow-2xl">
                    {/* Background elements */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-accent-orange/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-600/10 rounded-full blur-2xl -ml-10 -mb-10"></div>

                    <div className="relative z-10 flex flex-col items-start">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-md">
                                <Sparkles className="w-4 h-4 text-accent-orange" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Exclusivo</span>
                        </div>
                        <h3 className="text-xl font-black leading-tight tracking-tight mb-2">Parcelamento Inteligente</h3>
                        <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-[200px] mb-8">
                            Parcele seus débitos em até <span className="text-white font-bold">12x no cartão</span> com as menores taxas do mercado.
                        </p>
                        <button
                            onClick={() => navigate('/vehicle-simulation')}
                            className="bg-accent-orange hover:bg-accent-orange-hover text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-accent-orange/20 active:scale-95 transition-all w-full md:w-auto"
                        >
                            Simular Agora
                        </button>
                    </div>

                    {/* Abstract icon decor */}
                    <div className="absolute bottom-6 right-6 opacity-10">
                        <CreditCardIcon className="w-24 h-24" />
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                FLOATING ACTION BUTTON (Add Vehicle)
            ═══════════════════════════════════════════════════════════════ */}
            <div className="fixed bottom-10 right-6 z-50">
                <button
                    onClick={() => navigate('/vehicle-edit')}
                    className="flex items-center gap-3 bg-primary-600 text-white px-6 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary-300 active:scale-95 transition-all hover:bg-primary-700"
                >
                    <Plus className="w-5 h-5" />
                    Adicionar Veículo
                </button>
            </div>
        </div>
    );
};

const CreditCardIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="15" rx="3" />
        <path d="M3 10h18" />
        <path d="M7 15h.01" />
        <path d="M11 15h2" />
    </svg>
);
