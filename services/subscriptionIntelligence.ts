import { supabase } from './supabase';
import { CreditCardTransaction } from './financial';

interface SubscriptionPattern {
    pattern: RegExp;
    name: string;
    icon: string;
    category_id?: string; // Futuramente podemos mapear
}

const SUBSCRIPTION_PATTERNS: SubscriptionPattern[] = [
    { pattern: /netflix/i, name: 'Netflix', icon: '🍿' },
    { pattern: /spotify/i, name: 'Spotify', icon: '🎵' },
    { pattern: /amazon\s*prime/i, name: 'Amazon Prime', icon: '📦' },
    { pattern: /disney\s*\+/i, name: 'Disney+', icon: '🏰' },
    { pattern: /hbo|max/i, name: 'HBO Max', icon: '🎬' },
    { pattern: /apple\s*music/i, name: 'Apple Music', icon: '🍎' },
    { pattern: /youtube\s*premium/i, name: 'YouTube Premium', icon: '▶️' },
    { pattern: /adobe/i, name: 'Adobe Creative Cloud', icon: '🎨' },
    { pattern: /chatgpt|openai/i, name: 'ChatGPT Plus', icon: '🤖' },
    { pattern: /claro|vivo|tim/i, name: 'Telefonia/Internet', icon: '🌐' },
    { pattern: /smart\s*fit/i, name: 'Smart Fit', icon: '💪' },
    { pattern: /psn|playstation/i, name: 'PlayStation Plus', icon: '🎮' },
    { pattern: /xbox|game\s*pass/i, name: 'Xbox Game Pass', icon: '💚' },
    { pattern: /uber\s*one/i, name: 'Uber One', icon: '🚗' },
    { pattern: /ifood\s*clube/i, name: 'iFood Clube', icon: '🍔' },
    { pattern: /meli\s*\+/i, name: 'Meli+', icon: '📦' }
];

export const subscriptionIntelligence = {
    /**
     * Verifica se um título corresponde a uma assinatura conhecida
     */
    checkIsSubscription: (title: string): boolean => {
        return SUBSCRIPTION_PATTERNS.some(p => p.pattern.test(title));
    },

    /**
     * Escaneia transações passadas para encontrar possíveis assinaturas
     */
    scanForSubscriptions: async (): Promise<any[]> => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return [];

        // Buscar transações dos últimos 90 dias
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const { data: transactions, error } = await supabase
            .from('credit_card_transactions')
            .select('*')
            .gte('transaction_date', ninetyDaysAgo.toISOString())
            .order('transaction_date', { ascending: false });

        if (error || !transactions) return [];

        const foundSubscriptions: any[] = [];
        const seenTitles = new Set();

        transactions.forEach((t: CreditCardTransaction) => {
            if (seenTitles.has(t.title.toLowerCase())) return;

            const match = SUBSCRIPTION_PATTERNS.find(p => p.pattern.test(t.title));
            if (match) {
                foundSubscriptions.push({
                    title: match.name, // Normaliza o nome
                    original_title: t.title,
                    amount: t.amount,
                    icon: match.icon,
                    last_transaction_date: t.transaction_date,
                    detected_pattern: match.name
                });
                seenTitles.add(t.title.toLowerCase());
            }
        });

        return foundSubscriptions;
    }
};
