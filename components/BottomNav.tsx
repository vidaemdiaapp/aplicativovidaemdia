import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Grid, PlusCircle, MessageSquare, Settings } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ path, icon: Icon, label }: { path: string; icon: any; label: string }) => (
    <button
      onClick={() => navigate(path)}
      className={`flex flex-col items-center justify-center gap-1 w-full h-full ${isActive(path) ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'
        }`}
    >
      <Icon className={`w-6 h-6 ${isActive(path) ? 'fill-current' : ''}`} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  if (['/', '/login', '/register', '/recover', '/onboarding'].includes(location.pathname)) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-slate-100 pb-safe pt-2 px-6 h-[80px] z-50">
      <div className="flex justify-between items-center h-full pb-2">
        <NavItem path="/home" icon={Home} label="Início" />
        <NavItem path="/categories" icon={Grid} label="Categorias" />

        <div className="relative -top-5">
          <button
            onClick={() => navigate('/upload')}
            className="bg-primary-600 text-white rounded-full p-4 shadow-lg shadow-primary-200 hover:bg-primary-700 transition-colors active:scale-95"
          >
            <PlusCircle className="w-7 h-7" />
          </button>
        </div>

        <NavItem path="/assistant" icon={MessageSquare} label="Assistente" />
        <NavItem path="/settings" icon={Settings} label="Ajustes" />
      </div>
    </div>
  );
};
