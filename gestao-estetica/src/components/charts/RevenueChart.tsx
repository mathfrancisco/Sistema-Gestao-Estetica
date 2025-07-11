import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, DollarSign, Activity } from 'lucide-react';

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
                const weekNum = getWeekNumber(date);
                return `Sem ${weekNum}`;
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

    // Função helper para calcular semana
    const getWeekNumber = (date: Date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg">
                    <p className="font-medium mb-2">{formatDate(label)}</p>
                    <div className="space-y-1">
                        {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="capitalize">
                                    {entry.dataKey === 'revenue' ? 'Receita' : 'Lucro'}:
                                </span>
                                <span className="font-medium">{formatCurrency(entry.value)}</span>
                            </div>
                        ))}
                        {data?.transactions && (
                            <div className="flex items-center gap-2 text-sm text-slate-500 pt-1 border-t border-slate-100">
                                <Activity className="w-3 h-3" />
                                <span>Transações: {data.transactions}</span>
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
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
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
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                        {title}
                    </CardTitle>
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center text-slate-500" style={{ height }}>
                        <div className="text-center">
                            <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="font-medium">Nenhum dado de receita disponível</p>
                            <p className="text-sm text-slate-400 mt-1">Os dados aparecerão aqui quando disponíveis</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
    const totalProfit = data.reduce((sum, item) => sum + item.profit, 0);
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const totalTransactions = data.reduce((sum, item) => sum + (item.transactions || 0), 0);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                            {title}
                        </CardTitle>
                        {description && <CardDescription>{description}</CardDescription>}
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                            Margem: {profitMargin.toFixed(1)}%
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Resumo das métricas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-600 mb-1">Receita Total</p>
                        <p className="text-lg font-bold text-blue-900">{formatCurrency(totalRevenue)}</p>
                    </div>
                    {showProfit && (
                        <div className="text-center p-3 bg-emerald-50 rounded-lg">
                            <p className="text-sm text-emerald-600 mb-1">Lucro Total</p>
                            <p className="text-lg font-bold text-emerald-900">{formatCurrency(totalProfit)}</p>
                        </div>
                    )}
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-600 mb-1">Transações</p>
                        <p className="text-lg font-bold text-slate-900">{totalTransactions.toLocaleString()}</p>
                    </div>
                </div>

                {/* Gráfico */}
                <ResponsiveContainer width="100%" height={height}>
                    {type === 'area' ? (
                        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                                </linearGradient>
                                {showProfit && (
                                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                                    </linearGradient>
                                )}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDate}
                                fontSize={12}
                                stroke="#64748b"
                            />
                            <YAxis
                                tickFormatter={formatCurrency}
                                fontSize={12}
                                stroke="#64748b"
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
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDate}
                                fontSize={12}
                                stroke="#64748b"
                            />
                            <YAxis
                                tickFormatter={formatCurrency}
                                fontSize={12}
                                stroke="#64748b"
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

                {/* Legenda simplificada */}
                <div className="flex items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full" />
                        <span className="text-slate-700">Receita</span>
                    </div>
                    {showProfit && (
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                            <span className="text-slate-700">Lucro</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}