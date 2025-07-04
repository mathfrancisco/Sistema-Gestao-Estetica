'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    CalendarDays,
    DollarSign,
    Users,
    TrendingUp,
    Activity,
    Heart,
    Bell,
    Filter,
    Download,
    RefreshCw,
    ChevronRight,
    Sparkles,
    PieChart,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Zap
} from 'lucide-react'

import { Chart } from '@/components/dashboard/Chart'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardTabs } from '@/components/dashboard/DashboardTabs'
import { useAppointments } from "@/lib/hooks/useAppointment"
import { useFinancials } from "@/lib/hooks/useFinancials"
import { useClientStats, useUpcomingBirthdays } from "@/lib/hooks/useClients"

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

// Loading Skeleton Component
const MetricSkeleton = () => (
    <Card className="relative overflow-hidden border-0 shadow-xl shadow-slate-200/60">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 opacity-10" />
        <CardContent className="p-4 lg:p-6 relative">
            <div className="flex items-center justify-between mb-3 lg:mb-4">
                <div className="p-2 lg:p-3 rounded-2xl bg-slate-200 animate-pulse">
                    <div className="w-5 h-5 lg:w-6 lg:h-6 bg-slate-300 rounded" />
                </div>
                <div className="w-4 h-4 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
                <div className="h-3 bg-slate-200 rounded animate-pulse w-3/4" />
                <div className="h-8 bg-slate-200 rounded animate-pulse w-1/2" />
                <div className="h-3 bg-slate-200 rounded animate-pulse w-2/3" />
            </div>
        </CardContent>
    </Card>
)

export default function DashboardPage() {
    const [dateRange, setDateRange] = useState({
        from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        to: new Date()
    })

    const [isRefreshing, setIsRefreshing] = useState(false)

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

    // Função de refresh melhorada
    const handleRefresh = async () => {
        setIsRefreshing(true)
        try {
            await Promise.all([
                fetchFinancialSummary(
                    dateRange.from.toISOString().split('T')[0],
                    dateRange.to.toISOString().split('T')[0]
                ),
                fetchMonthlyReport(
                    new Date().getMonth() + 1,
                    new Date().getFullYear()
                ),
                fetchRevenueByPeriod(
                    dateRange.from.toISOString().split('T')[0],
                    dateRange.to.toISOString().split('T')[0],
                    'day'
                ),
                fetchProfitDistributionSummary(
                    '',
                    dateRange.from.toISOString().split('T')[0],
                    dateRange.to.toISOString().split('T')[0]
                )
            ])
        } catch (error) {
            console.error('Erro ao atualizar dados:', error)
        } finally {
            setTimeout(() => setIsRefreshing(false), 500) // Adiciona um pequeno delay para melhor UX
        }
    }

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

    // Dados das métricas principais com melhorias visuais
    const metricsData = [
        {
            title: 'Receita Total',
            value: financialSummary?.totalRevenue || 0,
            format: 'currency' as const,
            icon: DollarSign,
            trend: {
                value: 12.5,
                label: 'vs mês anterior',
                isPositive: true
            },
            description: 'Receita total do período',
            gradient: 'from-emerald-500 via-emerald-600 to-emerald-700',
            bgGradient: 'from-emerald-50 to-emerald-100/50',
            shadowColor: 'shadow-emerald-500/20'
        },
        {
            title: 'Agendamentos Hoje',
            value: todayAppointments.length,
            format: 'number' as const,
            icon: CalendarDays,
            trend: {
                value: 8.2,
                label: 'vs ontem',
                isPositive: true
            },
            description: 'Agendamentos para hoje',
            gradient: 'from-blue-500 via-blue-600 to-blue-700',
            bgGradient: 'from-blue-50 to-blue-100/50',
            shadowColor: 'shadow-blue-500/20'
        },
        {
            title: 'Total de Clientes',
            value: clientStats?.total || 0,
            format: 'number' as const,
            icon: Users,
            trend: {
                value: 15.3,
                label: 'novos este mês',
                isPositive: true
            },
            description: 'Total de clientes cadastrados',
            gradient: 'from-purple-500 via-purple-600 to-purple-700',
            bgGradient: 'from-purple-50 to-purple-100/50',
            shadowColor: 'shadow-purple-500/20'
        },
        {
            title: 'Taxa de Conversão',
            value: financialSummary?.conversionRate || 0,
            format: 'percentage' as const,
            icon: TrendingUp,
            trend: {
                value: -2.1,
                label: 'vs mês anterior',
                isPositive: false
            },
            description: 'Agendamentos → Atendimentos',
            gradient: 'from-orange-500 via-orange-600 to-orange-700',
            bgGradient: 'from-orange-50 to-orange-100/50',
            shadowColor: 'shadow-orange-500/20'
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

    const isAnyLoading = appointmentsLoading || isLoadingReports || clientStatsLoading || birthdaysLoading

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-white to-slate-50/80">
            {/* Sidebar */}
            <Sidebar />

            {/* Conteúdo Principal */}
            <div className="lg:ml-64">
                {/* Header Moderno Melhorado */}
                <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
                    <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
                                            <Sparkles className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                                            Dashboard
                                        </h1>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                            <span className="text-xs text-emerald-600 font-medium">Sistema operando normalmente</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-slate-600 text-xs sm:text-sm font-medium ml-11">
                                    {new Date().toLocaleDateString('pt-BR', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                {/* Notificações Melhoradas */}
                                {upcomingBirthdays && upcomingBirthdays.length > 0 && (
                                    <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 shadow-lg shadow-pink-500/25 text-xs animate-pulse hover:animate-none transition-all duration-300">
                                        <Heart className="w-3 h-3 mr-1" />
                                        <span className="hidden sm:inline">{upcomingBirthdays.length} aniversariantes</span>
                                        <span className="sm:hidden">{upcomingBirthdays.length}</span>
                                    </Badge>
                                )}

                                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg shadow-emerald-500/25 text-xs">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
                                    <span className="hidden sm:inline">Sistema Online</span>
                                    <span className="sm:hidden">Online</span>
                                </Badge>

                                {/* Botões de Ação Melhorados */}
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <button
                                        className={`group p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all duration-200 hover:scale-105 active:scale-95 ${isRefreshing ? 'animate-pulse' : ''}`}
                                        onClick={handleRefresh}
                                        disabled={isRefreshing}
                                    >
                                        <RefreshCw className={`w-4 h-4 text-slate-600 group-hover:text-slate-700 transition-colors ${isRefreshing ? 'animate-spin' : ''}`} />
                                    </button>
                                    <button className="group p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all duration-200 hover:scale-105 active:scale-95">
                                        <Filter className="w-4 h-4 text-slate-600 group-hover:text-slate-700 transition-colors" />
                                    </button>
                                    <button className="group p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all duration-200 hover:scale-105 active:scale-95">
                                        <Download className="w-4 h-4 text-slate-600 group-hover:text-slate-700 transition-colors" />
                                    </button>
                                    <button className="group relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all duration-200 hover:scale-105 active:scale-95">
                                        <Bell className="w-4 h-4 text-slate-600 group-hover:text-slate-700 transition-colors" />
                                        {upcomingBirthdays && upcomingBirthdays.length > 0 && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-bounce" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Conteúdo */}
                <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

                        {/* Métricas Principais com Design Ultra-Moderno */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                            {isAnyLoading ? (
                                // Skeleton Loading
                                Array.from({ length: 4 }).map((_, index) => (
                                    <MetricSkeleton key={index} />
                                ))
                            ) : (
                                metricsData.map((metric, index) => (
                                    <Card key={index} className={`group relative overflow-hidden border-0 shadow-xl ${metric.shadowColor} hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:rotate-1 cursor-pointer`}>
                                        {/* Background Gradients */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${metric.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                                        <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`} />

                                        {/* Animated Border */}
                                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 animate-pulse" />

                                        <CardContent className="p-4 lg:p-6 relative z-10">
                                            <div className="flex items-center justify-between mb-3 lg:mb-4">
                                                <div className={`p-2 lg:p-3 rounded-2xl bg-gradient-to-br ${metric.gradient} shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                                                    <metric.icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                                                </div>
                                                <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform duration-300">
                                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                                                    <Zap className="w-3 h-3 text-slate-300 group-hover:text-yellow-500 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                                                </div>
                                            </div>

                                            <div className="space-y-1 lg:space-y-2">
                                                <p className="text-xs lg:text-sm font-medium text-slate-600 group-hover:text-slate-700 transition-colors">
                                                    {metric.title}
                                                </p>
                                                <p className="text-xl lg:text-3xl font-bold text-slate-900 leading-tight group-hover:scale-105 transition-transform duration-300 origin-left">
                                                    {metric.format === 'currency'
                                                        ? formatCurrency(metric.value)
                                                        : metric.format === 'percentage'
                                                            ? `${metric.value}%`
                                                            : metric.value.toLocaleString()
                                                    }
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    {metric.trend.isPositive ? (
                                                        <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                                                    ) : (
                                                        <ArrowDownRight className="w-3 h-3 text-red-500" />
                                                    )}
                                                    <span className={`text-xs font-medium ${metric.trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {metric.trend.isPositive ? '+' : ''}{metric.trend.value}% {metric.trend.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>

                        {/* Gráficos Principais com Layout Melhorado */}
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
                            {/* Gráfico de Receita - Ocupa 2 colunas */}
                            <div className="xl:col-span-2">
                                <Card className="group border-0 shadow-xl shadow-slate-200/60 overflow-hidden h-full hover:shadow-2xl transition-all duration-300">
                                    <CardHeader className="bg-gradient-to-r from-slate-50/80 to-white/80 backdrop-blur-sm border-b border-slate-100 p-4 lg:p-6">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                            <div>
                                                <CardTitle className="flex items-center gap-2 text-lg lg:text-xl group-hover:text-blue-600 transition-colors">
                                                    <div className="p-1 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                                                        <BarChart3 className="w-5 h-5 text-blue-500" />
                                                    </div>
                                                    Receita por Período
                                                </CardTitle>
                                                <CardDescription className="mt-1 text-sm">
                                                    Evolução da receita nos últimos 30 dias
                                                </CardDescription>
                                            </div>
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs hover:bg-blue-100 transition-colors">
                                                <TrendingUp className="w-3 h-3 mr-1" />
                                                +12.5%
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 lg:p-6">
                                        <Chart
                                            title=""
                                            description=""
                                            data={dashboardData.revenue}
                                            type="area"
                                            height={280}
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
                            <Card className="group border-0 shadow-xl shadow-slate-200/60 h-full hover:shadow-2xl transition-all duration-300">
                                <CardHeader className="bg-gradient-to-r from-slate-50/80 to-white/80 backdrop-blur-sm border-b border-slate-100 p-4 lg:p-6">
                                    <CardTitle className="flex items-center gap-2 text-lg group-hover:text-purple-600 transition-colors">
                                        <div className="p-1 rounded-lg bg-purple-100 group-hover:bg-purple-200 transition-colors">
                                            <PieChart className="w-5 h-5 text-purple-500" />
                                        </div>
                                        Clientes por Segmento
                                    </CardTitle>
                                    <CardDescription className="text-sm">
                                        Distribuição de clientes
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 lg:p-6">
                                    <Chart
                                        title=""
                                        description=""
                                        data={clientSegmentData}
                                        type="pie"
                                        height={280}
                                        loading={clientStatsLoading}
                                        yAxisKey="value"
                                        colors={['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']}
                                        showLegend={true}
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Integração do DashboardTabs */}
                        <div className="animate-fadeIn">
                            <DashboardTabs
                                dashboardData={dashboardData}
                                revenueDetailedData={revenueDetailedData}
                                clientSegmentData={clientSegmentData}
                                appointmentsChartData={appointmentsChartData}
                                isLoadingReports={isLoadingReports}
                                isLoadingProfitDistributions={isLoadingProfitDistributions}
                                clientStatsLoading={clientStatsLoading}
                                appointmentsLoading={appointmentsLoading}
                                birthdaysLoading={birthdaysLoading}
                                financialSummary={financialSummary ?? undefined}
                                clientStats={clientStats}
                                appointmentStats={appointmentStats ?? undefined}
                                upcomingAppointments={upcomingAppointments}
                                todayAppointments={todayAppointments}
                                upcomingBirthdays={upcomingBirthdays}
                                formatCurrency={formatCurrency}
                                formatBirthday={formatBirthday}
                                getDaysUntilBirthday={getDaysUntilBirthday}
                            />
                        </div>

                    </div>
                </main>
            </div>

            {/* CSS para animações customizadas */}
            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.6s ease-out;
                }
            `}</style>
        </div>
    )
}