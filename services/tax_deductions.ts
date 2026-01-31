import { supabase } from './supabase';
import { tasksService } from './tasks';

export type DeductionType = 'health_plan' | 'medical' | 'education' | 'other' | 'health' | 'dependent' | 'pension' | 'pgbl';

export interface TaxDeductibleExpense {
    id: string;
    user_id: string;
    household_id?: string;
    doc_id?: string;
    expense_type: DeductionType;
    provider_name: string | null;
    amount: number;
    date: string;
    confidence_score?: number;
    is_shared: boolean;
    created_at: string;
}

export const taxDeductionsService = {
    /**
     * Get all deductible expenses for the current user/household
     */
    getDeductions: async (year?: number): Promise<TaxDeductibleExpense[]> => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return [];
            const user = session.user;

            let query = supabase
                .from('tax_deductible_expenses')
                .select('*')
                .order('date', { ascending: false });

            if (year) {
                const startDate = `${year}-01-01`;
                const endDate = `${year}-12-31`;
                query = query.gte('date', startDate).lte('date', endDate);
            }

            const { data, error } = await query;
            if (error) throw error;

            return data as TaxDeductibleExpense[];
        } catch (error) {
            console.error('[TaxDeductions] Failed to fetch:', error);
            return [];
        }
    },

    /**
     * Add a manual deduction
     */
    addDeduction: async (deduction: Partial<TaxDeductibleExpense>): Promise<boolean> => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return false;
            const user = session.user;

            const household = await tasksService.getHousehold();

            const { error } = await supabase
                .from('tax_deductible_expenses')
                .insert({
                    ...deduction,
                    user_id: user.id,
                    household_id: household?.id
                });

            return !error;
        } catch (error) {
            return false;
        }
    },

    /**
     * Delete a deduction
     */
    deleteDeduction: async (id: string): Promise<boolean> => {
        const { error } = await supabase
            .from('tax_deductible_expenses')
            .delete()
            .eq('id', id);
        return !error;
    }
};
