import { supabase } from './supabase';

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: string;
    points_reward: number;
    unlocked_at?: string;
}

export const gamificationService = {
    /**
     * Get all achievements and mark which ones the user has unlocked
     */
    getAchievements: async (): Promise<Achievement[]> => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return [];

        const [achievementsRes, userAchievementsRes] = await Promise.all([
            supabase.from('achievements').select('*'),
            supabase.from('user_achievements').select('*').eq('user_id', session.user.id)
        ]);

        if (achievementsRes.error) return [];

        const unlockedIds = new Set((userAchievementsRes.data || []).map(ua => ua.achievement_id));

        return achievementsRes.data.map(ach => ({
            ...ach,
            unlocked_at: (userAchievementsRes.data || []).find(ua => ua.achievement_id === ach.id)?.unlocked_at
        }));
    },

    /**
     * Unlock an achievement for the current user. Returns the achievement data if newly unlocked.
     */
    unlockAchievement: async (achievementId: string): Promise<Achievement | null> => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return null;

            const { data, error } = await supabase
                .from('user_achievements')
                .insert({
                    user_id: session.user.id,
                    achievement_id: achievementId
                })
                .select(`
                    *,
                    achievements (*)
                `)
                .single();

            // Ignore uniqueness constraint errors (already unlocked)
            if (error) {
                if (error.code !== '23505') {
                    console.error('[Gamification] Error unlocking achievement:', error);
                }
                return null;
            }

            return data?.achievements as Achievement;
        } catch (error) {
            console.error('[Gamification] Error unlocking achievement:', error);
            return null;
        }
    },

    /**
     * Get user's total points based on unlocked achievements AND completed daily quests
     */
    getTotalPoints: async (): Promise<number> => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return 0;

        const { data, error } = await supabase
            .from('user_achievements')
            .select(`
                achievement_id,
                achievements (points_reward)
            `)
            .eq('user_id', session.user.id);

        let dbPoints = 0;
        if (!error && data) {
            dbPoints = (data as any[]).reduce((total, item) => total + (item.achievements?.points_reward || 0), 0);
        }

        // Add Quest Points (LocalStorage source for now)
        const questPoints = parseInt(localStorage.getItem('quest_total_points') || '0');

        return dbPoints + questPoints;
    }
};
