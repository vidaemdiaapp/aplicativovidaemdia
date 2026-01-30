-- Migration to schedule the agenda reminder dispatcher
-- Note: This requires the pg_cron extension to be enabled in Supabase Dashboard

-- 1. Enable extension (if possible via migration, usually requires superuser)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Schedule the job to run every minute
-- NOTE: Replace YOUR_PROJECT_REF and ANON_KEY with actual values or use secrets in a real setup.
-- Since we can't hardcode sensitive keys safely in migration files without var substitution:
-- This is a TEMPLATE. In logic, we would use an edge function to self-schedule or manual dashboard setup.

-- Example of what the SQL command looks like:
/*
SELECT cron.schedule(
  'agenda-reminder-dispatcher',
  '* * * * *', -- Every minute
  $$
  select
    net.http_post(
        url:='https://qjdldorozbawnohcdgwe.supabase.co/functions/v1/agenda_reminder_dispatcher',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
*/

-- For this migration, we will just create a helper function that the user can call to simple trigger it for testing
-- or the user can set up the cron via dashboard.

CREATE OR REPLACE FUNCTION public.trigger_reminder_dispatcher()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This is a placeholder. In reality, you'd use pg_net to call the function.
    -- For now, this documents that the 'agenda_reminder_dispatcher' Edge Function
    -- should be invoked every minute.
    NULL; 
END;
$$;
