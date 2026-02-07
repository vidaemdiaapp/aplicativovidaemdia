import React from 'react';
import { Home, User, Plus, MessageSquare, Zap, Clock, Repeat, X, ChevronRight, Wallet, Calendar } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAddMenuOpen, setIsAddMenuOpen] = React.useState(false);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  if (['/', '/login', '/register', '/recover', '/onboarding'].includes(location.pathname)) {
    return null;
  }

  return (
    <>
      {/* Unified Add Action Menu Overlay */}
      {isAddMenuOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsAddMenuOpen(false)}
          ></div>

          {/* Menu Panel */}
          <div className="relative z-10 bg-card rounded-t-[32px] p-8 shadow-2xl animate-slide-up safe-area-bottom border-t border-border-color">
            {/* Handle Bar */}
            <div className="flex justify-center mb-6">
              <div className="w-12 h-1.5 bg-slate-100 rounded-full"></div>
            </div>

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h4 className="font-bold text-slate-900 text-2xl tracking-tight">Novo Registro</h4>
                <p className="text-sm text-slate-400 mt-1 font-medium">O que você deseja adicionar agora?</p>
              </div>
              <button
                onClick={() => setIsAddMenuOpen(false)}
                className="p-3 bg-surface-soft rounded-full hover:bg-border-color transition-colors active:scale-90"
                aria-label="Leia mais"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="space-y-3">
              <AddMenuItem
                icon={Zap}
                label="Lançar Gasto"
                description="Registro imediato (café, mercado, farmácia)"
                iconBg="bg-emerald-50"
                iconColor="text-emerald-500"
                onClick={() => { navigate('/new-task', { state: { type: 'immediate' } }); setIsAddMenuOpen(false); }}
              />
              <AddMenuItem
                icon={Calendar}
                label="Agendar Conta"
                description="Boletos, serviços ou parcelas futuras"
                iconBg="bg-primary-50"
                iconColor="text-primary-500"
                onClick={() => { navigate('/new-task', { state: { type: 'bill' } }); setIsAddMenuOpen(false); }}
              />
              <AddMenuItem
                icon={Repeat}
                label="Conta Recorrente"
                description="Assinaturas, aluguel ou mensalidades"
                iconBg="bg-indigo-50"
                iconColor="text-indigo-500"
                onClick={() => { navigate('/new-task', { state: { type: 'bill', recurring: true } }); setIsAddMenuOpen(false); }}
              />
              <div className="pt-2">
                <button
                  onClick={() => { navigate('/new-task'); setIsAddMenuOpen(false); }}
                  className="w-full py-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-primary-500 transition-colors"
                >
                  Novo Cadastro Geral
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Tab Bar - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-white/80 backdrop-blur-xl border-t border-slate-100 px-4 pb-safe z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
        <div className="flex justify-around items-center h-20">
          <TabItem
            icon={Home}
            label="Início"
            active={isActive('/home')}
            onClick={() => navigate('/home')}
          />

          <TabItem
            icon={Wallet}
            label="Finanças"
            active={isActive('/financial-dashboard')}
            onClick={() => navigate('/financial-dashboard')}
          />

          {/* Central Unified Button */}
          <div className="relative -top-6">
            <button
              onClick={() => setIsAddMenuOpen(true)}
              className={`btn w-16 h-16 rounded-[24px] flex items-center justify-center shadow-2xl transition-all duration-300 group ${isAddMenuOpen
                ? 'bg-text-primary border-text-secondary rotate-45 scale-90'
                : 'bg-primary border-primary-light hover:shadow-primary/40 hover:-translate-y-1'
                } border-2`}
              aria-label="Adicionar"
            >
              <Plus className={`w-8 h-8 text-white transition-transform ${isAddMenuOpen ? '' : 'group-hover:rotate-90'}`} strokeWidth={2.5} />
            </button>
            {!isAddMenuOpen && (
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Novo
              </span>
            )}
          </div>

          <TabItem
            icon={MessageSquare}
            label="Elara"
            active={isActive('/assistant')}
            onClick={() => navigate('/assistant')}
          />

          <TabItem
            icon={User}
            label="Perfil"
            active={isActive('/settings')}
            onClick={() => navigate('/settings')}
          />
        </div>
      </nav>
    </>
  );
};

interface AddMenuItemProps {
  icon: any;
  label: string;
  description: string;
  iconBg: string;
  iconColor: string;
  onClick: () => void;
}

const AddMenuItem: React.FC<AddMenuItemProps> = ({ icon: Icon, label, description, iconBg, iconColor, onClick }) => (
  <button
    onClick={onClick}
    className="w-full p-5 rounded-3xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 flex items-center gap-5 transition-all active:scale-[0.98] shadow-sm hover:shadow-md group"
  >
    <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
      <Icon className={`w-7 h-7 ${iconColor}`} />
    </div>
    <div className="text-left flex-1 min-w-0">
      <p className="font-bold text-slate-900 text-[17px] tracking-tight">{label}</p>
      <p className="text-xs text-slate-400 mt-0.5 font-medium truncate">{description}</p>
    </div>
    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
  </button>
);

interface TabItemProps {
  icon: any;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const TabItem: React.FC<TabItemProps> = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-1 min-w-[64px] py-2 transition-colors"
  >
    <Icon className={`w-6 h-6 transition-all ${active
      ? 'text-primary-500'
      : 'text-slate-400'
      }`} />
    <span className={`text-[10px] font-semibold transition-colors ${active
      ? 'text-primary-500'
      : 'text-slate-400'
      }`}>
      {label}
    </span>
  </button>
);
