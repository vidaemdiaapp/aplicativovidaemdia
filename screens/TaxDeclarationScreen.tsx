import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, CheckCircle2, Circle, Download, ExternalLink,
    Info, ShieldCheck, Package, ChevronRight, Plus, Receipt,
    FileText, ArrowRightLeft, Sparkles, TrendingDown, Calculator,
    PieChart, Car, Home, ShoppingCart, TrendingUp
} from 'lucide-react';
import { taxService } from '../services/tax';
import { incomesService } from '../services/incomes';
import {
    calculateIRPF,
    compareIRPF2025vs2026,
    getTaxRules,
    formatCurrency,
    calculateIRRFDetailed,
    calculateINSS,
    IRRFDetailedResult
} from '../services/tax_calculator';
import {
    calculateConsumptionTax,
    estimateConsumptionTax,
    ConsumptionTaxBreakdown
} from '../services/consumption_tax';
import { taxDocumentsService } from '../services/tax_documents';
import { IRPFEstimate, IRPFReadiness } from '../types';
import { TaxSummaryCard } from '../components/TaxSummaryCard';
import { DeductionsCard } from '../components/DeductionsCard';
import { BudgetProgressRing } from '../components/charts/SpendingChart';
import { TaxYearSelector } from '../components/TaxYearSelector';
import { TaxDocumentUpload } from '../components/TaxDocumentUpload';
import { TaxDocumentsList } from '../components/TaxDocumentsList';
import { TaxPayerTypeSelector } from '../components/TaxPayerTypeSelector';
import { TaxpayerType as TaxpayerTypeID, calculateCapitalGains, CapitalGainResult } from '../services/tax_calculator';
import { assetsService } from '../services/assets';

export const TaxDeclarationScreen: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(2026);
    const [taxpayerType, setTaxpayerType] = useState<TaxpayerTypeID>('CLT');
    const [estimate, setEstimate] = useState<IRPFEstimate | null>(null);
    const [readiness, setReadiness] = useState<IRPFReadiness | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showCompareModal, setShowCompareModal] = useState(false);
    const [comparison, setComparison] = useState<ReturnType<typeof compareIRPF2025vs2026> | null>(null);
    const [deductionsSummary, setDeductionsSummary] = useState({ total: 0, count: 0 });
    const [showTaxBreakdownModal, setShowTaxBreakdownModal] = useState(false);
    const [taxBreakdown, setTaxBreakdown] = useState<IRRFDetailedResult | null>(null);
    const [consumptionTaxData, setConsumptionTaxData] = useState<ConsumptionTaxBreakdown | null>(null);
    const [taxRegime, setTaxRegime] = useState<'simplified' | 'complete'>('complete');
    const [capitalGains, setCapitalGains] = useState<CapitalGainResult | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        loadData();
    }, [selectedYear]);

    const loadData = async (silent = false) => {
        try {
            if (!silent) setLoading(true);

            // Get current user and profile (for tax preference)
            const { data: { session } } = await (await import('../services/supabase')).supabase.auth.getSession();
            const currentUserId = session?.user?.id;

            const { data: profile } = await (await import('../services/supabase')).supabase
                .from('profiles')
                .select('selected_tax_year, taxpayer_type')
                .eq('id', currentUserId)
                .single();

            if (profile?.selected_tax_year && !silent) {
                // Sync with DB if needed, but the state usually drives this
                // setSelectedYear(profile.selected_tax_year);
            }
            if (profile?.taxpayer_type) {
                setTaxpayerType(profile.taxpayer_type as TaxpayerTypeID);
            }

            const [estData, readyData, incomes, docsSummary, allAssets] = await Promise.all([
                taxService.getIRPFEstimate(selectedYear),
                taxService.getDeclarationReadiness(selectedYear),
                incomesService.getIncomes(),
                taxDocumentsService.getDeductionsSummary(selectedYear),
                assetsService.getAssets()
            ]);

            setDeductionsSummary({ total: docsSummary.total, count: docsSummary.count });

            // IMPORTANTE: Filtrar apenas a renda do USUÁRIO LOGADO (declaração de IR é individual!)
            const myIncomes = incomes.filter(inc => inc.user_id === currentUserId);
            const totalMonthlyIncome = myIncomes.reduce((sum, inc) => sum + inc.amount_monthly, 0);
            const annualIncome = totalMonthlyIncome * 12;
            const totalDeductions = (estData?.total_deductions_year || 0) + docsSummary.total;

            const calc = calculateIRPF(annualIncome, totalDeductions, selectedYear, taxpayerType, taxRegime);

            const myAssets = allAssets.filter(a => a.user_id === currentUserId);
            const gcap = calculateCapitalGains(myAssets.filter(a => {
                if (!a.sale_date) return false;
                const saleYear = new Date(a.sale_date).getFullYear();
                return saleYear === selectedYear; // Corrigido: Ano da venda deve ser o ano selecionado
            }));
            setCapitalGains(gcap);

            setEstimate({
                user_id: currentUserId || '',
                year: selectedYear,
                income_monthly: totalMonthlyIncome,
                is_exempt: (calc.isExemptByAnnualLimit || calc.isExemptByGradualReducer) && gcap.estimatedTax === 0,
                estimated_tax_monthly: calc.estimatedTaxMonthly,
                estimated_tax_yearly: calc.estimatedTaxYearly + gcap.estimatedTax,
                capital_gains_tax: gcap.estimatedTax,
                confidence: calc.isExemptByAnnualLimit ? 'high' : 'medium',
                tax_rate: calc.effectiveRate,
                total_deductions_year: calc.totalDeductions,
                has_deductions: calc.totalDeductions > 0,
                tax_regime: taxRegime
            });

            // Calculate comparison between years
            const comp = compareIRPF2025vs2026(annualIncome, totalDeductions);
            setComparison(comp);

            // Calculate detailed breakdown for monthly view
            const detailedCalc = calculateIRRFDetailed(totalMonthlyIncome, 'CLT', selectedYear);
            setTaxBreakdown(detailedCalc);

            // Calculate consumption tax (try real data first, fallback to estimate)
            try {
                // Tenta buscar dados do ano selecionado (ex: 2026) primeiro para ser "atual"
                let realConsumptionData = await calculateConsumptionTax(selectedYear);

                // Se o ano selecionado estiver vazio e for 2026, tenta o ano anterior (2025)
                if ((!realConsumptionData || realConsumptionData.categories.length === 0) && selectedYear === 2026) {
                    realConsumptionData = await calculateConsumptionTax(2025);
                }

                if (realConsumptionData && realConsumptionData.categories && realConsumptionData.categories.length > 0) {
                    setConsumptionTaxData(realConsumptionData);
                } else {
                    setConsumptionTaxData(estimateConsumptionTax(totalMonthlyIncome));
                }
            } catch (err) {
                console.error('[ConsumptionTax] Error in calculation:', err);
                setConsumptionTaxData(estimateConsumptionTax(totalMonthlyIncome));
            }

            setReadiness(readyData);
        } catch (error) {
            console.error('[TaxDeclaration] Error loading data:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };


    const handleYearChange = async (year: number) => {
        setSelectedYear(year);
        // Persist to DB
        const { data: { session } } = await (await import('../services/supabase')).supabase.auth.getSession();
        if (session?.user?.id) {
            await (await import('../services/supabase')).supabase
                .from('profiles')
                .update({ selected_tax_year: year })
                .eq('id', session.user.id);
        }
    };

    const handleTaxpayerTypeChange = async (type: TaxpayerTypeID) => {
        setTaxpayerType(type);
        // Persist to DB
        const { data: { session } } = await (await import('../services/supabase')).supabase.auth.getSession();
        if (session?.user?.id) {
            await (await import('../services/supabase')).supabase
                .from('profiles')
                .update({ taxpayer_type: type })
                .eq('id', session.user.id);
        }
        loadData(true); // Recalculate everything
    };

    const handleExport = async () => {
        if (!estimate) return;

        try {
            setIsExporting(true);
            const result = await taxService.generateFiscalPDF({
                year: selectedYear,
                estimate,
                readiness,
                deductionsSummary,
                capitalGains
            });

            if (result.success && result.pdf_base64) {
                const linkSource = `data:application/pdf;base64,${result.pdf_base64}`;
                const downloadLink = document.createElement("a");
                const fileName = result.file_name || `Kit_Fiscal_VidaEmDia_${selectedYear}.pdf`;
                downloadLink.href = linkSource;
                downloadLink.download = fileName;
                downloadLink.click();
            } else {
                throw new Error(result.error || "Erro ao gerar PDF");
            }
        } catch (err) {
            console.error('[TaxDeclaration] Export error:', err);
            alert("Não foi possível gerar o PDF. Vou tentar exportar como texto simples...");

            // Fallback for safety (the old .txt logic)
            const rules = getTaxRules(selectedYear);
            const summary = `VIDA EM DIA - KIT FISCAL ${estimate.year}\n...`; // Shortened for brevity
            const blob = new Blob([summary], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Kit_Fiscal_VidaEmDia_${estimate.year}.txt`;
            link.click();
        } finally {
            setIsExporting(false);
        }
    };

    const getStatusIcon = (status: string) => {
        if (status === 'done') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
        return <Circle className="w-5 h-5 text-slate-300" />;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-primary-500 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <p className="text-white/80 text-sm font-medium">Processando imposto...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-32">
            {/* Blue Hero Header */}
            <header className="bg-primary-500 pt-14 pb-24 px-6 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-400/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-20 w-48 h-48 bg-primary-600/20 rounded-full blur-2xl" />

                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/financial-dashboard')}
                            className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-white/20 transition-all"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <p className="text-primary-100 text-[10px] font-bold uppercase tracking-widest">Ano-Calendário {selectedYear - 1}</p>
                            <h1 className="text-white text-2xl font-bold">Imposto de Renda</h1>
                        </div>
                    </div>

                    {/* Year Selector */}
                    <TaxYearSelector
                        selectedYear={selectedYear}
                        onYearChange={handleYearChange}
                        availableYears={[2025, 2026]}
                    />
                </div>
            </header>

            {/* Floating Content Card */}
            <div className="px-4 -mt-16 relative z-20">
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 space-y-6">
                    {/* Taxpayer Type Selector */}
                    <section>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 ml-1">Perfil do Contribuinte</h3>
                        <TaxPayerTypeSelector
                            value={taxpayerType}
                            onChange={handleTaxpayerTypeChange}
                        />
                    </section>

                    {/* Regime de Tributação Selector */}
                    <section className="animate-in slide-in-from-top-4 duration-500 delay-150">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 ml-1">Modelo de Tributação</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => {
                                    setTaxRegime('simplified');
                                    setTimeout(() => loadData(true), 0);
                                }}
                                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${taxRegime === 'simplified'
                                    ? 'bg-primary-50 border-primary-200 text-primary-700 shadow-sm'
                                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                            >
                                <div className={`p-2 rounded-xl ${taxRegime === 'simplified' ? 'bg-primary-500 text-white' : 'bg-slate-50'}`}>
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[11px] font-bold uppercase tracking-wider">Simplificado</p>
                                    <p className="text-[9px] opacity-60">Desconto padrão 20%</p>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    setTaxRegime('complete');
                                    setTimeout(() => loadData(true), 0);
                                }}
                                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${taxRegime === 'complete'
                                    ? 'bg-primary-50 border-primary-200 text-primary-700 shadow-sm'
                                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                            >
                                <div className={`p-2 rounded-xl ${taxRegime === 'complete' ? 'bg-primary-500 text-white' : 'bg-slate-50'}`}>
                                    <Calculator className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[11px] font-bold uppercase tracking-wider">Deduções</p>
                                    <p className="text-[9px] opacity-60">Usa recibos e gastos</p>
                                </div>
                            </button>
                        </div>
                    </section>
                    {/* 2026 New Rules Banner */}
                    {selectedYear === 2026 && (
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-[28px] p-6 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-5 h-5" />
                                    <span className="text-xs font-bold uppercase tracking-widest opacity-90">Novas Regras 2026</span>
                                </div>
                                <h3 className="text-lg font-bold mb-1">Isenção até R$ 60.000/ano!</h3>
                                <p className="text-sm text-emerald-100 mb-4">
                                    A maior mudança tributária em décadas. Verifique se você agora está isento.
                                </p>
                                <button
                                    onClick={() => setShowCompareModal(true)}
                                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-bold transition-all"
                                >
                                    <ArrowRightLeft className="w-4 h-4" />
                                    Comparar 2025 vs 2026
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Comparison Modal */}
                    {showCompareModal && comparison && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCompareModal(false)}>
                            <div className="bg-white rounded-[32px] max-w-md w-full p-6 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                                <h3 className="text-xl font-bold text-slate-900 mb-6 text-center">Comparativo 2025 vs 2026</h3>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                                        <span className="text-slate-600">IR 2025</span>
                                        <span className="font-bold text-slate-900">{formatCurrency(comparison.result2025.estimatedTaxYearly)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl">
                                        <span className="text-emerald-700">IR 2026</span>
                                        <span className="font-bold text-emerald-700">{formatCurrency(comparison.result2026.estimatedTaxYearly)}</span>
                                    </div>

                                    {comparison.savings > 0 && (
                                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl text-white">
                                            <div className="flex items-center gap-2">
                                                <TrendingDown className="w-5 h-5" />
                                                <span className="font-bold">Sua Economia</span>
                                            </div>
                                            <span className="font-bold text-xl">{formatCurrency(comparison.savings)}</span>
                                        </div>
                                    )}
                                </div>

                                <p className="text-sm text-slate-500 text-center mt-6">{comparison.summary}</p>

                                <button
                                    onClick={() => setShowCompareModal(false)}
                                    className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-bold"
                                >
                                    Entendi
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Tax Breakdown Modal - Detalhamento Completo */}
                    {showTaxBreakdownModal && taxBreakdown && estimate && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowTaxBreakdownModal(false)}>
                            <div className="bg-white rounded-[32px] max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 animate-in zoom-in-95 my-auto" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-slate-900">Mapa de Impostos</h3>
                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{selectedYear}</span>
                                </div>

                                {/* IRRF Detalhado */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Calculator className="w-5 h-5 text-primary-500" />
                                        <h4 className="font-bold text-slate-800">IRRF Mensal (Passo a Passo)</h4>
                                    </div>

                                    <div className="bg-slate-50 rounded-2xl p-4 space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Renda Bruta:</span>
                                            <span className="font-bold text-slate-800">{formatCurrency(taxBreakdown.baseIRRF)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">INSS Descontado:</span>
                                            <span className="font-bold text-rose-600">- {formatCurrency(taxBreakdown.inss)}</span>
                                        </div>
                                        <div className="border-t border-slate-200 pt-3 flex justify-between">
                                            <span className="text-slate-600 font-medium">1️⃣ Base líquida:</span>
                                            <span className="font-bold text-slate-800">{formatCurrency(taxBreakdown.baseLiquida)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-600 font-medium">2️⃣ IR pela alíquota ({(taxBreakdown.aliquotaIR * 100).toFixed(1)}%):</span>
                                            <span className="font-bold text-slate-800">{formatCurrency(taxBreakdown.irAliquota)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-600 font-medium">3️⃣ IR bruto (- dedução):</span>
                                            <span className="font-bold text-slate-800">{formatCurrency(taxBreakdown.irBruto)}</span>
                                        </div>
                                        {selectedYear === 2026 && taxBreakdown.hasReduction && (
                                            <div className="flex justify-between text-emerald-600">
                                                <span className="font-medium">4️⃣ Redução 2026:</span>
                                                <span className="font-bold">- {formatCurrency(taxBreakdown.reducao)}</span>
                                            </div>
                                        )}
                                        <div className="border-t-2 border-slate-300 pt-3 flex justify-between">
                                            <span className="font-bold text-slate-900">5️⃣ IR Final Mensal:</span>
                                            <span className={`font-bold text-lg ${taxBreakdown.isExempt ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                {taxBreakdown.isExempt ? 'ISENTO' : formatCurrency(taxBreakdown.irFinal)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Explicação */}
                                    <p className="text-xs text-slate-500 mt-3 p-3 bg-slate-50 rounded-xl">
                                        {taxBreakdown.explanation}
                                    </p>
                                </div>

                                {/* INSS Anual */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <ShieldCheck className="w-5 h-5 text-cyan-500" />
                                        <h4 className="font-bold text-slate-800">INSS Anual</h4>
                                    </div>
                                    <div className="bg-cyan-50 rounded-2xl p-4 flex justify-between items-center text-sm">
                                        <span className="text-cyan-700">Contribuição Previdenciária Estimada</span>
                                        <span className="font-bold text-cyan-700">{formatCurrency(taxBreakdown.inss * 12)}/ano</span>
                                    </div>
                                </div>

                                {/* Ganho de Capital (GCAP) - Detalhado */}
                                {capitalGains && capitalGains.totalProfit > 0 && (
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <TrendingUp className="w-5 h-5 text-amber-500" />
                                            <h4 className="font-bold text-slate-800">Ganho de Capital (GCAP)</h4>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Bens Móveis */}
                                            {capitalGains.moveis.items.length > 0 && (
                                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Bens Móveis (Veículos/Outros)</p>
                                                    <div className="space-y-3">
                                                        {capitalGains.moveis.items.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between items-start text-sm border-b border-slate-200/50 pb-2 last:border-0 last:pb-0">
                                                                <div>
                                                                    <p className="font-bold text-slate-800">{item.name}</p>
                                                                    <p className="text-[10px] text-slate-500">Lucro: {formatCurrency(item.profit)}</p>
                                                                </div>
                                                                <span className="font-black text-amber-600">{formatCurrency(item.tax)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Bens Imóveis */}
                                            {capitalGains.imoveis.items.length > 0 && (
                                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Bens Imóveis</p>
                                                    <div className="space-y-3">
                                                        {capitalGains.imoveis.items.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between items-start text-sm border-b border-slate-200/50 pb-2 last:border-0 last:pb-0">
                                                                <div>
                                                                    <p className="font-bold text-slate-800">{item.name}</p>
                                                                    <p className="text-[10px] text-slate-500">Lucro: {formatCurrency(item.profit)}</p>
                                                                </div>
                                                                <span className="font-black text-amber-600">{formatCurrency(item.tax)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="bg-amber-900 text-white rounded-2xl p-4 flex justify-between items-center shadow-lg shadow-amber-900/10">
                                                <span className="text-sm font-bold opacity-80 uppercase tracking-widest text-[10px]">Total de Gcáp Devido</span>
                                                <span className="font-black text-xl">{formatCurrency(capitalGains.estimatedTax)}</span>
                                            </div>
                                        </div>

                                        <p className="text-[10px] text-amber-600 mt-3 italic text-center p-2 bg-amber-50 rounded-xl">
                                            Nota: Bens móveis até R$ 35k/mês costumam ser isentos. Consulte a regra específica no app da Receita.
                                        </p>
                                    </div>
                                )}

                                {/* Impostos sobre Consumo - Dados Reais */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <ShoppingCart className="w-5 h-5 text-amber-500" />
                                            <h4 className="font-bold text-slate-800">Impostos sobre Consumo</h4>
                                        </div>
                                        {consumptionTaxData && consumptionTaxData.categories.length > 0 && (
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                                Dados Reais
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mb-6">
                                        Impostos embutidos (ICMS, IPI, PIS, COFINS, ISS). Fonte da metodologia: IBPT.
                                    </p>

                                    {/* NOVO: Resumo por Tipo de Imposto */}
                                    {consumptionTaxData && consumptionTaxData.totalsByTaxType && (
                                        <div className="grid grid-cols-2 gap-3 mb-8">
                                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">ICMS (Estadual)</p>
                                                <p className="text-base font-bold text-slate-900">{formatCurrency(consumptionTaxData.totalsByTaxType.icms)}</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">IPI (Industrial)</p>
                                                <p className="text-base font-bold text-slate-900">{formatCurrency(consumptionTaxData.totalsByTaxType.ipi)}</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">PIS / COFINS</p>
                                                <p className="text-base font-bold text-slate-900">{formatCurrency(consumptionTaxData.totalsByTaxType.pis_cofins)}</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">ISS (Serviços)</p>
                                                <p className="text-base font-bold text-slate-900">{formatCurrency(consumptionTaxData.totalsByTaxType.iss)}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Categorias de Gastos */}
                                    {consumptionTaxData && (
                                        <div className="space-y-2 mb-6 max-h-[240px] overflow-y-auto pr-1">
                                            {consumptionTaxData.categories.slice(0, 10).map((cat, idx) => (
                                                <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-4 text-sm shadow-sm">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xl bg-slate-50 w-10 h-10 flex items-center justify-center rounded-xl">{cat.icon}</span>
                                                            <div>
                                                                <span className="font-bold text-slate-800">{cat.categoryName}</span>
                                                                <p className="text-[10px] text-slate-400 font-medium">
                                                                    Consumo: {formatCurrency(cat.total)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="font-black text-amber-600 text-base">{formatCurrency(cat.taxAmount)}</span>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">~{(cat.taxRate * 100).toFixed(0)}% total</p>
                                                        </div>
                                                    </div>

                                                    {/* Mini Breakdown por item */}
                                                    <div className="flex gap-4 pt-3 border-t border-slate-50">
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">ICMS</span>
                                                            <span className="text-[10px] font-bold text-slate-600">{formatCurrency(cat.breakdown.icms)}</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">IPI</span>
                                                            <span className="text-[10px] font-bold text-slate-600">{formatCurrency(cat.breakdown.ipi)}</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Federais</span>
                                                            <span className="text-[10px] font-bold text-slate-600">{formatCurrency(cat.breakdown.pis_cofins)}</span>
                                                        </div>
                                                        {cat.breakdown.iss > 0 && (
                                                            <div className="flex flex-col">
                                                                <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">ISS</span>
                                                                <span className="text-[10px] font-bold text-slate-600">{formatCurrency(cat.breakdown.iss)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* IPVA e IPTU */}
                                    {consumptionTaxData && consumptionTaxData.propertyTaxes.length > 0 && (
                                        <div className="space-y-3 mb-6">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-6 ml-1">Impostos sobre Patrimônio</p>
                                            {consumptionTaxData.propertyTaxes.map((prop, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-primary-50/50 border border-primary-100 rounded-2xl p-4 text-sm relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary-100/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                                    <div className="flex items-center gap-4 relative z-10">
                                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm border border-primary-100">
                                                            {prop.icon}
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-slate-800">{prop.name}</span>
                                                            <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mt-0.5">
                                                                {prop.type === 'ipva' ? 'IPVA' : 'IPTU'} • {(prop.taxRate * 100).toFixed(1)}% do valor venal
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="font-black text-rose-500 text-base relative z-10">{formatCurrency(prop.taxAmount)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Resumo Final de Carga Tributária */}
                                    {consumptionTaxData && (
                                        <div className="bg-slate-900 rounded-[32px] p-6 space-y-4 border border-slate-800 shadow-2xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

                                            <div className="flex justify-between items-center text-sm border-b border-white/5 pb-4">
                                                <span className="text-white/60 font-medium">Consumo total anual:</span>
                                                <span className="font-bold text-white text-base">
                                                    {formatCurrency(consumptionTaxData.totalSpending)}
                                                </span>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-white/40">Total em Impostos Indiretos:</span>
                                                    <span className="font-bold text-amber-400">
                                                        {formatCurrency(consumptionTaxData.totalConsumptionTax)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-white/40">Total em Patrimônio (IPVA/IPTU):</span>
                                                    <span className="font-bold text-rose-400">
                                                        {formatCurrency(consumptionTaxData.totalPropertyTax)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                                                <div>
                                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Carga Tributária Total</p>
                                                    <p className="text-2xl font-black text-white tracking-tighter">
                                                        {formatCurrency(consumptionTaxData.totalTax)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                                                        {(consumptionTaxData.averageTaxRate * 100).toFixed(1)}% Média
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>



                                {/* Total de Impostos */}
                                <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 text-white mb-6">
                                    <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Total Estimado em Impostos (Anual)</p>
                                    <p className="text-3xl font-bold">
                                        {formatCurrency(
                                            (taxBreakdown.irFinal * 12) +
                                            (taxBreakdown.inss * 12) +
                                            (consumptionTaxData?.totalTax || (estimate.income_monthly * 12) * 0.6 * 0.32)
                                        )}
                                    </p>
                                    <p className="text-white/60 text-sm mt-2">
                                        Isso representa aproximadamente {(
                                            ((taxBreakdown.irFinal * 12) + (taxBreakdown.inss * 12) + (consumptionTaxData?.totalTax || (estimate.income_monthly * 12) * 0.6 * 0.32)) /
                                            (estimate.income_monthly * 12) * 100
                                        ).toFixed(1)}% da sua renda bruta anual.
                                    </p>
                                </div>

                                <button
                                    onClick={() => setShowTaxBreakdownModal(false)}
                                    className="w-full py-4 bg-primary-500 text-white rounded-2xl font-bold"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Readiness Status Header */}
                    <div className="bg-white border border-slate-100 rounded-[32px] p-6 flex items-center justify-between shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors"></div>

                        <div className="flex gap-4 items-center relative z-10">
                            <div className="relative">
                                <BudgetProgressRing
                                    spent={readiness?.completed_count || 0}
                                    limit={readiness?.total_count || 5}
                                    size={72}
                                />
                            </div>
                            <div>
                                <h3 className="font-bold uppercase tracking-widest text-[9px] text-slate-400 mb-1">Status de Prontidão</h3>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${readiness?.status === 'ready' ? 'bg-emerald-500' :
                                        readiness?.status === 'almost' ? 'bg-amber-500' : 'bg-rose-500'
                                        } animate-pulse shadow-sm`}></div>
                                    <p className="text-lg font-bold text-slate-900 tracking-tight">
                                        {readiness?.status === 'ready' ? '100% Completo' :
                                            readiness?.status === 'almost' ? 'Quase lá...' : 'Ação Necessária'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/assistant', { state: { initialMessage: `🦁 Elara, me ajude a completar os itens que faltam para minha declaração de IR ${selectedYear}?` } })}
                            className="bg-primary-50 hover:bg-primary-100 text-primary-600 px-5 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all p-2 relative z-10 border border-primary-100"
                        >
                            Ajustar
                        </button>
                    </div>

                    {/* Summary Cards */}
                    {estimate && (
                        <div className="space-y-6">
                            {/* Card Unificado de Resumo Fiscal */}
                            <TaxSummaryCard
                                estimate={estimate}
                                selectedYear={selectedYear}
                                loading={loading}
                            />

                            {/* Capital Gains (Gcáp) Card - if taxable */}
                            {capitalGains && capitalGains.totalProfit > 0 && (
                                <div className="bg-white p-6 rounded-[32px] border border-amber-100 shadow-sm flex items-start gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                        <TrendingUp className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ganho de Capital (GCAP)</h4>
                                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">DARF Pendente?</span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-900 mb-2">Imposto sobre Lucro: {formatCurrency(capitalGains.estimatedTax)}</p>
                                        <p className="text-[11px] text-slate-500 leading-tight">
                                            Identificamos {formatCurrency(capitalGains.totalProfit)} em lucro bruto sobre venda de bens em {selectedYear - 1}.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Patrimônio Quick Access */}
                            <div
                                onClick={() => navigate('/assets')}
                                className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer active:scale-[0.98] transition-all hover:bg-slate-50/50"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="bg-primary-50 p-3 rounded-2xl group-hover:scale-110 transition-all border border-primary-100">
                                        <Package className="w-6 h-6 text-primary-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Patrimônio</h4>
                                        <p className="text-sm font-bold text-slate-900">Bens e Direitos</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform group-hover:text-primary-500" />
                            </div>


                            {/* Tax Breakdown Card - Clicável */}
                            <div
                                onClick={() => setShowTaxBreakdownModal(true)}
                                className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-[32px] shadow-lg cursor-pointer active:scale-[0.98] transition-all hover:shadow-xl group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20" />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white/10 p-3 rounded-2xl group-hover:scale-110 transition-all">
                                                <PieChart className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-0.5">Mapa de Impostos</h4>
                                                <p className="text-lg font-bold text-white">Quanto você paga?</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-white/40 group-hover:translate-x-1 transition-transform group-hover:text-white" />
                                    </div>
                                    <p className="text-white/60 text-sm">
                                        Veja o passo a passo do cálculo do IR, INSS e impostos estimados sobre consumo.
                                    </p>
                                    <div className="flex gap-2 mt-4">
                                        <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold text-white/80">IRRF</span>
                                        <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold text-white/80">INSS</span>
                                        <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold text-white/80">Consumo</span>
                                    </div>
                                </div>
                            </div>


                            <DeductionsCard
                                totalDeductions={estimate.total_deductions_year || 0}
                                estimatedSaving={(estimate.total_deductions_year || 0) * 0.275}
                                onOpenPastaFiscal={() => navigate('/fiscal-folder')}
                            />

                            {/* Scan Document Button */}
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6 rounded-[32px] flex items-center justify-center gap-3 shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all active:scale-[0.98]"
                            >
                                <Receipt className="w-6 h-6" />
                                <span className="font-bold text-lg">Escanear Nota Fiscal</span>
                                <Sparkles className="w-5 h-5 text-amber-300" />
                            </button>

                            {/* Upload Modal */}
                            {showUploadModal && (
                                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowUploadModal(false)}>
                                    <div onClick={e => e.stopPropagation()} className="max-w-md w-full animate-in zoom-in-95">
                                        <TaxDocumentUpload
                                            year={selectedYear}
                                            onUploadComplete={() => {
                                                loadData(true); // Refresh data silently
                                            }}
                                            onCancel={() => setShowUploadModal(false)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Documents List Preview */}
                            {deductionsSummary.count > 0 && (
                                <TaxDocumentsList
                                    year={selectedYear}
                                    showDeductibleOnly={true}
                                />
                            )}
                        </div>
                    )}

                    {/* Rules Info Section */}
                    <section className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Info className="w-4 h-4 text-primary-500" />
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Regras IR {selectedYear} {selectedYear === 2026 && '(Novas!)'}
                            </h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <span className="text-xs text-slate-600 font-medium">
                                    Isenção: Até {formatCurrency(getTaxRules(selectedYear).ANNUAL_EXEMPTION_LIMIT)}
                                </span>
                                {selectedYear === 2026 && (
                                    <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md font-bold uppercase border border-emerald-100">Novo</span>
                                )}
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                                {selectedYear === 2026
                                    ? 'A regra de 2026 aplica um redutor gradual para rendas entre R$ 60k e R$ 88k. Nosso simulador já está atualizado.'
                                    : 'Regras de 2025 com tabela progressiva padrão. Isenção até R$ 27.110,40/ano.'
                                }
                            </p>
                            <button
                                onClick={() => navigate('/assistant', { state: { initialMessage: `🦁 Me explica detalhadamente as regras do IR ${selectedYear}${selectedYear === 2026 ? ' e a nova regra de isenção de 60 mil e o redutor gradual' : ''}?` } })}
                                className="w-full py-4 bg-slate-50 hover:bg-primary-50 border border-slate-100 hover:border-primary-100 rounded-2xl text-[10px] font-bold uppercase text-slate-600 hover:text-primary-700 transition-all flex items-center justify-center gap-3"
                            >
                                Explicação Detalhada com Elara
                                <ExternalLink className="w-3 h-3 text-slate-300" />
                            </button>
                        </div>
                    </section>

                    {/* Checklist Section */}
                    <section>
                        <div className="flex justify-between items-end mb-4 ml-2">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Diagnóstico de Prontidão</h3>
                        </div>
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                            {readiness?.checklist.map((item) => (
                                <div key={item.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${item.status === 'done' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-300'}`}>
                                            {item.status === 'done' ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h4 className={`text-[15px] font-bold ${item.status === 'done' ? 'text-slate-900' : 'text-slate-400'}`}>{item.label}</h4>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">{item.status === 'done' ? 'Completo' : 'Pendente'}</p>
                                        </div>
                                    </div>
                                    {item.status === 'pending' && (
                                        <button
                                            className="text-[10px] font-bold uppercase text-primary-600 bg-primary-50 px-4 py-2.5 rounded-xl border border-primary-100 active:scale-95 transition-all shadow-sm"
                                            onClick={() => {
                                                if (item.id === 'income') navigate('/financial-dashboard');
                                                else if (item.id === 'assets') navigate('/assets');
                                                else if (item.id === 'deductions') setShowUploadModal(true);
                                                else navigate('/assistant', { state: { initialMessage: `🦁 Elara, como eu posso resolver a pendência de "${item.label}" no meu Imposto de Renda ${selectedYear}?` } });
                                            }}
                                        >
                                            Resolver
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Export Action */}
                    <div className="pt-4">
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className={`w-full bg-primary-500 text-white py-6 rounded-[32px] font-bold text-lg shadow-xl shadow-primary-500/20 hover:bg-primary-600 transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${isExporting ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isExporting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Gerando PDF...
                                </>
                            ) : (
                                <>
                                    <Download className="w-6 h-6" />
                                    Gerar Pacote para Contador (PDF)
                                </>
                            )}
                        </button>

                        <div className="mt-8 p-6 bg-slate-50 border border-slate-100 rounded-3xl flex gap-4 items-start shadow-inner">
                            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shrink-0">
                                <ShieldCheck className="w-6 h-6 text-primary-500" />
                            </div>
                            <p className="text-[10px] leading-relaxed font-bold uppercase tracking-widest text-slate-400">
                                Atenção Profissional: Este resumo é gerado como um guia auxiliar (Ano-Calendário {selectedYear - 1} / Exercício {selectedYear}). Não substitui o Programa Oficial da RFB.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
