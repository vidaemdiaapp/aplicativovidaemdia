import { ZapayDebt } from './types';

export const MOCK_VEHICLE = {
    name: 'Toyota Corolla',
    model: 'Altis Premium Hybrid 1.8',
    plate: 'ABC-1234',
    fipeValue: 115000,
    status: 'atencao',
    image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=800&auto=format&fit=crop'
};

export const MOCK_DEBTS: ZapayDebt[] = [
    {
        id: 'z1',
        external_id: 'zap_101',
        title: 'Licenciamento 2024',
        description: 'Taxa anual de licenciamento de veículo',
        amount: 160.22,
        due_date: '2024-10-15',
        type: 'license',
        year: '2024',
        status: 'pending'
    },
    {
        id: 'z2',
        external_id: 'zap_102',
        title: 'IPVA 2024 - Cota Única',
        description: 'Imposto sobre a Propriedade de Veículos Automotores',
        amount: 4250.00,
        due_date: '2024-01-31',
        type: 'tax',
        year: '2024',
        status: 'paid',
        details: 'Pago via Zapay em 12x'
    },
    {
        id: 'f1',
        external_id: 'zap_f1',
        title: 'Excesso de Velocidade',
        description: 'Infração cometida na Av. Rebouças, 1200',
        amount: 195.23,
        due_date: '2024-09-12',
        type: 'fine',
        status: 'pending',
        details: 'Gravíssima • 7 Pontos'
    }
];
