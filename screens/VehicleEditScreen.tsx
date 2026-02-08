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
            <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur-xl z-50">
                <button onClick={() => navigate(-1)} className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-100 disabled:opacity-50">
                    <ChevronLeft className="w-6 h-6 text-slate-600" />
                </button>
                <h1 className="font-black text-slate-900 tracking-tight">Configurar Veículo</h1>
                <button className="p-2.5 bg-white text-rose-500 rounded-2xl shadow-sm border border-slate-100 active:bg-rose-50 transition-colors">
                    <Trash2 className="w-5 h-5" />
                </button>
            </header>

            <div className="px-6 space-y-8">
                {/* ═══════════════════════════════════════════════════════════════
                    VISUAL SELECTOR
                ═══════════════════════════════════════════════════════════════ */}
                <div className="flex gap-4">
                    <button
                        onClick={() => setVehicleType('car')}
                        className={`flex-1 p-6 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-3 ${vehicleType === 'car'
                            ? 'bg-primary-600 border-primary-600 text-white shadow-xl shadow-primary-200'
                            : 'bg-white border-slate-100 text-slate-400'
                            }`}
                    >
                        <Car className={`w-8 h-8 ${vehicleType === 'car' ? 'animate-bounce' : ''}`} />
                        <span className="font-black text-[10px] uppercase tracking-[0.2em]">Carro</span>
                    </button>
                    <button
                        onClick={() => setVehicleType('motorcycle')}
                        className={`flex-1 p-6 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-3 ${vehicleType === 'motorcycle'
                            ? 'bg-primary-600 border-primary-600 text-white shadow-xl shadow-primary-200'
                            : 'bg-white border-slate-100 text-slate-400'
                            }`}
                    >
                        <div className="w-8 h-8 flex items-center justify-center">
                            {/* Mock motorcycle icon since lucide doesn't have a perfect match */}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                                <circle cx="5" cy="18" r="3" /><circle cx="19" cy="18" r="3" /><path d="M12 18V8a2 2 0 0 1 2-2h3" />
                            </svg>
                        </div>
                        <span className="font-black text-[10px] uppercase tracking-[0.2em]">Moto</span>
                    </button>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    INPUT FORM
                ═══════════════════════════════════════════════════════════════ */}
                <div className="space-y-6">
                    <InputField
                        label="Apelido do Veículo"
                        placeholder="Ex: Meu Toyota"
                        value={nickname}
                        onChange={setNickname}
                        icon={<Car className="w-5 h-5" />}
                    />
                    <InputField
                        label="Modelo / Versão"
                        placeholder="Ex: Corolla Altis 2024"
                        value={model}
                        onChange={setModel}
                        icon={<FileText className="w-5 h-5" />}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <InputField
                            label="Placa"
                            placeholder="ABC-1234"
                            value={plate}
                            onChange={setPlate}
                            icon={<Hash className="w-5 h-5" />}
                            isUppercase
                        />
                        <InputField
                            label="RENAVAM"
                            placeholder="11 dígitos"
                            value={renavam}
                            onChange={setRenavam}
                            icon={<FileText className="w-5 h-5" />}
                        />
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    TIPS SECTION
                ═══════════════════════════════════════════════════════════════ */}
                <div className="bg-primary-50 rounded-[2rem] p-6 border border-primary-100 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-primary-600 shadow-sm flex-shrink-0">
                        <Info className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-black text-primary-900 text-sm tracking-tight mb-1">Por que a Placa e RENAVAM?</h4>
                        <p className="text-secondary-600 text-[11px] leading-relaxed font-medium">
                            Com esses dados, nossa IA consegue consultar débitos, multas e licenciamento automaticamente nos órgãos competentes.
                        </p>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    ACTION BUTTONS
                ═══════════════════════════════════════════════════════════════ */}
                <div className="space-y-3 pt-6">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-primary-200 transition-all active:scale-[0.98] disabled:opacity-70"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Salvar Alterações
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full bg-white text-slate-500 py-5 rounded-2xl font-black text-sm uppercase tracking-widest border border-slate-100 hover:bg-slate-50 transition-all active:scale-[0.98]"
                    >
                        Cancelar
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
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors">
                {icon}
            </div>
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(isUppercase ? e.target.value.toUpperCase() : e.target.value)}
                className="w-full bg-white border border-slate-100 rounded-3xl py-4 pl-12 pr-6 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-600 transition-all text-sm"
            />
        </div>
    </div>
);
