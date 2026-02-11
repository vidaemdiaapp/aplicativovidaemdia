import { supabase } from './supabase';
import { tasksService } from './tasks';

export const coupleService = {
    /**
     * Generate an invite code for the partner
     */
    generateInviteCode: async (): Promise<string> => {
        // In a real scenario, we would save this to a 'household_invites' table
        // For now, we'll return a static UUID or a random string for the demo
        const household = await tasksService.getHousehold();
        if (!household) throw new Error('No household found');

        // Mock generation
        const code = `LOVE-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        // Save to localStorage for demo persistence
        localStorage.setItem(`invite_code_${household.id}`, code);

        return code;
    },

    /**
     * Join a household using a code
     */
    joinHousehold: async (code: string): Promise<boolean> => {
        // In real app: Validate code against DB, update user's profile to point to household_id
        // For this demo: We simulate "success" if the code matches a format

        if (!code.startsWith('LOVE-')) return false;

        // Mock: set a flag that we joined a couple household
        localStorage.setItem('has_partner', 'true');
        window.dispatchEvent(new Event('couple_status_changed'));

        return true;
    },

    /**
     * Get partner information
     */
    getPartner: async () => {
        const household = await tasksService.getHousehold();
        if (!household || !household.members || household.members.length < 2) {
            // Check mock override
            if (localStorage.getItem('has_partner') === 'true') {
                return {
                    name: 'Amor',
                    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
                    id: 'mock-partner-id'
                };
            }
            return null;
        }

        // Return the "other" member
        const currentUserId = (await supabase.auth.getUser()).data.user?.id;
        const partner = household.members.find(m => m.user_id !== currentUserId);

        return partner ? {
            name: partner.profile?.full_name || 'Parceiro',
            avatar_url: partner.profile?.avatar_url,
            id: partner.user_id
        } : null;
    }
};
