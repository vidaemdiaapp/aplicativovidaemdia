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
  due_date: string;
  status: 'pending' | 'completed' | 'overdue';
  health_status?: HealthStatus;
  impact_level?: ImpactLevel;
  impact_text?: string;
  next_action_text?: string;
  amount?: string;
  description?: string;
  household_id?: string;
  owner_user_id?: string;
  is_recurring?: boolean;
  recurrence_interval?: 'monthly' | 'yearly' | 'weekly';
  auto_generated?: boolean;
  recurrence_group_id?: string;
  confidence_score?: number;
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
  CONTRACTS = 'contracts'
}

export interface Category {
  id: CategoryType;
  label: string;
  icon: string;
  color?: string;
  status: 'ok' | 'warning' | 'error';
  pendingCount: number;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}
