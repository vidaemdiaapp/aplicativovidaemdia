import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Trophy, Star, Lock, Unlock, Palette,
    Layout, Zap, Crown, Sparkles, CheckCircle2, ShoppingBag
} from 'lucide-react';
import { gamificationService } from '../services/gamification';
import { questsService } from '../services/quests';
import { toast } from 'react-hot-toast';
import { useCelebration } from '../contexts/CelebrationContext';

interface RewardItem {
    id: string;
    type: 'theme' | 'icon' | 'badge' | 'feature';
    title: string;
    description: string;
    cost: number;
    icon: any;
    color: string;
}

const REWARDS: RewardItem[] = [
    {
        id: 'theme_midnight',
        type: 'theme',
        title: 'Midnight Purple',
        description: 'Um tema escuro elegante com toques de roxo profundo.',
        cost: 500,
        icon: Palette,
        color: 'text-purple-500'
    },
    {
        id: 'theme_emerald',
        type: 'theme',
        title: 'Emerald Wealth',
        description: 'Tema focado em prosperidade com tons de esmeralda.',
        cost: 800,
        icon: Layout,
        color: 'text-emerald-500'
    },
    {
        id: 'icon_golden_cfo',
        type: 'icon',
        title: 'Golden CFO',
        description: 'Ícone de perfil exclusivo dourado para mestres das finanças.',
        cost: 2000,
        icon: Crown,
        color: 'text-yellow-500'
    },
    {
        id: 'badge_early_adopter',
        type: 'badge',
        title: 'Badge: Early Adopter',
        description: 'Insígnia exclusiva para usuários pioneiros.',
        cost: 100,
        icon: Star,
        color: 'text-blue-500'
    },
    {
        id: 'feature_zen_mode',
        type: 'feature',
        title: 'Modo Zen',
        description: 'Funcionalidade para ocultar todos os valores da interface.',
        cost: 300,
        icon: Zap,
        color: 'text-cyan-500'
    }
];

export const RewardsStoreScreen: React.FC = () => {
    const navigate = useNavigate();
    const { celebrate } = useCelebration();
    const [totalPoints, setTotalPoints] = useState(0);
    const [unlockedItems, setUnlockedItems] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Calculate total available points
            const achievementsPoints = await gamificationService.getTotalPoints();
            const questsPoints = questsService.getTotalPoints();
            const spentPoints = parseInt(localStorage.getItem('spent_points') || '0');

            setTotalPoints((achievementsPoints + questsPoints) - spentPoints);

            // Load unlocked items
            const unlocked = JSON.parse(localStorage.getItem('unlocked_rewards') || '[]');
            setUnlockedItems(unlocked);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = (item: RewardItem) => {
        if (totalPoints < item.cost) {
            toast.error('Pontos insuficientes!');
            return;
        }

        // Deduct points
        const currentSpent = parseInt(localStorage.getItem('spent_points') || '0');
        localStorage.setItem('spent_points', (currentSpent + item.cost).toString());

        // Unlock item
        const newUnlocked = [...unlockedItems, item.id];
        setUnlockedItems(newUnlocked);
        localStorage.setItem('unlocked_rewards', JSON.stringify(newUnlocked));

        // Update state
        setTotalPoints(prev => prev - item.cost);

        // Celebration
        celebrate({
            title: 'Recompensa desbloqueada!',
            description: `Você adquiriu ${item.title}`,
            points: 0,
            icon: ShoppingBag
        });

        toast.success('Compra realizada com sucesso!');
    };

    const formatPoints = (val: number) => val.toLocaleString('pt-BR');

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Header */}
            <header className="bg-slate-900 pt-14 pb-12 px-6 relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />

                <div className="flex items-center gap-4 relative z-10 mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold">Loja de Pontos</h1>
                </div>

                <div className="flex items-center justify-between relative z-10">
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Seu Saldo</p>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-4xl font-black bg-gradient-to-r from-yellow-300 to-amber-500 bg-clip-text text-transparent">
                                {formatPoints(totalPoints)}
                            </h2>
                            <span className="text-sm font-bold text-amber-500">PTS</span>
                        </div>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 p-0.5 shadow-lg shadow-amber-500/20">
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                            <Trophy className="w-8 h-8 text-yellow-400" />
                        </div>
                    </div>
                </div>
            </header>

            <div className="px-6 -mt-6 relative z-20 space-y-4">
                {REWARDS.map(item => {
                    const isUnlocked = unlockedItems.includes(item.id);
                    const canAfford = totalPoints >= item.cost;

                    return (
                        <div key={item.id} className={`bg-white rounded-3xl p-5 border shadow-sm transition-all ${isUnlocked ? 'border-emerald-100 opacity-80' : 'border-slate-100'
                            }`}>
                            <div className="flex items-start gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isUnlocked ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 ' + item.color
                                    }`}>
                                    {isUnlocked ? <CheckCircle2 className="w-7 h-7" /> : <item.icon className="w-7 h-7" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-slate-900">{item.title}</h3>
                                        {isUnlocked ? (
                                            <span className="text-[10px] font-black bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full uppercase tracking-wider">
                                                Comprado
                                            </span>
                                        ) : (
                                            <div className="flex items-center gap-1 text-amber-500">
                                                <Sparkles className="w-3 H-3" />
                                                <span className="font-black text-sm">{formatPoints(item.cost)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                                        {item.description}
                                    </p>

                                    {!isUnlocked && (
                                        <button
                                            onClick={() => handlePurchase(item)}
                                            disabled={!canAfford}
                                            className={`mt-4 w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${canAfford
                                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10 active:scale-95 hover:bg-slate-800'
                                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                }`}
                                        >
                                            {canAfford ? 'Resgatar Recompensa' : 'Pontos Insuficientes'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
