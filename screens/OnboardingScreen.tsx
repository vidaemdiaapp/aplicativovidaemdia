import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Users, CloudUpload, ArrowRight, CheckCircle2, ShieldCheck, Heart } from 'lucide-react';
import { supabase } from '../services/supabase';
import { analytics } from '../services/analytics';
import { IncomeRegistrationModal } from '../components/IncomeRegistrationModal';

export const OnboardingScreen: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [incomeAdded, setIncomeAdded] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const user = session.user;
      await supabase.from('profiles').update({
        onboarding_completed: true,
        onboarding_step: 3
      }).eq('id', user.id);

      await analytics.logEvent('onboarding_completed');
    }
    navigate('/home');
  };

  const renderStep1 = () => (
    <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right duration-500">
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="w-24 h-24 bg-primary-50 rounded-[32px] flex items-center justify-center mb-8 text-primary-600 shadow-inner">
          <Wallet className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4">Primeiro, sua renda 💰</h2>
        <p className="text-slate-500 font-medium leading-relaxed max-w-xs">
          Para calcularmos seu imposto e organizar sua vida, precisamos saber quanto você recebe mensalmente.
        </p>

        {incomeAdded ? (
          <div className="mt-8 flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
            Renda cadastrada!
          </div>
        ) : (
          <button
            onClick={() => setIsIncomeModalOpen(true)}
            className="mt-10 px-8 py-5 bg-primary-600 text-white rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95"
          >
            Cadastrar Renda Agora
          </button>
        )}
      </div>

      <div className="p-8">
        <button
          disabled={!incomeAdded}
          onClick={() => setStep(2)}
          className="w-full py-5 bg-primary-600 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-[24px] font-black text-lg shadow-xl shadow-primary-100 flex items-center justify-center gap-3 transition-all active:scale-95"
        >
          Próximo Passo
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right duration-500">
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="w-24 h-24 bg-rose-50 rounded-[32px] flex items-center justify-center mb-8 text-rose-500 shadow-inner">
          <Heart className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4">Vida a dois? 💍</h2>
        <p className="text-slate-500 font-medium leading-relaxed max-w-xs">
          O Vida em Dia brilha quando o casal se organiza junto. Você quer convidar seu parceiro(a) agora?
        </p>

        <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pode ser feito depois em Ajustes</p>
      </div>

      <div className="p-8 space-y-4">
        <button
          onClick={() => { navigate('/settings'); analytics.logEvent('onboarding_invite_click'); }}
          className="w-full py-5 bg-white border-2 border-slate-100 text-slate-900 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-95"
        >
          <Users className="w-6 h-6 text-rose-500" />
          Convidar Parceiro(a)
        </button>
        <button
          onClick={() => setStep(3)} // Retained original onClick logic
          className="w-full h-16 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-200 transition-all active:scale-95"
        >
          Continuar
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right duration-500">
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="w-24 h-24 bg-emerald-50 rounded-[32px] flex items-center justify-center mb-8 text-emerald-600 shadow-inner">
          <CloudUpload className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4">Tudo pronto! ✨</h2>
        <p className="text-slate-500 font-medium leading-relaxed max-w-xs">
          Agora é só começar a fotografar seus recibos de saúde e educação para abater seu imposto.
        </p>

        <div className="mt-8 bg-slate-50 p-6 rounded-[32px] border border-slate-100 text-left w-full">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-5 h-5 text-primary-600" />
            <span className="text-xs font-black uppercase text-slate-900">Privacidade em 1º lugar</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Seus documentos são criptografados e lidos apenas pela nossa inteligência fiscal para gerar seus relatórios.</p>
        </div>
      </div>

      <div className="p-8">
        <button
          onClick={handleComplete}
          className="w-full py-6 bg-primary-600 text-white rounded-[32px] font-black text-xl shadow-xl shadow-primary-200 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
        >
          Ir para o Dashboard
          <CheckCircle2 className="w-6 h-6" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="p-6 flex justify-between items-center">
        <div className="flex gap-1.5">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-8 bg-primary-600' : 'w-3 bg-slate-100'}`} />
          ))}
        </div>
        {step < 3 && (
          <button onClick={handleComplete} className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 p-2">Pular</button>
        )}
      </header>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}

      <IncomeRegistrationModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        onSuccess={() => {
          setIncomeAdded(true);
          analytics.logEvent('onboarding_income_added');
        }}
      />
    </div>
  );
};
