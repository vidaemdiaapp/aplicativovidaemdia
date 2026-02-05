export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            admin_users: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    role_id: string | null
                    is_active: boolean
                    last_login_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    role_id?: string | null
                    is_active?: boolean
                    last_login_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    role_id?: string | null
                    is_active?: boolean
                    last_login_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            admin_roles: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    created_at?: string
                }
            }
            admin_permissions: {
                Row: {
                    id: string
                    key: string
                    description: string | null
                    category: string | null
                }
                Insert: {
                    id?: string
                    key: string
                    description?: string | null
                    category?: string | null
                }
                Update: {
                    id?: string
                    key?: string
                    description?: string | null
                    category?: string | null
                }
            }
            admin_audit_logs: {
                Row: {
                    id: string
                    admin_id: string | null
                    action: string
                    entity_type: string
                    entity_id: string | null
                    before: Json | null
                    after: Json | null
                    reason: string | null
                    ip_address: string | null
                    user_agent: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    admin_id?: string | null
                    action: string
                    entity_type: string
                    entity_id?: string | null
                    before?: Json | null
                    after?: Json | null
                    reason?: string | null
                    ip_address?: string | null
                    user_agent?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    admin_id?: string | null
                    action?: string
                    entity_type?: string
                    entity_id?: string | null
                    before?: Json | null
                    after?: Json | null
                    reason?: string | null
                    ip_address?: string | null
                    user_agent?: string | null
                    created_at?: string
                }
            }
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    avatar_url: string | null
                    created_at: string | null
                    updated_at: string | null
                    active_household_id: string | null
                    timezone: string | null
                    plan_id: string | null
                    usage_current_month: number | null
                    onboarding_completed: boolean | null
                    taxpayer_type: string | null
                    selected_tax_year: number | null
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    avatar_url?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                    active_household_id?: string | null
                    timezone?: string | null
                    plan_id?: string | null
                    usage_current_month?: number | null
                    onboarding_completed?: boolean | null
                    taxpayer_type?: string | null
                    selected_tax_year?: number | null
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                    active_household_id?: string | null
                    timezone?: string | null
                    plan_id?: string | null
                    usage_current_month?: number | null
                    onboarding_completed?: boolean | null
                    taxpayer_type?: string | null
                    selected_tax_year?: number | null
                }
            }
            feature_flags: {
                Row: {
                    id: string
                    key: string
                    name: string
                    description: string | null
                    default_enabled: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    key: string
                    name: string
                    description?: string | null
                    default_enabled?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    key?: string
                    name?: string
                    description?: string | null
                    default_enabled?: boolean
                    created_at?: string
                }
            }
            plan_features: {
                Row: {
                    id: string
                    plan_id: string | null
                    feature_key: string | null
                    enabled: boolean | null
                    limits: Json | null
                }
                Insert: {
                    id?: string
                    plan_id?: string | null
                    feature_key?: string | null
                    enabled?: boolean | null
                    limits?: Json | null
                }
                Update: {
                    id?: string
                    plan_id?: string | null
                    feature_key?: string | null
                    enabled?: boolean | null
                    limits?: Json | null
                }
            }

            calendar_events: {
                Row: {
                    id: string
                    user_id: string | null
                    title: string | null
                    description: string | null
                    location: string | null
                    link: string | null
                    start_at: string | null
                    end_at: string | null
                    all_day: boolean | null
                    tag_id: string | null
                    status: string | null
                    recurrence_rrule: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    title?: string | null
                    description?: string | null
                    location?: string | null
                    link?: string | null
                    start_at?: string | null
                    end_at?: string | null
                    all_day?: boolean | null
                    tag_id?: string | null
                    status?: string | null
                    recurrence_rrule?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    title?: string | null
                    description?: string | null
                    location?: string | null
                    link?: string | null
                    start_at?: string | null
                    end_at?: string | null
                    all_day?: boolean | null
                    tag_id?: string | null
                    status?: string | null
                    recurrence_rrule?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            event_reminders: {
                Row: {
                    id: string
                    event_id: string | null
                    minutes_before: number | null
                    channel: string | null
                    scheduled_for: string | null
                    status: string | null
                    last_error: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    event_id?: string | null
                    minutes_before?: number | null
                    channel?: string | null
                    scheduled_for?: string | null
                    status?: string | null
                    last_error?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    event_id?: string | null
                    minutes_before?: number | null
                    channel?: string | null
                    scheduled_for?: string | null
                    status?: string | null
                    last_error?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            entitlement_overrides: {
                Row: {
                    id: string
                    user_id: string | null
                    feature_key: string | null
                    enabled: boolean
                    expires_at: string | null
                    reason: string
                    created_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    feature_key?: string | null
                    enabled: boolean
                    expires_at?: string | null
                    reason: string
                    created_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    feature_key?: string | null
                    enabled?: boolean
                    expires_at?: string | null
                    reason?: string
                    created_by?: string | null
                    created_at?: string
                }
            }
            subscriptions: {
                Row: {
                    id: string
                    user_id: string
                    plan_id: string | null
                    iugu_customer_id: string | null
                    iugu_subscription_id: string | null
                    status: string
                    trial_ends_at: string | null
                    current_period_start: string | null
                    current_period_end: string | null
                    next_billing_at: string | null
                    cancel_at_period_end: boolean
                    canceled_at: string | null
                    cancel_reason: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    plan_id?: string | null
                    iugu_customer_id?: string | null
                    iugu_subscription_id?: string | null
                    status?: string
                    trial_ends_at?: string | null
                    current_period_start?: string | null
                    current_period_end?: string | null
                    next_billing_at?: string | null
                    cancel_at_period_end?: boolean
                    canceled_at?: string | null
                    cancel_reason?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    plan_id?: string | null
                    iugu_customer_id?: string | null
                    iugu_subscription_id?: string | null
                    status?: string
                    trial_ends_at?: string | null
                    current_period_start?: string | null
                    current_period_end?: string | null
                    next_billing_at?: string | null
                    cancel_at_period_end?: boolean
                    canceled_at?: string | null
                    cancel_reason?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            subscription_plans: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    price_monthly: number | null
                    price_yearly: number | null
                    features: Json | null
                    is_active: boolean
                    iugu_plan_id: string | null
                    trial_days: number | null
                    grace_days: number | null
                    billing_cycle: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    price_monthly?: number | null
                    price_yearly?: number | null
                    features?: Json | null
                    is_active?: boolean
                    iugu_plan_id?: string | null
                    trial_days?: number | null
                    grace_days?: number | null
                    billing_cycle?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    price_monthly?: number | null
                    price_yearly?: number | null
                    features?: Json | null
                    is_active?: boolean
                    iugu_plan_id?: string | null
                    trial_days?: number | null
                    grace_days?: number | null
                    billing_cycle?: string | null
                    created_at?: string
                }
            }
            invoices: {
                Row: {
                    id: string
                    user_id: string | null
                    subscription_id: string | null
                    iugu_invoice_id: string | null
                    status: string
                    amount_cents: number
                    currency: string
                    due_date: string | null
                    paid_at: string | null
                    payment_method: string | null
                    secure_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    subscription_id?: string | null
                    iugu_invoice_id?: string | null
                    status?: string
                    amount_cents: number
                    currency?: string
                    due_date?: string | null
                    paid_at?: string | null
                    payment_method?: string | null
                    secure_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    subscription_id?: string | null
                    iugu_invoice_id?: string | null
                    status?: string
                    amount_cents?: number
                    currency?: string
                    due_date?: string | null
                    paid_at?: string | null
                    payment_method?: string | null
                    secure_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            notification_templates: {
                Row: {
                    id: string
                    key: string
                    name: string
                    channel: string
                    subject: string | null
                    body: string
                    description: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    key: string
                    name: string
                    channel: string
                    subject?: string | null
                    body: string
                    description?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    key?: string
                    name?: string
                    channel?: string
                    subject?: string | null
                    body?: string
                    description?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            notification_logs: {
                Row: {
                    id: string
                    user_id: string | null
                    template_key: string | null
                    channel: string
                    status: string
                    provider_response: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    template_key?: string | null
                    channel: string
                    status?: string
                    provider_response?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    template_key?: string | null
                    channel?: string
                    status?: string
                    provider_response?: Json | null
                    created_at?: string
                }
            }
            data_deletion_requests: {
                Row: {
                    id: string
                    user_id: string | null
                    status: string
                    reason: string | null
                    requested_at: string
                    completed_at: string | null
                    admin_id: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    status?: string
                    reason?: string | null
                    requested_at?: string
                    completed_at?: string | null
                    admin_id?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    status?: string
                    reason?: string | null
                    requested_at?: string
                    completed_at?: string | null
                    admin_id?: string | null
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
