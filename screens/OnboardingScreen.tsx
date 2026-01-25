import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Bell, FileText, Shield } from 'lucide-react';

const steps = [
  {
    title: 'Organize sua vida',
    description: 'Mantenha todos os seus documentos importantes em um único lugar seguro e acessível.',
    icon: FileText
  },
  {
    title: 'Nunca perca um prazo',
    description: 'Receba notificações inteligentes antes do vencimento de suas contas e documentos.',
    icon: Bell
  },
  {
    title: 'Segurança total',
    description: 'Seus dados são criptografados e protegidos com os mais altos padrões de segurança.',
    icon: Shield
  }
];

export const OnboardingScreen: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(c => c + 1);
    } else {
      navigate('/home');
    }
  };

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="min-h-screen bg-white flex flex-col p-6">
      <div className="flex justify-end">
        <button onClick={() => navigate('/home')} className="text-slate-400 font-medium p-2">Pular</button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center mb-8 text-blue-600 transition-all duration-300 transform">
          <CurrentIcon className="w-16 h-16" />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-4 transition-all">
          {steps[currentStep].title}
        </h2>
        
        <p className="text-slate-500 leading-relaxed max-w-xs transition-all">
          {steps[currentStep].description}
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex justify-center gap-2">
          {steps.map((_, idx) => (
            <div 
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentStep ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>

        <Button onClick={handleNext} fullWidth>
          {currentStep === steps.length - 1 ? 'Começar' : 'Próximo'}
        </Button>
      </div>
    </div>
  );
};
