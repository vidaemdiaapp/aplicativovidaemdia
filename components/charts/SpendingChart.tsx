import React from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    AreaChart, Area, LineChart, Line
} from 'recharts';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface CategoryData {
    category_id: string;
    label: string;
    total: number;
    count: number;
    color: string;
}

interface TimeSeriesData {
    date: string;
    label: string;
    income: number;
    expense: number;
    balance: number;
}

// ═══════════════════════════════════════════════════════════════
// Category Colors
// ═══════════════════════════════════════════════════════════════

const CATEGORY_COLORS: Record<string, string> = {
    'home': '#10B981',
    'housing': '#10B981',
    'transport': '#3B82F6',
    'food': '#F59E0B',
    'health': '#EC4899',
    'leisure': '#8B5CF6',
    'education': '#06B6D4',
    'utilities': '#6366F1',
    'vehicle': '#F43F5E',
    'shopping': '#D946EF',
    'taxes': '#EF4444',
    'contracts': '#F97316',
    'documents': '#14B8A6',
    'outros': '#6B7280'
};

const CHART_COLORS = [
    '#10B981', '#3B82F6', '#F59E0B', '#EC4899',
    '#8B5CF6', '#06B6D4', '#6366F1', '#F43F5E'
];

// ═══════════════════════════════════════════════════════════════
// Custom Tooltip
// ═══════════════════════════════════════════════════════════════

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
                <p className="text-xs font-bold text-white mb-1">{data.label || data.name}</p>
                <p className="text-sm font-black text-emerald-400">
                    {data.total?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ||
                        payload[0].value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                {data.count && (
                    <p className="text-[10px] text-slate-400 mt-1">{data.count} transações</p>
                )}
            </div>
        );
    }
    return null;
};

const MultiLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
                <p className="text-xs font-bold text-slate-400 mb-2">{label}</p>
                {payload.map((entry: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-xs text-slate-300">{entry.name}:</span>
                        <span className="text-xs font-bold text-white">
                            {entry.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// ═══════════════════════════════════════════════════════════════
// Donut Chart - Spending by Category
// ═══════════════════════════════════════════════════════════════

interface DonutChartProps {
    data: CategoryData[];
    size?: number;
    showLegend?: boolean;
}

export const SpendingDonutChart: React.FC<DonutChartProps> = ({
    data,
    size = 200,
    showLegend = true
}) => {
    const chartData = data.map(item => ({
        ...item,
        name: item.label,
        value: item.total,
        color: item.color || CATEGORY_COLORS[item.category_id] || '#6B7280'
    }));

    const total = data.reduce((acc, item) => acc + item.total, 0);

    return (
        <div className="flex flex-col items-center">
            <div style={{ width: size, height: size }} className="relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={size * 0.35}
                            outerRadius={size * 0.45}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Total</p>
                    <p className="text-lg font-black text-white">
                        {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>
            </div>

            {showLegend && (
                <div className="grid grid-cols-2 gap-2 mt-4 w-full">
                    {chartData.slice(0, 6).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-sm flex-shrink-0"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="text-xs text-slate-400 truncate">{item.label}</span>
                            <span className="text-xs font-bold text-white ml-auto">
                                {((item.total / total) * 100).toFixed(0)}%
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// Bar Chart - Monthly Comparison
// ═══════════════════════════════════════════════════════════════

interface BarChartProps {
    data: { month: string; income: number; expense: number }[];
    height?: number;
}

export const MonthlyBarChart: React.FC<BarChartProps> = ({ data, height = 200 }) => {
    return (
        <div style={{ width: '100%', height }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis
                        dataKey="month"
                        tick={{ fill: '#64748B', fontSize: 10 }}
                        axisLine={{ stroke: '#334155' }}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fill: '#64748B', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<MultiLineTooltip />} />
                    <Bar dataKey="income" name="Receitas" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Despesas" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// Area Chart - Balance Evolution
// ═══════════════════════════════════════════════════════════════

interface AreaChartProps {
    data: TimeSeriesData[];
    height?: number;
}

export const BalanceAreaChart: React.FC<AreaChartProps> = ({ data, height = 180 }) => {
    return (
        <div style={{ width: '100%', height }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis
                        dataKey="label"
                        tick={{ fill: '#64748B', fontSize: 10 }}
                        axisLine={{ stroke: '#334155' }}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fill: '#64748B', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<MultiLineTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="balance"
                        name="Saldo"
                        stroke="#10B981"
                        strokeWidth={2}
                        fill="url(#colorBalance)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// Mini Sparkline - For compact widgets
// ═══════════════════════════════════════════════════════════════

interface SparklineProps {
    data: number[];
    color?: string;
    height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
    data,
    color = '#10B981',
    height = 40
}) => {
    const chartData = data.map((value, index) => ({ value, index }));

    return (
        <div style={{ width: '100%', height }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// Budget Progress Ring
// ═══════════════════════════════════════════════════════════════

interface BudgetRingProps {
    spent: number;
    limit: number;
    size?: number;
    category?: string;
}

export const BudgetProgressRing: React.FC<BudgetRingProps> = ({
    spent,
    limit,
    size = 80,
    category
}) => {
    const percentage = Math.min((spent / limit) * 100, 100);
    const isWarning = percentage >= 70 && percentage < 90;
    const isDanger = percentage >= 90;

    const color = isDanger ? '#F43F5E' : isWarning ? '#F59E0B' : '#10B981';

    const data = [
        { name: 'spent', value: spent },
        { name: 'remaining', value: Math.max(limit - spent, 0) }
    ];

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={size * 0.35}
                        outerRadius={size * 0.45}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        stroke="none"
                    >
                        <Cell fill={color} />
                        <Cell fill="#1E293B" />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-sm font-black" style={{ color }}>
                    {percentage.toFixed(0)}%
                </p>
            </div>
        </div>
    );
};
