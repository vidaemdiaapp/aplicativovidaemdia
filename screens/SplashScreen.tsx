import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <div className="animate-in fade-in zoom-in duration-700">
        <img src="/assets/logo.png" alt="Vida em Dia" className="w-64 h-auto mb-8" />
      </div>

      <div className="absolute bottom-10 flex gap-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-75"></div>
        <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-150"></div>
      </div>
    </div>
  );
};
