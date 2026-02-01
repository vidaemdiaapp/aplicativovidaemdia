-- ============================================
-- Open Finance Integration - Tables & Indexes
-- Migration: 20260201_openfinance_tables.sql
-- ============================================

-- Tabela: openfinance_links (links de conexão bancária)
CREATE TABLE IF NOT EXISTS public.openfinance_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'belvo',
    provider_link_id TEXT UNIQUE,
    institution_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'connecting', 'connected', 'error', 'revoked', 'expired')),
    consent_expires_at TIMESTAMPTZ,
    last_synced_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.openfinance_links IS 'Links de conexão Open Finance via Belvo';
COMMENT ON COLUMN public.openfinance_links.provider_link_id IS 'ID do link no provedor (Belvo)';
COMMENT ON COLUMN public.openfinance_links.status IS 'Status: pending, connecting, connected, error, revoked, expired';

-- Tabela: openfinance_accounts (contas bancárias vinculadas)
CREATE TABLE IF NOT EXISTS public.openfinance_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID NOT NULL REFERENCES public.openfinance_links(id) ON DELETE CASCADE,
    provider_account_id TEXT NOT NULL,
    name TEXT,
    type TEXT,
    subtype TEXT,
    currency TEXT DEFAULT 'BRL',
    balance_current NUMERIC(18, 2),
    balance_available NUMERIC(18, 2),
    last_balance_at TIMESTAMPTZ,
    raw JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(link_id, provider_account_id)
);

COMMENT ON TABLE public.openfinance_accounts IS 'Contas bancárias sincronizadas via Open Finance';

-- Tabela: openfinance_transactions (transações)
CREATE TABLE IF NOT EXISTS public.openfinance_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.openfinance_accounts(id) ON DELETE CASCADE,
    provider_transaction_id TEXT NOT NULL,
    amount NUMERIC(18, 2) NOT NULL,
    type TEXT,
    status TEXT,
    category TEXT,
    description TEXT,
    merchant_name TEXT,
    transaction_date DATE NOT NULL,
    raw JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(account_id, provider_transaction_id)
);

COMMENT ON TABLE public.openfinance_transactions IS 'Transações sincronizadas via Open Finance';
COMMENT ON COLUMN public.openfinance_transactions.provider_transaction_id IS 'ID único da transação no provedor - garante idempotência';

-- Tabela: openfinance_sync_logs (logs de sincronização)
CREATE TABLE IF NOT EXISTS public.openfinance_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID NOT NULL REFERENCES public.openfinance_links(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('running', 'success', 'error')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ,
    accounts_fetched INT DEFAULT 0,
    transactions_fetched INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.openfinance_sync_logs IS 'Logs de sincronização Open Finance';

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_openfinance_links_user 
    ON public.openfinance_links(user_id);

CREATE INDEX IF NOT EXISTS idx_openfinance_links_provider 
    ON public.openfinance_links(provider_link_id);

CREATE INDEX IF NOT EXISTS idx_openfinance_links_status 
    ON public.openfinance_links(status);

CREATE INDEX IF NOT EXISTS idx_openfinance_accounts_link 
    ON public.openfinance_accounts(link_id);

CREATE INDEX IF NOT EXISTS idx_openfinance_transactions_account 
    ON public.openfinance_transactions(account_id);

CREATE INDEX IF NOT EXISTS idx_openfinance_transactions_date 
    ON public.openfinance_transactions(transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_openfinance_sync_logs_link 
    ON public.openfinance_sync_logs(link_id);

-- ============================================
-- TRIGGER: updated_at automático
-- ============================================

CREATE OR REPLACE FUNCTION update_openfinance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_openfinance_links_updated ON public.openfinance_links;
CREATE TRIGGER trg_openfinance_links_updated
    BEFORE UPDATE ON public.openfinance_links
    FOR EACH ROW EXECUTE FUNCTION update_openfinance_updated_at();

DROP TRIGGER IF EXISTS trg_openfinance_accounts_updated ON public.openfinance_accounts;
CREATE TRIGGER trg_openfinance_accounts_updated
    BEFORE UPDATE ON public.openfinance_accounts
    FOR EACH ROW EXECUTE FUNCTION update_openfinance_updated_at();

-- ============================================
-- RLS: Row Level Security
-- ============================================

ALTER TABLE public.openfinance_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.openfinance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.openfinance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.openfinance_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS: openfinance_links - usuário vê/gerencia apenas seus links
DROP POLICY IF EXISTS "Users can view own links" ON public.openfinance_links;
CREATE POLICY "Users can view own links"
    ON public.openfinance_links FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own links" ON public.openfinance_links;
CREATE POLICY "Users can insert own links"
    ON public.openfinance_links FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own links" ON public.openfinance_links;
CREATE POLICY "Users can update own links"
    ON public.openfinance_links FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own links" ON public.openfinance_links;
CREATE POLICY "Users can delete own links"
    ON public.openfinance_links FOR DELETE
    USING (auth.uid() = user_id);

-- RLS: openfinance_accounts - acesso via link do usuário
DROP POLICY IF EXISTS "Users can view accounts via link" ON public.openfinance_accounts;
CREATE POLICY "Users can view accounts via link"
    ON public.openfinance_accounts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.openfinance_links
            WHERE id = openfinance_accounts.link_id
            AND user_id = auth.uid()
        )
    );

-- RLS: openfinance_transactions - acesso via account -> link
DROP POLICY IF EXISTS "Users can view transactions via account" ON public.openfinance_transactions;
CREATE POLICY "Users can view transactions via account"
    ON public.openfinance_transactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.openfinance_accounts a
            JOIN public.openfinance_links l ON a.link_id = l.id
            WHERE a.id = openfinance_transactions.account_id
            AND l.user_id = auth.uid()
        )
    );

-- RLS: openfinance_sync_logs - somente service role (sem policies para usuários)
-- Nenhuma policy = apenas service role pode acessar
