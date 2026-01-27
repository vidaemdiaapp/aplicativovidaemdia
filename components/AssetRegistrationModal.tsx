import React, { useState } from 'react';
import { X, Save, Car, Home, Package, Calendar, DollarSign, FileText } from 'lucide-react';
import { assetsService, Asset, AssetType } from '../services/assets';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    assetToEdit?: Asset | null;
}

export const AssetRegistrationModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, assetToEdit }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: assetToEdit?.name || '',
        type: (assetToEdit?.type || 'vehicle') as AssetType,
        purchase_value: assetToEdit?.purchase_value || 0,
        purchase_date: assetToEdit?.purchase_date || new Date().toISOString().split('T')[0],
        notes: assetToEdit?.notes || ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const success = await assetsService.saveAsset({
            ...assetToEdit,
            ...formData
        });

        if (success) {
            onSuccess();
            onClose();
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-white rounded-t-[40px] sm:rounded-[40px] shadow-2xl p-8 animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">{assetToEdit ? 'Editar Bem' : 'Novo Patrimônio'}</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 text-primary-600">Proteger Patrimônio</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {(['vehicle', 'real_estate', 'other'] as AssetType[]).map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setFormData({ ...formData, type })}
                                className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${formData.type === type
                                        ? 'border-primary-600 bg-primary-50 text-primary-600'
                                        : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                                    }`}
                            >
                                {type === 'vehicle' && <Car className="w-5 h-5" />}
                                {type === 'real_estate' && <Home className="w-5 h-5" />}
                                {type === 'other' && <Package className="w-5 h-5" />}
                                <span className="text-[10px] font-black uppercase">{type === 'vehicle' ? 'Veículo' : type === 'real_estate' ? 'Imóvel' : 'Outro'}</span>
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block">Nome do Bem</label>
                            <div className="relative">
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                <input
                                    type="text"
                                    placeholder="Ex: Jeep Compass, Apartamento Centro..."
                                    className="w-full bg-slate-50 border-0 rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-900 focus:ring-2 focus:ring-primary-500 transition-all"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block">Valor de Compra</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                    <input
                                        type="number"
                                        placeholder="0,00"
                                        className="w-full bg-slate-50 border-0 rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-900 focus:ring-2 focus:ring-primary-500 transition-all"
                                        value={formData.purchase_value || ''}
                                        onChange={(e) => setFormData({ ...formData, purchase_value: parseFloat(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block">Data de Compra</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border-0 rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-900 focus:ring-2 focus:ring-primary-500 transition-all"
                                        value={formData.purchase_date}
                                        onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        <Save className="w-6 h-6" />
                        {loading ? 'Salvando...' : 'Salvar Patrimônio'}
                    </button>
                </form>
            </div>
        </div>
    );
};
