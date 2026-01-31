import React, { useState, useEffect } from 'react';
import { FileText, Download, Trash2, Eye, Receipt, CheckCircle2, Clock, AlertCircle, Filter, FolderOpen } from 'lucide-react';
import { taxDocumentsService, TaxDocument, DeductionCategory } from '../services/tax_documents';

interface TaxDocumentsListProps {
    year: number;
    showDeductibleOnly?: boolean;
    onDocumentClick?: (doc: TaxDocument) => void;
}

const CATEGORY_COLORS: Record<DeductionCategory, { bg: string; text: string; label: string }> = {
    health: { bg: 'bg-rose-50', text: 'text-rose-600', label: 'Saúde' },
    education: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Educação' },
    dependent: { bg: 'bg-purple-50', text: 'text-purple-600', label: 'Dependente' },
    pension: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Pensão' },
    pgbl: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'PGBL' },
    other: { bg: 'bg-slate-50', text: 'text-slate-600', label: 'Outros' },
    none: { bg: 'bg-slate-50', text: 'text-slate-400', label: 'Não Dedutível' }
};

const STATUS_ICONS: Record<TaxDocument['status'], React.ReactNode> = {
    pending: <Clock className="w-4 h-4 text-amber-500" />,
    processing: <Clock className="w-4 h-4 text-blue-500 animate-spin" />,
    processed: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    error: <AlertCircle className="w-4 h-4 text-rose-500" />,
    manual: <CheckCircle2 className="w-4 h-4 text-primary-500" />
};

export const TaxDocumentsList: React.FC<TaxDocumentsListProps> = ({
    year,
    showDeductibleOnly = false,
    onDocumentClick
}) => {
    const [documents, setDocuments] = useState<TaxDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'deductible' | 'pending'>('all');
    const [summary, setSummary] = useState<{ total: number; count: number }>({ total: 0, count: 0 });

    useEffect(() => {
        loadDocuments();
    }, [year, showDeductibleOnly]);

    const loadDocuments = async () => {
        setLoading(true);
        const docs = showDeductibleOnly
            ? await taxDocumentsService.getDeductibleDocuments(year)
            : await taxDocumentsService.getDocuments(year);
        setDocuments(docs);

        // Calculate summary
        const deductible = docs.filter(d => d.is_deductible);
        const total = deductible.reduce((sum, d) => sum + (d.deduction_amount || 0), 0);
        setSummary({ total, count: deductible.length });

        setLoading(false);
    };

    const handleDelete = async (doc: TaxDocument, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(`Excluir "${doc.file_name}"?`)) return;

        const success = await taxDocumentsService.deleteDocument(doc.id);
        if (success) {
            setDocuments(prev => prev.filter(d => d.id !== doc.id));
        }
    };

    const handleDownload = async (doc: TaxDocument, e: React.MouseEvent) => {
        e.stopPropagation();
        const url = await taxDocumentsService.getDownloadUrl(doc.file_path);
        if (url) {
            window.open(url, '_blank');
        }
    };

    const filteredDocuments = documents.filter(doc => {
        if (filter === 'deductible') return doc.is_deductible;
        if (filter === 'pending') return doc.status === 'pending' || doc.status === 'processing';
        return true;
    });

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short'
        });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-[32px] border border-slate-200 p-8">
                <div className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
                    <span className="text-slate-500">Carregando documentos...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary-50 p-3 rounded-2xl">
                            <FolderOpen className="w-6 h-6 text-primary-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Pasta Fiscal {year}</h3>
                            <p className="text-sm text-slate-500">
                                {summary.count} documentos dedutíveis • {formatCurrency(summary.total)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                    {(['all', 'deductible', 'pending'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {f === 'all' && 'Todos'}
                            {f === 'deductible' && 'Dedutíveis'}
                            {f === 'pending' && 'Pendentes'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Documents List */}
            {filteredDocuments.length === 0 ? (
                <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="font-bold text-slate-800">Nenhum documento ainda</p>
                    <p className="text-sm text-slate-500 mt-1">
                        Escaneie notas fiscais e recibos para organizar sua declaração
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-slate-50">
                    {filteredDocuments.map((doc) => (
                        <div
                            key={doc.id}
                            onClick={() => onDocumentClick?.(doc)}
                            className="p-4 hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-4"
                        >
                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${doc.is_deductible
                                    ? CATEGORY_COLORS[doc.deduction_category || 'other'].bg
                                    : 'bg-slate-100'
                                }`}>
                                <Receipt className={`w-6 h-6 ${doc.is_deductible
                                        ? CATEGORY_COLORS[doc.deduction_category || 'other'].text
                                        : 'text-slate-400'
                                    }`} />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-800 truncate">
                                        {doc.extracted_data?.provider_name || doc.file_name}
                                    </p>
                                    {STATUS_ICONS[doc.status]}
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    {doc.is_deductible && doc.deduction_category && (
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${CATEGORY_COLORS[doc.deduction_category].bg
                                            } ${CATEGORY_COLORS[doc.deduction_category].text}`}>
                                            {CATEGORY_COLORS[doc.deduction_category].label}
                                        </span>
                                    )}
                                    <span className="text-xs text-slate-400">
                                        {formatDate(doc.created_at)}
                                    </span>
                                </div>
                            </div>

                            {/* Amount */}
                            {doc.deduction_amount && doc.deduction_amount > 0 && (
                                <div className="text-right">
                                    <p className="font-bold text-emerald-600">
                                        {formatCurrency(doc.deduction_amount)}
                                    </p>
                                    <p className="text-[10px] text-slate-400 uppercase">Dedutível</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={(e) => handleDownload(doc, e)}
                                    className="p-2 rounded-lg hover:bg-slate-200 transition-all"
                                    title="Download"
                                >
                                    <Download className="w-4 h-4 text-slate-400" />
                                </button>
                                <button
                                    onClick={(e) => handleDelete(doc, e)}
                                    className="p-2 rounded-lg hover:bg-rose-100 transition-all"
                                    title="Excluir"
                                >
                                    <Trash2 className="w-4 h-4 text-slate-400 hover:text-rose-500" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Footer - Export */}
            {filteredDocuments.length > 0 && (
                <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <button className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center gap-2 transition-all">
                        <Download className="w-5 h-5" />
                        Baixar Pasta Fiscal (PDF)
                    </button>
                </div>
            )}
        </div>
    );
};
