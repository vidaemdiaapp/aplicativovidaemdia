import { supabase } from './supabase';
import { tasksService } from './tasks';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface CreditCard {
    id: string;
    user_id: string;
    household_id: string;
    name: string;
    last_four_digits: string | null;
    brand: 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard' | 'outros';
    credit_limit: number;
    current_balance: number;
    closing_day: number;
    due_day: number;
    is_shared: boolean;
    color: string;
    created_at: string;
    updated_at: string;
}

export interface CreditCardTransaction {
    id: string;
    card_id: string;
    household_id: string;
    title: string;
    amount: number;
    transaction_date: string;
    installment_current: number;
    installment_total: number;
    category_id: string | null;
    is_third_party: boolean;
    third_party_name: string | null;
    third_party_type: 'reembolso' | 'rateio' | null;
    reimbursement_status: 'pending' | 'requested' | 'received';
    created_at: string;
    updated_at: string;
}

export interface SavingsGoal {
    id: string;
    user_id: string;
    household_id: string;
    name: string;
    goal_type: 'emergency' | 'objective' | 'automatic' | 'tax';
    target_amount: number;
    current_amount: number;
    deadline: string | null;
    auto_deposit_enabled: boolean;
    auto_deposit_amount: number | null;
    auto_deposit_frequency: 'weekly' | 'monthly' | null;
    is_locked: boolean;
    color: string;
    icon: string;
    created_at: string;
    updated_at: string;
}

export interface SavingsTransaction {
    id: string;
    goal_id: string;
    amount: number;
    transaction_type: 'deposit' | 'withdrawal';
    note: string | null;
    created_at: string;
}

export interface Investment {
    id: string;
    user_id: string;
    household_id: string;
    name: string;
    type: 'stocks' | 'fixed_income' | 'real_estate' | 'crypto' | 'savings' | 'other';
    institution: string | null;
    current_value: number;
    invested_value: number;
    yield_rate: number;
    last_updated: string;
    is_automatic: boolean;
    external_id: string | null;
    metadata: any;
    created_at: string;
    updated_at: string;
}

export interface PortfolioSummary {
    total_value: number;
    total_invested: number;
    total_yield: number;
    yield_percentage: number;
    count: number;
    allocations: { type: string; value: number; percentage: number }[];
}

export interface BudgetLimit {
    id: string;
    user_id: string;
    household_id: string;
    category_id: string | null;
    card_id: string | null;
    limit_type: 'general' | 'category' | 'card';
    limit_amount: number;
    period: 'weekly' | 'monthly' | 'yearly';
    alert_threshold_70: boolean;
    alert_threshold_90: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// ═══════════════════════════════════════════════════════════════
// Credit Cards Service
// ═══════════════════════════════════════════════════════════════

export const creditCardsService = {
    getAll: async (): Promise<CreditCard[]> => {
        const household = await tasksService.getHousehold();
        if (!household) return [];

        const { data, error } = await supabase
            .from('credit_cards')
            .select('*')
            .eq('household_id', household.id)
            .order('name');

        if (error) {
            console.error('[CreditCards] Error fetching cards:', error);
            return [];
        }
        return data || [];
    },

    getById: async (id: string): Promise<CreditCard | null> => {
        const { data, error } = await supabase
            .from('credit_cards')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return data;
    },

    create: async (card: Omit<CreditCard, 'id' | 'user_id' | 'household_id' | 'created_at' | 'updated_at'>): Promise<CreditCard | null> => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;

        const household = await tasksService.getHousehold();
        if (!household) return null;

        const { data, error } = await supabase
            .from('credit_cards')
            .insert({
                ...card,
                user_id: session.user.id,
                household_id: household.id
            })
            .select()
            .single();

        if (error) {
            console.error('[CreditCards] Error creating card:', error);
            return null;
        }
        return data;
    },

    update: async (id: string, updates: Partial<CreditCard>): Promise<CreditCard | null> => {
        const { data, error } = await supabase
            .from('credit_cards')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[CreditCards] Error updating card:', error);
            return null;
        }
        return data;
    },

    delete: async (id: string): Promise<boolean> => {
        const { error } = await supabase
            .from('credit_cards')
            .delete()
            .eq('id', id);

        return !error;
    },

    getTransactions: async (cardId: string, month?: string): Promise<CreditCardTransaction[]> => {
        let query = supabase
            .from('credit_card_transactions')
            .select('*')
            .eq('card_id', cardId)
            .order('transaction_date', { ascending: false });

        if (month) {
            const startDate = `${month}-01`;
            const endDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0)
                .toISOString().split('T')[0];
            query = query.gte('transaction_date', startDate).lte('transaction_date', endDate);
        }

        const { data, error } = await query;
        if (error) {
            console.error('[CreditCards] Error fetching transactions:', error);
            return [];
        }
        return data || [];
    },

    addTransaction: async (transaction: Omit<CreditCardTransaction, 'id' | 'created_at' | 'updated_at'>): Promise<CreditCardTransaction | null> => {
        const household = await tasksService.getHousehold();

        const { data, error } = await supabase
            .from('credit_card_transactions')
            .insert({
                ...transaction,
                household_id: household?.id
            })
            .select()
            .single();

        if (error) {
            console.error('[CreditCards] Error adding transaction:', error);
            return null;
        }

        // Update card balance
        const card = await creditCardsService.getById(transaction.card_id);
        if (card) {
            await creditCardsService.update(transaction.card_id, {
                current_balance: card.current_balance + transaction.amount
            });
        }

        return data;
    },

    getThirdPartyExpenses: async (): Promise<CreditCardTransaction[]> => {
        const household = await tasksService.getHousehold();
        if (!household) return [];

        const { data, error } = await supabase
            .from('credit_card_transactions')
            .select('*')
            .eq('household_id', household.id)
            .eq('is_third_party', true)
            .neq('reimbursement_status', 'received')
            .order('transaction_date', { ascending: false });

        if (error) return [];
        return data || [];
    },

    markAsReimbursed: async (transactionId: string): Promise<boolean> => {
        const { error } = await supabase
            .from('credit_card_transactions')
            .update({ reimbursement_status: 'received', updated_at: new Date().toISOString() })
            .eq('id', transactionId);

        return !error;
    }
};

// ═══════════════════════════════════════════════════════════════
// Savings Goals Service
// ═══════════════════════════════════════════════════════════════

export const savingsGoalsService = {
    getAll: async (): Promise<SavingsGoal[]> => {
        const household = await tasksService.getHousehold();
        if (!household) return [];

        const { data, error } = await supabase
            .from('savings_goals')
            .select('*')
            .eq('household_id', household.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[SavingsGoals] Error fetching goals:', error);
            return [];
        }
        return data || [];
    },

    getById: async (id: string): Promise<SavingsGoal | null> => {
        const { data, error } = await supabase
            .from('savings_goals')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return data;
    },

    create: async (goal: Omit<SavingsGoal, 'id' | 'user_id' | 'household_id' | 'current_amount' | 'created_at' | 'updated_at'>): Promise<SavingsGoal | null> => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;

        const household = await tasksService.getHousehold();
        if (!household) return null;

        const { data, error } = await supabase
            .from('savings_goals')
            .insert({
                ...goal,
                user_id: session.user.id,
                household_id: household.id,
                current_amount: 0
            })
            .select()
            .single();

        if (error) {
            console.error('[SavingsGoals] Error creating goal:', error);
            return null;
        }
        return data;
    },

    update: async (id: string, updates: Partial<SavingsGoal>): Promise<SavingsGoal | null> => {
        const { data, error } = await supabase
            .from('savings_goals')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[SavingsGoals] Error updating goal:', error);
            return null;
        }
        return data;
    },

    delete: async (id: string): Promise<boolean> => {
        const { error } = await supabase
            .from('savings_goals')
            .delete()
            .eq('id', id);

        return !error;
    },

    deposit: async (goalId: string, amount: number, note?: string): Promise<SavingsTransaction | null> => {
        const goal = await savingsGoalsService.getById(goalId);
        if (!goal || goal.is_locked) return null;

        // Create transaction
        const { data, error } = await supabase
            .from('savings_transactions')
            .insert({
                goal_id: goalId,
                amount,
                transaction_type: 'deposit',
                note
            })
            .select()
            .single();

        if (error) {
            console.error('[SavingsGoals] Error creating deposit:', error);
            return null;
        }

        // Update goal balance
        await savingsGoalsService.update(goalId, {
            current_amount: goal.current_amount + amount
        });

        return data;
    },

    withdraw: async (goalId: string, amount: number, note?: string): Promise<SavingsTransaction | null> => {
        const goal = await savingsGoalsService.getById(goalId);
        if (!goal || goal.is_locked) return null;
        if (goal.current_amount < amount) return null;

        // Create transaction
        const { data, error } = await supabase
            .from('savings_transactions')
            .insert({
                goal_id: goalId,
                amount,
                transaction_type: 'withdrawal',
                note
            })
            .select()
            .single();

        if (error) {
            console.error('[SavingsGoals] Error creating withdrawal:', error);
            return null;
        }

        // Update goal balance
        await savingsGoalsService.update(goalId, {
            current_amount: goal.current_amount - amount
        });

        return data;
    },

    getTransactions: async (goalId: string): Promise<SavingsTransaction[]> => {
        const { data, error } = await supabase
            .from('savings_transactions')
            .select('*')
            .eq('goal_id', goalId)
            .order('created_at', { ascending: false });

        if (error) return [];
        return data || [];
    },

    getTotalSaved: async (): Promise<number> => {
        const goals = await savingsGoalsService.getAll();
        return goals.reduce((acc, goal) => acc + goal.current_amount, 0);
    }
};

// ═══════════════════════════════════════════════════════════════
// Budget Limits Service
// ═══════════════════════════════════════════════════════════════

export const budgetLimitsService = {
    getAll: async (): Promise<BudgetLimit[]> => {
        const household = await tasksService.getHousehold();
        if (!household) return [];

        const { data, error } = await supabase
            .from('budget_limits')
            .select('*')
            .eq('household_id', household.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) return [];
        return data || [];
    },

    create: async (limit: Omit<BudgetLimit, 'id' | 'user_id' | 'household_id' | 'created_at' | 'updated_at'>): Promise<BudgetLimit | null> => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;

        const household = await tasksService.getHousehold();
        if (!household) return null;

        const { data, error } = await supabase
            .from('budget_limits')
            .insert({
                ...limit,
                user_id: session.user.id,
                household_id: household.id
            })
            .select()
            .single();

        if (error) return null;
        return data;
    },

    update: async (id: string, updates: Partial<BudgetLimit>): Promise<BudgetLimit | null> => {
        const { data, error } = await supabase
            .from('budget_limits')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) return null;
        return data;
    },

    delete: async (id: string): Promise<boolean> => {
        const { error } = await supabase
            .from('budget_limits')
            .update({ is_active: false })
            .eq('id', id);

        return !error;
    },

    async checkAlerts(householdId: string) {
        const { data, error } = await supabase.rpc('check_budget_alerts', {
            target_household_id: householdId
        });

        if (error) throw error;
        return data;
    }
};

// ═══════════════════════════════════════════════════════════════
// Investments Service
// ═══════════════════════════════════════════════════════════════

export const investmentsService = {
    async getAll() {
        const { data, error } = await supabase
            .from('investments')
            .select('*')
            .order('current_value', { ascending: false });

        if (error) throw error;
        return data as Investment[];
    },

    async getSummary() {
        const { data, error } = await supabase.rpc('get_portfolio_summary');
        if (error) throw error;
        return data as PortfolioSummary;
    },

    async create(investment: Omit<Investment, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'household_id' | 'last_updated'>) {
        const household = await tasksService.getHousehold();
        if (!household) throw new Error('No household found');

        const { data, error } = await supabase
            .from('investments')
            .insert([{
                ...investment,
                household_id: household.id,
                user_id: (await supabase.auth.getUser()).data.user?.id
            }])
            .select()
            .single();

        if (error) throw error;
        return data as Investment;
    },

    async updateValue(id: string, currentValue: number) {
        // First record history
        const { data: inv } = await supabase.from('investments').select('*').eq('id', id).single();
        if (inv) {
            await supabase.from('investment_history').insert([{
                investment_id: id,
                value: currentValue,
                yield_value: currentValue - inv.invested_value
            }]);
        }

        const { data, error } = await supabase
            .from('investments')
            .update({
                current_value: currentValue,
                last_updated: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Investment;
    }
};

// ═══════════════════════════════════════════════════════════════
// Open Finance Service (Simulated)
// ═══════════════════════════════════════════════════════════════

export const openFinanceService = {
    async getConnections() {
        const { data, error } = await supabase
            .from('open_finance_connections')
            .select('*');
        if (error) throw error;
        return data;
    },

    async connectInstitution(institutionId: string, institutionName: string) {
        const { data, error } = await supabase
            .from('open_finance_connections')
            .insert([{
                institution_id: institutionId,
                institution_name: institutionName,
                status: 'active',
                user_id: (await supabase.auth.getUser()).data.user?.id,
                consent_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async syncData() {
        // Mock sync logic
        console.log('[OpenFinance] Syncing data from all connections...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Insert simulated data if the list is empty to provide real feedback
        const { data: existing } = await supabase.from('investments').select('id').limit(1);

        if (!existing || existing.length === 0) {
            const { data: { user } } = await supabase.auth.getUser();
            const household = await tasksService.getHousehold();

            if (user && household) {
                await supabase.from('investments').insert([
                    {
                        user_id: user.id,
                        household_id: household.id,
                        name: 'Tesouro Selic 2029',
                        type: 'fixed_income',
                        institution: 'Nubank',
                        current_value: 12450.32,
                        invested_value: 11000.00,
                        yield_rate: 13.18,
                        is_automatic: true,
                        last_updated: new Date().toISOString()
                    },
                    {
                        user_id: user.id,
                        household_id: household.id,
                        name: 'FII XP Malls (XPML11)',
                        type: 'real_estate',
                        institution: 'XP Investimentos',
                        current_value: 5240.00,
                        invested_value: 4800.00,
                        yield_rate: 9.17,
                        is_automatic: true,
                        last_updated: new Date().toISOString()
                    },
                    {
                        user_id: user.id,
                        household_id: household.id,
                        name: 'Bitcoin (BTC)',
                        type: 'crypto',
                        institution: 'Binance',
                        current_value: 15720.50,
                        invested_value: 12000.00,
                        yield_rate: 31.00,
                        is_automatic: true,
                        last_updated: new Date().toISOString()
                    },
                    {
                        user_id: user.id,
                        household_id: household.id,
                        name: 'Ethereum (ETH)',
                        type: 'crypto',
                        institution: 'Mercado Bitcoin',
                        current_value: 8430.20,
                        invested_value: 7500.00,
                        yield_rate: 12.40,
                        is_automatic: true,
                        last_updated: new Date().toISOString()
                    }
                ]);
            }
        }

        return { success: true, message: 'Sincronização concluída com sucesso' };
    }
};
