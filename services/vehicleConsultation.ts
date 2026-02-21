
import { supabase } from './supabase';

export const vehicleConsultationService = {
    async consultBasic(plate: string) {
        const { data, error } = await supabase.functions.invoke('vehicle_consultation_proxy_v1', {
            body: { endpoint: 'consulta-veículos-placa', plate }
        });

        if (error) throw new Error(error.message || 'Erro na consulta');
        if (data?.error) throw new Error(data.error);

        return data;
    },

    async consultV1(plate: string) {
        const { data, error } = await supabase.functions.invoke('vehicle_consultation_proxy_v1', {
            body: { endpoint: 'consulta_veicular_placa_v1', plate }
        });

        if (error) throw new Error(error.message || 'Erro na consulta');
        if (data?.error) throw new Error(data.error);

        return data;
    },

    async consultV2(plate: string) {
        const { data, error } = await supabase.functions.invoke('vehicle_consultation_proxy_v1', {
            body: { endpoint: 'consulta_veicular_placa_v2', plate }
        });

        if (error) throw new Error(error.message || 'Erro na consulta');
        if (data?.error) throw new Error(data.error);

        return data;
    }
};
