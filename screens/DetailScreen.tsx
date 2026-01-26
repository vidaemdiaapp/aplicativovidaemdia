import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, CheckCircle2, AlertCircle, Loader2, Users } from 'lucide-react';
import { Button } from '../components/Button';
import { ActionCard } from '../components/ActionCard';
import { ConsequenceTrack } from '../components/ConsequenceTrack';
import { tasksService, Task, Category, HouseholdMember, ActionPlan } from '../services/tasks';
import { useAuth } from '../hooks/useAuth';

export const DetailScreen: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadTask();
  }, [id]);

  const loadTask = async () => {
    if (!id) return;
    setLoading(true);

    const [taskData, categoriesData, membersData] = await Promise.all([
      tasksService.getTask(id),
      tasksService.getCategories(),
      tasksService.getAssignableMembers()
    ]);

    setTask(taskData);
    if (taskData) {
      setCategory(categoriesData.find(c => c.id === taskData.category_id) || null);
      setActionPlan(tasksService.getTaskActionPlan(taskData));
    }
    setMembers(membersData);
    setLoading(false);
  };

  const handleComplete = async () => {
    if (!task) return;
    setCompleting(true);
    const updated = await tasksService.completeTask(task.id);
    if (updated) {
      setTask(updated);
    }
    setCompleting(false);
  };

  const handleAssign = async (userId: string) => {
    if (!task) return;
    setAssigning(true);
    const updated = await tasksService.updateTask(task.id, { owner_user_id: userId });
    if (updated) {
      setTask(updated);
    }
    setAssigning(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-16 h-16 text-slate-300 mb-4" />
        <p className="text-slate-500 text-center">Item não encontrado</p>
        <Button onClick={() => navigate(-1)} className="mt-4">Voltar</Button>
      </div>
    );
  }

  const responsibleMember = members.find(m => m.user_id === task.owner_user_id);
  const isMyTurn = task.owner_user_id === user?.id;

  return (
    <div className="bg-white min-h-screen pb-24">
      <div className="h-48 bg-blue-600 relative">
        <div className="absolute top-0 left-0 right-0 p-6 pt-12 flex items-center gap-4 text-white">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full -ml-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold flex-1">Detalhes do Item</h1>
          <button
            onClick={() => navigate(`/edit-task/${id}`)}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold backdrop-blur-md border border-white/10 transition-colors"
          >
            Editar
          </button>
        </div>
      </div>

      <div className="px-6 -mt-10 relative z-10 space-y-4">
        {/* Action Card Implementation */}
        {actionPlan && task.status !== 'completed' && (
          <ActionCard plan={actionPlan} />
        )}

        {/* Consequence Simulator Implementation (Sprint 8) */}
        {actionPlan && task.status !== 'completed' && (
          <ConsequenceTrack stages={actionPlan.timeline} dueDate={task.due_date} />
        )}

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-100">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {category?.label || 'Sem categoria'}
                </span>
                {isMyTurn && task.status !== 'completed' && (
                  <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest animate-pulse">
                    Seu Turno
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mt-3">{task.title}</h2>
            </div>
            <div className={`p-3 rounded-full ${task.status === 'overdue' ? 'bg-rose-100 text-rose-600' :
              task.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
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
                <p className="text-sm font-bold text-slate-900">
                  {task.due_date ? new Date(task.due_date).toLocaleDateString('pt-BR') : 'Sem data definida'}
                </p>
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

            {/* Delegation Section - Only if household exists/members > 1 */}
            {members.length > 0 && (
              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <Users className="w-5 h-5 text-slate-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500">Responsável</p>
                  <select
                    className="bg-transparent font-bold text-slate-900 outline-none w-full -ml-1 py-1"
                    value={task.owner_user_id || user?.id}
                    onChange={(e) => handleAssign(e.target.value)}
                    disabled={assigning || task.status === 'completed'}
                  >
                    {members.map(m => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.user_id === user?.id ? 'Eu (Responsável)' : (m.profile?.full_name || 'Parceiro(a)')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {task.auto_generated && (
            <div className="mt-6 p-4 bg-primary-50 rounded-2xl border border-primary-100 flex gap-3">
              <Loader2 className="w-5 h-5 text-primary-600 shrink-0" />
              <p className="text-xs text-primary-700 leading-tight">
                <strong>Agizado Automático:</strong> Esta tarefa foi criada com base no seu histórico.
                Se isso não fizer sentido, você pode ajustar a qualquer momento.
              </p>
            </div>
          )}

          {task.description && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Descrição</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{task.description}</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 mt-4 space-y-3">
        {task.status !== 'completed' && (
          <Button fullWidth onClick={handleComplete} disabled={completing}>
            {completing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando...
              </span>
            ) : (
              'Marcar como Pago'
            )}
          </Button>
        )}
        {task.status === 'completed' && (
          <div className="bg-emerald-50 p-4 rounded-xl text-center">
            <p className="text-emerald-700 font-medium">✓ Este item foi marcado como pago</p>
          </div>
        )}
        <Button variant="secondary" fullWidth onClick={() => navigate('/upload')}>
          Anexar Documento
        </Button>
      </div>
    </div>
  );
};
