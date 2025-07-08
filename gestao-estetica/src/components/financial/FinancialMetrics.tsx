// components/financial/FinancialMetrics.tsx
'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Activity,
    CreditCard,
    PiggyBank,
    Target,
    Calculator,
    ChevronRight
} from 'lucide-react'
import type { FinancialSummary } from '@/lib/services/financial.service'

interface FinancialMetricsProps {
    summary: FinancialSummary | null
    isLoading?: boolean
    className?: string
}

export const FinancialMetrics: React.FC<FinancialMetricsProps> = ({
                                                                      summary,
                                                                      isLoading = false,
                                                                      className = ""
                                                                  }) => {
    if (isLoading || !summary) {
        return (
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 ${className}`}>
                {[...Array(4)].map((_, index) => (
                    <Card key={index} className="border-0 shadow-xl shadow-slate-200/60">
                        <CardContent className="p-4 lg:p-6">
                            <div className="animate-pulse">
                                <div className="h-12 bg-slate-200 rounded-2xl mb-4" />
                                <div className="h-4 bg-slate-200 rounded mb-2" />
                                <div className="h-8 bg-slate-200 rounded mb-2" />
                                <div className="h-3 bg-slate-200 rounded" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    const metricsData = [
        {
            title: 'Receita Total',
            value: summary.totalRevenue,
            icon: DollarSign,
            description: 'Receita bruta do período',
            gradient: 'from-emerald-500 to-emerald-600',
            trend: {
                value: summary.totalRevenue > 0 ? '+' + ((summary.totalRevenue / (summary.totalRevenue + summary.totalCosts)) * 100).toFixed(1) + '%' : '0%',
                label: 'vs período anterior',
                isPositive: summary.totalRevenue > 0
            },
            prefix: 'R$',
            format: 'currency'
        },
        {
            title: 'Lucro Líquido',
            value: summary.totalProfit,
            icon: TrendingUp,
            description: 'Lucro após custos',
            gradient: 'from-blue-500 to-blue-600',
            trend: {
                value: summary.totalProfit > 0 ? '+' + ((summary.totalProfit / summary.totalRevenue) * 100).toFixed(1) + '%' : '0%',
                label: 'margem de lucro',
                isPositive: summary.totalProfit > 0
            },
            prefix: 'R$',
            format: 'currency'
        },
        {
            title: 'Ticket Médio',
            value: summary.averageTicket,
            icon: Calculator,
            description: 'Valor médio por transação',
            gradient: 'from-purple-500 to-purple-600',
            trend: {
                value: summary.transactionCount > 0 ? summary.transactionCount.toString() : '0',
                label: 'transações',
                isPositive: summary.transactionCount > 0
            },
            prefix: 'R$',
            format: 'currency'
        },
        {
            title: 'Taxa de Conversão',
            value: summary.conversionRate,
            icon: Target,
            description: 'Percentual de pagamentos recebidos',
            gradient: 'from-orange-500 to-orange-600',
            trend: {
                value: summary.conversionGrowth !== undefined ? (summary.conversionGrowth > 0 ? '+' : '') + summary.conversionGrowth.toFixed(1) + '%' : '0%',
                label: 'crescimento',
                isPositive: (summary.conversionGrowth || 0) >= 0
            },
            suffix: '%',
            format: 'percentage'
        }
    ]

    const formatValue = (value: number, format: string, prefix?: string, suffix?: string) => {
        let formattedValue = ''

        if (format === 'currency') {
            formattedValue = value.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })
        } else if (format === 'percentage') {
            formattedValue = value.toFixed(1)
        } else {
            formattedValue = value.toLocaleString('pt-BR')
        }

        return `${prefix || ''}${formattedValue}${suffix || ''}`
    }

    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 ${className}`}>
            {metricsData.map((metric, index) => (
                <Card key={index} className="relative overflow-hidden border-0 shadow-xl shadow-slate-200/60 hover:shadow-2xl hover:shadow-slate-300/60 transition-all duration-300 hover:-translate-y-1 group">
                    <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
                    <CardContent className="p-4 lg:p-6 relative">
                        <div className="flex items-center justify-between mb-3 lg:mb-4">
                            <div className={`p-2 lg:p-3 rounded-2xl bg-gradient-to-br ${metric.gradient} shadow-lg group-hover:scale-110 transition-transform`}>
                                <metric.icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        </div>

                        <div className="space-y-1 lg:space-y-2">
                            <p className="text-xs lg:text-sm font-medium text-slate-600">{metric.title}</p>
                            <p className="text-xl lg:text-3xl font-bold text-slate-900 leading-tight">
                                {formatValue(metric.value, metric.format, metric.prefix, metric.suffix)}
                            </p>
                            <div className="flex items-center gap-2">
                                {metric.trend.isPositive ? (
                                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                                ) : (
                                    <TrendingDown className="w-3 h-3 text-red-500" />
                                )}
                                <span className={`text-xs font-medium ${metric.trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {metric.trend.value}
                                </span>
                                <span className="text-xs text-slate-500">{metric.trend.label}</span>
                            </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100">
                            <p className="text-xs text-slate-500">{metric.description}</p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

// Componente adicional para métricas de status de pagamento
interface PaymentStatusMetricsProps {
    summary: FinancialSummary | null
    isLoading?: boolean
    className?: string
}

export const PaymentStatusMetrics: React.FC<PaymentStatusMetricsProps> = ({
                                                                              summary,
                                                                              isLoading = false,
                                                                              className = ""
                                                                          }) => {
    if (isLoading || !summary) {
        return (
            <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${className}`}>
                {[...Array(3)].map((_, index) => (
                    <Card key={index} className="border-0 shadow-xl shadow-slate-200/60">
                        <CardContent className="p-4">
                            <div className="animate-pulse">
                                <div className="h-8 bg-slate-200 rounded mb-2" />
                                <div className="h-6 bg-slate-200 rounded mb-1" />
                                <div className="h-4 bg-slate-200 rounded" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    const statusMetrics = [
        {
            title: 'Valores Recebidos',
            value: summary.totalPaid,
            description: 'Pagamentos confirmados',
            color: 'emerald',
            icon: CreditCard
        },
        {
            title: 'Valores Pendentes',
            value: summary.totalPending,
            description: 'Aguardando pagamento',
            color: 'orange',
            icon: Activity
        },
        {
            title: 'Descontos Aplicados',
            value: summary.totalDiscounts,
            description: 'Total de descontos concedidos',
            color: 'purple',
            icon: PiggyBank
        }
    ]

    return (
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${className}`}>
            {statusMetrics.map((metric, index) => (
                <Card key={index} className="border-0 shadow-lg shadow-slate-200/40 hover:shadow-xl hover:shadow-slate-300/60 transition-all duration-300">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl bg-${metric.color}-100`}>
                                <metric.icon className={`w-5 h-5 text-${metric.color}-600`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-600 truncate">{metric.title}</p>
                                <p className="text-lg font-bold text-slate-900">
                                    R$ {metric.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-slate-500">{metric.description}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}