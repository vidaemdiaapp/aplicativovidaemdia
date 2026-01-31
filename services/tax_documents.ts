import { supabase } from './supabase';
import { tasksService } from './tasks';

// =============================================================================
// Types
// =============================================================================
export type DocumentType =
    | 'medical_receipt'      // Recibo médico
    | 'hospital_invoice'     // Nota fiscal de hospital
    | 'health_plan'          // Informe do plano de saúde
    | 'education_receipt'    // Recibo de educação
    | 'pension_receipt'      // Comprovante de pensão
    | 'pgbl_statement'       // Informe PGBL
    | 'income_statement'     // Informe de rendimentos
    | 'property_document'    // Documento de imóvel
    | 'vehicle_document'     // Documento de veículo
    | 'other';               // Outros

export type DeductionCategory =
    | 'health'       // Saúde (sem limite)
    | 'education'    // Educação (limitado)
    | 'dependent'    // Dependente
    | 'pension'      // Pensão alimentícia
    | 'pgbl'         // Previdência privada
    | 'other'        // Outros
    | 'none';        // Não dedutível

export interface TaxDocument {
    id: string;
    user_id: string;
    household_id?: string;
    year: number;
    document_type: DocumentType;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    // OCR/AI Fields
    ocr_processed: boolean;
    ocr_provider?: string;
    extracted_data?: {
        provider_name?: string;
        provider_cnpj?: string;
        provider_cpf?: string;
        date?: string;
        amount?: number;
        description?: string;
        patient_name?: string;
        service_type?: string;
    };
    // Classification
    is_deductible: boolean;
    deduction_category?: DeductionCategory;
    deduction_amount?: number;
    confidence_score?: number;
    ai_reasoning?: string;
    // Status
    status: 'pending' | 'processing' | 'processed' | 'error' | 'manual';
    error_message?: string;
    // Metadata
    created_at: string;
    updated_at: string;
}

export interface DocumentUploadResult {
    success: boolean;
    document_id?: string;
    storage_path?: string;
    error?: string;
}

export interface DocumentAnalysisResult {
    success: boolean;
    document_id: string;
    is_deductible: boolean;
    deduction_category?: DeductionCategory;
    deduction_amount?: number;
    confidence_score?: number;
    reasoning?: string;
    extracted_data?: TaxDocument['extracted_data'];
    error?: string;
}

// =============================================================================
// Service
// =============================================================================
export const taxDocumentsService = {
    /**
     * Upload a tax document to storage
     */
    uploadDocument: async (
        file: File,
        year: number = new Date().getFullYear()
    ): Promise<DocumentUploadResult> => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return { success: false, error: 'Usuário não autenticado' };

            const user = session.user;
            const household = await tasksService.getHousehold();

            // Generate unique file path
            const timestamp = Date.now();
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const storagePath = `${user.id}/${year}/${timestamp}_${sanitizedName}`;

            // Upload to storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('fiscal-documents')
                .upload(storagePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Create database record
            const { data: docData, error: docError } = await supabase
                .from('tax_documents')
                .insert({
                    user_id: user.id,
                    household_id: household?.id,
                    year: year,
                    document_type: 'other',
                    file_name: file.name,
                    file_path: storagePath,
                    file_size: file.size,
                    mime_type: file.type,
                    ocr_processed: false,
                    is_deductible: false,
                    status: 'pending'
                })
                .select('id')
                .single();

            if (docError) throw docError;

            return {
                success: true,
                document_id: docData.id,
                storage_path: storagePath
            };
        } catch (error: any) {
            console.error('[TaxDocuments] Upload error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Analyze document with AI (OCR + Classification)
     */
    analyzeDocument: async (documentId: string): Promise<DocumentAnalysisResult> => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return { success: false, document_id: documentId, is_deductible: false, error: 'Não autenticado' };

            // Call Edge Function for analysis
            const { data, error } = await supabase.functions.invoke('analyze_tax_document_v1', {
                body: { document_id: documentId }
            });

            if (error) throw error;

            return {
                success: true,
                document_id: documentId,
                is_deductible: data.is_deductible || false,
                deduction_category: data.deduction_category,
                deduction_amount: data.deduction_amount,
                confidence_score: data.confidence_score,
                reasoning: data.reasoning,
                extracted_data: data.extracted_data
            };
        } catch (error: any) {
            console.error('[TaxDocuments] Analysis error:', error);
            return {
                success: false,
                document_id: documentId,
                is_deductible: false,
                error: error.message
            };
        }
    },

    /**
     * Upload and immediately analyze
     */
    uploadAndAnalyze: async (
        file: File,
        year: number = new Date().getFullYear()
    ): Promise<DocumentAnalysisResult> => {
        const uploadResult = await taxDocumentsService.uploadDocument(file, year);

        if (!uploadResult.success || !uploadResult.document_id) {
            return {
                success: false,
                document_id: '',
                is_deductible: false,
                error: uploadResult.error
            };
        }

        return await taxDocumentsService.analyzeDocument(uploadResult.document_id);
    },

    /**
     * Get all documents for a year
     */
    getDocuments: async (year: number): Promise<TaxDocument[]> => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return [];

            const { data, error } = await supabase
                .from('tax_documents')
                .select('*')
                .eq('year', year)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as TaxDocument[];
        } catch (error) {
            console.error('[TaxDocuments] Fetch error:', error);
            return [];
        }
    },

    /**
     * Get only deductible documents for a year
     */
    getDeductibleDocuments: async (year: number): Promise<TaxDocument[]> => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return [];

            const { data, error } = await supabase
                .from('tax_documents')
                .select('*')
                .eq('year', year)
                .eq('is_deductible', true)
                .order('deduction_category', { ascending: true });

            if (error) throw error;
            return data as TaxDocument[];
        } catch (error) {
            console.error('[TaxDocuments] Fetch error:', error);
            return [];
        }
    },

    /**
     * Get total deductions by category
     */
    getDeductionsSummary: async (year: number): Promise<{
        total: number;
        byCategory: Record<DeductionCategory, number>;
        count: number;
    }> => {
        try {
            const docs = await taxDocumentsService.getDeductibleDocuments(year);

            const byCategory: Record<DeductionCategory, number> = {
                health: 0,
                education: 0,
                dependent: 0,
                pension: 0,
                pgbl: 0,
                other: 0,
                none: 0
            };

            let total = 0;

            for (const doc of docs) {
                if (doc.deduction_amount && doc.deduction_category) {
                    byCategory[doc.deduction_category] += doc.deduction_amount;
                    total += doc.deduction_amount;
                }
            }

            return { total, byCategory, count: docs.length };
        } catch (error) {
            console.error('[TaxDocuments] Summary error:', error);
            return { total: 0, byCategory: {} as any, count: 0 };
        }
    },

    /**
     * Delete a document
     */
    deleteDocument: async (documentId: string): Promise<boolean> => {
        try {
            // Get document to find file path
            const { data: doc } = await supabase
                .from('tax_documents')
                .select('file_path')
                .eq('id', documentId)
                .single();

            if (doc?.file_path) {
                // Delete from storage
                await supabase.storage
                    .from('fiscal-documents')
                    .remove([doc.file_path]);
            }

            // Delete record
            const { error } = await supabase
                .from('tax_documents')
                .delete()
                .eq('id', documentId);

            return !error;
        } catch (error) {
            console.error('[TaxDocuments] Delete error:', error);
            return false;
        }
    },

    /**
     * Get signed URL for document download
     */
    getDownloadUrl: async (filePath: string): Promise<string | null> => {
        try {
            const { data, error } = await supabase.storage
                .from('fiscal-documents')
                .createSignedUrl(filePath, 3600); // 1 hour

            if (error) throw error;
            return data.signedUrl;
        } catch (error) {
            console.error('[TaxDocuments] Download URL error:', error);
            return null;
        }
    },

    /**
     * Update document manually (after user review)
     */
    updateDocument: async (
        documentId: string,
        updates: Partial<Pick<TaxDocument, 'document_type' | 'is_deductible' | 'deduction_category' | 'deduction_amount'>>
    ): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('tax_documents')
                .update({
                    ...updates,
                    status: 'manual',
                    updated_at: new Date().toISOString()
                })
                .eq('id', documentId);

            return !error;
        } catch (error) {
            console.error('[TaxDocuments] Update error:', error);
            return false;
        }
    }
};
