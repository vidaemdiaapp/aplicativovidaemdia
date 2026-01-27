import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!supabaseUrl || !supabaseServiceKey) throw new Error('Missing Supabase environment variables')

        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const now = new Date().toISOString()

        // 1. Cleanup expired facts from knowledge_facts
        // Only delete if expired more than 7 days ago to keep some history, or delete immediately if desired.
        // Let's delete immediately for strict cleanup.
        const { error: deletionError, count } = await supabase
            .from('knowledge_facts')
            .delete({ count: 'exact' })
            .lt('expires_at', now)

        if (deletionError) throw deletionError

        console.log(`[Cron] Cleaned up ${count} expired facts.`)

        // 2. Reset monthly usage on the 1st of the month
        // This logic runs every time but only acts on the 1st.
        // Ideally this should be a separate scheduled task but for MVP we check date.
        const today = new Date()
        if (today.getDate() === 1) {
            // Reset usage_current_month for all profiles
            const { error: resetError } = await supabase
                .from('profiles')
                .update({ usage_current_month: 0 })
                .gt('usage_current_month', 0) // Only update those with usage > 0

            if (resetError) console.error('[Cron] Error resetting monthly usage:', resetError)
            else console.log('[Cron] Monthly usage reset checked/executed.')
        }

        return new Response(JSON.stringify({ success: true, deleted_count: count }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
