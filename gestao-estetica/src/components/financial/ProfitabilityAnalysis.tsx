
// components/financial/ProfitabilityAnalysis.tsx
'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    BarChart3,
    PieChart,
    Target,
    Calculator,
    Eye,
    Download,
    RefreshCw,
    Award,
    AlertTriangle,
    CheckCircle,
    Zap,
    Activity
} from 'lucide-react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Area,
    AreaChart,
    PieChart as RechartsPieChart,
    Pie,
    Cell
} from 'recharts'

interface ProcedureProfitability {
    id: string
    name: string
    category: string
    price: number
    cost: number
    profit: number
    profitMargin: number
    volume: number
    totalRevenue: number
    totalProfit: number
    rank: number
}

interface ClientProfitability {
    id: string
    name: string
    totalSpent: number
    visits: number
    averageTicket: number
    ltv: number
    acquisitionCost: number
    profitability: number
    segment: 'vip' | 'regular' | 'new' | 'at_risk'
}

interface ProfitabilityAnalysisProps {
    procedures?: ProcedureProfitability[]
    clients?: ClientProfitability[]
    period?: string
    onRefresh?: () => void
    className?: string
}

export const ProfitabilityAnalysis: React.FC<ProfitabilityAnalysisProps> = ({
                                                                                procedures = [],
                                                                                clients = [],
                                                                                period = 'monthly',
                                                                                onRefresh,
                                                                                className = ""
                                                                            }) => {
    const [activeTab, setActiveTab] = useState('procedures')
    const [sortBy, setSortBy] = useState('profit')
    const [viewMode, setViewMode] = useState<'table' | 'chart'>('table')

    // Dados simulados se não fornecidos
    const defaultProcedures: ProcedureProfitability[] = [
        {
            id: '1',
            name: 'Limpeza de Pele Profunda',
            category: 'Facial',
            price: 120,
            cost: 25,
            profit: 95,
            profitMargin: 79.2,
            volume: 45,
            totalRevenue: 5400,
            totalProfit: 4275,
            rank: 1
        },
        {
            id: '2',
            name: 'Massagem Relaxante',
            category: 'Corporal',
            price: 150,
            cost: 30,
            profit: 120,
            profitMargin: 80.0,
            volume: 32,
            totalRevenue: 4800,
            totalProfit: 3840,
            rank: 2
        },
        {
            id: '3',
            name: 'Peeling Químico',
            category: 'Facial',
            price: 200,
            cost: 80,
            profit: 120,
            profitMargin: 60.0,
            volume: 20,
            totalRevenue: 4000,
            totalProfit: 2400,
            rank: 3
        },
        {
            id: '4',
            name: 'Drenagem Linfática',
            category: 'Corporal',
            price: 100,
            cost: 15,
            profit: 85,
            profitMargin: 85.0,
            volume: 28,
            totalRevenue: 2800,
            totalProfit: 2380,
            rank: 4
        },
        {
            id: '5',
            name: 'Tratamento Anti-idade',
            category: 'Facial',
            price: 300,
            cost: 120,
            profit: 180,
            profitMargin: 60.0,
            volume: 12,
            totalRevenue: 3600,
            totalProfit: 2160,
            rank: 5
        }
    ]

    const defaultClients: ClientProfitability[] = [
        {
            id: '1',
            name: 'Maria Silva',
            totalSpent: 2400,
            visits: 12,
            averageTicket: 200,
            ltv: 4800,
            acquisitionCost: 50,
            profitability: 4750,
            segment: 'vip'
        },
        {
            id: '2',
            name: 'Ana Costa',
            totalSpent: 1800,
            visits: 15,
            averageTicket: 120,
            ltv: 3600,
            acquisitionCost: 40,
            profitability: 3560,
            segment: 'regular'
        },
        {
            id: '3',
            name: 'Julia Santos',
            totalSpent: 1200,
            visits: 8,
            averageTicket: 150,
            ltv: 2400,
            acquisitionCost: 45,
            profitability: 2355,
            segment: 'regular'
        },
        {
            id: '4',
            name: 'Carla Oliveira',
            totalSpent: 600,
            visits: 4,
            averageTicket: 150,
            ltv: 1200,
            acquisitionCost: 35,
            profitability: 1165,
            segment: 'new'
        },
        {
            id: '5',
            name: 'Patricia Lima',
            totalSpent: 300,
            visits: 2,
            averageTicket: 150,
            ltv: 600,
            acquisitionCost: 50,
            profitability: 550,
            segment: 'at_risk'
        }
    ]

    const displayProcedures = procedures.length > 0 ? procedures : defaultProcedures
    const displayClients = clients.length > 0 ? clients : defaultClients

    // Calcular métricas gerais
    const calculateOverallMetrics = () => {
        const totalRevenue = displayProcedures.reduce((sum, proc) => sum + proc.totalRevenue, 0)
        const totalProfit = displayProcedures.reduce((sum, proc) => sum + proc.totalProfit, 0)
        const totalCost = totalRevenue - totalProfit
        const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

        const bestPerformer = displayProcedures.sort((a, b) => b.totalProfit - a.totalProfit)[0]
        const worstPerformer = displayProcedures.sort((a, b) => a.profitMargin - b.profitMargin)[0]

        return {
            totalRevenue,
            totalProfit,
            totalCost,
            overallMargin,
            bestPerformer,
            worstPerformer,
            procedureCount: displayProcedures.length
        }
    }

    const metrics = calculateOverallMetrics()

    // Obter cor do segmento
    const getSegmentColor = (segment: string) => {
        const colors = {
            vip: 'emerald',
            regular: 'blue',
            new: 'purple',
            at_risk: 'red'
        }
        return colors[segment as keyof typeof colors] || 'gray'
    }

    // Obter label do segmento
    const getSegmentLabel = (segment: string) => {
        const labels = {
            vip: 'VIP',
            regular: 'Regular',
            new: 'Novo',
            at_risk: 'Em Risco'
        }
        return labels[segment as keyof typeof labels] || segment
    }

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        })
    }

    // Dados para gráficos
    const chartData = displayProcedures.map(proc => ({
        name: proc.name.substring(0, 15) + '...',
        revenue: proc.totalRevenue,
        profit: proc.totalProfit,
        margin: proc.profitMargin,
        volume: proc.volume
    }))

    const categoryData = displayProcedures.reduce((acc, proc) => {
        const existing = acc.find(item => item.category === proc.category)
        if (existing) {
            existing.profit += proc.totalProfit
            existing.revenue += proc.totalRevenue
        } else {
            acc.push({
                category: proc.category,
                profit: proc.totalProfit,
                revenue: proc.totalRevenue
            })
        }
        return acc
    }, [] as { category: string; profit: number; revenue: number }[])

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

    // Tooltip customizado
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                    <p className="font-medium text-slate-900 mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {entry.name.includes('margin') ? `${entry.value.toFixed(1)}%` : formatCurrency(entry.value)}
                        </p>
                    ))}
                </div>
            )
        }
        return null
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Métricas de Resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-0 shadow-lg shadow-slate-200/40">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-100">
                                <DollarSign className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-600">Lucro Total</p>
                                <p className="text-xl font-bold text-slate-900">{formatCurrency(metrics.totalProfit)}</p>
                                <p className="text-xs text-slate-500">{metrics.overallMargin.toFixed(1)}% margem</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg shadow-slate-200/40">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-100">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-600">Receita Total</p>
                                <p className="text-xl font-bold text-slate-900">{formatCurrency(metrics.totalRevenue)}</p>
                                <p className="text-xs text-slate-500">{metrics.procedureCount} procedimentos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg shadow-slate-200/40">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-purple-100">
                                <Award className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-600">Melhor Procedimento</p>
                                <p className="text-sm font-bold text-slate-900">{metrics.bestPerformer?.name.substring(0, 20)}...</p>
                                <p className="text-xs text-slate-500">{formatCurrency(metrics.bestPerformer?.totalProfit || 0)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg shadow-slate-200/40">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-orange-100">
                                <AlertTriangle className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-600">Menor Margem</p>
                                <p className="text-sm font-bold text-slate-900">{metrics.worstPerformer?.name.substring(0, 20)}...</p>
                                <p className="text-xs text-slate-500">{metrics.worstPerformer?.profitMargin.toFixed(1)}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Controles */}
            <Card className="border-0 shadow-xl shadow-slate-200/60">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-blue-500" />
                            Análise de Lucratividade
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="profit">Lucro Total</SelectItem>
                                    <SelectItem value="margin">Margem %</SelectItem>
                                    <SelectItem value="revenue">Receita</SelectItem>
                                    <SelectItem value="volume">Volume</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setViewMode(viewMode === 'table' ? 'chart' : 'table')}
                            >
                                {viewMode === 'table' ? <BarChart3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            {onRefresh && (
                                <Button variant="outline" size="sm" onClick={onRefresh}>
                                    <RefreshCw className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Tabs de Conteúdo */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-white border border-slate-200 shadow-sm p-1">
                    <TabsTrigger value="procedures" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                        <Calculator className="w-4 h-4 mr-2" />
                        Procedimentos
                    </TabsTrigger>
                    <TabsTrigger value="clients" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                        <Target className="w-4 h-4 mr-2" />
                        Clientes
                    </TabsTrigger>
                    <TabsTrigger value="categories" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                        <PieChart className="w-4 h-4 mr-2" />
                        Categorias
                    </TabsTrigger>
                </TabsList>

                {/* Tab: Procedimentos */}
                <TabsContent value="procedures" className="space-y-6">
                    {viewMode === 'table' ? (
                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50">
                                            <TableHead>Procedimento</TableHead>
                                            <TableHead>Categoria</TableHead>
                                            <TableHead>Preço</TableHead>
                                            <TableHead>Custo</TableHead>
                                            <TableHead>Margem</TableHead>
                                            <TableHead>Volume</TableHead>
                                            <TableHead>Lucro Total</TableHead>
                                            <TableHead>Rank</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {displayProcedures
                                            .sort((a, b) => {
                                                switch (sortBy) {
                                                    case 'margin': return b.profitMargin - a.profitMargin
                                                    case 'revenue': return b.totalRevenue - a.totalRevenue
                                                    case 'volume': return b.volume - a.volume
                                                    default: return b.totalProfit - a.totalProfit
                                                }
                                            })
                                            .map((procedure) => (
                                                <TableRow key={procedure.id} className="hover:bg-slate-50/50">
                                                    <TableCell className="py-4">
                                                        <div>
                                                            <p className="font-medium text-slate-900">{procedure.name}</p>
                                                            <p className="text-sm text-slate-500">ID: {procedure.id}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{procedure.category}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-semibold text-slate-900">
                                                            {formatCurrency(procedure.price)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-slate-600">
                                                            {formatCurrency(procedure.cost)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-semibold ${procedure.profitMargin >= 70 ? 'text-emerald-600' : procedure.profitMargin >= 50 ? 'text-blue-600' : 'text-orange-600'}`}>
                                                                {procedure.profitMargin.toFixed(1)}%
                                                            </span>
                                                            {procedure.profitMargin >= 70 ? (
                                                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                            ) : procedure.profitMargin < 50 ? (
                                                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                                                            ) : null}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">{procedure.volume}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-bold text-emerald-600">
                                                            {formatCurrency(procedure.totalProfit)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={`${procedure.rank <= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-700'}`}>
                                                            #{procedure.rank}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                            <CardContent className="p-6">
                                <div className="h-96">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis
                                                dataKey="name"
                                                stroke="#64748b"
                                                fontSize={12}
                                                angle={-45}
                                                textAnchor="end"
                                                height={100}
                                            />
                                            <YAxis
                                                stroke="#64748b"
                                                fontSize={12}
                                                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="profit" fill="#10b981" name="Lucro" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="revenue" fill="#3b82f6" name="Receita" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Tab: Clientes */}
                <TabsContent value="clients" className="space-y-6">
                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50">
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Segmento</TableHead>
                                        <TableHead>Total Gasto</TableHead>
                                        <TableHead>Visitas</TableHead>
                                        <TableHead>Ticket Médio</TableHead>
                                        <TableHead>LTV</TableHead>
                                        <TableHead>Lucratividade</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {displayClients
                                        .sort((a, b) => b.profitability - a.profitability)
                                        .map((client) => (
                                            <TableRow key={client.id} className="hover:bg-slate-50/50">
                                                <TableCell className="py-4">
                                                    <div>
                                                        <p className="font-medium text-slate-900">{client.name}</p>
                                                        <p className="text-sm text-slate-500">ID: {client.id}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`bg-${getSegmentColor(client.segment)}-100 text-${getSegmentColor(client.segment)}-700 border-${getSegmentColor(client.segment)}-200`}>
                                                        {getSegmentLabel(client.segment)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-semibold text-slate-900">
                                                        {formatCurrency(client.totalSpent)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">{client.visits}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-slate-700">
                                                        {formatCurrency(client.averageTicket)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-semibold text-blue-600">
                                                        {formatCurrency(client.ltv)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-bold text-emerald-600">
                                                        {formatCurrency(client.profitability)}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Categorias */}
                <TabsContent value="categories" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                <CardTitle>Lucro por Categoria</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPieChart>
                                            <Pie
                                                data={categoryData}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="profit"
                                                label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {categoryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: any) => [formatCurrency(value), 'Lucro']}
                                            />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                <CardTitle>Performance por Categoria</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {categoryData.map((category, index) => {
                                        const margin = category.revenue > 0 ? (category.profit / category.revenue) * 100 : 0
                                        return (
                                            <div key={category.category} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-4 h-4 rounded-full"
                                                        style={{ backgroundColor: colors[index % colors.length] }}
                                                    />
                                                    <div>
                                                        <p className="font-medium text-slate-900">{category.category}</p>
                                                        <p className="text-sm text-slate-500">
                                                            Margem: {margin.toFixed(1)}%
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-slate-900">
                                                        {formatCurrency(category.profit)}
                                                    </p>
                                                    <p className="text-sm text-slate-500">
                                                        {formatCurrency(category.revenue)} receita
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default ProfitabilityAnalysis