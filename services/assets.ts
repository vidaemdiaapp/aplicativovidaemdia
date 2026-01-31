import { supabase } from './supabase';
import { tasksService } from './tasks';

export type AssetType = 'vehicle' | 'real_estate' | 'other';
export type AssetStatus = 'owned' | 'sold';

export interface Asset {
    id: string;
    user_id: string;
    household_id?: string;
    name: string;
    type: AssetType;
    plate?: string;
    purchase_value: number;
    purchase_date: string;
    sale_value?: number;
    sale_date?: string;
    status: AssetStatus;
    purchase_receipt_url?: string;
    sale_receipt_url?: string;
    notes?: string;
    created_at: string;
}

export const assetsService = {
    getAssets: async (): Promise<Asset[]> => {
        const { data, error } = await supabase
            .from('assets')
            .select('*')
            .order('purchase_date', { ascending: false });

        if (error) {
            console.error('[Assets] Failed to fetch:', error);
            return [];
        }
        return data as Asset[];
    },

    saveAsset: async (asset: Partial<Asset>): Promise<Asset | null> => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;
        const user = session.user;

        const household = await tasksService.getHousehold();

        const { data, error } = await supabase
            .from('assets')
            .upsert({
                ...asset,
                user_id: user.id,
                household_id: household?.id
            })
            .select()
            .single();

        if (error) {
            console.error('[Assets] Failed to save:', error);
            return null;
        }
        return data as Asset;
    },

    sellAsset: async (id: string, sale_value: number, sale_date: string, sale_receipt_url?: string): Promise<boolean> => {
        const { error } = await supabase
            .from('assets')
            .update({
                sale_value,
                sale_date,
                sale_receipt_url,
                status: 'sold'
            })
            .eq('id', id);

        return !error;
    },

    deleteAsset: async (id: string): Promise<boolean> => {
        const { error } = await supabase
            .from('assets')
            .delete()
            .eq('id', id);
        return !error;
    },

    uploadReceipt: async (file: File, assetId: string, type: 'purchase' | 'sale'): Promise<string | null> => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return null;

            const fileExt = file.name.split('.').pop();
            const fileName = `${assetId}_${type}_${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `asset-receipts/${session.user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('fiscal-documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('fiscal-documents')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('[Assets] Upload receipt error:', error);
            return null;
        }
    }
};
