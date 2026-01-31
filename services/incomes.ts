import { supabase } from './supabase';
import { tasksService } from './tasks';

export type IncomeType = 'clt' | 'pj' | 'autonomo' | 'outros';
export type IncomeSource = 'salary' | 'freelance' | 'rental' | 'investments' | 'benefits' | 'pension' | 'other';

export interface Income {
    id: string;
    user_id: string;
    household_id?: string;
    amount_monthly: number;
    income_type: IncomeType;
    source: IncomeSource;
    description?: string;
    is_shared: boolean;
    is_partner?: boolean;
    created_at: string;
    updated_at: string;
}


export const incomesService = {
    /**
     * Get income for the current user (and partner if household)
     */
    getIncomes: async (): Promise<Income[]> => {
        const household = await tasksService.getHousehold();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return [];
        const user = session.user;

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
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;
        const user = session.user;

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
        try {
            const { error } = await supabase.from('notifications').insert({
                user_id: partnerUserId,
                title: '💰 Cadastro de Renda',
                body: 'Sua parceria quer organizar o financeiro! Cadastre sua renda mensal.',
                type: 'info',
                data: { screen: 'FinancialDashboard' }
            });
            return !error;
        } catch (e) {
            return false;
        }
    },

    /**
     * Request a change to partner's income
     */
    requestIncomeChange: async (partnerUserId: string, amount: number, type?: string): Promise<boolean> => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return false;
        const user = session.user;

        const household = await tasksService.getHousehold();
        if (!household) return false;

        const { error } = await supabase
            .from('income_change_requests')
            .insert({
                household_id: household.id,
                requested_by: user.id,
                target_user_id: partnerUserId,
                proposed_amount: amount,
                proposed_type: type,
                status: 'pending'
            });

        if (error) {
            console.error('[Incomes] Request failed:', error);
            return false;
        }

        // Notify partner
        await supabase.from('notifications').insert({
            user_id: partnerUserId,
            title: '📝 Solicitação de Ajuste',
            body: `${user.user_metadata?.full_name || 'Seu parceiro(a)'} sugeriu um ajuste na sua renda registrada.`,
            type: 'attention',
            data: { screen: 'FinancialDashboard' }
        });

        return true;
    },

    /**
     * Get pending requests for the current user to approve
     */
    getPendingRequests: async (): Promise<any[]> => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return [];
        const user = session.user;

        const { data, error } = await supabase
            .from('income_change_requests')
            .select(`
                *,
                requester:profiles!requested_by(full_name)
            `)
            .eq('target_user_id', user.id)
            .eq('status', 'pending');

        return data || [];
    },

    /**
     * Resolve a request (approve/reject)
     */
    resolveIncomeRequest: async (requestId: string, status: 'approved' | 'rejected'): Promise<boolean> => {
        const { data: request, error: fetchError } = await supabase
            .from('income_change_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (fetchError || !request) return false;

        if (status === 'approved') {
            await incomesService.upsertIncome({
                user_id: request.target_user_id,
                amount_monthly: request.proposed_amount,
                income_type: request.proposed_type as any
            });
        }

        const { error } = await supabase
            .from('income_change_requests')
            .update({ status, resolved_at: new Date().toISOString() })
            .eq('id', requestId);

        return !error;
    },

    /**
     * Delete an income entry
     */
    deleteIncome: async (incomeId: string): Promise<boolean> => {
        const { error } = await supabase
            .from('incomes')
            .delete()
            .eq('id', incomeId);

        if (error) {
            console.error('[Incomes] Delete failed:', error);
            return false;
        }
        return true;
    }
};
