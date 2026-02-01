-- ============================================
-- Open Finance Cron Job Configuration
-- Migration: 20260201_openfinance_cron.sql
-- ============================================

-- Enable pg_net extension for HTTP calls from cron
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create a function to call the sync endpoint
CREATE OR REPLACE FUNCTION public.trigger_openfinance_sync()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Get secrets from vault (if available) or use direct values
  SELECT decrypted_secret INTO supabase_url 
  FROM vault.decrypted_secrets 
  WHERE name = 'supabase_url' 
  LIMIT 1;
  
  SELECT decrypted_secret INTO service_role_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'service_role_key' 
  LIMIT 1;
  
  -- Fallback: use environment variable pattern
  IF supabase_url IS NULL THEN
    supabase_url := 'https://qjdldorozbawnohcdgwe.supabase.co';
  END IF;
  
  -- Make HTTP request to sync function
  PERFORM extensions.http_post(
    url := supabase_url || '/functions/v1/openfinance_sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
    ),
    body := '{}'::jsonb
  );
  
  RAISE LOG 'Open Finance sync triggered at %', now();
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Open Finance sync trigger failed: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.trigger_openfinance_sync IS 'Triggers Open Finance sync via Edge Function';

-- Schedule cron job to run every 6 hours
SELECT cron.unschedule('openfinance-sync-job') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'openfinance-sync-job'
);

SELECT cron.schedule(
  'openfinance-sync-job',
  '0 */6 * * *',  -- Every 6 hours (at minute 0)
  'SELECT public.trigger_openfinance_sync();'
);
