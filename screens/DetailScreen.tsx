import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { MOCK_TASKS } from '../constants';
import { Button } from '../components/Button';

export const DetailScreen: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const task = MOCK_TASKS.find(t => t.id === id);

  if (!task) return <div>Item não encontrado</div>;

  return (
    <div className="bg-white min-h-screen pb-24">
      <div className="h-48 bg-blue-600 relative">
        <div className="absolute top-0 left-0 right-0 p-6 pt-12 flex items-center gap-4 text-white">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full -ml-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold">Detalhes do Item</h1>
        </div>
      </div>

      <div className="px-6 -mt-10 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-100">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {task.category}
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-3">{task.title}</h2>
            </div>
            <div className={`p-3 rounded-full ${
              task.status === 'overdue' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
            }`}>
              {task.status === 'overdue' ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
              <div className="bg-white p-2 rounded-lg shadow-sm">
                <Calendar className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Data de Vencimento</p>
                <p className="text-sm font-bold text-slate-900">{new Date(task.dueDate).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
              <div className="bg-white p-2 rounded-lg shadow-sm">
                <FileText className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Valor Total</p>
                <p className="text-sm font-bold text-slate-900">{task.amount || 'N/A'}</p>
              </div>
            </div>
          </div>

          {task.description && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Descrição</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{task.description}</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 mt-4 space-y-3">
        <Button fullWidth onClick={() => alert('Função de pagamento simulada')}>
          Realizar Pagamento
        </Button>
        <Button variant="secondary" fullWidth onClick={() => alert('Arquivo baixado')}>
          Baixar Boleto/Documento
        </Button>
      </div>
    </div>
  );
};
