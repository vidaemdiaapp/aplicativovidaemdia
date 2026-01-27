import { supabase } from './supabase';

export const analytics = {
    logEvent: async (name: string, metadata: any = {}) => {
        try {
            await supabase.rpc('log_analytics_event', {
                name,
                meta: metadata
            });
        } catch (error) {
            // Silently fail analytics to not break UX
            console.warn('[Analytics] Failed to log:', name);
        }
    }
};
