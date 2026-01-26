import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Plus, Calendar, ChevronRight, TrendingUp, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { tasksService, Task } from '../services/tasks';
import { taxService } from '../services/tax';
import { taxDeductionsService } from '../services/tax_deductions';
import { IRPFEstimate } from '../types';
import { IncomeRegistrationModal } from '../components/IncomeRegistrationModal';
import { IRPFEstimateCard } from '../components/IRPFEstimateCard';
import { DeductionsCard } from '../components/DeductionsCard';

export const FinancialDashboardScreen: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [report, setReport] = useState<{
        total_income: number;
        total_commitments: number;
        balance: number;
        status: 'surplus' | 'warning' | 'deficit';
    } | null>(null);
    const [monthlyTasks, setMonthlyTasks] = useState<Task[]>([]);
    const [irEstimate, setIrEstimate] = useState<IRPFEstimate | null>(null);
    const [totalDeductions, setTotalDeductions] = useState(0);
    const [showIR, setShowIR] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [reportData, tasksData, irPref, deductionsData] = await Promise.all([
                tasksService.computeFinancialStatus(),
                tasksService.getUserTasks(),
                taxService.getUserTaxPreference(),
                taxDeductionsService.getDeductions()
            ]);

            setReport(reportData);
            setShowIR(irPref);

            const total = deductionsData.reduce((sum, d) => sum + d.amount, 0);
            setTotalDeductions(total);

            if (irPref) {
                const estimate = await taxService.getIRPFEstimate();
                setIrEstimate(estimate);
            }

            // Filter tasks for current month that are not completed
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

            const filtered = tasksData.filter(t => t.due_date >= start && t.due_date <= end && t.status !== 'completed');
            setMonthlyTasks(filtered);
        } catch (error) {
            console.error('[Financial] Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    // Sort tasks for secondary cards
    const sortedByAmount = [...monthlyTasks].sort((a, b) => {
        const valA = typeof a.amount === 'number' ? a.amount : parseFloat(a.amount || '0');
        const valB = typeof b.amount === 'number' ? b.amount : parseFloat(b.amount || '0');
        return valB - valA;
    });

    const topCommitments = sortedByAmount.slice(0, 3);
    const risks = monthlyTasks.filter(t => t.health_status === 'risk' || t.status === 'overdue');

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
                <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="min-h-screen bg-slate-950 pb-24 text-white">
            {/* Header / Summary */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-8 pt-16 pb-12 rounded-b-[40px] shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        Projeção do Mês
                    </p>
                    <h1 className="text-4xl font-black mb-1">
                        {report ? formatCurrency(report.balance) : 'R$ 0,00'}
                    </h1>
                    <p className={`text-[10px] font-bold px-2 py-0.5 rounded-lg inline-block uppercase tracking-wider ${report?.status === 'surplus' ? 'bg-emerald-500/20 text-emerald-400' :
                        report?.status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-rose-500/20 text-rose-400'
                        }`}>
                        {report?.status === 'surplus' ? 'Saldo Saudável 🟢' :
                            report?.status === 'warning' ? 'Atenção ao Limite 🟡' : 'Déficit Previsto 🔴'}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-4 border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                                <ArrowUpCircle className="w-4 h-4 text-emerald-400" />
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Rendas</span>
                            </div>
                            <p className="text-lg font-black">{report ? formatCurrency(report.total_income) : 'R$ 0,00'}</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-4 border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                                <ArrowDownCircle className="w-4 h-4 text-rose-400" />
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Compromissos</span>
                            </div>
                            <p className="text-lg font-black">{report ? formatCurrency(report.total_commitments) : 'R$ 0,00'}</p>
                        </div>
                    </div>
                </div>

                <div className="absolute -top-10 -right-10 w-48 h-48 bg-primary-600/20 rounded-full blur-[80px]"></div>
                <div className="absolute bottom-0 left-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-[40px]"></div>
            </div>

            {/* IRPF Module (Sprint 11) */}
            {showIR && irEstimate && (
                <div className="px-6 -mt-8 mb-10 space-y-6">
                    <IRPFEstimateCard estimate={irEstimate} />
                    <DeductionsCard
                        totalDeductions={totalDeductions}
                        estimatedSaving={totalDeductions * 0.275}
                        onOpenPastaFiscal={() => navigate('/fiscal-folder')}
                    />
                </div>
            )}

            {/* Actions & Setup */}
            <div className="px-6 -mt-6 relative z-20 flex gap-3">
                <button
                    onClick={() => setIsIncomeModalOpen(true)}
                    className="bg-primary-600 hover:bg-primary-700 p-4 rounded-3xl shadow-xl flex-1 flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                    <Plus className="w-5 h-5 text-white" />
                    <span className="text-xs font-black uppercase tracking-tight">Gerenciar Rendas</span>
                </button>
                <button
                    onClick={() => navigate('/new-task')}
                    className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/5 flex items-center justify-center transition-transform active:scale-95"
                >
                    <Calendar className="w-5 h-5 text-white" />
                </button>
            </div>

            {/* Secondary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 px-6">
                <div className="bg-slate-900 shadow-xl rounded-[32px] p-6 border border-white/5">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                        <ArrowDownCircle className="w-4 h-4 text-rose-500" /> Maiores Compromissos
                    </h4>
                    <div className="space-y-4">
                        {topCommitments.map(task => (
                            <div key={task.id} className="flex justify-between items-center group cursor-pointer" onClick={() => navigate(`/detail/${task.id}`)}>
                                <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors truncate max-w-[150px]">{task.title}</span>
                                <span className="text-sm font-black">{formatCurrency(typeof task.amount === 'number' ? task.amount : parseFloat(task.amount || '0'))}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-900 shadow-xl rounded-[32px] p-6 border border-white/5">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                        <Info className="w-4 h-4 text-amber-500" /> Riscos do Mês
                    </h4>
                    {risks.length > 0 ? (
                        <div className="space-y-4">
                            {risks.slice(0, 3).map(task => (
                                <div key={task.id} className="flex justify-between items-center group cursor-pointer" onClick={() => navigate(`/detail/${task.id}`)}>
                                    <span className="text-sm font-bold text-rose-400 group-hover:text-rose-300 transition-colors truncate max-w-[150px]">{task.title}</span>
                                    <span className="text-xs font-black text-rose-400">{new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500 font-bold italic">Nenhum risco imediato detectado.</p>
                    )}
                </div>
            </div>

            {/* Commitments Timeline */}
            <section className="mt-10 px-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black opacity-90">Caminho do Dinheiro</h3>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase">
                        Próximas Saídas
                    </div>
                </div>

                {monthlyTasks.length === 0 ? (
                    <div className="bg-white/5 rounded-[32px] p-10 text-center border border-dashed border-white/10">
                        <Wallet className="w-8 h-8 text-primary-500/40 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm font-medium italic">Nenhum compromisso financeiro pendente este mês.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {monthlyTasks.map(task => (
                            <div
                                key={task.id}
                                onClick={() => navigate(`/detail/${task.id}`)}
                                className="bg-slate-900/50 rounded-3xl p-5 border border-white/5 flex items-center justify-between hover:bg-white/5 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${task.health_status === 'risk' ? 'bg-rose-500/10 text-rose-500' : 'bg-primary-500/10 text-primary-500'
                                        }`}>
                                        <Wallet className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black tracking-tight">{task.title}</h4>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                            {new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black">
                                        {task.amount ? formatCurrency(typeof task.amount === 'number' ? task.amount : parseFloat(task.amount || '0')) : 'Definir R$'}
                                    </p>
                                    {!task.amount && (
                                        <span className="text-[8px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded uppercase font-black">Pendente</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Income Modal */}
            <IncomeRegistrationModal
                isOpen={isIncomeModalOpen}
                onClose={() => setIsIncomeModalOpen(false)}
                onSuccess={loadData}
            />

            {/* Safety Tip / Disclaimer */}
            <div className="mt-8 px-8 flex gap-3 items-start opacity-40">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] leading-relaxed font-medium">
                    Esta projeção é baseada nos seus itens cadastrados. Não capturamos gastos extras ou variáveis do dia-a-dia automaticamente.
                </p>
            </div>
        </div>
    );
};
