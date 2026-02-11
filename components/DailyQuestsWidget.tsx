import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Trophy, ArrowRight, Star } from 'lucide-react';
import { questsService, Quest } from '../services/quests';

export const DailyQuestsWidget: React.FC = () => {
    const navigate = useNavigate();
    const [quests, setQuests] = useState<Quest[]>([]);
    const [totalPoints, setTotalPoints] = useState(0);

    useEffect(() => {
        loadQuests();

        const handleUpdate = () => loadQuests();
        window.addEventListener('quests_updated', handleUpdate);
        return () => window.removeEventListener('quests_updated', handleUpdate);
    }, []);

    const loadQuests = () => {
        const daily = questsService.getDailyQuests();
        setQuests(daily);
        setTotalPoints(questsService.getTotalPoints());
    };

    const completedCount = quests.filter(q => q.status === 'completed').length;
    const progress = (completedCount / quests.length) * 100;

    return (
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        Missões Diárias
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">
                        Complete para ganhar pontos
                    </p>
                </div>
                <button
                    onClick={() => navigate('/rewards-store')}
                    className="bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-yellow-100 transition-colors flex items-center gap-1.5"
                >
                    <Trophy className="w-3 h-3" />
                    {totalPoints} PTS
                </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="space-y-3 relative z-10">
                {quests.map((quest) => (
                    <div
                        key={quest.id}
                        className={`flex items-center gap-3 p-2 rounded-xl transition-all ${quest.status === 'completed' ? 'opacity-50' : 'hover:bg-slate-50'
                            }`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${quest.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-500'
                                : 'bg-slate-100 text-slate-400'
                            }`}>
                            {quest.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <div className="text-xs">{quest.icon}</div>}
                        </div>
                        <div className="flex-1">
                            <p className={`text-xs font-bold ${quest.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                {quest.title}
                            </p>
                            <p className="text-[10px] text-slate-400">
                                +{quest.points} pts
                            </p>
                        </div>
                        {quest.status === 'pending' && (
                            <div className="text-[9px] font-bold text-slate-300 bg-slate-50 px-2 py-1 rounded-md">
                                {quest.progress}/{quest.target}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {completedCount === quests.length && (
                <div className="mt-4 bg-emerald-50 rounded-xl p-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <Trophy className="w-5 h-5 text-emerald-500" />
                    <div>
                        <p className="text-xs font-bold text-emerald-700">Todas completas!</p>
                        <p className="text-[10px] text-emerald-600">Volte amanhã para mais.</p>
                    </div>
                </div>
            )}
        </div>
    );
};
