
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UploadCloud, Camera, File, CheckCircle2, Clock, AlertCircle, Sparkles, Calendar, DollarSign, Tag } from 'lucide-react';
import { Button } from '../components/Button';
import { documentsService, DocumentAnalysis } from '../services/documents';
import { tasksService } from '../services/tasks';

export const UploadScreen: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'success' | 'unknown' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);

  React.useEffect(() => {
    // Health check
    documentsService.ping().then(ok => {
      if (!ok) console.warn('[Upload] AI Engine ping failed. Check function deployment.');
      else console.log('[Upload] AI Engine connected.');
    });
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processFile(file);
  };

  const processFile = async (file: File) => {
    try {
      setStatus('uploading');
      setCreatedTaskId(null);

      const household = await tasksService.getHousehold();
      if (!household) throw new Error("Por favor, selecione uma casa primeiro.");

      // 1. Upload & Create Record
      const result = await documentsService.uploadAndProcess(file);
      if (!result) throw new Error("Falha no upload do documento.");

      // 2. Internal Analysis State
      setStatus('analyzing');
      const response = await documentsService.processDocument(result.document_id, result.storage_path, household.id);

      console.log('[Upload] FULL Response from Function:', response);

      if (response && response.success) {
        setAnalysis(response.extracted);
        if (response.task_id) {
          setCreatedTaskId(response.task_id);
        }
        setStatus(response.status === 'identified' ? 'success' : 'unknown');
      } else {
        const msg = response?.error || "Falha técnica inesperada";
        const trace = response?.trace ? ` [Rastro: ${response.trace.join(' > ')}]` : '';
        throw new Error(msg + trace);
      }

    } catch (err: any) {
      console.error('[Upload] Error Details:', err);
      setErrorMessage(err.message || 'Ocorreu um erro inesperado.');
      setStatus('error');
    }
  };

  const handleViewTask = () => {
    if (createdTaskId) {
      navigate(`/tasks/${createdTaskId}`);
    } else {
      navigate('/home');
    }
  };

  const handleDone = () => {
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 lg:pb-0">
      {/* Blue Hero Header */}
      <header className="bg-primary-500 pt-14 pb-20 px-6 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-400/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-48 h-48 bg-primary-600/20 rounded-full blur-2xl" />

        <div className="flex items-center gap-4 relative z-10">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-white/20 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-primary-100 text-[10px] font-bold uppercase tracking-widest">Documentos</p>
            <h1 className="text-white text-2xl font-bold">Analisar Documento</h1>
          </div>
        </div>
      </header>

      <div className="px-4 -mt-12 relative z-20 max-w-2xl mx-auto">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*,application/pdf"
          onChange={handleFileSelect}
        />

        {status === 'idle' && (
          <div className="space-y-6">
            <div
              className="border-2 border-dashed border-primary-200 bg-primary-50 rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-primary-100 transition-all group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-bold text-primary-900 mb-1">Toque para enviar</h3>
              <p className="text-sm text-primary-600/80 font-medium">Boleto, multa ou contrato (PDF, JPG, PNG)</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                className="bg-slate-50 p-6 rounded-2xl flex flex-col items-center gap-3 hover:bg-slate-100 transition-colors border border-slate-100 shadow-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-8 h-8 text-slate-700" />
                <span className="font-bold text-xs text-slate-700 uppercase tracking-tight">Câmera</span>
              </button>
              <button
                className="bg-slate-50 p-6 rounded-2xl flex flex-col items-center gap-3 hover:bg-slate-100 transition-colors border border-slate-100 shadow-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <File className="w-8 h-8 text-slate-700" />
                <span className="font-bold text-xs text-slate-700 uppercase tracking-tight">Arquivos</span>
              </button>
            </div>
          </div>
        )}

        {(status === 'uploading' || status === 'analyzing') && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative mb-8">
              <div className="w-24 h-24 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
              <Sparkles className="w-8 h-8 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {status === 'uploading' ? 'Enviando...' : 'Inteligência lendo o documento...'}
            </h3>
            <p className="text-slate-500 max-w-[280px] font-medium leading-relaxed">
              Estamos extraindo data e valor para organizar sua vida. Aguarde um instante.
            </p>
          </div>
        )}

        {status === 'success' && analysis && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 pb-10">
            <div className="bg-success-50 p-4 rounded-2xl flex items-center gap-3 mb-6 border border-success-100 shadow-sm">
              <div className="bg-success-500 text-white p-2 rounded-full">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-success-800 font-bold leading-tight">Documento Interpretado!</p>
                <p className="text-success-700 text-xs font-medium">Ele já foi agendado na sua lista de itens.</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden mb-6">
              <div className="bg-slate-900 p-6 text-white flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black">{analysis.title_suggested}</h2>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1 opacity-70">{analysis.issuer || 'Emissor desconhecido'}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10">
                  <Sparkles className="w-6 h-6 text-amber-300" />
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-center gap-2 text-slate-400 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase">Vencimento</span>
                    </div>
                    <p className="font-black text-slate-700">{analysis.due_date ? new Date(analysis.due_date).toLocaleDateString('pt-BR') : 'Sem data'}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-center gap-2 text-slate-400 mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase">Valor</span>
                    </div>
                    <p className="font-black text-slate-700">{analysis.amount ? `R$ ${analysis.amount.toFixed(2).replace('.', ',')}` : 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary-50 p-3 rounded-xl">
                      <Clock className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Resumo</p>
                      <p className="text-sm font-semibold text-slate-700 leading-snug mt-0.5">{analysis.summary_simple}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-danger-50 p-3 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-danger-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Impacto</p>
                      <p className="text-sm font-semibold text-slate-700 leading-snug mt-0.5">{analysis.impact_text}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full space-y-3">
              {createdTaskId && (
                <Button fullWidth onClick={handleViewTask} size="lg">Ver detalhes do item</Button>
              )}
              <Button fullWidth onClick={handleDone} variant={createdTaskId ? 'outline' : 'primary'} size="lg">Ir para a lista</Button>
              <Button variant="ghost" fullWidth onClick={() => setStatus('idle')} className="text-slate-400 font-bold">Analisar outro</Button>
            </div>
          </div>
        )}

        {(status === 'unknown' || status === 'error') && (
          <div className="flex flex-col items-center justify-center py-10 text-center animate-in zoom-in duration-300">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 ${status === 'unknown' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
              {status === 'unknown' ? <Clock className="w-12 h-12" /> : <AlertCircle className="w-12 h-12" />}
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 leading-tight">
              {status === 'unknown' ? 'Hum... faltaram dados' : 'Erro no processamento'}
            </h3>
            <p className="text-slate-500 mb-10 font-medium leading-relaxed max-w-sm">
              {status === 'unknown'
                ? 'Encontramos o documento, mas não conseguimos ler a data ou valor automaticamente. Você pode cadastrar manualmente para garantir a segurança.'
                : errorMessage || 'O arquivo enviado não pôde ser processado. Verifique se a imagem está legível.'}
            </p>
            <div className="w-full space-y-4">
              <Button fullWidth onClick={() => navigate('/new-task')} size="lg">Cadastrar Manualmente</Button>
              <Button variant="ghost" fullWidth onClick={() => setStatus('idle')} className="font-bold text-slate-400">Tentar novamente</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
