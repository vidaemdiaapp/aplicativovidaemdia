import React, { useState, useEffect } from 'react';
import { StatusCard } from '../components/StatusCard';
import { StatusLevel } from '../types';
import {
  Bell, ChevronRight, Car, Home, FileText, Shield, Receipt, Plus,
  DollarSign, CheckCircle2, UploadCloud, Zap, ShoppingBag,
  Utensils, Heart, Plane, Landmark, MoreHorizontal, Calendar, ShieldCheck,
  CreditCard, PiggyBank, TrendingUp, ArrowUpCircle, ArrowDownCircle, Eye, EyeOff,
  Sparkles, AlertTriangle, Clock, Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { tasksService, Task, Category, Household, HouseholdMember } from '../services/tasks';
import { CouplePanel } from '../components/CouplePanel';
import { ResponsibilityBadge } from '../components/ResponsibilityBadge';
import { FinancialSummaryCard } from '../components/FinancialSummaryCard';
import { Skeleton } from '../components/Skeleton';

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
  const [hideBalance, setHideBalance] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const householdData = await tasksService.getHousehold();
      setHousehold(householdData);

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
      setTimeout(() => setLoading(false), 100);
    }
  };

  const currentStatus = statusData?.household_status === 'risk' ? StatusLevel.RISK :
    statusData?.household_status === 'attention' ? StatusLevel.WARNING :
      StatusLevel.SAFE;

  const partner = household?.members?.find(m => m.user_id !== user?.id);
  const partnerName = partner?.profile?.full_name || 'Parceiro(a)';

  const urgentTasks = tasks.filter(task => {
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

  const formatCurrency = (val: number | undefined | null) =>
    (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.getTime() === today.getTime()) return 'Hoje';
    if (date.getTime() === tomorrow.getTime()) return 'Amanhã';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  // Get user display name from profile
  const userName = user?.user_metadata?.full_name || 'Usuário';
  const greeting = new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite';

  const getUserInitials = () => {
    const name = userName;
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface pb-24 overflow-x-hidden">
        <header className="bg-primary-500 pt-14 pb-32 px-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-full bg-white/20" />
              <div>
                <Skeleton className="w-20 h-3 mb-2 bg-white/20" />
                <Skeleton className="w-28 h-5 bg-white/20" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="w-10 h-10 rounded-xl bg-white/20" />
              <Skeleton className="w-10 h-10 rounded-xl bg-white/20" />
            </div>
          </div>
        </header>
        <div className="px-4 -mt-24 relative z-20">
          <Skeleton className="h-56 rounded-3xl" />
        </div>
        <div className="px-4 mt-8 space-y-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    );
  }

  const totalExpenses = financialReport?.total_commitments || 0;
  const overdueCount = urgentTasks.filter(t => t.health_status === 'risk').length;

  return (
    <div className="min-h-screen bg-surface pb-24 text-text-primary">
      {/* ═══════════════════════════════════════════════════════════════
          HERO: Blue Header with User Greeting
      ═══════════════════════════════════════════════════════════════ */}
      <header className="bg-primary-500 pt-14 pb-32 px-6 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-400/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-48 h-48 bg-primary-600/20 rounded-full blur-2xl" />

        {/* Top Row: Avatar + Icons */}
        <div className="flex justify-between items-start relative z-10 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg border-2 border-white/30">
              {getUserInitials()}
            </div>
            <div>
              <p className="text-primary-100 text-[10px] font-bold uppercase tracking-widest">{greeting}</p>
              <p className="text-white text-lg font-bold">{userName.split(' ')[0]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHideBalance(!hideBalance)}
              className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm text-white/80 hover:bg-white/20 flex items-center justify-center transition-all"
            >
              {hideBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            <button
              onClick={() => navigate('/notifications')}
              className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm text-white/80 hover:bg-white/20 flex items-center justify-center transition-all relative"
            >
              <Bell className="w-5 h-5" />
              {overdueCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {overdueCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          SUMMARY CARD: Floats over hero
      ═══════════════════════════════════════════════════════════════ */}
      <div className="px-4 -mt-24 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          {/* Balance Section */}
          <div className="p-6 pb-4">
            <div className="flex justify-between items-start mb-4">
              <p className="text-slate-500 text-sm font-medium">Resumo do Mês</p>
              {financialReport && financialReport.balance < 0 && (
                <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[10px] font-bold rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                  Vai faltar
                </span>
              )}
            </div>
            <h2 className={`text-4xl font-black tracking-tight ${financialReport?.balance && financialReport.balance >= 0 ? 'text-slate-900' : 'text-rose-600'
              }`}>
              {hideBalance ? '•••••' : formatCurrency(financialReport?.balance)}
            </h2>
          </div>

          {/* Entries/Exits Row */}
          <div className="grid grid-cols-2 gap-3 px-4 pb-4">
            {/* ENTRADAS - VERDE */}
            <button
              onClick={() => navigate('/incomes')}
              className="bg-green-50 hover:bg-green-100 rounded-2xl p-4 text-left transition-all active:scale-98 group"
            >
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpCircle className="w-4 h-4 text-green-600" />
                <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Entradas</span>
              </div>
              <p className="text-lg font-black text-slate-800 group-hover:text-green-600 transition-colors">
                {hideBalance ? '•••••' : formatCurrency(financialReport?.total_income)}
              </p>
            </button>

            {/* SAÍDAS - VERMELHO */}
            <button
              onClick={() => navigate('/expenses')}
              className="bg-red-50 hover:bg-red-100 rounded-2xl p-4 text-left transition-all active:scale-98 group"
            >
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownCircle className="w-4 h-4 text-red-500" />
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Saídas</span>
              </div>
              <p className="text-lg font-black text-slate-800 group-hover:text-red-600 transition-colors">
                {hideBalance ? '•••••' : formatCurrency(totalExpenses)}
              </p>
            </button>
          </div>

          {/* View Details Button */}
          <button
            onClick={() => navigate('/financial-dashboard')}
            className="w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-bold flex items-center justify-center gap-2 transition-all border-t border-slate-100"
          >
            Ver detalhes do extrato
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ATENÇÕES NECESSÁRIAS: Health & Overdue Alerts
      ═══════════════════════════════════════════════════════════════ */}
      <section className="px-4 mt-8 space-y-4">
        <div className="flex items-center gap-2 px-1 mb-1">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h2 className="font-bold text-slate-800 text-lg">Atenções Necessárias</h2>
        </div>

        {/* Overall Status Card */}
        <StatusCard
          status={currentStatus}
          percentage={getPercentage()}
        />

        {/* Urgent Overdue Alert - Premium Style matching Financial Dashboard */}
        {overdueCount > 0 && (
          <button
            onClick={() => navigate('/financial-dashboard')}
            className="w-full bg-rose-50 border border-rose-100 rounded-[2rem] p-5 flex items-center justify-between group hover:shadow-lg hover:border-rose-200 transition-all active:scale-[0.98] shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-200 group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-rose-500 mb-0.5">Ação Urgente</p>
                <p className="text-[15px] font-bold text-slate-900 leading-tight">
                  {overdueCount} {overdueCount === 1 ? 'pendência vencida' : 'pendências vencidas'}
                </p>
                <p className="text-[11px] text-rose-400 font-medium mt-0.5 group-hover:text-rose-600 transition-colors">
                  Clique para regularizar agora
                </p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/50 flex items-center justify-center text-rose-300 group-hover:text-rose-500 group-hover:bg-white transition-all">
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          QUICK ACCESS SECTION — Mercado Pago Style
      ═══════════════════════════════════════════════════════════════ */}
      <section className="px-4 mt-6">
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="font-bold text-slate-800 text-lg">Atalhos</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 px-1">
          <QuickAccessButton
            icon={Car}
            label="Veículos"
            color="text-blue-500 bg-blue-50"
            onClick={() => navigate('/vehicle-central')}
          />
          <QuickAccessButton
            icon={ShieldCheck}
            label="Impostos"
            color="text-emerald-500 bg-emerald-50"
            onClick={() => navigate('/tax-declaration')}
          />
          <QuickAccessButton
            icon={CreditCard}
            label="Cartões"
            color="text-primary-500 bg-primary-50"
            onClick={() => navigate('/credit-cards')}
          />
          <QuickAccessButton
            icon={Calendar}
            label="Agenda"
            color="text-amber-500 bg-amber-50"
            onClick={() => navigate('/agenda')}
          />
          <QuickAccessButton
            icon={FileText}
            label="Contratos"
            color="text-purple-500 bg-purple-50"
            onClick={() => navigate('/contracts')}
          />
          <QuickAccessButton
            icon={Briefcase}
            label="Docs"
            color="text-slate-500 bg-slate-100"
            onClick={() => navigate('/fiscal-folder')}
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          VIDA A DOIS SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <section className="px-4 mt-8">
        {(() => {
          const hasPartner = (household?.members?.length || 0) > 1;

          return (
            <>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  {hasPartner && <Heart className="w-5 h-5 text-primary-500" />}
                  <h3 className="text-lg font-bold text-slate-800">
                    {hasPartner ? 'Vida a Dois' : 'Minhas Pendências'}
                  </h3>
                </div>
                <button onClick={() => navigate('/agenda')} className="text-xs font-bold text-primary-500 hover:text-primary-600 transition-colors">
                  Ver tudo
                </button>
              </div>

              {/* Tabs using CouplePanel */}
              {hasPartner && (
                <CouplePanel
                  activeFilter={responsibilityFilter}
                  onFilterChange={setResponsibilityFilter}
                  partnerName={partnerName}
                />
              )}

              {/* Pending Section Label */}
              {hasPartner && (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 mt-6">
                  {responsibilityFilter === 'me' ? 'Minhas Pendências' :
                    responsibilityFilter === 'partner' ? `Com ${partnerName.split(' ')[0]}` :
                      responsibilityFilter === 'joint' ? 'Nossas Pendências' :
                        'Itens Pendentes'}
                </p>
              )}
            </>
          );
        })()}

        {/* Pending Bills List */}
        <div className="space-y-3">
          {urgentTasks.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
              <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">Você está em dia!</p>
              <p className="text-slate-400 text-xs mt-1">Nada pendente nesta categoria 🎉</p>
            </div>
          ) : (
            urgentTasks.slice(0, 5).map(task => {
              const category = categories.find(c => c.id === task.category_id);
              const IconComponent = ICON_MAP[category?.icon || 'FileText'] || FileText;

              return (
                <button
                  key={task.id}
                  onClick={() => navigate(`/detail/${task.id}`)}
                  className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all text-left"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${task.health_status === 'risk' ? 'bg-rose-100' : 'bg-slate-100'
                    }`}>
                    {task.health_status === 'risk' ? (
                      <AlertTriangle className="w-6 h-6 text-rose-500" />
                    ) : (
                      <IconComponent className="w-6 h-6 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${responsibilityFilter === 'me' ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                        {responsibilityFilter === 'me' ? 'Comigo' : responsibilityFilter === 'partner' ? partnerName.split(' ')[0] : 'Conjunto'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {task.health_status === 'risk'
                          ? '⚠️ Vencido'
                          : task.due_date ? `Vence ${formatDate(task.due_date.split('T')[0])}` : 'Sem data'
                        }
                      </span>
                    </div>
                  </div>
                  <p className={`text-base font-black ${task.health_status === 'risk' ? 'text-rose-500' : 'text-slate-800'
                    }`}>
                    {hideBalance ? '•••' : formatCurrency(typeof task.amount === 'number' ? task.amount : parseFloat(task.amount || '0'))}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          AI ANALYSIS CARD
      ═══════════════════════════════════════════════════════════════ */}
      <section className="px-4 mt-8">
        <div className="bg-gradient-to-br from-primary-500/10 via-primary-400/5 to-primary-600/10 rounded-3xl p-5 border border-primary-200/50 relative overflow-hidden">
          {/* Decorative Element */}
          <div className="absolute top-4 right-4">
            <div className="w-12 h-12 bg-primary-500/10 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-500" />
            </div>
          </div>

          <h4 className="text-lg font-bold text-slate-800 mb-2">Analise com IA</h4>
          <p className="text-slate-600 text-sm leading-relaxed mb-4 max-w-[250px]">
            {overdueCount > 0
              ? `Identificamos ${overdueCount} pendência(s) em atraso. Regularize para manter sua projeção positiva.`
              : financialReport?.status === 'surplus'
                ? 'Seu orçamento está saudável. Excelente momento para investir!'
                : 'Atenção aos gastos nos próximos dias para garantir suas contas.'}
          </p>
          <button
            onClick={() => navigate('/assistant')}
            className="px-4 py-2 bg-white/80 hover:bg-white text-primary-600 text-sm font-bold rounded-xl border border-primary-200 transition-all active:scale-95"
          >
            Ver Insights
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ÚLTIMAS ATIVIDADES — Mercado Pago Style
      ═══════════════════════════════════════════════════════════════ */}
      {activities.length > 0 && (
        <section className="px-4 mt-8 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-slate-800 text-xl">Últimas atividades</h2>
            <button
              onClick={() => navigate('/agenda')}
              className="text-primary-500 text-sm font-medium hover:text-primary-600 transition-colors flex items-center gap-1"
            >
              Conferir todas <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
            {activities.slice(0, 4).map((act, idx) => {
              const resolver = household?.members?.find(m => m.user_id === act.user_id);
              const isIncome = act.type === 'income' || (typeof act.amount === 'number' && act.amount > 0 && act.category_id === 'salary');
              const category = categories.find(c => c.id === act.category_id);
              const IconComponent = ICON_MAP[category?.icon || 'FileText'] || FileText;

              return (
                <div
                  key={act.id}
                  onClick={() => navigate(`/detail/${act.id}`)}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {/* Icon */}
                  <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <IconComponent className="w-5 h-5 text-slate-600" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-[15px] truncate">{act.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-slate-500 text-xs">
                        {act.status === 'completed' ? 'Concluído' : 'Pagamento'}
                      </span>
                      {act.payment_method && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          {act.payment_method}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount & Date */}
                  <div className="text-right shrink-0">
                    <p className={`font-bold text-[15px] ${isIncome ? 'text-emerald-500' : 'text-slate-800'}`}>
                      {isIncome ? '+' : '-'} {formatCurrency(typeof act.amount === 'number' ? Math.abs(act.amount) : parseFloat(act.amount || '0'))}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {act.due_date ? formatDate(act.due_date.split('T')[0]) : 'Hoje'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
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
    className="flex flex-col items-center justify-center gap-3 p-4 rounded-3xl bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-primary-100 dark:hover:border-primary-900 transition-all group active:scale-95"
  >
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${color.split(' ')[1]} bg-opacity-10 dark:bg-opacity-20 group-hover:scale-110`}>
      <Icon className={`w-6 h-6 ${color.split(' ')[0]}`} />
    </div>
    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary-500 transition-colors">
      {label}
    </span>
  </button>
);
