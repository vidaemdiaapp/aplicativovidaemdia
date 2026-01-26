-- Sprint 5 Migration: Push Notifications + Scheduler + Notification Center

-- 1. Add timezone to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';

-- 2. Ensure device_tokens and notifications tables have basic structures
-- (Assumes tables already exist, focusing on the changes and requirements)

-- device_tokens unique token check (if not already present)
-- ALTER TABLE public.device_tokens ADD CONSTRAINT device_tokens_token_key UNIQUE (token);

-- 3. RLS and Security
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own device tokens" ON public.device_tokens;
CREATE POLICY "Users can manage their own device tokens"
ON public.device_tokens
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
CREATE POLICY "Users can view their notifications"
ON public.notifications
FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = public.notifications.household_id
    AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can mark their notifications as read" ON public.notifications;
CREATE POLICY "Users can mark their notifications as read"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. RPC for Status Engine (Improved for Service Role)
CREATE OR REPLACE FUNCTION public.compute_household_status(target_household_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  task_record RECORD;
  current_date DATE := CURRENT_DATE;
  count_ok INT := 0;
  count_attention INT := 0;
  count_risk INT := 0;
  household_result_status TEXT := 'ok';
  top_priorities JSONB := '[]'::JSONB;
BEGIN
  IF auth.role() != 'service_role' AND NOT EXISTS (
    SELECT 1 FROM public.household_members 
    WHERE household_id = target_household_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  FOR task_record IN 
    SELECT * FROM public.tasks 
    WHERE household_id = target_household_id 
    AND status != 'completed'
  LOOP
    IF (task_record.due_date < current_date) OR 
       (task_record.due_date <= (current_date + 2) AND task_record.impact_level = 'high') THEN
       UPDATE public.tasks SET health_status = 'risk' WHERE id = task_record.id;
       count_risk := count_risk + 1;
    ELSIF (task_record.due_date IS NULL) OR 
          (task_record.due_date <= (current_date + 7)) THEN
       UPDATE public.tasks SET health_status = 'attention' WHERE id = task_record.id;
       count_attention := count_attention + 1;
    ELSE
       UPDATE public.tasks SET health_status = 'ok' WHERE id = task_record.id;
       count_ok := count_ok + 1;
    END IF;
  END LOOP;

  IF count_risk > 0 THEN
    household_result_status := 'risk';
  ELSIF count_attention > 0 THEN
    household_result_status := 'attention';
  ELSE
    household_result_status := 'ok';
  END IF;

  SELECT jsonb_agg(t) INTO top_priorities
  FROM (
    SELECT id, title, category_id, health_status, due_date, impact_level, amount
    FROM public.tasks
    WHERE household_id = target_household_id
    AND status != 'completed'
    AND health_status IN ('risk', 'attention')
    ORDER BY 
      CASE health_status WHEN 'risk' THEN 1 WHEN 'attention' THEN 2 ELSE 3 END,
      due_date ASC NULLS FIRST,
      CASE impact_level WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END
    LIMIT 5
  ) t;

  RETURN jsonb_build_object(
    'household_status', household_result_status,
    'counts', jsonb_build_object('ok', count_ok, 'attention', count_attention, 'risk', count_risk),
    'top_priorities', COALESCE(top_priorities, '[]'::JSONB)
  );
END;
$$;

-- 5. New Indexes
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON public.device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
