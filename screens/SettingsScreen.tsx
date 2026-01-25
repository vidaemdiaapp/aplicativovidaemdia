import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Bell, Shield, LogOut, ChevronRight, Moon } from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();

  const SettingItem = ({ icon: Icon, label, onClick, color = 'text-slate-700' }: any) => (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl border-b border-slate-100 last:border-0"
    >
      <div className="flex items-center gap-4">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className={`font-medium ${color === 'text-rose-600' ? 'text-rose-600' : 'text-slate-700'}`}>{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-300" />
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white p-6 pt-12 pb-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full -ml-2">
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Configurações</h1>
        </div>
      </header>

      <div className="p-6 space-y-6">
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-2">Conta</h3>
          <div className="rounded-2xl shadow-sm border border-slate-100">
            <SettingItem icon={User} label="Perfil e Dados Pessoais" />
            <SettingItem icon={Bell} label="Notificações" />
            <SettingItem icon={Shield} label="Segurança e Privacidade" />
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-2">App</h3>
          <div className="rounded-2xl shadow-sm border border-slate-100">
            <SettingItem icon={Moon} label="Aparência" />
            <SettingItem 
              icon={LogOut} 
              label="Sair da conta" 
              color="text-rose-600"
              onClick={() => navigate('/login')} 
            />
          </div>
        </section>

        <div className="text-center pt-8">
          <p className="text-xs text-slate-400">Vida em Dia v1.0.0 (MVP)</p>
        </div>
      </div>
    </div>
  );
};
