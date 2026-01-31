import React, { useState, useRef } from 'react';
import { Upload, Camera, FileText, Loader2, CheckCircle2, XCircle, Sparkles, Receipt, AlertCircle } from 'lucide-react';
import { taxDocumentsService, DocumentAnalysisResult, DeductionCategory } from '../services/tax_documents';

interface TaxDocumentUploadProps {
    year: number;
    onUploadComplete?: (result: DocumentAnalysisResult) => void;
    onCancel?: () => void;
}

const DEDUCTION_LABELS: Record<DeductionCategory, string> = {
    health: '🏥 Saúde (Sem limite)',
    education: '📚 Educação (Até R$ 3.561,50)',
    dependent: '👨‍👩‍👧 Dependente',
    pension: '💰 Pensão Alimentícia',
    pgbl: '🏦 Previdência PGBL',
    other: '📄 Outras Deduções',
    none: '❌ Não Dedutível'
};

export const TaxDocumentUpload: React.FC<TaxDocumentUploadProps> = ({
    year,
    onUploadComplete,
    onCancel
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'success' | 'error'>('idle');
    const [result, setResult] = useState<DocumentAnalysisResult | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [dragOver, setDragOver] = useState(false);

    const handleFileSelect = async (file: File) => {
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            setErrorMessage('Tipo de arquivo não suportado. Use JPG, PNG, WebP ou PDF.');
            setStatus('error');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setErrorMessage('Arquivo muito grande. Máximo: 10MB.');
            setStatus('error');
            return;
        }

        try {
            setStatus('uploading');
            setErrorMessage('');

            // Brief pause for UX
            await new Promise(r => setTimeout(r, 500));
            setStatus('analyzing');

            const analysisResult = await taxDocumentsService.uploadAndAnalyze(file, year);

            if (analysisResult.success) {
                setResult(analysisResult);
                setStatus('success');
                onUploadComplete?.(analysisResult);
            } else {
                throw new Error(analysisResult.error || 'Falha na análise');
            }
        } catch (error: any) {
            console.error('[TaxDocumentUpload] Error:', error);
            setErrorMessage(error.message || 'Erro ao processar documento');
            setStatus('error');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => setDragOver(false);

    const reset = () => {
        setStatus('idle');
        setResult(null);
        setErrorMessage('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-lg overflow-hidden">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,application/pdf"
                onChange={handleInputChange}
            />

            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                        <Receipt className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Escanear Documento Fiscal</h3>
                        <p className="text-primary-100 text-sm">
                            IA identifica automaticamente se é dedutível
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Idle State - Upload Area */}
                {status === 'idle' && (
                    <div className="space-y-4">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            className={`
                                border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
                                ${dragOver
                                    ? 'border-primary-400 bg-primary-50'
                                    : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'
                                }
                            `}
                        >
                            <div className="flex flex-col items-center gap-4">
                                <div className={`p-4 rounded-full transition-all ${dragOver ? 'bg-primary-100' : 'bg-slate-100'}`}>
                                    <Upload className={`w-8 h-8 ${dragOver ? 'text-primary-600' : 'text-slate-400'}`} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-700">
                                        Arraste ou toque para enviar
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Nota fiscal, recibo médico, boleto de escola...
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center justify-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all"
                            >
                                <Camera className="w-5 h-5 text-slate-600" />
                                <span className="font-medium text-slate-700">Câmera</span>
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center justify-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all"
                            >
                                <FileText className="w-5 h-5 text-slate-600" />
                                <span className="font-medium text-slate-700">Arquivos</span>
                            </button>
                        </div>

                        <p className="text-xs text-slate-400 text-center">
                            Formatos: JPG, PNG, PDF • Máximo: 10MB
                        </p>
                    </div>
                )}

                {/* Loading States */}
                {(status === 'uploading' || status === 'analyzing') && (
                    <div className="py-12 flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
                            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-amber-500 animate-pulse" />
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-slate-800">
                                {status === 'uploading' ? 'Enviando documento...' : 'IA analisando documento...'}
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                                {status === 'analyzing' && 'Identificando tipo e valores dedutíveis'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Success State */}
                {status === 'success' && result && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4">
                        {/* Result Header */}
                        <div className={`p-4 rounded-2xl flex items-center gap-3 ${result.is_deductible
                                ? 'bg-emerald-50 border border-emerald-100'
                                : 'bg-amber-50 border border-amber-100'
                            }`}>
                            {result.is_deductible ? (
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            ) : (
                                <AlertCircle className="w-8 h-8 text-amber-500" />
                            )}
                            <div>
                                <p className={`font-bold ${result.is_deductible ? 'text-emerald-800' : 'text-amber-800'}`}>
                                    {result.is_deductible ? 'Documento Dedutível!' : 'Documento Não Dedutível'}
                                </p>
                                <p className={`text-sm ${result.is_deductible ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {result.is_deductible
                                        ? 'Este documento pode reduzir seu imposto'
                                        : 'Arquivado para sua organização'}
                                </p>
                            </div>
                        </div>

                        {/* Extracted Data */}
                        {result.is_deductible && (
                            <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Categoria</span>
                                    <span className="font-bold text-slate-800">
                                        {result.deduction_category ? DEDUCTION_LABELS[result.deduction_category] : 'Analisando...'}
                                    </span>
                                </div>
                                {result.deduction_amount && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-500">Valor Dedutível</span>
                                        <span className="font-bold text-emerald-600 text-lg">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.deduction_amount)}
                                        </span>
                                    </div>
                                )}
                                {result.confidence_score && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-500">Confiança da IA</span>
                                        <span className={`font-bold ${result.confidence_score >= 0.8 ? 'text-emerald-600' :
                                                result.confidence_score >= 0.5 ? 'text-amber-600' : 'text-rose-600'
                                            }`}>
                                            {(result.confidence_score * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* AI Reasoning */}
                        {result.reasoning && (
                            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4">
                                <p className="text-xs font-bold uppercase tracking-widest text-primary-600 mb-2">
                                    🤖 Análise da IA
                                </p>
                                <p className="text-sm text-primary-800">
                                    {result.reasoning}
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={reset}
                                className="flex-1 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all"
                            >
                                Escanear Outro
                            </button>
                            {onCancel && (
                                <button
                                    onClick={onCancel}
                                    className="py-4 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-all"
                                >
                                    Fechar
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Error State */}
                {status === 'error' && (
                    <div className="py-8 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
                            <XCircle className="w-8 h-8 text-rose-500" />
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-slate-800">Erro no processamento</p>
                            <p className="text-sm text-slate-500 mt-1">{errorMessage}</p>
                        </div>
                        <button
                            onClick={reset}
                            className="py-3 px-6 rounded-xl bg-slate-900 text-white font-bold"
                        >
                            Tentar Novamente
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
