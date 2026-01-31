import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Car, Home, Package, MoreHorizontal, TrendingUp, AlertTriangle, Trash2, Calendar, DollarSign, ChevronRight } from 'lucide-react';
import { assetsService, Asset, AssetType } from '../services/assets';
import { CardSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { AssetRegistrationModal } from '../components/AssetRegistrationModal';
import { AssetSaleModal } from '../components/AssetSaleModal';

export const AssetsScreen: React.FC = () => {
    const navigate = useNavigate();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRegModalOpen, setIsRegModalOpen] = useState(false);
    const [selectedAssetForSale, setSelectedAssetForSale] = useState<Asset | null>(null);
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

    useEffect(() => {
        loadAssets();
    }, []);

    const loadAssets = async () => {
        setLoading(true);
        const data = await assetsService.getAssets();
        setAssets(data);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Deseja remover este bem permanentemente?')) {
            const success = await assetsService.deleteAsset(id);
            if (success) {
                setAssets(prev => prev.filter(a => a.id !== id));
            }
        }
    };

    const getIcon = (type: AssetType) => {
        switch (type) {
            case 'vehicle': return <Car className="w-6 h-6 text-blue-500" />;
            case 'real_estate': return <Home className="w-6 h-6 text-emerald-500" />;
            default: return <Package className="w-6 h-6 text-slate-400" />;
        }
    };

    const getLabel = (type: AssetType) => {
        switch (type) {
            case 'vehicle': return 'Veículo';
            case 'real_estate': return 'Imóvel';
            default: return 'Outros';
        }
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            <header className="bg-white p-6 pt-12 pb-4 sticky top-0 z-10 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full -ml-2">
                            <ArrowLeft className="w-6 h-6 text-slate-700" />
                        </button>
                        <h1 className="text-xl font-bold text-slate-900">Meus Bens</h1>
                    </div>
                    <button
                        onClick={() => setIsRegModalOpen(true)}
                        className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg hover:bg-slate-800 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="p-6">
                {/* Motivation Card */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[32px] p-6 text-white mb-8 relative overflow-hidden shadow-2xl">
                    <div className="relative z-10">
                        <h3 className="text-lg font-black mb-2 flex items-center gap-2">
                            Proteção de Patrimônio 🛡️
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            Cadastrar seus bens aqui ajuda a preencher sua declaração anual e evita surpresas com impostos de venda (Ganho de Capital).
                        </p>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full"></div>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
                    </div>
                ) : assets.length > 0 ? (
                    <div className="space-y-4">
                        {assets.map((asset) => (
                            <div key={asset.id} className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm relative group overflow-hidden">
                                {asset.status === 'sold' && (
                                    <div className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] font-black uppercase px-4 py-1.5 rounded-bl-2xl">Vendido</div>
                                )}

                                <div className="flex items-center gap-5">
                                    <div className="bg-slate-50 p-4 rounded-3xl">
                                        {getIcon(asset.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{getLabel(asset.type)}</span>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-[10px] font-medium text-slate-400">Adquirido em {new Date(asset.purchase_date).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                        <h4 className="font-black text-slate-900 truncate">{asset.name}</h4>
                                        <p className="text-sm font-bold text-slate-400 mt-1">{formatCurrency(asset.purchase_value)}</p>
                                    </div>
                                </div>

                                {asset.status === 'owned' && (
                                    <div className="mt-5 flex gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedAssetForSale(asset);
                                                setIsSaleModalOpen(true);
                                            }}
                                            className="flex-1 py-3 px-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-tight flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                                        >
                                            <DollarSign className="w-3 h-3" /> Registrei Venda
                                        </button>
                                        <button
                                            onClick={() => handleDelete(asset.id)}
                                            className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}

                                {asset.status === 'sold' && asset.sale_value && (
                                    <div className="mt-5 space-y-4">
                                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] font-black text-amber-800 uppercase mb-0.5">Aviso de Ganho de Capital</p>
                                                <p className="text-[11px] text-amber-700 leading-tight">
                                                    A venda por {formatCurrency(asset.sale_value)} pode gerar obrigações fiscais sobre o lucro de {formatCurrency(asset.sale_value - asset.purchase_value)}. Verifique com seu contador.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedAssetForSale(asset);
                                                    setIsSaleModalOpen(true);
                                                }}
                                                className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-tight flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
                                            >
                                                <MoreHorizontal className="w-3 h-3" /> Corrigir Venda
                                            </button>
                                            <button
                                                onClick={() => handleDelete(asset.id)}
                                                className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-rose-500 transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={Package}
                        title="Seu pátio está vazio"
                        description="Cadastre veículos ou imóveis para ter uma visão real de patrimônio e proteger seu imposto."
                        actionLabel="Cadastrar Primeiro Bem"
                        onAction={() => setIsRegModalOpen(true)}
                    />
                )}
            </div>

            <AssetRegistrationModal
                isOpen={isRegModalOpen}
                onClose={() => setIsRegModalOpen(false)}
                onSuccess={loadAssets}
            />

            {selectedAssetForSale && (
                <AssetSaleModal
                    isOpen={isSaleModalOpen}
                    onClose={() => setIsSaleModalOpen(false)}
                    onSuccess={loadAssets}
                    asset={selectedAssetForSale}
                />
            )}
        </div>
    );
};
