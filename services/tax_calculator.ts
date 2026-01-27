/**
 * 2026 Tax Rules (IRPF 2026)
 * Based on ir_faq_1-200.json
 */

export const TAX_RULES_2026 = {
    MONTHLY_EXEMPTION_LIMIT: 2428.80,
    ANNUAL_EXEMPTION_LIMIT: 60000.00,
    GRADUAL_REDUCER_LIMIT: 88200.00,
    MONTHLY_TABLE: [
        { de: 0, ate: 2428.80, aliquota: 0, deducao: 0 },
        { de: 2428.81, ate: 2826.65, aliquota: 0.075, deducao: 182.16 },
        { de: 2826.66, ate: 3751.05, aliquota: 0.15, deducao: 394.16 },
        { de: 3751.06, ate: 4664.68, aliquota: 0.225, deducao: 675.49 },
        { de: 4664.69, ate: Infinity, aliquota: 0.275, deducao: 908.73 }
    ],
    DEPENDENT_DEDUCTION_ANNUAL: 2275.08,
    EDUCATION_LIMIT_ANNUAL: 3561.50,
    SIMPLIFIED_DISCOUNT_ANNUAL_LIMIT: 17640.00
};

export interface TaxCalculationResult {
    grossIncome: number;
    taxableIncome: number;
    totalDeductions: number;
    estimatedTaxYearly: number;
    isExemptByAnnualLimit: boolean;
    applied2026Rules: boolean;
}

/**
 * Simplified 2026 Tax Calculator for UI display
 * Note: This is an estimation tool.
 */
export const calculateIRPF2026 = (annualIncome: number, totalDeductions: number = 0): TaxCalculationResult => {
    // 1. Rule: Annual Exemption up to R$ 60.000,00
    const isExemptByAnnualLimit = annualIncome <= TAX_RULES_2026.ANNUAL_EXEMPTION_LIMIT;

    if (isExemptByAnnualLimit) {
        return {
            grossIncome: annualIncome,
            taxableIncome: 0,
            totalDeductions: totalDeductions,
            estimatedTaxYearly: 0,
            isExemptByAnnualLimit: true,
            applied2026Rules: true
        };
    }

    // 2. Calculation base adjustment
    const taxableIncome = Math.max(annualIncome - totalDeductions, 0);

    // 3. Apply simplified bracket calculation (Annual Approximation)
    // For 2026, the reducer gradual rule and complex annual table applies.
    // This is a simplified approximation for UI.
    let estimatedTax = 0;

    // Gradual Reducer Logic (simplified)
    if (annualIncome > TAX_RULES_2026.ANNUAL_EXEMPTION_LIMIT && annualIncome <= TAX_RULES_2026.GRADUAL_REDUCER_LIMIT) {
        // Between 60k and 88.2k, the tax is progressive but starts from a low point
        // This is a placeholder for the actual complex piecewise function
        estimatedTax = (taxableIncome - TAX_RULES_2026.ANNUAL_EXEMPTION_LIMIT) * 0.15; // Rough estimate
    } else {
        // Standard progression for higher incomes
        // Using top bracket as default for calculation logic visibility
        estimatedTax = (taxableIncome * 0.275) - (908.73 * 12);
    }

    return {
        grossIncome: annualIncome,
        taxableIncome: Math.max(taxableIncome, 0),
        totalDeductions: totalDeductions,
        estimatedTaxYearly: Math.max(estimatedTax, 0),
        isExemptByAnnualLimit: false,
        applied2026Rules: true
    };
};
