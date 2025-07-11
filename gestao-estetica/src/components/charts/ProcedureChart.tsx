'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Area,
    AreaChart
} from 'recharts'
import {
    TrendingUp,
    DollarSign,
    Activity,
    Users,
    Award,
    Zap
} from 'lucide-react'
import type { ProcedureStats, ProcedureWithCategory } from '@/types/procedure.types'

interface ProcedureChartProps {
    stats?: ProcedureStats
    procedures?: ProcedureWithCategory[]
    type: 'overview' | 'revenue' | 'performance' | 'categories' | 'margins'
    className?: string
}

const COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
]

const ProcedureChart: React.FC<ProcedureChartProps> = ({
                                                           stats,
                                                           procedures = [],
                                                           type,
                                                           className = ''
                                                       }) => {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value)
    }

    // Componente de tooltip simplificado
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                    <p className="font-medium text-slate-900 mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {
                            entry.dataKey === 'revenue' || entry.dataKey === 'price'
                                ? formatCurrency(entry.value)
                                : entry.value.toLocaleString()
                        }
                        </p>
                    ))}
                </div>
            )
        }
        return null
    }

    // Loading Component simplificado
    const LoadingState = () => (
        <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-blue-500 mx-auto mb-3"></div>
                <p className="text-sm text-slate-500">Carregando dados...</p>
            </div>
        </div>
    )

    // Empty State simplificado
    const EmptyState = ({ message }: { message: string }) => (
        <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
                <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">{message}</p>
            </div>
        </div>
    )

    // Chart de overview simplificado
    const renderOverviewChart = () => {
        if (!stats) return <LoadingState />

        const data = [
            { name: 'Total', value: stats.total },
            { name: 'Ativos', value: stats.active },
            { name: 'Inativos', value: stats.inactive }
        ]

        return (
            <div className="space-y-6">
                {/* Métricas principais simplificadas */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <Activity className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                        <p className="text-sm text-slate-600">Total</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <Zap className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
                        <p className="text-sm text-slate-600">Ativos</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <DollarSign className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                        <p className="text-lg font-bold text-slate-900">
                            {formatCurrency(stats.averagePrice)}
                        </p>
                        <p className="text-sm text-slate-600">Preço Médio</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <Award className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-900 truncate">
                            {stats.mostPopular?.name || 'N/A'}
                        </p>
                        <p className="text-sm text-slate-600">Mais Popular</p>
                    </div>
                </div>

                {/* Gráfico simplificado */}
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        )
    }

    // Chart de receita simplificado
    const renderRevenueChart = () => {
        if (!stats?.revenueByCategory?.length) {
            return <EmptyState message="Nenhum dado de receita disponível" />
        }

        return (
            <div className="space-y-4">
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={stats.revenueByCategory}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                            outerRadius={90}
                            fill="#8884d8"
                            dataKey="revenue"
                        >
                            {stats.revenueByCategory.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number) => [formatCurrency(value), 'Receita']}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Lista resumida */}
                <div className="space-y-2">
                    {stats.revenueByCategory.slice(0, 5).map((category, index) => (
                        <div key={category.category} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="text-sm font-medium">{category.category}</span>
                            </div>
                            <span className="text-sm font-semibold">
                                {formatCurrency(category.revenue)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // Chart de performance simplificado
    const renderPerformanceChart = () => {
        if (!procedures.length) {
            return <EmptyState message="Nenhum procedimento encontrado" />
        }

        const topProcedures = procedures
            .sort((a, b) => b.price - a.price)
            .slice(0, 8)
            .map(proc => ({
                name: proc.name.length > 20 ? proc.name.slice(0, 20) + '...' : proc.name,
                price: proc.price
            }))

        return (
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProcedures} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" fontSize={12} />
                    <YAxis dataKey="name" type="category" width={120} fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="price" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
            </ResponsiveContainer>
        )
    }

    // Chart de categorias simplificado
    const renderCategoriesChart = () => {
        if (!stats?.revenueByCategory?.length) {
            return <EmptyState message="Nenhuma categoria encontrada" />
        }

        return (
            <div className="space-y-4">
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={stats.revenueByCategory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="category" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#8b5cf6"
                            fill="#8b5cf6"
                            fillOpacity={0.2}
                        />
                    </AreaChart>
                </ResponsiveContainer>

                {/* Lista compacta */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {stats.revenueByCategory.map((category, index) => (
                        <div key={category.category} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="text-sm font-medium">{category.category}</span>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold">
                                    {formatCurrency(category.revenue)}
                                </p>
                                <p className="text-xs text-slate-500">{category.count} proc.</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // Chart de margens simplificado
    const renderMarginsChart = () => {
        if (!procedures.length) {
            return <EmptyState message="Nenhum dado de margem disponível" />
        }

        const proceduresWithMargin = procedures
            .filter(proc => proc.cost && proc.cost > 0)
            .map(proc => ({
                name: proc.name.length > 15 ? proc.name.slice(0, 15) + '...' : proc.name,
                margin: ((proc.price - (proc.cost || 0)) / proc.price) * 100,
                price: proc.price,
                cost: proc.cost || 0
            }))
            .sort((a, b) => b.margin - a.margin)
            .slice(0, 8)

        if (!proceduresWithMargin.length) {
            return (
                <div className="text-center py-8">
                    <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-2">Nenhum dado de margem disponível</p>
                    <p className="text-sm text-slate-400">Adicione custos aos procedimentos para ver a análise</p>
                </div>
            )
        }

        return (
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={proceduresWithMargin}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={12} />
                    <Tooltip
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload
                                return (
                                    <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                                        <p className="font-medium mb-2">{label}</p>
                                        <div className="space-y-1 text-sm">
                                            <p className="text-green-600">Margem: {data.margin.toFixed(1)}%</p>
                                            <p className="text-blue-600">Preço: {formatCurrency(data.price)}</p>
                                            <p className="text-red-600">Custo: {formatCurrency(data.cost)}</p>
                                        </div>
                                    </div>
                                )
                            }
                            return null
                        }}
                    />
                    <Bar dataKey="margin" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        )
    }

    const renderChart = () => {
        switch (type) {
            case 'overview':
                return renderOverviewChart()
            case 'revenue':
                return renderRevenueChart()
            case 'performance':
                return renderPerformanceChart()
            case 'categories':
                return renderCategoriesChart()
            case 'margins':
                return renderMarginsChart()
            default:
                return renderOverviewChart()
        }
    }

    const getChartTitle = () => {
        switch (type) {
            case 'overview':
                return 'Visão Geral'
            case 'revenue':
                return 'Receita por Categoria'
            case 'performance':
                return 'Top Procedimentos'
            case 'categories':
                return 'Análise por Categorias'
            case 'margins':
                return 'Margens de Lucro'
            default:
                return 'Análise de Procedimentos'
        }
    }

    const getChartIcon = () => {
        switch (type) {
            case 'overview':
                return <Activity className="w-5 h-5 text-blue-500" />
            case 'revenue':
                return <DollarSign className="w-5 h-5 text-green-500" />
            case 'performance':
                return <TrendingUp className="w-5 h-5 text-purple-500" />
            case 'categories':
                return <Users className="w-5 h-5 text-orange-500" />
            case 'margins':
                return <Award className="w-5 h-5 text-emerald-500" />
            default:
                return <Activity className="w-5 h-5 text-blue-500" />
        }
    }

    return (
        <Card className={`${className}`}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {getChartIcon()}
                    {getChartTitle()}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                {renderChart()}
            </CardContent>
        </Card>
    )
}

export default ProcedureChart