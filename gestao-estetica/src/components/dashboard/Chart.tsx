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
    Legend,
    PieChart
} from 'recharts';
import { BarChart3, TrendingUp, Target, Activity } from 'lucide-react';

const DEFAULT_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
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
        case 'bar': return <BarChart3 className="h-5 w-5" />;
        case 'pie': return <Target className="h-5 w-5" />;
        case 'area': return <Activity className="h-5 w-5" />;
        default: return <TrendingUp className="h-5 w-5" />;
    }
}

function getChartColor(type: ChartProps['type']) {
    switch (type) {
        case 'bar': return 'text-blue-500';
        case 'pie': return 'text-purple-500';
        case 'area': return 'text-emerald-500';
        default: return 'text-indigo-500';
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
                <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg">
                    <p className="font-medium text-slate-900 mb-2">
                        {formatters.x ? formatters.x(label) : label}
                    </p>
                    <div className="space-y-1">
                        {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-slate-600">{entry.name || entry.dataKey}:</span>
                                <span className="font-medium text-slate-900">
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
            margin: { top: 5, right: 5, left: 5, bottom: 5 }
        };

        switch (type) {
            case 'line':
                return (
                    <LineChart {...commonProps}>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
                        <XAxis
                            dataKey={xAxisKey}
                            tickFormatter={formatters.x}
                            fontSize={12}
                            stroke="#64748b"
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tickFormatter={formatters.y || formatNumber}
                            fontSize={12}
                            stroke="#64748b"
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
                                    strokeWidth={2}
                                    dot={{ fill: colors[index % colors.length], strokeWidth: 0, r: 4 }}
                                    activeDot={{ r: 6, stroke: colors[index % colors.length], strokeWidth: 2, fill: 'white' }}
                                />
                            ))
                        ) : (
                            <Line
                                type="monotone"
                                dataKey={yAxisKey}
                                stroke={colors[0]}
                                strokeWidth={2}
                                dot={{ fill: colors[0], strokeWidth: 0, r: 4 }}
                                activeDot={{ r: 6, stroke: colors[0], strokeWidth: 2, fill: 'white' }}
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
                                        <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0.05} />
                                    </linearGradient>
                                ))
                            ) : (
                                <linearGradient id="gradientValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={colors[0]} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={colors[0]} stopOpacity={0.05} />
                                </linearGradient>
                            )}
                        </defs>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
                        <XAxis
                            dataKey={xAxisKey}
                            tickFormatter={formatters.x}
                            fontSize={12}
                            stroke="#64748b"
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tickFormatter={formatters.y || formatNumber}
                            fontSize={12}
                            stroke="#64748b"
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
                                    strokeWidth={2}
                                />
                            ))
                        ) : (
                            <Area
                                type="monotone"
                                dataKey={yAxisKey}
                                stroke={colors[0]}
                                fillOpacity={1}
                                fill="url(#gradientValue)"
                                strokeWidth={2}
                            />
                        )}
                    </AreaChart>
                );
            case 'bar':
                return (
                    <BarChart {...commonProps}>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
                        <XAxis
                            dataKey={xAxisKey}
                            tickFormatter={formatters.x}
                            fontSize={12}
                            stroke="#64748b"
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tickFormatter={formatters.y || formatNumber}
                            fontSize={12}
                            stroke="#64748b"
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
                                    radius={[4, 4, 0, 0]}
                                />
                            ))
                        ) : (
                            <Bar
                                dataKey={yAxisKey}
                                fill={colors[0]}
                                radius={[4, 4, 0, 0]}
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
                                percent !== undefined && percent > 0.05
                                    ? `${name} ${(percent * 100).toFixed(0)}%`
                                    : ''
                            }
                            outerRadius={Math.min(height * 0.35, 120)}
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
                return <div className="text-center text-slate-500">Tipo de gráfico não suportado</div>;
        }
    };

    if (loading) {
        return (
            <Card className={className}>
                {title && (
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <div className={`${getChartColor(type)}`}>
                                {getChartIcon(type)}
                            </div>
                            {title}
                            <Badge variant="outline" className="animate-pulse">
                                Carregando...
                            </Badge>
                        </CardTitle>
                        {description && <CardDescription>{description}</CardDescription>}
                    </CardHeader>
                )}
                <CardContent>
                    <div className="flex items-center justify-center" style={{ height }}>
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-blue-500"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Card className={className}>
                {title && (
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <div className={`${getChartColor(type)}`}>
                                {getChartIcon(type)}
                            </div>
                            {title}
                        </CardTitle>
                        {description && <CardDescription>{description}</CardDescription>}
                    </CardHeader>
                )}
                <CardContent>
                    <div
                        className="flex flex-col items-center justify-center text-slate-500 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200"
                        style={{ height }}
                    >
                        <div className={`${getChartColor(type)} mb-3`}>
                            {getChartIcon(type)}
                        </div>
                        <p className="font-medium">Nenhum dado disponível</p>
                        <p className="text-sm text-slate-400">Os dados aparecerão aqui quando disponíveis</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            {title && (
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <div className={`${getChartColor(type)}`}>
                            {getChartIcon(type)}
                        </div>
                        {title}
                    </CardTitle>
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
            )}
            <CardContent>
                <ResponsiveContainer width="100%" height={height}>
                    {renderChart()}
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}