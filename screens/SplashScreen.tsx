import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      if (user) {
        navigate('/home');
      } else {
        navigate('/login');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate, user, loading]);

  return (
    <div className="min-h-screen bg-blue-600 flex flex-col items-center justify-center text-white p-8">
      <div className="animate-bounce">
        <ShieldCheck className="w-24 h-24 mb-6" />
      </div>
      <h1 className="text-4xl font-bold mb-2 tracking-tight">Vida em Dia</h1>
      <p className="text-blue-100 text-center text-lg">Sua vida burocrática sob controle.</p>

      <div className="absolute bottom-10 flex gap-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-75"></div>
        <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-150"></div>
      </div>
    </div>
  );
};
