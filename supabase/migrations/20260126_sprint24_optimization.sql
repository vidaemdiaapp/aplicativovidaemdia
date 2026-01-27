-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  monthly_limit_tokens integer NOT NULL,
  features jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Seed basic plans
INSERT INTO subscription_plans (id, name, monthly_limit_tokens, features)
VALUES 
  ('free', 'Gratuito', 100000, '{"multas": true, "defesa": false}'::jsonb),
  ('pro', 'Pro', 1000000, '{"multas": true, "defesa": true}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Create ai_usage_logs table
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  model text NOT NULL,
  tokens_input integer DEFAULT 0,
  tokens_output integer DEFAULT 0,
  cost_estimated numeric(10, 6) DEFAULT 0,
  domain text,
  action_type text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for logs (users can only see their own usage)
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage logs"
  ON ai_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Update profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS plan_id text REFERENCES subscription_plans(id) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS usage_current_month integer DEFAULT 0;

-- Update knowledge_facts table for expiration
ALTER TABLE knowledge_facts
ADD COLUMN IF NOT EXISTS expires_at timestamptz,
ADD COLUMN IF NOT EXISTS last_verified_at timestamptz DEFAULT now();

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON ai_usage_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_facts_expires_at ON knowledge_facts(expires_at);
