import { supabase } from './supabase';

import { Task, Category, Household, HouseholdInvite, HouseholdMember } from '../types';
import { ActionPlan, ACTION_PLAYBOOKS, DEFAULT_PLAN } from '../constants/playbooks';

export type { Task, Category, Household, HouseholdInvite, HouseholdMember, ActionPlan };

let householdCache: Household | null = null;

export const tasksService = {
    /**
     * Clear household cache (useful for logout or multi-household apps)
     */
    clearCache: () => {
        householdCache = null;
    },

    /**
     * Get Decision Action Plan for a task
     */
    getTaskActionPlan: (task: Task): ActionPlan => {
        if (!task.category_id || !task.health_status) return DEFAULT_PLAN;

        const categoryPlans = ACTION_PLAYBOOKS[task.category_id];
        if (!categoryPlans) return DEFAULT_PLAN;

        return categoryPlans[task.health_status] || DEFAULT_PLAN;
    },

    /**
     * Get all tasks for the current user's active household
     */
    getUserTasks: async (): Promise<Task[]> => {
        try {
            const household = await tasksService.getHousehold();
            if (!household) return [];

            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('household_id', household.id)
                .order('due_date', { ascending: true });

            if (error) throw error;

            // Auto-update overdue status
            const today = new Date().toISOString().split('T')[0];
            return (data || []).map(task => ({
                ...task,
                status: task.status === 'pending' && task.due_date && task.due_date < today
                    ? 'overdue'
                    : task.status
            })) as Task[];
        } catch (error) {
            console.error('[Tasks] Failed to fetch tasks:', error);
            return [];
        }
    },

    /**
     * Get tasks by category for active household
     */
    getTasksByCategory: async (categoryId: string): Promise<Task[]> => {
        const household = await tasksService.getHousehold();
        if (!household) return [];

        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('household_id', household.id)
            .eq('category_id', categoryId)
            .order('due_date', { ascending: true });

        if (error) {
            console.error('[Tasks] Failed to fetch tasks by category:', error);
            return [];
        }

        return data as Task[];
    },

    /**
     * Get a single task by ID
     */
    getTask: async (taskId: string): Promise<Task | null> => {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .single();

        if (error) {
            console.error('[Tasks] Failed to fetch task:', error);
            return null;
        }

        return data as Task;
    },

    /**
     * Create a new task
     */
    createTask: async (task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Task | null> => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;
        const user = session.user;

        const household = await tasksService.getHousehold();
        if (!household) return null;

        const { data, error } = await supabase
            .from('tasks')
            .insert({
                ...task,
                user_id: user.id,
                household_id: household.id,
                owner_user_id: user.id // Default to creator
            })
            .select()
            .single();

        if (error) {
            console.error('[Tasks] Failed to create task:', error);
            return null;
        }

        return data as Task;
    },

    /**
     * Update a task
     */
    updateTask: async (taskId: string, updates: Partial<Task>): Promise<Task | null> => {
        const { data, error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', taskId)
            .select()
            .single();

        if (error) {
            console.error('[Tasks] Failed to update task:', error);
            return null;
        }

        return data as Task;
    },

    /**
     * Delete a task
     */
    deleteTask: async (taskId: string): Promise<boolean> => {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId);

        if (error) {
            console.error('[Tasks] Failed to delete task:', error);
            return false;
        }

        return true;
    },

    /**
     * Mark task as completed
     */
    completeTask: async (taskId: string): Promise<Task | null> => {
        return tasksService.updateTask(taskId, { status: 'completed' });
    },

    /**
     * Get all categories
     */
    getCategories: async (): Promise<Category[]> => {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('label');

        if (error) {
            console.error('[Tasks] Failed to fetch categories:', error);
            return [];
        }

        return data as Category[];
    },

    /**
     * Get category stats (count by category)
     */
    getCategoryStats: async (): Promise<Record<string, number>> => {
        const household = await tasksService.getHousehold();
        if (!household) return {};

        const { data, error } = await supabase
            .from('tasks')
            .select('category_id')
            .eq('household_id', household.id)
            .neq('status', 'completed');

        if (error) {
            console.error('[Tasks] Failed to fetch category stats:', error);
            return {};
        }

        const stats: Record<string, number> = {};
        (data || []).forEach(task => {
            if (task.category_id) {
                stats[task.category_id] = (stats[task.category_id] || 0) + 1;
            }
        });

        return stats;
    },
    /**
     * Get user's household with members
     */
    getHousehold: async (): Promise<Household | null> => {
        if (householdCache) return householdCache;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;
        const user = session.user;

        let householdId: string | null = null;

        // 1. Try active_household_id from profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('active_household_id')
            .eq('id', user.id)
            .single();

        if (profile?.active_household_id) {
            householdId = profile.active_household_id;
        } else {
            // 2. Fallback: Find first household membership
            const { data: membership } = await supabase
                .from('household_members')
                .select('household_id')
                .eq('user_id', user.id)
                .limit(1)
                .single();
            householdId = membership?.household_id || null;
        }

        if (!householdId) return null;

        // 3. Fetch household details and members
        const { data: household, error } = await supabase
            .from('households')
            .select(`
                *,
                members:household_members(
                    user_id,
                    role,
                    joined_at,
                    profile:profiles(full_name, avatar_url)
                )
            `)
            .eq('id', householdId)
            .single();

        if (error) {
            console.error('[Tasks] Failed to fetch household:', error);
            return null;
        }

        householdCache = household as any;
        return householdCache;
    },

    /**
     * Invite a member to household
     */
    inviteMember: async (email: string): Promise<{ success: boolean; token?: string; error?: string }> => {
        const household = await tasksService.getHousehold();
        if (!household) return { success: false, error: 'No household found' };

        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        const { error } = await supabase
            .from('household_invites')
            .insert({
                household_id: household.id,
                email,
                token
            });

        if (error) return { success: false, error: error.message };
        return { success: true, token };
    },

    /**
     * Get pending invites
     */
    getInvites: async (): Promise<HouseholdInvite[]> => {
        const household = await tasksService.getHousehold();
        if (!household) return [];

        const { data, error } = await supabase
            .from('household_invites')
            .select('*')
            .eq('household_id', household.id)
            .eq('status', 'pending');

        if (error) return [];
        return data as HouseholdInvite[];
    },
    /**
     * Accept an invite
     */
    acceptInvite: async (token: string): Promise<{ success: boolean; error?: string }> => {
        const { data, error } = await supabase
            .rpc('accept_household_invite', { token_input: token });

        if (error) return { success: false, error: error.message };
        return data as { success: boolean; error?: string };
    },

    getAssignableMembers: async (): Promise<HouseholdMember[]> => {
        const household = await tasksService.getHousehold();
        if (!household || !household.members) return [];
        return household.members;
    },

    /**
     * Compute Household Status via RPC
     */
    computeHouseholdStatus: async (): Promise<{
        household_status: 'ok' | 'attention' | 'risk';
        counts: { ok: number; attention: number; risk: number };
        top_priorities: Task[];
    } | null> => {
        const household = await tasksService.getHousehold();
        if (!household) return null;

        const { data, error } = await supabase
            .rpc('compute_household_status', { target_household_id: household.id });

        if (error) {
            console.error('[Tasks] Failed to compute status:', error);
            return null;
        }

        return data as any;
    },

    /**
     * Trigger pattern detection
     */
    detectRecurrencePatterns: async (): Promise<number> => {
        const household = await tasksService.getHousehold();
        if (!household) return 0;

        const { data, error } = await supabase.rpc('detect_recurrence_patterns', {
            target_household_id: household.id
        });

        if (error) {
            console.error('[Tasks] Detection failed:', error);
            return 0;
        }
        return (data as any).detected_and_updated;
    },

    /**
     * Get Monthly Forecast
     * Returns:
     * 1. Pending tasks for the current month
     * 2. Overdue tasks
     */
    getMonthlyForecast: async (): Promise<{
        pending_total: number;
        items: Task[];
        month_name: string;
    }> => {
        const household = await tasksService.getHousehold();
        if (!household) return { pending_total: 0, items: [], month_name: '' };

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        endOfMonth.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('household_id', household.id)
            .neq('status', 'completed')
            .gte('due_date', startOfMonth.toISOString().split('T')[0])
            .lte('due_date', endOfMonth.toISOString().split('T')[0]);

        if (error) {
            console.error('[Tasks] Forecast failed:', error);
            return { pending_total: 0, items: [], month_name: '' };
        }

        const total = (data || []).reduce((acc, curr) => {
            const val = typeof curr.amount === 'number' ? curr.amount : parseFloat(curr.amount || '0');
            return acc + val;
        }, 0);

        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

        return {
            pending_total: total,
            items: data as Task[],
            month_name: monthNames[new Date().getMonth()]
        };
    },

    /**
     * Get recent completed activity for the household
     */
    getRecentActivity: async (): Promise<Task[]> => {
        const household = await tasksService.getHousehold();
        if (!household) return [];

        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('household_id', household.id)
            .eq('status', 'completed')
            .order('updated_at', { ascending: false })
            .limit(3);

        if (error) {
            console.error('[Tasks] Activity failed:', error);
            return [];
        }

        return data as Task[];
    },

    /**
     * Compute full financial status for the dashboard
     */
    computeFinancialStatus: async (): Promise<{
        total_income: number;
        total_commitments: number;
        balance: number;
        status: 'surplus' | 'warning' | 'deficit';
    } | null> => {
        const household = await tasksService.getHousehold();
        if (!household) return null;

        const { data, error } = await supabase
            .rpc('get_full_financial_report', { target_household_id: household.id });

        if (error) {
            console.error('[Tasks] Financial report failed:', error);
            return null;
        }

        return Array.isArray(data) ? data[0] : data;
    },

    /**
     * Get monthly evolution data (last 6 months)
     */
    getMonthlyEvolution: async (): Promise<{ month: string; income: number; expense: number }[]> => {
        const household = await tasksService.getHousehold();
        if (!household) return [];

        const { data, error } = await supabase
            .rpc('get_monthly_evolution', { target_household_id: household.id });

        if (error) {
            console.error('[Tasks] Evolution failed:', error);
            return [];
        }

        return data || [];
    }
};
