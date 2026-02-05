-- Create chat_memory table for long-term context
CREATE TABLE IF NOT EXISTS public.chat_memory (
    profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    summary_text TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policy for chat_memory (viewable by owner)
ALTER TABLE public.chat_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memory" ON public.chat_memory
    FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can update own memory" ON public.chat_memory
    FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own memory" ON public.chat_memory
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- Index for fast history retrieval in whatsapp_messages
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_profile_created 
    ON public.whatsapp_messages(profile_id, created_at DESC);
