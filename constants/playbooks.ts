import { CategoryType } from '../types';

export interface TimelineStage {
    label: string;
    description: string;
    color: 'green' | 'yellow' | 'orange' | 'red';
    days_offset: number; // relative to due_date
    icon_type?: 'ok' | 'debt' | 'fine' | 'lock' | 'alert' | 'x';
}

export interface ActionPlan {
    primary_action: string;
    legal_consequence: string;
    practical_impact: string;
    steps: string[];
    priority_level: 'high' | 'medium' | 'low';
    timeline: TimelineStage[];
}

const DEFAULT_TIMELINE: TimelineStage[] = [
    { label: 'Hoje', description: 'Tudo sob controle.', color: 'green', days_offset: 0, icon_type: 'ok' },
    { label: '3 dias', description: 'Início da fase de juros.', color: 'yellow', days_offset: 3, icon_type: 'debt' },
    { label: '15 dias', description: 'Incidência de multa.', color: 'orange', days_offset: 15, icon_type: 'fine' },
    { label: '30 dias', description: 'Risco de bloqueio ou suspensão.', color: 'red', days_offset: 30, icon_type: 'lock' }
];

export const ACTION_PLAYBOOKS: Record<string, Record<string, ActionPlan>> = {
    [CategoryType.TAXES]: {
        'risk': {
            primary_action: 'Pagar agora via App Bancário',
            legal_consequence: 'Pode gerar multa de 20% + juros SELIC.',
            practical_impact: 'Pode levar ao bloqueio de CPF/CNPJ e dificultar crédito.',
            steps: ['Copiar código de barras', 'Acessar área de Impostos do Banco', 'Confirmar pagamento hoje'],
            priority_level: 'high',
            timeline: [
                { label: 'Ideal', description: 'Pagar sem encargos.', color: 'green', days_offset: 0, icon_type: 'ok' },
                { label: '+1 dia', description: 'Juros diários começam.', color: 'yellow', days_offset: 1, icon_type: 'debt' },
                { label: '+15 dias', description: 'Multa fixa aplicada.', color: 'orange', days_offset: 15, icon_type: 'fine' },
                { label: '+60 dias', description: 'Dívida ativa e protesto.', color: 'red', days_offset: 60, icon_type: 'lock' }
            ]
        },
        'attention': {
            primary_action: 'Agendar pagamento p/ data de vencimento',
            legal_consequence: 'Atraso gera encargos financeiros imediatos.',
            practical_impact: 'Gera retrabalho de emissão de nova guia atualizada.',
            steps: ['Baixar o PDF da guia', 'Agendar no banco', 'Marcar como agendado'],
            priority_level: 'medium',
            timeline: DEFAULT_TIMELINE
        }
    },
    [CategoryType.VEHICLE]: {
        'risk': {
            primary_action: 'Regularizar documentação urgente',
            legal_consequence: 'Infração gravíssima com 7 pontos na CNH.',
            practical_impact: 'Pode bloquear o uso do veículo e resultar em apreensão.',
            steps: ['Verificar débitos no Detran', 'Pagar taxas pendentes', 'Baixar CRLV-e atualizado'],
            priority_level: 'high',
            timeline: [
                { label: 'Venc.', description: 'Prazo limite legal.', color: 'green', days_offset: 0, icon_type: 'ok' },
                { label: '+1 dia', description: 'Sujeito a apreensão.', color: 'yellow', days_offset: 1, icon_type: 'alert' },
                { label: '+15 dias', description: 'Multa no sistema Detran.', color: 'orange', days_offset: 15, icon_type: 'fine' },
                { label: '+30 dias', description: 'Impedimento do veículo.', color: 'red', days_offset: 30, icon_type: 'lock' }
            ]
        },
        'attention': {
            primary_action: 'Revisar itens de segurança',
            legal_consequence: 'Pode resultar em multa por mau estado de conservação.',
            practical_impact: 'Atrasar manutenção aumenta o custo de reparo futuro.',
            steps: ['Verificar nível do óleo e pneus', 'Cotar revisão em oficina', 'Planejar gasto p/ próximo mês'],
            priority_level: 'medium',
            timeline: [
                { label: 'Prev.', description: 'Revisão sugerida.', color: 'green', days_offset: 0, icon_type: 'ok' },
                { label: '+30d', description: 'Desgaste acelerado.', color: 'yellow', days_offset: 30, icon_type: 'alert' },
                { label: '+60d', description: 'Risco de pane mecânica.', color: 'orange', days_offset: 60, icon_type: 'alert' },
                { label: '+90d', description: 'Reparo emergencial caro.', color: 'red', days_offset: 90, icon_type: 'x' }
            ]
        }
    },
    [CategoryType.CONTRACTS]: {
        'risk': {
            primary_action: 'Decidir sobre renovação / Cancelamento',
            legal_consequence: 'Renovação automática pode prender você por mais 12 meses.',
            practical_impact: 'Pode haver reajuste acima da inflação sem aviso prévio.',
            steps: ['Ler cláusula de rescisão', 'Comparar com preços de mercado', 'Notificar fornecedor'],
            priority_level: 'high',
            timeline: [
                { label: 'Janela', description: 'Hora de renegociar.', color: 'green', days_offset: -30, icon_type: 'ok' },
                { label: 'Lembrete', description: 'Última semana p/ cancelar.', color: 'yellow', days_offset: -7, icon_type: 'alert' },
                { label: 'Venc.', description: 'Renovação automática.', color: 'orange', days_offset: 0, icon_type: 'fine' },
                { label: 'Multa', description: 'Perda de direito / Multa.', color: 'red', days_offset: 1, icon_type: 'x' }
            ]
        },
        'attention': {
            primary_action: 'Revisar termos e performance',
            legal_consequence: 'Possibilidade de perda de benefícios de fidelidade.',
            practical_impact: 'O serviço pode não ser mais vantajoso p/ seu uso atual.',
            steps: ['Checar última fatura', 'Verificar fidelidade vigente', 'Sinalizar interesse em renegociar'],
            priority_level: 'medium',
            timeline: DEFAULT_TIMELINE
        }
    },
    [CategoryType.HOME]: {
        'risk': {
            primary_action: 'Garantir manutenção crítica',
            legal_consequence: 'Pode invalidar cláusulas do seguro residencial.',
            practical_impact: 'Risco de dano estrutural ou interrupção de serviço essencial.',
            steps: ['Chamar técnico especializado', 'Validar garantia se houver', 'Executar reparo preventivo'],
            priority_level: 'high',
            timeline: [
                { label: 'Hj', description: 'Garantia ativa.', color: 'green', days_offset: 0, icon_type: 'ok' },
                { label: '+7d', description: 'Dano pode agravar.', color: 'yellow', days_offset: 7, icon_type: 'alert' },
                { label: '+15d', description: 'Perda de funcionalidade.', color: 'orange', days_offset: 15, icon_type: 'x' },
                { label: '+30d', description: 'Cobrança / Suspensão.', color: 'red', days_offset: 30, icon_type: 'lock' }
            ]
        },
        'attention': {
            primary_action: 'Organizar comprovantes',
            legal_consequence: 'Dificulta comprovação de quitação em caso de cobrança indevida.',
            practical_impact: 'Falta de histórico pode dificultar revenda ou vistorias.',
            steps: ['Digitalizar recibos recentes', 'Agendar vistoria periódica', 'Atualizar inventário de bens'],
            priority_level: 'medium',
            timeline: DEFAULT_TIMELINE
        }
    }
};

export const DEFAULT_PLAN: ActionPlan = {
    primary_action: 'Resolver agora ou lembrar depois?',
    legal_consequence: 'Isso parece importante.',
    practical_impact: 'Manter a organização evita surpresas e estresse futuro.',
    steps: ['Verificar detalhes deste item', 'Decidir se precisa de ação hoje', 'Arquivar ou agendar lembrete'],
    priority_level: 'low',
    timeline: DEFAULT_TIMELINE
};
