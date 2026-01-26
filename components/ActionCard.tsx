import React from 'react';
import { Target, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
import { ActionPlan } from '../services/tasks';

interface ActionCardProps {
    plan: ActionPlan;
}

export const ActionCard: React.FC<ActionCardProps> = ({ plan }) => {
    const isHigh = plan.priority_level === 'high';
    const isMedium = plan.priority_level === 'medium';

    const colors = isHigh
        ? 'bg-rose-50 border-rose-100 text-rose-700'
        : isMedium
            ? 'bg-amber-50 border-amber-100 text-amber-700'
            : 'bg-emerald-50 border-emerald-100 text-emerald-700';

    const Icon = isHigh ? AlertTriangle : isMedium ? Target : ShieldCheck;

    return (
        <div className={`rounded-3xl border p-6 transition-all shadow-sm ${colors}`}>
            <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-2xl ${isHigh ? 'bg-rose-500 text-white' : isMedium ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <h3 className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">Próxima Ação Sugerida</h3>
                    <p className="text-xl font-bold leading-tight">{plan.primary_action}</p>
                </div>
            </div>

            <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 mb-4 border border-white/20 space-y-2">
                <div className="flex gap-2 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-current mt-1.5 shrink-0 opacity-50"></div>
                    <p className="text-sm font-medium leading-relaxed italic">
                        <strong>Consequência:</strong> {plan.legal_consequence}
                    </p>
                </div>
                <div className="flex gap-2 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-current mt-1.5 shrink-0 opacity-50"></div>
                    <p className="text-sm font-medium leading-relaxed italic">
                        <strong>Impacto:</strong> {plan.practical_impact}
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider opacity-60">Plano de Ação:</p>
                {plan.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-white/50 flex items-center justify-center text-[10px] font-black shrink-0">
                            {idx + 1}
                        </div>
                        <p className="text-sm font-medium">{step}</p>
                    </div>
                ))}
            </div>

            <button className={`mt-6 w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md ${isHigh ? 'bg-rose-600 text-white' : isMedium ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
                }`}>
                Executar Agora
                <ArrowRight className="w-4 h-4" />
            </button>
        </div>
    );
};
