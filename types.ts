export enum StatusLevel {
  SAFE = 'SAFE',
  WARNING = 'WARNING',
  RISK = 'RISK'
}

export type HealthStatus = 'ok' | 'attention' | 'risk';
export type ImpactLevel = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  category_id: string;
  category?: CategoryType;
  due_date?: string;
  status: 'pending' | 'completed' | 'overdue';
  health_status?: HealthStatus;
  impact_level?: ImpactLevel;
  impact_text?: string;
  next_action_text?: string;
  amount?: number;
  description?: string;
  household_id?: string;
  owner_user_id?: string;
  is_recurring?: boolean;
  recurrence_interval?: 'monthly' | 'yearly' | 'weekly';
  auto_generated?: boolean;
  recurrence_group_id?: string;
  confidence_score?: number;
  is_joint?: boolean;
  user_id?: string;
  entry_type?: 'bill' | 'immediate' | 'expense' | 'income';
  payment_method?: 'cash' | 'pix' | 'debit' | 'credit';
  purchase_date?: string;
  is_subscription?: boolean;
  subscription_periodicity?: string;
  created_at: string;
}

export interface Household {
  id: string;
  name: string;
  created_by: string;
  members?: HouseholdMember[];
}

export interface HouseholdMember {
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
  profile?: {
    full_name: string;
    avatar_url?: string;
    recognition_muted?: boolean;
  };
}

export interface HouseholdInvite {
  id: string;
  email: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
}

export enum CategoryType {
  VEHICLE = 'vehicle',
  HOME = 'home',
  DOCUMENTS = 'documents',
  TAXES = 'taxes',
  CONTRACTS = 'contracts',
  FOOD = 'food',
  SHOPPING = 'shopping',
  HEALTH = 'health',
  UTILITIES = 'utilities',
  LEISURE = 'leisure',
  TRANSPORT = 'transport',
  OUTROS = 'outros'
}

export interface Category {
  id: string;
  label: string;
  icon: string;
  color?: string;
  status: 'ok' | 'warning' | 'error';
  pendingCount?: number;
}

export type TaxRegime = 'simplified' | 'complete';

export interface IRPFEstimate {
  user_id: string;
  year: number;
  income_monthly: number;
  is_exempt: boolean;
  estimated_tax_monthly: number;
  estimated_tax_yearly: number;
  confidence: 'high' | 'medium' | 'low';
  tax_rate: number;
  total_deductions_year?: number;
  has_deductions?: boolean;
  capital_gains_tax?: number;
  tax_regime?: TaxRegime;
}

export interface IRPFReadiness {
  status: 'ready' | 'almost' | 'incomplete';
  completed_count: number;
  total_count: number;
  checklist: { id: string; label: string; status: 'done' | 'pending' }[];
  last_update: string;
}

export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  active_household_id?: string;
  estimate_ir?: boolean;
  onboarding_step?: number;
  onboarding_completed?: boolean;
}

export type AssistantIntent =
  | 'FINANCIAL_STATUS'
  | 'RISK_STATUS'
  | 'STATUS_REPORT'
  | 'GENERAL_HEALTH'
  | 'ACTION_PROPOSAL'
  | 'UPLOAD_INTENT'
  | 'IR_BASICS'
  | 'IR_INCOME'
  | 'IR_DEDUCTIONS'
  | 'IR_DEPENDENTS'
  | 'IR_INVESTMENTS'
  | 'IR_PATRIMONY'
  | 'IR_REFUND'
  | 'IR_CHECKLIST'
  | 'TRAFFIC_ANALYSIS'
  | 'UNKNOWN';

export type OperationalAction =
  | 'COMPLETE_TASK'
  | 'DELEGATE_TASK'
  | 'RESCHEDULE_TASK'
  | 'ADD_AMOUNT'
  | 'SAVE_DEDUCTION'
  | 'ADD_TRAFFIC_FINE'
  | 'ANALYZE_DEFENSE'
  | 'GENERATE_TRAFFIC_DEFENSE'
  | 'CANCEL_ACTION';

export interface PendingAction {
  id: string;
  type: OperationalAction;
  taskId: string;
  payload: any;
  summary: string;
  created_at: string;
  expires_at: string;
}

export interface MessageAction {
  label: string;
  path?: string;
  action?: OperationalAction;
  task_id?: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  actions?: MessageAction[];
  pendingAction?: PendingAction;
  suggestions?: { id: string; title: string }[];
  intent?: AssistantIntent;
  // Sprint 19 Extensions
  is_cached?: boolean;
  confidence_level?: 'low' | 'medium' | 'high';
  sources?: { url: string; title: string; excerpt?: string }[];
  answer_json?: {
    domain?: string;
    key_facts?: { label: string; value: string }[];
    follow_up_questions?: string[];
    suggested_next_actions?: string[];
  };
}
