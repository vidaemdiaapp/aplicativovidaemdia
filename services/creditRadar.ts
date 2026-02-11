import { supabase } from './supabase';
import { CreditCard, CreditCardTransaction } from './financial';

export interface CreditLimitProjection {
    month: string;
    label: string;
    used_amount: number;
    remaining_amount: number;
    usage_percentage: number;
}

export const creditRadarService = {
    /**
     * Calcula a projeção de uso do limite para os próximos 6 meses
     */
    getLimitProjection: async (cardId: string): Promise<CreditLimitProjection[]> => {
        try {
            const { data: card, error: cardError } = await supabase
                .from('credit_cards')
                .select('*')
                .eq('id', cardId)
                .single();

            if (cardError || !card) throw cardError;

            const { data: transactions, error: transError } = await supabase
                .from('credit_card_transactions')
                .select('*')
                .eq('card_id', cardId);

            if (transError) throw transError;

            const projections: CreditLimitProjection[] = [];
            const now = new Date();

            for (let i = 0; i < 6; i++) {
                const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
                const monthLabel = targetDate.toLocaleDateString('pt-BR', { month: 'short' });
                const monthYear = targetDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

                // Calcular ocupação total do limite neste mês
                // Ocupação = Compras únicas do mês + Saldo devedor total das parcelas restantes
                const occupiedInMonth = (transactions || []).reduce((sum, t) => {
                    const transDate = new Date(t.transaction_date);
                    const monthsDiff = (targetDate.getFullYear() - transDate.getFullYear()) * 12 + (targetDate.getMonth() - transDate.getMonth());

                    if (t.installment_total > 1) {
                        // O offset de meses desde o início real da compra é (installment_current - 1)
                        const monthsSinceStart = monthsDiff + (t.installment_current - 1);
                        const remainingInstallments = t.installment_total - monthsSinceStart;

                        if (remainingInstallments > 0) {
                            // O limite ocupado é o valor total de todas as parcelas que ainda serão pagas
                            const installmentValue = t.amount / t.installment_total;
                            return sum + (remainingInstallments * installmentValue);
                        }
                    } else if (monthsDiff <= 0) {
                        // Compra única ocupa o limite apenas no mês em que foi feita (ou meses futuros se for o caso)
                        // Após o mês da transação, assumimos que a fatura foi paga e o limite liberado
                        return sum + t.amount;
                    }
                    return sum;
                }, 0);

                projections.push({
                    month: monthYear,
                    label: monthLabel.replace('.', ''),
                    used_amount: occupiedInMonth,
                    remaining_amount: Math.max(0, card.credit_limit - occupiedInMonth),
                    usage_percentage: Math.min(100, (occupiedInMonth / card.credit_limit) * 100)
                });
            }

            return projections;
        } catch (error) {
            console.error('[CreditRadar] Error calculating projection:', error);
            return [];
        }
    }
};
