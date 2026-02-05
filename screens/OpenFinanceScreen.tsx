import React, { useState, useEffect } from 'react';
import {
    Landmark, Link2, RefreshCw, ChevronRight, Plus, AlertTriangle,
    CheckCircle2, Clock, Wallet, ArrowUpCircle, ArrowDownCircle,
    Building2, CreditCard, ExternalLink, Unlink, Loader2, TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    openFinanceService,
    OpenFinanceLink,
    OpenFinanceAccount,
    OpenFinanceTransaction
} from '../services/openfinance';
import { supabase } from '../services/supabase';

export const OpenFinanceScreen: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [links, setLinks] = useState<OpenFinanceLink[]>([]);
    const [accounts, setAccounts] = useState<OpenFinanceAccount[]>([]);
    const [transactions, setTransactions] = useState<OpenFinanceTransaction[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [linksData, accountsData, txData] = await Promise.all([
                openFinanceService.getLinks(),
                openFinanceService.getAccounts(),
                openFinanceService.getTransactions(undefined, { limit: 10 })
            ]);
            setLinks(linksData);
            setAccounts(accountsData);
            setTransactions(txData);
        } catch (err: any) {
            console.error('[OpenFinance] Load error:', err);
            setError('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        setConnecting(true);
        setError(null);

        // DEBUG: Forçar refresh do token antes de usar
        console.log("[AUTH] Refreshing session...");
        const { error: refreshErr } = await supabase.auth.refreshSession();
        if (refreshErr) {
            console.error("[AUTH] Refresh failed:", refreshErr);
        }

        // DEBUG: Teste de fetch manual com token corrigido
        try {
            const { data } = await supabase.auth.getSession();
            const token = data.session?.access_token;

            console.log("TOKEN PREFIX:", token?.slice(0, 3));
            console.log("TOKEN HAS DOTS:", token?.split(".").length);

            if (!token) throw new Error("Sem sessão: faça login antes.");

            // Usar functions.invoke (lida com auth/headers automaticamente)
            const { data: funcData, error: funcError } = await supabase.functions.invoke("openfinance_connect_start", {
                body: {},
            });

            if (funcError) {
                console.error("[OpenFinance] Invoke error object:", funcError);
                // Tenta extrair status/body se disponível
                throw new Error(`Invoke falhou: ${funcError.message || JSON.stringify(funcError)}`);
            }

            console.log("[DEBUG] Invoke success:", funcData);

            if (funcData && funcData.connect_url) {
                window.open(funcData.connect_url, '_blank');
                setTimeout(() => {
                    loadData();
                    setConnecting(false);
                }, 3000);
            } else {
                throw new Error("Resposta inválida da função (sem connect_url)");
            }
        } catch (err: any) {
            console.error('[OpenFinance] Connect error:', err);
            setError(err.message || 'Erro ao conectar');
            setConnecting(false);
        }
    };

    const handleDisconnect = async (linkId: string) => {
        if (!confirm('Deseja desconectar esta conta?')) return;
        try {
            await openFinanceService.disconnectLink(linkId);
            await loadData();
        } catch (err: any) {
            setError('Erro ao desconectar');
        }
    };

    const formatCurrency = (val: number | null) =>
        (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance_current || 0), 0);
    const connectedLinks = links.filter(l => l.status === 'connected');
    const health = openFinanceService.getConnectionHealth(links);

    if (loading) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin"></div>
                    <p className="text-slate-400 text-sm font-medium animate-pulse uppercase tracking-widest">
                        Carregando Open Finance...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pb-24 text-slate-900">
            {/* ═══════════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════════ */}
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 px-6 pt-16 pb-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Landmark className="w-32 h-32" />
                </div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 ${health === 'healthy' ? 'bg-emerald-500/20' :
                                health === 'warning' ? 'bg-amber-500/20' : 'bg-white/10'
                                }`}>
                                {health === 'healthy' ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                                ) : health === 'warning' ? (
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                                ) : (
                                    <Link2 className="w-3.5 h-3.5 text-white/70" />
                                )}
                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                    {health === 'healthy' ? 'Conectado' :
                                        health === 'warning' ? 'Atenção' : 'Nenhuma Conta'}
                                </span>
                            </div>
                            <p className="text-primary-100 text-xs font-semibold uppercase tracking-widest mb-1">
                                Saldo Total Open Finance
                            </p>
                            <h1 className="text-4xl font-bold tracking-tight">
                                {formatCurrency(totalBalance)}
                            </h1>
                        </div>
                        <button
                            onClick={loadData}
                            className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all active:rotate-180 duration-500"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-6">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
                            <p className="text-2xl font-bold">{connectedLinks.length}</p>
                            <p className="text-[10px] text-primary-100 font-bold uppercase">Bancos</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
                            <p className="text-2xl font-bold">{accounts.length}</p>
                            <p className="text-[10px] text-primary-100 font-bold uppercase">Contas</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
                            <p className="text-2xl font-bold">{transactions.length}+</p>
                            <p className="text-[10px] text-primary-100 font-bold uppercase">Transações</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 space-y-6 mt-6">
                {/* Error Banner */}
                {error && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                        <p className="text-sm text-rose-700">{error}</p>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
            CONNECT BUTTON
        ═══════════════════════════════════════════════════════════════ */}
                <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="w-full bg-white border-2 border-dashed border-primary-300 hover:border-primary-500 p-6 rounded-3xl flex items-center justify-center gap-4 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    {connecting ? (
                        <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                    ) : (
                        <Plus className="w-6 h-6 text-primary-500 group-hover:rotate-90 transition-transform" />
                    )}
                    <span className="text-lg font-bold text-primary-600">
                        {connecting ? 'Conectando...' : 'Conectar Conta Bancária'}
                    </span>
                </button>

                {/* ═══════════════════════════════════════════════════════════════
            CONNECTED BANKS
        ═══════════════════════════════════════════════════════════════ */}
                {links.length > 0 && (
                    <section>
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Bancos Conectados</h3>
                        <div className="space-y-3">
                            {links.map(link => (
                                <div
                                    key={link.id}
                                    className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${link.status === 'connected' ? 'bg-emerald-100' :
                                                link.status === 'error' ? 'bg-rose-100' :
                                                    link.status === 'pending' ? 'bg-amber-100' : 'bg-slate-100'
                                                }`}>
                                                <Building2 className={`w-6 h-6 ${link.status === 'connected' ? 'text-emerald-600' :
                                                    link.status === 'error' ? 'text-rose-600' :
                                                        link.status === 'pending' ? 'text-amber-600' : 'text-slate-400'
                                                    }`} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">
                                                    {link.institution_name || 'Banco'}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${link.status === 'connected' ? 'bg-emerald-100 text-emerald-700' :
                                                        link.status === 'error' ? 'bg-rose-100 text-rose-700' :
                                                            link.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                                'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {link.status === 'connected' ? 'Conectado' :
                                                            link.status === 'error' ? 'Erro' :
                                                                link.status === 'pending' ? 'Pendente' :
                                                                    link.status === 'revoked' ? 'Revogado' :
                                                                        link.status === 'expired' ? 'Expirado' : link.status}
                                                    </span>
                                                    {link.last_synced_at && (
                                                        <span className="text-[10px] text-slate-400">
                                                            Sync: {formatDate(link.last_synced_at)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {link.status === 'connected' && (
                                            <button
                                                onClick={() => handleDisconnect(link.id)}
                                                className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                                                title="Desconectar"
                                            >
                                                <Unlink className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>

                                    {link.error_message && (
                                        <p className="mt-2 text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">
                                            {link.error_message}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ═══════════════════════════════════════════════════════════════
            ACCOUNTS
        ═══════════════════════════════════════════════════════════════ */}
                {accounts.length > 0 && (
                    <section>
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Suas Contas</h3>
                        <div className="space-y-3">
                            {accounts.map(account => (
                                <div
                                    key={account.id}
                                    className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                                            {account.type === 'credit' ? (
                                                <CreditCard className="w-5 h-5 text-primary-500" />
                                            ) : (
                                                <Wallet className="w-5 h-5 text-primary-500" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{account.name || 'Conta'}</p>
                                            <p className="text-xs text-slate-400 capitalize">{account.type} • {account.subtype}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${(account.balance_current || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {formatCurrency(account.balance_current)}
                                        </p>
                                        {account.balance_available !== null && account.balance_available !== account.balance_current && (
                                            <p className="text-[10px] text-slate-400">
                                                Disponível: {formatCurrency(account.balance_available)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ═══════════════════════════════════════════════════════════════
            RECENT TRANSACTIONS
        ═══════════════════════════════════════════════════════════════ */}
                {transactions.length > 0 && (
                    <section className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800">Últimas Transações</h3>
                            <span className="text-xs text-slate-400 font-medium">Via Open Finance</span>
                        </div>
                        <div className="space-y-3">
                            {transactions.slice(0, 5).map(tx => (
                                <div
                                    key={tx.id}
                                    className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.amount >= 0 ? 'bg-emerald-50' : 'bg-rose-50'
                                            }`}>
                                            {tx.amount >= 0 ? (
                                                <ArrowUpCircle className="w-5 h-5 text-emerald-500" />
                                            ) : (
                                                <ArrowDownCircle className="w-5 h-5 text-rose-500" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-800 truncate max-w-[180px]">
                                                {tx.merchant_name || tx.description || 'Transação'}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {formatDate(tx.transaction_date)} • {tx.category || 'Sem categoria'}
                                            </p>
                                        </div>
                                    </div>
                                    <p className={`font-bold ${tx.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {formatCurrency(tx.amount)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ═══════════════════════════════════════════════════════════════
            EMPTY STATE
        ═══════════════════════════════════════════════════════════════ */}
                {links.length === 0 && (
                    <section className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-sm">
                        <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-6">
                            <Landmark className="w-10 h-10 text-primary-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Open Finance</h3>
                        <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
                            Conecte suas contas bancárias para visualizar saldos e transações em um só lugar.
                        </p>
                        <button
                            onClick={handleConnect}
                            disabled={connecting}
                            className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50"
                        >
                            {connecting ? 'Conectando...' : 'Conectar Primeira Conta'}
                        </button>
                    </section>
                )}
            </div>
        </div>
    );
};
