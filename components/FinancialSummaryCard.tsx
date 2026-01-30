import React from 'react';
import { Wallet, ArrowUpCircle, ArrowDownCircle, ChevronRight } from 'lucide-react';

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
            label: 'Sobra',
            textColor: 'text-emerald-600'
        },
        warning: {
            bg: 'bg-amber-500',
            label: 'No limite',
            textColor: 'text-amber-600'
        },
        deficit: {
            bg: 'bg-rose-500',
            label: 'Vai faltar',
            textColor: 'text-rose-600'
        }
    };

    const config = report ? statusConfig[report.status] : { bg: 'bg-slate-400', label: '...', textColor: 'text-slate-600' };

    return (
        <section
            onClick={onClick}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 active:scale-[0.99] transition-all cursor-pointer hover:shadow-md group"
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-5">
                <div>
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1">
                        Resumo do Mês
                    </p>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-slate-900">
                            {report ? formatCurrency(report.balance) : 'R$ 0,00'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full text-white ${config.bg}`}>
                            {config.label}
                        </span>
                    </div>
                </div>
                <div className="bg-primary-50 p-3 rounded-xl group-hover:bg-primary-100 transition-colors">
                    <Wallet className="w-5 h-5 text-primary-600" />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                    <div className="bg-emerald-100 p-2 rounded-lg">
                        <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Entradas</p>
                        <p className="text-sm font-bold text-emerald-600">
                            {report ? formatCurrency(report.total_income) : 'R$ 0,00'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                    <div className="bg-rose-100 p-2 rounded-lg">
                        <ArrowDownCircle className="w-4 h-4 text-rose-600" />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Saídas</p>
                        <p className="text-sm font-bold text-rose-600">
                            {report ? formatCurrency(report.total_commitments) : 'R$ 0,00'}
                        </p>
                    </div>
                </div>
            </div>

            {/* View More Link */}
            <div className="flex items-center justify-center gap-1 text-primary-500 text-sm font-medium pt-2 border-t border-slate-100">
                <span>Ver detalhes</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
        </section>
    );
};
