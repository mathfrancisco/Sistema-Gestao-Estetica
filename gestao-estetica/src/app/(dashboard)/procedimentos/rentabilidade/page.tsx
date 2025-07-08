'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    BarChart3,
    PieChart,
    Calculator,
    ArrowLeft,
    Activity,
    Target,
    Award,
    AlertTriangle,
    RefreshCw,
    Download,
    Filter,
    ChevronRight,
    Scissors,
    Users,
    Clock
} from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    Area,
    AreaChart
} from 'recharts'
import Link from 'next/link'
import { Sidebar } from '@/components/layout/sidebar'
import {
    useProcedures,
    useProcedureStats,
    useActiveProcedureCategories
} from '@/lib/hooks/useProcedures'

const COLORS = [
    '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444',
    '#EC4899', '#6366F1', '#84CC16', '#F97316', '#8B5A2B'
]

const RentabilidadePage: React.FC = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('30') // últimos 30 dias
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [sortBy, setSortBy] = useState<'margin' | 'revenue' | 'frequency'>('margin')

    // Hooks para dados
    const {
        data: proceduresData,
        isLoading: proceduresLoading
    } = useProcedures({
        page: 1,
        limit: 100, // Buscar todos para análise
        filters: { is_active: true }
    })

    const {
        data: stats,
        isLoading: statsLoading
    } = useProcedureStats()

    const {
        data: categories = [],
        isLoading: categoriesLoading
    } = useActiveProcedureCategories()

    const procedures = proceduresData?.data || []
    const isLoading = proceduresLoading || statsLoading || categoriesLoading

    // Análise de rentabilidade
    const analysisData = useMemo(() => {
        if (!procedures.length) return []

        return procedures
            .filter(proc => proc.cost && proc.cost > 0) // Apenas procedimentos com custo definido
            .map(proc => {
                const margin = ((proc.price - (proc.cost || 0)) / proc.price) * 100
                const profit = proc.price - (proc.cost || 0)

                // Mock data para frequência - substitua pela API real
                const frequency = Math.floor(Math.random() * 20) + 1
                const totalRevenue = proc.price * frequency
                const totalProfit = profit * frequency

                return {
                    id: proc.id,
                    name: proc.name,
                    category: proc.procedure_categories?.name || 'Sem categoria',
                    categoryColor: proc.procedure_categories?.color || '#6B7280',
                    price: proc.price,
                    cost: proc.cost || 0,
                    profit,
                    margin,
                    frequency,
                    totalRevenue,
                    totalProfit,
                    duration: proc.duration_minutes,
                    profitPerMinute: profit / proc.duration_minutes,
                    roi: (profit / (proc.cost || 1)) * 100
                }
            })
            .sort((a, b) => {
                switch (sortBy) {
                    case 'margin':
                        return b.margin - a.margin
                    case 'revenue':
                        return b.totalRevenue - a.totalRevenue
                    case 'frequency':
                        return b.frequency - a.frequency
                    default:
                        return b.margin - a.margin
                }
            })
    }, [procedures, sortBy])

    // Filtrar por categoria
    const filteredAnalysis = useMemo(() => {
        if (selectedCategory === 'all') return analysisData
        return analysisData.filter(item => item.category === selectedCategory)
    }, [analysisData, selectedCategory])

    // Dados para gráficos
    const chartData = useMemo(() => {
        const topProcedures = filteredAnalysis.slice(0, 10)

        return {
            marginChart: topProcedures.map(item => ({
                name: item.name.length > 15 ? item.name.slice(0, 15) + '...' : item.name,
                margin: item.margin,
                profit: item.profit,
                color: item.categoryColor
            })),

            categoryChart: categories.map(category => {
                const categoryProcedures = analysisData.filter(item => item.category === category.name)
                const totalRevenue = categoryProcedures.reduce((sum, item) => sum + item.totalRevenue, 0)
                const totalProfit = categoryProcedures.reduce((sum, item) => sum + item.totalProfit, 0)
                const avgMargin = categoryProcedures.length > 0
                    ? categoryProcedures.reduce((sum, item) => sum + item.margin, 0) / categoryProcedures.length
                    : 0

                return {
                    name: category.name,
                    revenue: totalRevenue,
                    profit: totalProfit,
                    margin: avgMargin,
                    count: categoryProcedures.length,
                    color: category.color || COLORS[0]
                }
            }).filter(item => item.count > 0),

            profitabilityChart: topProcedures.map(item => ({
                name: item.name.length > 12 ? item.name.slice(0, 12) + '...' : item.name,
                profitPerMinute: item.profitPerMinute,
                roi: item.roi,
                margin: item.margin
            }))
        }
    }, [filteredAnalysis, categories, analysisData])

    // Métricas principais
    const metricsData = useMemo(() => {
        if (!filteredAnalysis.length) return []

        const totalRevenue = filteredAnalysis.reduce((sum, item) => sum + item.totalRevenue, 0)
        const totalProfit = filteredAnalysis.reduce((sum, item) => sum + item.totalProfit, 0)
        const avgMargin = filteredAnalysis.reduce((sum, item) => sum + item.margin, 0) / filteredAnalysis.length
        const bestProcedure = filteredAnalysis[0]

        return [
            {
                title: 'Receita Total',
                value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                icon: DollarSign,
                description: 'Receita gerada',
                gradient: 'from-green-500 to-green-600',
                trend: { value: totalRevenue, label: 'total', isPositive: true }
            },
            {
                title: 'Lucro Total',
                value: `R$ ${totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                icon: TrendingUp,
                description: 'Lucro líquido',
                gradient: 'from-emerald-500 to-emerald-600',
                trend: { value: totalProfit, label: 'lucro', isPositive: true }
            },
            {
                title: 'Margem Média',
                value: `${avgMargin.toFixed(1)}%`,
                icon: Target,
                description: 'Margem de lucro média',
                gradient: 'from-blue-500 to-blue-600',
                trend: { value: avgMargin, label: 'margem', isPositive: avgMargin > 30 }
            },
            {
                title: 'Melhor Procedimento',
                value: bestProcedure?.name.slice(0, 12) + '...' || 'N/A',
                icon: Award,
                description: `${bestProcedure?.margin.toFixed(1)}% de margem`,
                gradient: 'from-purple-500 to-purple-600',
                trend: { value: bestProcedure?.margin || 0, label: 'top', isPositive: true }
            }
        ]
    }, [filteredAnalysis])

    const getMarginColor = (margin: number) => {
        if (margin >= 60) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
        if (margin >= 40) return 'text-blue-600 bg-blue-50 border-blue-200'
        if (margin >= 25) return 'text-orange-600 bg-orange-50 border-orange-200'
        return 'text-red-600 bg-red-50 border-red-200'
    }

    const getMarginLabel = (margin: number) => {
        if (margin >= 60) return 'Excelente'
        if (margin >= 40) return 'Boa'
        if (margin >= 25) return 'Regular'
        return 'Baixa'
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                    <p className="font-medium text-slate-900">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {
                            entry.dataKey.includes('margin') || entry.dataKey.includes('roi')
                                ? `${entry.value.toFixed(1)}%`
                                : entry.dataKey.includes('revenue') || entry.dataKey.includes('profit')
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

    if (isLoading && analysisData.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <Sidebar />
                <div className="lg:ml-64">
                    <div className="flex items-center justify-center h-64">
                        <RefreshCw className="w-8 h-8 animate-spin text-green-500" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            {/* Sidebar */}
            <Sidebar />

            {/* Conteúdo Principal */}
            <div className="lg:ml-64">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
                    <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <Link
                                        href="/procedimentos"
                                        className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4 text-slate-600" />
                                    </Link>
                                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                        <TrendingUp className="w-4 h-4 text-white" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                        Análise de Rentabilidade
                                    </h1>
                                </div>
                                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                    Analise a rentabilidade dos seus procedimentos
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg shadow-emerald-500/25 text-xs">
                                    <Activity className="w-3 h-3 mr-1" />
                                    Online
                                </Badge>
                                <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50 shadow-sm">
                                    <Download className="w-4 h-4 mr-2" />
                                    Exportar
                                </Button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Conteúdo */}
                <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

                        {/* Filtros */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Filter className="w-5 h-5 text-green-500" />
                                    Filtros de Análise
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 lg:p-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Período</label>
                                        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="7">Últimos 7 dias</SelectItem>
                                                <SelectItem value="30">Últimos 30 dias</SelectItem>
                                                <SelectItem value="90">Últimos 90 dias</SelectItem>
                                                <SelectItem value="365">Último ano</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Categoria</label>
                                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todas as categorias</SelectItem>
                                                {categories.map(category => (
                                                    <SelectItem key={category.id} value={category.name}>
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Ordenar por</label>
                                        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="margin">Margem de Lucro</SelectItem>
                                                <SelectItem value="revenue">Receita Total</SelectItem>
                                                <SelectItem value="frequency">Frequência</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-end">
                                        <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Atualizar
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Métricas Principais */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                            {metricsData.map((metric, index) => (
                                <Card key={index} className="relative overflow-hidden border-0 shadow-xl shadow-slate-200/60 hover:shadow-2xl hover:shadow-slate-300/60 transition-all duration-300 hover:-translate-y-1">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-5`} />
                                    <CardContent className="p-4 lg:p-6 relative">
                                        <div className="flex items-center justify-between mb-3 lg:mb-4">
                                            <div className={`p-2 lg:p-3 rounded-2xl bg-gradient-to-br ${metric.gradient} shadow-lg`}>
                                                <metric.icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-400" />
                                        </div>

                                        <div className="space-y-1 lg:space-y-2">
                                            <p className="text-xs lg:text-sm font-medium text-slate-600">{metric.title}</p>
                                            <p className="text-xl lg:text-3xl font-bold text-slate-900 leading-tight">
                                                {metric.value}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                {metric.trend.isPositive ?
                                                    <TrendingUp className="w-3 h-3 text-emerald-500" /> :
                                                    <TrendingDown className="w-3 h-3 text-red-500" />
                                                }
                                                <span className={`text-xs font-medium ${metric.trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {metric.description}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Gráficos de Análise */}
                        <Tabs defaultValue="margins" className="space-y-6">
                            <TabsList className="grid w-full grid-cols-3 bg-slate-100">
                                <TabsTrigger value="margins" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    Margens de Lucro
                                </TabsTrigger>
                                <TabsTrigger value="categories" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    Por Categoria
                                </TabsTrigger>
                                <TabsTrigger value="profitability" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    Rentabilidade
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="margins" className="space-y-6">
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2">
                                            <BarChart3 className="w-5 h-5 text-green-500" />
                                            Top 10 Procedimentos por Margem
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <ResponsiveContainer width="100%" height={400}>
                                            <BarChart data={chartData.marginChart}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                                <YAxis tick={{ fontSize: 12 }} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="margin" fill="#10B981" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="categories" className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                            <CardTitle className="flex items-center gap-2">
                                                <PieChart className="w-5 h-5 text-blue-500" />
                                                Receita por Categoria
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <ResponsiveContainer width="100%" height={300}>
                                                <RechartsPieChart>
                                                    <Pie
                                                        data={chartData.categoryChart}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                        outerRadius={80}
                                                        fill="#8884d8"
                                                        dataKey="revenue"
                                                    >
                                                        {chartData.categoryChart.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip content={<CustomTooltip />} />
                                                </RechartsPieChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                            <CardTitle className="flex items-center gap-2">
                                                <Target className="w-5 h-5 text-purple-500" />
                                                Margem Média por Categoria
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                {chartData.categoryChart.map((category, index) => (
                                                    <div key={category.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="w-4 h-4 rounded-full"
                                                                style={{ backgroundColor: category.color }}
                                                            />
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-700">{category.name}</p>
                                                                <p className="text-xs text-slate-500">{category.count} procedimentos</p>
                                                            </div>
                                                        </div>
                                                        <Badge className={getMarginColor(category.margin)}>
                                                            {category.margin.toFixed(1)}%
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="profitability" className="space-y-6">
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2">
                                            <Calculator className="w-5 h-5 text-orange-500" />
                                            Lucro por Minuto vs ROI
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <ResponsiveContainer width="100%" height={400}>
                                            <AreaChart data={chartData.profitabilityChart}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                                <YAxis tick={{ fontSize: 12 }} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Area
                                                    type="monotone"
                                                    dataKey="profitPerMinute"
                                                    stroke="#F59E0B"
                                                    fill="url(#colorProfit)"
                                                    name="Lucro/min"
                                                />
                                                <defs>
                                                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                                                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1}/>
                                                    </linearGradient>
                                                </defs>
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                        {/* Tabela Detalhada */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                    <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                                        <Scissors className="w-5 h-5 text-green-500" />
                                        Análise Detalhada ({filteredAnalysis.length} procedimentos)
                                    </CardTitle>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                        <Activity className="w-3 h-3 mr-1" />
                                        {filteredAnalysis.length} analisados
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {filteredAnalysis.length === 0 ? (
                                    <div className="text-center py-12 px-6">
                                        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <AlertTriangle className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                            Nenhum dado de rentabilidade
                                        </h3>
                                        <p className="text-slate-500 mb-6 max-w-md mx-auto">
                                            Para realizar a análise de rentabilidade, é necessário definir os custos dos procedimentos.
                                        </p>
                                        <Link href="/procedimentos">
                                            <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                                                Definir Custos
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-slate-50/50 hover:bg-slate-50">
                                                    <TableHead className="font-semibold text-slate-700">Procedimento</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Categoria</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Preço</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Custo</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Lucro</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Margem</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Frequência</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Receita Total</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">ROI</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredAnalysis.slice(0, 20).map((item) => (
                                                    <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <TableCell className="py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className="w-3 h-3 rounded-full"
                                                                    style={{ backgroundColor: item.categoryColor }}
                                                                />
                                                                <div>
                                                                    <p className="font-medium text-slate-900">{item.name}</p>
                                                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                                                        <Clock className="w-3 h-3" />
                                                                        {item.duration} min
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <span className="text-sm text-slate-600">{item.category}</span>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <span className="font-medium text-slate-900">
                                                                R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <span className="text-sm text-slate-600">
                                                                R$ {item.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <span className="font-medium text-green-600">
                                                                R$ {item.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <Badge className={getMarginColor(item.margin)}>
                                                                {item.margin.toFixed(1)}%
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <div className="flex items-center gap-1 text-sm text-slate-600">
                                                                <Users className="w-3 h-3" />
                                                                {item.frequency}x
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <span className="font-medium text-slate-900">
                                                                R$ {item.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <Badge variant="outline" className="border-blue-200 text-blue-700">
                                                                {item.roi.toFixed(0)}%
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default RentabilidadePage