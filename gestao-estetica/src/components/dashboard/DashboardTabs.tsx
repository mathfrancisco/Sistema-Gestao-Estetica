'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
    CalendarDays,
    DollarSign,
    Users,
    TrendingUp,
    Clock,
    Heart,
    Target,
    PieChart,
    BarChart3
} from 'lucide-react'

import { Chart } from '@/components/dashboard/Chart'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { RevenueChart } from '@/components/charts/RevenueChart'
import { ProfitDistributionChart } from '@/components/charts/ProfitDistributionChart'

// Interfaces para tipagem
interface RevenueData {
    date: string;
    revenue: number;
    profit: number;
    transactions: number;
}

interface DashboardData {
    revenue: Array<{ date: string; value: number }>
    appointments: Array<{ date: string; scheduled: number; completed: number; cancelled: number }>
    profitDistribution: Array<{ category: string; value: number; percentage: number }>
}

interface Client {
    name: string;
    birthday: string | null;
}

interface Appointment {
    id?: string;
    patient?: { name?: string; avatar?: string };
    service?: { name?: string };
    scheduled_datetime: string;
    status: string;
}

interface ClientStats {
    total: number;
    new: number;
    active: number;
    inactive: number;
    clientsBySegment?: Array<{ segment: string; count: number }>;
}

interface AppointmentStats {
    scheduled: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    noShow: number;
    total: number;
    todayTotal: number;
}

interface FinancialSummary {
    totalRevenue: number;
    totalProfit: number;
    averageTicket: number;
    transactionCount: number;
    conversionRate: number;
    conversionGrowth?: number;
}

interface DashboardTabsProps {
    // Dados dos gráficos
    dashboardData: DashboardData;
    revenueDetailedData: RevenueData[];
    clientSegmentData: Array<{ name: string; value: number }>;
    appointmentsChartData: Array<{ name: string; value: number }>;

    // Estados de loading
    isLoadingReports: boolean;
    isLoadingProfitDistributions: boolean;
    clientStatsLoading: boolean;
    appointmentsLoading: boolean;
    birthdaysLoading: boolean;

    // Dados das estatísticas
    financialSummary?: FinancialSummary;
    clientStats?: ClientStats;
    appointmentStats?: AppointmentStats;

    // Dados das listas
    upcomingAppointments: Appointment[];
    todayAppointments: Appointment[];
    upcomingBirthdays?: Client[];
}

// Funções utilitárias movidas para dentro do componente
const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

const formatBirthday = (birthday: string | null): string => {
    if (!birthday) return 'Não informado';

    try {
        const date = new Date(birthday);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
        });
    } catch {
        return 'Data inválida';
    }
};

const getDaysUntilBirthday = (birthday: string | null): number => {
    if (!birthday) return 0;

    try {
        const today = new Date();
        const birthDate = new Date(birthday);
        const thisYear = today.getFullYear();

        // Configura o aniversário para este ano
        const nextBirthday = new Date(thisYear, birthDate.getMonth(), birthDate.getDate());

        // Se já passou este ano, considera o próximo ano
        if (nextBirthday < today) {
            nextBirthday.setFullYear(thisYear + 1);
        }

        const diffTime = nextBirthday.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    } catch {
        return 0;
    }
};

export function DashboardTabs({
                                  dashboardData,
                                  revenueDetailedData,
                                  clientSegmentData,
                                  appointmentsChartData,
                                  isLoadingReports,
                                  isLoadingProfitDistributions,
                                  clientStatsLoading,
                                  appointmentsLoading,
                                  birthdaysLoading,
                                  financialSummary,
                                  clientStats,
                                  appointmentStats,
                                  upcomingAppointments,
                                  todayAppointments,
                                  upcomingBirthdays,
                              }: DashboardTabsProps) {

    return (
        <Tabs defaultValue="overview" className="space-y-6 lg:space-y-8">
            <div className="overflow-x-auto">
                <TabsList className="grid grid-cols-5 bg-slate-100 p-1 rounded-2xl shadow-inner min-w-max w-full">
                    <TabsTrigger value="overview" className="rounded-xl font-medium text-xs lg:text-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-slate-900 text-slate-600 px-3 lg:px-4 py-2">
                        Visão Geral
                    </TabsTrigger>
                    <TabsTrigger value="financial" className="rounded-xl font-medium text-xs lg:text-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-slate-900 text-slate-600 px-3 lg:px-4 py-2">
                        Financeiro
                    </TabsTrigger>
                    <TabsTrigger value="clients" className="rounded-xl font-medium text-xs lg:text-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-slate-900 text-slate-600 px-3 lg:px-4 py-2">
                        Clientes
                    </TabsTrigger>
                    <TabsTrigger value="appointments" className="rounded-xl font-medium text-xs lg:text-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-slate-900 text-slate-600 px-3 lg:px-4 py-2">
                        Agendamentos
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="rounded-xl font-medium text-xs lg:text-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-slate-900 text-slate-600 px-3 lg:px-4 py-2">
                        Análises
                    </TabsTrigger>
                </TabsList>
            </div>

            {/* Tab Visão Geral */}
            <TabsContent value="overview" className="space-y-6 lg:space-y-8">
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
                    {/* Gráfico de Receita Detalhado */}
                    <div className="xl:col-span-3">
                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100 p-4 lg:p-6">
                                <CardTitle className="flex items-center gap-2 text-emerald-800 text-lg">
                                    <Target className="w-5 h-5" />
                                    Receita Detalhada
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 lg:p-6">
                                <RevenueChart
                                    data={revenueDetailedData}
                                    loading={isLoadingReports}
                                    title=""
                                    height={350}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Ações Rápidas */}
                    <div className="xl:col-span-1">
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
            <TabsContent value="financial" className="space-y-6 lg:space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                    {/* Resumo Financeiro */}
                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                        <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100 p-4 lg:p-6">
                            <CardTitle className="flex items-center gap-2 text-emerald-800 text-lg">
                                <DollarSign className="w-5 h-5" />
                                Resumo Financeiro
                            </CardTitle>
                            <CardDescription className="text-slate-600 text-sm">
                                Métricas financeiras do período atual
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 lg:p-6 space-y-4 lg:space-y-6">
                            <div className="grid grid-cols-2 gap-4 lg:gap-6">
                                <div className="space-y-2">
                                    <p className="text-xs lg:text-sm font-medium text-slate-600">Receita Bruta</p>
                                    <p className="text-lg lg:text-2xl font-bold text-emerald-600">
                                        {formatCurrency(financialSummary?.totalRevenue || 0)}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs lg:text-sm font-medium text-slate-600">Receita Líquida</p>
                                    <p className="text-lg lg:text-2xl font-bold text-emerald-600">
                                        {formatCurrency(financialSummary?.totalProfit || 0)}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs lg:text-sm font-medium text-slate-600">Ticket Médio</p>
                                    <p className="text-lg lg:text-2xl font-bold text-slate-900">
                                        {formatCurrency(financialSummary?.averageTicket || 0)}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs lg:text-sm font-medium text-slate-600">Transações</p>
                                    <p className="text-lg lg:text-2xl font-bold text-slate-900">
                                        {financialSummary?.transactionCount || 0}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Distribuição de Lucro */}
                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-4 lg:p-6">
                            <CardTitle className="flex items-center gap-2 text-blue-800 text-lg">
                                <PieChart className="w-5 h-5" />
                                Distribuição de Lucro
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 lg:p-6">
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
            <TabsContent value="clients" className="space-y-6 lg:space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                    {/* Estatísticas de Clientes */}
                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-4 lg:p-6">
                            <CardTitle className="flex items-center gap-2 text-purple-800 text-lg">
                                <Users className="w-5 h-5" />
                                Estatísticas de Clientes
                            </CardTitle>
                            <CardDescription className="text-slate-600 text-sm">
                                Métricas e análises dos clientes
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 lg:p-6 space-y-4 lg:space-y-6">
                            <div className="grid grid-cols-2 gap-4 lg:gap-6">
                                <div className="space-y-2">
                                    <p className="text-xs lg:text-sm font-medium text-slate-600">Total</p>
                                    <p className="text-lg lg:text-2xl font-bold text-purple-600">
                                        {clientStats?.total || 0}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs lg:text-sm font-medium text-slate-600">Novos Este Mês</p>
                                    <p className="text-lg lg:text-2xl font-bold text-purple-600">
                                        {clientStats?.new || 0}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs lg:text-sm font-medium text-slate-600">Ativos</p>
                                    <p className="text-lg lg:text-2xl font-bold text-green-600">
                                        {clientStats?.active || 0}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs lg:text-sm font-medium text-slate-600">Inativos</p>
                                    <p className="text-lg lg:text-2xl font-bold text-orange-600">
                                        {clientStats?.inactive || 0}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Próximos Aniversários */}
                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                        <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-100 p-4 lg:p-6">
                            <CardTitle className="flex items-center gap-2 text-pink-800 text-lg">
                                <Heart className="w-5 h-5" />
                                Próximos Aniversários
                            </CardTitle>
                            <CardDescription className="text-slate-600 text-sm">
                                Clientes que fazem aniversário nos próximos 30 dias
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 lg:p-6">
                            {birthdaysLoading ? (
                                <div className="space-y-3">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="animate-pulse">
                                            <div className="h-12 bg-slate-200 rounded-lg"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : upcomingBirthdays && upcomingBirthdays.length > 0 ? (
                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                    {upcomingBirthdays.slice(0, 8).map((client, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border border-pink-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                                                    <Heart className="w-4 h-4 text-white" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 text-sm">{client.name}</p>
                                                    <p className="text-xs text-slate-600">{formatBirthday(client.birthday)}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200 text-xs">
                                                {getDaysUntilBirthday(client.birthday)} dias
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 text-sm">Nenhum aniversário próximo</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            {/* Tab Agendamentos */}
            <TabsContent value="appointments" className="space-y-6 lg:space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                    {/* Status dos Agendamentos */}
                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-4 lg:p-6">
                            <CardTitle className="flex items-center gap-2 text-blue-800 text-lg">
                                <CalendarDays className="w-5 h-5" />
                                Status dos Agendamentos
                            </CardTitle>
                            <CardDescription className="text-slate-600 text-sm">
                                Visão geral dos agendamentos por status
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 lg:p-6">
                            <Chart
                                title=""
                                description=""
                                data={appointmentsChartData}
                                type="pie"
                                height={280}
                                loading={appointmentsLoading}
                                yAxisKey="value"
                                colors={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']}
                                showLegend={true}
                            />
                        </CardContent>
                    </Card>

                    {/* Agendamentos de Hoje */}
                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                        <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100 p-4 lg:p-6">
                            <CardTitle className="flex items-center gap-2 text-emerald-800 text-lg">
                                <Clock className="w-5 h-5" />
                                Agendamentos de Hoje
                            </CardTitle>
                            <CardDescription className="text-slate-600 text-sm">
                                Lista dos agendamentos para hoje
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 lg:p-6">
                            {appointmentsLoading ? (
                                <div className="space-y-3">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="animate-pulse">
                                            <div className="h-16 bg-slate-200 rounded-lg"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : todayAppointments.length > 0 ? (
                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                    {todayAppointments.map((appointment, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-200">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${
                                                    appointment.status === 'confirmed' ? 'bg-green-500' :
                                                        appointment.status === 'cancelled' ? 'bg-red-500' :
                                                            appointment.status === 'completed' ? 'bg-blue-500' :
                                                                'bg-yellow-500'
                                                }`} />
                                                <div>
                                                    <p className="font-medium text-slate-900 text-sm">
                                                        {appointment.patient?.name || 'Cliente'}
                                                    </p>
                                                    <p className="text-xs text-slate-600">
                                                        {appointment.service?.name || 'Consulta'} • {
                                                        new Date(appointment.scheduled_datetime).toLocaleTimeString('pt-BR', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })
                                                    }
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className={`text-xs ${
                                                appointment.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    appointment.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        appointment.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                                            }`}>
                                                {appointment.status === 'confirmed' ? 'Confirmado' :
                                                    appointment.status === 'cancelled' ? 'Cancelado' :
                                                        appointment.status === 'completed' ? 'Concluído' :
                                                            'Agendado'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 text-sm">Nenhum agendamento para hoje</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Próximos Agendamentos */}
                <Card className="border-0 shadow-xl shadow-slate-200/60">
                    <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 p-4 lg:p-6">
                        <CardTitle className="flex items-center gap-2 text-indigo-800 text-lg">
                            <CalendarDays className="w-5 h-5" />
                            Próximos Agendamentos
                        </CardTitle>
                        <CardDescription className="text-slate-600 text-sm">
                            Agendamentos dos próximos 7 dias
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 lg:p-6">
                        {appointmentsLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="animate-pulse">
                                        <div className="h-20 bg-slate-200 rounded-lg"></div>
                                    </div>
                                ))}
                            </div>
                        ) : upcomingAppointments.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {upcomingAppointments.slice(0, 12).map((appointment, index) => (
                                    <div key={index} className="p-4 bg-gradient-to-br from-white to-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900 text-sm truncate">
                                                    {appointment.patient?.name || 'Cliente'}
                                                </p>
                                                <p className="text-xs text-slate-600 truncate">
                                                    {appointment.service?.name || 'Consulta'}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="ml-2 text-xs text-slate-700 border-slate-300">
                                                {new Date(appointment.scheduled_datetime).toLocaleDateString('pt-BR', {
                                                    day: '2-digit',
                                                    month: '2-digit'
                                                })}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500">
                                                {new Date(appointment.scheduled_datetime).toLocaleTimeString('pt-BR', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                            <div className={`w-2 h-2 rounded-full ${
                                                appointment.status === 'confirmed' ? 'bg-green-500' :
                                                    appointment.status === 'cancelled' ? 'bg-red-500' :
                                                        'bg-yellow-500'
                                            }`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 text-sm">Nenhum agendamento próximo</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
            {/* Tab Analytics */}
            <TabsContent value="analytics" className="space-y-6 lg:space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                    {/* Métricas de Performance */}
                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 p-4 lg:p-6">
                            <CardTitle className="flex items-center gap-2 text-orange-800 text-lg">
                                <TrendingUp className="w-5 h-5" />
                                Métricas de Performance
                            </CardTitle>
                            <CardDescription className="text-sm">
                                Indicadores de desempenho do negócio
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 lg:p-6 space-y-4 lg:space-y-6">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">Taxa de Conversão</p>
                                        <p className="text-xs text-slate-500">Agendamentos → Atendimentos</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-orange-600">
                                            {financialSummary?.conversionRate || 0}%
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">Taxa de Cancelamento</p>
                                        <p className="text-xs text-slate-500">Agendamentos cancelados</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-blue-600">
                                            {appointmentStats?.cancelled ?
                                                Math.round((appointmentStats.cancelled / (appointmentStats.total || 1)) * 100) : 0}%
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">Ticket Médio</p>
                                        <p className="text-xs text-slate-500">Valor médio por atendimento</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-green-600">
                                            {formatCurrency(financialSummary?.averageTicket || 0)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Segmentação de Clientes */}
                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100 p-4 lg:p-6">
                            <CardTitle className="flex items-center gap-2 text-purple-800 text-lg">
                                <BarChart3 className="w-5 h-5" />
                                Segmentação de Clientes
                            </CardTitle>
                            <CardDescription className="text-sm">
                                Distribuição dos clientes por segmento
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 lg:p-6">
                            <Chart
                                title=""
                                description=""
                                data={clientSegmentData}
                                type="bar"
                                height={280}
                                loading={clientStatsLoading}
                                yAxisKey="value"
                                colors={['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe']}
                                showLegend={false}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Análise de Tendências */}
                <Card className="border-0 shadow-xl shadow-slate-200/60">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-100 p-4 lg:p-6">
                        <CardTitle className="flex items-center gap-2 text-slate-800 text-lg">
                            <TrendingUp className="w-5 h-5" />
                            Análise de Tendências
                        </CardTitle>
                        <CardDescription className="text-sm">
                            Evolução da receita e agendamentos nos últimos 30 dias
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 lg:p-6">
                        <Chart
                            title=""
                            description=""
                            data={dashboardData.revenue}
                            type="line"
                            height={300}
                            loading={isLoadingReports}
                            yAxisKey="value"
                            colors={['#10b981']}
                            showLegend={false}
                        />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}