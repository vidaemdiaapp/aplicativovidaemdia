import { ZapayClient } from './client';
import { ZapayDebt, ZapayServiceResponse } from './types';
import { MOCK_DEBTS } from './mocks';

export const zapayService = {
    isMockMode: (): boolean => {
        return !import.meta.env.VITE_ZAPAY_CLIENT_ID;
    },

    getDebts: async (plate: string, uf: string): Promise<ZapayServiceResponse<ZapayDebt[]>> => {
        if (zapayService.isMockMode()) {
            console.log('[Zapay] Mock Mode Active - Returning fixtures');
            await new Promise(resolve => setTimeout(resolve, 800)); // Simular latência
            return { data: MOCK_DEBTS, error: null };
        }

        try {
            const data = await ZapayClient.request<ZapayDebt[]>(`/debts?plate=${plate}&uf=${uf}`);
            return { data, error: null };
        } catch (error: any) {
            console.error('[ZapayService] getDebts error:', error);
            return {
                data: null,
                error: {
                    code: error.code || 'UNKNOWN',
                    message: error.message || 'Erro ao consultar débitos'
                }
            };
        }
    },

    getInstallments: async (debtIds: string[]): Promise<ZapayServiceResponse<any>> => {
        if (zapayService.isMockMode()) {
            return { data: { options: [] }, error: null };
        }

        try {
            const data = await ZapayClient.request('/installments', {
                method: 'POST',
                body: JSON.stringify({ debt_ids: debtIds })
            });
            return { data, error: null };
        } catch (error: any) {
            return {
                data: null,
                error: {
                    code: error.code || 'UNKNOWN',
                    message: error.message || 'Erro ao consultar parcelamento'
                }
            };
        }
    }
};
