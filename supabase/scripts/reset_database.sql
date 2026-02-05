-- WARN: THIS SCRIPT WIPES ALL USER DATA
-- Preserves system configuration and schema.

BEGIN;

-- 1. WhatsApp & Chat
TRUNCATE TABLE public.whatsapp_messages CASCADE;
TRUNCATE TABLE public.whatsapp_leads CASCADE;
TRUNCATE TABLE public.chat_memory CASCADE;

-- 2. Financial & Tasks
TRUNCATE TABLE public.files CASCADE; -- If exists (users usually upload here)
TRUNCATE TABLE public.tasks CASCADE;
TRUNCATE TABLE public.transactions CASCADE; -- If exists
TRUNCATE TABLE public.incomes CASCADE;
TRUNCATE TABLE public.credit_card_transactions CASCADE;
TRUNCATE TABLE public.credit_cards CASCADE;
TRUNCATE TABLE public.budgets CASCADE;
TRUNCATE TABLE public.recurring_payments CASCADE;
TRUNCATE TABLE public.savings_goals CASCADE;
TRUNCATE TABLE public.savings_transactions CASCADE;
TRUNCATE TABLE public.investments CASCADE;
TRUNCATE TABLE public.investment_history CASCADE;

-- 3. Open Finance
TRUNCATE TABLE public.open_finance_connections CASCADE;
TRUNCATE TABLE public.openfinance_links CASCADE;
TRUNCATE TABLE public.openfinance_accounts CASCADE;
TRUNCATE TABLE public.openfinance_transactions CASCADE;
TRUNCATE TABLE public.openfinance_sync_logs CASCADE;

-- 4. Households & Profiles (Core)
TRUNCATE TABLE public.household_invites CASCADE;
TRUNCATE TABLE public.household_members CASCADE;
TRUNCATE TABLE public.households CASCADE;
TRUNCATE TABLE public.profiles CASCADE;

-- 5. Ancillary
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.notification_logs CASCADE;
TRUNCATE TABLE public.device_tokens CASCADE;
TRUNCATE TABLE public.audit_logs CASCADE; -- If exists
TRUNCATE TABLE public.ai_usage_logs CASCADE;
TRUNCATE TABLE public.traffic_fines CASCADE;
TRUNCATE TABLE public.tax_documents CASCADE;
TRUNCATE TABLE public.tax_deductible_expenses CASCADE;
TRUNCATE TABLE public.income_change_requests CASCADE;
TRUNCATE TABLE public.webhook_inbox CASCADE;
TRUNCATE TABLE public.invoices CASCADE;
TRUNCATE TABLE public.refunds CASCADE;
TRUNCATE TABLE public.subscriptions CASCADE; -- User subscriptions
TRUNCATE TABLE public.subscription_events CASCADE;
TRUNCATE TABLE public.data_deletion_requests CASCADE;
TRUNCATE TABLE public.knowledge_audit CASCADE;

COMMIT;
