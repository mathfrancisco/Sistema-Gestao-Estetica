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
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
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
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#f97316', '#84cc16'
];

export function ProfitDistributionChart({
                                            data,
                                            title = "Distribuição de Lucros",
                                            description,
                                            type = 'pie',
                                            loading = false,
                                            showLegend = true,
                                            showPercentages = true,
                                            showTrends = false,
                                            height = 300,
                                            className
                                        }: ProfitDistributionChartProps) {
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);

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
                <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg">
                    <p className="font-medium mb-2">{d.category}</p>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between gap-4">
                            <span className="text-slate-600">Valor:</span>
                            <span className="font-medium">{formatCurrency(d.value)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-slate-600">Percentual:</span>
                            <span className="font-medium">{formatPercentage(d.percentage)}</span>
                        </div>
                        {d.change && (
                            <div className="flex justify-between gap-4">
                                <span className="text-slate-600">Variação:</span>
                                <span className={cn(
                                    "font-medium flex items-center gap-1",
                                    d.change.isPositive ? "text-emerald-600" : "text-red-600"
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
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-emerald-500" />
                        {title}
                        <Badge variant="outline" className="animate-pulse">Carregando...</Badge>
                    </CardTitle>
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center" style={{ height }}>
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-emerald-500"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-emerald-500" />
                        {title}
                    </CardTitle>
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center text-slate-500" style={{ height }}>
                        <div className="text-center">
                            <Target className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                            <p className="font-medium">Nenhum dado de lucro disponível</p>
                            <p className="text-sm text-slate-400 mt-1">Os dados aparecerão aqui quando disponíveis</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-emerald-500" />
                            {title}
                        </CardTitle>
                        {description && <CardDescription>{description}</CardDescription>}
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(totalValue)}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Gráfico Principal */}
                <ResponsiveContainer width="100%" height={height}>
                    {type === 'pie' ? (
                        <PieChart>
                            <Pie
                                data={enrichedData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={showPercentages ? PieChartLabel : false}
                                outerRadius={Math.min(height * 0.35, 100)}
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
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                                dataKey="category"
                                fontSize={12}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                            />
                            <YAxis
                                tickFormatter={formatCurrency}
                                fontSize={12}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {enrichedData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    )}
                </ResponsiveContainer>

                {/* Lista de Categorias */}
                <div className="space-y-3">
                    {enrichedData.slice(0, 5).map((item) => (
                        <div
                            key={item.category}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                />
                                <div>
                                    <p className="font-medium text-slate-900">{item.category}</p>
                                    <p className="text-xs text-slate-500">
                                        {formatPercentage(item.percentage)} do total
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-slate-900">
                                    {formatCurrency(item.value)}
                                </p>
                                {showTrends && item.change && (
                                    <div className={cn(
                                        "flex items-center gap-1 text-xs mt-1",
                                        item.change.isPositive ? "text-emerald-600" : "text-red-600"
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

                    {enrichedData.length > 5 && (
                        <div className="text-center pt-2">
                            <Badge variant="outline" className="text-xs">
                                +{enrichedData.length - 5} categorias
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Resumo */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-6 text-sm">
                        <div>
                            <span className="text-slate-600">Categorias: </span>
                            <span className="font-medium">{data.length}</span>
                        </div>
                        <div>
                            <span className="text-slate-600">Maior: </span>
                            <span className="font-medium">
                                {formatPercentage(Math.max(...data.map(d => d.percentage)))}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-600">Menor: </span>
                            <span className="font-medium">
                                {formatPercentage(Math.min(...data.map(d => d.percentage)))}
                            </span>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                        Total: 100%
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}

export default ProfitDistributionChart;