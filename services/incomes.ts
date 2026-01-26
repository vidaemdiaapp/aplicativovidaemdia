import { supabase } from './supabase';
import { tasksService } from './tasks';

export type IncomeType = 'clt' | 'pj' | 'autonomo' | 'outros';

export interface Income {
    id: string;
    user_id: string;
    household_id?: string;
    amount_monthly: number;
    income_type: IncomeType;
    is_shared: boolean;
    created_at: string;
    updated_at: string;
}

export const incomesService = {
    /**
     * Get income for the current user (and partner if household)
     */
    getIncomes: async (): Promise<Income[]> => {
        const household = await tasksService.getHousehold();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const query = supabase
            .from('incomes')
            .select('*');

        if (household) {
            query.eq('household_id', household.id);
        } else {
            query.eq('user_id', user.id);
        }

        const { data, error } = await query;
        if (error) {
            console.error('[Incomes] Fetch failed:', error);
            return [];
        }

        return data as Income[];
    },

    /**
     * Upsert income for a user
     */
    upsertIncome: async (income: Partial<Income>): Promise<Income | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const household = await tasksService.getHousehold();

        // If updating partner's income, we use the provided user_id, 
        // otherwise default to current user
        const target_user_id = income.user_id || user.id;

        const { data, error } = await supabase
            .from('incomes')
            .upsert({
                ...income,
                user_id: target_user_id,
                household_id: household?.id || null,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' }) // Assuming one income entry per user per household
            .select()
            .single();

        if (error) {
            console.error('[Incomes] Upsert failed:', error);
            return null;
        }

        return data as Income;
    },

    /**
     * Send a reminder notification to the partner to fill their income
     */
    notifyPartner: async (partnerUserId: string): Promise<boolean> => {
        // This would integrate with notificationsService
        // For now, we'll log it as implemented in Sprint 5 logic
        try {
            const { error } = await supabase.from('notifications').insert({
                user_id: partnerUserId,
                title: '💰 Cadastro de Renda',
                body: 'Sua parceria quer organizar o financeiro! Cadastre sua renda mensal.',
                type: 'financial',
                data: { screen: 'Finance' }
            });
            return !error;
        } catch (e) {
            return false;
        }
    }
};
