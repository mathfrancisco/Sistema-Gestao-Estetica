// components/charts/RevenueChart.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface RevenueData {
    date: string;
    revenue: number;
    profit: number;
    transactions: number;
}

interface RevenueChartProps {
    data: RevenueData[];
    title?: string;
    description?: string;
    type?: 'line' | 'area';
    height?: number;
    loading?: boolean;
    showProfit?: boolean;
    period?: 'day' | 'week' | 'month';
}

export function RevenueChart({
                                 data,
                                 title = "Evolução da Receita",
                                 description,
                                 type = 'area',
                                 height = 300,
                                 loading = false,
                                 showProfit = true,
                                 period = 'day'
                             }: RevenueChartProps) {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);

        switch (period) {
            case 'day':
                return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            case 'week':
                return `Sem ${date.getWeek()}`;
            case 'month':
                return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
            default:
                return date.toLocaleDateString('pt-BR');
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background border rounded-lg p-3 shadow-lg">
                    <p className="font-medium">{formatDate(label)}</p>
                    <div className="space-y-1 mt-2">
                        {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="capitalize">{entry.dataKey === 'revenue' ? 'Receita' : 'Lucro'}:</span>
                                <span className="font-medium">{formatCurrency(entry.value)}</span>
                            </div>
                        ))}
                        {payload[0]?.payload?.transactions && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Transações: {payload[0].payload.transactions}</span>
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
                <CardContent>
                    <div className="w-full h-[300px] bg-muted animate-pulse rounded" />
                </CardContent>
            </Card>
        );
    }

    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
    const totalProfit = data.reduce((sum, item) => sum + item.profit, 0);
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        {description && <CardDescription>{description}</CardDescription>}
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                            Margem: {profitMargin.toFixed(1)}%
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Resumo */}
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                                <span>Receita Total: {formatCurrency(totalRevenue)}</span>
                            </div>
                            {showProfit && (
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                                    <span>Lucro Total: {formatCurrency(totalProfit)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Gráfico */}
                    <div style={{ height }}>
                        <ResponsiveContainer width="100%" height="100%">
                            {type === 'area' ? (
                                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        {showProfit && (
                                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        )}
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={formatDate}
                                        className="text-xs"
                                    />
                                    <YAxis
                                        tickFormatter={(value) => formatCurrency(value)}
                                        className="text-xs"
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                    />
                                    {showProfit && (
                                        <Area
                                            type="monotone"
                                            dataKey="profit"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorProfit)"
                                        />
                                    )}
                                </AreaChart>
                            ) : (
                                <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={formatDate}
                                        className="text-xs"
                                    />
                                    <YAxis
                                        tickFormatter={(value) => formatCurrency(value)}
                                        className="text-xs"
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                                    />
                                    {showProfit && (
                                        <Line
                                            type="monotone"
                                            dataKey="profit"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                                            activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                                        />
                                    )}
                                </LineChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Extensão do Date para calcular semana
declare global {
    interface Date {
        getWeek(): number;
    }
}

Date.prototype.getWeek = function() {
    const date = new Date(this.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};