import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UploadCloud, Camera, File, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { useDocumentUpload } from '../hooks/useDocumentUpload';

export const UploadScreen: React.FC = () => {
  const navigate = useNavigate();
  const { status, uploadDocument, reset } = useDocumentUpload();

  const handleSimulateUpload = (fileName: string) => {
    uploadDocument(fileName);
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="bg-white p-6 pt-12 pb-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full -ml-2">
          <ArrowLeft className="w-6 h-6 text-slate-700" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Novo Documento</h1>
      </header>

      <div className="px-6 py-4">
        {status === 'idle' && (
          <div className="space-y-6">
            <div 
              className="border-2 border-dashed border-blue-200 bg-blue-50 rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-100 transition-colors" 
              onClick={() => handleSimulateUpload('Documento_Scaneado.pdf')}
            >
              <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <UploadCloud className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-blue-900 mb-1">Toque para enviar</h3>
              <p className="text-sm text-blue-600/80">PDF, JPG ou PNG</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                className="bg-slate-50 p-6 rounded-2xl flex flex-col items-center gap-3 hover:bg-slate-100 transition-colors" 
                onClick={() => handleSimulateUpload('Foto_Camera.jpg')}
              >
                <Camera className="w-8 h-8 text-slate-700" />
                <span className="font-medium text-slate-700">Usar Câmera</span>
              </button>
              <button 
                className="bg-slate-50 p-6 rounded-2xl flex flex-col items-center gap-3 hover:bg-slate-100 transition-colors" 
                onClick={() => handleSimulateUpload('Arquivo_Galeria.pdf')}
              >
                <File className="w-8 h-8 text-slate-700" />
                <span className="font-medium text-slate-700">Arquivos</span>
              </button>
            </div>
          </div>
        )}

        {status === 'uploading' && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-pulse">
            <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Enviando...</h3>
            <p className="text-slate-500 max-w-[200px]">Armazenando na pasta de segundo plano para incrementação.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-600">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Armazenado!</h3>
            <p className="text-slate-500 mb-6">
              O documento foi enviado para a fila de processamento em <strong>segundo plano</strong>.
            </p>
            
            <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-3 mb-8 w-full text-left">
              <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-slate-700">Aguardando Análise</p>
                <p className="text-xs text-slate-500">Notificaremos quando a incrementação finalizar.</p>
              </div>
            </div>
            
            <div className="w-full space-y-3">
              <Button fullWidth onClick={() => navigate('/home')}>Voltar ao Início</Button>
              <Button variant="secondary" fullWidth onClick={reset}>Enviar outro</Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6 text-rose-600">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Erro no envio</h3>
            <p className="text-slate-500 mb-8">Não foi possível armazenar o documento. Tente novamente.</p>
            <Button fullWidth onClick={reset}>Tentar Novamente</Button>
          </div>
        )}
      </div>
    </div>
  );
};
