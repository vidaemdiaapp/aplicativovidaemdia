import React, { useState, useEffect } from 'react';
import {
    ChevronLeft, Plus, Receipt, Calendar, CreditCard,
    Bell, AlertTriangle, CheckCircle2, MoreVertical,
    Tv, Music, Zap, Heart, Shield, Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { tasksService, Task } from '../services/tasks';

import { subscriptionIntelligence } from '../services/subscriptionIntelligence';

export const SubscriptionsScreen: React.FC = () => {
    const navigate = useNavigate();
    const [subscriptions, setSubscriptions] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [foundSubscriptions, setFoundSubscriptions] = useState<any[]>([]);

    useEffect(() => {
        loadSubscriptions();
    }, []);

    const loadSubscriptions = async () => {
        setLoading(true);
        try {
            const household = await tasksService.getHousehold();
            if (!household) return;

            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('household_id', household.id)
                .eq('is_subscription', true)
                .order('due_date', { ascending: true });

            if (error) throw error;
            setSubscriptions(data || []);
        } catch (error) {
            console.error('[Subscriptions] Error loading:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleScan = async () => {
        setScanning(true);
        try {
            const found = await subscriptionIntelligence.scanForSubscriptions();
            // Filter out already added subscriptions
            const newFound = found.filter(f =>
                !subscriptions.some(s => s.title.toLowerCase().includes(f.title.toLowerCase()))
            );
            setFoundSubscriptions(newFound);
        } catch (error) {
            console.error('Error scanning:', error);
        } finally {
            setScanning(false);
        }
    };

    const handleAddFound = async (sub: any) => {
        navigate('/new-task', {
            state: {
                is_subscription: true,
                title: sub.title,
                amount: sub.amount,
                category_id: sub.category_id
            }
        });
    };

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const totalMonthly = subscriptions.reduce((acc, sub) => acc + (sub.amount || 0), 0);

    const getIcon = (title: string) => {
        const t = title.toLowerCase();
        if (t.includes('netflix') || t.includes('prime') || t.includes('disney') || t.includes('hbo')) return Tv;
        if (t.includes('spotify') || t.includes('deezer') || t.includes('apple music')) return Music;
        if (t.includes('internet') || t.includes('wifi') || t.includes('celular') || t.includes('claro') || t.includes('vivo')) return Globe;
        if (t.includes('seguro') || t.includes('plano')) return Shield;
        if (t.includes('gym') || t.includes('academia') || t.includes('saude')) return Heart;
        return Receipt;
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Header */}
            <header className="bg-primary-500 pt-14 pb-12 px-6 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-400/30 rounded-full blur-3xl" />

                <div className="flex items-center gap-4 relative z-10 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md text-white flex items-center justify-center"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold text-white">Minhas Assinaturas</h1>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 relative z-10 mt-4">
                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Investimento Mensal</p>
                    <h2 className="text-3xl font-black text-white">{formatCurrency(totalMonthly)}</h2>
                    <p className="text-white/50 text-[10px] mt-2 font-medium uppercase tracking-wider">
                        {subscriptions.length} Assinaturas Ativas
                    </p>
                </div>
            </header>

            <div className="px-6 -mt-4 relative z-20 space-y-4">
                {subscriptions.length === 0 && !loading ? (
                    <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-slate-100">
                        <Zap className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-800">Nenhuma assinatura detectada</h3>
                        <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                            Organize seus serviços recorrentes para nunca mais ser pego de surpresa no vencimento.
                        </p>
                        <button
                            onClick={() => navigate('/new-task', { state: { is_subscription: true } })}
                            className="mt-6 bg-primary-500 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
                        >
                            Adicionar Assinatura
                        </button>

                        <button
                            onClick={handleScan}
                            disabled={scanning}
                            className="mt-4 w-full text-slate-400 text-xs font-bold uppercase tracking-wider hover:text-primary-500 transition-colors flex items-center justify-center gap-2"
                        >
                            {scanning ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                    Escaneando...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4" />
                                    Escanear Recorrências
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Found Subscriptions Alert */}
                        {foundSubscriptions.length > 0 && (
                            <div className="bg-gradient-to-br from-indigo-500 to-primary-600 rounded-3xl p-5 mb-6 text-white shadow-lg shadow-primary-500/20 animate-in slide-in-from-top-4">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                            <Zap className="w-5 h-5 text-yellow-300" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">Encontramos {foundSubscriptions.length} Assinaturas!</h3>
                                            <p className="text-white/70 text-xs">Baseado no seu histórico de cartão.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setFoundSubscriptions([])}
                                        className="text-white/50 hover:text-white"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {foundSubscriptions.map((sub, idx) => (
                                        <div key={idx} className="bg-white/10 rounded-xl p-3 flex items-center justify-between border border-white/10">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{sub.icon}</span>
                                                <div>
                                                    <p className="font-bold text-sm">{sub.title}</p>
                                                    <p className="text-xs text-white/60">Último valor: {formatCurrency(sub.amount)}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleAddFound(sub)}
                                                className="bg-white text-primary-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-white/90 transition-colors"
                                            >
                                                Adicionar
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center mb-2 px-1">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Próximas Cobranças</h3>
                            <button
                                onClick={() => navigate('/new-task', { state: { is_subscription: true } })}
                                className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center transition-colors hover:bg-primary-500 hover:text-white"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        {subscriptions.map(sub => {
                            const Icon = getIcon(sub.title);
                            return (
                                <div
                                    key={sub.id}
                                    className="bg-white rounded-3xl p-4 flex items-center justify-between border border-slate-100 shadow-sm group hover:border-primary-200 transition-all hover:shadow-md"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 group-hover:text-primary-700 transition-colors">{sub.title}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Calendar className="w-3 h-3 text-slate-400" />
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                                    Vence dia {sub.due_date?.split('-')[2] || '??'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-slate-900">{formatCurrency(sub.amount || 0)}</p>
                                        <span className="text-[9px] font-black text-emerald-500 uppercase bg-emerald-50 px-2 py-0.5 rounded-full mt-1 inline-block">Ativa</span>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>

            {/* Smart Insight */}
            <div className="px-6 mt-8">
                <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-200 rounded-3xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm shrink-0">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1.5">Dica de Economia</h4>
                            <p className="text-slate-700 text-sm font-medium leading-relaxed">
                                Você gasta aproximadamente <span className="font-bold">{formatCurrency(totalMonthly * 12)}</span> por ano com assinaturas.
                                Revise as que você não usa há mais de 30 dias para otimizar seu patrimônio líquido.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
