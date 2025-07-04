'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Calendar,
    Plus,
    Search,
    Clock,
    Phone,
    Mail,
    MoreHorizontal,
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCw,
    Edit,
    Trash2,
    Calendar as GoogleCalendarIcon,
    Filter,
    Download,
    Bell,
    ChevronRight,
    Sparkles,
    Users,
    CalendarDays,
    Activity,
    TrendingUp
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { format, isToday, isTomorrow, isYesterday, addDays, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import AppointmentModal from '@/components/calendar/AppointmentModal'
import { toast } from 'sonner'
import type { Database } from '@/lib/database/supabase/types'
import { useClients } from "@/lib/hooks/useClients"
import { useAppointments } from "@/lib/hooks/useAppointment"
import { useProcedures } from "@/lib/hooks/useProcedures"
import { Sidebar } from '@/components/layout/sidebar'
import { useRealCalendarSync } from '@/lib/hooks/useRealCalendarSync'

type AppointmentStatus = Database['public']['Enums']['appointment_status_enum']

const AgendamentosPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [dateFilter, setDateFilter] = useState<string>('all')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedAppointment, setSelectedAppointment] = useState<any>()

    // Hook de sincronização real
    const {
        syncSpecificAppointment,
        syncAllAppointments,
        loading: syncLoading,
        error: syncError,
        metrics: syncMetrics
    } = useRealCalendarSync()

    // Hooks para gerenciar dados
    const {
        appointmentsWithDetails,
        loading: appointmentsLoading,
        error: appointmentsError,
        stats,
        updateFilters,
        fetchAppointmentsWithDetails,
        createAppointment,
        updateAppointment,
        deleteAppointment,
        updateAppointmentStatus,
        clearError
    } = useAppointments({
        autoFetch: false,
        initialLimit: 50
    })

    const {
        data: clientsData,
        isLoading: clientsLoading
    } = useClients({
        page: 1,
        limit: 100, // Carregar todos os clientes para o modal
        filters: {}
    })

    // Assumindo que existe um hook similar para procedimentos
    const {
        data: proceduresData,
        isLoading: proceduresLoading
    } = useProcedures({
        page: 1,
        limit: 100
    })

    const clients = clientsData?.data || []
    const procedures = proceduresData?.data || []

    // Estado derivado para agendamentos filtrados
    const [filteredAppointments, setFilteredAppointments] = useState(appointmentsWithDetails)

    // Carregar dados iniciais
    useEffect(() => {
        fetchAppointmentsWithDetails()
    }, [fetchAppointmentsWithDetails])

    // Aplicar filtros locais
    useEffect(() => {
        let filtered = appointmentsWithDetails

        // Filtro por texto
        if (searchTerm) {
            filtered = filtered.filter(apt =>
                apt.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                apt.procedures?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                apt.notes?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Filtro por status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(apt => apt.status === statusFilter)
        }

        // Filtro por data
        if (dateFilter !== 'all') {
            const now = new Date()
            switch (dateFilter) {
                case 'today':
                    filtered = filtered.filter(apt => isToday(new Date(apt.scheduled_datetime)))
                    break
                case 'tomorrow':
                    filtered = filtered.filter(apt => isTomorrow(new Date(apt.scheduled_datetime)))
                    break
                case 'week':
                    const weekStart = startOfDay(now)
                    const weekEnd = endOfDay(addDays(now, 7))
                    filtered = filtered.filter(apt => {
                        const aptDate = new Date(apt.scheduled_datetime)
                        return aptDate >= weekStart && aptDate <= weekEnd
                    })
                    break
                case 'unsynced':
                    filtered = filtered.filter(apt => !apt.calendar_synced)
                    break
            }
        }

        setFilteredAppointments(filtered)
    }, [appointmentsWithDetails, searchTerm, statusFilter, dateFilter])

    // Limpar erro quando necessário
    useEffect(() => {
        if (appointmentsError) {
            toast.error(appointmentsError)
            clearError()
        }
    }, [appointmentsError, clearError])

    // Limpar erro de sincronização
    useEffect(() => {
        if (syncError) {
            toast.error(`Erro de sincronização: ${syncError}`)
        }
    }, [syncError])

    // Função para sincronizar agendamento específico
    const handleSyncAppointment = async (appointment: any) => {
        try {
            const result = await syncSpecificAppointment(appointment.id, appointment)

            if (result?.success) {
                toast.success('Agendamento sincronizado com sucesso!')
                // Atualizar a lista de agendamentos
                fetchAppointmentsWithDetails()
            } else {
                toast.error(result?.error || 'Erro ao sincronizar agendamento')
            }
        } catch (error) {
            toast.error('Erro ao sincronizar agendamento')
        }
    }

    // Função para sincronizar todos os agendamentos
    const handleSyncAllAppointments = async () => {
        try {
            const result = await syncAllAppointments()

            if (result) {
                const { syncedCount, results } = result
                const failedCount = results.filter(r => !r.success).length

                if (syncedCount > 0) {
                    toast.success(`${syncedCount} agendamento(s) sincronizado(s) com sucesso!`)
                }

                if (failedCount > 0) {
                    toast.warning(`${failedCount} agendamento(s) falharam na sincronização`)
                }

                // Atualizar a lista de agendamentos
                fetchAppointmentsWithDetails()
            }
        } catch (error) {
            toast.error('Erro ao sincronizar agendamentos')
        }
    }

    const getStatusBadge = (status: AppointmentStatus) => {
        const statusConfig = {
            scheduled: { label: 'Agendado', variant: 'secondary' as const, icon: Clock },
            confirmed: { label: 'Confirmado', variant: 'default' as const, icon: CheckCircle },
            completed: { label: 'Concluído', variant: 'default' as const, icon: CheckCircle },
            cancelled: { label: 'Cancelado', variant: 'destructive' as const, icon: XCircle },
            no_show: { label: 'Não Compareceu', variant: 'destructive' as const, icon: AlertCircle }
        }

        const config = statusConfig[status]
        const Icon = config.icon

        return (
            <Badge variant={config.variant} className="flex items-center gap-1">
                <Icon className="w-3 h-3" />
                {config.label}
            </Badge>
        )
    }

    const getDateLabel = (date: string) => {
        const appointmentDate = new Date(date)

        if (isToday(appointmentDate)) return 'Hoje'
        if (isTomorrow(appointmentDate)) return 'Amanhã'
        if (isYesterday(appointmentDate)) return 'Ontem'

        return format(appointmentDate, "dd/MM/yyyy", { locale: ptBR })
    }

    const handleSaveAppointment = async (data: any) => {
        try {
            if (selectedAppointment) {
                await updateAppointment(selectedAppointment.id, data)
                toast.success('Agendamento atualizado com sucesso!')
            } else {
                await createAppointment(data)
                toast.success('Agendamento criado com sucesso!')
            }
            setIsModalOpen(false)
            setSelectedAppointment(undefined)
        } catch (error) {
            toast.error('Erro ao salvar agendamento')
        }
    }

    const handleDeleteAppointment = async (id: string) => {
        try {
            await deleteAppointment(id)
            toast.success('Agendamento excluído com sucesso!')
            setIsModalOpen(false)
            setSelectedAppointment(undefined)
        } catch (error) {
            toast.error('Erro ao excluir agendamento')
        }
    }

    const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
        try {
            await updateAppointmentStatus(id, newStatus)
            toast.success('Status atualizado com sucesso!')
        } catch (error) {
            toast.error('Erro ao atualizar status')
        }
    }

    // Atualizar as estatísticas para usar dados reais
    const getAppointmentStats = () => {
        const baseStats = {
            total: filteredAppointments.length,
            today: filteredAppointments.filter(apt => isToday(new Date(apt.scheduled_datetime))).length,
            confirmed: filteredAppointments.filter(apt => apt.status === 'confirmed').length,
            unsynced: filteredAppointments.filter(apt => !apt.calendar_synced).length
        }

        // Usar métricas reais se disponíveis
        if (syncMetrics) {
            return {
                ...baseStats,
                unsynced: syncMetrics.eventsOutOfSync
            }
        }

        return baseStats
    }

    const statsData = getAppointmentStats()
    const isLoading = appointmentsLoading || clientsLoading || proceduresLoading

    // Dados das métricas principais seguindo o padrão da dashboard
    const metricsData = [
        {
            title: 'Total de Agendamentos',
            value: statsData.total,
            icon: Calendar,
            description: 'Todos os agendamentos',
            gradient: 'from-blue-500 to-blue-600',
            trend: { value: statsData.total, label: 'total', isPositive: true }
        },
        {
            title: 'Agendamentos Hoje',
            value: statsData.today,
            icon: CalendarDays,
            description: 'Agendamentos para hoje',
            gradient: 'from-emerald-500 to-emerald-600',
            trend: { value: statsData.today, label: 'hoje', isPositive: true }
        },
        {
            title: 'Confirmados',
            value: statsData.confirmed,
            icon: CheckCircle,
            description: 'Status confirmado',
            gradient: 'from-purple-500 to-purple-600',
            trend: { value: statsData.confirmed, label: 'confirmados', isPositive: true }
        },
        {
            title: 'Não Sincronizados',
            value: statsData.unsynced,
            icon: AlertCircle,
            description: 'Pendentes de sincronização',
            gradient: 'from-orange-500 to-orange-600',
            trend: { value: statsData.unsynced, label: 'pendentes', isPositive: false }
        }
    ]

    if (isLoading && appointmentsWithDetails.length === 0) {
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
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                        <Calendar className="w-4 h-4 text-white" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                        Agendamentos
                                    </h1>
                                </div>
                                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                    Gerencie todos os seus agendamentos em um só lugar
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
                                        onClick={() => fetchAppointmentsWithDetails()}
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
                                    <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                        <Bell className="w-4 h-4 text-slate-600" />
                                    </button>
                                </div>

                                {/* Botões Principais */}
                                <div className="flex items-center gap-2 ml-2">
                                    <Link href="/agendamentos/calendario">
                                        <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50 shadow-sm">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            Calendário
                                        </Button>
                                    </Link>
                                    <Button
                                        onClick={() => {
                                            setSelectedAppointment(undefined)
                                            setIsModalOpen(true)
                                        }}
                                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 border-0"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Novo Agendamento
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Conteúdo */}
                <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

                        {/* Métricas Principais com Design Moderno */}
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
                                                {metric.value.toLocaleString()}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className={`w-3 h-3 ${metric.trend.isPositive ? 'text-emerald-500' : 'text-orange-500'}`} />
                                                <span className={`text-xs font-medium ${metric.trend.isPositive ? 'text-emerald-600' : 'text-orange-600'}`}>
                                                    {metric.trend.label}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Filtros com Design Moderno */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Search className="w-5 h-5 text-blue-500" />
                                    Filtros e Busca
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 lg:p-6">
                                <div className="flex flex-col lg:flex-row gap-4">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <Input
                                                placeholder="Buscar por cliente, procedimento ou observações..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                                            <TabsList className="bg-slate-100 border-0">
                                                <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Todos</TabsTrigger>
                                                <TabsTrigger value="scheduled" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Agendados</TabsTrigger>
                                                <TabsTrigger value="confirmed" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Confirmados</TabsTrigger>
                                                <TabsTrigger value="completed" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Concluídos</TabsTrigger>
                                            </TabsList>
                                        </Tabs>
                                        <Tabs value={dateFilter} onValueChange={setDateFilter}>
                                            <TabsList className="bg-slate-100 border-0">
                                                <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Todas as Datas</TabsTrigger>
                                                <TabsTrigger value="today" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Hoje</TabsTrigger>
                                                <TabsTrigger value="tomorrow" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Amanhã</TabsTrigger>
                                                <TabsTrigger value="week" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Esta Semana</TabsTrigger>
                                                <TabsTrigger value="unsynced" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Não Sincronizados</TabsTrigger>
                                            </TabsList>
                                        </Tabs>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Lista de Agendamentos com Design Moderno */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                    <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                                        <Calendar className="w-5 h-5 text-blue-500" />
                                        Agendamentos ({filteredAppointments.length})
                                        {isLoading && <RefreshCw className="w-4 h-4 animate-spin ml-2 text-blue-500" />}
                                    </CardTitle>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                        <Users className="w-3 h-3 mr-1" />
                                        {filteredAppointments.length} resultados
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {filteredAppointments.length === 0 ? (
                                    <div className="text-center py-12 px-6">
                                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Calendar className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                            Nenhum agendamento encontrado
                                        </h3>
                                        <p className="text-slate-500 mb-6 max-w-md mx-auto">
                                            {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                                                ? 'Tente ajustar os filtros ou criar um novo agendamento.'
                                                : 'Comece criando seu primeiro agendamento.'
                                            }
                                        </p>
                                        <Button
                                            onClick={() => {
                                                setSelectedAppointment(undefined)
                                                setIsModalOpen(true)
                                            }}
                                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 border-0"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Novo Agendamento
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-slate-50/50 hover:bg-slate-50">
                                                    <TableHead className="font-semibold text-slate-700">Cliente</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Procedimento</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Data e Horário</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Sincronização</TableHead>
                                                    <TableHead className="text-right font-semibold text-slate-700">Ações</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredAppointments.map((appointment) => (
                                                    <TableRow key={appointment.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <TableCell className="py-4">
                                                            <div>
                                                                <p className="font-medium text-slate-900">{appointment.clients?.name}</p>
                                                                <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                                                    {appointment.clients?.phone && (
                                                                        <span className="flex items-center gap-1">
                                                                            <Phone className="w-3 h-3" />
                                                                            {appointment.clients.phone}
                                                                        </span>
                                                                    )}
                                                                    {appointment.clients?.email && (
                                                                        <span className="flex items-center gap-1">
                                                                            <Mail className="w-3 h-3" />
                                                                            {appointment.clients.email}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <div>
                                                                <p className="font-medium text-slate-900">{appointment.procedures?.name}</p>
                                                                <p className="text-sm text-slate-500">
                                                                    {appointment.duration_minutes || appointment.procedures?.duration_minutes} minutos
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <div>
                                                                <p className="font-medium text-slate-900">
                                                                    {getDateLabel(appointment.scheduled_datetime)}
                                                                </p>
                                                                <p className="text-sm text-slate-500">
                                                                    {format(new Date(appointment.scheduled_datetime), 'HH:mm')}
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            {getStatusBadge(appointment.status)}
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <div className="flex items-center gap-2">
                                                                {appointment.calendar_synced ? (
                                                                    <Badge variant="default" className="flex items-center gap-1 bg-emerald-100 text-emerald-700 border-emerald-200">
                                                                        <GoogleCalendarIcon className="w-3 h-3" />
                                                                        Sincronizado
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="destructive" className="flex items-center gap-1 bg-orange-100 text-orange-700 border-orange-200">
                                                                        <AlertCircle className="w-3 h-3" />
                                                                        Pendente
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right py-4">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-56">
                                                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setSelectedAppointment(appointment)
                                                                            setIsModalOpen(true)
                                                                        }}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Editar
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                                                                        className="cursor-pointer"
                                                                        disabled={appointment.status === 'confirmed'}
                                                                    >
                                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                                        Confirmar
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleStatusChange(appointment.id, 'completed')}
                                                                        className="cursor-pointer"
                                                                        disabled={appointment.status === 'completed'}
                                                                    >
                                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                                        Marcar como Concluído
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                                                                        className="cursor-pointer text-red-600"
                                                                        disabled={appointment.status === 'cancelled'}
                                                                    >
                                                                        <XCircle className="mr-2 h-4 w-4" />
                                                                        Cancelar
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleStatusChange(appointment.id, 'no_show')}
                                                                        className="cursor-pointer text-orange-600"
                                                                        disabled={appointment.status === 'no_show'}
                                                                    >
                                                                        <AlertCircle className="mr-2 h-4 w-4" />
                                                                        Não Compareceu
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleSyncAppointment(appointment)}
                                                                        className="cursor-pointer"
                                                                        disabled={appointment.calendar_synced || syncLoading}
                                                                    >
                                                                        <GoogleCalendarIcon className="mr-2 h-4 w-4" />
                                                                        {appointment.calendar_synced ? 'Já Sincronizado' : 'Sincronizar com Google'}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDeleteAppointment(appointment.id)}
                                                                        className="cursor-pointer text-red-600"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Excluir
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Ações em Lote */}
                        {filteredAppointments.length > 0 && (
                            <Card className="border-0 shadow-xl shadow-slate-200/60">
                                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Sparkles className="w-5 h-5 text-purple-500" />
                                        Ações Rápidas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 lg:p-6">
                                    <div className="flex flex-wrap gap-3">
                                        <Button
                                            variant="outline"
                                            className="bg-white border-slate-200 hover:bg-slate-50"
                                            onClick={handleSyncAllAppointments}
                                            disabled={syncLoading}
                                        >
                                            <GoogleCalendarIcon className="w-4 h-4 mr-2" />
                                            {syncLoading ? (
                                                <>
                                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                    Sincronizando...
                                                </>
                                            ) : (
                                                `Sincronizar Todos (${filteredAppointments.filter(apt => !apt.calendar_synced).length})`
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="bg-white border-slate-200 hover:bg-slate-50"
                                            onClick={() => {
                                                // Lógica para exportar dados
                                                toast.info('Exportação iniciada...')
                                            }}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Exportar Lista
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="bg-white border-slate-200 hover:bg-slate-50"
                                            onClick={() => {
                                                // Lógica para enviar lembretes
                                                const todayAppointments = filteredAppointments.filter(apt =>
                                                    isToday(new Date(apt.scheduled_datetime)) &&
                                                    apt.status === 'confirmed'
                                                ).length
                                                toast.info(`${todayAppointments} lembretes serão enviados`)
                                            }}
                                        >
                                            <Bell className="w-4 h-4 mr-2" />
                                            Enviar Lembretes
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Resumo de Estatísticas Detalhadas */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Gráfico de Status */}
                            <Card className="border-0 shadow-xl shadow-slate-200/60">
                                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-blue-500" />
                                        Distribuição por Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        {[
                                            { status: 'scheduled', label: 'Agendados', color: 'bg-blue-500' },
                                            { status: 'confirmed', label: 'Confirmados', color: 'bg-green-500' },
                                            { status: 'completed', label: 'Concluídos', color: 'bg-purple-500' },
                                            { status: 'cancelled', label: 'Cancelados', color: 'bg-red-500' },
                                            { status: 'no_show', label: 'Não Compareceram', color: 'bg-orange-500' }
                                        ].map(({ status, label, color }) => {
                                            const count = filteredAppointments.filter(apt => apt.status === status).length
                                            const percentage = filteredAppointments.length > 0
                                                ? (count / filteredAppointments.length * 100).toFixed(1)
                                                : '0'

                                            return (
                                                <div key={status} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-3 h-3 rounded-full ${color}`} />
                                                        <span className="text-sm font-medium text-slate-700">{label}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-slate-500">{percentage}%</span>
                                                        <span className="text-sm font-semibold text-slate-900">{count}</span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Próximos Agendamentos */}
                            <Card className="border-0 shadow-xl shadow-slate-200/60">
                                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-green-500" />
                                        Próximos Agendamentos
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        {filteredAppointments
                                            .filter(apt => new Date(apt.scheduled_datetime) >= new Date())
                                            .sort((a, b) => new Date(a.scheduled_datetime).getTime() - new Date(b.scheduled_datetime).getTime())
                                            .slice(0, 5)
                                            .map((appointment) => (
                                                <div key={appointment.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-slate-900 truncate">
                                                            {appointment.clients?.name}
                                                        </p>
                                                        <p className="text-xs text-slate-500 truncate">
                                                            {appointment.procedures?.name}
                                                        </p>
                                                    </div>
                                                    <div className="text-right ml-4">
                                                        <p className="text-xs font-medium text-slate-900">
                                                            {getDateLabel(appointment.scheduled_datetime)}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {format(new Date(appointment.scheduled_datetime), 'HH:mm')}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        {filteredAppointments.filter(apt => new Date(apt.scheduled_datetime) >= new Date()).length === 0 && (
                                            <div className="text-center py-6">
                                                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                                <p className="text-sm text-slate-500">Nenhum agendamento futuro encontrado</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>

            {/* Modal de Agendamento */}
            {isModalOpen && (
                <AppointmentModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false)
                        setSelectedAppointment(undefined)
                    }}
                    appointment={selectedAppointment}
                    clients={clients}
                    procedures={procedures}
                    onSave={handleSaveAppointment}
                    onDelete={selectedAppointment ? () => handleDeleteAppointment(selectedAppointment.id) : undefined}
                />
            )}
        </div>
    )
}

export default AgendamentosPage