import { supabase } from './supabase';
import { assetsService, Asset } from './assets';
import { creditCardsService, CreditCardTransaction } from './financial';
import { tasksService } from './tasks';

// =============================================================================
// Alíquotas médias de impostos por categoria (IBPT 2024)
// =============================================================================
export const TAX_RATES_BY_CATEGORY: Record<string, { rate: number; icon: string; name: string }> = {
    // Categorias reais do banco
    'food': { rate: 0.18, icon: '🍽️', name: 'Alimentação' },
    'shopping': { rate: 0.35, icon: '🛍️', name: 'Compras' },
    'health': { rate: 0.30, icon: '🏥', name: 'Saúde' },
    'utilities': { rate: 0.45, icon: '⚡', name: 'Contas Fixas' },
    'leisure': { rate: 0.35, icon: '🎮', name: 'Lazer' },
    'transport': { rate: 0.35, icon: '🚗', name: 'Transporte' },

    // Fallbacks para outras categorias que podem aparecer
    'alimentacao': { rate: 0.18, icon: '🍽️', name: 'Alimentação' },
    'restaurante': { rate: 0.32, icon: '🍔', name: 'Restaurantes' },
    'supermercado': { rate: 0.18, icon: '🛒', name: 'Supermercado' },
    'transporte': { rate: 0.35, icon: '🚌', name: 'Transporte' },
    'combustivel': { rate: 0.42, icon: '⛽', name: 'Combustíveis' },
    'energia': { rate: 0.45, icon: '⚡', name: 'Energia' },
    'internet': { rate: 0.42, icon: '🌐', name: 'Internet' },
    'outros': { rate: 0.32, icon: '📦', name: 'Outros' },
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

        // Buscar transações com filtro de data
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

        // Somar por categoria (usando a ID da categoria como slug)
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
 * IPVA médio = 4% do valor do veículo (varia por estado)
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
 * IPTU médio = 1% a 2% do valor venal (usando 1.5% como média)
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
    // 1. Buscar gastos por categoria
    const categorySpending = await getSpendingByCategory(year);

    // 2. Buscar ativos (veículos e imóveis)
    const assets = await assetsService.getAssets();

    // 3. Calcular impostos por categoria de consumo
    const categories: CategorySpending[] = [];
    let totalSpending = 0;
    let totalConsumptionTax = 0;

    for (const [category, total] of categorySpending) {
        const taxInfo = TAX_RATES_BY_CATEGORY[category] || TAX_RATES_BY_CATEGORY['outros'];
        const taxAmount = Math.round(total * taxInfo.rate * 100) / 100;

        categories.push({
            category,
            categoryName: taxInfo.name,
            icon: taxInfo.icon,
            total,
            taxRate: taxInfo.rate,
            taxAmount
        });

        totalSpending += total;
        totalConsumptionTax += taxAmount;
    }

    // Ordenar por valor de imposto (maior primeiro)
    categories.sort((a, b) => b.taxAmount - a.taxAmount);

    // 4. Calcular IPVA e IPTU
    const ipvaList = calculateIPVA(assets);
    const iptuList = calculateIPTU(assets);
    const propertyTaxes = [...ipvaList, ...iptuList];
    const totalPropertyTax = propertyTaxes.reduce((sum, p) => sum + p.taxAmount, 0);

    // 5. Calcular totais
    const totalTax = totalConsumptionTax + totalPropertyTax;
    const averageTaxRate = totalSpending > 0 ? totalConsumptionTax / totalSpending : 0;

    return {
        categories,
        propertyTaxes,
        totalSpending,
        totalConsumptionTax,
        totalPropertyTax,
        totalTax,
        averageTaxRate
    };
}

/**
 * Calcula impostos sobre consumo com valores estimados (fallback)
 */
export function estimateConsumptionTax(monthlyIncome: number): ConsumptionTaxBreakdown {
    // Estimativa: 60% da renda vai para consumo
    const annualConsumption = monthlyIncome * 12 * 0.6;

    // Distribuição típica de gastos (aproximada)
    const distribution = [
        { category: 'alimentacao', pct: 0.25 },
        { category: 'transporte', pct: 0.15 },
        { category: 'energia', pct: 0.08 },
        { category: 'telefone', pct: 0.05 },
        { category: 'saude', pct: 0.10 },
        { category: 'vestuario', pct: 0.08 },
        { category: 'lazer', pct: 0.10 },
        { category: 'casa', pct: 0.10 },
        { category: 'outros', pct: 0.09 }
    ];

    const categories: CategorySpending[] = distribution.map(d => {
        const taxInfo = TAX_RATES_BY_CATEGORY[d.category];
        const total = Math.round(annualConsumption * d.pct * 100) / 100;
        const taxAmount = Math.round(total * taxInfo.rate * 100) / 100;

        return {
            category: d.category,
            categoryName: taxInfo.name,
            icon: taxInfo.icon,
            total,
            taxRate: taxInfo.rate,
            taxAmount
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
        averageTaxRate
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
