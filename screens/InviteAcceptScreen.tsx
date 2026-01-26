import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { tasksService } from '../services/tasks';
import { useAuth } from '../hooks/useAuth';

export const InviteAcceptScreen: React.FC = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                // Redirect to login if not authenticated, passing the destination
                navigate(`/login?redirect=/invite/${token}`);
            } else {
                processInvite();
            }
        }
    }, [user, authLoading, token]);

    const processInvite = async () => {
        if (!token) {
            setStatus('error');
            setErrorMessage('Token de convite inválido.');
            return;
        }

        try {
            const { success, error } = await tasksService.acceptInvite(token);
            if (success) {
                setStatus('success');
            } else {
                setStatus('error');
                setErrorMessage(error || 'Falha ao aceitar convite.');
            }
        } catch (err) {
            setStatus('error');
            setErrorMessage('Erro inesperado ao processar o convite.');
        }
    };

    if (authLoading || status === 'verifying') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <h2 className="text-xl font-bold text-slate-900">Verificando convite...</h2>
                <p className="text-slate-500 mt-2">Aguarde um momento.</p>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Bem-vindo(a)!</h1>
                <p className="text-slate-600 mb-8 max-w-xs">
                    Você agora faz parte da casa. Todas as obrigações e contas compartilhadas aparecerão aqui.
                </p>
                <button
                    onClick={() => navigate('/home')}
                    className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-transform"
                >
                    Ir para o Início <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-6">
                <XCircle className="w-8 h-8 text-rose-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Ops! Algo deu errado</h1>
            <p className="text-slate-600 mb-8 max-w-xs">
                {errorMessage || 'Não foi possível aceitar o convite. Ele pode ter expirado ou já ter sido usado.'}
            </p>
            <button
                onClick={() => navigate('/home')}
                className="text-blue-600 font-bold hover:underline"
            >
                Voltar ao início
            </button>
        </div>
    );
};
