export enum StatusLevel {
  SAFE = 'SAFE',
  WARNING = 'WARNING',
  RISK = 'RISK'
}

export interface Task {
  id: string;
  title: string;
  category: CategoryType;
  dueDate: string;
  status: 'pending' | 'completed' | 'overdue';
  amount?: string;
  description?: string;
}

export enum CategoryType {
  VEHICLE = 'Veículo',
  HOME = 'Casa',
  DOCUMENTS = 'Documentos',
  TAXES = 'Impostos',
  CONTRACTS = 'Contratos'
}

export interface Category {
  id: CategoryType;
  label: string;
  icon: string;
  status: 'ok' | 'warning' | 'error';
  pendingCount: number;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}
