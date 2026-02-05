CREATE OR REPLACE FUNCTION public.get_daily_total(target_household_id uuid, target_date date)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    total numeric;
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO total
    FROM tasks
    WHERE household_id = target_household_id
      AND entry_type = 'immediate'
      AND purchase_date = target_date;
    
    RETURN total;
END;
$function$
