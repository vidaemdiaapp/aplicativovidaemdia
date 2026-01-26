import React, { useState, useEffect } from 'react';
import { StatusCard } from '../components/StatusCard';
import { StatusLevel } from '../types';
import { Bell, ChevronRight, Car, Home, FileText, Shield, Receipt, Plus, DollarSign, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { tasksService, Task, Category, Household, HouseholdMember } from '../services/tasks';
import { CouplePanel } from '../components/CouplePanel';
import { ResponsibilityBadge } from '../components/ResponsibilityBadge';
import { FinancialSummaryCard } from '../components/FinancialSummaryCard';

type ResponsibilityFilter = 'me' | 'partner' | 'unassigned' | 'joint';

// Icon mapping for categories
const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  'Car': Car,
  'Home': Home,
  'FileText': FileText,
  'Shield': Shield,
  'Receipt': Receipt
};

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({});
  const [household, setHousehold] = useState<Household | null>(null);
  const [responsibilityFilter, setResponsibilityFilter] = useState<ResponsibilityFilter>('me');
  const [statusData, setStatusData] = useState<{
    household_status: 'ok' | 'attention' | 'risk';
    counts: { ok: number; attention: number; risk: number };
    top_priorities: Task[];
  } | null>(null);
  const [forecast, setForecast] = useState<{ pending_total: number; items: Task[]; month_name: string } | null>(null);
  const [financialReport, setFinancialReport] = useState<{
    total_income: number;
    total_commitments: number;
    balance: number;
    status: 'surplus' | 'warning' | 'deficit';
  } | null>(null);
  const [activities, setActivities] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load essential data first
      const householdData = await tasksService.getHousehold();
      setHousehold(householdData);

      // Load other data in parallel, but handle each one individually to avoid blocking
      const [
        tasksData,
        categoriesData,
        statsData,
        statusResult,
        forecastResult,
        activityData,
        finReport
      ] = await Promise.all([
        tasksService.getUserTasks().catch(e => { console.error('Tasks fail:', e); return []; }),
        tasksService.getCategories().catch(e => { console.error('Categories fail:', e); return []; }),
        tasksService.getCategoryStats().catch(e => { console.error('Stats fail:', e); return {}; }),
        tasksService.computeHouseholdStatus().catch(e => { console.error('Status fail:', e); return null; }),
        tasksService.getMonthlyForecast().catch(e => { console.error('Forecast fail:', e); return null; }),
        tasksService.getRecentActivity().catch(e => { console.error('Activity fail:', e); return []; }),
        tasksService.computeFinancialStatus().catch(e => { console.error('FinReport fail:', e); return null; })
      ]);

      setTasks(tasksData);
      setCategories(categoriesData);
      setCategoryStats(statsData);
      setStatusData(statusResult);
      setForecast(forecastResult);
      setActivities(activityData);
      setFinancialReport(finReport);
    } catch (error) {
      console.error('[HomeScreen] Fatal loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  // derived from Status Engine
  const currentStatus = statusData?.household_status === 'risk' ? StatusLevel.RISK :
    statusData?.household_status === 'attention' ? StatusLevel.WARNING :
      StatusLevel.SAFE;

  const partner = household?.members?.find(m => m.user_id !== user?.id);
  const partnerName = partner?.profile?.full_name || 'Parceiro(a)';

  // Filter all household tasks based on responsibility and pending status (Sprint 9)
  const urgentTasks = tasks.filter(task => {
    // Only show open tasks in this dashboard section
    if (task.status === 'completed') return false;

    if (responsibilityFilter === 'me') return task.owner_user_id === user?.id;
    if (responsibilityFilter === 'partner') return task.owner_user_id === partner?.user_id;
    if (responsibilityFilter === 'unassigned') return !task.owner_user_id;
    return true;
  });

  const getPercentage = (): number => {
    if (!statusData) return 100;
    const total = (statusData.counts.ok + statusData.counts.attention + statusData.counts.risk);
    if (total === 0) return 100;
    return Math.round((statusData.counts.ok / total) * 100);
  };

  // Get user display name from profile
  const userName = user?.user_metadata?.full_name || 'Usuário';
  const greeting = new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="pb-8 lg:pb-0">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md p-6 pt-12 pb-4 flex justify-between items-center sticky top-0 z-10 shadow-sm lg:rounded-b-2xl">
        <div>
          <p className="text-slate-500 text-sm font-medium">{greeting},</p>
          <h1 className="text-xl font-bold text-slate-900">{userName}</h1>
        </div>
        <button onClick={() => navigate('/notifications')} className="relative p-2 rounded-full hover:bg-slate-50">
          <Bell className="w-6 h-6 text-slate-700" />
          {urgentTasks.length > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
          )}
        </button>
      </header>

      <div className="p-6 space-y-8">
        <StatusCard status={currentStatus} percentage={getPercentage()} />

        {/* Financial Summary Card (Sprint 10) */}
        <FinancialSummaryCard
          report={financialReport}
          onClick={() => navigate('/finance')}
        />

        {/* Couple Dashboard Engine (Sprint 9) */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              Vida a Dois
              <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></div>
            </h3>
          </div>
          <CouplePanel
            activeFilter={responsibilityFilter}
            onFilterChange={setResponsibilityFilter}
            partnerName={partnerName}
          />

          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-900 text-sm opacity-60 uppercase tracking-widest">
              {responsibilityFilter === 'me' ? 'Minhas Pendências' :
                responsibilityFilter === 'partner' ? `Com ${partnerName.split(' ')[0]}` :
                  responsibilityFilter === 'joint' ? 'Nossas Pendências' :
                    'Itens Pendentes'}
            </h3>
            <button onClick={() => navigate('/categories')} className="text-xs text-primary-600 font-bold hover:underline py-1">Ver tudo</button>
          </div>

          {urgentTasks.length === 0 ? (
            <div className="bg-slate-50 p-8 rounded-3xl text-center border border-dashed border-slate-200">
              <p className="text-slate-400 text-sm font-medium">🎉 Nada pendente nesta categoria!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3">
              {urgentTasks.map(task => {
                const category = categories.find(c => c.id === task.category_id);
                const IconComponent = ICON_MAP[category?.icon || 'FileText'] || FileText;
                const owner = household?.members?.find(m => m.user_id === task.owner_user_id);

                return (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/detail/${task.id}`)}
                    className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 active:scale-[0.98] transition-all cursor-pointer hover:border-primary-100 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${task.health_status === 'risk' ? 'bg-danger-50 text-danger-600' : 'bg-warning-50 text-warning-600'}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">{task.title}</h4>
                          <p className={`text-xs font-semibold mt-0.5 ${task.health_status === 'risk' ? 'text-danger-500' : 'text-slate-400'}`}>
                            {task.health_status === 'risk'
                              ? '⚠️ Risco Imediato'
                              : task.due_date
                                ? `Vence ${new Date(task.due_date).toLocaleDateString('pt-BR')}`
                                : 'Sem data'}
                          </p>
                        </div>
                      </div>
                      <ResponsibilityBadge
                        isCurrentUser={task.owner_user_id === user?.id}
                        ownerName={owner?.profile?.full_name}
                        isUnassigned={!task.owner_user_id}
                        isJoint={task.is_joint}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Quick Categories */}
        <section>
          <h3 className="font-bold text-slate-900 text-lg mb-4">Categorias</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.slice(0, 4).map((cat) => {
              const IconComponent = ICON_MAP[cat.icon] || FileText;
              const count = categoryStats[cat.id] || 0;

              return (
                <button
                  key={cat.id}
                  onClick={() => navigate('/categories')}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-left hover:shadow-md transition-shadow hover:border-primary-100"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${cat.color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-slate-900">{cat.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{count} itens</p>
                </button>
              );
            })}
          </div>
        </section>
        {/* Activity Timeline (Sprint 9) */}
        {activities.length > 0 && (
          <section className="pb-12">
            <h3 className="font-bold text-slate-900 text-lg mb-4">Atividade do Casal</h3>
            <div className="space-y-4 border-l-2 border-slate-100 ml-4 pl-6 relative">
              {activities.map((act, idx) => {
                const resolver = household?.members?.find(m => m.user_id === act.user_id);
                return (
                  <div key={act.id} className="relative">
                    <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-success-500 border-2 border-white"></div>
                    <p className="text-xs font-bold text-slate-900">{act.title} resolvido!</p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Concluído por {resolver?.user_id === user?.id ? 'você' : (resolver?.profile?.full_name?.split(' ')[0] || 'Parceiro')}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <button
          onClick={() => navigate('/new-task')}
          className="fixed bottom-24 right-6 lg:hidden bg-primary-600 text-white p-4 rounded-full shadow-lg shadow-primary-200 active:scale-95 transition-transform hover:bg-primary-700 z-50"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};