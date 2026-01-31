import React, { useState } from 'react';
import { X, DollarSign, Calendar, TrendingUp, AlertTriangle, ArrowRight, Receipt, CheckCircle2 } from 'lucide-react';
import { assetsService, Asset } from '../services/assets';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    asset: Asset;
}

export const AssetSaleModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, asset }) => {
    const [loading, setLoading] = useState(false);
    const [saleValue, setSaleValue] = useState<number>(asset.sale_value || 0);
    const [saleDate, setSaleDate] = useState(asset.sale_date || new Date().toISOString().split('T')[0]);
    const [saleReceipt, setSaleReceipt] = useState<File | null>(null);
    const [saleReceiptUrl, setSaleReceiptUrl] = useState<string | null>(asset.sale_receipt_url || null);

    if (!isOpen) return null;

    const profit = Math.max(saleValue - asset.purchase_value, 0);
    const hasCapitalGain = profit > 0;
    const isEditing = asset.status === 'sold';

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setSaleReceipt(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        let finalReceiptUrl = saleReceiptUrl;
        if (saleReceipt) {
            const uploadedUrl = await assetsService.uploadReceipt(saleReceipt, asset.id, 'sale');
            if (uploadedUrl) finalReceiptUrl = uploadedUrl;
        }

        const success = await assetsService.sellAsset(asset.id, saleValue, saleDate, finalReceiptUrl || undefined);
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
                        <h2 className="text-2xl font-black text-slate-900">{isEditing ? 'Editar Venda' : 'Baixa de Bem'}</h2>
                        <p className="text-xs text-rose-600 font-bold uppercase tracking-widest mt-1">{isEditing ? 'Ajustar Valores' : 'Registrar Venda'}</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Bem selecionado</p>
                        <p className="font-bold text-slate-900">{asset.name}</p>
                        <p className="text-xs text-slate-500">Comprado por: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(asset.purchase_value)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block">Valor da Venda</label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                <input
                                    type="number"
                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-900 transition-all outline-none"
                                    value={saleValue || ''}
                                    onChange={(e) => setSaleValue(parseFloat(e.target.value))}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block">Data da Venda</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                <input
                                    type="date"
                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-900 transition-all outline-none"
                                    value={saleDate}
                                    onChange={(e) => setSaleDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Upload de Recibo */}
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block">Recibo de Venda</label>
                        <div className="relative flex items-center justify-between p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 hover:border-slate-200 transition-all cursor-pointer group" onClick={() => document.getElementById('sale-receipt-input')?.click()}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-xl text-slate-400 group-hover:text-primary-500 transition-colors">
                                    <Receipt className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700">
                                        {saleReceipt ? saleReceipt.name : (saleReceiptUrl ? 'Recibo Enviado' : 'Subir foto/PDF')}
                                    </p>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-tighter">Máximo 10MB</p>
                                </div>
                            </div>
                            <input
                                id="sale-receipt-input"
                                type="file"
                                accept="image/*,application/pdf"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            {saleReceipt || saleReceiptUrl ? (
                                <div className="text-emerald-500 bg-emerald-50 p-1.5 rounded-lg border border-emerald-100">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                            ) : (
                                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400" />
                            )}
                        </div>
                    </div>

                    {hasCapitalGain && (
                        <div className="p-5 bg-amber-50 rounded-3xl border-2 border-amber-100 flex gap-4 items-start animate-in fade-in duration-500">
                            <div className="bg-amber-500 p-2 rounded-xl text-white">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-amber-900 uppercase">Aviso de Ganho de Capital</p>
                                <p className="text-sm text-amber-800 font-medium leading-tight mt-1">
                                    Vender por um valor maior gera lucro de <span className="font-black underline">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(profit)}</span>.
                                    Isso pode gerar imposto de IR que deve ser pago no mês seguinte à venda.
                                </p>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {isEditing ? 'Salvar Alterações' : 'Confirmar Venda'}
                        <ArrowRight className="w-6 h-6" />
                    </button>
                </form>
            </div>
        </div>
    );
};
