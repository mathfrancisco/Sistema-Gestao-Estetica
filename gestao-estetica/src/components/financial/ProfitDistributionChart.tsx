// components/financial/ProfitDistributionChart.tsx
'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts'
import {
    PieChart as PieChartIcon,
    BarChart3,
    DollarSign,
    TrendingUp,
    Settings,
    AlertTriangle,
    Download,
    RefreshCw,
    Target,
    Calculator
} from 'lucide-react'
import type { ProfitDistributionSummary, ProfitCategory } from '@/lib/services/financial.service'

interface ProfitDistributionChartProps {
    summary: ProfitDistributionSummary | null
    isLoading?: boolean
    chartType?: 'pie' | 'bar'
    showLegend?: boolean
    className?: string
    onRefresh?: () => void
}

export const ProfitDistributionChart: React.FC<ProfitDistributionChartProps> = ({
                                                                                    summary,
                                                                                    isLoading = false,
                                                                                    chartType = 'pie',
                                                                                    showLegend = true,
                                                                                    className = "",
                                                                                    onRefresh
                                                                                }) => {
    // Configuração das cores por categoria
    const categoryConfig = {
        pro_labore: {
            label: 'Pró-labore',
            color: '#10b981',
            icon: DollarSign,
            description: 'Remuneração do proprietário'
        },
        equipment_reserve: {
            label: 'Reserva Equipamentos',
            color: '#3b82f6',
            icon: Settings,
            description: 'Fundo para equipamentos'
        },
        emergency_reserve: {
            label: 'Reserva Emergência',
            color: '#f59e0b',
            icon: AlertTriangle,
            description: 'Fundo de emergência'
        },
        investment: {
            label: 'Investimento',
            color: '#8b5cf6',
            icon: TrendingUp,
            description: 'Marketing e crescimento'
        }
    }

    const colors = Object.values(categoryConfig).map(config => config.color)

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        })
    }

    // Preparar dados para o gráfico
    const chartData = summary?.distributions.map(dist => ({
        name: categoryConfig[dist.category]?.label || dist.category,
        value: dist.amount,
        percentage: dist.percentage,
        category: dist.category,
        color: categoryConfig[dist.category]?.color || '#64748b'
    })) || []

    // Tooltip personalizado
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            return (
                <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                    <p className="font-medium text-slate-900">{data.name}</p>
                    <p className="text-sm text-slate-600">
                        Valor: <span className="font-semibold">{formatCurrency(data.value)}</span>
                    </p>
                    <p className="text-sm text-slate-600">
                        Percentual: <span className="font-semibold">{data.percentage.toFixed(1)}%</span>
                    </p>
                </div>
            )
        }
        return null
    }

    // Renderizar label personalizado para o gráfico de pizza
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        if (percent < 0.05) return null // Não mostrar labels para fatias muito pequenas

        const RADIAN = Math.PI / 180
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5
        const x = cx + radius * Math.cos(-midAngle * RADIAN)
        const y = cy + radius * Math.sin(-midAngle * RADIAN)

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                fontSize={12}
                fontWeight="bold"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        )
    }

    if (isLoading) {
        return (
            <Card className={`border-0 shadow-xl shadow-slate-200/60 ${className}`}>
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                    <CardTitle className="flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-blue-500" />
                        Distribuição de Lucros
                        <RefreshCw className="w-4 h-4 animate-spin ml-2 text-blue-500" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="h-80 bg-slate-100 rounded-lg animate-pulse" />
                </CardContent>
            </Card>
        )
    }

    if (!summary || summary.totalProfit === 0) {
        return (
            <Card className={`border-0 shadow-xl shadow-slate-200/60 ${className}`}>
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                    <CardTitle className="flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-blue-500" />
                        Distribuição de Lucros
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <PieChartIcon className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            Nenhum lucro para distribuir
                        </h3>
                        <p className="text-slate-500">
                            Configure as categorias de distribuição e tenha lucro no período para visualizar os dados.
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={`border-0 shadow-xl shadow-slate-200/60 ${className}`}>
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg lg:text-xl mb-2">
                            <PieChartIcon className="w-5 h-5 text-blue-500" />
                            Distribuição de Lucros
                        </CardTitle>
                        <div className="flex items-center gap-4">
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                <Target className="w-3 h-3 mr-1" />
                                Lucro Total: {formatCurrency(summary.totalProfit)}
                            </Badge>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                <Calculator className="w-3 h-3 mr-1" />
                                Distribuído: {formatCurrency(summary.totalDistributed)}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {onRefresh && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRefresh}
                                className="bg-white border-slate-200 hover:bg-slate-50"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Atualizar
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-white border-slate-200 hover:bg-slate-50"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Exportar
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 lg:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Gráfico */}
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            {chartType === 'pie' ? (
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={renderCustomizedLabel}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                        animationBegin={0}
                                        animationDuration={800}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                                stroke="white"
                                                strokeWidth={2}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            ) : (
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#64748b"
                                        fontSize={12}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        stroke="#64748b"
                                        fontSize={12}
                                        tickLine={false}
                                        tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar
                                        dataKey="value"
                                        radius={[4, 4, 0, 0]}
                                        fill="#3b82f6"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </div>

                    {/* Detalhes */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-slate-900 text-lg">Detalhamento</h4>
                        <div className="space-y-3">
                            {summary.distributions.map((dist) => {
                                const config = categoryConfig[dist.category]
                                const Icon = config?.icon || DollarSign
                                const percentage = summary.totalProfit > 0 ? (dist.amount / summary.totalProfit) * 100 : 0

                                return (
                                    <div key={dist.category} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: config?.color || '#64748b' }}
                                            />
                                            <div className="flex items-center gap-2">
                                                <Icon className="w-4 h-4 text-slate-600" />
                                                <div>
                                                    <p className="font-medium text-slate-900 text-sm">
                                                        {config?.label || dist.category}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {config?.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-slate-900 text-sm">
                                                {formatCurrency(dist.amount)}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {percentage.toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Resumo */}
                        <div className="pt-4 border-t border-slate-200">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg p-3">
                                    <p className="text-xs font-medium text-emerald-700">Total Distribuído</p>
                                    <p className="text-lg font-bold text-emerald-900">
                                        {formatCurrency(summary.totalDistributed)}
                                    </p>
                                </div>
                                <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-3">
                                    <p className="text-xs font-medium text-orange-700">Pendente</p>
                                    <p className="text-lg font-bold text-orange-900">
                                        {formatCurrency(summary.totalPending)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}