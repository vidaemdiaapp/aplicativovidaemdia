import React, { useState } from 'react';
import {
    ChevronLeft, Car, Hash, FileText, Save,
    Trash2, Camera, Info, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export const VehicleEditScreen: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Form State
    const [vehicleType, setVehicleType] = useState<'car' | 'motorcycle'>('car');
    const [nickname, setNickname] = useState('Toyota Corolla');
    const [plate, setPlate] = useState('ABC-1234');
    const [renavam, setRenavam] = useState('12345678910');
    const [model, setModel] = useState('Altis Premium Hybrid 1.8');

    const handleSave = async () => {
        setLoading(true);
        // Mock save delay
        setTimeout(() => {
            setLoading(false);
            toast.success('Veículo salvo com sucesso!', {
                icon: '🚗',
                style: {
                    borderRadius: '1rem',
                    background: '#3b82f6',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 'bold'
                }
            });
            navigate('/vehicle-center');
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* ═══════════════════════════════════════════════════════════════
                HEADER
            ═══════════════════════════════════════════════════════════════ */}
            <header className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur-xl z-50">
                <button onClick={() => navigate(-1)} className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-100 disabled:opacity-50 active:scale-95 transition-all">
                    <ChevronLeft className="w-6 h-6 text-slate-600" />
                </button>
                <h1 className="font-bold text-slate-900 text-lg tracking-tight">Configurar Veículo</h1>
                <button className="p-2.5 bg-white text-rose-500 rounded-2xl shadow-sm border border-slate-100 active:bg-rose-50 transition-colors">
                    <Trash2 className="w-5 h-5" />
                </button>
            </header>

            <div className="px-6 space-y-10">
                {/* ═══════════════════════════════════════════════════════════════
                    VISUAL SELECTOR
                ═══════════════════════════════════════════════════════════════ */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tipo de Veículo</h3>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setVehicleType('car')}
                            className={`flex-1 p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 active:scale-[0.98] ${vehicleType === 'car'
                                ? 'bg-primary-600 border-primary-600 text-white shadow-2xl shadow-primary-200 ring-4 ring-primary-500/10'
                                : 'bg-white border-slate-100 text-slate-400'
                                }`}
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${vehicleType === 'car' ? 'bg-white/20' : 'bg-slate-50'}`}>
                                <Car className="w-7 h-7" />
                            </div>
                            <span className="font-bold text-[10px] uppercase tracking-[0.15em]">Carro de Passeio</span>
                        </button>
                        <button
                            onClick={() => setVehicleType('motorcycle')}
                            className={`flex-1 p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 active:scale-[0.98] ${vehicleType === 'motorcycle'
                                ? 'bg-primary-600 border-primary-600 text-white shadow-2xl shadow-primary-200 ring-4 ring-primary-500/10'
                                : 'bg-white border-slate-100 text-slate-400'
                                }`}
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${vehicleType === 'motorcycle' ? 'bg-white/20' : 'bg-slate-50'}`}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                                    <circle cx="5" cy="18" r="3" /><circle cx="19" cy="18" r="3" /><path d="M12 18V8a2 2 0 0 1 2-2h3" />
                                </svg>
                            </div>
                            <span className="font-bold text-[10px] uppercase tracking-[0.15em]">Motocicleta</span>
                        </button>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    INPUT FORM
                ═══════════════════════════════════════════════════════════════ */}
                <div className="space-y-8">
                    <InputField
                        label="Como prefere chamar?"
                        placeholder="Ex: Corolla do Diego"
                        value={nickname}
                        onChange={setNickname}
                        icon={<Car className="w-6 h-6" />}
                    />
                    <InputField
                        label="Modelo Completo"
                        placeholder="Ex: Altis Premium Hybrid 1.8"
                        value={model}
                        onChange={setModel}
                        icon={<FileText className="w-6 h-6" />}
                    />

                    <div className="grid grid-cols-2 gap-6">
                        <InputField
                            label="Placa"
                            placeholder="AAA-0A00"
                            value={plate}
                            onChange={setPlate}
                            icon={<Hash className="w-6 h-6" />}
                            isUppercase
                        />
                        <InputField
                            label="RENAVAM"
                            placeholder="11 dígitos"
                            value={renavam}
                            onChange={setRenavam}
                            icon={<CheckCircle2 className="w-6 h-6" />}
                        />
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    TIPS SECTION
                ═══════════════════════════════════════════════════════════════ */}
                <div className="bg-primary-50/50 rounded-3xl p-6 border border-primary-100 flex items-start gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary-100/30 rounded-full -mr-12 -mt-12 blur-2xl"></div>
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary-600 shadow-xl shadow-primary-200/50 flex-shrink-0 border border-primary-50">
                        <Info className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-primary-900 text-sm tracking-tight mb-1.5">Dados Obrigatórios</h4>
                        <p className="text-secondary-600 text-[13px] leading-relaxed font-medium">
                            Placa e RENAVAM são essenciais para consultarmos licenciamento e multas em tempo real.
                        </p>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    ACTION BUTTONS
                ═══════════════════════════════════════════════════════════════ */}
                <div className="space-y-4 pt-6">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white py-5 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-primary-200 transition-all active:scale-[0.97] disabled:opacity-70"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Confirmar Dados
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full bg-white text-slate-400 py-5 rounded-2xl font-bold text-sm uppercase tracking-widest border border-slate-100 hover:bg-slate-50 hover:text-slate-600 transition-all active:scale-[0.97]"
                    >
                        Voltar
                    </button>
                </div>
            </div>
        </div>
    );
};

const InputField = ({ label, placeholder, value, onChange, icon, isUppercase = false }: {
    label: string,
    placeholder: string,
    value: string,
    onChange: (val: string) => void,
    icon: React.ReactNode,
    isUppercase?: boolean
}) => (
    <div className="space-y-2 group">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 group-focus-within:text-primary-600 transition-colors italic">{label}</label>
        <div className="relative">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors">
                {icon}
            </div>
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(isUppercase ? e.target.value.toUpperCase() : e.target.value)}
                className="w-full bg-white border border-slate-100 rounded-2xl py-4.5 pl-16 pr-8 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-100 transition-all text-sm"
            />
        </div>
    </div>
);
