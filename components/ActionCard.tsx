import React from 'react';
import { Target, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
import { ActionPlan } from '../services/tasks';

interface ActionCardProps {
    plan: ActionPlan;
}

export const ActionCard: React.FC<ActionCardProps> = ({ plan }) => {
    const isHigh = plan.priority_level === 'high';
    const isMedium = plan.priority_level === 'medium';

    const themeConfig = {
        high: {
            border: 'border-rose-200',
            iconBg: 'bg-rose-100',
            iconColor: 'text-rose-600',
            dot: 'bg-rose-500'
        },
        medium: {
            border: 'border-amber-200',
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-600',
            dot: 'bg-amber-500'
        },
        low: {
            border: 'border-emerald-200',
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-600',
            dot: 'bg-emerald-500'
        }
    };

    const theme = isHigh ? themeConfig.high : isMedium ? themeConfig.medium : themeConfig.low;
    const Icon = isHigh ? AlertTriangle : isMedium ? Target : ShieldCheck;

    return (
        <div className={`bg-white rounded-2xl border ${theme.border} p-5 shadow-sm transition-all hover:shadow-md`}>
            {/* Header */}
            <div className="flex items-start gap-4 mb-5">
                <div className={`p-3 rounded-xl ${theme.iconBg}`}>
                    <Icon className={`w-6 h-6 ${theme.iconColor}`} />
                </div>
                <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                        Próxima Ação Sugerida
                    </p>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">
                        {plan.primary_action}
                    </h3>
                </div>
            </div>

            {/* Impact Info */}
            <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-3">
                <div className="flex gap-3 items-start">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${theme.dot} animate-pulse`}></div>
                    <p className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">Consequência:</span>{' '}
                        {plan.legal_consequence}
                    </p>
                </div>
                <div className="flex gap-3 items-start">
                    <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0"></div>
                    <p className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">Impacto:</span>{' '}
                        {plan.practical_impact}
                    </p>
                </div>
            </div>

            {/* Steps */}
            <div className="space-y-3 mb-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide pb-2 border-b border-slate-100">
                    Plano de Ação
                </p>
                {plan.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center text-xs font-bold text-primary-600">
                            {idx + 1}
                        </div>
                        <p className="text-sm text-slate-700 flex-1">{step}</p>
                    </div>
                ))}
            </div>

            {/* CTA Button */}
            <button className="w-full py-3.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 transition-all active:scale-[0.98] group">
                Executar Agora
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    );
};
