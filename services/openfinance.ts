/**
 * Open Finance Service
 * Gerencia integração com contas bancárias via Belvo
 */

import { supabase } from './supabase';

// Types
export interface OpenFinanceLink {
    id: string;
    user_id: string;
    provider: string;
    provider_link_id: string | null;
    institution_name: string | null;
    status: 'pending' | 'connecting' | 'connected' | 'error' | 'revoked' | 'expired';
    consent_expires_at: string | null;
    last_synced_at: string | null;
    error_message: string | null;
    created_at: string;
    updated_at: string;
}

export interface OpenFinanceAccount {
    id: string;
    link_id: string;
    provider_account_id: string;
    name: string | null;
    type: string | null;
    subtype: string | null;
    currency: string;
    balance_current: number | null;
    balance_available: number | null;
    last_balance_at: string | null;
    created_at: string;
}

export interface OpenFinanceTransaction {
    id: string;
    account_id: string;
    provider_transaction_id: string;
    amount: number;
    type: string | null;
    status: string | null;
    category: string | null;
    description: string | null;
    merchant_name: string | null;
    transaction_date: string;
    created_at: string;
}

export interface ConnectStartResponse {
    link_id: string;
    connect_url: string;
}

// Service
export const openFinanceService = {
    /**
     * Inicia o fluxo de conexão bancária
     * Retorna link_id e connect_url para abrir no browser
     */
    async startConnection(): Promise<ConnectStartResponse> {
        console.log('[OpenFinance] Starting connection...');

        const { data, error } = await supabase.functions.invoke('openfinance_connect_start');

        if (error) {
            // Extrair context com status e body para debug
            const ctx: any = (error as any).context ?? {};
            const errorDetails = `status=${ctx.status ?? 'unknown'} body=${JSON.stringify(ctx.body ?? error.message)}`;
            console.error('[OpenFinance] connect_start failed:', errorDetails, error);
            throw new Error(`Falha ao iniciar conexão: ${errorDetails}`);
        }

        if (!data?.connect_url) {
            console.error('[OpenFinance] No connect_url in response:', data);
            throw new Error('URL de conexão não recebida');
        }

        console.log('[OpenFinance] Connection started, link_id:', data.link_id);
        return data as ConnectStartResponse;
    },

    /**
     * Lista todos os links de conexão do usuário
     */
    async getLinks(): Promise<OpenFinanceLink[]> {
        const { data, error } = await supabase
            .from('openfinance_links')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[OpenFinance] Get links error:', error);
            throw error;
        }

        return data || [];
    },

    /**
     * Obtém um link específico
     */
    async getLink(linkId: string): Promise<OpenFinanceLink | null> {
        const { data, error } = await supabase
            .from('openfinance_links')
            .select('*')
            .eq('id', linkId)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('[OpenFinance] Get link error:', error);
            throw error;
        }

        return data;
    },

    /**
     * Lista contas bancárias de um link
     */
    async getAccounts(linkId?: string): Promise<OpenFinanceAccount[]> {
        let query = supabase
            .from('openfinance_accounts')
            .select('*')
            .order('name', { ascending: true });

        if (linkId) {
            query = query.eq('link_id', linkId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[OpenFinance] Get accounts error:', error);
            throw error;
        }

        return data || [];
    },

    /**
     * Lista transações de uma conta ou todas
     */
    async getTransactions(
        accountId?: string,
        options?: { limit?: number; offset?: number; startDate?: string; endDate?: string }
    ): Promise<OpenFinanceTransaction[]> {
        let query = supabase
            .from('openfinance_transactions')
            .select('*')
            .order('transaction_date', { ascending: false });

        if (accountId) {
            query = query.eq('account_id', accountId);
        }

        if (options?.startDate) {
            query = query.gte('transaction_date', options.startDate);
        }

        if (options?.endDate) {
            query = query.lte('transaction_date', options.endDate);
        }

        if (options?.limit) {
            query = query.limit(options.limit);
        }

        if (options?.offset) {
            query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[OpenFinance] Get transactions error:', error);
            throw error;
        }

        return data || [];
    },

    /**
     * Resume das contas conectadas
     */
    async getSummary(): Promise<{
        totalBalance: number;
        accountCount: number;
        transactionCount: number;
        lastSync: string | null;
    }> {
        const [accounts, links] = await Promise.all([
            this.getAccounts(),
            this.getLinks()
        ]);

        const connectedLinks = links.filter(l => l.status === 'connected');
        const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance_current || 0), 0);
        const lastSync = connectedLinks
            .map(l => l.last_synced_at)
            .filter(Boolean)
            .sort()
            .pop() || null;

        // Count transactions (limited query)
        const { count } = await supabase
            .from('openfinance_transactions')
            .select('id', { count: 'exact', head: true });

        return {
            totalBalance,
            accountCount: accounts.length,
            transactionCount: count || 0,
            lastSync
        };
    },

    /**
     * Desconecta um link (marca como revogado)
     */
    async disconnectLink(linkId: string): Promise<void> {
        const { error } = await supabase
            .from('openfinance_links')
            .update({ status: 'revoked', updated_at: new Date().toISOString() })
            .eq('id', linkId);

        if (error) {
            console.error('[OpenFinance] Disconnect link error:', error);
            throw error;
        }
    },

    /**
     * Verifica status de saúde das conexões
     */
    getConnectionHealth(links: OpenFinanceLink[]): 'healthy' | 'warning' | 'disconnected' {
        if (links.length === 0) return 'disconnected';

        const connected = links.filter(l => l.status === 'connected');
        const hasErrors = links.some(l => ['error', 'revoked', 'expired'].includes(l.status));

        if (connected.length === 0) return 'disconnected';
        if (hasErrors) return 'warning';
        return 'healthy';
    }
};
