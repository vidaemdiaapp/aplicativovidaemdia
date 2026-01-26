-- Migration for Sprint 10: Financial Module

-- 1. Add amount column to tasks if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'amount') THEN
        ALTER TABLE tasks ADD COLUMN amount numeric;
    END IF;
END $$;

-- 2. Create incomes table
CREATE TABLE IF NOT EXISTS incomes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    household_id uuid REFERENCES households(id),
    amount_monthly numeric DEFAULT 0,
    income_type text CHECK (income_type IN ('clt', 'pj', 'autonomo', 'outros')),
    is_shared boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

-- 4. Policies for incomes
-- Owners can do everything with their own income
CREATE POLICY "Users can manage their own income" ON incomes
    FOR ALL USING (auth.uid() = user_id);

-- Household members can view shared income
CREATE POLICY "Household members can view shared income" ON incomes
    FOR SELECT USING (
        household_id IN (
            SELECT h_m.household_id FROM household_members h_m WHERE h_m.user_id = auth.uid()
        ) AND (is_shared = true OR user_id = auth.uid())
    );

-- Household members can edit shared income (per user request: "pode editar sim")
CREATE POLICY "Household members can edit shared income" ON incomes
    FOR UPDATE USING (
        household_id IN (
            SELECT h_m.household_id FROM household_members h_m WHERE h_m.user_id = auth.uid()
        ) AND is_shared = true
    );

-- 5. Financial Report RPC
CREATE OR REPLACE FUNCTION get_full_financial_report(target_household_id uuid)
RETURNS json AS $$
DECLARE
    total_income numeric;
    total_commitments numeric;
    result json;
BEGIN
    -- Sum shared incomes in the household
    SELECT COALESCE(SUM(amount_monthly), 0) INTO total_income
    FROM incomes
    WHERE household_id = target_household_id AND is_shared = true;

    -- Sum pending tasks with amount for the current month
    SELECT COALESCE(SUM(amount), 0) INTO total_commitments
    FROM tasks
    WHERE household_id = target_household_id 
      AND status != 'completed'
      AND (
          (due_date >= date_trunc('month', now())::date AND due_date < (date_trunc('month', now()) + interval '1 month')::date)
          OR (is_recurring = true) -- Simplification: recurring tasks always count
      );

    result := json_build_object(
        'total_income', total_income,
        'total_commitments', total_commitments,
        'balance', total_income - total_commitments,
        'status', CASE 
            WHEN (total_income - total_commitments) > (total_income * 0.1) THEN 'surplus'
            WHEN (total_income - total_commitments) >= 0 THEN 'warning'
            ELSE 'deficit'
        END
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
