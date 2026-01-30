import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/Button';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await signIn(email, password);

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      const searchParams = new URLSearchParams(location.search);
      const redirect = searchParams.get('redirect');
      navigate(redirect || '/home');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo & Welcome */}
        <div className="flex flex-col items-center mb-10">
          <img
            src="/assets/logo.png"
            alt="Vida em Dia"
            className="w-20 h-20 rounded-3xl shadow-lg shadow-primary-500/10 mb-6"
          />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Bem-vindo de volta</h1>
          <p className="text-slate-500 text-center text-sm">
            Acesse sua conta para organizar sua vida
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm p-4 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-rose-500 text-lg">!</span>
              </div>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors"
            >
              Esqueceu a senha?
            </button>
          </div>

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Entrando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Entrar
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </form>

        {/* Register Link */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            Não tem uma conta?{' '}
            <button
              onClick={() => navigate('/register' + location.search)}
              className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
            >
              Criar conta grátis
            </button>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-slate-400">
            Ao entrar, você concorda com nossos{' '}
            <a href="#" className="text-primary-500 hover:underline">Termos</a>
            {' '}e{' '}
            <a href="#" className="text-primary-500 hover:underline">Privacidade</a>
          </p>
        </div>
      </div>
    </div>
  );
};
