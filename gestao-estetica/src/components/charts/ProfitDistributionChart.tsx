import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Percent, PieChart as PieChartIcon, BarChart as BarChartIcon } from 'lucide-react';
import { cn } from '@/lib/utils/utils';

interface ProfitDistributionData {
    category: string;
    value: number;
    percentage: number;
    color?: string;
    change?: {
        value: number;
        isPositive: boolean;
    };
}

interface ProfitDistributionChartProps {
    data: ProfitDistributionData[];
    title?: string;
    description?: string;
    type?: 'pie' | 'bar';
    loading?: boolean;
    showLegend?: boolean;
    showPercentages?: boolean;
    showTrends?: boolean;
    height?: number;
    className?: string;
}

const DEFAULT_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
];

function getChartIcon(type: 'pie' | 'bar') {
    return type === 'bar'
        ? <BarChartIcon className="h-6 w-6 text-primary" />
        : <PieChartIcon className="h-6 w-6 text-primary" />;
}

export function ProfitDistributionChart({
                                            data,
                                            title = "Distribuição de Lucros",
                                            description = "Análise da distribuição de lucros por categoria",
                                            type = 'pie',
                                            loading = false,
                                            showLegend = true,
                                            showPercentages = true,
                                            showTrends = false,
                                            height = 300,
                                            className
                                        }: ProfitDistributionChartProps) {
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

    const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

    const enrichedData = data.map((item, index) => ({
        ...item,
        color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
    }));

    const totalValue = data.reduce((sum, item) => sum + item.value, 0);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            return (
                <div className="bg-background border rounded-lg p-3 shadow-lg">
                    <p className="font-medium mb-2">{d.category}</p>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-sm text-muted-foreground">Valor:</span>
                            <span className="font-medium">{formatCurrency(d.value)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-sm text-muted-foreground">Percentual:</span>
                            <span className="font-medium">{formatPercentage(d.percentage)}</span>
                        </div>
                        {d.change && (
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-sm text-muted-foreground">Variação:</span>
                                <span className={cn(
                                    "font-medium flex items-center gap-1",
                                    d.change.isPositive ? "text-green-600" : "text-red-600"
                                )}>
                                    {d.change.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                    {formatPercentage(Math.abs(d.change.value))}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    const PieChartLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        if (percent < 0.05) return null;
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                className="text-xs font-medium"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    if (loading) {
        return (
            <Card className={cn("rounded-3xl shadow-lg border-0 bg-gradient-to-br from-white via-neutral-50 to-neutral-100", className)}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                        {getChartIcon(type)}
                        {title}
                        <Badge variant="secondary" className="animate-pulse">Carregando...</Badge>
                    </CardTitle>
                    {description && <CardDescription className="text-base text-muted-foreground">{description}</CardDescription>}
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center" style={{ height }}>
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary border-4"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Card className={cn("rounded-3xl shadow-lg border-0 bg-gradient-to-br from-white via-neutral-50 to-neutral-100", className)}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                        {getChartIcon(type)}
                        {title}
                    </CardTitle>
                    {description && <CardDescription className="text-base text-muted-foreground">{description}</CardDescription>}
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center text-muted-foreground" style={{ height }}>
                        <div className="text-center">
                            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhum dado de lucro disponível</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("rounded-3xl shadow-lg border-0 bg-gradient-to-br from-white via-neutral-50 to-neutral-100", className)}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg font-bold">
                            <DollarSign className="h-6 w-6 text-primary" />
                            {title}
                        </CardTitle>
                        {description && <CardDescription className="text-base text-muted-foreground">{description}</CardDescription>}
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1 px-3 py-1 rounded-lg bg-muted/30">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(totalValue)}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <ResponsiveContainer width="100%" height={height}>
                        {type === 'pie' ? (
                            <PieChart>
                                <Pie
                                    data={enrichedData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={showPercentages ? PieChartLabel : false}
                                    outerRadius={height * 0.35}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {enrichedData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                {showLegend && <Legend />}
                            </PieChart>
                        ) : (
                            <BarChart data={enrichedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis
                                    dataKey="category"
                                    className="text-xs"
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis
                                    tickFormatter={formatCurrency}
                                    className="text-xs"
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar
                                    dataKey="value"
                                    radius={[8, 8, 0, 0]}
                                >
                                    {enrichedData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                                {showLegend && <Legend />}
                            </BarChart>
                        )}
                    </ResponsiveContainer>

                    {/* Cartões-resumo */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {enrichedData.slice(0, 3).map((item) => (
                            <div
                                key={item.category}
                                className="flex items-center justify-between p-4 bg-white/80 dark:bg-muted/60 rounded-xl shadow group transition hover:shadow-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-4 h-4 rounded-full border-2 border-white shadow"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <div>
                                        <p className="text-sm font-semibold">{item.category}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatPercentage(item.percentage)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-base font-bold">
                                        {formatCurrency(item.value)}
                                    </p>
                                    {showTrends && item.change && (
                                        <div className={cn(
                                            "flex items-center gap-1 text-xs mt-1",
                                            item.change.isPositive ? "text-green-600" : "text-red-600"
                                        )}>
                                            {item.change.isPositive
                                                ? <TrendingUp className="h-3 w-3" />
                                                : <TrendingDown className="h-3 w-3" />}
                                            {formatPercentage(Math.abs(item.change.value))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Estatísticas finais */}
                    <div className="flex items-center justify-between pt-6 border-t border-muted/30">
                        <div className="flex items-center gap-8">
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">Categorias</p>
                                <p className="text-sm font-semibold">{data.length}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">Maior Fatia</p>
                                <p className="text-sm font-semibold">
                                    {formatPercentage(Math.max(...data.map(d => d.percentage)))}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">Menor Fatia</p>
                                <p className="text-sm font-semibold">
                                    {formatPercentage(Math.min(...data.map(d => d.percentage)))}
                                </p>
                            </div>
                        </div>
                        <Badge variant="secondary" className="flex items-center gap-1">
                            <Percent className="h-3 w-3" />
                            Total: 100%
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default ProfitDistributionChart;