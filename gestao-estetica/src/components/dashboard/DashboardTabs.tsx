'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    CalendarDays,
    DollarSign,
    Users,
    TrendingUp,
    Clock,
    Heart,
    Target,
    PieChart,
    BarChart3,
    Activity,
    AlertCircle
} from 'lucide-react'

import { Chart } from '@/components/dashboard/Chart'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { RevenueChart } from '@/components/charts/RevenueChart'
import { ProfitDistributionChart } from '@/components/charts/ProfitDistributionChart'

// Interfaces simplificadas
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
    dashboardData: DashboardData;
    revenueDetailedData: RevenueData[];
    clientSegmentData: Array<{ name: string; value: number }>;
    appointmentsChartData: Array<{ name: string; value: number }>;
    isLoadingReports: boolean;
    isLoadingProfitDistributions: boolean;
    clientStatsLoading: boolean;
    appointmentsLoading: boolean;
    birthdaysLoading: boolean;
    financialSummary?: FinancialSummary;
    clientStats?: ClientStats;
    appointmentStats?: AppointmentStats;
    upcomingAppointments: Appointment[];
    todayAppointments: Appointment[];
    upcomingBirthdays?: Client[];
}

// Função utilitária simplificada
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
        const nextBirthday = new Date(thisYear, birthDate.getMonth(), birthDate.getDate());

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

// Componente de Loading Card simplificado
const LoadingCard = ({ title }: { title: string }) => (
    <Card>
        <CardHeader>
            <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        </CardContent>
    </Card>
);

// Componente de Estado Vazio simplificado
const EmptyState = ({ icon: Icon, title, description }: {
    icon: React.ElementType;
    title: string;
    description: string;
}) => (
    <div className="text-center py-8">
        <Icon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium mb-1">{title}</p>
        <p className="text-sm text-slate-400">{description}</p>
    </div>
);

export function DashboardTabs(props: DashboardTabsProps) {
    const {
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
    } = props;

    return (
        <Tabs defaultValue="overview" className="space-y-6">
            {/* Navegação das abas simplificada */}
            <div className="overflow-x-auto">
                <TabsList className="grid grid-cols-4 bg-slate-100 p-1 rounded-lg min-w-max w-full">
                    <TabsTrigger value="overview" className="text-sm">
                        Visão Geral
                    </TabsTrigger>
                    <TabsTrigger value="financial" className="text-sm">
                        Financeiro
                    </TabsTrigger>
                    <TabsTrigger value="clients" className="text-sm">
                        Clientes
                    </TabsTrigger>
                    <TabsTrigger value="appointments" className="text-sm">
                        Agendamentos
                    </TabsTrigger>
                </TabsList>
            </div>

            {/* Tab Visão Geral */}
            <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Gráfico de Receita Principal */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="w-5 h-5 text-emerald-500" />
                                    Receita por Período
                                </CardTitle>
                                <CardDescription>
                                    Evolução da receita nos últimos 30 dias
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoadingReports ? (
                                    <div className="h-[300px] flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-emerald-500"></div>
                                    </div>
                                ) : (
                                    <RevenueChart
                                        data={revenueDetailedData}
                                        loading={false}
                                        title=""
                                        height={300}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Resumo Rápido */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Resumo Hoje</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">Agendamentos</span>
                                    <span className="font-semibold">{todayAppointments.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">Receita</span>
                                    <span className="font-semibold text-emerald-600">
                                        {formatCurrency(financialSummary?.totalRevenue || 0)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">Clientes</span>
                                    <span className="font-semibold">{clientStats?.total || 0}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Alertas importantes */}
                        {upcomingBirthdays && upcomingBirthdays.length > 0 && (
                            <Card className="border-l-4 border-l-pink-500">
                                <CardContent className="pt-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Heart className="w-4 h-4 text-pink-500" />
                                        <span className="font-medium text-pink-900">
                                            {upcomingBirthdays.length} aniversário(s) próximo(s)
                                        </span>
                                    </div>
                                    <p className="text-sm text-pink-700">
                                        {upcomingBirthdays.slice(0, 2).map(b => b.name).join(', ')}
                                        {upcomingBirthdays.length > 2 && ` e mais ${upcomingBirthdays.length - 2}`}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Atividade Recente */}
                <RecentActivity
                    activities={upcomingAppointments.slice(0, 5).map(appointment => ({
                        id: appointment.id || String(Math.random()),
                        type: 'appointment' as const,
                        title: appointment.patient?.name || 'Cliente',
                        description: appointment.service?.name || 'Consulta',
                        timestamp: appointment.scheduled_datetime,
                        status: appointment.status === 'confirmed' ? 'success' as const :
                            appointment.status === 'cancelled' ? 'error' as const : 'info' as const,
                        client: {
                            name: appointment.patient?.name || 'Cliente',
                            avatar: appointment.patient?.avatar
                        }
                    }))}
                    loading={appointmentsLoading}
                    showFilters={false}
                    showSearch={false}
                    limit={5}
                />
            </TabsContent>

            {/* Tab Financeiro */}
            <TabsContent value="financial" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Métricas Financeiras */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-emerald-500" />
                                Resumo Financeiro
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-slate-50 rounded-lg">
                                    <p className="text-sm text-slate-600 mb-1">Receita Total</p>
                                    <p className="text-lg font-bold text-emerald-600">
                                        {formatCurrency(financialSummary?.totalRevenue || 0)}
                                    </p>
                                </div>
                                <div className="text-center p-3 bg-slate-50 rounded-lg">
                                    <p className="text-sm text-slate-600 mb-1">Lucro</p>
                                    <p className="text-lg font-bold text-emerald-600">
                                        {formatCurrency(financialSummary?.totalProfit || 0)}
                                    </p>
                                </div>
                                <div className="text-center p-3 bg-slate-50 rounded-lg">
                                    <p className="text-sm text-slate-600 mb-1">Ticket Médio</p>
                                    <p className="text-lg font-bold text-slate-900">
                                        {formatCurrency(financialSummary?.averageTicket || 0)}
                                    </p>
                                </div>
                                <div className="text-center p-3 bg-slate-50 rounded-lg">
                                    <p className="text-sm text-slate-600 mb-1">Transações</p>
                                    <p className="text-lg font-bold text-slate-900">
                                        {financialSummary?.transactionCount || 0}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Distribuição de Lucro */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PieChart className="w-5 h-5 text-blue-500" />
                                Distribuição de Lucro
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoadingProfitDistributions ? (
                                <div className="h-[200px] flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-blue-500"></div>
                                </div>
                            ) : (
                                <ProfitDistributionChart
                                    data={dashboardData.profitDistribution}
                                    loading={false}
                                    title=""
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            {/* Tab Clientes */}
            <TabsContent value="clients" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Estatísticas de Clientes */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-purple-500" />
                                Estatísticas de Clientes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {clientStatsLoading ? (
                                <LoadingCard title="" />
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-600 mb-1">Total</p>
                                        <p className="text-2xl font-bold text-purple-600">
                                            {clientStats?.total || 0}
                                        </p>
                                    </div>
                                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-600 mb-1">Novos</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {clientStats?.new || 0}
                                        </p>
                                    </div>
                                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-600 mb-1">Ativos</p>
                                        <p className="text-2xl font-bold text-blue-600">
                                            {clientStats?.active || 0}
                                        </p>
                                    </div>
                                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-600 mb-1">Inativos</p>
                                        <p className="text-2xl font-bold text-orange-600">
                                            {clientStats?.inactive || 0}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Próximos Aniversários */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Heart className="w-5 h-5 text-pink-500" />
                                Próximos Aniversários
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {birthdaysLoading ? (
                                <LoadingCard title="" />
                            ) : upcomingBirthdays && upcomingBirthdays.length > 0 ? (
                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                    {upcomingBirthdays.slice(0, 6).map((client, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-slate-900">{client.name}</p>
                                                <p className="text-sm text-slate-500">{formatBirthday(client.birthday)}</p>
                                            </div>
                                            <Badge variant="outline" className="text-xs">
                                                {getDaysUntilBirthday(client.birthday)} dias
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={Heart}
                                    title="Nenhum aniversário próximo"
                                    description="Os aniversários aparecerão aqui"
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            {/* Tab Agendamentos */}
            <TabsContent value="appointments" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Status dos Agendamentos */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarDays className="w-5 h-5 text-blue-500" />
                                Status dos Agendamentos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {appointmentsLoading ? (
                                <div className="h-[200px] flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-blue-500"></div>
                                </div>
                            ) : (
                                <Chart
                                    title=""
                                    description=""
                                    data={appointmentsChartData}
                                    type="pie"
                                    height={200}
                                    loading={false}
                                    yAxisKey="value"
                                    colors={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']}
                                    showLegend={true}
                                />
                            )}
                        </CardContent>
                    </Card>

                    {/* Agendamentos de Hoje */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-emerald-500" />
                                Hoje ({todayAppointments.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {appointmentsLoading ? (
                                <LoadingCard title="" />
                            ) : todayAppointments.length > 0 ? (
                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                    {todayAppointments.map((appointment, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-slate-900">
                                                    {appointment.patient?.name || 'Cliente'}
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    {appointment.service?.name || 'Consulta'} • {
                                                    new Date(appointment.scheduled_datetime).toLocaleTimeString('pt-BR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })
                                                }
                                                </p>
                                            </div>
                                            <div className={`w-3 h-3 rounded-full ${
                                                appointment.status === 'confirmed' ? 'bg-green-500' :
                                                    appointment.status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'
                                            }`} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={CalendarDays}
                                    title="Nenhum agendamento hoje"
                                    description="A agenda está livre hoje"
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Próximos Agendamentos */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarDays className="w-5 h-5 text-indigo-500" />
                            Próximos 7 Dias
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {appointmentsLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="animate-pulse h-20 bg-slate-200 rounded-lg"></div>
                                ))}
                            </div>
                        ) : upcomingAppointments.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {upcomingAppointments.slice(0, 9).map((appointment, index) => (
                                    <div key={index} className="p-3 bg-slate-50 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="font-medium text-slate-900 text-sm truncate">
                                                {appointment.patient?.name || 'Cliente'}
                                            </p>
                                            <Badge variant="outline" className="text-xs">
                                                {new Date(appointment.scheduled_datetime).toLocaleDateString('pt-BR', {
                                                    day: '2-digit',
                                                    month: '2-digit'
                                                })}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-slate-500 truncate mb-2">
                                            {appointment.service?.name || 'Consulta'}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500">
                                                {new Date(appointment.scheduled_datetime).toLocaleTimeString('pt-BR', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                            <div className={`w-2 h-2 rounded-full ${
                                                appointment.status === 'confirmed' ? 'bg-green-500' :
                                                    appointment.status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'
                                            }`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={CalendarDays}
                                title="Nenhum agendamento próximo"
                                description="A agenda dos próximos dias está livre"
                            />
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}