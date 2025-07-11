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
    CalendarCheck,
    Filter,
    Download,
    Bell,
    Menu,
    AlertTriangle,
    CheckCircle2
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

// Componente de status melhorado
const StatusBadge = ({ status }: { status: AppointmentStatus }) => {
    const statusConfig = {
        scheduled: {
            label: 'Agendado',
            className: 'bg-blue-100 text-blue-700 border-blue-200',
            icon: Clock
        },
        confirmed: {
            label: 'Confirmado',
            className: 'bg-green-100 text-green-700 border-green-200',
            icon: CheckCircle
        },
        completed: {
            label: 'Concluído',
            className: 'bg-purple-100 text-purple-700 border-purple-200',
            icon: CheckCircle2
        },
        cancelled: {
            label: 'Cancelado',
            className: 'bg-red-100 text-red-700 border-red-200',
            icon: XCircle
        },
        no_show: {
            label: 'Faltou',
            className: 'bg-orange-100 text-orange-700 border-orange-200',
            icon: AlertCircle
        }
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
        <Badge className={`${config.className} border flex items-center gap-1 font-medium`}>
            <Icon className="w-3 h-3" />
            {config.label}
        </Badge>
    )
}

// Componente de filtro rápido
const QuickFilter = ({ label, count, active, onClick }: {
    label: string;
    count: number;
    active: boolean;
    onClick: () => void
}) => (
    <Button
        variant={active ? "default" : "outline"}
        size="sm"
        onClick={onClick}
        className={`flex items-center gap-2 transition-all ${
            active ? 'bg-blue-500 text-white shadow-md' : 'hover:bg-slate-50'
        }`}
    >
        <span>{label}</span>
        <Badge variant="secondary" className={`ml-1 ${active ? 'bg-blue-400 text-white' : ''}`}>
            {count}
        </Badge>
    </Button>
)

// Componente de card de agendamento para mobile
const AppointmentCard = ({ appointment, onEdit, onStatusChange, onSync, onDelete }: any) => (
    <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">
                        {appointment.clients?.name}
                    </h3>
                    <p className="text-sm text-slate-600 truncate">
                        {appointment.procedures?.name}
                    </p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(appointment)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSync(appointment)}>
                            <CalendarCheck className="mr-2 h-4 w-4" />
                            Sincronizar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => onDelete(appointment.id)}
                            className="text-red-600"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span>
                        {format(new Date(appointment.scheduled_datetime), 'dd/MM HH:mm')}
                    </span>
                </div>
                <StatusBadge status={appointment.status} />
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {appointment.clients?.phone && (
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                            <Phone className="w-3 h-3" />
                        </Button>
                    )}
                    {appointment.clients?.email && (
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                            <Mail className="w-3 h-3" />
                        </Button>
                    )}
                </div>

                {!appointment.calendar_synced && (
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Não sincronizado
                    </Badge>
                )}
            </div>
        </CardContent>
    </Card>
)

const AgendamentosPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [dateFilter, setDateFilter] = useState<string>('all')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedAppointment, setSelectedAppointment] = useState<any>()
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // Hooks mantidos exatamente como estavam
    const {
        syncSpecificAppointment,
        syncAllAppointments,
        loading: syncLoading,
        error: syncError,
        metrics: syncMetrics
    } = useRealCalendarSync()

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
        limit: 100,
        filters: {}
    })

    const {
        data: proceduresData,
        isLoading: proceduresLoading
    } = useProcedures({
        page: 1,
        limit: 100
    })

    const clients = clientsData?.data || []
    const procedures = proceduresData?.data || []

    // Estados derivados mantidos
    const [filteredAppointments, setFilteredAppointments] = useState(appointmentsWithDetails)

    // useEffects mantidos
    useEffect(() => {
        fetchAppointmentsWithDetails()
    }, [fetchAppointmentsWithDetails])

    useEffect(() => {
        let filtered = appointmentsWithDetails

        if (searchTerm) {
            filtered = filtered.filter(apt =>
                apt.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                apt.procedures?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                apt.notes?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(apt => apt.status === statusFilter)
        }

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

    useEffect(() => {
        if (appointmentsError) {
            toast.error(appointmentsError)
            clearError()
        }
    }, [appointmentsError, clearError])

    useEffect(() => {
        if (syncError) {
            toast.error(`Erro de sincronização: ${syncError}`)
        }
    }, [syncError])

    // Responsividade: ajustar view mode baseado no tamanho da tela
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setViewMode('cards')
            } else {
                setViewMode('table')
            }
        }

        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Funções mantidas
    const handleSyncAppointment = async (appointment: any) => {
        try {
            const result = await syncSpecificAppointment(appointment.id, appointment)
            if (result?.success) {
                toast.success('Agendamento sincronizado com sucesso!')
                fetchAppointmentsWithDetails()
            } else {
                toast.error(result?.error || 'Erro ao sincronizar agendamento')
            }
        } catch (error) {
            toast.error('Erro ao sincronizar agendamento')
        }
    }

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

                fetchAppointmentsWithDetails()
            }
        } catch (error) {
            toast.error('Erro ao sincronizar agendamentos')
        }
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

    // Estatísticas para filtros rápidos
    const getQuickStats = () => {
        return {
            all: filteredAppointments.length,
            today: filteredAppointments.filter(apt => isToday(new Date(apt.scheduled_datetime))).length,
            upcoming: filteredAppointments.filter(apt => new Date(apt.scheduled_datetime) > new Date()).length,
            unsynced: filteredAppointments.filter(apt => !apt.calendar_synced).length,
            confirmed: filteredAppointments.filter(apt => apt.status === 'confirmed').length
        }
    }

    const quickStats = getQuickStats()
    const isLoading = appointmentsLoading || clientsLoading || proceduresLoading

    if (isLoading && appointmentsWithDetails.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Sidebar />
                <div className="lg:ml-64">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                            <p className="text-slate-600">Carregando agendamentos...</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Sidebar */}
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
                {/* Header otimizado */}
                <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
                    <div className="px-4 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    className="lg:hidden p-2 -ml-2"
                                    onClick={() => setSidebarOpen(true)}
                                >
                                    <Menu className="w-5 h-5" />
                                </button>
                                <div>
                                    <h1 className="text-xl font-bold text-slate-900">Agendamentos</h1>
                                    <p className="text-sm text-slate-500">
                                        {filteredAppointments.length} agendamento(s) encontrado(s)
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => fetchAppointmentsWithDetails()}
                                    disabled={isLoading}
                                    className="p-2"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                </Button>

                                <Link href="/agendamentos/calendario">
                                    <Button variant="outline" size="sm">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        <span className="hidden sm:inline">Calendário</span>
                                    </Button>
                                </Link>

                                <Button
                                    onClick={() => {
                                        setSelectedAppointment(undefined)
                                        setIsModalOpen(true)
                                    }}
                                    size="sm"
                                    className="bg-blue-500 hover:bg-blue-600"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    <span className="hidden sm:inline">Novo</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Conteúdo */}
                <main className="p-4 lg:p-8 space-y-6">
                    <div className="max-w-7xl mx-auto">

                        {/* Filtros rápidos melhorados */}
                        <Card>
                            <CardContent className="p-4">
                                <div className="space-y-4">
                                    {/* Busca */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <Input
                                            placeholder="Buscar por cliente, procedimento..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>

                                    {/* Filtros rápidos */}
                                    <div className="flex flex-wrap gap-2">
                                        <QuickFilter
                                            label="Todos"
                                            count={quickStats.all}
                                            active={dateFilter === 'all' && statusFilter === 'all'}
                                            onClick={() => {
                                                setDateFilter('all')
                                                setStatusFilter('all')
                                            }}
                                        />
                                        <QuickFilter
                                            label="Hoje"
                                            count={quickStats.today}
                                            active={dateFilter === 'today'}
                                            onClick={() => setDateFilter('today')}
                                        />
                                        <QuickFilter
                                            label="Próximos"
                                            count={quickStats.upcoming}
                                            active={dateFilter === 'week'}
                                            onClick={() => setDateFilter('week')}
                                        />
                                        <QuickFilter
                                            label="Confirmados"
                                            count={quickStats.confirmed}
                                            active={statusFilter === 'confirmed'}
                                            onClick={() => setStatusFilter('confirmed')}
                                        />
                                        <QuickFilter
                                            label="Não Sincronizados"
                                            count={quickStats.unsynced}
                                            active={dateFilter === 'unsynced'}
                                            onClick={() => setDateFilter('unsynced')}
                                        />
                                    </div>

                                    {/* Filtros avançados (mobile-friendly) */}
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
                                            <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                                                <TabsTrigger value="all">Todos</TabsTrigger>
                                                <TabsTrigger value="confirmed">Confirmados</TabsTrigger>
                                                <TabsTrigger value="completed">Concluídos</TabsTrigger>
                                            </TabsList>
                                        </Tabs>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Ações em lote */}
                        {filteredAppointments.length > 0 && (
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleSyncAllAppointments}
                                            disabled={syncLoading}
                                        >
                                            <CalendarCheck className="w-4 h-4 mr-2" />
                                            {syncLoading ? 'Sincronizando...' : `Sincronizar ${quickStats.unsynced}`}
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <Download className="w-4 h-4 mr-2" />
                                            Exportar
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <Bell className="w-4 h-4 mr-2" />
                                            Lembretes
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Lista de agendamentos */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>
                                        Agendamentos ({filteredAppointments.length})
                                    </CardTitle>
                                    {/* Toggle view mode para desktop */}
                                    <div className="hidden md:flex items-center gap-2">
                                        <Button
                                            variant={viewMode === 'table' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setViewMode('table')}
                                        >
                                            Tabela
                                        </Button>
                                        <Button
                                            variant={viewMode === 'cards' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setViewMode('cards')}
                                        >
                                            Cards
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {filteredAppointments.length === 0 ? (
                                    <div className="text-center py-12 px-6">
                                        <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                            Nenhum agendamento encontrado
                                        </h3>
                                        <p className="text-slate-500 mb-6">
                                            {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                                                ? 'Tente ajustar os filtros.'
                                                : 'Comece criando seu primeiro agendamento.'
                                            }
                                        </p>
                                        <Button
                                            onClick={() => {
                                                setSelectedAppointment(undefined)
                                                setIsModalOpen(true)
                                            }}
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Novo Agendamento
                                        </Button>
                                    </div>
                                ) : viewMode === 'cards' ? (
                                    // View em cards (mobile-friendly)
                                    <div className="p-4 space-y-4">
                                        {filteredAppointments.map((appointment) => (
                                            <AppointmentCard
                                                key={appointment.id}
                                                appointment={appointment}
                                                onEdit={(apt: any) => {
                                                    setSelectedAppointment(apt)
                                                    setIsModalOpen(true)
                                                }}
                                                onStatusChange={handleStatusChange}
                                                onSync={handleSyncAppointment}
                                                onDelete={handleDeleteAppointment}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    // View em tabela (desktop)
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Cliente</TableHead>
                                                    <TableHead>Procedimento</TableHead>
                                                    <TableHead>Data/Hora</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Sync</TableHead>
                                                    <TableHead className="text-right">Ações</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredAppointments.map((appointment) => (
                                                    <TableRow key={appointment.id} className="hover:bg-slate-50">
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-medium">{appointment.clients?.name}</p>
                                                                <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                                                    {appointment.clients?.phone && (
                                                                        <span className="flex items-center gap-1">
                                                                            <Phone className="w-3 h-3" />
                                                                            {appointment.clients.phone}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-medium">{appointment.procedures?.name}</p>
                                                                <p className="text-sm text-slate-500">
                                                                    {appointment.duration_minutes || appointment.procedures?.duration_minutes} min
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-medium">
                                                                    {getDateLabel(appointment.scheduled_datetime)}
                                                                </p>
                                                                <p className="text-sm text-slate-500">
                                                                    {format(new Date(appointment.scheduled_datetime), 'HH:mm')}
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <StatusBadge status={appointment.status} />
                                                        </TableCell>
                                                        <TableCell>
                                                            {appointment.calendar_synced ? (
                                                                <Badge className="bg-green-100 text-green-700 border-green-200">
                                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                                    Sync
                                                                </Badge>
                                                            ) : (
                                                                <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                                                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                                                    Pendente
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setSelectedAppointment(appointment)
                                                                            setIsModalOpen(true)
                                                                        }}
                                                                    >
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Editar
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                                                                        disabled={appointment.status === 'confirmed'}
                                                                    >
                                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                                        Confirmar
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleStatusChange(appointment.id, 'completed')}
                                                                        disabled={appointment.status === 'completed'}
                                                                    >
                                                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                        Concluir
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleSyncAppointment(appointment)}
                                                                        disabled={appointment.calendar_synced}
                                                                    >
                                                                        <CalendarCheck className="mr-2 h-4 w-4" />
                                                                        Sincronizar
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDeleteAppointment(appointment.id)}
                                                                        className="text-red-600"
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
                    </div>
                </main>
            </div>

            {/* Modal mantido */}
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