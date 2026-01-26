import { supabase } from './supabase';

const BUCKET_NAME = 'documents';

interface StoredDocument {
  id: string;
  name: string;
  file_path: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  created_at: string;
}

export const storageService = {
  /**
   * Upload a file to Supabase Storage and create a document record
   */
  uploadDocument: async (
    file: File,
    userId: string,
    taskId?: string
  ): Promise<StoredDocument> => {
    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('[Storage] Upload failed:', uploadError);
      throw uploadError;
    }

    // Create document record in database
    const { data, error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        task_id: taskId || null,
        name: file.name,
        file_path: fileName,
        file_size: file.size,
        mime_type: file.type,
        status: 'queued'
      })
      .select()
      .single();

    if (dbError) {
      console.error('[Storage] Database record failed:', dbError);
      throw dbError;
    }

    console.log(`[Storage] File stored: ${fileName}`, data);
    return data as StoredDocument;
  },

  /**
   * Simulate file upload for demo (when Storage bucket is not configured)
   * This maintains backwards compatibility with the mock flow
   */
  saveToBackgroundQueue: async (fileName: string): Promise<StoredDocument> => {
    // Simulate network/storage latency
    await new Promise(resolve => setTimeout(resolve, 2000));

    const storedDoc: StoredDocument = {
      id: Math.random().toString(36).substr(2, 9),
      name: fileName,
      file_path: `segundo_plano_de_incrementacao/${fileName}`,
      status: 'queued',
      created_at: new Date().toISOString()
    };

    console.log(`[Storage] File stored (mock):`, storedDoc);
    return storedDoc;
  },

  /**
   * Get download URL for a document
   */
  getDownloadUrl: async (filePath: string): Promise<string | null> => {
    const { data } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    return data?.signedUrl || null;
  },

  /**
   * Delete a document from storage and database
   */
  deleteDocument: async (documentId: string, filePath: string): Promise<void> => {
    // Delete from storage
    await supabase.storage.from(BUCKET_NAME).remove([filePath]);

    // Delete from database
    await supabase.from('documents').delete().eq('id', documentId);
  },

  /**
   * Get all documents for a user
   */
  getUserDocuments: async (userId: string): Promise<StoredDocument[]> => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Storage] Failed to fetch documents:', error);
      return [];
    }

    return data as StoredDocument[];
  }
};
