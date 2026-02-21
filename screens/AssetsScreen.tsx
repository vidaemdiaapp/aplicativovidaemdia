import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Car, Home, Package, MoreHorizontal, AlertTriangle, Trash2, DollarSign } from 'lucide-react';
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
                            <p className="text-primary-100 text-[10px] font-bold uppercase tracking-widest">Patrimônio</p>
                            <h1 className="text-white text-2xl font-bold">Meus Bens</h1>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsRegModalOpen(true)}
                        className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center text-primary-500 hover:scale-105 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Content Card Wrapper */}
            <div className="px-4 -mt-16 relative z-20">
                <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 mb-6">
                    {/* Motivation Card */}
                    <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-5 text-white relative overflow-hidden shadow-lg shadow-primary-200 mb-6">
                        <div className="relative z-10">
                            <h3 className="text-base font-black mb-2 flex items-center gap-2">
                                Proteção de Patrimônio 🛡️
                            </h3>
                            <p className="text-[11px] text-primary-50 font-medium leading-relaxed opacity-90">
                                Cadastrar seus bens aqui ajuda a preencher sua declaração anual e evita surpresas com impostos de venda.
                            </p>
                        </div>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-full"></div>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
                        </div>
                    ) : assets.length > 0 ? (
                        <div className="space-y-4 px-2">
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
                                                className="flex-1 py-3 px-4 bg-primary-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-tight flex items-center justify-center gap-2 hover:bg-primary-700 transition-all shadow-md shadow-primary-200"
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
