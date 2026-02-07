import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bell, X, ChevronRight, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BudgetProgressRing } from './charts/SpendingChart';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface BudgetAlert {
    id: string;
    category_id: string | null;
    category_label: string;
    limit_amount: number;
    spent_amount: number;
    percentage: number;
    alert_level: 'warning' | 'danger';
    period: 'weekly' | 'monthly' | 'yearly';
}

interface BudgetAlertBannerProps {
    alerts: BudgetAlert[];
    onDismiss?: (alertId: string) => void;
    compact?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

export const BudgetAlertBanner: React.FC<BudgetAlertBannerProps> = ({
    alerts,
    onDismiss,
    compact = false
}) => {
    const navigate = useNavigate();
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    const visibleAlerts = alerts.filter(a => !dismissed.has(a.id));

    if (visibleAlerts.length === 0) return null;

    const handleDismiss = (id: string) => {
        setDismissed(prev => new Set([...prev, id]));
        onDismiss?.(id);
    };

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const getPeriodLabel = (period: string) => {
        switch (period) {
            case 'weekly': return 'esta semana';
            case 'monthly': return 'este mês';
            case 'yearly': return 'este ano';
            default: return '';
        }
    };

    // Compact mode: single banner with count
    if (compact && visibleAlerts.length > 1) {
        const dangerCount = visibleAlerts.filter(a => a.alert_level === 'danger').length;
        const warningCount = visibleAlerts.filter(a => a.alert_level === 'warning').length;

        return (
            <div
                onClick={() => navigate('/budget-alerts')}
                className={`flex items-center justify-between p-5 rounded-[24px] cursor-pointer transition-all border-2 shadow-lg active:scale-[0.98] group ${dangerCount > 0
                    ? 'bg-danger-50 border-danger-100 hover:border-danger-200 shadow-danger-500/5'
                    : 'bg-amber-50 border-amber-100 hover:border-amber-200 shadow-amber-500/5'
                    }`}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 border-white shadow-sm ${dangerCount > 0 ? 'bg-danger-500 text-white' : 'bg-amber-500 text-white'
                        }`}>
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className={`text-[15px] font-black tracking-tight ${dangerCount > 0 ? 'text-danger-600' : 'text-amber-700'
                            }`}>
                            {visibleAlerts.length} Alertas Ativos
                        </p>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">
                            {dangerCount > 0 && `${dangerCount} Crítico(s)`}
                            {dangerCount > 0 && warningCount > 0 && ' • '}
                            {warningCount > 0 && `${warningCount} em Atenção`}
                        </p>
                    </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/50 flex items-center justify-center group-hover:bg-white transition-colors">
                    <ChevronRight className="w-5 h-5 text-text-muted" />
                </div>
            </div>
        );
    }

    // Expanded mode: individual alerts
    return (
        <div className="space-y-4">
            {visibleAlerts.map(alert => (
                <div
                    key={alert.id}
                    className={`card p-5 border-l-4 transition-all ${alert.alert_level === 'danger'
                        ? 'border-l-danger-500 bg-danger-50/30'
                        : 'border-l-amber-500 bg-amber-50/30'
                        }`}
                >
                    <div className="flex items-center gap-5">
                        <div className="shrink-0 bg-white rounded-2xl p-1 shadow-sm border border-border-color">
                            <BudgetProgressRing
                                spent={alert.spent_amount}
                                limit={alert.limit_amount}
                                size={56}
                                color={alert.alert_level === 'danger' ? '#ef4444' : '#f59e0b'}
                            />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="font-black text-text-primary tracking-tight leading-none truncate">
                                    {alert.category_label}
                                </h4>
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${alert.alert_level === 'danger'
                                    ? 'bg-danger-500 text-white border-danger-500'
                                    : 'bg-amber-500 text-white border-amber-500'
                                    }`}>
                                    {alert.percentage.toFixed(0)}%
                                </span>
                            </div>
                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                                {formatCurrency(alert.spent_amount)} de {formatCurrency(alert.limit_amount)}
                            </p>
                            <div className="flex items-center gap-1.5 mt-2">
                                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${alert.alert_level === 'danger' ? 'bg-danger-500' : 'bg-amber-500'}`}></div>
                                <p className={`text-[9px] font-black uppercase tracking-widest ${alert.alert_level === 'danger' ? 'text-danger-600' : 'text-amber-600'}`}>
                                    {alert.alert_level === 'danger' ? 'Cuidado: Próximo ao limite' : 'Atenção ao orçamento'}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDismiss(alert.id);
                            }}
                            className="w-10 h-10 rounded-xl bg-white/50 text-text-muted hover:bg-white hover:text-danger-500 transition-all flex items-center justify-center border border-border-color shadow-sm active:scale-90"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// Budget Alerts Screen (Full page)
// ═══════════════════════════════════════════════════════════════

interface BudgetAlertsScreenProps {
    alerts: BudgetAlert[];
}

export const BudgetAlertsSection: React.FC<BudgetAlertsScreenProps> = ({ alerts }) => {
    const navigate = useNavigate();

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    if (alerts.length === 0) {
        return (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <Bell className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-sm font-bold text-emerald-700">Tudo sob controle!</p>
                <p className="text-xs text-emerald-600 mt-1 font-medium">
                    Nenhum alerta de orçamento no momento.
                </p>
            </div>
        );
    }

    const dangerAlerts = alerts.filter(a => a.alert_level === 'danger');
    const warningAlerts = alerts.filter(a => a.alert_level === 'warning');

    return (
        <div className="space-y-8">
            {dangerAlerts.length > 0 && (
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-danger-500 mb-4 px-1 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Alertas Críticos ({dangerAlerts.length})
                    </h3>
                    <BudgetAlertBanner alerts={dangerAlerts} />
                </div>
            )}

            {warningAlerts.length > 0 && (
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 mb-4 px-1 flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        Atenção ({warningAlerts.length})
                    </h3>
                    <BudgetAlertBanner alerts={warningAlerts} />
                </div>
            )}

            {/* Tips Section */}
            <div className="card p-6 relative overflow-hidden group hover:border-primary-500/30 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 blur-2xl group-hover:bg-primary-500/10 transition-colors"></div>
                <h4 className="text-[11px] font-black text-text-primary uppercase tracking-widest mb-5 flex items-center gap-2 relative z-10">
                    <TrendingUp className="w-4 h-4 text-primary-500" />
                    Inteligência de Gastos
                </h4>
                <div className="grid gap-4 relative z-10">
                    {[
                        "Crie limites realistas com base no seu histórico",
                        "Revise semanalmente para evitar surpresas",
                        "Regra 50-30-20: Essenciais, Desejos e Reservas"
                    ].map((tip, idx) => (
                        <div key={idx} className="flex gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-primary-200 transition-all">
                            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center font-black text-primary-500 text-[10px] shadow-sm shrink-0 border border-slate-100">
                                {idx + 1}
                            </div>
                            <p className="text-[11px] font-bold text-text-secondary tracking-tight leading-snug self-center">
                                {tip}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
