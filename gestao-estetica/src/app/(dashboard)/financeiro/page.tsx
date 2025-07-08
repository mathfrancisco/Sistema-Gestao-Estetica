// app/(dashboard)/financeiro/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    DollarSign,
    TrendingUp,
    Activity,
    PieChart,
    Bell,
    Filter,
    Download,
    RefreshCw,
    ChevronRight,
    Sparkles,
    Calculator,
    Target,
    BarChart3,
    Receipt,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { format, subDays } from 'date-fns'

// Hooks
import { useFinancials, useFinancialFilters } from '@/lib/hooks/useFinancials'
import { useAuthStore } from '@/store/useAuthStore'

// Componentes
import { Sidebar } from '@/components/layout/sidebar'
import { FinancialMetrics, PaymentStatusMetrics } from '@/components/financial/FinancialMetrics'
import { AttendanceTable } from '@/components/financial/AttendanceTable'
import { RevenueChart } from '@/components/financial/RevenueChart'
import { ProfitDistributionChart } from '@/components/financial/ProfitDistributionChart'
import { FinancialFilters } from '@/components/financial/FinancialFilters'

const FinanceiroPage: React.FC = () => {
    const { user } = useAuthStore()
    const [dateRange, setDateRange] = useState({
        from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        to: format(new Date(), 'yyyy-MM-dd')
    })
    const [activeTab, setActiveTab] = useState('overview')

    // Hooks financeiros
    const {
        // States
        financialSummary,
        monthlyReport,
        revenueByPeriod,
        profitDistributionSummary,
        attendancesWithDetails,
        attendancesPagination,

        // Loading states
        isLoadingReports,
        isLoadingAttendances,
        isLoadingProfitDistributions,

        // Error state
        error,

        // Actions
        fetchFinancialSummary,
        fetchMonthlyReport,
        fetchRevenueByPeriod,
        fetchAttendancesWithDetails,
        fetchProfitDistributionSummary,
        updatePaymentStatus,
        clearError
    } = useFinancials()

    // Filtros
    const { filters, updateFilter, clearFilters, hasActiveFilters } = useFinancialFilters()

    // Carregar dados iniciais
    useEffect(() => {
        if (user?.id) {
            loadInitialData()
        }
    }, [user?.id, dateRange])

    // Recarregar dados quando filtros mudarem
    useEffect(() => {
        if (user?.id && hasActiveFilters) {
            loadFilteredData()
        }
    }, [filters, user?.id])

    const loadInitialData = async () => {
        if (!user?.id) return

        try {
            // Carregar resumo financeiro
            await fetchFinancialSummary(dateRange.from, dateRange.to, user.id)

            // Carregar dados de receita por período
            await fetchRevenueByPeriod(dateRange.from, dateRange.to, 'day', user.id)

            // Carregar relatório mensal atual
            const currentDate = new Date()
            await fetchMonthlyReport(currentDate.getMonth() + 1, currentDate.getFullYear(), user.id)

            // Carregar atendimentos
            await fetchAttendancesWithDetails({
                page: 1,
                limit: 10,
                filters: {
                    dateFrom: dateRange.from,
                    dateTo: dateRange.to
                }
            })

            // Carregar resumo de distribuição de lucros
            await fetchProfitDistributionSummary(user.id, dateRange.from, dateRange.to)
        } catch (error) {
            console.error('Erro ao carregar dados financeiros:', error)
        }
    }

    const loadFilteredData = async () => {
        if (!user?.id) return

        try {
            await fetchAttendancesWithDetails({
                page: attendancesPagination.page,
                limit: 10,
                filters: {
                    ...filters,
                    dateFrom: dateRange.from,
                    dateTo: dateRange.to
                }
            })
        } catch (error) {
            console.error('Erro ao aplicar filtros:', error)
        }
    }

    // Handlers
    const handleRefresh = async () => {
        await loadInitialData()
        toast.success('Dados atualizados com sucesso!')
    }

    const handlePaymentStatusUpdate = async (id: string, status: any) => {
        try {
            await updatePaymentStatus(id, status)
            toast.success('Status de pagamento atualizado!')
            // Recarregar dados para refletir as mudanças
            await loadInitialData()
        } catch (error) {
            toast.error('Erro ao atualizar status de pagamento')
        }
    }

    const handleExportData = () => {
        toast.info('Funcionalidade de exportação em desenvolvimento')
    }

    const handleGenerateReceipt = (id: string) => {
        toast.info('Funcionalidade de geração de recibo em desenvolvimento')
    }

    // Limpar erros
    useEffect(() => {
        if (error) {
            toast.error(error)
            clearError()
        }
    }, [error, clearError])

    // Métricas para cards rápidos
    const quickMetrics = [
        {
            title: 'Receita Hoje',
            value: revenueByPeriod.find(item => item.date === format(new Date(), 'yyyy-MM-dd'))?.revenue || 0,
            icon: DollarSign,
            description: 'Receita do dia atual',
            gradient: 'from-emerald-500 to-emerald-600',
            trend: { value: '+12%', label: 'vs ontem', isPositive: true }
        },
        {
            title: 'Atendimentos',
            value: attendancesWithDetails.length,
            icon: Activity,
            description: 'Total de atendimentos',
            gradient: 'from-blue-500 to-blue-600',
            trend: { value: attendancesWithDetails.length.toString(), label: 'registros', isPositive: true }
        },
        {
            title: 'Ticket Médio',
            value: financialSummary?.averageTicket || 0,
            icon: Calculator,
            description: 'Valor médio por atendimento',
            gradient: 'from-purple-500 to-purple-600',
            trend: { value: '+5%', label: 'vs período anterior', isPositive: true }
        },
        {
            title: 'Meta Mensal',
            value: 85,
            icon: Target,
            description: 'Progresso da meta',
            gradient: 'from-orange-500 to-orange-600',
            trend: { value: '85%', label: 'concluído', isPositive: true },
            suffix: '%'
        }
    ]

    const isLoading = isLoadingReports || isLoadingAttendances || isLoadingProfitDistributions

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
                                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                                        <DollarSign className="w-4 h-4 text-white" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                        Gestão Financeira
                                    </h1>
                                </div>
                                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                    Controle completo das suas finanças e distribuição de lucros
                                </p>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                {/* Status Badge */}
                                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg shadow-emerald-500/25 text-xs">
                                    <Activity className="w-3 h-3 mr-1" />
                                    <span className="hidden sm:inline">Sistema Online</span>
                                    <span className="sm:hidden">Online</span>
                                </Badge>

                                {/* Botões de Ação */}
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <button
                                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                                        onClick={handleRefresh}
                                        disabled={isLoading}
                                    >
                                        <RefreshCw className={`w-4 h-4 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
                                    </button>
                                    <button
                                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                                        onClick={clearFilters}
                                    >
                                        <Filter className="w-4 h-4 text-slate-600" />
                                    </button>
                                    <button
                                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                                        onClick={handleExportData}
                                    >
                                        <Download className="w-4 h-4 text-slate-600" />
                                    </button>
                                    <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                        <Bell className="w-4 h-4 text-slate-600" />
                                    </button>
                                </div>

                                {/* Botões Principais */}
                                <div className="flex items-center gap-2 ml-2">
                                    <Link href="/financeiro/distribuicao-lucros">
                                        <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50 shadow-sm">
                                            <PieChart className="w-4 h-4 mr-2" />
                                            Distribuição
                                        </Button>
                                    </Link>
                                    <Link href="/financeiro/fluxo-caixa">
                                        <Button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-500/25 border-0">
                                            <TrendingUp className="w-4 h-4 mr-2" />
                                            Fluxo de Caixa
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Conteúdo */}
                <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

                        {/* Métricas Rápidas */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                            {quickMetrics.map((metric, index) => (
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
                                                {metric.suffix ?
                                                    `${metric.value.toLocaleString()}${metric.suffix}` :
                                                    metric.value.toLocaleString('pt-BR', {
                                                        style: 'currency',
                                                        currency: 'BRL'
                                                    })
                                                }
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className={`w-3 h-3 ${metric.trend.isPositive ? 'text-emerald-500' : 'text-red-500'}`} />
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
                                <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    Overview
                                </TabsTrigger>
                                <TabsTrigger value="attendances" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                                    <Receipt className="w-4 h-4 mr-2" />
                                    Atendimentos
                                </TabsTrigger>
                                <TabsTrigger value="analysis" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                                    <TrendingUp className="w-4 h-4 mr-2" />
                                    Análises
                                </TabsTrigger>
                            </TabsList>

                            {/* Tab: Overview */}
                            <TabsContent value="overview" className="space-y-6">
                                {/* Métricas Principais */}
                                <FinancialMetrics
                                    summary={financialSummary}
                                    isLoading={isLoadingReports}
                                />

                                {/* Métricas de Status de Pagamento */}
                                <PaymentStatusMetrics
                                    summary={financialSummary}
                                    isLoading={isLoadingReports}
                                />

                                {/* Grid de Gráficos */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Gráfico de Receita */}
                                    <RevenueChart
                                        data={revenueByPeriod}
                                        isLoading={isLoadingReports}
                                        title="Evolução da Receita"
                                        chartType="area"
                                        showProfit={true}
                                        onRefresh={handleRefresh}
                                    />

                                    {/* Gráfico de Distribuição de Lucros */}
                                    <ProfitDistributionChart
                                        summary={profitDistributionSummary}
                                        isLoading={isLoadingProfitDistributions}
                                        chartType="pie"
                                        onRefresh={handleRefresh}
                                    />
                                </div>
                            </TabsContent>

                            {/* Tab: Atendimentos */}
                            <TabsContent value="attendances" className="space-y-6">
                                {/* Filtros */}
                                <FinancialFilters
                                    filters={filters}
                                    onFiltersChange={(newFilters) => {
                                        Object.entries(newFilters).forEach(([key, value]) => {
                                            updateFilter(key as any, value)
                                        })
                                    }}
                                    onClearFilters={clearFilters}
                                    hasActiveFilters={hasActiveFilters}
                                    isLoading={isLoadingAttendances}
                                    onExport={handleExportData}
                                    onRefresh={handleRefresh}
                                />

                                {/* Tabela de Atendimentos */}
                                <AttendanceTable
                                    attendances={attendancesWithDetails}
                                    isLoading={isLoadingAttendances}
                                    onUpdatePaymentStatus={handlePaymentStatusUpdate}
                                    onGenerateReceipt={handleGenerateReceipt}
                                />
                            </TabsContent>

                            {/* Tab: Análises */}
                            <TabsContent value="analysis" className="space-y-6">
                                {/* Cards de Análise Rápida */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                                            <CardTitle className="flex items-center gap-2 text-blue-700">
                                                <TrendingUp className="w-5 h-5" />
                                                Crescimento
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-sm text-slate-600">Receita vs Mês Anterior</p>
                                                    <p className="text-2xl font-bold text-blue-600">+15.2%</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-600">Lucro vs Mês Anterior</p>
                                                    <p className="text-2xl font-bold text-emerald-600">+8.7%</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
                                            <CardTitle className="flex items-center gap-2 text-purple-700">
                                                <Calculator className="w-5 h-5" />
                                                Eficiência
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-sm text-slate-600">Margem de Lucro</p>
                                                    <p className="text-2xl font-bold text-purple-600">
                                                        {financialSummary && financialSummary.totalRevenue > 0
                                                            ? ((financialSummary.totalProfit / financialSummary.totalRevenue) * 100).toFixed(1)
                                                            : '0'
                                                        }%
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-600">Taxa de Conversão</p>
                                                    <p className="text-2xl font-bold text-orange-600">
                                                        {financialSummary?.conversionRate.toFixed(1) || '0'}%
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-b border-emerald-200">
                                            <CardTitle className="flex items-center gap-2 text-emerald-700">
                                                <Target className="w-5 h-5" />
                                                Metas
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-sm text-slate-600">Meta Mensal</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 bg-slate-200 rounded-full h-2">
                                                            <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '85%' }} />
                                                        </div>
                                                        <span className="text-sm font-bold text-emerald-600">85%</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-600">Próxima Meta</p>
                                                    <p className="text-lg font-bold text-slate-700">R$ 5.000 em 2 dias</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Gráfico de Receita Expandido */}
                                <RevenueChart
                                    data={revenueByPeriod}
                                    isLoading={isLoadingReports}
                                    title="Análise Detalhada de Receita"
                                    chartType="line"
                                    showProfit={true}
                                    showTransactions={true}
                                    onRefresh={handleRefresh}
                                />
                            </TabsContent>
                        </Tabs>

                        {/* Links Rápidos para Outras Páginas */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-500" />
                                    Ações Rápidas
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <Link href="/financeiro/distribuicao-lucros">
                                        <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-slate-200">
                                            <CardContent className="p-4 text-center">
                                                <PieChart className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                                                <h4 className="font-semibold text-slate-900 mb-1">Distribuição de Lucros</h4>
                                                <p className="text-xs text-slate-500">Configure e execute distribuições</p>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                    <Link href="/financeiro/fluxo-caixa">
                                        <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-slate-200">
                                            <CardContent className="p-4 text-center">
                                                <TrendingUp className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                                <h4 className="font-semibold text-slate-900 mb-1">Fluxo de Caixa</h4>
                                                <p className="text-xs text-slate-500">Acompanhe entradas e saídas</p>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                    <Link href="/financeiro/metas">
                                        <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-slate-200">
                                            <CardContent className="p-4 text-center">
                                                <Target className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                                                <h4 className="font-semibold text-slate-900 mb-1">Metas Financeiras</h4>
                                                <p className="text-xs text-slate-500">Defina e acompanhe metas</p>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                    <Link href="/financeiro/projecoes">
                                        <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-slate-200">
                                            <CardContent className="p-4 text-center">
                                                <Calculator className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                                                <h4 className="font-semibold text-slate-900 mb-1">Projeções</h4>
                                                <p className="text-xs text-slate-500">Previsões e cenários futuros</p>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default FinanceiroPage