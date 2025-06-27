import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend, PieChart
} from 'recharts';
import { BarChart3, TrendingUp, Sparkles } from 'lucide-react';

const DEFAULT_COLORS = [
    '#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#84cc16',
];

interface ChartData {
    [key: string]: any;
}

interface ChartProps {
    title: string;
    description?: string;
    data: ChartData[];
    type: 'line' | 'area' | 'bar' | 'pie';
    height?: number;
    loading?: boolean;
    xAxisKey?: string;
    yAxisKey?: string | string[];
    colors?: string[];
    showLegend?: boolean;
    showGrid?: boolean;
    formatters?: {
        x?: (value: any) => string;
        y?: (value: any) => string;
        tooltip?: (value: any, name: string, props: any) => string;
    };
    className?: string;
}

function getChartIcon(type: ChartProps['type']) {
    switch (type) {
        case 'bar': return <BarChart3 className="h-5 w-5 text-white" />;
        case 'pie': return <PieChart className="h-5 w-5 text-white" />;
        default: return <TrendingUp className="h-5 w-5 text-white" />;
    }
}

function getChartGradient(type: ChartProps['type']) {
    switch (type) {
        case 'bar': return 'from-blue-500 to-indigo-600';
        case 'pie': return 'from-purple-500 to-pink-600';
        case 'area': return 'from-emerald-500 to-teal-600';
        default: return 'from-violet-500 to-purple-600';
    }
}

export function Chart({
                          title,
                          description,
                          data,
                          type,
                          height = 300,
                          loading = false,
                          xAxisKey = 'name',
                          yAxisKey = 'value',
                          colors = DEFAULT_COLORS,
                          showLegend = false,
                          showGrid = true,
                          formatters = {},
                          className
                      }: ChartProps) {
    const formatNumber = (value: number) => new Intl.NumberFormat('pt-BR').format(value);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-4 shadow-2xl shadow-slate-900/20">
                    <p className="font-semibold mb-3 text-slate-900 text-sm">
                        {formatters.x ? formatters.x(label) : label}
                    </p>
                    <div className="space-y-2">
                        {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center gap-3 text-sm">
                                <div
                                    className="w-3 h-3 rounded-full shadow-sm"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="capitalize text-slate-600 font-medium">{entry.name || entry.dataKey}:</span>
                                <span className="font-bold text-slate-900">
                                    {formatters.tooltip
                                        ? formatters.tooltip(entry.value, entry.name, entry)
                                        : formatters.y
                                            ? formatters.y(entry.value)
                                            : formatNumber(entry.value)
                                    }
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    const renderChart = () => {
        const commonProps = {
            data,
            margin: { top: 10, right: 30, left: 0, bottom: 0 }
        };

        switch (type) {
            case 'line':
                return (
                    <LineChart {...commonProps}>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200/60" />}
                        <XAxis
                            dataKey={xAxisKey}
                            tickFormatter={formatters.x}
                            className="text-xs text-slate-600"
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tickFormatter={formatters.y || formatNumber}
                            className="text-xs text-slate-600"
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {showLegend && <Legend />}
                        {Array.isArray(yAxisKey) ? (
                            yAxisKey.map((key, index) => (
                                <Line
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={colors[index % colors.length]}
                                    strokeWidth={3}
                                    dot={{ fill: colors[index % colors.length], strokeWidth: 0, r: 5 }} // removido shadow
                                    activeDot={{ r: 7, stroke: colors[index % colors.length], strokeWidth: 3, fill: 'white' }} // removido shadow
                                />
                            ))
                        ) : (
                            <Line
                                type="monotone"
                                dataKey={yAxisKey}
                                stroke={colors[0]}
                                strokeWidth={3}
                                dot={{ fill: colors[0], strokeWidth: 0, r: 5 }}
                                activeDot={{ r: 7, stroke: colors[0], strokeWidth: 3, fill: 'white' }}
                            />
                        )}
                    </LineChart>
                );
            case 'area':
                return (
                    <AreaChart {...commonProps}>
                        <defs>
                            {Array.isArray(yAxisKey) ? (
                                yAxisKey.map((key, index) => (
                                    <linearGradient key={key} id={`gradient${key}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0.1} />
                                    </linearGradient>
                                ))
                            ) : (
                                <linearGradient id="gradientValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={colors[0]} stopOpacity={0.8} />
                                    <stop offset="95%" stopColor={colors[0]} stopOpacity={0.1} />
                                </linearGradient>
                            )}
                        </defs>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200/60" />}
                        <XAxis
                            dataKey={xAxisKey}
                            tickFormatter={formatters.x}
                            className="text-xs text-slate-600"
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tickFormatter={formatters.y || formatNumber}
                            className="text-xs text-slate-600"
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {showLegend && <Legend />}
                        {Array.isArray(yAxisKey) ? (
                            yAxisKey.map((key, index) => (
                                <Area
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={colors[index % colors.length]}
                                    fillOpacity={1}
                                    fill={`url(#gradient${key})`}
                                    strokeWidth={3}
                                />
                            ))
                        ) : (
                            <Area
                                type="monotone"
                                dataKey={yAxisKey}
                                stroke={colors[0]}
                                fillOpacity={1}
                                fill="url(#gradientValue)"
                                strokeWidth={3}
                            />
                        )}
                    </AreaChart>
                );
            case 'bar':
                return (
                    <BarChart {...commonProps}>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200/60" />}
                        <XAxis
                            dataKey={xAxisKey}
                            tickFormatter={formatters.x}
                            className="text-xs text-slate-600"
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tickFormatter={formatters.y || formatNumber}
                            className="text-xs text-slate-600"
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {showLegend && <Legend />}
                        {Array.isArray(yAxisKey) ? (
                            yAxisKey.map((key, index) => (
                                <Bar
                                    key={key}
                                    dataKey={key}
                                    fill={colors[index % colors.length]}
                                    radius={[6, 6, 0, 0]}
                                />
                            ))
                        ) : (
                            <Bar
                                dataKey={yAxisKey}
                                fill={colors[0]}
                                radius={[6, 6, 0, 0]}
                            />
                        )}
                    </BarChart>
                );
            case 'pie':
                return (
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                                percent !== undefined
                                    ? `${name} ${(percent * 100).toFixed(0)}%`
                                    : name
                            }
                            outerRadius={90}
                            fill="#8884d8"
                            dataKey={yAxisKey as string}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        {showLegend && <Legend />}
                    </PieChart>
                );
            default:
                return <div>Tipo de gráfico não suportado</div>;
        }
    };

    if (loading) {
        return (
            <Card className="relative overflow-hidden border-0 shadow-2xl shadow-slate-900/10 bg-white">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 via-white to-slate-50/80" />
                <CardHeader className="relative bg-gradient-to-r from-slate-50/90 to-white/90 backdrop-blur-sm border-b border-slate-200/60">
                    <CardTitle className="flex items-center gap-3 text-xl font-bold">
                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${getChartGradient(type)} shadow-lg`}>
                            {getChartIcon(type)}
                        </div>
                        <div className="flex items-center gap-3">
                            {title}
                            <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 animate-pulse shadow-lg">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Carregando...
                            </Badge>
                        </div>
                    </CardTitle>
                    {description && (
                        <CardDescription className="text-base text-slate-600 font-medium">
                            {description}
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent className="relative p-8">
                    <div className="flex items-center justify-center" style={{ height }}>
                        <div className="relative">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-500 shadow-lg"></div>
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 animate-pulse"></div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Card className="relative overflow-hidden border-0 shadow-2xl shadow-slate-900/10 bg-white">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 via-white to-slate-50/80" />
                <CardHeader className="relative bg-gradient-to-r from-slate-50/90 to-white/90 backdrop-blur-sm border-b border-slate-200/60">
                    <CardTitle className="flex items-center gap-3 text-xl font-bold">
                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${getChartGradient(type)} shadow-lg`}>
                            {getChartIcon(type)}
                        </div>
                        {title}
                    </CardTitle>
                    {description && (
                        <CardDescription className="text-base text-slate-600 font-medium">
                            {description}
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent className="relative p-8">
                    <div
                        className="flex flex-col items-center justify-center text-slate-500 bg-slate-50/80 rounded-2xl border-2 border-dashed border-slate-200"
                        style={{ height }}
                    >
                        <div className={`p-4 rounded-2xl bg-gradient-to-br ${getChartGradient(type)} shadow-lg mb-4 opacity-60`}>
                            {getChartIcon(type)}
                        </div>
                        <p className="font-semibold text-lg">Nenhum dado disponível</p>
                        <p className="text-sm text-slate-400 mt-1">Os dados aparecerão aqui quando disponíveis</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="relative overflow-hidden border-0 shadow-2xl shadow-slate-900/10 bg-white hover:shadow-3xl hover:shadow-slate-900/15 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 via-white to-slate-50/80" />
            <CardHeader className="relative bg-gradient-to-r from-slate-50/90 to-white/90 backdrop-blur-sm border-b border-slate-200/60">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${getChartGradient(type)} shadow-lg transition-transform duration-200 hover:scale-110`}>
                        {getChartIcon(type)}
                    </div>
                    {title}
                </CardTitle>
                {description && (
                    <CardDescription className="text-base text-slate-600 font-medium">
                        {description}
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent className="relative p-8">
                <ResponsiveContainer width="100%" height={height}>
                    {renderChart()}
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}