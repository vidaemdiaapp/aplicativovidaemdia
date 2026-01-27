import { supabase } from './supabase';
import { IRPFEstimate } from '../types';

export const taxService = {
    /**
     * Get IRPF Estimate for the current user and year
     */
    getIRPFEstimate: async (year: number = new Date().getFullYear()): Promise<IRPFEstimate | null> => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return null;
            const user = session.user;

            const { data, error } = await supabase
                .rpc('get_irpf_estimate', {
                    target_user_id: user.id,
                    target_year: year
                });

            if (error) throw error;
            return data as IRPFEstimate;
        } catch (error) {
            console.error('[TaxService] Failed to fetch IR estimate:', error);
            return null;
        }
    },

    /**
     * Update user IR estimation preference
     */
    updateTaxPreference: async (enabled: boolean): Promise<boolean> => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return false;
            const user = session.user;

            const { error } = await supabase
                .from('profiles')
                .update({ estimate_ir: enabled })
                .eq('id', user.id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('[TaxService] Failed to update preference:', error);
            return false;
        }
    },

    /**
     * Get user profile with tax preferences
     */
    getUserTaxPreference: async (): Promise<boolean> => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return false;
            const user = session.user;

            const { data, error } = await supabase
                .from('profiles')
                .select('estimate_ir')
                .eq('id', user.id)
                .single();

            if (error) return false;
            return !!data?.estimate_ir;
        } catch (error) {
            return false;
        }
    },

    /**
     * Get Declaration Readiness checklist
     */
    getDeclarationReadiness: async (year: number = new Date().getFullYear()): Promise<any> => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return null;
            const user = session.user;

            const { data, error } = await supabase.rpc('get_declaration_readiness', {
                target_user_id: user.id,
                target_year: year
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('[TaxService] Failed to fetch readiness:', error);
            return null;
        }
    }
};
