import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Heart, Share2, Copy, UserPlus, CheckCircle2 } from 'lucide-react';
import { coupleService } from '../services/couple';
import { useCoupleMode } from '../hooks/useCoupleMode';

export const CoupleConnectScreen: React.FC = () => {
    const navigate = useNavigate();
    const { isCouple, refresh } = useCoupleMode();
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [inputCode, setInputCode] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadInviteCode();
    }, []);

    const loadInviteCode = async () => {
        try {
            const code = await coupleService.generateInviteCode();
            setInviteCode(code);
        } catch (error) {
            console.error('Falha ao gerar código', error);
        }
    };

    const handleCopyCode = () => {
        if (inviteCode) {
            navigator.clipboard.writeText(inviteCode);
            toast.success('Código copiado!');
        }
    };

    const handleConnect = async () => {
        if (!inputCode) return;
        setLoading(true);
        try {
            const success = await coupleService.joinHousehold(inputCode);
            if (success) {
                toast.success('Conectado com sucesso! ❤️');
                await refresh();
                navigate('/financial-dashboard');
            } else {
                toast.error('Código inválido ou expirado.');
            }
        } catch (error) {
            toast.error('Erro ao conectar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface pb-10">
            <header className="bg-white pt-14 pb-6 px-6 shadow-sm border-b border-slate-100 flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold text-slate-800">Vida a Dois</h1>
            </header>

            <div className="p-6 max-w-md mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">

                {/* Intro Card */}
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                        <Heart className="w-10 h-10 text-rose-500 fill-rose-500 animate-pulse" />
                        <div className="absolute -right-2 -bottom-2 w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-rose-50 shadow-sm">
                            <UserPlus className="w-4 h-4 text-slate-400" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">Conecte-se com seu Amor</h2>
                    <p className="text-slate-500 leading-relaxed font-medium">
                        Junte suas finanças, defina metas compartilhadas e construa um futuro próspero juntos.
                    </p>
                </div>

                {isCouple ? (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 text-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-bold text-emerald-800 mb-2">Vocês estão conectados!</h3>
                        <p className="text-emerald-600 text-sm mb-6">Agora vocês podem visualizar o painel compartilhado na dashboard.</p>
                        <button
                            onClick={() => navigate('/financial-dashboard')}
                            className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-transform"
                        >
                            Ir para Dashboard
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Option 1: Share Code */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Share2 className="w-4 h-4 text-primary-500" />
                                Seu Código de Convite
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 bg-slate-50 border-2 border-slate-100 border-dashed rounded-xl p-4 text-center">
                                    <span className="text-xl font-mono font-black text-slate-700 tracking-widest">
                                        {inviteCode || 'GERANDO...'}
                                    </span>
                                </div>
                                <button
                                    onClick={handleCopyCode}
                                    className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 hover:bg-primary-100 transition-colors active:scale-95"
                                >
                                    <Copy className="w-6 h-6" />
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 mt-4 text-center">Compartilhe este código com seu parceiro(a).</p>
                        </div>

                        <div className="relative flex items-center py-4">
                            <div className="flex-grow border-t border-slate-200"></div>
                            <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase">Ou</span>
                            <div className="flex-grow border-t border-slate-200"></div>
                        </div>

                        {/* Option 2: Enter Code */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <UserPlus className="w-4 h-4 text-slate-400" />
                                Já tenho um código
                            </h3>
                            <input
                                type="text"
                                placeholder="Cole o código aqui (ex: LOVE-XYZ)"
                                value={inputCode}
                                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center font-mono text-lg font-bold mb-4 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none uppercase placeholder:text-slate-300"
                            />
                            <button
                                onClick={handleConnect}
                                disabled={!inputCode || loading}
                                className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 ${!inputCode ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30'
                                    }`}
                            >
                                {loading ? 'Conectando...' : 'Conectar Agora'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
