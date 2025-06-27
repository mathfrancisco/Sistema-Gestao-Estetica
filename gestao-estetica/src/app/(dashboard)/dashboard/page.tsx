'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {CalendarDays, DollarSign, Users, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, Activity, UserPlus, Heart, Bell, Filter, Download, RefreshCw, ChevronRight, Sparkles, Target, PieChart, BarChart3
} from 'lucide-react'

import { Chart } from '@/components/dashboard/Chart'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { RevenueChart } from '@/components/charts/RevenueChart'
import { ProfitDistributionChart } from '@/components/charts/ProfitDistributionChart'
import { Sidebar } from '@/components/layout/sidebar'
import { useAppointments } from "@/lib/hooks/useAppointment"
import { useFinancials } from "@/lib/hooks/useFinancials"
import { useClientStats, useUpcomingBirthdays } from "@/lib/hooks/useClients"
import MainLayout from "@/app/(dashboard)/layout";

// Tipos atualizados
interface DashboardData {
    revenue: Array<{ date: string; value: number }>
    appointments: Array<{ date: string; scheduled: number; completed: number; cancelled: number }>
    profitDistribution: Array<{ category: string; value: number; percentage: number }>
}
interface RevenueData {
    date: string;
    revenue: number;
    profit: number;
    transactions: number;
}

export default function DashboardPage() {
    const [dateRange, setDateRange] = useState({
        from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        to: new Date()
    })

    // Hooks de Agendamentos
    const {
        stats: appointmentStats,
        loading: appointmentsLoading,
        error: appointmentsError,
        getTodayAppointments,
        getUpcomingAppointments,
        fetchStats: fetchAppointmentStats
    } = useAppointments({
        autoFetch: true
    })

    // Hooks Financeiros
    const {
        financialSummary,
        monthlyReport,
        revenueByPeriod,
        profitDistributionSummary,
        isLoadingReports,
        isLoadingProfitDistributions,
        error: financialError,
        fetchFinancialSummary,
        fetchMonthlyReport,
        fetchRevenueByPeriod,
        fetchProfitDistributionSummary
    } = useFinancials()

    // Hooks de Clientes
    const {
        data: clientStats,
        isLoading: clientStatsLoading,
        error: clientStatsError
    } = useClientStats()

    const {
        data: upcomingBirthdays,
        isLoading: birthdaysLoading,
        error: birthdaysError
    } = useUpcomingBirthdays(30)

    // Estados locais
    const [todayAppointments, setTodayAppointments] = useState<any[]>([])
    const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([])
    const [dashboardData, setDashboardData] = useState<DashboardData>({
        revenue: [],
        appointments: [],
        profitDistribution: []
    })

    // Estado separado para dados detalhados de receita
    const [revenueDetailedData, setRevenueDetailedData] = useState<RevenueData[]>([])

    // Carregamento dos dados
    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                // Buscar dados financeiros
                await fetchFinancialSummary(
                    dateRange.from.toISOString().split('T')[0],
                    dateRange.to.toISOString().split('T')[0]
                )

                // Buscar relatório mensal atual
                await fetchMonthlyReport(
                    new Date().getMonth() + 1,
                    new Date().getFullYear()
                )

                // Buscar receita por período
                await fetchRevenueByPeriod(
                    dateRange.from.toISOString().split('T')[0],
                    dateRange.to.toISOString().split('T')[0],
                    'day'
                )

                // Buscar distribuição de lucro
                await fetchProfitDistributionSummary(
                    '',
                    dateRange.from.toISOString().split('T')[0],
                    dateRange.to.toISOString().split('T')[0]
                )

                // Buscar agendamentos de hoje
                const todayAppts = await getTodayAppointments()
                setTodayAppointments(todayAppts)

                // Buscar próximos agendamentos
                const upcomingAppts = await getUpcomingAppointments(7)
                setUpcomingAppointments(upcomingAppts)

            } catch (error) {
                console.error('Erro ao carregar dados do dashboard:', error)
            }
        }

        loadDashboardData()
    }, [dateRange])

    // Processamento dos dados para os gráficos
    useEffect(() => {
        if (revenueByPeriod && revenueByPeriod.length > 0) {
            // Para o gráfico simples
            setDashboardData(prev => ({
                ...prev,
                revenue: revenueByPeriod.map(item => ({
                    date: item.date,
                    value: item.revenue
                }))
            }))

            // Para o RevenueChart detalhado
            setRevenueDetailedData(revenueByPeriod.map(item => ({
                date: item.date,
                revenue: item.revenue,
                profit: item.profit|| 0,
                transactions: item.transactions || 0
            })))
        }

        if (profitDistributionSummary?.distributions) {
            setDashboardData(prev => ({
                ...prev,
                profitDistribution: profitDistributionSummary.distributions.map(dist => ({
                    category: dist.category,
                    value: dist.amount,
                    percentage: dist.percentage
                }))
            }))
        }
    }, [revenueByPeriod, profitDistributionSummary])

    // Formatadores
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
        })
    }

    // Helper para formatar data de aniversário
    const formatBirthday = (birthday: string | null) => {
        if (!birthday) return ''
        return new Date(birthday).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
        })
    }

    // Helper para calcular dias até aniversário
    const getDaysUntilBirthday = (birthday: string | null) => {
        if (!birthday) return 0
        const today = new Date()
        const birthdayDate = new Date(birthday)
        const thisYearBirthday = new Date(today.getFullYear(), birthdayDate.getMonth(), birthdayDate.getDate())

        if (thisYearBirthday < today) {
            thisYearBirthday.setFullYear(today.getFullYear() + 1)
        }

        return Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }

    // Dados das métricas principais
    const metricsData = [
        {
            title: 'Receita Total',
            value: financialSummary?.totalRevenue || 0,
            format: 'currency' as const,
            icon: DollarSign,
            trend: {
                value: financialSummary?.totalRevenue || 0,
                label: 'vs mês anterior',
                isPositive: true
            },
            description: 'Receita total do período',
            gradient: 'from-emerald-500 to-emerald-600'
        },
        {
            title: 'Agendamentos Hoje',
            value: todayAppointments.length,
            format: 'number' as const,
            icon: CalendarDays,
            trend: {
                value: appointmentStats?.todayTotal || 0,
                label: 'total hoje',
                isPositive: true
            },
            description: 'Agendamentos para hoje',
            gradient: 'from-blue-500 to-blue-600'
        },
        {
            title: 'Total de Clientes',
            value: clientStats?.total || 0,
            format: 'number' as const,
            icon: Users,
            trend: {
                value: clientStats?.new || 0,
                label: 'novos este mês',
                isPositive: true
            },
            description: 'Total de clientes cadastrados',
            gradient: 'from-purple-500 to-purple-600'
        },
        {
            title: 'Taxa de Conversão',
            value: financialSummary?.conversionRate || 0,
            format: 'percentage' as const,
            icon: TrendingUp,
            trend: {
                value: financialSummary?.conversionGrowth || 0,
                label: 'vs mês anterior',
                isPositive: true
            },
            description: 'Agendamentos → Atendimentos',
            gradient: 'from-orange-500 to-orange-600'
        }
    ]

    // Dados para gráfico de agendamentos
    const appointmentsChartData = [
        { name: 'Agendados', value: appointmentStats?.scheduled || 0 },
        { name: 'Confirmados', value: appointmentStats?.confirmed || 0 },
        { name: 'Concluídos', value: appointmentStats?.completed || 0 },
        { name: 'Cancelados', value: appointmentStats?.cancelled || 0 },
        { name: 'Não Compareceu', value: appointmentStats?.noShow || 0 }
    ]

    // Dados para gráfico de clientes por segmento
    const clientSegmentData = clientStats?.clientsBySegment?.map(segment => ({
        name: segment.segment,
        value: segment.count
    })) || []

    return (
        <MainLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                {/* Sidebar */}
                <Sidebar />

                {/* Conteúdo Principal */}
                <div className="lg:ml-64">
                    {/* Header Moderno */}
                    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
                        <div className="px-6 lg:px-8 py-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                            <Sparkles className="w-4 h-4 text-white" />
                                        </div>
                                        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                            Dashboard
                                        </h1>
                                    </div>
                                    <p className="text-slate-600 text-sm font-medium">
                                        {new Date().toLocaleDateString('pt-BR', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Notificações */}
                                    {upcomingBirthdays && upcomingBirthdays.length > 0 && (
                                        <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 shadow-lg shadow-pink-500/25">
                                            <Heart className="w-3 h-3 mr-1" />
                                            {upcomingBirthdays.length} aniversariantes
                                        </Badge>
                                    )}

                                    <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg shadow-emerald-500/25">
                                        <Activity className="w-3 h-3 mr-1" />
                                        Sistema Online
                                    </Badge>

                                    {/* Botões de Ação */}
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                            <RefreshCw className="w-4 h-4 text-slate-600" />
                                        </button>
                                        <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                            <Filter className="w-4 h-4 text-slate-600" />
                                        </button>
                                        <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                            <Download className="w-4 h-4 text-slate-600" />
                                        </button>
                                        <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                            <Bell className="w-4 h-4 text-slate-600" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Conteúdo */}
                    <main className="px-6 lg:px-8 py-8">
                        <div className="max-w-7xl mx-auto space-y-8">

                            {/* Métricas Principais com Design Moderno */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {metricsData.map((metric, index) => (
                                    <Card key={index} className="relative overflow-hidden border-0 shadow-xl shadow-slate-200/60 hover:shadow-2xl hover:shadow-slate-300/60 transition-all duration-300 hover:-translate-y-1">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-5`} />
                                        <CardContent className="p-6 relative">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`p-3 rounded-2xl bg-gradient-to-br ${metric.gradient} shadow-lg`}>
                                                    <metric.icon className="w-6 h-6 text-white" />
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-slate-400" />
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-slate-600">{metric.title}</p>
                                                <p className="text-3xl font-bold text-slate-900">
                                                    {metric.format === 'currency'
                                                        ? formatCurrency(metric.value)
                                                        : metric.format === 'percentage'
                                                            ? `${metric.value}%`
                                                            : metric.value.toLocaleString()
                                                    }
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                                                    <span className="text-xs text-emerald-600 font-medium">
                                                        {metric.trend.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Gráficos Principais com Layout Melhorado */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Gráfico de Receita - Ocupa 2 colunas */}
                                <div className="lg:col-span-2">
                                    <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="flex items-center gap-2 text-xl">
                                                        <BarChart3 className="w-5 h-5 text-blue-500" />
                                                        Receita por Período
                                                    </CardTitle>
                                                    <CardDescription className="mt-1">
                                                        Evolução da receita nos últimos 30 dias
                                                    </CardDescription>
                                                </div>
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                    <TrendingUp className="w-3 h-3 mr-1" />
                                                    +12.5%
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <Chart
                                                title=""
                                                description=""
                                                data={dashboardData.revenue}
                                                type="area"
                                                height={300}
                                                loading={isLoadingReports}
                                                xAxisKey="date"
                                                yAxisKey="value"
                                                colors={['#3b82f6']}
                                                showGrid={true}
                                                formatters={{
                                                    x: formatDate,
                                                    y: formatCurrency
                                                }}
                                            />
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Gráfico de Pizza - 1 coluna */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2">
                                            <PieChart className="w-5 h-5 text-purple-500" />
                                            Clientes por Segmento
                                        </CardTitle>
                                        <CardDescription>
                                            Distribuição de clientes
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <Chart
                                            title=""
                                            description=""
                                            data={clientSegmentData}
                                            type="pie"
                                            height={300}
                                            loading={clientStatsLoading}
                                            yAxisKey="value"
                                            colors={['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']}
                                            showLegend={true}
                                        />
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Tabs com Design Moderno */}
                            <Tabs defaultValue="overview" className="space-y-8">
                                <TabsList className="grid w-full grid-cols-5 bg-slate-100 p-1 rounded-2xl shadow-inner">
                                    <TabsTrigger value="overview" className="rounded-xl font-medium data-[state=active]:bg-white data-[state=active]:shadow-md">
                                        Visão Geral
                                    </TabsTrigger>
                                    <TabsTrigger value="financial" className="rounded-xl font-medium data-[state=active]:bg-white data-[state=active]:shadow-md">
                                        Financeiro
                                    </TabsTrigger>
                                    <TabsTrigger value="clients" className="rounded-xl font-medium data-[state=active]:bg-white data-[state=active]:shadow-md">
                                        Clientes
                                    </TabsTrigger>
                                    <TabsTrigger value="appointments" className="rounded-xl font-medium data-[state=active]:bg-white data-[state=active]:shadow-md">
                                        Agendamentos
                                    </TabsTrigger>
                                    <TabsTrigger value="analytics" className="rounded-xl font-medium data-[state=active]:bg-white data-[state=active]:shadow-md">
                                        Análises
                                    </TabsTrigger>
                                </TabsList>

                                {/* Tab Visão Geral */}
                                <TabsContent value="overview" className="space-y-8">
                                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                        {/* Gráfico de Receita Detalhado */}
                                        <div className="lg:col-span-3">
                                            <Card className="border-0 shadow-xl shadow-slate-200/60">
                                                <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
                                                    <CardTitle className="flex items-center gap-2 text-emerald-800">
                                                        <Target className="w-5 h-5" />
                                                        Receita Detalhada
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-6">
                                                    <RevenueChart
                                                        data={revenueDetailedData}
                                                        loading={isLoadingReports}
                                                        title=""
                                                        height={400}
                                                    />
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Ações Rápidas */}
                                        <div>
                                            <QuickActions />
                                        </div>
                                    </div>

                                    {/* Atividade Recente */}
                                    <RecentActivity
                                        activities={upcomingAppointments.slice(0, 5).map(appointment => ({
                                            id: appointment.id || String(Math.random()),
                                            type: 'appointment',
                                            title: appointment.patient?.name || 'Cliente',
                                            description: appointment.service?.name || 'Consulta',
                                            timestamp: appointment.scheduled_datetime,
                                            status: appointment.status === 'confirmed' ? 'success' :
                                                appointment.status === 'cancelled' ? 'error' : 'info',
                                            client: {
                                                name: appointment.patient?.name || 'Cliente',
                                                avatar: appointment.patient?.avatar
                                            }
                                        }))}
                                        loading={appointmentsLoading}
                                    />
                                </TabsContent>

                                {/* Tab Financeiro */}
                                <TabsContent value="financial" className="space-y-8">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Resumo Financeiro */}
                                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                                            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
                                                <CardTitle className="flex items-center gap-2 text-emerald-800">
                                                    <DollarSign className="w-5 h-5" />
                                                    Resumo Financeiro
                                                </CardTitle>
                                                <CardDescription>
                                                    Métricas financeiras do período atual
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-6 space-y-6">
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <p className="text-sm font-medium text-slate-600">Receita Bruta</p>
                                                        <p className="text-2xl font-bold text-emerald-600">
                                                            {formatCurrency(financialSummary?.totalRevenue || 0)}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="text-sm font-medium text-slate-600">Receita Líquida</p>
                                                        <p className="text-2xl font-bold text-emerald-600">
                                                            {formatCurrency(financialSummary?.totalProfit || 0)}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="text-sm font-medium text-slate-600">Ticket Médio</p>
                                                        <p className="text-2xl font-bold text-slate-900">
                                                            {formatCurrency(financialSummary?.averageTicket || 0)}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="text-sm font-medium text-slate-600">Transações</p>
                                                        <p className="text-2xl font-bold text-slate-900">
                                                            {financialSummary?.transactionCount || 0}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Distribuição de Lucro */}
                                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                                                <CardTitle className="flex items-center gap-2 text-blue-800">
                                                    <PieChart className="w-5 h-5" />
                                                    Distribuição de Lucro
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                <ProfitDistributionChart
                                                    data={dashboardData.profitDistribution}
                                                    loading={isLoadingProfitDistributions}
                                                    title=""
                                                />
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>

                                {/* Tab Clientes */}
                                <TabsContent value="clients" className="space-y-8">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Estatísticas de Clientes */}
                                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                                            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                                                <CardTitle className="flex items-center gap-2 text-purple-800">
                                                    <Users className="w-5 h-5" />
                                                    Estatísticas de Clientes
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                <div className="space-y-6">
                                                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                                <Users className="w-4 h-4 text-blue-600" />
                                                            </div>
                                                            <span className="font-medium text-slate-700">Total de Clientes</span>
                                                        </div>
                                                        <span className="text-xl font-bold text-blue-600">
                                                            {clientStats?.total || 0}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-emerald-100 rounded-lg">
                                                                <UserPlus className="w-4 h-4 text-emerald-600" />
                                                            </div>
                                                            <span className="font-medium text-slate-700">Novos este Mês</span>
                                                        </div>
                                                        <span className="text-xl font-bold text-emerald-600">
                                                            {clientStats?.new || 0}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-purple-100 rounded-lg">
                                                                <Activity className="w-4 h-4 text-purple-600" />
                                                            </div>
                                                            <span className="font-medium text-slate-700">Clientes Ativos</span>
                                                        </div>
                                                        <span className="text-xl font-bold text-purple-600">
                                                            {clientStats?.active || 0}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between p-4 bg-pink-50 rounded-xl">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-pink-100 rounded-lg">
                                                                <Heart className="w-4 h-4 text-pink-600" />
                                                            </div>
                                                            <span className="font-medium text-slate-700">Aniversariantes (30 dias)</span>
                                                        </div>
                                                        <span className="text-xl font-bold text-pink-600">
                                                            {upcomingBirthdays?.length || 0}
                                                        </span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Aniversariantes Próximos */}
                                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                                            <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-100">
                                                <CardTitle className="flex items-center gap-2 text-pink-800">
                                                    <Heart className="w-5 h-5 text-pink-600" />
                                                    Aniversariantes Próximos
                                                </CardTitle>
                                                <CardDescription className="text-pink-600">
                                                    Próximos 30 dias
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                <div className="space-y-4">
                                                    {upcomingBirthdays?.slice(0, 5).map((client, index) => (
                                                        <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-100 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg">
                                                                    <Heart className="w-5 h-5 text-white" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-slate-800">{client.name}</p>
                                                                    <p className="text-sm text-slate-600">
                                                                        {client.phone || client.email}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-semibold text-slate-700 mb-1">
                                                                    {formatBirthday(client.birthday)}
                                                                </p>
                                                                <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 shadow-sm text-xs">
                                                                    {getDaysUntilBirthday(client.birthday)} dias
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {(!upcomingBirthdays || upcomingBirthdays.length === 0) && (
                                                        <div className="text-center py-8">
                                                            <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                                <Heart className="w-8 h-8 text-pink-400" />
                                                            </div>
                                                            <p className="text-slate-500 font-medium">
                                                                Nenhum aniversário próximo
                                                            </p>
                                                            <p className="text-sm text-slate-400 mt-1">
                                                                Os aniversários aparecerão aqui quando estiverem próximos
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                </div>
                            </TabsContent>

                                {/* Tab Agendamentos */}
                                <TabsContent value="appointments" className="space-y-8">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Estatísticas de Agendamentos */}
                                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                                                <CardTitle className="flex items-center gap-2 text-blue-800">
                                                    <CalendarDays className="w-5 h-5" />
                                                    Estatísticas de Agendamentos
                                                </CardTitle>
                                                <CardDescription className="text-blue-600">
                                                    Resumo dos agendamentos por status
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                <div className="space-y-6">
                                                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl hover:shadow-md transition-all duration-200">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                                <Clock className="w-4 h-4 text-blue-600" />
                                                            </div>
                                                            <span className="font-medium text-slate-700">Agendados</span>
                                                        </div>
                                                        <span className="text-xl font-bold text-blue-600">
                            {appointmentStats?.scheduled || 0}
                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl hover:shadow-md transition-all duration-200">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-emerald-100 rounded-lg">
                                                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                                            </div>
                                                            <span className="font-medium text-slate-700">Concluídos</span>
                                                        </div>
                                                        <span className="text-xl font-bold text-emerald-600">
                            {appointmentStats?.completed || 0}
                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl hover:shadow-md transition-all duration-200">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-red-100 rounded-lg">
                                                                <XCircle className="w-4 h-4 text-red-600" />
                                                            </div>
                                                            <span className="font-medium text-slate-700">Cancelados</span>
                                                        </div>
                                                        <span className="text-xl font-bold text-red-600">
                            {appointmentStats?.cancelled || 0}
                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl hover:shadow-md transition-all duration-200">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-yellow-100 rounded-lg">
                                                                <AlertCircle className="w-4 h-4 text-yellow-600" />
                                                            </div>
                                                            <span className="font-medium text-slate-700">Não Compareceu</span>
                                                        </div>
                                                        <span className="text-xl font-bold text-yellow-600">
                            {appointmentStats?.noShow || 0}
                        </span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Agendamentos de Hoje */}
                                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                                            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
                                                <CardTitle className="flex items-center gap-2 text-emerald-800">
                                                    <CalendarDays className="w-5 h-5" />
                                                    Agendamentos de Hoje
                                                </CardTitle>
                                                <CardDescription className="text-emerald-600">
                                                    {todayAppointments.length} agendamentos para hoje
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                <div className="space-y-4">
                                                    {todayAppointments.slice(0, 5).map((appointment, index) => (
                                                        <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                                                                    <CalendarDays className="w-5 h-5 text-white" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-slate-800">{appointment.patient?.name || 'Cliente'}</p>
                                                                    <p className="text-sm text-slate-600">
                                                                        {appointment.service?.name || 'Serviço'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-semibold text-slate-700 mb-1">
                                                                    {new Date(appointment.scheduled_datetime).toLocaleTimeString('pt-BR', {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </p>
                                                                <Badge
                                                                    className={`text-xs border-0 shadow-sm ${
                                                                        appointment.status === 'confirmed' ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white' :
                                                                            appointment.status === 'cancelled' ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white' :
                                                                                appointment.status === 'completed' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' :
                                                                                    'bg-gradient-to-r from-slate-500 to-gray-500 text-white'
                                                                    }`}
                                                                >
                                                                    {appointment.status}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {todayAppointments.length === 0 && (
                                                        <div className="text-center py-8">
                                                            <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                                <CalendarDays className="w-8 h-8 text-slate-400" />
                                                            </div>
                                                            <p className="text-slate-500 font-medium">
                                                                Nenhum agendamento para hoje
                                                            </p>
                                                            <p className="text-sm text-slate-400 mt-1">
                                                                Os agendamentos de hoje aparecerão aqui
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>

                                {/* Tab Análises */}
                                <TabsContent value="analytics" className="space-y-8">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Gráfico de Barras - Receita por Dia */}
                                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                                            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <CardTitle className="flex items-center gap-2 text-emerald-800">
                                                            <BarChart3 className="w-5 h-5" />
                                                            Receita Diária
                                                        </CardTitle>
                                                        <CardDescription className="text-emerald-600 mt-1">
                                                            Receita por dia nos últimos 30 dias
                                                        </CardDescription>
                                                    </div>
                                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                                        <TrendingUp className="w-3 h-3 mr-1" />
                                                        Tendência
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                <Chart
                                                    title=""
                                                    description=""
                                                    data={dashboardData.revenue}
                                                    type="bar"
                                                    height={300}
                                                    loading={isLoadingReports}
                                                    xAxisKey="date"
                                                    yAxisKey="value"
                                                    colors={['#10b981']}
                                                    showGrid={true}
                                                    formatters={{
                                                        x: formatDate,
                                                        y: formatCurrency
                                                    }}
                                                />
                                            </CardContent>
                                        </Card>

                                        {/* Gráfico de Agendamentos por Status */}
                                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                                            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <CardTitle className="flex items-center gap-2 text-purple-800">
                                                            <PieChart className="w-5 h-5" />
                                                            Agendamentos por Status
                                                        </CardTitle>
                                                        <CardDescription className="text-purple-600 mt-1">
                                                            Distribuição dos agendamentos por status
                                                        </CardDescription>
                                                    </div>
                                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                                        <Activity className="w-3 h-3 mr-1" />
                                                        Análise
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                <Chart
                                                    title=""
                                                    description=""
                                                    data={appointmentsChartData}
                                                    type="bar"
                                                    height={300}
                                                    loading={appointmentsLoading}
                                                    yAxisKey="value"
                                                    colors={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']}
                                                    showLegend={true}
                                                    showGrid={true}
                                                />
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>
                        </Tabs>

                        {/* Error Display */}
                        {(appointmentsError || financialError || clientStatsError || birthdaysError) && (
                            <Card className="border-red-200 bg-red-50">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-2 text-red-600">
                                        <AlertCircle className="w-4 h-4" />
                                        {appointmentsError || financialError || clientStatsError || birthdaysError ? (
                                            <span className="text-sm">
                                        {String(appointmentsError || financialError || clientStatsError || birthdaysError)}
                                         </span>
                                        ) : null}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </main>
            </div>
        </div>
            </MainLayout> )
}