import { CategoryType, StatusLevel, Task } from './types';

export const MOCK_TASKS: Task[] = [
  {
    id: '1',
    title: 'IPVA 2024 - Parcela 3',
    category: CategoryType.VEHICLE,
    dueDate: '2024-03-10',
    status: 'overdue',
    amount: 'R$ 450,00',
    description: 'Pagamento da terceira parcela do IPVA do veículo ABC-1234.'
  },
  {
    id: '2',
    title: 'Licenciamento',
    category: CategoryType.VEHICLE,
    dueDate: '2024-04-15',
    status: 'pending',
    amount: 'R$ 160,00'
  },
  {
    id: '3',
    title: 'Renovação CNH',
    category: CategoryType.DOCUMENTS,
    dueDate: '2024-05-20',
    status: 'pending',
    description: 'Agendar exame médico e psicotécnico.'
  },
  {
    id: '4',
    title: 'Declaração IRPF',
    category: CategoryType.TAXES,
    dueDate: '2024-05-31',
    status: 'pending',
    description: 'Enviar documentos para o contador.'
  },
  {
    id: '5',
    title: 'Seguro Residencial',
    category: CategoryType.HOME,
    dueDate: '2024-02-28',
    status: 'completed',
    amount: 'R$ 1.200,00'
  }
];

export const STATUS_CONFIG = {
  [StatusLevel.SAFE]: {
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    icon: 'check-circle',
    label: 'Tudo em dia',
    description: 'Você não possui pendências urgentes.'
  },
  [StatusLevel.WARNING]: {
    color: 'bg-amber-500',
    lightColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    icon: 'alert-triangle',
    label: 'Atenção Necessária',
    description: 'Existem prazos se aproximando.'
  },
  [StatusLevel.RISK]: {
    color: 'bg-rose-500',
    lightColor: 'bg-rose-100',
    textColor: 'text-rose-700',
    icon: 'x-circle',
    label: 'Situação de Risco',
    description: 'Você possui itens vencidos ou críticos.'
  }
};
