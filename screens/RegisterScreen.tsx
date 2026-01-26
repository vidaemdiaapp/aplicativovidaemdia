import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/Button';
import { Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const RegisterScreen: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { signUp } = useAuth();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error: authError } = await signUp(email, password, name);

        if (authError) {
            setError(authError.message);
            setLoading(false);
        } else {
            alert('Cadastro realizado com sucesso! Faça login.');
            navigate('/login' + location.search);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col justify-center items-center">
            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center mb-10">
                    <img src="/assets/logo.png" alt="Vida em Dia" className="w-48 h-auto mb-6" />
                    <p className="text-slate-500 text-center text-sm font-medium">Comece a organizar sua vida agora mesmo.</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    {error && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 rounded-xl">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Nome Completo</label>
                        <div className="relative">
                            <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Seu nome"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                            <input
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                required
                            />
                        </div>
                    </div>

                    <Button type="submit" fullWidth disabled={loading}>
                        {loading ? 'Criando conta...' : 'Cadastrar'}
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-slate-600">
                        Já tem uma conta?{' '}
                        <button onClick={() => navigate('/login' + location.search)} className="text-blue-600 font-bold hover:underline">
                            Entrar
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};
