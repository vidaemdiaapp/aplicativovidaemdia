import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Car, Filter, Search } from 'lucide-react';
import { MOCK_TASKS } from '../constants';
import { CategoryType } from '../types';

export const CategoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const vehicleTasks = MOCK_TASKS.filter(t => t.category === CategoryType.VEHICLE);

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      <header className="bg-white p-6 pt-12 pb-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full -ml-2">
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Veículos</h1>
        </div>
        
        <div className="mt-4 flex gap-3">
          <div className="flex-1 bg-slate-100 rounded-xl flex items-center px-4 py-2.5">
            <Search className="w-5 h-5 text-slate-400 mr-2" />
            <input 
              type="text" 
              placeholder="Buscar item..." 
              className="bg-transparent w-full outline-none text-sm text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <button className="bg-slate-100 p-2.5 rounded-xl text-slate-700 hover:bg-slate-200">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {vehicleTasks.map(task => (
          <div 
            key={task.id}
            onClick={() => navigate(`/detail/${task.id}`)}
            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 active:scale-[0.99] transition-transform cursor-pointer"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{task.title}</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">Ford Ka • 2020</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                task.status === 'overdue' ? 'bg-rose-100 text-rose-700' : 
                task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {task.status === 'overdue' ? 'Vencido' : task.status === 'completed' ? 'Pago' : 'Pendente'}
              </span>
            </div>
            
            <div className="flex justify-between items-end border-t border-slate-50 pt-3 mt-1">
              <div>
                <p className="text-xs text-slate-400 mb-1">Vencimento</p>
                <p className="text-sm font-medium text-slate-700">{new Date(task.dueDate).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 mb-1">Valor</p>
                <p className="text-lg font-bold text-slate-900">{task.amount}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
