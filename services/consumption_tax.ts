import { supabase } from './supabase';
import { assetsService, Asset } from './assets';
import { tasksService } from './tasks';

// =============================================================================
// Alíquotas médias de impostos por categoria (IBPT 2024/2025)
// =============================================================================

export interface TaxBreakdown {
    icms: number;
    ipi: number;
    pis_cofins: number; // Consolidado para simplicidade
    iss: number;
    total: number;
}

export const TAX_RATES_BY_CATEGORY: Record<string, { breakdown: TaxBreakdown; icon: string; name: string }> = {
    // Categorias reais do banco e fallbacks
    'food': {
        breakdown: { icms: 0.12, ipi: 0.00, pis_cofins: 0.06, iss: 0.00, total: 0.18 },
        icon: '🍽️', name: 'Alimentação'
    },
    'shopping': {
        breakdown: { icms: 0.18, ipi: 0.08, pis_cofins: 0.09, iss: 0.00, total: 0.35 },
        icon: '🛍️', name: 'Compras'
    },
    'health': {
        breakdown: { icms: 0.07, ipi: 0.05, pis_cofins: 0.09, iss: 0.02, total: 0.23 },
        icon: '🏥', name: 'Saúde'
    },
    'utilities': {
        breakdown: { icms: 0.25, ipi: 0.00, pis_cofins: 0.09, iss: 0.05, total: 0.39 },
        icon: '⚡', name: 'Contas Fixas'
    },
    'leisure': {
        breakdown: { icms: 0.18, ipi: 0.10, pis_cofins: 0.09, iss: 0.03, total: 0.40 },
        icon: '🎮', name: 'Lazer'
    },
    'transport': {
        breakdown: { icms: 0.18, ipi: 0.07, pis_cofins: 0.09, iss: 0.01, total: 0.35 },
        icon: '🚗', name: 'Transporte'
    },
    'alimentacao': {
        breakdown: { icms: 0.12, ipi: 0.00, pis_cofins: 0.06, iss: 0.00, total: 0.18 },
        icon: '🍽️', name: 'Alimentação'
    },
    'restaurante': {
        breakdown: { icms: 0.12, ipi: 0.00, pis_cofins: 0.09, iss: 0.05, total: 0.26 },
        icon: '🍔', name: 'Restaurantes'
    },
    'supermercado': {
        breakdown: { icms: 0.12, ipi: 0.00, pis_cofins: 0.06, iss: 0.00, total: 0.18 },
        icon: '🛒', name: 'Supermercado'
    },
    'transporte': {
        breakdown: { icms: 0.18, ipi: 0.07, pis_cofins: 0.09, iss: 0.01, total: 0.35 },
        icon: '🚌', name: 'Transporte'
    },
    'combustivel': {
        breakdown: { icms: 0.25, ipi: 0.00, pis_cofins: 0.09, iss: 0.00, total: 0.34 },
        icon: '⛽', name: 'Combustíveis'
    },
    'energia': {
        breakdown: { icms: 0.25, ipi: 0.00, pis_cofins: 0.09, iss: 0.00, total: 0.34 },
        icon: '⚡', name: 'Energia'
    },
    'internet': {
        breakdown: { icms: 0.25, ipi: 0.00, pis_cofins: 0.09, iss: 0.02, total: 0.36 },
        icon: '🌐', name: 'Internet'
    },
    'contracts': {
        breakdown: { icms: 0.00, ipi: 0.00, pis_cofins: 0.09, iss: 0.05, total: 0.14 },
        icon: '📜', name: 'Contratos/Serviços'
    },
    'market': {
        breakdown: { icms: 0.12, ipi: 0.00, pis_cofins: 0.06, iss: 0.00, total: 0.18 },
        icon: '🛒', name: 'Mercado/Supermercado'
    },
    'vehicle': {
        breakdown: { icms: 0.18, ipi: 0.12, pis_cofins: 0.09, iss: 0.00, total: 0.39 },
        icon: '🚗', name: 'Veículos'
    },
    'debts': {
        breakdown: { icms: 0.00, ipi: 0.00, pis_cofins: 0.04, iss: 0.05, total: 0.09 },
        icon: '💳', name: 'Dívidas/Encargos'
    },
    'outros': {
        breakdown: { icms: 0.18, ipi: 0.05, pis_cofins: 0.09, iss: 0.03, total: 0.35 },
        icon: '📦', name: 'Outros'
    },
};

// =============================================================================
// Tipos
// =============================================================================
export interface CategorySpending {
    category: string;
    categoryName: string;
    icon: string;
    total: number;
    taxRate: number;
    taxAmount: number;
    breakdown: TaxBreakdown;
}

export interface PropertyTax {
    type: 'ipva' | 'iptu';
    name: string;
    icon: string;
    value: number;
    taxRate: number;
    taxAmount: number;
}

export interface ConsumptionTaxBreakdown {
    categories: CategorySpending[];
    propertyTaxes: PropertyTax[];
    totalSpending: number;
    totalConsumptionTax: number;
    totalPropertyTax: number;
    totalTax: number;
    averageTaxRate: number;
    totalsByTaxType: {
        icms: number;
        ipi: number;
        pis_cofins: number;
        iss: number;
    };
}

// =============================================================================
// Funções de cálculo
// =============================================================================

/**
 * Busca gastos por categoria do ano atual
 */
async function getSpendingByCategory(year: number): Promise<Map<string, number>> {
    try {
        const household = await tasksService.getHousehold();
        if (!household) return new Map();

        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;

        const { data: transactions, error } = await supabase
            .from('credit_card_transactions')
            .select('amount, category_id')
            .eq('household_id', household.id)
            .gte('transaction_date', startDate)
            .lte('transaction_date', endDate);

        if (error || !transactions) {
            console.warn('[ConsumptionTax] Error fetching transactions:', error);
            return new Map();
        }

        const categoryTotals = new Map<string, number>();
        for (const tx of transactions) {
            const categoryId = tx.category_id || 'outros';
            const current = categoryTotals.get(categoryId) || 0;
            categoryTotals.set(categoryId, current + tx.amount);
        }

        return categoryTotals;
    } catch (err) {
        console.warn('[ConsumptionTax] Exception:', err);
        return new Map();
    }
}

/**
 * Calcula IPVA sobre veículos
 */
function calculateIPVA(vehicles: Asset[], stateRate: number = 0.04): PropertyTax[] {
    return vehicles
        .filter(v => v.type === 'vehicle' && v.status === 'owned')
        .map(vehicle => ({
            type: 'ipva' as const,
            name: vehicle.name,
            icon: '🚗',
            value: vehicle.purchase_value,
            taxRate: stateRate,
            taxAmount: Math.round(vehicle.purchase_value * stateRate * 100) / 100
        }));
}

/**
 * Calcula IPTU sobre imóveis
 */
function calculateIPTU(properties: Asset[], rate: number = 0.015): PropertyTax[] {
    return properties
        .filter(p => p.type === 'real_estate' && p.status === 'owned')
        .map(property => ({
            type: 'iptu' as const,
            name: property.name,
            icon: '🏠',
            value: property.purchase_value,
            taxRate: rate,
            taxAmount: Math.round(property.purchase_value * rate * 100) / 100
        }));
}

/**
 * Calcula impostos sobre consumo com base nos dados reais
 */
export async function calculateConsumptionTax(year: number = new Date().getFullYear()): Promise<ConsumptionTaxBreakdown> {
    const categorySpending = await getSpendingByCategory(year);
    const assets = await assetsService.getAssets();

    const categories: CategorySpending[] = [];
    let totalSpending = 0;
    let totalConsumptionTax = 0;

    const totalsByTaxType = { icms: 0, ipi: 0, pis_cofins: 0, iss: 0 };

    for (const [category, total] of categorySpending) {
        const taxInfo = TAX_RATES_BY_CATEGORY[category] || TAX_RATES_BY_CATEGORY['outros'];
        const taxAmount = Math.round(total * taxInfo.breakdown.total * 100) / 100;

        categories.push({
            category,
            categoryName: taxInfo.name,
            icon: taxInfo.icon,
            total,
            taxRate: taxInfo.breakdown.total,
            taxAmount,
            breakdown: {
                icms: total * taxInfo.breakdown.icms,
                ipi: total * taxInfo.breakdown.ipi,
                pis_cofins: total * taxInfo.breakdown.pis_cofins,
                iss: total * taxInfo.breakdown.iss,
                total: taxInfo.breakdown.total
            }
        });

        totalsByTaxType.icms += total * taxInfo.breakdown.icms;
        totalsByTaxType.ipi += total * taxInfo.breakdown.ipi;
        totalsByTaxType.pis_cofins += total * taxInfo.breakdown.pis_cofins;
        totalsByTaxType.iss += total * taxInfo.breakdown.iss;

        totalSpending += total;
        totalConsumptionTax += taxAmount;
    }

    categories.sort((a, b) => b.taxAmount - a.taxAmount);

    const ipvaList = calculateIPVA(assets);
    const iptuList = calculateIPTU(assets);
    const propertyTaxes = [...ipvaList, ...iptuList];
    const totalPropertyTax = propertyTaxes.reduce((sum, p) => sum + p.taxAmount, 0);

    const totalTax = totalConsumptionTax + totalPropertyTax;
    const averageTaxRate = totalSpending > 0 ? totalConsumptionTax / totalSpending : 0;

    return {
        categories,
        propertyTaxes,
        totalSpending,
        totalConsumptionTax,
        totalPropertyTax,
        totalTax,
        averageTaxRate,
        totalsByTaxType
    };
}

/**
 * Calcula impostos sobre consumo com valores estimados (fallback)
 */
export function estimateConsumptionTax(monthlyIncome: number): ConsumptionTaxBreakdown {
    const annualConsumption = monthlyIncome * 12 * 0.6;
    const distribution = [
        { category: 'alimentacao', pct: 0.25 },
        { category: 'transporte', pct: 0.15 },
        { category: 'energia', pct: 0.08 },
        { category: 'internet', pct: 0.05 },
        { category: 'saude', pct: 0.10 },
        { category: 'lazer', pct: 0.10 },
        { category: 'shopping', pct: 0.17 },
        { category: 'outros', pct: 0.10 }
    ];

    const totalsByTaxType = { icms: 0, ipi: 0, pis_cofins: 0, iss: 0 };

    const categories: CategorySpending[] = distribution.map(d => {
        const taxInfo = TAX_RATES_BY_CATEGORY[d.category] || TAX_RATES_BY_CATEGORY['outros'];
        const total = Math.round(annualConsumption * d.pct * 100) / 100;
        const taxAmount = Math.round(total * taxInfo.breakdown.total * 100) / 100;

        totalsByTaxType.icms += total * taxInfo.breakdown.icms;
        totalsByTaxType.ipi += total * taxInfo.breakdown.ipi;
        totalsByTaxType.pis_cofins += total * taxInfo.breakdown.pis_cofins;
        totalsByTaxType.iss += total * taxInfo.breakdown.iss;

        return {
            category: d.category,
            categoryName: taxInfo.name,
            icon: taxInfo.icon,
            total,
            taxRate: taxInfo.breakdown.total,
            taxAmount,
            breakdown: {
                icms: total * taxInfo.breakdown.icms,
                ipi: total * taxInfo.breakdown.ipi,
                pis_cofins: total * taxInfo.breakdown.pis_cofins,
                iss: total * taxInfo.breakdown.iss,
                total: taxInfo.breakdown.total
            }
        };
    });

    const totalSpending = categories.reduce((sum, c) => sum + c.total, 0);
    const totalConsumptionTax = categories.reduce((sum, c) => sum + c.taxAmount, 0);
    const averageTaxRate = totalSpending > 0 ? totalConsumptionTax / totalSpending : 0;

    return {
        categories,
        propertyTaxes: [],
        totalSpending,
        totalConsumptionTax,
        totalPropertyTax: 0,
        totalTax: totalConsumptionTax,
        averageTaxRate,
        totalsByTaxType
    };
}

/**
 * Formata valor em moeda
 */
export function formatCurrencyTax(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}
