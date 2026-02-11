import React from 'react';
import { Heart, TrendingUp, PieChart, Info } from 'lucide-react';

interface CoupleSummaryHelpers {
    partnerName: string | null;
}

export const CoupleSummaryWidget: React.FC<CoupleSummaryHelpers> = ({ partnerName }) => {
    // Mock data for equity
    const data = {
        you: 65,
        partner: 35,
        totalBalance: 12500.00
    };

    return (
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl p-6 text-white shadow-xl shadow-rose-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-8 -mt-8" />

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                        <Heart className="w-5 h-5 text-white fill-white" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Vida a Dois</p>
                        <h3 className="text-sm font-bold">Você & {partnerName || 'Parceiro'}</h3>
                    </div>
                </div>
                <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                    <p className="text-xs font-black">R$ {data.totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                    <p className="text-[10px] opacity-70 mb-1 font-medium">Contribuído (Mês)</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black">{data.you}%</span>
                        <span className="text-[10px]">Você</span>
                    </div>
                    <div className="w-full h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-white" style={{ width: `${data.you}%` }} />
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                    <p className="text-[10px] opacity-70 mb-1 font-medium">Contribuído (Mês)</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-rose-200">{data.partner}%</span>
                        <span className="text-[10px] text-rose-200">{partnerName || 'Parceiro'}</span>
                    </div>
                    <div className="w-full h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-rose-300" style={{ width: `${data.partner}%` }} />
                    </div>
                </div>
            </div>

            <div className="mt-4 flex items-center gap-2 opacity-60">
                <Info className="w-3 h-3" />
                <p className="text-[9px]">A equidade é calculada baseada nos pagamentos de contas conjuntas.</p>
            </div>
        </div>
    );
};
