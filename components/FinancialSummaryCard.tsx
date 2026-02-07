import React from 'react';
import { Wallet, ArrowUpCircle, ArrowDownCircle, ChevronRight, TrendingUp } from 'lucide-react';
import { CountUp } from './CountUp';

interface Props {
    report: {
        total_income: number;
        total_commitments: number;
        balance: number;
        status: 'surplus' | 'warning' | 'deficit';
    } | null;
    onClick: () => void;
}

export const FinancialSummaryCard: React.FC<Props> = ({ report, onClick }) => {
    const formatCurrency = (val: number | undefined | null) =>
        (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const statusConfig = {
        surplus: {
            bg: 'bg-emerald-500',
            lightBg: 'bg-emerald-50',
            label: 'Sobra disponível',
            textColor: 'text-emerald-600'
        },
        warning: {
            bg: 'bg-amber-500',
            lightBg: 'bg-amber-50',
            label: 'Atenção ao limite',
            textColor: 'text-amber-600'
        },
        deficit: {
            bg: 'bg-rose-500',
            lightBg: 'bg-rose-50',
            label: 'Déficit previsto',
            textColor: 'text-rose-600'
        }
    };

    const config = report ? statusConfig[report.status] : { bg: 'bg-slate-400', lightBg: 'bg-slate-50', label: 'Carregando...', textColor: 'text-slate-600' };

    return (
        <section
            onClick={onClick}
            className="card p-6 relative overflow-hidden group active:scale-[0.99] transition-all cursor-pointer"
        >
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 w-40 h-40 ${config.lightBg} rounded-full -mr-20 -mt-20 blur-3xl opacity-50`}></div>

            {/* Header */}
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-primary-500" />
                        <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.15em]">
                            Saldo Projetado
                        </p>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-3xl font-black text-text-primary tracking-tight">
                            {report ? (
                                <CountUp
                                    value={report.balance}
                                    formatter={formatCurrency}
                                />
                            ) : 'R$ 0,00'}
                        </h2>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-full border border-slate-100">
                        <span className={`w-1.5 h-1.5 rounded-full ${config.bg} animate-pulse`}></span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${config.textColor}`}>
                            {config.label}
                        </span>
                    </div>
                </div>
                <div className="bg-primary-500 text-white p-3.5 rounded-2xl shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform">
                    <Wallet className="w-6 h-6" />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-1 transition-colors hover:bg-emerald-50/50">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1 px-1.5 bg-emerald-100 rounded-lg">
                            <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Rendas</p>
                    </div>
                    <p className="text-[15px] font-black text-emerald-600">
                        {report ? (
                            <CountUp
                                value={report.total_income}
                                formatter={formatCurrency}
                                duration={800}
                            />
                        ) : 'R$ 0,00'}
                    </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-1 transition-colors hover:bg-rose-50/50">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1 px-1.5 bg-rose-100 rounded-lg">
                            <ArrowDownCircle className="w-3.5 h-3.5 text-rose-600" />
                        </div>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Saídas</p>
                    </div>
                    <p className="text-[15px] font-black text-rose-600">
                        {report ? (
                            <CountUp
                                value={report.total_commitments}
                                formatter={formatCurrency}
                                duration={800}
                            />
                        ) : 'R$ 0,00'}
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-primary-500 px-1 relative z-10 transition-all group-hover:px-2">
                <span className="text-xs font-black uppercase tracking-widest">Análise Detalhada</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
        </section>
    );
};
