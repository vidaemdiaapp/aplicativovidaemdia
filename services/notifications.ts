/**
 * Sprint 5 — Notification Service
 * Last Updated: 2026-01-25 22:55 (Sync Fix)
 */
import { supabase } from './supabase';

const isWeb = typeof window !== 'undefined' && !('expo' in window);

export interface AppNotification {
    id: string;
    title: string;
    body: string;
    type: 'risk' | 'attention' | 'info';
    related_task_id: string | null;
    created_at: string;
    read_at: string | null;
}

export const notificationsService = {
    registerDevice: async () => {
        if (isWeb) {
            console.log('[Notifications] Push ignored on web');
            return null;
        }

        try {
            // Composite strings to completely bypass Vite's static analysis on web
            const deviceLib = ['expo', 'device'].join('-');
            const notifLib = ['expo', 'notifications'].join('-');
            const rnLib = ['react', 'native'].join('-');

            const Device = await import(/* @vite-ignore */ deviceLib);
            const Notifications = await import(/* @vite-ignore */ notifLib);
            const { Platform } = await import(/* @vite-ignore */ rnLib);

            if (!Device.isDevice) {
                console.log('Must use physical device for Push Notifications');
                return null;
            }

            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.warn('Failed to get push token for push notification!');
                return null;
            }

            const token = (await Notifications.getExpoPushTokenAsync({
                projectId: '924dbbf2-374b-420a-aeda-fe61fb22fd72'
            })).data;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

            const { error } = await supabase
                .from('device_tokens')
                .upsert({
                    user_id: user.id,
                    token,
                    platform
                }, { onConflict: 'token' });

            if (error) {
                console.error('[Notifications] Error registering token:', error);
            }

            return token;
        } catch (e) {
            console.warn('[Notifications] Mobile dependencies not available:', e);
            return null;
        }
    },

    listenForNotifications: (callback: (data: any) => void) => {
        if (isWeb) return () => { };

        let subscription: any = null;
        const notifLib = ['expo', 'notifications'].join('-');

        import(/* @vite-ignore */ notifLib).then(Notifications => {
            subscription = Notifications.addNotificationResponseReceivedListener(response => {
                const data = response.notification.request.content.data;
                callback(data);
            });
        }).catch(e => console.warn('[Notifications] Could not setup listener:', e));

        return () => {
            if (subscription) subscription.remove();
        };
    },

    getNotifications: async (householdId: string): Promise<AppNotification[]> => {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('household_id', householdId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Notifications] Error fetching notifications:', error);
            return [];
        }
        return data as AppNotification[];
    },

    markAsRead: async (notificationId: string) => {
        const { error } = await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', notificationId);

        if (error) {
            console.error('[Notifications] Error marking as read:', error);
        }
    }
};
