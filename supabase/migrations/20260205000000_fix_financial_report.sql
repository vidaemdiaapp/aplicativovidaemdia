CREATE OR REPLACE FUNCTION public.get_full_financial_report(target_household_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    total_income numeric;
    total_bills numeric;
    total_immediate numeric;
    total_cards numeric;
    items_without_amount integer;
    total_expenses numeric;
    result json;
BEGIN
    -- 1. Sum ALL incomes in the household (Removed "is_shared=true" restriction)
    -- This ensures that for single users or non-shared incomes, the value still appears.
    SELECT COALESCE(SUM(amount_monthly), 0) INTO total_income
    FROM incomes
    WHERE household_id = target_household_id; 

    -- 2. Sum pending bills (fixed expenses) for the current month
    SELECT COALESCE(SUM(amount), 0) INTO total_bills
    FROM tasks
    WHERE household_id = target_household_id
      AND status != 'completed'
      AND entry_type = 'bill'
      AND (
          (due_date >= date_trunc('month', now())::date AND due_date < (date_trunc('month', now()) + interval '1 month')::date)
          OR (is_recurring = true)
      );

    -- 3. Sum immediate expenses (daily gastos) for the current month
    SELECT COALESCE(SUM(amount), 0) INTO total_immediate
    FROM tasks
    WHERE household_id = target_household_id
      AND entry_type = 'immediate'
      AND (
          (purchase_date >= date_trunc('month', now())::date AND purchase_date < (date_trunc('month', now()) + interval '1 month')::date)
          OR (created_at >= date_trunc('month', now()))
      );

    -- 4. Sum ALL credit card balances (Removed "is_shared=true" restriction if it existed, but kept check)
    -- Assuming credit cards in a household are relevant to the household report.
    SELECT COALESCE(SUM(current_balance), 0) INTO total_cards
    FROM credit_cards
    WHERE household_id = target_household_id;

    -- 5. Count tasks without amount for current month (bills only)
    SELECT COUNT(*) INTO items_without_amount
    FROM tasks
    WHERE household_id = target_household_id
      AND status != 'completed'
      AND amount IS NULL
      AND entry_type = 'bill'
      AND (
          (due_date >= date_trunc('month', now())::date AND due_date < (date_trunc('month', now()) + interval '1 month')::date)
          OR (is_recurring = true)
      );

    total_expenses := total_bills + total_immediate + total_cards;

    result := json_build_object(
        'total_income', total_income,
        'total_bills', total_bills,
        'total_immediate', total_immediate,
        'total_cards', total_cards,
        'total_expenses', total_expenses,
        'total_commitments', total_expenses, -- Backward compatibility
        'balance', total_income - total_expenses,
        'items_without_amount', items_without_amount,
        'status', CASE
            WHEN (total_income - total_expenses) > (total_income * 0.1) THEN 'surplus'
            WHEN (total_income - total_expenses) >= 0 THEN 'warning'
            ELSE 'deficit'
        END
    );

    RETURN result;
END;
$function$;
