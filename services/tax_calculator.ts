/**
 * Tax Calculator - Multi-Year Support (2025 & 2026)
 * Vida em Dia - IRPF Calculator
 */

// =============================================================================
// TAX RULES 2025 (Ano-Calendário 2024)
// =============================================================================
export const TAX_RULES_2025 = {
    YEAR: 2025,
    ANO_CALENDARIO: 2025,
    MONTHLY_EXEMPTION_LIMIT: 2259.20,
    ANNUAL_EXEMPTION_LIMIT: 27110.40,
    HAS_GRADUAL_REDUCER: false,
    MONTHLY_TABLE: [
        { de: 0, ate: 2259.20, aliquota: 0, deducao: 0 },
        { de: 2259.21, ate: 2826.65, aliquota: 0.075, deducao: 169.44 },
        { de: 2826.66, ate: 3751.05, aliquota: 0.15, deducao: 381.44 },
        { de: 3751.06, ate: 4664.68, aliquota: 0.225, deducao: 662.77 },
        { de: 4664.69, ate: Infinity, aliquota: 0.275, deducao: 896.00 }
    ],
    DEPENDENT_DEDUCTION_ANNUAL: 2275.08,
    EDUCATION_LIMIT_ANNUAL: 3561.50,
    SIMPLIFIED_DISCOUNT_ANNUAL_LIMIT: 16754.34,
    SIMPLIFIED_DISCOUNT_RATE: 0.20
};

// =============================================================================
// TAX RULES 2026 (Ano-Calendário 2025) - NOVAS REGRAS!
// Isenção até R$ 5.000/mês = R$ 60.000/ano
// Redutor gradual de R$ 5.001 a R$ 7.350/mês = R$ 60.012 a R$ 88.200/ano
// =============================================================================
export const TAX_RULES_2026 = {
    YEAR: 2026,
    ANO_CALENDARIO: 2026,
    // Limites mensais
    MONTHLY_EXEMPTION_LIMIT: 5000.00,          // Isento até R$ 5.000/mês
    MONTHLY_REDUCER_LIMIT: 7350.00,            // Redutor gradual até R$ 7.350/mês
    // Limites anuais (equivalentes)
    ANNUAL_EXEMPTION_LIMIT: 60000.00,          // R$ 5.000 × 12 = R$ 60.000
    GRADUAL_REDUCER_LIMIT: 88200.00,           // R$ 7.350 × 12 = R$ 88.200
    HAS_GRADUAL_REDUCER: true,
    // Tabela progressiva mensal (para cálculo do imposto antes do redutor)
    MONTHLY_TABLE: [
        { de: 0, ate: 2428.80, aliquota: 0, deducao: 0 },
        { de: 2428.81, ate: 2826.65, aliquota: 0.075, deducao: 182.16 },
        { de: 2826.66, ate: 3751.05, aliquota: 0.15, deducao: 394.16 },
        { de: 3751.06, ate: 4664.68, aliquota: 0.225, deducao: 675.49 },
        { de: 4664.69, ate: Infinity, aliquota: 0.275, deducao: 908.73 }
    ],
    DEPENDENT_DEDUCTION_ANNUAL: 2275.08,
    EDUCATION_LIMIT_ANNUAL: 3561.50,
    SIMPLIFIED_DISCOUNT_ANNUAL_LIMIT: 17640.00,
    SIMPLIFIED_DISCOUNT_RATE: 0.20
};


// =============================================================================
// TYPE: Taxpayer Type (CLT, MEI, Autônomo)
// =============================================================================
export type TaxpayerType = 'CLT' | 'MEI' | 'AUTONOMO' | 'MIXED';

// =============================================================================
// TYPE: MEI Activity (para cálculo da parcela isenta)
// =============================================================================
export type MEIActivity = 'COMERCIO' | 'INDUSTRIA' | 'SERVICOS' | 'TRANSPORTE_PASSAGEIROS' | 'TRANSPORTE_CARGAS';

export const MEI_EXEMPT_PERCENTAGES: Record<MEIActivity, number> = {
    'COMERCIO': 0.08,
    'INDUSTRIA': 0.08,
    'SERVICOS': 0.32,
    'TRANSPORTE_PASSAGEIROS': 0.16,
    'TRANSPORTE_CARGAS': 0.08
};

// =============================================================================
// INTERFACE: Tax Calculation Result
// =============================================================================
export interface TaxCalculationResult {
    year: number;
    grossIncome: number;
    taxableIncome: number;
    totalDeductions: number;
    estimatedTaxYearly: number;
    estimatedTaxMonthly: number;
    effectiveRate: number;
    isExemptByAnnualLimit: boolean;
    isExemptByGradualReducer: boolean;
    gradualReducerApplied: number;
    bracketApplied: number;
    appliedRulesYear: number;
    taxpayerType?: TaxpayerType;
    regime?: 'simplified' | 'complete';
    comparison?: {
        taxIn2025: number;
        taxIn2026: number;
        savings: number;
        percentageSaved: number;
    };
}

// =============================================================================
// HELPER: Get Rules by Year
// =============================================================================
export function getTaxRules(year: number) {
    return year === 2025 ? TAX_RULES_2025 : TAX_RULES_2026;
}

// =============================================================================
// HELPER: Calculate Tax by Table (Monthly or Annualized)
// =============================================================================
function calculateTaxByTable(monthlyIncome: number, rules: typeof TAX_RULES_2025 | typeof TAX_RULES_2026): { tax: number; bracket: number } {
    for (let i = rules.MONTHLY_TABLE.length - 1; i >= 0; i--) {
        const bracket = rules.MONTHLY_TABLE[i];
        if (monthlyIncome >= bracket.de) {
            const tax = (monthlyIncome * bracket.aliquota) - bracket.deducao;
            return { tax: Math.max(tax, 0), bracket: i + 1 };
        }
    }
    return { tax: 0, bracket: 1 };
}

// =============================================================================
// INSS 2026 - Tabela Progressiva CLT
// Cada faixa tem alíquota aplicada sobre o valor QUE CAI NELA, não sobre o total
// =============================================================================
export const INSS_TABLE_2026 = [
    { de: 0.00, ate: 1621.00, aliquota: 0.075 },          // 7,5% até R$ 1.621,00
    { de: 1621.00, ate: 2902.84, aliquota: 0.09 },        // 9% de R$ 1.621,01 a R$ 2.902,84
    { de: 2902.84, ate: 4354.27, aliquota: 0.12 },        // 12% de R$ 2.902,85 a R$ 4.354,27
    { de: 4354.27, ate: 8475.55, aliquota: 0.14 }         // 14% de R$ 4.354,28 a R$ 8.475,55
];

// Teto do INSS 2026
export const INSS_CEILING_2026 = 8475.55;

// =============================================================================
// HELPER: Calculate INSS Progressivo (CLT)
// O INSS é calculado de forma PROGRESSIVA desde a Reforma da Previdência (2020)
// Cada faixa aplica a alíquota apenas sobre o valor que cai nela
// =============================================================================
export function calculateINSS(grossSalary: number, taxpayerType: TaxpayerType = 'CLT'): number {
    const SALARIO_MINIMO_2026 = 1621.00; // Valor estimado para 2026

    if (taxpayerType === 'MEI') {
        // MEI: 5% sobre salário mínimo
        return Math.round(SALARIO_MINIMO_2026 * 0.05 * 100) / 100;
    }

    if (taxpayerType === 'AUTONOMO') {
        // Autônomo Simplificado: 11% sobre salário mínimo
        return Math.round(SALARIO_MINIMO_2026 * 0.11 * 100) / 100;
    }

    // CLT: Cálculo progressivo por faixas
    let totalINSS = 0;
    const salarioParaCalculo = Math.min(grossSalary, INSS_CEILING_2026);

    for (const faixa of INSS_TABLE_2026) {
        if (salarioParaCalculo <= faixa.de) {
            // Salário não atinge esta faixa
            break;
        }

        // Calcula quanto do salário está DENTRO desta faixa
        const valorNaFaixa = Math.min(salarioParaCalculo, faixa.ate) - faixa.de;

        if (valorNaFaixa > 0) {
            totalINSS += valorNaFaixa * faixa.aliquota;
        }
    }

    return Math.round(totalINSS * 100) / 100;
}

// =============================================================================
// HELPER: Apply Gradual Reducer (2026 only)
// FÓRMULA CORRETA: Redução = 978,62 − (0,133145 × BASE_IRRF)
// Aplica-se apenas para rendas entre R$ 5.001 e R$ 7.350
// =============================================================================
function applyGradualReducer2026(monthlyGrossIncome: number, irBruto: number): number {
    // Constantes do redutor gradual 2026
    const MONTHLY_EXEMPT_LIMIT = 5000.00;      // Até R$ 5.000: isento
    const MONTHLY_REDUCER_LIMIT = 7350.00;     // Acima de R$ 7.350: tabela normal
    const REDUCER_CONSTANT = 978.62;           // Constante da fórmula
    const REDUCER_FACTOR = 0.133145;           // Fator multiplicador

    // Se abaixo ou igual ao limite de isenção, IR = 0
    if (monthlyGrossIncome <= MONTHLY_EXEMPT_LIMIT) {
        return 0;
    }

    // Se acima do limite do redutor, sem redução
    if (monthlyGrossIncome >= MONTHLY_REDUCER_LIMIT) {
        return Math.max(irBruto, 0);
    }

    // Fórmula: Redução = 978,62 − (0,133145 × BASE_IRRF)
    const reducao = REDUCER_CONSTANT - (REDUCER_FACTOR * monthlyGrossIncome);

    // Se redução negativa, considerar 0
    const reducaoFinal = Math.max(reducao, 0);

    // IR final = IR bruto − Redução
    const irFinal = irBruto - reducaoFinal;

    return Math.max(irFinal, 0);
}

// =============================================================================
// HELPER: Apply Gradual Reducer (wrapper para cálculo anual)
// =============================================================================
function applyGradualReducer(annualTaxableIncome: number, calculatedTax: number, rules: typeof TAX_RULES_2026): number {
    if (!rules.HAS_GRADUAL_REDUCER) return calculatedTax;

    // Converter para mensal para aplicar a fórmula correta
    const monthlyIncome = annualTaxableIncome / 12;
    const monthlyTax = calculatedTax / 12;

    // Aplicar redutor mensal
    const monthlyTaxAfterReducer = applyGradualReducer2026(monthlyIncome, monthlyTax);

    // Retornar valor anual
    return monthlyTaxAfterReducer * 12;
}



// =============================================================================
// MAIN: Calculate IRPF (Multi-Year)
// =============================================================================
export function calculateIRPF(
    annualIncome: number,
    totalDeductions: number = 0,
    year: number = 2026,
    taxpayerType: TaxpayerType = 'CLT',
    regime: 'simplified' | 'complete' = 'complete'
): TaxCalculationResult {
    const rules = getTaxRules(year);

    // 0. Taxpayer Type specifics
    let grossTaxableIncome = annualIncome;
    if (taxpayerType === 'MEI') {
        // MEI: Apenas uma parcela do lucro é tributável (Regra Geral: 32% para serviços)
        grossTaxableIncome = annualIncome * 0.32;
    } else if (taxpayerType === 'AUTONOMO') {
        // Autônomo (RPA): Geralmente tributa 100% menos despesas do livro-caixa (simplificamos para 100%)
        grossTaxableIncome = annualIncome;
    }

    // 1. Calculate final deductions based on regime
    let finalDeductions = totalDeductions;
    if (regime === 'simplified') {
        const simplifiedDiscount = Math.min(grossTaxableIncome * rules.SIMPLIFIED_DISCOUNT_RATE, rules.SIMPLIFIED_DISCOUNT_ANNUAL_LIMIT);
        finalDeductions = simplifiedDiscount;
    }

    // 1.1 Calculate taxable income (after deductions)
    const taxableIncome = Math.max(grossTaxableIncome - finalDeductions, 0);

    // 2. Check annual exemption
    const isExemptByAnnualLimit = taxableIncome <= rules.ANNUAL_EXEMPTION_LIMIT;

    if (isExemptByAnnualLimit) {
        return {
            year,
            grossIncome: annualIncome,
            taxableIncome: 0,
            totalDeductions: finalDeductions,
            estimatedTaxYearly: 0,
            estimatedTaxMonthly: 0,
            effectiveRate: 0,
            isExemptByAnnualLimit: true,
            isExemptByGradualReducer: false,
            gradualReducerApplied: 0,
            bracketApplied: 1,
            appliedRulesYear: year,
            taxpayerType,
            regime
        };
    }

    // 3. Monthly equivalent for table lookup
    const monthlyTaxable = taxableIncome / 12;

    // 4. Calculate tax by table
    const { tax: monthlyTax, bracket } = calculateTaxByTable(monthlyTaxable, rules);
    let annualTax = monthlyTax * 12;

    // 5. Apply gradual reducer (2026 only)
    let gradualReducerApplied = 0;
    let isExemptByGradualReducer = false;

    if (year === 2026 && (rules as typeof TAX_RULES_2026).HAS_GRADUAL_REDUCER) {
        const originalTax = annualTax;
        annualTax = applyGradualReducer(taxableIncome, annualTax, rules as typeof TAX_RULES_2026);
        gradualReducerApplied = originalTax - annualTax;
        isExemptByGradualReducer = annualTax === 0 && originalTax > 0;
    }

    // 6. Calculate effective rate
    const effectiveRate = annualIncome > 0 ? annualTax / annualIncome : 0;

    return {
        year,
        grossIncome: annualIncome,
        taxableIncome,
        totalDeductions: finalDeductions,
        estimatedTaxYearly: Math.max(annualTax, 0),
        estimatedTaxMonthly: Math.max(annualTax / 12, 0),
        effectiveRate,
        isExemptByAnnualLimit: false,
        isExemptByGradualReducer,
        gradualReducerApplied,
        bracketApplied: bracket,
        appliedRulesYear: year,
        taxpayerType,
        regime
    };
}


// =============================================================================
// WRAPPER: Calculate IRPF 2025 (Legacy compatibility)
// =============================================================================
export function calculateIRPF2025(annualIncome: number, totalDeductions: number = 0): TaxCalculationResult {
    return calculateIRPF(annualIncome, totalDeductions, 2025);
}

// =============================================================================
// WRAPPER: Calculate IRPF 2026 (Legacy compatibility)
// =============================================================================
export function calculateIRPF2026(annualIncome: number, totalDeductions: number = 0): TaxCalculationResult {
    return calculateIRPF(annualIncome, totalDeductions, 2026);
}

// =============================================================================
// COMPARE: Calculate both years and show savings
// =============================================================================
export function compareIRPF2025vs2026(
    annualIncome: number,
    totalDeductions: number = 0
): {
    result2025: TaxCalculationResult;
    result2026: TaxCalculationResult;
    savings: number;
    percentageSaved: number;
    summary: string;
} {
    const result2025 = calculateIRPF(annualIncome, totalDeductions, 2025);
    const result2026 = calculateIRPF(annualIncome, totalDeductions, 2026);

    const savings = result2025.estimatedTaxYearly - result2026.estimatedTaxYearly;
    const percentageSaved = result2025.estimatedTaxYearly > 0
        ? (savings / result2025.estimatedTaxYearly) * 100
        : 0;

    // Add comparison to both results
    result2025.comparison = {
        taxIn2025: result2025.estimatedTaxYearly,
        taxIn2026: result2026.estimatedTaxYearly,
        savings,
        percentageSaved
    };
    result2026.comparison = {
        taxIn2025: result2025.estimatedTaxYearly,
        taxIn2026: result2026.estimatedTaxYearly,
        savings,
        percentageSaved
    };

    // Generate summary
    let summary = '';
    if (result2026.isExemptByAnnualLimit) {
        summary = `🎉 Ótima notícia! Com a nova regra de 2026, você está ISENTO do Imposto de Renda! Economia de R$ ${savings.toFixed(2)} por ano.`;
    } else if (result2026.isExemptByGradualReducer) {
        summary = `🎉 O redutor gradual de 2026 zerou seu imposto! Economia de R$ ${savings.toFixed(2)} por ano.`;
    } else if (savings > 0) {
        summary = `💰 Em 2026 você pagará R$ ${savings.toFixed(2)} a menos de imposto (${percentageSaved.toFixed(1)}% de economia).`;
    } else {
        summary = `📊 Seu imposto permanece similar em ambos os anos.`;
    }

    return { result2025, result2026, savings, percentageSaved, summary };
}

// =============================================================================
// MEI: Calculate MEI taxable income
// =============================================================================
export function calculateMEITaxableIncome(
    annualRevenue: number,
    activity: MEIActivity,
    year: number = 2026
): {
    exemptPortion: number;
    taxablePortion: number;
    isExempt: boolean;
    calculatedTax: TaxCalculationResult;
} {
    const exemptPercentage = MEI_EXEMPT_PERCENTAGES[activity];
    const exemptPortion = annualRevenue * exemptPercentage;
    const taxablePortion = annualRevenue - exemptPortion;

    const rules = getTaxRules(year);
    const isExempt = taxablePortion <= rules.ANNUAL_EXEMPTION_LIMIT;

    const calculatedTax = calculateIRPF(taxablePortion, 0, year, 'MEI');

    return {
        exemptPortion,
        taxablePortion,
        isExempt,
        calculatedTax
    };
}

// =============================================================================
// HELPER: Format currency
// =============================================================================
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// =============================================================================
// HELPER: Get tax bracket description
// =============================================================================
export function getTaxBracketDescription(bracket: number, year: number = 2026): string {
    const rules = getTaxRules(year);
    const bracketData = rules.MONTHLY_TABLE[bracket - 1];

    if (!bracketData) return 'Faixa não identificada';

    if (bracketData.aliquota === 0) {
        return 'Isento';
    }

    return `${(bracketData.aliquota * 100).toFixed(1)}% (Faixa ${bracket})`;
}

// =============================================================================
// HELPER: Check if must declare
// =============================================================================
export function mustDeclare(
    annualTaxableIncome: number,
    annualExemptIncome: number,
    totalAssets: number,
    year: number = 2026
): { mustDeclare: boolean; reasons: string[] } {
    const reasons: string[] = [];

    // Limites para 2026 (podem variar por ano)
    const taxableLimit = year === 2026 ? 33888.00 : 30639.90;
    const exemptLimit = 200000.00;
    const assetsLimit = 800000.00;

    if (annualTaxableIncome > taxableLimit) {
        reasons.push(`Rendimentos tributáveis acima de ${formatCurrency(taxableLimit)}`);
    }

    if (annualExemptIncome > exemptLimit) {
        reasons.push(`Rendimentos isentos acima de ${formatCurrency(exemptLimit)}`);
    }

    if (totalAssets > assetsLimit) {
        reasons.push(`Bens e direitos acima de ${formatCurrency(assetsLimit)}`);
    }

    return {
        mustDeclare: reasons.length > 0,
        reasons
    };
}

// =============================================================================
// DETAILED IRRF CALCULATION 2026 (Passo a passo completo)
// Seguindo a fórmula: Redução = 978,62 − (0,133145 × BASE_IRRF)
// =============================================================================
export interface IRRFDetailedResult {
    // Entradas
    baseIRRF: number;           // Salário bruto
    inss: number;               // INSS calculado
    aliquotaIR: number;         // Alíquota do IR da faixa (ex: 0.275)
    parcelaDeduzir: number;     // Parcela a deduzir da faixa

    // Passos intermediários
    baseLiquida: number;        // 1) base_liquida = baseIRRF − INSS
    irAliquota: number;         // 2) ir_aliquota = base_liquida × aliquotaIR
    irBruto: number;            // 3) ir_bruto = ir_aliquota − parcelaDeduzir
    reducao: number;            // 4) reducao = 978,62 − (0,133145 × baseIRRF)

    // Resultado final
    irFinal: number;            // 5) ir_final = ir_bruto − reducao
    isExempt: boolean;          // Se está isento
    hasReduction: boolean;      // Se teve redução aplicada

    // Texto explicativo
    explanation: string;
}

export function calculateIRRFDetailed(
    baseIRRF: number,
    taxpayerType: TaxpayerType = 'CLT',
    year: number = 2026
): IRRFDetailedResult {
    const rules = getTaxRules(year);

    // 1) Calcular INSS
    const inss = calculateINSS(baseIRRF, taxpayerType);

    // 2) Base líquida (após INSS)
    const baseLiquida = baseIRRF - inss;

    // 3) Encontrar faixa do IR
    let aliquotaIR = 0;
    let parcelaDeduzir = 0;
    let faixaIndex = 0;

    for (let i = rules.MONTHLY_TABLE.length - 1; i >= 0; i--) {
        const faixa = rules.MONTHLY_TABLE[i];
        if (baseLiquida >= faixa.de) {
            aliquotaIR = faixa.aliquota;
            parcelaDeduzir = faixa.deducao;
            faixaIndex = i + 1;
            break;
        }
    }

    // 4) IR pela alíquota
    const irAliquota = baseLiquida * aliquotaIR;

    // 5) IR bruto (antes da redução)
    const irBruto = Math.max(irAliquota - parcelaDeduzir, 0);

    // 6) Verificar isenção e redução (apenas 2026)
    let reducao = 0;
    let irFinal = irBruto;
    let isExempt = false;
    let hasReduction = false;
    let explanation = '';

    if (year === 2026) {
        const MONTHLY_EXEMPT_LIMIT = 5000.00;
        const MONTHLY_REDUCER_LIMIT = 7350.00;
        const REDUCER_CONSTANT = 978.62;
        const REDUCER_FACTOR = 0.133145;

        if (baseIRRF <= MONTHLY_EXEMPT_LIMIT) {
            // Isento total
            isExempt = true;
            irFinal = 0;
            explanation = `✅ ISENTO! Renda de ${formatCurrency(baseIRRF)} está abaixo do limite de ${formatCurrency(MONTHLY_EXEMPT_LIMIT)}.`;
        } else if (baseIRRF > MONTHLY_EXEMPT_LIMIT && baseIRRF < MONTHLY_REDUCER_LIMIT) {
            // Faixa do redutor gradual
            hasReduction = true;
            reducao = REDUCER_CONSTANT - (REDUCER_FACTOR * baseIRRF);
            reducao = Math.max(reducao, 0); // Se negativa, zerar
            irFinal = Math.max(irBruto - reducao, 0);
            explanation = `🔄 REDUTOR GRADUAL aplicado. Fórmula: 978,62 − (0,133145 × ${baseIRRF.toFixed(2)}) = ${formatCurrency(reducao)}`;
        } else {
            // Acima do limite, tabela normal
            irFinal = irBruto;
            explanation = `📊 Tabela normal. Renda acima de ${formatCurrency(MONTHLY_REDUCER_LIMIT)}.`;
        }
    } else {
        // 2025 - sem redutor
        if (baseLiquida <= rules.MONTHLY_EXEMPTION_LIMIT) {
            isExempt = true;
            irFinal = 0;
            explanation = `✅ ISENTO! Base líquida de ${formatCurrency(baseLiquida)} está abaixo do limite.`;
        } else {
            explanation = `📊 Tabela progressiva 2025 aplicada. Faixa ${faixaIndex}.`;
        }
    }

    return {
        baseIRRF,
        inss,
        aliquotaIR,
        parcelaDeduzir,
        baseLiquida: Math.round(baseLiquida * 100) / 100,
        irAliquota: Math.round(irAliquota * 100) / 100,
        irBruto: Math.round(irBruto * 100) / 100,
        reducao: Math.round(reducao * 100) / 100,
        irFinal: Math.round(irFinal * 100) / 100,
        isExempt,
        hasReduction,
        explanation
    };
}

// =============================================================================
// HELPER: Generate detailed explanation text (para Elara)
// =============================================================================
export function generateIRRFExplanation(result: IRRFDetailedResult): string {
    return `
📋 **CÁLCULO IRRF 2026**

**Entradas:**
- Base de IRRF (bruto): ${formatCurrency(result.baseIRRF)}
- INSS calculado: ${formatCurrency(result.inss)}
- Alíquota IR: ${(result.aliquotaIR * 100).toFixed(1)}%
- Parcela a deduzir: ${formatCurrency(result.parcelaDeduzir)}

**Passo a passo:**
1️⃣ Base após INSS:
   ${formatCurrency(result.baseIRRF)} − ${formatCurrency(result.inss)} = **${formatCurrency(result.baseLiquida)}**

2️⃣ IR pela alíquota:
   ${formatCurrency(result.baseLiquida)} × ${(result.aliquotaIR * 100).toFixed(1)}% = **${formatCurrency(result.irAliquota)}**

3️⃣ IR antes da redução:
   ${formatCurrency(result.irAliquota)} − ${formatCurrency(result.parcelaDeduzir)} = **${formatCurrency(result.irBruto)}**

4️⃣ Redução 2026:
   978,62 − (0,133145 × ${result.baseIRRF.toFixed(2)}) = **${formatCurrency(result.reducao)}**

5️⃣ **IR FINAL DEVIDO: ${formatCurrency(result.irFinal)}**

${result.explanation}
`.trim();
}

// =============================================================================
// CAPITAL GAINS (GCAP)
// Rules: 15% for gains up to 5 million R$.
// =============================================================================
export interface CapitalGainItem {
    name: string;
    type: string;
    profit: number;
    tax: number;
}

export interface CapitalGainResult {
    totalProfit: number;
    estimatedTax: number;
    isTaxable: boolean;
    explanation: string;
    moveis: {
        totalProfit: number;
        estimatedTax: number;
        items: CapitalGainItem[];
    };
    imoveis: {
        totalProfit: number;
        estimatedTax: number;
        items: CapitalGainItem[];
    };
}

export function calculateCapitalGains(assets: any[]): CapitalGainResult {
    const moveis: CapitalGainItem[] = [];
    const imoveis: CapitalGainItem[] = [];

    let totalMovelProfit = 0;
    let totalImovelProfit = 0;

    assets.forEach(asset => {
        if (asset.status === 'sold' && asset.sale_value && asset.purchase_value) {
            const profit = asset.sale_value - asset.purchase_value;
            if (profit > 0) {
                const tax = profit * 0.15;
                const item = {
                    name: asset.name + (asset.plate ? ` (${asset.plate})` : ''),
                    type: asset.type === 'real_estate' ? 'Imóvel' : 'Móvel',
                    profit,
                    tax
                };

                if (asset.type === 'real_estate') {
                    imoveis.push(item);
                    totalImovelProfit += profit;
                } else {
                    moveis.push(item);
                    totalMovelProfit += profit;
                }
            }
        }
    });

    const taxRate = 0.15;
    const moveisTax = totalMovelProfit * taxRate;
    const imoveisTax = totalImovelProfit * taxRate;

    return {
        totalProfit: totalMovelProfit + totalImovelProfit,
        estimatedTax: moveisTax + imoveisTax,
        isTaxable: (totalMovelProfit + totalImovelProfit) > 0,
        explanation: (totalMovelProfit + totalImovelProfit) > 0
            ? `Apuração separada: Gcáp Bens Móveis e Imóveis.`
            : 'Nenhum ganho de capital identificado.',
        moveis: {
            totalProfit: totalMovelProfit,
            estimatedTax: moveisTax,
            items: moveis
        },
        imoveis: {
            totalProfit: totalImovelProfit,
            estimatedTax: imoveisTax,
            items: imoveis
        }
    };
}
