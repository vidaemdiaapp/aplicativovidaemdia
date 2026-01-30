import { supabase } from './supabase';
import { CalendarEvent, CalendarTag, EventReminder } from '../types';
import { RRule, rrulestr } from 'rrule';
import { addMinutes, parseISO, formatISO } from 'date-fns';

export const agendaService = {
    // --- TAGS ---
    getTags: async () => {
        const { data, error } = await supabase
            .from('calendar_tags')
            .select('*')
            .order('name');

        if (error) throw error;

        if (!data || data.length === 0) {
            return await agendaService.createDefaultTags();
        }

        return data as CalendarTag[];
    },

    createDefaultTags: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const defaultTags = [
            { user_id: user.id, name: 'Pessoal', color: '#0ea5e9' },
            { user_id: user.id, name: 'Trabalho', color: '#6366f1' },
            { user_id: user.id, name: 'Lazer', color: '#f59e0b' },
            { user_id: user.id, name: 'Saúde', color: '#10b981' },
            { user_id: user.id, name: 'Família', color: '#ec4899' }
        ];

        const { data, error } = await supabase
            .from('calendar_tags')
            .insert(defaultTags)
            .select('*')
            .order('name');

        if (error) throw error;
        return data as CalendarTag[];
    },

    createTag: async (tag: Omit<CalendarTag, 'id' | 'user_id'>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('calendar_tags')
            .insert([{ ...tag, user_id: user.id }])
            .select()
            .single();

        if (error) throw error;
        return data as CalendarTag;
    },

    deleteTag: async (id: string) => {
        const { error } = await supabase
            .from('calendar_tags')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // --- EVENTS ---
    getEvents: async (start: Date, end: Date) => {
        const { data, error } = await supabase
            .from('calendar_events')
            .select('*, calendar_tags(*)')
            .gte('start_at', start.toISOString())
            .lte('start_at', end.toISOString())
            .eq('status', 'active');

        if (error) throw error;
        return data as (CalendarEvent & { calendar_tags: CalendarTag })[];
    },

    createEvent: async (event: Omit<CalendarEvent, 'id' | 'user_id' | 'status'>, reminders: number[]) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // 1. Insert Event
        const { data: eventData, error: eventError } = await supabase
            .from('calendar_events')
            .insert([{ ...event, user_id: user.id, status: 'active' }])
            .select()
            .single();

        if (eventError) throw eventError;

        // 2. Insert Reminders
        if (reminders.length > 0) {
            const reminderInserts = reminders.map(mins => ({
                event_id: eventData.id,
                minutes_before: mins,
                channel: 'push',
                scheduled_for: formatISO(addMinutes(parseISO(event.start_at), -mins)),
                status: 'scheduled'
            }));

            const { error: reminderError } = await supabase
                .from('event_reminders')
                .insert(reminderInserts);

            if (reminderError) console.error('Error creating reminders:', reminderError);
        }

        return eventData as CalendarEvent;
    },

    updateEvent: async (id: string, updates: Partial<CalendarEvent>, reminders?: number[]) => {
        // 1. Update Event
        const { data, error } = await supabase
            .from('calendar_events')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // 2. Update Reminders if start_at changed or reminders explicitly provided
        if (reminders || updates.start_at) {
            // Delete existing scheduled reminders
            await supabase
                .from('event_reminders')
                .delete()
                .eq('event_id', id)
                .eq('status', 'scheduled');

            // Use provided reminders OR fetch existing types if only start_at changed (simplified for MVP: needs explicit reminders list)
            if (reminders) {
                const startAt = updates.start_at || data.start_at;
                const reminderInserts = reminders.map(mins => ({
                    event_id: id,
                    minutes_before: mins,
                    channel: 'push',
                    scheduled_for: formatISO(addMinutes(parseISO(startAt), -mins)),
                    status: 'scheduled'
                }));
                await supabase.from('event_reminders').insert(reminderInserts);
            }
        }

        return data as CalendarEvent;
    },

    deleteEvent: async (id: string) => {
        const { error } = await supabase
            .from('calendar_events')
            .update({ status: 'canceled' })
            .eq('id', id);
        if (error) throw error;
    },

    // --- RECURRENCE HELPERS ---
    generateOccurrences: (event: CalendarEvent, rangeStart: Date, rangeEnd: Date) => {
        if (!event.recurrence_rrule) return [event];

        try {
            const rule = rrulestr(event.recurrence_rrule);
            const occurrences = rule.between(rangeStart, rangeEnd, true);

            const duration = parseISO(event.end_at).getTime() - parseISO(event.start_at).getTime();

            return occurrences.map(occ => ({
                ...event,
                id: `${event.id}-${occ.getTime()}`, // Virtual ID for list rendering
                start_at: formatISO(occ),
                end_at: formatISO(new Date(occ.getTime() + duration))
            }));
        } catch (e) {
            console.error('Error parsing RRULE:', e);
            return [event];
        }
    }
};
