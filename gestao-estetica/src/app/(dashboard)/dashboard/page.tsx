'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    CalendarDays,
    DollarSign,
    Users,
    TrendingUp,
    Heart,
    Bell,
    RefreshCw,
    PieChart,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Settings,
    Menu,
    X
} from 'lucide-react'

import { Chart } from '@/components/dashboard/Chart'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardTabs } from '@/components/dashboard/DashboardTabs'
import { useAppointments } from "@/lib/hooks/useAppointment"
import { useFinancials } from "@/lib/hooks/useFinancials"
import { useClientStats, useUpcomingBirthdays } from "@/lib/hooks/useClients"

// Tipos mantidos
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

// Loading Skeleton simplificado e mais eficiente
const MetricSkeleton = () => (
    <Card className="h-[140px] animate-pulse">
        <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-slate-200 rounded-lg" />
                <div className="w-12 h-4 bg-slate-200 rounded" />
            </div>
            <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-24" />
                <div className="h-7 bg-slate-200 rounded w-20" />
                <div className="h-3 bg-slate-200 rounded w-28" />
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
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // Hooks mantidos exatamente como estavam
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

    // Estados locais mantidos
    const [todayAppointments, setTodayAppointments] = useState<any[]>([])
    const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([])
    const [dashboardData, setDashboardData] = useState<DashboardData>({
        revenue: [],
        appointments: [],
        profitDistribution: []
    })

    const [revenueDetailedData, setRevenueDetailedData] = useState<RevenueData[]>([])

    // Função de refresh mantida
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
            setTimeout(() => setIsRefreshing(false), 500)
        }
    }

    // useEffects mantidos
    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                await fetchFinancialSummary(
                    dateRange.from.toISOString().split('T')[0],
                    dateRange.to.toISOString().split('T')[0]
                )

                await fetchMonthlyReport(
                    new Date().getMonth() + 1,
                    new Date().getFullYear()
                )

                await fetchRevenueByPeriod(
                    dateRange.from.toISOString().split('T')[0],
                    dateRange.to.toISOString().split('T')[0],
                    'day'
                )

                await fetchProfitDistributionSummary(
                    '',
                    dateRange.from.toISOString().split('T')[0],
                    dateRange.to.toISOString().split('T')[0]
                )

                const todayAppts = await getTodayAppointments()
                setTodayAppointments(todayAppts)

                const upcomingAppts = await getUpcomingAppointments(7)
                setUpcomingAppointments(upcomingAppts)

            } catch (error) {
                console.error('Erro ao carregar dados do dashboard:', error)
            }
        }

        loadDashboardData()
    }, [dateRange])

    useEffect(() => {
        if (revenueByPeriod && revenueByPeriod.length > 0) {
            setDashboardData(prev => ({
                ...prev,
                revenue: revenueByPeriod.map(item => ({
                    date: item.date,
                    value: item.revenue
                }))
            }))

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

    // Formatadores mantidos
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

    const formatBirthday = (birthday: string | null) => {
        if (!birthday) return ''
        return new Date(birthday).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
        })
    }

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

    // Dados das métricas simplificados para melhor usabilidade
    const metricsData = [
        {
            title: 'Receita Total',
            value: financialSummary?.totalRevenue || 0,
            format: 'currency' as const,
            icon: DollarSign,
            trend: { value: 12.5, label: 'vs mês anterior', isPositive: true },
            color: 'emerald'
        },
        {
            title: 'Hoje',
            value: todayAppointments.length,
            format: 'number' as const,
            icon: CalendarDays,
            trend: { value: todayAppointments.length, label: 'agendamentos', isPositive: true },
            color: 'blue'
        },
        {
            title: 'Clientes',
            value: clientStats?.total || 0,
            format: 'number' as const,
            icon: Users,
            trend: { value: 15, label: 'novos este mês', isPositive: true },
            color: 'purple'
        },
        {
            title: 'Conversão',
            value: financialSummary?.conversionRate || 0,
            format: 'percentage' as const,
            icon: TrendingUp,
            trend: { value: -2.1, label: 'vs mês anterior', isPositive: false },
            color: 'orange'
        }
    ]

    const isAnyLoading = appointmentsLoading || isLoadingReports || clientStatsLoading || birthdaysLoading

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Sidebar responsiva */}
            <Sidebar />

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Conteúdo Principal */}
            <div className="lg:ml-64">
                {/* Header simplificado e mais funcional */}
                <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
                    <div className="px-4 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            {/* Título e info */}
                            <div className="flex items-center gap-4">
                                <button
                                    className="lg:hidden p-2 -ml-2"
                                    onClick={() => setSidebarOpen(true)}
                                >
                                    <Menu className="w-5 h-5" />
                                </button>
                                <div>
                                    <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
                                    <p className="text-sm text-slate-500">
                                        {new Date().toLocaleDateString('pt-BR', {
                                            weekday: 'long',
                                            day: '2-digit',
                                            month: 'long'
                                        })}
                                    </p>
                                </div>
                            </div>

                            {/* Ações rápidas */}
                            <div className="flex items-center gap-2">
                                {/* Notificações importantes */}
                                {upcomingBirthdays && upcomingBirthdays.length > 0 && (
                                    <Badge variant="secondary" className="hidden sm:flex items-center gap-1">
                                        <Heart className="w-3 h-3" />
                                        {upcomingBirthdays.length} aniversário(s)
                                    </Badge>
                                )}

                                {/* Botões de ação */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRefresh}
                                    disabled={isRefreshing}
                                    className="p-2"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                </Button>

                                <Button variant="ghost" size="sm" className="p-2">
                                    <Bell className="w-4 h-4" />
                                </Button>

                                <Button variant="ghost" size="sm" className="p-2">
                                    <Settings className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Conteúdo */}
                <main className="p-4 lg:p-8 space-y-6">
                    <div className="max-w-7xl mx-auto">

                        {/* Alertas importantes no topo */}
                        {upcomingBirthdays && upcomingBirthdays.length > 0 && (
                            <Card className="border-l-4 border-l-pink-500 bg-pink-50/50">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <Heart className="w-5 h-5 text-pink-500" />
                                        <div>
                                            <p className="font-medium text-pink-900">
                                                {upcomingBirthdays.length} aniversariante(s) próximo(s)
                                            </p>
                                            <p className="text-sm text-pink-700">
                                                {upcomingBirthdays.slice(0, 2).map(b => b.name).join(', ')}
                                                {upcomingBirthdays.length > 2 && ` e mais ${upcomingBirthdays.length - 2}`}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Métricas principais - layout otimizado */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {isAnyLoading ? (
                                Array.from({ length: 4 }).map((_, index) => (
                                    <MetricSkeleton key={index} />
                                ))
                            ) : (
                                metricsData.map((metric, index) => (
                                    <Card key={index} className="relative overflow-hidden hover:shadow-md transition-shadow">
                                        <CardContent className="p-4 lg:p-6">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className={`p-2 rounded-lg bg-${metric.color}-100`}>
                                                    <metric.icon className={`w-5 h-5 text-${metric.color}-600`} />
                                                </div>
                                                {metric.trend.isPositive ? (
                                                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                                                ) : (
                                                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-slate-600">{metric.title}</p>
                                                <p className="text-2xl font-bold text-slate-900">
                                                    {metric.format === 'currency'
                                                        ? formatCurrency(metric.value)
                                                        : metric.format === 'percentage'
                                                            ? `${metric.value}%`
                                                            : metric.value.toLocaleString()
                                                    }
                                                </p>
                                                <p className={`text-xs ${metric.trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {metric.trend.isPositive ? '+' : ''}{Math.abs(metric.trend.value)} {metric.trend.label}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>

                        {/* Gráficos - layout responsivo melhorado */}
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                            {/* Gráfico principal */}
                            <div className="xl:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="flex items-center gap-2">
                                                    <BarChart3 className="w-5 h-5 text-blue-500" />
                                                    Receita por Período
                                                </CardTitle>
                                                <CardDescription>Evolução da receita nos últimos 30 dias</CardDescription>
                                            </div>
                                            <Badge variant="outline">
                                                <TrendingUp className="w-3 h-3 mr-1" />
                                                +12.5%
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
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

                            {/* Gráfico secundário */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <PieChart className="w-5 h-5 text-purple-500" />
                                        Clientes por Segmento
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Chart
                                        title=""
                                        description=""
                                        data={clientStats?.clientsBySegment?.map(segment => ({
                                            name: segment.segment,
                                            value: segment.count
                                        })) || []}
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

                        {/* Próximos agendamentos - mais visível */}
                        {todayAppointments.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-green-500" />
                                        Agendamentos de Hoje ({todayAppointments.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {todayAppointments.slice(0, 6).map((appointment, index) => (
                                            <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                                <div className="w-2 h-8 bg-blue-500 rounded-full" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-slate-900 truncate">
                                                        {appointment.client || 'Cliente não definido'}
                                                    </p>
                                                    <p className="text-sm text-slate-500">
                                                        {appointment.time} - {appointment.procedure}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {todayAppointments.length > 6 && (
                                        <div className="mt-4 text-center">
                                            <Button variant="outline" size="sm">
                                                Ver todos os {todayAppointments.length} agendamentos
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Integração do DashboardTabs */}
                        <DashboardTabs
                            dashboardData={dashboardData}
                            revenueDetailedData={revenueDetailedData}
                            clientSegmentData={clientStats?.clientsBySegment?.map(segment => ({
                                name: segment.segment,
                                value: segment.count
                            })) || []}
                            appointmentsChartData={[
                                { name: 'Agendados', value: appointmentStats?.scheduled || 0 },
                                { name: 'Confirmados', value: appointmentStats?.confirmed || 0 },
                                { name: 'Concluídos', value: appointmentStats?.completed || 0 },
                                { name: 'Cancelados', value: appointmentStats?.cancelled || 0 },
                                { name: 'Não Compareceu', value: appointmentStats?.noShow || 0 }
                            ]}
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
                </main>
            </div>
        </div>
    )
}