import React, { useEffect, useState } from 'react';
import { Target, Trophy, ArrowRight, Shield, Zap, Plane, Home, Heart, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { savingsGoalsService, SavingsGoal } from '../services/financial';

interface JointGoalsChartProps {
    partnerName?: string;
}

export const JointGoalsChart: React.FC<JointGoalsChartProps> = ({ partnerName }) => {
    const navigate = useNavigate();
    const [goals, setGoals] = useState<SavingsGoal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadGoals = async () => {
            try {
                const data = await savingsGoalsService.getAll();
                // In a real app, strict filtering by "is_shared" would happen here
                // For now, we assume household goals are shared
                setGoals(data.slice(0, 3));
            } catch (error) {
                console.error('Failed to load joint goals:', error);
            } finally {
                setLoading(false);
            }
        };
        loadGoals();
    }, []);

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const totalSaved = goals.reduce((acc, goal) => acc + goal.current_amount, 0);

    if (loading) return (
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
            <div className="h-12 bg-slate-100 rounded-xl mb-4"></div>
            <div className="h-6 bg-slate-200 rounded w-full"></div>
        </div>
    );

    if (goals.length === 0) {
        return (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 text-center">
                <div className="flex items-center gap-3 justify-center mb-3">
                    <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
                        <Heart className="w-4 h-4 text-rose-500" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-700">Metas de Casal</h3>
                </div>
                <p className="text-[11px] text-slate-400 mb-3 max-w-[200px] mx-auto leading-relaxed">
                    Vocês ainda não definiram metas juntos.
                </p>
                <button
                    onClick={() => navigate('/savings')}
                    className="text-[10px] font-bold text-rose-500 bg-rose-50 px-4 py-2 rounded-full hover:bg-rose-100 transition-colors"
                >
                    + Criar Primeira Meta
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Heart className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 leading-tight">
                            Metas em Conjunto
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium">
                            {goals.length} {goals.length === 1 ? 'objetivo' : 'objetivos'} compartilhados
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</p>
                    <p className="text-sm font-black text-indigo-600">
                        {formatCurrency(totalSaved)}
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                {goals.map((goal, index) => {
                    const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
                    // Use predefined cool colors or fallback
                    const colors = ['#6366f1', '#8b5cf6', '#ec4899'];
                    const color = goal.color || colors[index % colors.length];

                    return (
                        <div
                            key={goal.id}
                            className="group/item cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-xl transition-colors"
                            onClick={() => navigate('/savings')}
                        >
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-xs font-bold text-slate-600 group-hover/item:text-indigo-600 transition-colors truncate max-w-[60%]">
                                    {goal.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold">
                                    {Math.round(progress)}%
                                </span>
                            </div>

                            {/* Progress Bar Container */}
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                                    style={{ width: `${progress}%`, backgroundColor: color }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={() => navigate('/savings')}
                className="w-full mt-3 pt-3 border-t border-slate-50 text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center justify-center gap-1 transition-colors"
            >
                Ver detalhes <ArrowRight className="w-3 h-3" />
            </button>
        </div>
    );
};
