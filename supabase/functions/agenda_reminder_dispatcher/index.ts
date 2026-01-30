import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 1. Get pending reminders
        const now = new Date().toISOString();

        // Fetch reminders scheduled for now or past, status 'scheduled'
        // Also join with event to get title, and user to get tokens
        const { data: reminders, error: fetchError } = await supabaseClient
            .from('event_reminders')
            .select(`
        id,
        minutes_before,
        event:calendar_events (
          id,
          title,
          user_id
        )
      `)
            .eq('status', 'scheduled')
            .lte('scheduled_for', now)
            .limit(50); // Batch size

        if (fetchError) throw fetchError;

        if (!reminders || reminders.length === 0) {
            return new Response(JSON.stringify({ message: 'No reminders to send' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const results = [];

        // 2. Process each reminder
        for (const reminder of reminders) {
            const event = reminder.event;
            if (!event) continue;

            // Get user tokens
            const { data: tokens, error: tokenError } = await supabaseClient
                .from('device_tokens')
                .select('token')
                .eq('user_id', event.user_id);

            if (tokenError || !tokens || tokens.length === 0) {
                // No tokens, mark as failed (or maybe sent-no-token if we want to stop retrying)
                await supabaseClient
                    .from('event_reminders')
                    .update({ status: 'failed', last_error: 'No device tokens found' })
                    .eq('id', reminder.id);
                results.push({ id: reminder.id, status: 'failed', reason: 'no_tokens' });
                continue;
            }

            // 3. Send Push via Expo
            const messages = tokens.map(t => ({
                to: t.token,
                sound: 'default',
                title: '⏰ Lembrete de Agenda',
                body: `Daqui a ${reminder.minutes_before} min: ${event.title}`,
                data: { url: `/agenda/${event.id}` },
            }));

            try {
                const response = await fetch('https://exp.host/--/api/v2/push/send', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Accept-encoding': 'gzip, deflate',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(messages),
                });

                // 4. Update status
                if (response.ok) {
                    await supabaseClient
                        .from('event_reminders')
                        .update({ status: 'sent', last_error: null })
                        .eq('id', reminder.id);
                    results.push({ id: reminder.id, status: 'sent' });
                } else {
                    const text = await response.text();
                    throw new Error(`Expo API error: ${text}`);
                }
            } catch (e: any) {
                console.error(`Error sending push for reminder ${reminder.id}:`, e);
                await supabaseClient
                    .from('event_reminders')
                    .update({ status: 'failed', last_error: e.message })
                    .eq('id', reminder.id);
                results.push({ id: reminder.id, status: 'failed', error: e.message });
            }
        }

        return new Response(JSON.stringify({ processed: results.length, details: results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
