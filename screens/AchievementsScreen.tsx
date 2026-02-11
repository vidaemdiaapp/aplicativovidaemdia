import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Award, Zap, PiggyBank, ShieldCheck,
    TrendingUp, CheckCircle2, Rocket, Star, Lock,
    ChevronRight, Sparkles, Loader2
} from 'lucide-react';
import { gamificationService, Achievement } from '../services/gamification';

const ICON_MAP: Record<string, any> = {
    'Zap': Zap,
    'PiggyBank': PiggyBank,
    'ShieldCheck': ShieldCheck,
    'TrendingUp': TrendingUp,
    'CheckCircle2': CheckCircle2,
    'Rocket': Rocket,
    'Star': Star
};

export const AchievementsScreen: React.FC = () => {
    const navigate = useNavigate();
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [totalPoints, setTotalPoints] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAchievements();
    }, []);

    const loadAchievements = async () => {
        setLoading(true);
        try {
            const [list, points] = await Promise.all([
                gamificationService.getAchievements(),
                gamificationService.getTotalPoints()
            ]);
            setAchievements(list);
            setTotalPoints(points);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Carregando Conquistas...</p>
            </div>
        );
    }

    const unlockedCount = achievements.filter(a => a.unlocked_at).length;
    const progress = (unlockedCount / achievements.length) * 100;

    return (
        <div className="min-h-screen bg-surface">
            {/* Header */}
            <header className="fixed top-0 inset-x-0 z-50 bg-primary-600 px-6 pt-12 pb-10 rounded-b-[40px] shadow-xl shadow-primary-500/20 overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Award className="w-32 h-32" />
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white active:scale-95 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Suas Conquistas</h1>
                        <p className="text-primary-100 text-[10px] font-bold uppercase tracking-widest">Nível Vida em Dia Pro</p>
                    </div>
                </div>

                <div className="mt-8 flex items-center gap-6 relative z-10 transition-all">
                    <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-lg flex flex-col items-center justify-center text-white border border-white/30 shadow-inner">
                        <span className="text-2xl font-black">{totalPoints}</span>
                        <span className="text-[8px] font-bold uppercase tracking-widest">Pontos</span>
                    </div>

                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-xs font-bold text-white uppercase tracking-wider">Progresso Geral</span>
                            <span className="text-[10px] font-black text-primary-200">{unlockedCount}/{achievements.length}</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
                            <div
                                className="h-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)] transition-all duration-1000"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </header>

            <main className="pt-64 pb-32 px-6">
                <div className="grid grid-cols-1 gap-4">
                    {achievements.map((ach, index) => {
                        const Icon = ICON_MAP[ach.icon] || Award;
                        const isUnlocked = !!ach.unlocked_at;

                        return (
                            <div
                                key={ach.id}
                                className={`p-5 rounded-[32px] border transition-all flex items-center gap-5 animate-in slide-in-from-bottom-8 duration-700 ${isUnlocked
                                    ? 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'
                                    : 'bg-slate-50 border-slate-100 opacity-60'
                                    }`}
                                style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
                            >
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform ${isUnlocked
                                    ? 'bg-primary-500 text-white shadow-primary-500/30 scale-105'
                                    : 'bg-slate-200 text-slate-400 grayscale'
                                    }`}>
                                    {isUnlocked ? <Icon className="w-8 h-8" /> : <Lock className="w-8 h-8 opacity-30" />}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className={`text-base font-bold ${isUnlocked ? 'text-slate-900' : 'text-slate-500'}`}>
                                            {ach.title}
                                        </h3>
                                        {isUnlocked && <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 font-medium leading-tight">
                                        {isUnlocked ? ach.description : `Bloqueado: Siga as dicas da Elara para desbloquear esta medalha.`}
                                    </p>
                                    <div className={`inline-flex items-center gap-1 mt-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${isUnlocked ? 'bg-amber-50 text-amber-600' : 'bg-slate-200 text-slate-400'
                                        }`}>
                                        <Star className="w-2.5 h-2.5" />
                                        {ach.points_reward} pts
                                    </div>
                                </div>

                                {isUnlocked && (
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <span className="text-[8px] text-slate-300 font-bold uppercase tracking-tighter">Conquistado</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* Float celebration if unlocked all */}
            {progress === 100 && (
                <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-amber-400/50 flex items-center gap-3 border-2 border-white animate-bounce">
                    <Rocket className="w-4 h-4" />
                    Mestre das Finanças!
                    <Star className="w-4 h-4" />
                </div>
            )}
        </div>
    );
};
