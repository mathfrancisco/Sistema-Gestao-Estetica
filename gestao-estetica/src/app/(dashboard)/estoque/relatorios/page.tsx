// app/estoque/relatorios/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
    BarChart3,
    PieChart,
    TrendingUp,
    TrendingDown,
    Package,
    DollarSign,
    Calendar,
    Download,
    RefreshCw,
    AlertTriangle,
    Activity,
    Archive,
    ChevronRight,
    Filter,
    Eye,
    FileText,
    Target,
    Percent,
    ArrowUp,
    ArrowDown,
    RotateCcw,
    Minus,
    Info
} from 'lucide-react'
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
import {  BarChart, Bar, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, Pie } from 'recharts'
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfYear } from 'date-fns'
import Link from 'next/link'
import { toast } from 'sonner'
import { Sidebar } from '@/components/layout/sidebar'
import { useStock } from '@/lib/hooks/useStock'
import type { Database } from '@/lib/database/supabase/types'

type StockMovementType = Database['public']['Enums']['stock_movement_enum']

const RelatoriosEstoquePage: React.FC = () => {
    const [selectedPeriod, setSelectedPeriod] = useState<string>('month')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [customDateFrom, setCustomDateFrom] = useState('')
    const [customDateTo, setCustomDateTo] = useState('')
    const [reportType, setReportType] = useState<'overview' | 'valuation' | 'movements' | 'abc'>('overview')

    // Hook de estoque
    const {
        products,
        stockMovements,
        stockSummary,
        stockValuation,
        stockMovementSummary,
        categories,
        productsLoading,
        stockMovementsLoading,
        summaryLoading,
        fetchStockMovementSummary,
        refreshAll
    } = useStock()

    // Carregar dados do período selecionado
    useEffect(() => {
        let dateFrom: string | undefined
        let dateTo: string | undefined

        const now = new Date()
        switch (selectedPeriod) {
            case 'week':
                dateFrom = format(subDays(now, 7), 'yyyy-MM-dd')
                break
            case 'month':
                dateFrom = format(startOfMonth(now), 'yyyy-MM-dd')
                dateTo = format(endOfMonth(now), 'yyyy-MM-dd')
                break
            case 'quarter':
                dateFrom = format(subMonths(now, 3), 'yyyy-MM-dd')
                break
            case 'year':
                dateFrom = format(startOfYear(now), 'yyyy-MM-dd')
                break
            case 'custom':
                dateFrom = customDateFrom
                dateTo = customDateTo
                break
        }

        fetchStockMovementSummary(dateFrom, dateTo)
    }, [selectedPeriod, customDateFrom, customDateTo, fetchStockMovementSummary])

    // Dados filtrados por categoria
    const filteredProducts = selectedCategory === 'all'
        ? products
        : products.filter(p => p.category === selectedCategory)

    const filteredMovements = selectedCategory === 'all'
        ? stockMovements
        : stockMovements.filter(m => {
            const product = products.find(p => p.id === m.product_id)
            return product?.category === selectedCategory
        })

    // Cálculos para gráficos e análises
    const getMovementsByDay = () => {
        const last30Days = eachDayOfInterval({
            start: subDays(new Date(), 29),
            end: new Date()
        })

        return last30Days.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd')
            const dayMovements = filteredMovements.filter(m =>
                format(new Date(m.created_at), 'yyyy-MM-dd') === dayStr
            )

            return {
                date: format(day, 'dd/MM'),
                entradas: dayMovements.filter(m => m.movement_type === 'in').length,
                saidas: dayMovements.filter(m => ['out', 'expired', 'loss'].includes(m.movement_type)).length,
                total: dayMovements.length
            }
        })
    }

    const getProductsByCategory = () => {
        const categoryData = categories.map(category => {
            const categoryProducts = products.filter(p => p.category === category)
            const totalValue = categoryProducts.reduce((sum, p) => sum + (p.current_stock * p.cost_price), 0)
            const totalQuantity = categoryProducts.reduce((sum, p) => sum + p.current_stock, 0)

            return {
                name: category,
                produtos: categoryProducts.length,
                valor: totalValue,
                quantidade: totalQuantity
            }
        })

        return categoryData.sort((a, b) => b.valor - a.valor)
    }

    const getTopProducts = () => {
        return [...filteredProducts]
            .sort((a, b) => (b.current_stock * b.cost_price) - (a.current_stock * a.cost_price))
            .slice(0, 10)
            .map(product => ({
                ...product,
                totalValue: product.current_stock * product.cost_price
            }))
    }

    const getLowStockProducts = () => {
        return filteredProducts
            .filter(p => p.current_stock <= p.min_stock && p.is_active)
            .sort((a, b) => (a.current_stock / a.min_stock) - (b.current_stock / b.min_stock))
    }

    const getExpiredProducts = () => {
        const today = new Date()
        return filteredProducts
            .filter(p => p.expiry_date && new Date(p.expiry_date) < today && p.current_stock > 0)
            .sort((a, b) => new Date(a.expiry_date!).getTime() - new Date(b.expiry_date!).getTime())
    }

    const getExpiringProducts = () => {
        const today = new Date()
        const thirtyDaysFromNow = subDays(today, -30)
        return filteredProducts
            .filter(p => {
                if (!p.expiry_date || p.current_stock === 0) return false
                const expiryDate = new Date(p.expiry_date)
                return expiryDate > today && expiryDate <= thirtyDaysFromNow
            })
            .sort((a, b) => new Date(a.expiry_date!).getTime() - new Date(b.expiry_date!).getTime())
    }

    const getABCAnalysis = () => {
        const productsWithMovements = filteredProducts.map(product => {
            const productMovements = filteredMovements.filter(m => m.product_id === product.id)
            const totalMovements = productMovements.length
            const totalValue = productMovements.reduce((sum, m) => sum + ((m.unit_cost || product.cost_price) * m.quantity), 0)
            const currentValue = product.current_stock * product.cost_price

            return {
                ...product,
                movementCount: totalMovements,
                movementValue: totalValue,
                currentValue,
                rotation: totalMovements > 0 ? totalValue / (currentValue || 1) : 0
            }
        })

        // Ordenar por valor de movimentação (critério ABC)
        productsWithMovements.sort((a, b) => b.movementValue - a.movementValue)

        const totalValue = productsWithMovements.reduce((sum, p) => sum + p.movementValue, 0)
        let accumulatedValue = 0

        return productsWithMovements.map(product => {
            accumulatedValue += product.movementValue
            const percentage = totalValue > 0 ? (accumulatedValue / totalValue) * 100 : 0

            let classification = 'C'
            if (percentage <= 80) classification = 'A'
            else if (percentage <= 95) classification = 'B'

            return {
                ...product,
                classification,
                accumulatedPercentage: percentage
            }
        })
    }

    const getMovementTypeData = () => {
        const movementTypes = ['in', 'out', 'adjustment', 'expired', 'loss'] as StockMovementType[]

        return movementTypes.map(type => {
            const movements = filteredMovements.filter(m => m.movement_type === type)
            const count = movements.length
            const value = movements.reduce((sum, m) => sum + ((m.unit_cost || 0) * m.quantity), 0)

            const labels = {
                in: 'Entradas',
                out: 'Saídas',
                adjustment: 'Ajustes',
                expired: 'Vencidos',
                loss: 'Perdas'
            }

            const colors = {
                in: '#10b981',
                out: '#3b82f6',
                adjustment: '#f59e0b',
                expired: '#ef4444',
                loss: '#ef4444'
            }

            return {
                name: labels[type],
                quantidade: count,
                valor: value,
                color: colors[type]
            }
        }).filter(item => item.quantidade > 0)
    }

    // Cores para gráficos
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']

    const isLoading = productsLoading || stockMovementsLoading || summaryLoading

    if (isLoading && products.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <Sidebar />
                <div className="lg:ml-64">
                    <div className="flex items-center justify-center h-64">
                        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                </div>
            </div>
        )
    }

    const movementsByDay = getMovementsByDay()
    const productsByCategory = getProductsByCategory()
    const topProducts = getTopProducts()
    const lowStockProducts = getLowStockProducts()
    const expiredProducts = getExpiredProducts()
    const expiringProducts = getExpiringProducts()
    const abcAnalysis = getABCAnalysis()
    const movementTypeData = getMovementTypeData()

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            {/* Sidebar */}
            <Sidebar />

            {/* Conteúdo Principal */}
            <div className="lg:ml-64">
                {/* Header com Breadcrumb */}
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
                    <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                {/* Breadcrumb */}
                                <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                                    <Link href="/estoque" className="hover:text-slate-700 transition-colors">
                                        Estoque
                                    </Link>
                                    <ChevronRight className="w-4 h-4" />
                                    <span className="text-slate-900 font-medium">Relatórios</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                        <BarChart3 className="w-4 h-4 text-white" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                        Relatórios de Estoque
                                    </h1>
                                </div>
                                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                    Análises detalhadas, insights e tendências do seu estoque
                                </p>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                {/* Status Badge */}
                                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg shadow-emerald-500/25 text-xs">
                                    <Activity className="w-3 h-3 mr-1" />
                                    <span className="hidden sm:inline">Análises Ativas</span>
                                    <span className="sm:hidden">Ativas</span>
                                </Badge>

                                {/* Botões de Ação */}
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <button
                                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                                        onClick={() => refreshAll()}
                                        disabled={isLoading}
                                    >
                                        <RefreshCw className={`w-4 h-4 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
                                    </button>
                                    <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                        <Filter className="w-4 h-4 text-slate-600" />
                                    </button>
                                    <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                        <Download className="w-4 h-4 text-slate-600" />
                                    </button>
                                </div>

                                {/* Botão Principal */}
                                <Button
                                    onClick={() => {
                                        // Lógica para exportar relatório
                                        toast.info('Relatório sendo gerado...')
                                    }}
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 border-0"
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Exportar Relatório
                                </Button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Conteúdo */}
                <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

                        {/* Filtros de Período e Categoria */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Filter className="w-5 h-5 text-blue-500" />
                                    Filtros de Análise
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 lg:p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-2 block">Período</label>
                                        <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                            <TabsList className="bg-slate-100 border-0 w-full">
                                                <TabsTrigger value="week" className="data-[state=active]:bg-white">Semana</TabsTrigger>
                                                <TabsTrigger value="month" className="data-[state=active]:bg-white">Mês</TabsTrigger>
                                                <TabsTrigger value="quarter" className="data-[state=active]:bg-white">Trimestre</TabsTrigger>
                                                <TabsTrigger value="year" className="data-[state=active]:bg-white">Ano</TabsTrigger>
                                                <TabsTrigger value="custom" className="data-[state=active]:bg-white">Personalizado</TabsTrigger>
                                            </TabsList>
                                        </Tabs>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-2 block">Categoria</label>
                                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                            <SelectTrigger className="border-slate-200 focus:border-blue-500">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todas as categorias</SelectItem>
                                                {categories.map((category) => (
                                                    <SelectItem key={category} value={category}>
                                                        {category}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-2 block">Tipo de Relatório</label>
                                        <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                                            <SelectTrigger className="border-slate-200 focus:border-blue-500">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="overview">Visão Geral</SelectItem>
                                                <SelectItem value="valuation">Valorização</SelectItem>
                                                <SelectItem value="movements">Movimentações</SelectItem>
                                                <SelectItem value="abc">Análise ABC</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Filtro de Data Personalizado */}
                                {selectedPeriod === 'custom' && (
                                    <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 mb-2 block">Data Inicial</label>
                                            <Input
                                                type="date"
                                                value={customDateFrom}
                                                onChange={(e) => setCustomDateFrom(e.target.value)}
                                                className="border-slate-200 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 mb-2 block">Data Final</label>
                                            <Input
                                                type="date"
                                                value={customDateTo}
                                                onChange={(e) => setCustomDateTo(e.target.value)}
                                                className="border-slate-200 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Conteúdo por Abas */}
                        <Tabs value={reportType} onValueChange={(value: any) => setReportType(value)} className="w-full">
                            {/* Navegação das Abas */}
                            <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                                <CardContent className="p-4 lg:p-6">
                                    <TabsList className="bg-slate-100 border-0 w-full justify-start">
                                        <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2">
                                            <Eye className="w-4 h-4" />
                                            Visão Geral
                                        </TabsTrigger>
                                        <TabsTrigger value="valuation" className="data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2">
                                            <DollarSign className="w-4 h-4" />
                                            Valorização
                                        </TabsTrigger>
                                        <TabsTrigger value="movements" className="data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2">
                                            <Activity className="w-4 h-4" />
                                            Movimentações
                                        </TabsTrigger>
                                        <TabsTrigger value="abc" className="data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2">
                                            <Target className="w-4 h-4" />
                                            Análise ABC
                                        </TabsTrigger>
                                    </TabsList>
                                </CardContent>
                            </Card>

                            {/* Conteúdo da Aba: Visão Geral */}
                            <TabsContent value="overview" className="space-y-6">
                                {/* Métricas Principais */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                                    <Card className="border-0 shadow-lg">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="p-3 rounded-2xl bg-blue-100">
                                                    <Package className="w-6 h-6 text-blue-600" />
                                                </div>
                                                <TrendingUp className="w-4 h-4 text-green-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-600">Total de Produtos</p>
                                                <p className="text-2xl font-bold text-slate-900">{filteredProducts.length}</p>
                                                <p className="text-xs text-green-600 mt-1">
                                                    {filteredProducts.filter(p => p.is_active).length} ativos
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-0 shadow-lg">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="p-3 rounded-2xl bg-emerald-100">
                                                    <DollarSign className="w-6 h-6 text-emerald-600" />
                                                </div>
                                                <TrendingUp className="w-4 h-4 text-green-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-600">Valor Total</p>
                                                <p className="text-2xl font-bold text-slate-900">
                                                    R$ {(stockValuation?.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </p>
                                                <p className="text-xs text-emerald-600 mt-1">
                                                    {stockValuation?.totalQuantity || 0} unidades
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-0 shadow-lg">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="p-3 rounded-2xl bg-orange-100">
                                                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                                                </div>
                                                <TrendingDown className="w-4 h-4 text-orange-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-600">Estoque Baixo</p>
                                                <p className="text-2xl font-bold text-slate-900">{lowStockProducts.length}</p>
                                                <p className="text-xs text-orange-600 mt-1">
                                                    Precisam reposição
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-0 shadow-lg">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="p-3 rounded-2xl bg-red-100">
                                                    <Calendar className="w-6 h-6 text-red-600" />
                                                </div>
                                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-600">Vencendo</p>
                                                <p className="text-2xl font-bold text-slate-900">{expiringProducts.length}</p>
                                                <p className="text-xs text-red-600 mt-1">
                                                    Próximos 30 dias
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Gráfico de Movimentações por Dia */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-blue-500" />
                                            Movimentações dos Últimos 30 Dias
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="h-80">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={movementsByDay}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="date" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="entradas"
                                                        stackId="1"
                                                        stroke="#10b981"
                                                        fill="#10b981"
                                                        fillOpacity={0.6}
                                                        name="Entradas"
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="saidas"
                                                        stackId="1"
                                                        stroke="#3b82f6"
                                                        fill="#3b82f6"
                                                        fillOpacity={0.6}
                                                        name="Saídas"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Grid de Alertas */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Produtos com Estoque Baixo */}
                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100">
                                            <CardTitle className="flex items-center gap-2 text-orange-800">
                                                <AlertTriangle className="w-5 h-5 text-orange-600" />
                                                Estoque Baixo ({lowStockProducts.length})
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            {lowStockProducts.length === 0 ? (
                                                <div className="text-center py-6">
                                                    <p className="text-slate-500">Nenhum produto com estoque baixo</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {lowStockProducts.slice(0, 5).map((product) => (
                                                        <div key={product.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-slate-900 truncate">{product.name}</p>
                                                                <p className="text-sm text-slate-500">
                                                                    {product.current_stock} / {product.min_stock} {product.unit}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-orange-500 transition-all"
                                                                        style={{
                                                                            width: `${Math.min(100, (product.current_stock / product.min_stock) * 100)}%`
                                                                        }}
                                                                    />
                                                                </div>
                                                                <p className="text-xs text-slate-500 mt-1">
                                                                    {Math.round((product.current_stock / product.min_stock) * 100)}%
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {lowStockProducts.length > 5 && (
                                                        <div className="text-center pt-3">
                                                            <Link href="/estoque/produtos?status=low_stock">
                                                                <Button variant="outline" size="sm">
                                                                    Ver todos ({lowStockProducts.length})
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Produtos Vencendo */}
                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-100">
                                            <CardTitle className="flex items-center gap-2 text-red-800">
                                                <Calendar className="w-5 h-5 text-red-600" />
                                                Vencendo em 30 Dias ({expiringProducts.length})
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            {expiringProducts.length === 0 ? (
                                                <div className="text-center py-6">
                                                    <p className="text-slate-500">Nenhum produto vencendo</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {expiringProducts.slice(0, 5).map((product) => {
                                                        const daysUntilExpiry = Math.ceil(
                                                            (new Date(product.expiry_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                                                        )
                                                        return (
                                                            <div key={product.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-medium text-slate-900 truncate">{product.name}</p>
                                                                    <p className="text-sm text-slate-500">
                                                                        {product.current_stock} {product.unit} em estoque
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <Badge
                                                                        variant={daysUntilExpiry <= 7 ? 'destructive' : 'secondary'}
                                                                        className={daysUntilExpiry <= 7 ? '' : 'bg-orange-100 text-orange-700 border-orange-200'}
                                                                    >
                                                                        {daysUntilExpiry} dias
                                                                    </Badge>
                                                                    <p className="text-xs text-slate-500 mt-1">
                                                                        {format(new Date(product.expiry_date!), 'dd/MM/yyyy')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                    {expiringProducts.length > 5 && (
                                                        <div className="text-center pt-3">
                                                            <Link href="/estoque/produtos?status=expiring">
                                                                <Button variant="outline" size="sm">
                                                                    Ver todos ({expiringProducts.length})
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            {/* Conteúdo da Aba: Valorização */}
                            <TabsContent value="valuation" className="space-y-6">
                                {/* Distribuição por Categoria */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                            <CardTitle className="flex items-center gap-2">
                                                <PieChart className="w-5 h-5 text-blue-500" />
                                                Distribuição por Categoria
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="h-80">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RechartsPieChart>
                                                        <Pie
                                                            data={productsByCategory}
                                                            cx="50%"
                                                            cy="50%"
                                                            labelLine={false}
                                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                            outerRadius={80}
                                                            fill="#8884d8"
                                                            dataKey="valor"
                                                        >
                                                            {productsByCategory.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                                                    </RechartsPieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                            <CardTitle className="flex items-center gap-2">
                                                <BarChart3 className="w-5 h-5 text-green-500" />
                                                Valor por Categoria
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="h-80">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={productsByCategory}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="name" />
                                                        <YAxis />
                                                        <Tooltip formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                                                        <Bar dataKey="valor" fill="#10b981" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Top 10 Produtos por Valor */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-purple-500" />
                                            Top 10 Produtos por Valor em Estoque
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-slate-50/50">
                                                        <TableHead className="font-semibold text-slate-700">Produto</TableHead>
                                                        <TableHead className="font-semibold text-slate-700">Categoria</TableHead>
                                                        <TableHead className="font-semibold text-slate-700">Estoque</TableHead>
                                                        <TableHead className="font-semibold text-slate-700">Custo Unit.</TableHead>
                                                        <TableHead className="font-semibold text-slate-700">Valor Total</TableHead>
                                                        <TableHead className="font-semibold text-slate-700">% do Total</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {topProducts.map((product, index) => {
                                                        const percentage = stockValuation?.totalValue
                                                            ? (product.totalValue / stockValuation.totalValue) * 100
                                                            : 0
                                                        return (
                                                            <TableRow key={product.id} className="hover:bg-slate-50/50">
                                                                <TableCell className="py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                                                            index < 3 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-slate-400'
                                                                        }`}>
                                                                            {index + 1}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-medium text-slate-900">{product.name}</p>
                                                                            {product.sku && (
                                                                                <p className="text-sm text-slate-500">SKU: {product.sku}</p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="py-4">
                                                                    {product.category ? (
                                                                        <Badge variant="outline">{product.category}</Badge>
                                                                    ) : (
                                                                        <span className="text-slate-400">-</span>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="py-4">
                                                                    <span className="font-medium">
                                                                        {product.current_stock} {product.unit}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="py-4">
                                                                    <span className="font-medium">
                                                                        R$ {product.cost_price.toFixed(2)}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="py-4">
                                                                    <span className="font-bold text-green-600">
                                                                        R$ {product.totalValue.toFixed(2)}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="py-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                                            <div
                                                                                className="h-full bg-purple-500 transition-all"
                                                                                style={{ width: `${percentage}%` }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-sm font-medium text-slate-600">
                                                                            {percentage.toFixed(1)}%
                                                                        </span>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        )
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Conteúdo da Aba: Movimentações */}
                            <TabsContent value="movements" className="space-y-6">
                                {/* Tipos de Movimentação */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                            <CardTitle className="flex items-center gap-2">
                                                <Activity className="w-5 h-5 text-blue-500" />
                                                Distribuição por Tipo
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="h-80">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RechartsPieChart>
                                                        <Pie
                                                            data={movementTypeData}
                                                            cx="50%"
                                                            cy="50%"
                                                            labelLine={false}
                                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                            outerRadius={80}
                                                            fill="#8884d8"
                                                            dataKey="quantidade"
                                                        >
                                                            {movementTypeData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                    </RechartsPieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                            <CardTitle className="flex items-center gap-2">
                                                <DollarSign className="w-5 h-5 text-green-500" />
                                                Valor por Tipo
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="h-80">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={movementTypeData}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="name" />
                                                        <YAxis />
                                                        <Tooltip formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                                                        <Bar dataKey="valor" fill="#10b981" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Resumo do Período */}
                                {stockMovementSummary && (
                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                            <CardTitle className="flex items-center gap-2">
                                                <Archive className="w-5 h-5 text-purple-500" />
                                                Resumo do Período
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                                                <div className="text-center">
                                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                        <ArrowUp className="w-6 h-6 text-green-600" />
                                                    </div>
                                                    <p className="text-sm text-slate-600">Entradas</p>
                                                    <p className="text-lg font-bold text-green-600">{stockMovementSummary.totalIn}</p>
                                                </div>
                                                <div className="text-center">
                                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                        <ArrowDown className="w-6 h-6 text-blue-600" />
                                                    </div>
                                                    <p className="text-sm text-slate-600">Saídas</p>
                                                    <p className="text-lg font-bold text-blue-600">{stockMovementSummary.totalOut}</p>
                                                </div>
                                                <div className="text-center">
                                                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                        <RotateCcw className="w-6 h-6 text-orange-600" />
                                                    </div>
                                                    <p className="text-sm text-slate-600">Ajustes</p>
                                                    <p className="text-lg font-bold text-orange-600">{stockMovementSummary.totalAdjustments}</p>
                                                </div>
                                                <div className="text-center">
                                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                        <AlertTriangle className="w-6 h-6 text-red-600" />
                                                    </div>
                                                    <p className="text-sm text-slate-600">Vencidos</p>
                                                    <p className="text-lg font-bold text-red-600">{stockMovementSummary.totalExpired}</p>
                                                </div>
                                                <div className="text-center">
                                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                        <Minus className="w-6 h-6 text-red-600" />
                                                    </div>
                                                    <p className="text-sm text-slate-600">Perdas</p>
                                                    <p className="text-lg font-bold text-red-600">{stockMovementSummary.totalLoss}</p>
                                                </div>
                                                <div className="text-center">
                                                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                        <TrendingUp className="w-6 h-6 text-purple-600" />
                                                    </div>
                                                    <p className="text-sm text-slate-600">Saldo</p>
                                                    <p className={`text-lg font-bold ${
                                                        stockMovementSummary.netMovement >= 0 ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                        {stockMovementSummary.netMovement >= 0 ? '+' : ''}{stockMovementSummary.netMovement}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            {/* Conteúdo da Aba: Análise ABC */}
                            <TabsContent value="abc" className="space-y-6">
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2">
                                            <Target className="w-5 h-5 text-purple-500" />
                                            Análise ABC dos Produtos
                                        </CardTitle>
                                        <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <div className="flex items-start gap-2">
                                                <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                                                <div className="text-sm text-blue-800">
                                                    <p className="font-medium">Sobre a Análise ABC:</p>
                                                    <p className="text-blue-600 mt-1">
                                                        <strong>Classe A:</strong> Produtos de alto valor (80% do movimento) •
                                                        <strong>Classe B:</strong> Valor médio (15% do movimento) •
                                                        <strong>Classe C:</strong> Baixo valor (5% do movimento)
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-slate-50/50">
                                                        <TableHead className="font-semibold text-slate-700">Produto</TableHead>
                                                        <TableHead className="font-semibold text-slate-700">Classe</TableHead>
                                                        <TableHead className="font-semibold text-slate-700">Valor Movimento</TableHead>
                                                        <TableHead className="font-semibold text-slate-700">Valor Estoque</TableHead>
                                                        <TableHead className="font-semibold text-slate-700">Movimentações</TableHead>
                                                        <TableHead className="font-semibold text-slate-700">Giro</TableHead>
                                                        <TableHead className="font-semibold text-slate-700">% Acumulado</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {abcAnalysis.slice(0, 20).map((product) => (
                                                        <TableRow key={product.id} className="hover:bg-slate-50/50">
                                                            <TableCell className="py-4">
                                                                <div>
                                                                    <p className="font-medium text-slate-900">{product.name}</p>
                                                                    {product.sku && (
                                                                        <p className="text-sm text-slate-500">SKU: {product.sku}</p>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                <Badge
                                                                    variant={product.classification === 'A' ? 'default' : 'secondary'}
                                                                    className={`font-bold ${
                                                                        product.classification === 'A' ? 'bg-green-100 text-green-700 border-green-200' :
                                                                            product.classification === 'B' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                                                'bg-red-100 text-red-700 border-red-200'
                                                                    }`}
                                                                >
                                                                    Classe {product.classification}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                <span className="font-medium text-slate-900">
                                                                    R$ {product.movementValue.toFixed(2)}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                <span className="font-medium text-slate-900">
                                                                    R$ {product.currentValue.toFixed(2)}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                <span className="font-medium text-slate-900">
                                                                    {product.movementCount}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                <span className={`font-medium ${
                                                                    product.rotation >= 2 ? 'text-green-600' :
                                                                        product.rotation >= 1 ? 'text-yellow-600' :
                                                                            'text-red-600'
                                                                }`}>
                                                                    {product.rotation.toFixed(2)}x
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                                        <div
                                                                            className={`h-full transition-all ${
                                                                                product.classification === 'A' ? 'bg-green-500' :
                                                                                    product.classification === 'B' ? 'bg-yellow-500' :
                                                                                        'bg-red-500'
                                                                            }`}
                                                                            style={{ width: `${product.accumulatedPercentage}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-sm font-medium text-slate-600">
                                                                        {product.accumulatedPercentage.toFixed(1)}%
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                        {abcAnalysis.length > 20 && (
                                            <div className="p-6 border-t border-slate-200 text-center">
                                                <p className="text-sm text-slate-500">
                                                    Mostrando 20 de {abcAnalysis.length} produtos
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Resumo da Análise ABC */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {['A', 'B', 'C'].map((classification) => {
                                        const classProducts = abcAnalysis.filter(p => p.classification === classification)
                                        const totalValue = classProducts.reduce((sum, p) => sum + p.movementValue, 0)
                                        const totalMovements = classProducts.reduce((sum, p) => sum + p.movementCount, 0)

                                        const config = {
                                            A: { color: 'green', label: 'Alta Rotação', description: 'Produtos estratégicos' },
                                            B: { color: 'yellow', label: 'Média Rotação', description: 'Produtos importantes' },
                                            C: { color: 'red', label: 'Baixa Rotação', description: 'Produtos de controle' }
                                        }[classification]

                                        return (
                                            <Card key={classification} className="border-0 shadow-lg">
                                                <CardContent className="p-6">
                                                    <div className="text-center">
                                                        <div className={`w-16 h-16 bg-${config?.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
                                                            <span className={`text-2xl font-bold text-${config?.color}-600`}>
                                                                {classification}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-lg font-semibold text-slate-900 mb-1">
                                                            Classe {classification}
                                                        </h3>
                                                        <p className="text-sm text-slate-600 mb-4">{config?.label}</p>

                                                        <div className="space-y-2">
                                                            <div className="flex justify-between">
                                                                <span className="text-sm text-slate-600">Produtos:</span>
                                                                <span className="font-medium">{classProducts.length}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-sm text-slate-600">Valor:</span>
                                                                <span className="font-medium">R$ {totalValue.toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-sm text-slate-600">Movimentações:</span>
                                                                <span className="font-medium">{totalMovements}</span>
                                                            </div>
                                                        </div>

                                                        <p className="text-xs text-slate-500 mt-4">{config?.description}</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default RelatoriosEstoquePage