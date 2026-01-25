import { CategoryType } from '../types';

interface StoredDocument {
  id: string;
  name: string;
  folder: string;
  status: 'queued' | 'processing' | 'completed';
  timestamp: Date;
}

// Mock storage simulation
export const storageService = {
  /**
   * Simulates saving a document to the specific background incrementation folder
   * "pasta para segundo plano de incrementarão"
   */
  saveToBackgroundQueue: async (fileName: string): Promise<StoredDocument> => {
    // Simulate network/storage latency
    await new Promise(resolve => setTimeout(resolve, 2000));

    const storedDoc: StoredDocument = {
      id: Math.random().toString(36).substr(2, 9),
      name: fileName,
      folder: 'segundo_plano_de_incrementacao', // Specific folder requested
      status: 'queued',
      timestamp: new Date()
    };

    console.log(`[Storage] File stored in ${storedDoc.folder}:`, storedDoc);
    return storedDoc;
  }
};
