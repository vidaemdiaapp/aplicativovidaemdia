import React from 'react';
import { Home, List, User, PlusCircle, MessageSquare, Wallet } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  // Custom tab definition for clarity
  const tabs = [
    { path: '/home', icon: Home, label: 'Início' },
    { path: '/financial-dashboard', icon: Wallet, label: 'Finanças' },

    { path: '/assistant', icon: MessageSquare, label: 'Chat' },
    { path: '/settings', icon: User, label: 'Perfil' },
  ];

  if (['/', '/login', '/register', '/recover', '/onboarding'].includes(location.pathname)) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white/80 backdrop-blur-xl border-t border-slate-100 pb-safe pt-2 px-4 h-[85px] z-50">
      <div className="flex justify-between items-center h-full pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all active:scale-90 ${active ? 'text-primary-600' : 'text-slate-400'}`}
            >
              <div className={`p-1.5 rounded-xl transition-colors ${active ? 'bg-primary-50' : ''}`}>
                <Icon className={`w-6 h-6 ${active ? 'fill-primary-600/10' : ''}`} />
              </div>
              <span className={`text-[10px] font-black tracking-tight ${active ? 'opacity-100' : 'opacity-60'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
