-- Migration for Agenda Module (Calendar Events, Tags and Reminders)
-- Created: 2026-01-29 19:48

-- 1. CALENDAR TAGS
CREATE TABLE IF NOT EXISTS public.calendar_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL, -- Hex code
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CALENDAR EVENTS
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    link TEXT,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    tag_id UUID REFERENCES public.calendar_tags(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled')),
    recurrence_rrule TEXT, -- iCal RRULE format
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_dates CHECK (all_day OR end_at > start_at)
);

-- 3. EVENT REMINDERS
CREATE TABLE IF NOT EXISTS public.event_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
    minutes_before INTEGER NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('push', 'whatsapp', 'email')),
    scheduled_for TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed', 'canceled')),
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INDICES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_start ON public.calendar_events(user_id, start_at);
CREATE INDEX IF NOT EXISTS idx_calendar_tags_user ON public.calendar_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_event_reminders_status_date ON public.event_reminders(status, scheduled_for);

-- 5. RLS POLICIES
ALTER TABLE public.calendar_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;

-- Tags policies
CREATE POLICY "Users can manage their own tags" ON public.calendar_tags
    FOR ALL USING (auth.uid() = user_id);

-- Events policies
CREATE POLICY "Users can manage their own events" ON public.calendar_events
    FOR ALL USING (auth.uid() = user_id);

-- Reminders policies (via event ownership)
CREATE POLICY "Users can manage their own reminders" ON public.event_reminders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.calendar_events 
            WHERE calendar_events.id = event_reminders.event_id 
            AND calendar_events.user_id = auth.uid()
        )
    );

-- 6. TRIGGER FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_update_tags_updated_at BEFORE UPDATE ON public.calendar_tags FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_update_events_updated_at BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_update_reminders_updated_at BEFORE UPDATE ON public.event_reminders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 7. INITIAL TAGS TRIGGER
CREATE OR REPLACE FUNCTION public.initialize_user_calendar_tags()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.calendar_tags (user_id, name, color)
    VALUES 
        (NEW.id, 'Pessoal', '#0ea5e9'), -- Sky 500
        (NEW.id, 'Trabalho', '#6366f1'), -- Indigo 500
        (NEW.id, 'Lazer', '#f59e0b'), -- Amber 500
        (NEW.id, 'Saúde', '#10b981'), -- Emerald 500
        (NEW.id, 'Família', '#ec4899'); -- Pink 500
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: In a real environment, you would attach this to the auth.users insert.
-- For existing projects, consider a manual one-time insert or an RPC.
