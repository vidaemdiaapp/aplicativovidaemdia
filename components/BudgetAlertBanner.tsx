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
                className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border shadow-sm ${dangerCount > 0
                    ? 'bg-red-50 border-red-100 hover:border-red-200'
                    : 'bg-amber-50 border-amber-100 hover:border-amber-200'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${dangerCount > 0 ? 'bg-white text-danger border-red-100' : 'bg-white text-amber-600 border-amber-100'
                        }`}>
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className={`text-sm font-bold ${dangerCount > 0 ? 'text-red-700' : 'text-amber-700'
                            }`}>
                            {visibleAlerts.length} alertas de orçamento
                        </p>
                        <p className="text-xs text-slate-600 font-medium">
                            {dangerCount > 0 && `${dangerCount} crítico(s)`}
                            {dangerCount > 0 && warningCount > 0 && ' • '}
                            {warningCount > 0 && `${warningCount} atenção`}
                        </p>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
        );
    }

    // Expanded mode: individual alerts
    return (
        <div className="space-y-3">
            {visibleAlerts.map(alert => (
                <div
                    key={alert.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all shadow-sm ${alert.alert_level === 'danger'
                        ? 'bg-red-50 border-red-100 hover:border-red-200'
                        : 'bg-amber-50 border-amber-100 hover:border-amber-200'
                        }`}
                >
                    <BudgetProgressRing
                        spent={alert.spent_amount}
                        limit={alert.limit_amount}
                        size={50}
                        color={alert.alert_level === 'danger' ? '#ef4444' : '#f59e0b'}
                    />

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className={`text-sm font-bold ${alert.alert_level === 'danger' ? 'text-red-700' : 'text-amber-700'
                                }`}>
                                {alert.category_label}
                            </p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${alert.alert_level === 'danger'
                                ? 'bg-white text-red-600 border-red-200'
                                : 'bg-white text-amber-600 border-amber-200'
                                }`}>
                                {alert.percentage.toFixed(0)}%
                            </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 font-medium">
                            {formatCurrency(alert.spent_amount)} de {formatCurrency(alert.limit_amount)} {getPeriodLabel(alert.period)}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                            {alert.alert_level === 'danger'
                                ? '⚠️ Limite quase atingido!'
                                : '📊 Monitorar gastos'
                            }
                        </p>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDismiss(alert.id);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-700 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
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
        <div className="space-y-6">
            {dangerAlerts.length > 0 && (
                <div>
                    <h3 className="text-xs font-bold text-red-600 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Crítico ({dangerAlerts.length})
                    </h3>
                    <BudgetAlertBanner alerts={dangerAlerts} />
                </div>
            )}

            {warningAlerts.length > 0 && (
                <div>
                    <h3 className="text-xs font-bold text-amber-600 mb-3 flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        Atenção ({warningAlerts.length})
                    </h3>
                    <BudgetAlertBanner alerts={warningAlerts} />
                </div>
            )}

            {/* Tips Section */}
            <div className="bg-white border border-slate-100 rounded-xl p-5 relative overflow-hidden group hover:border-primary/30 transition-colors shadow-sm">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-xl group-hover:bg-primary/10 transition-colors"></div>
                <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2 relative z-10">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Dicas para Economizar
                </h4>
                <ul className="space-y-3 relative z-10">
                    <li className="text-xs text-slate-600 flex items-start gap-2 font-medium">
                        <span className="text-primary mt-0.5">•</span>
                        Defina limites realistas baseados no seu histórico de gastos
                    </li>
                    <li className="text-xs text-slate-600 flex items-start gap-2 font-medium">
                        <span className="text-primary mt-0.5">•</span>
                        Revise semanalmente para evitar surpresas no fim do mês
                    </li>
                    <li className="text-xs text-slate-600 flex items-start gap-2 font-medium">
                        <span className="text-primary mt-0.5">•</span>
                        Regra 50-30-20: Essenciais, Desejos, Poupança
                    </li>
                </ul>
            </div>
        </div>
    );
};
