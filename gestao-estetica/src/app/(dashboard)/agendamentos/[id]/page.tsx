'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    CalendarIcon,
    Clock,
    User,
    Scissors,
    Phone,
    Mail,
    ArrowLeft,
    Calendar as GoogleCalendarIcon,
    CheckCircle,
    AlertCircle,
    Edit,
    Trash2,
    MoreHorizontal,
    DollarSign,
    Activity,
    TrendingUp,
    ChevronRight,
    Bell,
    Users,
    Sparkles,
    RefreshCw,
    XCircle,
    MessageSquare,
    History,
    ExternalLink
} from 'lucide-react'
import { format, isToday, isTomorrow, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'

import { useAuthStore } from '@/store/useAuthStore'
import { toast } from 'sonner'
import type { Database } from '@/lib/database/supabase/types'
import {useAppointments} from "@/lib/hooks/useAppointment";

type AppointmentWithDetails = {
    id: string
    user_id: string
    client_id: string
    procedure_id: string
    scheduled_datetime: string
    duration_minutes: number
    status: Database['public']['Enums']['appointment_status_enum']
    notes: string | null
    google_event_id: string | null
    google_meet_link: string | null
    calendar_synced: boolean
    created_at: string
    updated_at: string
    clients?: {
        id: string
        name: string
        email: string | null
        phone: string | null
        birthday: string | null
        total_visits: number
        total_spent: number
    } | null
    procedures?: {
        id: string
        name: string
        description: string | null
        price: number
        duration_minutes: number
        procedure_categories?: {
            id: string
            name: string
            color: string | null
        } | null
    } | null
}

interface DetalhesAgendamentoPageProps {
    params: {
        id: string
    }
}

const DetalhesAgendamentoPage: React.FC<DetalhesAgendamentoPageProps> = ({ params }) => {
    const router = useRouter()
    const { user } = useAuthStore()
    const [appointment, setAppointment] = useState<AppointmentWithDetails | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

    const {
        getAppointmentById,
        updateAppointmentStatus,
        deleteAppointment,
        error: appointmentError,
        clearError
    } = useAppointments({
        autoFetch: false
    })

    // Carregar dados do agendamento
    useEffect(() => {
        const loadAppointment = async () => {
            if (!params.id || !user) return

            try {
                setIsLoading(true)
                const data = await getAppointmentById(params.id)
                if (data) {
                    setAppointment(data)
                } else {
                    toast.error('Agendamento não encontrado')
                    router.push('/agendamentos')
                }
            } catch (error) {
                console.error('Erro ao carregar agendamento:', error)
                toast.error('Erro ao carregar agendamento')
            } finally {
                setIsLoading(false)
            }
        }

        loadAppointment()
    }, [params.id, user, getAppointmentById, router])

    // Limpar erros
    useEffect(() => {
        if (appointmentError) {
            toast.error(appointmentError)
            clearError()
        }
    }, [appointmentError, clearError])

    const handleStatusChange = async (newStatus: Database['public']['Enums']['appointment_status_enum']) => {
        if (!appointment) return

        try {
            setIsUpdatingStatus(true)
            const success = await updateAppointmentStatus(appointment.id, newStatus)
            if (success) {
                setAppointment(prev => prev ? { ...prev, status: newStatus } : null)
                toast.success('Status atualizado com sucesso!')
            }
        } catch (error) {
            console.error('Erro ao atualizar status:', error)
            toast.error('Erro ao atualizar status')
        } finally {
            setIsUpdatingStatus(false)
        }
    }

    const handleDelete = async () => {
        if (!appointment) return

        try {
            setIsDeleting(true)
            const success = await deleteAppointment(appointment.id)
            if (success) {
                toast.success('Agendamento excluído com sucesso!')
                router.push('/agendamentos')
            }
        } catch (error) {
            console.error('Erro ao excluir agendamento:', error)
            toast.error('Erro ao excluir agendamento')
        } finally {
            setIsDeleting(false)
            setShowDeleteDialog(false)
        }
    }

    const getStatusBadge = (status: Database['public']['Enums']['appointment_status_enum']) => {
        const statusConfig = {
            scheduled: { label: 'Agendado', variant: 'secondary' as const, icon: Clock, color: 'bg-blue-100 text-blue-700 border-blue-200' },
            confirmed: { label: 'Confirmado', variant: 'default' as const, icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
            completed: { label: 'Concluído', variant: 'default' as const, icon: CheckCircle, color: 'bg-purple-100 text-purple-700 border-purple-200' },
            cancelled: { label: 'Cancelado', variant: 'destructive' as const, icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200' },
            no_show: { label: 'Não Compareceu', variant: 'destructive' as const, icon: AlertCircle, color: 'bg-orange-100 text-orange-700 border-orange-200' }
        }

        const config = statusConfig[status]
        const Icon = config.icon

        return (
            <Badge className={`flex items-center gap-1 ${config.color} border`}>
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

    const getTimeLeft = () => {
        if (!appointment) return null

        const appointmentDate = new Date(appointment.scheduled_datetime)
        const now = new Date()
        const diffMs = appointmentDate.getTime() - now.getTime()
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))

        if (diffMs < 0) return 'Já passou'
        if (diffHours <= 1) return 'Em menos de 1 hora'
        if (diffHours <= 24) return `Em ${diffHours} horas`

        const diffDays = Math.ceil(diffHours / 24)
        return `Em ${diffDays} dias`
    }

    // Estados de loading
    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <Sidebar />
                <div className="lg:ml-64">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-4" />
                            <p className="text-orange-600 mb-4">Usuário não autenticado</p>
                            <Button onClick={() => router.push('/login')} className="bg-blue-500 hover:bg-blue-600">
                                Fazer Login
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <Sidebar />
                <div className="lg:ml-64">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                            <p className="text-slate-600">Carregando agendamento...</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!appointment) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <Sidebar />
                <div className="lg:ml-64">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                            <p className="text-red-600 mb-4">Agendamento não encontrado</p>
                            <Link href="/agendamentos">
                                <Button className="bg-blue-500 hover:bg-blue-600">
                                    Voltar aos Agendamentos
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Dados das métricas
    const metricsData = [
        {
            title: 'Valor do Serviço',
            value: `R$ ${appointment.procedures?.price.toFixed(2) || '0,00'}`,
            icon: DollarSign,
            description: 'Preço do procedimento',
            gradient: 'from-emerald-500 to-emerald-600',
            trend: { value: appointment.procedures?.price || 0, label: 'valor', isPositive: true }
        },
        {
            title: 'Duração',
            value: `${appointment.duration_minutes}min`,
            icon: Clock,
            description: 'Tempo estimado',
            gradient: 'from-blue-500 to-blue-600',
            trend: { value: appointment.duration_minutes, label: 'minutos', isPositive: true }
        },
        {
            title: 'Total de Visitas',
            value: appointment.clients?.total_visits || 0,
            icon: Users,
            description: 'Histórico do cliente',
            gradient: 'from-purple-500 to-purple-600',
            trend: { value: appointment.clients?.total_visits || 0, label: 'visitas', isPositive: true }
        },
        {
            title: 'Status',
            value: getStatusBadge(appointment.status).props.children[1],
            icon: Activity,
            description: getTimeLeft() || 'Agendamento',
            gradient: appointment.status === 'completed' ? 'from-green-500 to-green-600' :
                appointment.status === 'cancelled' ? 'from-red-500 to-red-600' : 'from-orange-500 to-orange-600',
            trend: { value: 1, label: 'status', isPositive: appointment.status === 'completed' }
        }
    ]

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
                                        <CalendarIcon className="w-4 h-4 text-white" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                        Detalhes do Agendamento
                                    </h1>
                                </div>
                                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                    {appointment.clients?.name} • {appointment.procedures?.name} • {getDateLabel(appointment.scheduled_datetime)}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                {/* Status Badge */}
                                {getStatusBadge(appointment.status)}

                                {/* Botões de Ação */}
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <button
                                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                                        onClick={() => window.location.reload()}
                                    >
                                        <RefreshCw className="w-4 h-4 text-slate-600" />
                                    </button>
                                    <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                        <Bell className="w-4 h-4 text-slate-600" />
                                    </button>
                                </div>

                                {/* Botões Principais */}
                                <div className="flex items-center gap-2 ml-2">
                                    <Link href="/agendamentos">
                                        <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50 shadow-sm">
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            <span className="hidden sm:inline">Agendamentos</span>
                                            <span className="sm:hidden">Voltar</span>
                                        </Button>
                                    </Link>
                                    <Link href={`/agendamentos/${appointment.id}/editar`}>
                                        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 border-0">
                                            <Edit className="w-4 h-4 mr-2" />
                                            <span className="hidden sm:inline">Editar</span>
                                            <span className="sm:hidden">Edit</span>
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

                        {/* Métricas Principais */}
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
                                                {typeof metric.value === 'string' ? metric.value : metric.value.toLocaleString()}
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

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Informações do Agendamento */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Informações Principais */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                        <CardTitle className="flex items-center justify-between text-lg">
                                            <div className="flex items-center gap-2">
                                                <CalendarIcon className="w-5 h-5 text-blue-500" />
                                                Informações do Agendamento
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/agendamentos/${appointment.id}/editar`}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleStatusChange('confirmed')}
                                                        disabled={appointment.status === 'confirmed' || isUpdatingStatus}
                                                    >
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Confirmar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleStatusChange('completed')}
                                                        disabled={appointment.status === 'completed' || isUpdatingStatus}
                                                    >
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Marcar como Concluído
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleStatusChange('cancelled')}
                                                        disabled={appointment.status === 'cancelled' || isUpdatingStatus}
                                                        className="text-red-600"
                                                    >
                                                        <XCircle className="mr-2 h-4 w-4" />
                                                        Cancelar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => setShowDeleteDialog(true)}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 lg:p-6 space-y-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-sm font-medium text-slate-600">Data e Horário</label>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <CalendarIcon className="w-4 h-4 text-slate-400" />
                                                        <span className="font-medium">{getDateLabel(appointment.scheduled_datetime)}</span>
                                                        <span className="text-slate-500">às {format(new Date(appointment.scheduled_datetime), 'HH:mm')}</span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-slate-600">Duração</label>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Clock className="w-4 h-4 text-slate-400" />
                                                        <span className="font-medium">{appointment.duration_minutes} minutos</span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-slate-600">Status</label>
                                                    <div className="mt-1">
                                                        {getStatusBadge(appointment.status)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-sm font-medium text-slate-600">Google Calendar</label>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <GoogleCalendarIcon className="w-4 h-4 text-slate-400" />
                                                        {appointment.calendar_synced ? (
                                                            <div className="flex items-center gap-2">
                                                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                                                    Sincronizado
                                                                </Badge>
                                                                {appointment.google_event_id && (
                                                                    <Button variant="ghost" size="sm" className="h-6 px-2">
                                                                        <ExternalLink className="w-3 h-3" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                                                                Não sincronizado
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-slate-600">Criado em</label>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <History className="w-4 h-4 text-slate-400" />
                                                        <span className="text-slate-700">
                                                            {format(new Date(appointment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                                        </span>
                                                    </div>
                                                </div>

                                                {appointment.updated_at !== appointment.created_at && (
                                                    <div>
                                                        <label className="text-sm font-medium text-slate-600">Atualizado em</label>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <RefreshCw className="w-4 h-4 text-slate-400" />
                                                            <span className="text-slate-700">
                                                                {format(new Date(appointment.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {appointment.notes && (
                                            <div>
                                                <label className="text-sm font-medium text-slate-600">Observações</label>
                                                <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                                    <p className="text-slate-700">{appointment.notes}</p>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Informações do Cliente */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <User className="w-5 h-5 text-emerald-500" />
                                            Informações do Cliente
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 lg:p-6">
                                        {appointment.clients ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-lg font-semibold text-slate-900">{appointment.clients.name}</h3>
                                                    <Link href={`/clientes/${appointment.clients.id}`}>
                                                        <Button variant="outline" size="sm">
                                                            <ExternalLink className="w-4 h-4 mr-2" />
                                                            Ver Perfil
                                                        </Button>
                                                    </Link>
                                                </div>

                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                    {appointment.clients.phone && (
                                                        <div className="flex items-center gap-3">
                                                            <Phone className="w-4 h-4 text-slate-400" />
                                                            <div>
                                                                <p className="text-sm text-slate-600">Telefone</p>
                                                                <p className="font-medium">{appointment.clients.phone}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {appointment.clients.email && (
                                                        <div className="flex items-center gap-3">
                                                            <Mail className="w-4 h-4 text-slate-400" />
                                                            <div>
                                                                <p className="text-sm text-slate-600">Email</p>
                                                                <p className="font-medium">{appointment.clients.email}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-3">
                                                        <Users className="w-4 h-4 text-slate-400" />
                                                        <div>
                                                            <p className="text-sm text-slate-600">Total de Visitas</p>
                                                            <p className="font-medium">{appointment.clients.total_visits}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <DollarSign className="w-4 h-4 text-slate-400" />
                                                        <div>
                                                            <p className="text-sm text-slate-600">Total Gasto</p>
                                                            <p className="font-medium">R$ {appointment.clients.total_spent.toFixed(2)}</p>
                                                        </div>
                                                    </div>

                                                    {appointment.clients.birthday && (
                                                        <div className="flex items-center gap-3">
                                                            <CalendarIcon className="w-4 h-4 text-slate-400" />
                                                            <div>
                                                                <p className="text-sm text-slate-600">Data de Nascimento</p>
                                                                <p className="font-medium">
                                                                    {format(new Date(appointment.clients.birthday), 'dd/MM/yyyy')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-6">
                                                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                                <p className="text-slate-500">Informações do cliente não encontradas</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Informações do Procedimento */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Scissors className="w-5 h-5 text-purple-500" />
                                            Informações do Procedimento
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 lg:p-6">
                                        {appointment.procedures ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-slate-900">{appointment.procedures.name}</h3>
                                                        {appointment.procedures.procedure_categories && (
                                                            <Badge
                                                                className="mt-1"
                                                                style={{
                                                                    backgroundColor: appointment.procedures.procedure_categories.color + '20',
                                                                    color: appointment.procedures.procedure_categories.color,
                                                                    borderColor: appointment.procedures.procedure_categories.color + '40'
                                                                }}
                                                            >
                                                                {appointment.procedures.procedure_categories.name}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <Link href={`/procedimentos/${appointment.procedures.id}`}>
                                                        <Button variant="outline" size="sm">
                                                            <ExternalLink className="w-4 h-4 mr-2" />
                                                            Ver Detalhes
                                                        </Button>
                                                    </Link>
                                                </div>

                                                {appointment.procedures.description && (
                                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                                        <p className="text-slate-700">{appointment.procedures.description}</p>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <DollarSign className="w-4 h-4 text-slate-400" />
                                                        <div>
                                                            <p className="text-sm text-slate-600">Preço</p>
                                                            <p className="font-semibold text-lg">R$ {appointment.procedures.price.toFixed(2)}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <Clock className="w-4 h-4 text-slate-400" />
                                                        <div>
                                                            <p className="text-sm text-slate-600">Duração Padrão</p>
                                                            <p className="font-medium">{appointment.procedures.duration_minutes} min</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <Activity className="w-4 h-4 text-slate-400" />
                                                        <div>
                                                            <p className="text-sm text-slate-600">Duração Real</p>
                                                            <p className="font-medium">{appointment.duration_minutes} min</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-6">
                                                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                                <p className="text-slate-500">Informações do procedimento não encontradas</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sidebar com Ações */}
                            <div className="space-y-6">
                                {/* Ações Rápidas */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Sparkles className="w-5 h-5 text-purple-500" />
                                            Ações Rápidas
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 lg:p-6 space-y-3">
                                        <Link href={`/agendamentos/${appointment.id}/editar`} className="block">
                                            <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 border-0">
                                                <Edit className="w-4 h-4 mr-2" />
                                                Editar Agendamento
                                            </Button>
                                        </Link>

                                        {appointment.status === 'scheduled' && (
                                            <Button
                                                onClick={() => handleStatusChange('confirmed')}
                                                disabled={isUpdatingStatus}
                                                className="w-full bg-emerald-600 hover:bg-emerald-700"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Confirmar Agendamento
                                            </Button>
                                        )}

                                        {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                                            <Button
                                                onClick={() => handleStatusChange('completed')}
                                                disabled={isUpdatingStatus}
                                                className="w-full bg-purple-600 hover:bg-purple-700"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Marcar como Concluído
                                            </Button>
                                        )}

                                        <Button
                                            variant="outline"
                                            className="w-full bg-white border-slate-200 hover:bg-slate-50"
                                            onClick={() => {
                                                if (appointment.clients?.phone) {
                                                    const message = `Olá ${appointment.clients.name}! Lembrando do seu agendamento de ${appointment.procedures?.name} marcado para ${getDateLabel(appointment.scheduled_datetime)} às ${format(new Date(appointment.scheduled_datetime), 'HH:mm')}.`
                                                    const whatsappUrl = `https://wa.me/${appointment.clients.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
                                                    window.open(whatsappUrl, '_blank')
                                                }
                                            }}
                                            disabled={!appointment.clients?.phone}
                                        >
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Enviar Lembrete
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="w-full text-red-600 border-red-200 hover:bg-red-50"
                                            onClick={() => setShowDeleteDialog(true)}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Excluir Agendamento
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* Resumo Financeiro */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <DollarSign className="w-5 h-5 text-emerald-500" />
                                            Resumo Financeiro
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 lg:p-6 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600">Valor do Procedimento</span>
                                            <span className="font-semibold">R$ {appointment.procedures?.price.toFixed(2) || '0,00'}</span>
                                        </div>

                                        <div className="border-t pt-4">
                                            <div className="flex justify-between items-center text-lg font-bold">
                                                <span>Total</span>
                                                <span className="text-emerald-600">R$ {appointment.procedures?.price.toFixed(2) || '0,00'}</span>
                                            </div>
                                        </div>

                                        {appointment.status === 'completed' && (
                                            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                                <div className="flex items-center gap-2 text-emerald-700">
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span className="font-medium">Procedimento Concluído</span>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Informações do Google Calendar */}
                                {appointment.calendar_synced && (
                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <GoogleCalendarIcon className="w-5 h-5 text-blue-500" />
                                                Google Calendar
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 lg:p-6">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                    <span className="text-sm font-medium">Evento sincronizado</span>
                                                </div>

                                                {appointment.google_event_id && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full"
                                                        onClick={() => {
                                                            const calendarUrl = `https://calendar.google.com/calendar/event?eid=${appointment.google_event_id}`
                                                            window.open(calendarUrl, '_blank')
                                                        }}
                                                    >
                                                        <ExternalLink className="w-4 h-4 mr-2" />
                                                        Abrir no Google Calendar
                                                    </Button>
                                                )}

                                                {appointment.google_meet_link && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full"
                                                        onClick={() => window.open(appointment.google_meet_link!, '_blank')}
                                                    >
                                                        <ExternalLink className="w-4 h-4 mr-2" />
                                                        Abrir Google Meet
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Dialog de Confirmação de Exclusão */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excluir Agendamento</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Excluindo...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Excluir
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default DetalhesAgendamentoPage