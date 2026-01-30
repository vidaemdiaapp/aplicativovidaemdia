import React, { useState, useEffect } from 'react';
import { StatusCard } from '../components/StatusCard';
import { StatusLevel } from '../types';
import {
  Bell, ChevronRight, Car, Home, FileText, Shield, Receipt, Plus,
  DollarSign, CheckCircle2, UploadCloud, Zap, ShoppingBag,
  Utensils, Heart, Plane, Landmark, MoreHorizontal, Calendar, ShieldCheck,
  CreditCard, PiggyBank, TrendingUp
} from 'lucide-react';
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
  'Receipt': Receipt,
  'Landmark': Landmark,
  'Zap': Zap,
  'ShoppingBag': ShoppingBag,
  'Utensils': Utensils,
  'Heart': Heart,
  'Plane': Plane,
  'MoreHorizontal': MoreHorizontal
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
      // getHousehold already has a cache mechanism now to prevent infinite loop/redundancy
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
      // Small timeout to ensure state transitions are smooth and don't flicker
      setTimeout(() => setLoading(false), 100);
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-4">
        <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm font-medium animate-pulse">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-24 lg:pb-8">
      {/* ═══════════════════════════════════════════════════════════════
          HEADER — Greeting & Quick Actions
      ═══════════════════════════════════════════════════════════════ */}
      <header className="bg-white px-6 pt-14 pb-6 shadow-sm sticky top-0 z-20 lg:rounded-b-3xl">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            {/* Mobile Logo */}
            <img
              src="/assets/logo.png"
              className="w-12 h-12 lg:hidden object-contain rounded-2xl shadow-sm"
              alt="Vida em Dia"
            />
            <div>
              <p className="text-slate-400 text-sm font-medium">{greeting},</p>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{userName}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Upload Button */}
            <button
              onClick={() => navigate('/upload')}
              className="lg:hidden p-3 rounded-2xl text-slate-500 hover:text-primary-600 hover:bg-primary-50 border border-slate-100 shadow-sm active:scale-95 transition-all"
              aria-label="Upload documento"
            >
              <UploadCloud className="w-5 h-5" />
            </button>

            <button
              onClick={() => navigate('/notifications')}
              className="relative p-3 rounded-2xl hover:bg-slate-50 transition-colors"
              aria-label="Notificações"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {urgentTasks.length > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-danger-500 rounded-full border-2 border-white animate-pulse"></span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 space-y-8">
        {/* ═══════════════════════════════════════════════════════════════
            STATUS CARD — Most Important Visual Element
        ═══════════════════════════════════════════════════════════════ */}
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <StatusCard status={currentStatus} percentage={getPercentage()} />
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            FINANCIAL SUMMARY — Secondary Hero Card
        ═══════════════════════════════════════════════════════════════ */}
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
          <FinancialSummaryCard
            report={financialReport}
            onClick={() => navigate('/financial-dashboard')}
          />
        </section>

        <section className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-125">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-slate-800 text-lg">Seu Patrimônio</h2>
          </div>
          <div className="bg-white rounded-3xl py-6 shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex gap-4 px-6 overflow-x-auto no-scrollbar min-w-max pb-2">
              <QuickAccessButton
                icon={Car}
                label="Veículos"
                color="bg-primary-50 text-primary-600"
                onClick={() => navigate('/vehicle-central')}
              />
              <QuickAccessButton
                icon={ShieldCheck}
                label="IR"
                color="bg-emerald-50 text-emerald-600"
                onClick={() => navigate('/tax-declaration')}
              />
              <QuickAccessButton
                icon={Calendar}
                label="Agenda"
                color="bg-amber-50 text-amber-600"
                onClick={() => navigate('/agenda')}
              />
              <QuickAccessButton
                icon={FileText}
                label="Contrato"
                color="bg-indigo-50 text-indigo-600"
                onClick={() => navigate('/fiscal-folder')}
              />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            COUPLE DASHBOARD — "Vida a Dois" Section
        ═══════════════════════════════════════════════════════════════ */}
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              Vida a Dois
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
            </h2>
          </div>

          <CouplePanel
            activeFilter={responsibilityFilter}
            onFilterChange={setResponsibilityFilter}
            partnerName={partnerName}
          />

          {/* Pending Items Header */}
          <div className="flex justify-between items-center mt-6 mb-4">
            <h3 className="font-semibold text-slate-500 text-xs uppercase tracking-wider">
              {responsibilityFilter === 'me' ? 'Minhas Pendências' :
                responsibilityFilter === 'partner' ? `Com ${partnerName.split(' ')[0]}` :
                  responsibilityFilter === 'joint' ? 'Nossas Pendências' :
                    'Itens Pendentes'}
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {urgentTasks.length} {urgentTasks.length === 1 ? 'item' : 'itens'}
            </span>
          </div>

          {/* Task List */}
          {urgentTasks.length === 0 ? (
            <div className="bg-white/60 backdrop-blur-sm p-10 rounded-3xl text-center border border-dashed border-slate-200">
              <div className="w-12 h-12 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 text-success-500" />
              </div>
              <p className="text-slate-500 text-sm font-medium">Nada pendente nesta categoria!</p>
              <p className="text-slate-400 text-xs mt-1">Você está em dia 🎉</p>
            </div>
          ) : (
            <div className="space-y-3">
              {urgentTasks.map(task => {
                const category = categories.find(c => c.id === task.category_id);
                const IconComponent = ICON_MAP[category?.icon || 'FileText'] || FileText;
                const owner = household?.members?.find(m => m.user_id === task.owner_user_id);

                return (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/detail/${task.id}`)}
                    className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 active:scale-[0.98] transition-all cursor-pointer hover:border-primary-200 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`p-3 rounded-xl shrink-0 transition-colors ${task.health_status === 'risk'
                          ? 'bg-danger-50 text-danger-500 group-hover:bg-danger-100'
                          : 'bg-warning-50 text-warning-500 group-hover:bg-warning-100'
                          }`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-slate-800 text-[15px] truncate group-hover:text-primary-600 transition-colors">
                            {task.title}
                          </h4>
                          <p className={`text-xs font-medium mt-0.5 ${task.health_status === 'risk' ? 'text-danger-500' : 'text-slate-400'
                            }`}>
                            {task.health_status === 'risk'
                              ? '⚠️ Risco Imediato'
                              : task.due_date
                                ? `Vence ${new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
                                : 'Sem data'}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <ResponsibilityBadge
                          isCurrentUser={task.owner_user_id === user?.id}
                          ownerName={owner?.profile?.full_name}
                          isUnassigned={!task.owner_user_id}
                          isJoint={task.is_joint}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            ACTIVITY TIMELINE — Recent Actions
        ═══════════════════════════════════════════════════════════════ */}
        {activities.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
            <h2 className="font-bold text-slate-800 text-lg mb-5">Atividade do Casal</h2>
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="space-y-4 border-l-2 border-slate-100 pl-5 relative">
                {activities.map((act, idx) => {
                  const resolver = household?.members?.find(m => m.user_id === act.user_id);
                  return (
                    <div key={act.id} className="relative">
                      <div className="absolute -left-[27px] top-0.5 w-3 h-3 rounded-full bg-success-500 border-2 border-white shadow-sm"></div>
                      <p className="text-sm font-semibold text-slate-700">{act.title}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        Concluído por {resolver?.user_id === user?.id ? 'você' : (resolver?.profile?.full_name?.split(' ')[0] || 'Parceiro')}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </div>


    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   HELPER COMPONENTS
═══════════════════════════════════════════════════════════════ */

const QuickAccessButton: React.FC<{
  icon: any;
  label: string;
  color: string;
  onClick: () => void
}> = ({ icon: Icon, label, color, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2 group transition-all"
  >
    <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center transition-all group-hover:scale-110 group-active:scale-95 shadow-sm`}>
      <Icon className="w-6 h-6" />
    </div>
    <span className="text-[10px] font-bold text-slate-600 text-center leading-tight group-hover:text-primary-600">
      {label}
    </span>
  </button>
);