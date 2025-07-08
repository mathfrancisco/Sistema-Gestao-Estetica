// app/(dashboard)/financeiro/fluxo-caixa/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
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
    Calendar,
    Plus,
    Activity,
    AlertTriangle,
    CheckCircle,
    Bell,
    Download,
    RefreshCw,
    ChevronRight,
    Target,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Calculator
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { format, addDays,} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

// Hooks
import { useFinancials } from '@/lib/hooks/useFinancials'
import { useAuthStore } from '@/store/useAuthStore'

// Componentes
import { Sidebar } from '@/components/layout/sidebar'

interface CashFlowEntry {
    id: string
    date: string
    description: string
    category: string
    type: 'income' | 'expense'
    amount: number
    status: 'confirmed' | 'projected' | 'pending'
    isRecurring: boolean
}

interface CashFlowProjection {
    date: string
    income: number
    expenses: number
    balance: number
    cumulativeBalance: number
}

const FluxoCaixaPage: React.FC = () => {
    const { user } = useAuthStore()
    const [activeTab, setActiveTab] = useState('overview')
    const [selectedPeriod, setSelectedPeriod] = useState(90) // dias
    const [isAddEntryDialogOpen, setIsAddEntryDialogOpen] = useState(false)
    const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily')

    // Estado para nova entrada
    const [newEntry, setNewEntry] = useState({
        description: '',
        category: '',
        type: 'income' as 'income' | 'expense',
        amount: 0,
        date: format(new Date(), 'yyyy-MM-dd'),
        isRecurring: false
    })

    // Hooks financeiros
    const {
        financialSummary,
        revenueByPeriod,
        isLoadingReports,
        error,
        fetchFinancialSummary,
        fetchRevenueByPeriod,
        clearError
    } = useFinancials()

    // Dados simulados para demonstração
    const [cashFlowEntries] = useState<CashFlowEntry[]>([
        {
            id: '1',
            date: format(new Date(), 'yyyy-MM-dd'),
            description: 'Receita de Atendimentos',
            category: 'Serviços',
            type: 'income',
            amount: 2500,
            status: 'confirmed',
            isRecurring: true
        },
        {
            id: '2',
            date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
            description: 'Aluguel do Salão',
            category: 'Infraestrutura',
            type: 'expense',
            amount: 1200,
            status: 'projected',
            isRecurring: true
        },
        {
            id: '3',
            date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
            description: 'Compra de Produtos',
            category: 'Estoque',
            type: 'expense',
            amount: 800,
            status: 'pending',
            isRecurring: false
        },
        {
            id: '4',
            date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
            description: 'Receita Projetada',
            category: 'Serviços',
            type: 'income',
            amount: 3200,
            status: 'projected',
            isRecurring: false
        }
    ])

    // Calcular projeção de fluxo de caixa
    const calculateCashFlowProjection = (): CashFlowProjection[] => {
        const projections: CashFlowProjection[] = []
        let cumulativeBalance = financialSummary?.totalRevenue || 10000 // Saldo inicial simulado

        for (let i = 0; i < selectedPeriod; i++) {
            const date = format(addDays(new Date(), i), 'yyyy-MM-dd')
            const dayEntries = cashFlowEntries.filter(entry => entry.date === date)

            const income = dayEntries
                .filter(entry => entry.type === 'income')
                .reduce((sum, entry) => sum + entry.amount, 0)

            const expenses = dayEntries
                .filter(entry => entry.type === 'expense')
                .reduce((sum, entry) => sum + entry.amount, 0)

            const balance = income - expenses
            cumulativeBalance += balance

            projections.push({
                date,
                income,
                expenses,
                balance,
                cumulativeBalance
            })
        }

        return projections
    }

    const cashFlowProjections = calculateCashFlowProjection()

    // Carregar dados iniciais
    useEffect(() => {
        if (user?.id) {
            loadInitialData()
        }
    }, [user?.id])

    const loadInitialData = async () => {
        if (!user?.id) return

        try {
            const startDate = format(new Date(), 'yyyy-MM-dd')
            const endDate = format(addDays(new Date(), selectedPeriod), 'yyyy-MM-dd')

            await fetchFinancialSummary(startDate, endDate, user.id)
            await fetchRevenueByPeriod(startDate, endDate, 'day', user.id)
        } catch (error) {
            console.error('Erro ao carregar dados do fluxo de caixa:', error)
        }
    }

    // Handlers
    const handleRefresh = async () => {
        await loadInitialData()
        toast.success('Dados atualizados com sucesso!')
    }

    const handleAddEntry = () => {
        // Simular adição de entrada
        toast.success('Entrada adicionada com sucesso!')
        setIsAddEntryDialogOpen(false)
        setNewEntry({
            description: '',
            category: '',
            type: 'income',
            amount: 0,
            date: format(new Date(), 'yyyy-MM-dd'),
            isRecurring: false
        })
    }

    const handleExport = () => {
        toast.info('Funcionalidade de exportação em desenvolvimento')
    }

    // Limpar erros
    useEffect(() => {
        if (error) {
            toast.error(error)
            clearError()
        }
    }, [error, clearError])

    // Calcular métricas do período
    const totalIncome = cashFlowProjections.reduce((sum, proj) => sum + proj.income, 0)
    const totalExpenses = cashFlowProjections.reduce((sum, proj) => sum + proj.expenses, 0)
    const netCashFlow = totalIncome - totalExpenses
    const finalBalance = cashFlowProjections[cashFlowProjections.length - 1]?.cumulativeBalance || 0
    const daysWithNegativeBalance = cashFlowProjections.filter(proj => proj.cumulativeBalance < 0).length

    // Métricas do dashboard
    const dashboardMetrics = [
        {
            title: 'Saldo Atual',
            value: cashFlowProjections[0]?.cumulativeBalance || 0,
            icon: DollarSign,
            description: 'Saldo em caixa hoje',
            gradient: 'from-emerald-500 to-emerald-600',
            trend: { value: netCashFlow > 0 ? '+' + netCashFlow.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : netCashFlow.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), label: 'fluxo líquido', isPositive: netCashFlow >= 0 }
        },
        {
            title: 'Entradas Projetadas',
            value: totalIncome,
            icon: ArrowUpRight,
            description: `Próximos ${selectedPeriod} dias`,
            gradient: 'from-blue-500 to-blue-600',
            trend: { value: cashFlowProjections.filter(p => p.income > 0).length.toString(), label: 'dias com receita', isPositive: true }
        },
        {
            title: 'Saídas Projetadas',
            value: totalExpenses,
            icon: ArrowDownRight,
            description: `Próximos ${selectedPeriod} dias`,
            gradient: 'from-red-500 to-red-600',
            trend: { value: cashFlowProjections.filter(p => p.expenses > 0).length.toString(), label: 'dias com gastos', isPositive: false }
        },
        {
            title: 'Saldo Final',
            value: finalBalance,
            icon: Target,
            description: `Em ${selectedPeriod} dias`,
            gradient: finalBalance > 0 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600',
            trend: { value: daysWithNegativeBalance > 0 ? `${daysWithNegativeBalance} dias negativos` : 'Sempre positivo', label: 'alerta', isPositive: daysWithNegativeBalance === 0 }
        }
    ]

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        })
    }

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            confirmed: { label: 'Confirmado', variant: 'default' as const, color: 'emerald' },
            projected: { label: 'Projetado', variant: 'secondary' as const, color: 'blue' },
            pending: { label: 'Pendente', variant: 'outline' as const, color: 'orange' }
        }

        const config = statusConfig[status as keyof typeof statusConfig]
        return (
            <Badge variant={config.variant} className={`bg-${config.color}-50 text-${config.color}-700 border-${config.color}-200`}>
                {config.label}
            </Badge>
        )
    }

    // Tooltip customizado para gráficos
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                    <p className="font-medium text-slate-900">{format(new Date(label), "dd/MM/yyyy", { locale: ptBR })}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {formatCurrency(entry.value)}
                        </p>
                    ))}
                </div>
            )
        }
        return null
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            {/* Sidebar */}
            <Sidebar />

            {/* Conteúdo Principal */}
            <div className="lg:ml-64">
                {/* Header Moderno */}
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
                    <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                                        <TrendingUp className="w-4 h-4 text-white" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                        Fluxo de Caixa
                                    </h1>
                                </div>
                                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                    Controle e projete suas entradas e saídas financeiras
                                </p>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                {/* Status Badge */}
                                <Badge className={`border-0 shadow-lg text-xs ${
                                    daysWithNegativeBalance === 0
                                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-emerald-500/25'
                                        : 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-orange-500/25'
                                }`}>
                                    {daysWithNegativeBalance === 0 ? (
                                        <>
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            <span className="hidden sm:inline">Fluxo Saudável</span>
                                            <span className="sm:hidden">Saudável</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle className="w-3 h-3 mr-1" />
                                            <span className="hidden sm:inline">Atenção Requerida</span>
                                            <span className="sm:hidden">Atenção</span>
                                        </>
                                    )}
                                </Badge>

                                {/* Botões de Ação */}
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <button
                                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                                        onClick={handleRefresh}
                                        disabled={isLoadingReports}
                                    >
                                        <RefreshCw className={`w-4 h-4 text-slate-600 ${isLoadingReports ? 'animate-spin' : ''}`} />
                                    </button>
                                    <button
                                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                                        onClick={handleExport}
                                    >
                                        <Download className="w-4 h-4 text-slate-600" />
                                    </button>
                                    <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                        <Bell className="w-4 h-4 text-slate-600" />
                                    </button>
                                </div>

                                {/* Botões Principais */}
                                <div className="flex items-center gap-2 ml-2">
                                    <Link href="/financeiro">
                                        <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50 shadow-sm">
                                            <BarChart3 className="w-4 h-4 mr-2" />
                                            Financeiro
                                        </Button>
                                    </Link>
                                    <Dialog open={isAddEntryDialogOpen} onOpenChange={setIsAddEntryDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-lg shadow-blue-500/25 border-0">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Nova Entrada
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>Nova Entrada no Fluxo de Caixa</DialogTitle>
                                                <DialogDescription>
                                                    Adicione uma nova entrada ou saída no seu fluxo de caixa.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="description">Descrição</Label>
                                                    <Input
                                                        id="description"
                                                        value={newEntry.description}
                                                        onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                                                        placeholder="Ex: Receita de atendimentos"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Tipo</Label>
                                                        <Select value={newEntry.type} onValueChange={(value: 'income' | 'expense') => setNewEntry(prev => ({ ...prev, type: value }))}>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="income">Entrada</SelectItem>
                                                                <SelectItem value="expense">Saída</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="amount">Valor</Label>
                                                        <Input
                                                            id="amount"
                                                            type="number"
                                                            value={newEntry.amount}
                                                            onChange={(e) => setNewEntry(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                                                            placeholder="0,00"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="category">Categoria</Label>
                                                    <Select value={newEntry.category} onValueChange={(value) => setNewEntry(prev => ({ ...prev, category: value }))}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione uma categoria" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Serviços">Serviços</SelectItem>
                                                            <SelectItem value="Produtos">Produtos</SelectItem>
                                                            <SelectItem value="Infraestrutura">Infraestrutura</SelectItem>
                                                            <SelectItem value="Estoque">Estoque</SelectItem>
                                                            <SelectItem value="Marketing">Marketing</SelectItem>
                                                            <SelectItem value="Pessoal">Pessoal</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="date">Data</Label>
                                                    <Input
                                                        id="date"
                                                        type="date"
                                                        value={newEntry.date}
                                                        onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setIsAddEntryDialogOpen(false)}>
                                                    Cancelar
                                                </Button>
                                                <Button onClick={handleAddEntry}>
                                                    Adicionar
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Conteúdo */}
                <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

                        {/* Seletor de Período */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-blue-500" />
                                    Período de Projeção
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                    <div className="space-y-2">
                                        <Label>Período</Label>
                                        <Select value={selectedPeriod.toString()} onValueChange={(value) => setSelectedPeriod(parseInt(value))}>
                                            <SelectTrigger className="w-48">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="30">30 dias</SelectItem>
                                                <SelectItem value="60">60 dias</SelectItem>
                                                <SelectItem value="90">90 dias</SelectItem>
                                                <SelectItem value="180">6 meses</SelectItem>
                                                <SelectItem value="365">1 ano</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Visualização</Label>
                                        <Select value={viewMode} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setViewMode(value)}>
                                            <SelectTrigger className="w-32">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="daily">Diária</SelectItem>
                                                <SelectItem value="weekly">Semanal</SelectItem>
                                                <SelectItem value="monthly">Mensal</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Métricas do Dashboard */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                            {dashboardMetrics.map((metric, index) => (
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
                                                {formatCurrency(metric.value)}
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
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Tabs de Conteúdo */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                            <TabsList className="bg-white border border-slate-200 shadow-sm p-1">
                                <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                                    <TrendingUp className="w-4 h-4 mr-2" />
                                    Visão Geral
                                </TabsTrigger>
                                <TabsTrigger value="projections" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                                    <Calculator className="w-4 h-4 mr-2" />
                                    Projeções
                                </TabsTrigger>
                                <TabsTrigger value="entries" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                                    <Activity className="w-4 h-4 mr-2" />
                                    Entradas
                                </TabsTrigger>
                            </TabsList>

                            {/* Tab: Visão Geral */}
                            <TabsContent value="overview" className="space-y-6">
                                {/* Gráfico de Fluxo de Caixa */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-blue-500" />
                                            Projeção de Fluxo de Caixa
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="h-80">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={cashFlowProjections.slice(0, 30)}>
                                                    <defs>
                                                        <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                    <XAxis
                                                        dataKey="date"
                                                        stroke="#64748b"
                                                        fontSize={12}
                                                        tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: ptBR })}
                                                    />
                                                    <YAxis
                                                        stroke="#64748b"
                                                        fontSize={12}
                                                        tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                                                    />
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="cumulativeBalance"
                                                        stroke="#3b82f6"
                                                        strokeWidth={3}
                                                        fill="url(#balanceGradient)"
                                                        name="Saldo Acumulado"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Alertas e Recomendações */}
                                {daysWithNegativeBalance > 0 && (
                                    <Card className="border-0 shadow-xl shadow-orange-200/60 border-orange-200">
                                        <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
                                            <CardTitle className="flex items-center gap-2 text-orange-700">
                                                <AlertTriangle className="w-5 h-5" />
                                                Alerta de Fluxo de Caixa
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                <p className="text-slate-700">
                                                    Atenção: Foram identificados <strong>{daysWithNegativeBalance} dias</strong> com saldo negativo
                                                    nos próximos {selectedPeriod} dias. Considere as seguintes ações:
                                                </p>
                                                <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                                                    <li>Antecipar o recebimento de pendências</li>
                                                    <li>Negociar prazos de pagamento com fornecedores</li>
                                                    <li>Buscar fontes alternativas de receita</li>
                                                    <li>Considerar uma linha de crédito preventiva</li>
                                                </ul>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            {/* Tab: Projeções */}
                            <TabsContent value="projections" className="space-y-6">
                                {/* Gráfico de Entradas vs Saídas */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2">
                                            <BarChart3 className="w-5 h-5 text-blue-500" />
                                            Entradas vs Saídas
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="h-80">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={cashFlowProjections.slice(0, 30)}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                    <XAxis
                                                        dataKey="date"
                                                        stroke="#64748b"
                                                        fontSize={12}
                                                        tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: ptBR })}
                                                    />
                                                    <YAxis
                                                        stroke="#64748b"
                                                        fontSize={12}
                                                        tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                                                    />
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Bar dataKey="income" fill="#10b981" name="Entradas" radius={[2, 2, 0, 0]} />
                                                    <Bar dataKey="expenses" fill="#ef4444" name="Saídas" radius={[2, 2, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Resumo Mensal */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-b border-emerald-200">
                                            <CardTitle className="text-emerald-700 text-lg">Este Mês</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-sm text-slate-600">Total de Entradas</p>
                                                    <p className="text-xl font-bold text-emerald-600">{formatCurrency(8500)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-600">Total de Saídas</p>
                                                    <p className="text-xl font-bold text-red-600">{formatCurrency(6200)}</p>
                                                </div>
                                                <div className="pt-2 border-t">
                                                    <p className="text-sm text-slate-600">Saldo Líquido</p>
                                                    <p className="text-xl font-bold text-slate-900">{formatCurrency(2300)}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                                            <CardTitle className="text-blue-700 text-lg">Próximo Mês</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-sm text-slate-600">Entradas Projetadas</p>
                                                    <p className="text-xl font-bold text-emerald-600">{formatCurrency(9200)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-600">Saídas Projetadas</p>
                                                    <p className="text-xl font-bold text-red-600">{formatCurrency(6800)}</p>
                                                </div>
                                                <div className="pt-2 border-t">
                                                    <p className="text-sm text-slate-600">Saldo Projetado</p>
                                                    <p className="text-xl font-bold text-slate-900">{formatCurrency(2400)}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
                                            <CardTitle className="text-purple-700 text-lg">Tendência</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-sm text-slate-600">Crescimento Mensal</p>
                                                    <p className="text-xl font-bold text-emerald-600">+8.2%</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-600">Eficiência</p>
                                                    <p className="text-xl font-bold text-blue-600">74%</p>
                                                </div>
                                                <div className="pt-2 border-t">
                                                    <p className="text-sm text-slate-600">Score de Saúde</p>
                                                    <p className="text-xl font-bold text-emerald-600">Excelente</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            {/* Tab: Entradas */}
                            <TabsContent value="entries" className="space-y-6">
                                {/* Tabela de Entradas */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-blue-500" />
                                            Entradas Registradas
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-slate-50/50">
                                                    <TableHead>Data</TableHead>
                                                    <TableHead>Descrição</TableHead>
                                                    <TableHead>Categoria</TableHead>
                                                    <TableHead>Tipo</TableHead>
                                                    <TableHead>Valor</TableHead>
                                                    <TableHead>Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {cashFlowEntries.slice(0, 10).map((entry) => (
                                                    <TableRow key={entry.id} className="hover:bg-slate-50/50">
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                                {format(new Date(entry.date), "dd/MM/yyyy", { locale: ptBR })}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-medium text-slate-900">{entry.description}</p>
                                                                {entry.isRecurring && (
                                                                    <Badge variant="outline" className="text-xs mt-1">Recorrente</Badge>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">{entry.category}</Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                {entry.type === 'income' ? (
                                                                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                                                                ) : (
                                                                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                                                                )}
                                                                <span className={entry.type === 'income' ? 'text-emerald-600' : 'text-red-600'}>
                                                                    {entry.type === 'income' ? 'Entrada' : 'Saída'}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className={`font-semibold ${entry.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                {formatCurrency(entry.amount)}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            {getStatusBadge(entry.status)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default FluxoCaixaPage