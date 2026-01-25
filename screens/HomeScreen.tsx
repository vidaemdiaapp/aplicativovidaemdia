import React, { useState } from 'react';
import { StatusCard } from '../components/StatusCard';
import { StatusLevel, CategoryType } from '../types';
import { MOCK_TASKS } from '../constants';
import { Bell, ChevronRight, Car, Home, FileText, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  // Simulated state for demonstration purposes
  const [statusLevel, setStatusLevel] = useState<StatusLevel>(StatusLevel.WARNING);

  // Helper to toggle state for demo
  const toggleState = () => {
    if (statusLevel === StatusLevel.SAFE) setStatusLevel(StatusLevel.WARNING);
    else if (statusLevel === StatusLevel.WARNING) setStatusLevel(StatusLevel.RISK);
    else setStatusLevel(StatusLevel.SAFE);
  };

  const getPercentage = () => {
    if (statusLevel === StatusLevel.SAFE) return 100;
    if (statusLevel === StatusLevel.WARNING) return 75;
    return 45;
  };

  const urgentTasks = MOCK_TASKS.filter(t => t.status !== 'completed').slice(0, 3);

  return (
    <div className="pb-24">
      {/* Header */}
      <header className="bg-white p-6 pt-12 pb-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div>
          <p className="text-slate-500 text-sm font-medium">Bom dia,</p>
          <h1 className="text-xl font-bold text-slate-900">Lucas Silva</h1>
        </div>
        <button onClick={toggleState} className="relative p-2 rounded-full hover:bg-slate-50">
          <Bell className="w-6 h-6 text-slate-700" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>
      </header>

      <div className="p-6 space-y-8">
        <StatusCard status={statusLevel} percentage={getPercentage()} />

        {/* Priority Items */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-900 text-lg">Atenção Prioritária</h3>
            <button className="text-sm text-blue-600 font-medium">Ver tudo</button>
          </div>
          
          <div className="space-y-3">
            {urgentTasks.map(task => (
              <div 
                key={task.id}
                onClick={() => navigate(`/detail/${task.id}`)}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    task.status === 'overdue' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {task.category === CategoryType.VEHICLE ? <Car className="w-5 h-5" /> : 
                     task.category === CategoryType.HOME ? <Home className="w-5 h-5" /> : 
                     <FileText className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{task.title}</h4>
                    <p className={`text-xs font-medium ${
                      task.status === 'overdue' ? 'text-rose-500' : 'text-slate-500'
                    }`}>
                      {task.status === 'overdue' ? 'Vencido' : `Vence em ${new Date(task.dueDate).toLocaleDateString('pt-BR')}`}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </div>
            ))}
          </div>
        </section>

        {/* Quick Categories */}
        <section>
          <h3 className="font-bold text-slate-900 text-lg mb-4">Categorias</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Car, label: 'Veículos', count: 2, color: 'bg-blue-50 text-blue-600' },
              { icon: Home, label: 'Imóveis', count: 1, color: 'bg-purple-50 text-purple-600' },
              { icon: FileText, label: 'Documentos', count: 4, color: 'bg-emerald-50 text-emerald-600' },
              { icon: Shield, label: 'Seguros', count: 0, color: 'bg-orange-50 text-orange-600' },
            ].map((cat, i) => (
              <button 
                key={i}
                onClick={() => navigate('/categories')}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-left hover:shadow-md transition-shadow"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${cat.color}`}>
                  <cat.icon className="w-5 h-5" />
                </div>
                <p className="font-semibold text-slate-900">{cat.label}</p>
                <p className="text-xs text-slate-500 mt-1">{cat.count} itens</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};