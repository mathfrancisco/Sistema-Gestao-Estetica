'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444',
    '#EC4899', '#6366F1', '#84CC16', '#F97316', '#8B5A2B'
]

const ProcedureChart: React.FC<ProcedureChartProps> = ({
                                                           stats,
                                                           procedures = [],
                                                           type,
                                                           className = ''
                                                       }) => {
    // Componente de tooltip customizado
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                    <p className="font-medium text-slate-900">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {entry.dataKey === 'revenue' || entry.dataKey === 'price'
                            ? `R$ ${entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : entry.value.toLocaleString()
                        }
                        </p>
                    ))}
                </div>
            )
        }
        return null
    }

    // Chart de overview geral
    const renderOverviewChart = () => {
        if (!stats) return <div className="text-center py-8 text-slate-500">Carregando dados...</div>

        const data = [
            { name: 'Total', value: stats.total, color: COLORS[0] },
            { name: 'Ativos', value: stats.active, color: COLORS[1] },
            { name: 'Inativos', value: stats.inactive, color: COLORS[2] }
        ]

        return (
            <div className="space-y-6">
                {/* Métricas principais */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                        <p className="text-sm text-slate-500">Total</p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
                        <p className="text-sm text-slate-500">Ativos</p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-2">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-2xl font-bold text-slate-900">
                            R$ {stats.averagePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-slate-500">Preço Médio</p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Award className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-2xl font-bold text-slate-900">
                            {stats.mostPopular?.name.slice(0, 8)}...
                        </p>
                        <p className="text-sm text-slate-500">Mais Popular</p>
                    </div>
                </div>

                {/* Gráfico de barras */}
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        )
    }

    // Chart de receita por categoria
    const renderRevenueChart = () => {
        if (!stats?.revenueByCategory?.length) {
            return <div className="text-center py-8 text-slate-500">Nenhum dado de receita disponível</div>
        }

        return (
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={stats.revenueByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                    >
                        {stats.revenueByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
                    />
                </PieChart>
            </ResponsiveContainer>
        )
    }

    // Chart de performance (top 10 procedimentos)
    const renderPerformanceChart = () => {
        if (!procedures.length) {
            return <div className="text-center py-8 text-slate-500">Nenhum procedimento encontrado</div>
        }

        const topProcedures = procedures
            .sort((a, b) => b.price - a.price)
            .slice(0, 10)
            .map(proc => ({
                name: proc.name.length > 15 ? proc.name.slice(0, 15) + '...' : proc.name,
                price: proc.price,
                duration: proc.duration_minutes,
                margin: proc.cost ? ((proc.price - proc.cost) / proc.price) * 100 : 0
            }))

        return (
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProcedures} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="price" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                </BarChart>
            </ResponsiveContainer>
        )
    }

    // Chart de categorias
    const renderCategoriesChart = () => {
        if (!stats?.revenueByCategory?.length) {
            return <div className="text-center py-8 text-slate-500">Nenhuma categoria encontrada</div>
        }

        return (
            <div className="space-y-4">
                <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={stats.revenueByCategory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#8B5CF6"
                            fill="url(#colorRevenue)"
                        />
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                            </linearGradient>
                        </defs>
                    </AreaChart>
                </ResponsiveContainer>

                {/* Lista de categorias */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {stats.revenueByCategory.map((category, index) => (
                        <div key={category.category} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="text-sm font-medium text-slate-700">{category.category}</span>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-slate-900">
                                    R$ {category.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-slate-500">{category.count} procedimentos</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // Chart de margens
    const renderMarginsChart = () => {
        if (!procedures.length) {
            return <div className="text-center py-8 text-slate-500">Nenhum dado de margem disponível</div>
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
                <div className="text-center py-8 text-slate-500">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <DollarSign className="w-8 h-8 text-slate-400" />
                    </div>
                    <p>Adicione custos aos procedimentos para ver a análise de margem</p>
                </div>
            )
        }

        return (
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={proceduresWithMargin}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload
                                return (
                                    <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                                        <p className="font-medium text-slate-900">{label}</p>
                                        <p className="text-sm text-green-600">
                                            Margem: {data.margin.toFixed(1)}%
                                        </p>
                                        <p className="text-sm text-blue-600">
                                            Preço: R$ {data.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-sm text-red-600">
                                            Custo: R$ {data.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                )
                            }
                            return null
                        }}
                    />
                    <Bar dataKey="margin" fill="#10B981" radius={[4, 4, 0, 0]} />
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
                return 'Visão Geral dos Procedimentos'
            case 'revenue':
                return 'Receita por Categoria'
            case 'performance':
                return 'Top 10 Procedimentos por Preço'
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
        <Card className={`border-0 shadow-xl shadow-slate-200/60 ${className}`}>
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
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