// components/financial/RevenueChart.tsx
'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts'
import {
    TrendingUp,
    DollarSign,
    Activity,
    Download,
    RefreshCw,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface RevenueData {
    date: string
    revenue: number
    profit: number
    transactions: number
}

interface RevenueChartProps {
    data: RevenueData[]
    isLoading?: boolean
    title?: string
    chartType?: 'line' | 'area' | 'bar'
    showProfit?: boolean
    showTransactions?: boolean
    className?: string
    onRefresh?: () => void
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
                                                              data,
                                                              isLoading = false,
                                                              title = "Evolução da Receita",
                                                              chartType = 'area',
                                                              showProfit = true,
                                                              showTransactions = false,
                                                              className = "",
                                                              onRefresh
                                                          }) => {
    // Formatar dados para o gráfico
    const chartData = data.map(item => ({
        ...item,
        formattedDate: format(parseISO(item.date), 'dd/MM', { locale: ptBR }),
        fullDate: format(parseISO(item.date), 'dd/MM/yyyy', { locale: ptBR })
    }))

    // Calcular métricas
    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0)
    const totalProfit = data.reduce((sum, item) => sum + item.profit, 0)
    const totalTransactions = data.reduce((sum, item) => sum + item.transactions, 0)
    const averageRevenue = data.length > 0 ? totalRevenue / data.length : 0

    // Crescimento da receita (comparando primeiro e último período)
    const revenueGrowth = data.length >= 2
        ? ((data[data.length - 1].revenue - data[0].revenue) / data[0].revenue) * 100
        : 0

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        })
    }

    const formatTooltip = (value: number, name: string) => {
        if (name === 'transactions') {
            return [value.toString(), 'Transações']
        }
        return [formatCurrency(value), name === 'revenue' ? 'Receita' : 'Lucro']
    }

    const renderChart = () => {
        const commonProps = {
            data: chartData,
            margin: { top: 20, right: 30, left: 20, bottom: 20 }
        }

        switch (chartType) {
            case 'line':
                return (
                    <LineChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                            dataKey="formattedDate"
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
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                            formatter={formatTooltip}
                            labelFormatter={(label) => {
                                const item = chartData.find(d => d.formattedDate === label)
                                return item ? item.fullDate : label
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                        />
                        {showProfit && (
                            <Line
                                type="monotone"
                                dataKey="profit"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                            />
                        )}
                    </LineChart>
                )

            case 'bar':
                return (
                    <BarChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                            dataKey="formattedDate"
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
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                            formatter={formatTooltip}
                            labelFormatter={(label) => {
                                const item = chartData.find(d => d.formattedDate === label)
                                return item ? item.fullDate : label
                            }}
                        />
                        <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        {showProfit && (
                            <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                        )}
                    </BarChart>
                )

            default: // area
                return (
                    <AreaChart {...commonProps}>
                        <defs>
                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                            dataKey="formattedDate"
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
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                            formatter={formatTooltip}
                            labelFormatter={(label) => {
                                const item = chartData.find(d => d.formattedDate === label)
                                return item ? item.fullDate : label
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fill="url(#revenueGradient)"
                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        />
                        {showProfit && (
                            <Area
                                type="monotone"
                                dataKey="profit"
                                stroke="#10b981"
                                strokeWidth={2}
                                fill="url(#profitGradient)"
                                dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                            />
                        )}
                    </AreaChart>
                )
        }
    }

    if (isLoading) {
        return (
            <Card className={`border-0 shadow-xl shadow-slate-200/60 ${className}`}>
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        {title}
                        <RefreshCw className="w-4 h-4 animate-spin ml-2 text-blue-500" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="h-80 bg-slate-100 rounded-lg animate-pulse" />
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
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                            {title}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                <span className="text-sm text-slate-600">Receita</span>
                            </div>
                            {showProfit && (
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                    <span className="text-sm text-slate-600">Lucro</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className={`${revenueGrowth >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                        >
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
                        </Badge>
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
                {data.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TrendingUp className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            Nenhum dado disponível
                        </h3>
                        <p className="text-slate-500">
                            Não há dados de receita para exibir no período selecionado.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Métricas Resumidas */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <DollarSign className="w-8 h-8 text-blue-600" />
                                    <div>
                                        <p className="text-sm font-medium text-blue-700">Receita Total</p>
                                        <p className="text-lg font-bold text-blue-900">{formatCurrency(totalRevenue)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="w-8 h-8 text-emerald-600" />
                                    <div>
                                        <p className="text-sm font-medium text-emerald-700">Lucro Total</p>
                                        <p className="text-lg font-bold text-emerald-900">{formatCurrency(totalProfit)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <Activity className="w-8 h-8 text-purple-600" />
                                    <div>
                                        <p className="text-sm font-medium text-purple-700">Média Diária</p>
                                        <p className="text-lg font-bold text-purple-900">{formatCurrency(averageRevenue)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Gráfico */}
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                {renderChart()}
                            </ResponsiveContainer>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}