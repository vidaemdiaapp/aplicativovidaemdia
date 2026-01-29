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
                className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all ${dangerCount > 0
                    ? 'bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20'
                    : 'bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${dangerCount > 0 ? 'bg-rose-500/20' : 'bg-amber-500/20'
                        }`}>
                        <AlertTriangle className={`w-5 h-5 ${dangerCount > 0 ? 'text-rose-500' : 'text-amber-500'
                            }`} />
                    </div>
                    <div>
                        <p className={`text-sm font-bold ${dangerCount > 0 ? 'text-rose-400' : 'text-amber-400'
                            }`}>
                            {visibleAlerts.length} alertas de orçamento
                        </p>
                        <p className="text-[10px] text-slate-500">
                            {dangerCount > 0 && `${dangerCount} crítico(s)`}
                            {dangerCount > 0 && warningCount > 0 && ' • '}
                            {warningCount > 0 && `${warningCount} atenção`}
                        </p>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500" />
            </div>
        );
    }

    // Expanded mode: individual alerts
    return (
        <div className="space-y-2">
            {visibleAlerts.map(alert => (
                <div
                    key={alert.id}
                    className={`flex items-center gap-4 p-4 rounded-lg transition-all ${alert.alert_level === 'danger'
                        ? 'bg-rose-500/10 border border-rose-500/20'
                        : 'bg-amber-500/10 border border-amber-500/20'
                        }`}
                >
                    <BudgetProgressRing
                        spent={alert.spent_amount}
                        limit={alert.limit_amount}
                        size={50}
                    />

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className={`text-sm font-bold ${alert.alert_level === 'danger' ? 'text-rose-400' : 'text-amber-400'
                                }`}>
                                {alert.category_label}
                            </p>
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${alert.alert_level === 'danger'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-amber-500/20 text-amber-400'
                                }`}>
                                {alert.percentage.toFixed(0)}%
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {formatCurrency(alert.spent_amount)} de {formatCurrency(alert.limit_amount)} {getPeriodLabel(alert.period)}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                            {alert.alert_level === 'danger'
                                ? '⚠️ Limite quase atingido! Considere pausar gastos nesta categoria.'
                                : '📊 Você já usou 70% do limite. Monitore seus gastos.'
                            }
                        </p>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDismiss(alert.id);
                        }}
                        className="p-2 text-slate-500 hover:text-white transition-colors"
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
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-6 text-center">
                <Bell className="w-8 h-8 text-emerald-500/50 mx-auto mb-3" />
                <p className="text-sm font-medium text-emerald-400">Tudo sob controle!</p>
                <p className="text-xs text-slate-500 mt-1">
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
                    <h3 className="text-xs font-black uppercase tracking-wider text-rose-400 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Crítico ({dangerAlerts.length})
                    </h3>
                    <BudgetAlertBanner alerts={dangerAlerts} />
                </div>
            )}

            {warningAlerts.length > 0 && (
                <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        Atenção ({warningAlerts.length})
                    </h3>
                    <BudgetAlertBanner alerts={warningAlerts} />
                </div>
            )}

            {/* Tips Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    Dicas para Economizar
                </h4>
                <ul className="space-y-2">
                    <li className="text-xs text-slate-400 flex items-start gap-2">
                        <span className="text-emerald-500">•</span>
                        Defina limites realistas baseados no seu histórico de gastos
                    </li>
                    <li className="text-xs text-slate-400 flex items-start gap-2">
                        <span className="text-emerald-500">•</span>
                        Revise semanalmente para evitar surpresas no fim do mês
                    </li>
                    <li className="text-xs text-slate-400 flex items-start gap-2">
                        <span className="text-emerald-500">•</span>
                        Considere a regra 50-30-20: Essenciais, Desejos, Poupança
                    </li>
                </ul>
            </div>
        </div>
    );
};
