'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Users,
    Crown,
    UserPlus,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Activity,
    DollarSign,
    Heart,
    Calendar,
    Target,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react'
import { cn } from '@/lib/utils/utils'

interface ClientStatsData {
    total: number
    active: number
    inactive: number
    blocked: number
    vip: number
    regular: number
    new: number
    at_risk: number
    lost: number
    totalSpent: number
    averageSpent: number
    totalVisits: number
    averageVisits: number
    birthdays: number
    newThisMonth: number
    churnRate: number
    ltv: number
}

interface ClientStatsProps {
    data: Partial<ClientStatsData>
    loading?: boolean
    period?: string
    className?: string
}

interface StatCardProps {
    title: string
    value: number | string
    icon: React.ElementType
    description?: string
    trend?: {
        value: number
        isPositive: boolean
        label: string
    }
    gradient: string
    format?: 'number' | 'currency' | 'percentage'
    className?: string
}

const StatCard: React.FC<StatCardProps> = ({
                                               title,
                                               value,
                                               icon: Icon,
                                               description,
                                               trend,
                                               gradient,
                                               format = 'number',
                                               className
                                           }) => {
    const formatValue = (val: number | string) => {
        if (typeof val === 'string') return val

        switch (format) {
            case 'currency':
                return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            case 'percentage':
                return `${val.toFixed(1)}%`
            default:
                return val.toLocaleString('pt-BR')
        }
    }

    return (
        <Card className={cn("relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1", className)}>
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />
            <CardContent className="p-4 lg:p-6 relative">
                <div className="flex items-center justify-between mb-3 lg:mb-4">
                    <div className={`p-2 lg:p-3 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}>
                        <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    {trend && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            trend.isPositive
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-700'
                        }`}>
                            {trend.isPositive ? (
                                <TrendingUp className="w-3 h-3" />
                            ) : (
                                <TrendingDown className="w-3 h-3" />
                            )}
                            {trend.value > 0 && '+'}
                            {trend.value}%
                        </div>
                    )}
                </div>

                <div className="space-y-1 lg:space-y-2">
                    <p className="text-xs lg:text-sm font-medium text-slate-600">{title}</p>
                    <p className="text-xl lg:text-3xl font-bold text-slate-900 leading-tight">
                        {formatValue(value)}
                    </p>
                    {description && (
                        <p className="text-xs text-slate-500">{description}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

const ClientStats: React.FC<ClientStatsProps> = ({
                                                     data,
                                                     loading = false,
                                                     period = 'total',
                                                     className
                                                 }) => {
    if (loading) {
        return (
            <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6", className)}>
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                        <div className="h-24 lg:h-32 bg-slate-200 rounded-xl"></div>
                    </div>
                ))}
            </div>
        )
    }

    const statsConfig = [
        {
            title: 'Total de Clientes',
            value: data.total || 0,
            icon: Users,
            description: 'Clientes cadastrados',
            gradient: 'from-blue-500 to-blue-600',
            trend: data.newThisMonth ? {
                value: data.newThisMonth,
                isPositive: true,
                label: 'novos este mês'
            } : undefined
        },
        {
            title: 'Clientes Ativos',
            value: data.active || 0,
            icon: CheckCircle,
            description: 'Com status ativo',
            gradient: 'from-emerald-500 to-emerald-600',
            trend: data.total ? {
                value: Math.round((data.active || 0) / data.total * 100),
                isPositive: true,
                label: 'do total'
            } : undefined
        },
        {
            title: 'Clientes VIP',
            value: data.vip || 0,
            icon: Crown,
            description: 'Alto valor',
            gradient: 'from-amber-500 to-orange-500',
            trend: data.total ? {
                value: Math.round((data.vip || 0) / data.total * 100),
                isPositive: true,
                label: 'do total'
            } : undefined
        },
        {
            title: 'Clientes em Risco',
            value: data.at_risk || 0,
            icon: AlertTriangle,
            description: 'Necessitam atenção',
            gradient: 'from-red-500 to-red-600',
            trend: data.churnRate ? {
                value: data.churnRate,
                isPositive: false,
                label: 'taxa de churn'
            } : undefined
        },
        {
            title: 'Faturamento Total',
            value: data.totalSpent || 0,
            icon: DollarSign,
            description: 'Valor total gasto',
            gradient: 'from-purple-500 to-purple-600',
            format: 'currency' as const
        },
        {
            title: 'Ticket Médio',
            value: data.averageSpent || 0,
            icon: TrendingUp,
            description: 'Gasto médio por cliente',
            gradient: 'from-indigo-500 to-indigo-600',
            format: 'currency' as const
        },
        {
            title: 'Total de Visitas',
            value: data.totalVisits || 0,
            icon: Activity,
            description: 'Atendimentos realizados',
            gradient: 'from-green-500 to-green-600'
        },
        {
            title: 'Aniversariantes',
            value: data.birthdays || 0,
            icon: Heart,
            description: 'Próximos 30 dias',
            gradient: 'from-pink-500 to-rose-500'
        }
    ]

    return (
        <div className={cn("space-y-6", className)}>
            {/* Cards Principais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {statsConfig.map((stat, index) => (
                    <StatCard
                        key={index}
                        title={stat.title}
                        value={stat.value}
                        icon={stat.icon}
                        description={stat.description}
                        trend={stat.trend}
                        gradient={stat.gradient}
                        format={stat.format}
                    />
                ))}
            </div>

            {/* Cards Detalhados */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Distribuição por Status */}
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-500" />
                            Status dos Clientes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                    <span className="text-sm font-medium">Ativos</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500">
                                        {data.total ? Math.round((data.active || 0) / data.total * 100) : 0}%
                                    </span>
                                    <span className="text-sm font-semibold">{data.active || 0}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-slate-400" />
                                    <span className="text-sm font-medium">Inativos</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500">
                                        {data.total ? Math.round((data.inactive || 0) / data.total * 100) : 0}%
                                    </span>
                                    <span className="text-sm font-semibold">{data.inactive || 0}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <span className="text-sm font-medium">Bloqueados</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500">
                                        {data.total ? Math.round((data.blocked || 0) / data.total * 100) : 0}%
                                    </span>
                                    <span className="text-sm font-semibold">{data.blocked || 0}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Distribuição por Segmento */}
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-purple-500" />
                            Segmentação
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Crown className="w-3 h-3 text-amber-500" />
                                    <span className="text-sm font-medium">VIP</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500">
                                        {data.total ? Math.round((data.vip || 0) / data.total * 100) : 0}%
                                    </span>
                                    <span className="text-sm font-semibold">{data.vip || 0}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="w-3 h-3 text-blue-500" />
                                    <span className="text-sm font-medium">Regular</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500">
                                        {data.total ? Math.round((data.regular || 0) / data.total * 100) : 0}%
                                    </span>
                                    <span className="text-sm font-semibold">{data.regular || 0}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <UserPlus className="w-3 h-3 text-green-500" />
                                    <span className="text-sm font-medium">Novos</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500">
                                        {data.total ? Math.round((data.new || 0) / data.total * 100) : 0}%
                                    </span>
                                    <span className="text-sm font-semibold">{data.new || 0}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-3 h-3 text-red-500" />
                                    <span className="text-sm font-medium">Em Risco</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500">
                                        {data.total ? Math.round((data.at_risk || 0) / data.total * 100) : 0}%
                                    </span>
                                    <span className="text-sm font-semibold">{data.at_risk || 0}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Métricas de Performance */}
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                            Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-3 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-blue-800">LTV Médio</span>
                                    <span className="text-lg font-bold text-blue-900">
                                        R$ {(data.ltv || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <p className="text-xs text-blue-600">Lifetime Value por cliente</p>
                            </div>

                            <div className="bg-green-50 p-3 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-green-800">Visitas por Cliente</span>
                                    <span className="text-lg font-bold text-green-900">
                                        {data.averageVisits?.toFixed(1) || 0}
                                    </span>
                                </div>
                                <p className="text-xs text-green-600">Frequência média de visitas</p>
                            </div>

                            {data.churnRate !== undefined && (
                                <div className="bg-orange-50 p-3 rounded-lg">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-orange-800">Taxa de Churn</span>
                                        <span className="text-lg font-bold text-orange-900">
                                            {data.churnRate.toFixed(1)}%
                                        </span>
                                    </div>
                                    <p className="text-xs text-orange-600">Clientes perdidos no período</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Resumo Executivo */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-blue-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        Resumo Executivo - {period}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600 mb-1">
                                {data.total || 0}
                            </div>
                            <div className="text-sm text-slate-600">Total de Clientes</div>
                        </div>

                        <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-600 mb-1">
                                {data.total ? Math.round((data.active || 0) / data.total * 100) : 0}%
                            </div>
                            <div className="text-sm text-slate-600">Taxa de Atividade</div>
                        </div>

                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600 mb-1">
                                R$ {(data.averageSpent || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                            </div>
                            <div className="text-sm text-slate-600">Ticket Médio</div>
                        </div>

                        <div className="text-center">
                            <div className="text-2xl font-bold text-amber-600 mb-1">
                                {data.vip || 0}
                            </div>
                            <div className="text-sm text-slate-600">Clientes VIP</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default ClientStats