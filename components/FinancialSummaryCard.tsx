import React from 'react';
import { DollarSign, Wallet, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

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
    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const statusConfig = {
        surplus: { color: 'bg-emerald-500', icon: '🟢', label: 'sobra' },
        warning: { color: 'bg-amber-500', icon: '🟡', label: 'no limite' },
        deficit: { color: 'bg-rose-500', icon: '🔴', label: 'vai faltar' }
    };

    const config = report ? statusConfig[report.status] : { color: 'bg-slate-300', icon: '⚪', label: '...' };

    return (
        <section
            onClick={onClick}
            className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 active:scale-[0.98] transition-all cursor-pointer hover:shadow-md hover:border-primary-100"
        >
            <div className="flex justify-between items-start mb-6">
                <div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Resumo do Mês</p>
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-slate-900">
                            {report ? formatCurrency(report.balance) : 'R$ 0,00'}
                        </span>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded text-white uppercase ${config.color}`}>
                            {config.label} {config.icon}
                        </span>
                    </div>
                </div>
                <div className="bg-primary-50 p-3 rounded-2xl">
                    <Wallet className="w-5 h-5 text-primary-600" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 p-2 rounded-xl">
                        <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Entradas</p>
                        <p className="text-sm font-black text-slate-700">{report ? formatCurrency(report.total_income) : 'R$ 0,00'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-rose-50 p-2 rounded-xl">
                        <ArrowDownCircle className="w-4 h-4 text-rose-600" />
                    </div>
                    <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Saídas</p>
                        <p className="text-sm font-black text-slate-700">{report ? formatCurrency(report.total_commitments) : 'R$ 0,00'}</p>
                    </div>
                </div>
            </div>
        </section>
    );
};
