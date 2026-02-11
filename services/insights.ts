import { supabase } from './supabase';
import { tasksService } from './tasks';
import { budgetLimitsService, financialIntelligenceService } from './financial';

export interface FinancialInsight {
    id: string;
    type: 'warning' | 'success' | 'info' | 'tip';
    title: string;
    message: string;
    actionLabel?: string;
    actionPath?: string;
}

export const insightsService = {
    /**
     * Gera insights baseados nos dados reais do usuário
     */
    getQuickInsights: async (): Promise<FinancialInsight[]> => {
        try {
            const household = await tasksService.getHousehold();
            if (!household) return [];

            const [tasks, dashboard, score] = await Promise.all([
                tasksService.getUserTasks(),
                supabase.rpc('get_financial_dashboard', { target_household_id: household.id }),
                financialIntelligenceService.getScore()
            ]);

            const insights: FinancialInsight[] = [];
            const data = Array.isArray(dashboard.data) ? dashboard.data[0] : dashboard.data;

            // 1. Insight de Assinaturas (Se forem > 15% das despesas)
            const subscriptions = tasks.filter(t => t.is_subscription);
            const totalSubCost = subscriptions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
            const totalExpenses = data?.total_expenses || 1; // avoid div by zero

            if ((totalSubCost / totalExpenses) > 0.15) {
                insights.push({
                    id: 'high-subscriptions',
                    type: 'warning',
                    title: 'Dica de Assinaturas',
                    message: `Suas assinaturas somam R$ ${totalSubCost.toFixed(2)}, cerca de ${((totalSubCost / totalExpenses) * 100).toFixed(0)}% dos seus gastos. Que tal uma revisão?`,
                    actionLabel: 'Ver Assinaturas',
                    actionPath: '/subscriptions'
                });
            }

            // 2. Insight de Saúde Financeira (Baseado no Score)
            if (score && score.score < 60) {
                insights.push({
                    id: 'low-score',
                    type: 'info',
                    title: 'Atenção ao Radar',
                    message: 'Seu Score de Saúde baixou um pouco. Revisar as contas vencidas pode ajudar a recuperar o fôlego!',
                    actionLabel: 'Ver Radar',
                    actionPath: '/financial-dashboard'
                });
            } else if (score && score.score > 85) {
                insights.push({
                    id: 'high-score',
                    type: 'success',
                    title: 'Parabéns!',
                    message: 'Sua saúde financeira está excelente. Excelente hora para considerar aumentar seus aportes em investimentos.',
                    actionLabel: 'Investir Agora',
                    actionPath: '/investments'
                });
            }

            // 3. Insight de Imposto de Renda (Proativo)
            const medicalExpenses = tasks.filter(t => t.category_id === 'health');
            if (medicalExpenses.length > 0) {
                insights.push({
                    id: 'tax-optimization',
                    type: 'tip',
                    title: 'Economia Fiscal',
                    message: `Notei ${medicalExpenses.length} gastos de saúde este mês. Verifique se todas as notas estão na Pasta Fiscal para sua restituição.`,
                    actionLabel: 'Pasta Fiscal',
                    actionPath: '/fiscal-folder'
                });
            }

            // Fallback default insight se nada for urgente
            if (insights.length === 0) {
                insights.push({
                    id: 'default-tip',
                    type: 'tip',
                    title: 'Dica da Elara',
                    message: 'Manter seus registros em dia é o segredo para uma mente calma e um bolso cheio. Continue assim!',
                });
            }

            return insights;
        } catch (error) {
            console.error('[Insights] Error generating insights:', error);
            return [{
                id: 'error',
                type: 'info',
                title: 'Dica do Dia',
                message: 'Organizar seus gastos hoje garante um amanhã sem sustos.'
            }];
        }
    }
};
