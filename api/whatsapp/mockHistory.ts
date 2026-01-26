import { WhatsAppMessage } from './contracts';

const MOCK_HISTORY: WhatsAppMessage[] = [
    {
        id: 'msg_1',
        from: '5511999999999',
        to: 'system',
        type: 'text',
        timestamp: new Date(Date.now() - 10000000).toISOString(),
        status: 'read',
        content: { body: 'Olá, gostaria de saber quais contas vencem hoje.' }
    },
    {
        id: 'msg_2',
        from: 'system',
        to: '5511999999999',
        type: 'text',
        timestamp: new Date(Date.now() - 9999000).toISOString(),
        status: 'delivered',
        content: { body: 'Olá Diego! Hoje vence a conta de Luz (R$ 150,00). Deseja marcar como paga?' }
    },
    {
        id: 'msg_3',
        from: '5511999999999',
        to: 'system',
        type: 'text',
        timestamp: new Date(Date.now() - 9995000).toISOString(),
        status: 'read',
        content: { body: 'Sim, por favor.' }
    }
];

export const chatService = {
    getHistory: async (userId: string): Promise<WhatsAppMessage[]> => {
        // In future: fetch from supabase 'chat_messages' table
        return new Promise(resolve => setTimeout(() => resolve(MOCK_HISTORY), 500));
    },

    sendMessage: async (to: string, body: string): Promise<WhatsAppMessage> => {
        const newMessage: WhatsAppMessage = {
            id: `msg_${Date.now()}`,
            from: 'system',
            to,
            type: 'text',
            timestamp: new Date().toISOString(),
            status: 'sent',
            content: { body }
        };
        return new Promise(resolve => setTimeout(() => resolve(newMessage), 300));
    }
};
