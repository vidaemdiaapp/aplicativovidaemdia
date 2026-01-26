import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Bell, Shield, LogOut, ChevronRight, Moon, Heart, Users, Plus, Loader2, Calculator } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { tasksService, Household } from '../services/tasks';
import { taxService } from '../services/tax';
import { Profile } from '../types';

export const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [household, setHousehold] = useState<Household | null>(null);
  const [estimateIR, setEstimateIR] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    const [hhData, irPreference] = await Promise.all([
      tasksService.getHousehold(),
      taxService.getUserTaxPreference()
    ]);
    setHousehold(hhData);
    setEstimateIR(irPreference);
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviteLoading(true);
    const { success, token, error } = await tasksService.inviteMember(inviteEmail);
    setInviteLoading(false);

    if (success && token) {
      const link = `${window.location.origin}/#/invite/${token}`;
      window.prompt('Convite criado! Simule o envio copiando o link abaixo:', link);
      setInviteEmail('');
      setShowInviteInput(false);
    } else {
      alert('Erro ao enviar convite: ' + (error || 'Desconhecido'));
    }
  };

  const handleToggleIR = async () => {
    const newValue = !estimateIR;
    setEstimateIR(newValue);
    const success = await taxService.updateTaxPreference(newValue);
    if (!success) {
      setEstimateIR(!newValue);
      alert('Erro ao atualizar preferência de Imposto de Renda.');
    }
  };

  const SettingItem = ({ icon: Icon, label, onClick, color = 'text-slate-700', subLabel }: any) => (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl border-b border-slate-100 last:border-0"
    >
      <div className="flex items-center gap-4">
        <Icon className={`w-5 h-5 ${color}`} />
        <div className="text-left">
          <span className={`font-medium block ${color === 'text-rose-600' ? 'text-rose-600' : 'text-slate-700'}`}>{label}</span>
          {subLabel && <span className="text-xs text-slate-400">{subLabel}</span>}
        </div>
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
        {/* User info */}
        {user && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
              {(user.user_metadata?.full_name || user.email)?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-bold text-slate-900">{user.user_metadata?.full_name || 'Usuário'}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
        )}

        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-2 flex items-center gap-2">
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> Vida a Dois
          </h3>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {loading ? (
              <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
            ) : household ? (
              <>
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <h4 className="font-semibold text-slate-700">{household.name}</h4>
                </div>

                {/* Members List */}
                <div className="divide-y divide-slate-50">
                  {household.members?.map((member) => (
                    <div key={member.user_id} className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                        {member.role === 'owner' ? '👑' : '❤️'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{member.user_id === user?.id ? 'Você' : 'Parceiro(a)'}</p>
                        <span className="text-xs text-slate-400 capitalize">{member.role === 'owner' ? 'Administrador' : 'Membro'}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Invite Action */}
                <div className="p-4 border-t border-slate-100">
                  {!showInviteInput ? (
                    <button
                      onClick={() => setShowInviteInput(true)}
                      className="w-full py-2 flex items-center justify-center gap-2 text-blue-600 font-medium hover:bg-blue-50 rounded-xl transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Convidar Parceiro(a)
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="Email do parceiro"
                        className="flex-1 bg-slate-50 border-slate-200 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                      />
                      <button
                        onClick={handleInvite}
                        disabled={inviteLoading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                      >
                        {inviteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-500">
                Criando sua casa...
              </div>
            )}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-2">Conta</h3>
          <div className="rounded-2xl shadow-sm border border-slate-100">
            <SettingItem icon={User} label="Perfil e Dados Pessoais" />
            <SettingItem icon={Bell} label="Notificações" />
            <SettingItem icon={Shield} label="Segurança e Privacidade" />
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-2">Preferências</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Calculator className="w-5 h-5 text-primary-600" />
                <div className="text-left">
                  <span className="font-medium block text-slate-700">Estimar Imposto de Renda</span>
                  <span className="text-xs text-slate-400">Ver projeção anual no Dashboard Financeiro</span>
                </div>
              </div>
              <button
                onClick={handleToggleIR}
                className={`w-12 h-6 rounded-full transition-colors relative ${estimateIR ? 'bg-primary-600' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${estimateIR ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>
          </div>
        </section>

        <section>
          <div className="rounded-2xl shadow-sm border border-slate-100">
            <SettingItem icon={Moon} label="Aparência" />
            <SettingItem
              icon={LogOut}
              label="Sair da conta"
              color="text-rose-600"
              onClick={handleLogout}
            />
          </div>
        </section>

        <div className="text-center pt-8">
          <p className="text-xs text-slate-400">Vida em Dia v1.2.0 (Household)</p>
        </div>
      </div>
    </div>
  );
};
