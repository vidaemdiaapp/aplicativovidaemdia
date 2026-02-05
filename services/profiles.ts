import { supabase } from './supabase';
import { normalizePhoneBR } from './phoneUtils';

export const profilesService = {
    getProfile: async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('[Profiles] Error fetching profile:', error);
            return null;
        }
        return data;
    },

    updatePhone: async (userId: string, phone: string) => {
        const cleanPhone = normalizePhoneBR(phone);
        const phone_e164 = `+${cleanPhone}`;

        // 1. Update public.profiles
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                phone_digits: cleanPhone,
                phone_e164: phone_e164
            })
            .eq('id', userId);

        if (profileError) throw profileError;

        // 2. Update auth.metadata (important for ProtectedRoute check in App.tsx)
        const { error: authError } = await supabase.auth.updateUser({
            data: {
                phone_digits: cleanPhone,
                phone_e164: phone_e164
            }
        });

        if (authError) throw authError;
    }
};
