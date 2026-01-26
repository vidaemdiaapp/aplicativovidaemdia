export interface WhatsAppMessage {
    id: string;
    from: string; // phone number
    to: string;   // phone number
    type: 'text' | 'image' | 'interactive' | 'audio';
    timestamp: string;
    content: {
        body?: string;
        mediaUrl?: string;
        caption?: string;
    };
    status: 'sent' | 'delivered' | 'read' | 'failed';
}

export interface WebhookPayload {
    object: 'whatsapp_business_account';
    entry: Array<{
        id: string;
        changes: Array<{
            value: {
                messaging_product: 'whatsapp';
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                contacts: Array<{
                    profile: {
                        name: string;
                    };
                    wa_id: string;
                }>;
                messages: Array<{
                    from: string;
                    id: string;
                    timestamp: string;
                    text?: {
                        body: string;
                    };
                    type: string;
                }>;
            };
            field: 'messages';
        }>;
    }>;
}

export interface AgentResponse {
    message: string;
    actions?: Array<{
        type: 'create_task' | 'update_task' | 'query_balance';
        payload: any;
    }>;
}
