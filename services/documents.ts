
import { supabase } from './supabase';
import { tasksService } from './tasks';

export type DocumentStatus = 'processing' | 'identified' | 'unknown' | 'failed';

export interface DocumentAnalysis {
    doc_type: string;
    category: string;
    title_suggested: string;
    issuer: string | null;
    due_date: string | null;
    amount: number | null;
    confidence: number;
    summary_simple: string;
    impact_text: string;
    next_action_text: string;
}

export const documentsService = {
    uploadAndProcess: async (file: File): Promise<{ document_id: string; storage_path: string } | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const household = await tasksService.getHousehold();
        if (!household) return null;

        const fileExt = file.name.split('.').pop();
        const documentId = crypto.randomUUID();
        const storagePath = `${user.id}/${documentId}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(storagePath, file);

        if (uploadError) {
            console.error('[Documents] Upload error:', uploadError);
            return null;
        }

        const { error: dbError } = await supabase
            .from('documents')
            .insert({
                id: documentId,
                household_id: household.id,
                uploaded_by: user.id,
                storage_path: storagePath,
                mime_type: file.type,
                original_filename: file.name,
                status: 'processing'
            });

        if (dbError) {
            console.error('[Documents] DB error:', dbError);
            return null;
        }

        return { document_id: documentId, storage_path: storagePath };
    },

    ping: async () => {
        try {
            const { data, error } = await supabase.functions.invoke('process_document_v2', {
                body: { ping: true }
            });
            return !error && data?.success;
        } catch (e) {
            return false;
        }
    },

    processDocument: async (documentId: string, storagePath: string, householdId: string) => {
        try {
            const { data, error } = await supabase.functions.invoke('process_document_v2', {
                body: { document_id: documentId, storage_path: storagePath, household_id: householdId }
            });

            if (error) {
                console.error('[Documents] Function Invoke Error:', error);
                throw new Error(error.message || 'Falha na comunicação com a IA');
            }

            return data;
        } catch (err: any) {
            console.error('[Documents] Fatal Processing Error:', err);
            throw err;
        }
    },

    getDocument: async (documentId: string) => {
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('id', documentId)
            .single();

        if (error) return null;
        return data;
    }
};
