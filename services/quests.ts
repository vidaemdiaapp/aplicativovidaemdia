import { gamificationService } from './gamification';

export interface Quest {
    id: string;
    title: string;
    description: string;
    icon: string;
    target: number;
    progress: number;
    points: number;
    status: 'pending' | 'completed';
    type: 'login' | 'add_transaction' | 'review_dashboard' | 'check_subscriptions';
}

const QUEST_TEMPLATES: Omit<Quest, 'id' | 'status' | 'progress'>[] = [
    {
        type: 'login',
        title: 'Check-in Financeiro',
        description: 'Abra o app para manter o foco.',
        icon: '👋',
        target: 1,
        points: 50
    },
    {
        type: 'add_transaction',
        title: 'Registro Rápido',
        description: 'Registre uma despesa ou receita recente.',
        icon: '📝',
        target: 1,
        points: 100
    },
    {
        type: 'review_dashboard',
        title: 'Olhar do Dono',
        description: 'Analise seus gráficos de gastos.',
        icon: '📊',
        target: 1,
        points: 75
    },
    {
        type: 'check_subscriptions',
        title: 'Caça-Fantasmas',
        description: 'Verifique suas assinaturas ativas.',
        icon: '👻',
        target: 1,
        points: 150
    }
];

export const questsService = {
    getDailyQuests: (): Quest[] => {
        const today = new Date().toISOString().split('T')[0];
        const stored = localStorage.getItem('daily_quests');
        const lastDate = localStorage.getItem('daily_quests_date');

        if (stored && lastDate === today) {
            return JSON.parse(stored);
        }

        // Generate new quests for today
        const newQuests = QUEST_TEMPLATES.map((tmpl, index) => ({
            ...tmpl,
            id: `quest_${today}_${index}`,
            status: 'pending' as const,
            progress: 0
        })).slice(0, 3); // Pick first 3 for simplicity, or randomize

        localStorage.setItem('daily_quests', JSON.stringify(newQuests));
        localStorage.setItem('daily_quests_date', today);

        return newQuests;
    },

    updateProgress: (type: Quest['type'], amount: number = 1) => {
        const quests = questsService.getDailyQuests();
        let changed = false;

        const updated = quests.map(q => {
            if (q.type === type && q.status === 'pending') {
                const newProgress = Math.min(q.progress + amount, q.target);
                if (newProgress >= q.target) {
                    // Complete quest!
                    changed = true;
                    // Add to total points
                    const currentTotal = parseInt(localStorage.getItem('quest_total_points') || '0');
                    localStorage.setItem('quest_total_points', (currentTotal + q.points).toString());

                    return { ...q, progress: newProgress, status: 'completed' as const };
                }
                changed = true;
                return { ...q, progress: newProgress };
            }
            return q;
        });

        if (changed) {
            localStorage.setItem('daily_quests', JSON.stringify(updated));
            // Dispatch event for UI updates
            window.dispatchEvent(new Event('quests_updated'));
            // Dispatch achievements event so the header updates (gamificationService will pick up changes on re-fetch)
            window.dispatchEvent(new Event('points_updated'));
        }
    },

    checkQuestCompletion: (type: Quest['type']): Quest | undefined => {
        const quests = questsService.getDailyQuests();
        return quests.find(q => q.type === type && q.status === 'completed');
    },

    getTotalPoints: (): number => {
        const storedTotal = localStorage.getItem('quest_total_points');
        return storedTotal ? parseInt(storedTotal) : 0;
    }
};
