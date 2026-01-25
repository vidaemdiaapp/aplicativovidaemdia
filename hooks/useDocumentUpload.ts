import { useState } from 'react';
import { storageService } from '../services/storage';

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

export const useDocumentUpload = () => {
  const [status, setStatus] = useState<UploadState>('idle');
  const [error, setError] = useState<string | null>(null);

  const uploadDocument = async (fileName: string) => {
    try {
      setStatus('uploading');
      setError(null);
      
      // Send to the "background incrementation" folder via service
      await storageService.saveToBackgroundQueue(fileName);
      
      setStatus('success');
    } catch (err) {
      console.error(err);
      setError('Falha ao enviar documento para processamento.');
      setStatus('error');
    }
  };

  const reset = () => {
    setStatus('idle');
    setError(null);
  };

  return {
    status,
    error,
    uploadDocument,
    reset
  };
};
