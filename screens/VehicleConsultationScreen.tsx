import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Car } from 'lucide-react';
import { VehicleConsultationTab } from '../components/VehicleConsultationTab';

export const VehicleConsultationScreen: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Blue Hero Header */}
            <header className="bg-primary-500 pt-14 pb-24 px-6 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-400/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-20 w-48 h-48 bg-primary-600/20 rounded-full blur-2xl" />

                <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-white/20 transition-all">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <p className="text-primary-100 text-[10px] font-bold uppercase tracking-widest">Ferramentas</p>
                            <h1 className="text-white text-2xl font-bold">Consulta de Placas</h1>
                        </div>
                    </div>
                </div>
            </header>

            {/* Floating Content */}
            <div className="px-4 -mt-10 relative z-20">
                <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Search className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-base">Pesquisa Nacional</h3>
                        <p className="text-slate-500 text-[11px] leading-relaxed font-medium">
                            Consulte dados da base do Renavam, histórico de roubo/furto e Tabela FIPE em tempo real.
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6">
                    <VehicleConsultationTab />
                </div>
            </div>
        </div>
    );
};
