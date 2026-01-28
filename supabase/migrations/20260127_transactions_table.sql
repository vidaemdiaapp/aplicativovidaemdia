-- Migration for Transactions Table
-- Purpose: Store financial transactions for expense tracking and categorization

-- 1. Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    household_id uuid REFERENCES households(id),
    
    -- Transaction details
    title text NOT NULL,
    amount numeric NOT NULL DEFAULT 0,
    category_id text,
    transaction_type text CHECK (transaction_type IN ('expense', 'income', 'transfer')) DEFAULT 'expense',
    
    -- Dates
    transaction_date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Metadata
    description text,
    payment_method text CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'pix', 'transfer', 'other')),
    is_recurring boolean DEFAULT false,
    source_task_id uuid REFERENCES tasks(id), -- Link to task if generated from completed task
    
    -- Sharing
    is_shared boolean DEFAULT true
);

-- 2. Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 3. Policies for transactions
-- Users can manage their own transactions
CREATE POLICY "Users can manage their own transactions" ON transactions
    FOR ALL USING (auth.uid() = user_id);

-- Household members can view shared transactions
CREATE POLICY "Household members can view shared transactions" ON transactions
    FOR SELECT USING (
        household_id IN (
            SELECT h_m.household_id FROM household_members h_m WHERE h_m.user_id = auth.uid()
        ) AND (is_shared = true OR user_id = auth.uid())
    );

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_household_date 
    ON transactions(household_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category 
    ON transactions(household_id, category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type_date 
    ON transactions(household_id, transaction_type, transaction_date);

-- 5. RPC for aggregated transactions by category
CREATE OR REPLACE FUNCTION get_transactions_by_category(
    target_household_id uuid,
    start_date date,
    end_date date,
    tx_type text DEFAULT 'expense'
)
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'categories', (
            SELECT json_agg(cat_data ORDER BY total DESC)
            FROM (
                SELECT 
                    category_id as category,
                    COALESCE(SUM(amount), 0) as total,
                    COUNT(*) as count
                FROM transactions
                WHERE household_id = target_household_id
                  AND transaction_type = tx_type
                  AND transaction_date >= start_date
                  AND transaction_date <= end_date
                GROUP BY category_id
                LIMIT 5
            ) cat_data
        ),
        'total', (
            SELECT COALESCE(SUM(amount), 0)
            FROM transactions
            WHERE household_id = target_household_id
              AND transaction_type = tx_type
              AND transaction_date >= start_date
              AND transaction_date <= end_date
        ),
        'period', json_build_object('start', start_date, 'end', end_date)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger to auto-create transaction when task is completed
CREATE OR REPLACE FUNCTION create_transaction_from_task()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create transaction if task has amount and is being completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.amount > 0 THEN
        INSERT INTO transactions (
            user_id,
            household_id,
            title,
            amount,
            category_id,
            transaction_type,
            transaction_date,
            source_task_id,
            is_shared
        ) VALUES (
            COALESCE(NEW.owner_user_id, NEW.user_id),
            NEW.household_id,
            NEW.title,
            NEW.amount,
            NEW.category_id,
            'expense',
            NEW.due_date,
            NEW.id,
            COALESCE(NEW.is_joint, true)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS task_completion_transaction_trigger ON tasks;
CREATE TRIGGER task_completion_transaction_trigger
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION create_transaction_from_task();
