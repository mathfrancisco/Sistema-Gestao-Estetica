'use client'

import React, { useState, useCallback} from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
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
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    CreditCard,
    History,
    Edit3,
    Trash2,
    MoreVertical,
    ArrowLeft,
    CalendarDays,
    DollarSign,
    Crown,
    UserPlus,
    Target,
    AlertCircle,
    Users,
    Activity,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    Eye,
    RefreshCw,
    FileText,
    Zap
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
    useClient,
    useDeleteClient,
    useUpdateClient,
    useClientStats,
    useClientHistory
} from '@/lib/hooks/useClients'
import { useAppointments } from "@/lib/hooks/useAppointment"
import { Sidebar } from '@/components/layout/sidebar'
import { cn } from '@/lib/utils/utils'
import type { Database } from '@/lib/database/supabase/types'

type Client = Database['public']['Tables']['clients']['Row']
type ClientSegment = Database['public']['Enums']['client_segment_enum']
type AppointmentStatus = Database['public']['Enums']['appointment_status_enum']

const ClientProfilePage: React.FC = () => {
    const params = useParams()
    const router = useRouter()
    const clientId = params.id as string

    // States
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [activeTab, setActiveTab] = useState('overview')
    const [refreshing, setRefreshing] = useState(false)

    // Hooks
    const {
        data: client,
        isLoading: clientLoading,
        error: clientError,
        refetch: refetchClient
    } = useClient(clientId)

    const {
        data: clientStats,
        isLoading: statsLoading,
        refetch: refetchStats
    } = useClientStats(client?.user_id)

    const {
        data: clientHistory,
        isLoading: historyLoading,
        refetch: refetchHistory
    } = useClientHistory(clientId)

    const { mutate: deleteClient } = useDeleteClient()
    const { mutate: updateClient } = useUpdateClient()

    // Get client's recent appointments
    const {
        appointmentsWithDetails: recentAppointments,
        loading: appointmentsLoading,
        fetchAppointmentsWithDetails,
        stats: appointmentStats
    } = useAppointments({
        initialLimit: 5,
        initialFilters: { clientId },
        autoFetch: !!clientId,
        userId: client?.user_id
    })

    // Loading state
    const isLoading = clientLoading || statsLoading || historyLoading || appointmentsLoading

    // Utilities
    const getSegmentInfo = useCallback((segment: ClientSegment | null) => {
        const segmentConfig = {
            vip: {
                label: 'VIP',
                color: 'bg-amber-100 text-amber-800 border-amber-200',
                icon: Crown,
                description: 'Cliente premium com alta frequência'
            },
            regular: {
                label: 'Regular',
                color: 'bg-blue-100 text-blue-800 border-blue-200',
                icon: Users,
                description: 'Cliente com padrão estável de consumo'
            },
            new: {
                label: 'Novo',
                color: 'bg-green-100 text-green-800 border-green-200',
                icon: UserPlus,
                description: 'Cliente recém-cadastrado'
            },
            at_risk: {
                label: 'Em Risco',
                color: 'bg-red-100 text-red-800 border-red-200',
                icon: AlertCircle,
                description: 'Cliente que necessita atenção especial'
            },
            lost: {
                label: 'Perdido',
                color: 'bg-gray-100 text-gray-800 border-gray-200',
                icon: Target,
                description: 'Cliente inativo há muito tempo'
            }
        }
        return segment ? segmentConfig[segment] : null
    }, [])

    const getStatusColor = useCallback((status: AppointmentStatus) => {
        const colors = {
            scheduled: 'text-blue-600',
            confirmed: 'text-indigo-600',
            completed: 'text-green-600',
            cancelled: 'text-red-600',
            no_show: 'text-orange-600'
        }
        return colors[status] || 'text-gray-600'
    }, [])

    const getStatusIcon = useCallback((status: AppointmentStatus) => {
        const icons = {
            scheduled: Calendar,
            confirmed: CheckCircle,
            completed: CheckCircle,
            cancelled: XCircle,
            no_show: AlertCircle
        }
        return icons[status] || Clock
    }, [])

    const formatCurrency = useCallback((value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }, [])

    const formatDate = useCallback((dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }, [])

    const getUserInitials = useCallback(() => {
        if (client?.name) {
            return client.name
                .split(' ')
                .map(name => name.charAt(0))
                .join('')
                .toUpperCase()
                .slice(0, 2)
        }
        return 'CL'
    }, [client?.name])

    // Handlers
    const handleDeleteClient = useCallback(async () => {
        if (!client) return

        setIsDeleting(true)
        try {
            deleteClient(client.id, {
                onSuccess: () => {
                    toast.success('Cliente excluído com sucesso!')
                    router.push('/clientes')
                },
                onError: (error) => {
                    toast.error(`Erro ao excluir cliente: ${error.message}`)
                    setIsDeleting(false)
                }
            })
        } catch (error) {
            toast.error('Erro ao excluir cliente')
            setIsDeleting(false)
        } finally {
            setDeleteDialogOpen(false)
        }
    }, [client, deleteClient, router])

    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        try {
            await Promise.all([
                refetchClient(),
                refetchStats(),
                refetchHistory(),
                fetchAppointmentsWithDetails()
            ])
            toast.success('Dados atualizados!')
        } catch (error) {
            toast.error('Erro ao atualizar dados')
        } finally {
            setRefreshing(false)
        }
    }, [refetchClient, refetchStats, refetchHistory, fetchAppointmentsWithDetails])

    const handleScheduleAppointment = useCallback(() => {
        router.push(`/agendamentos/novo?clientId=${clientId}`)
    }, [router, clientId])

    const handleUpdateSegment = useCallback((segment: ClientSegment) => {
        if (!client) return

        updateClient({
            id: client.id,
            data: { segment }
        }, {
            onSuccess: () => {
                toast.success('Segmento atualizado com sucesso!')
                refetchClient()
            },
            onError: (error) => {
                toast.error(`Erro ao atualizar segmento: ${error.message}`)
            }
        })
    }, [client, updateClient, refetchClient])

    // Calculate completion rate
    const completionRate = appointmentStats ?
        ((appointmentStats.completed / appointmentStats.total) * 100) : 0

    // Error state
    if (clientError) {
        return (
            <TooltipProvider>
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                    <Sidebar />
                    <div className="lg:ml-64">
                        <div className="flex flex-col items-center justify-center h-96 space-y-4">
                            <AlertCircle className="w-12 h-12 text-red-500" />
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">Erro ao carregar cliente</h3>
                                <p className="text-slate-600">O cliente não foi encontrado ou ocorreu um erro.</p>
                                <Link href="/clientes">
                                    <Button className="mt-4">
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Voltar para Clientes
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </TooltipProvider>
        )
    }

    // Loading state
    if (isLoading) {
        return (
            <TooltipProvider>
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                    <Sidebar />
                    <div className="lg:ml-64">
                        <div className="flex flex-col items-center justify-center h-96 space-y-4">
                            <div className="relative">
                                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                                <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping"></div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">Carregando Perfil</h3>
                                <p className="text-slate-600">Preparando informações do cliente...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </TooltipProvider>
        )
    }

    if (!client) {
        return (
            <TooltipProvider>
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                    <Sidebar />
                    <div className="lg:ml-64">
                        <div className="flex flex-col items-center justify-center h-96 space-y-4">
                            <User className="w-12 h-12 text-slate-400" />
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">Cliente não encontrado</h3>
                                <p className="text-slate-600">O cliente solicitado não existe.</p>
                                <Link href="/clientes">
                                    <Button className="mt-4">
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Voltar para Clientes
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </TooltipProvider>
        )
    }

    const segmentInfo = getSegmentInfo(client.segment)

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <Sidebar />

                <div className="lg:ml-64">
                    {/* Header */}
                    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
                        <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <Link href="/clientes">
                                        <Button variant="ghost" size="sm" className="p-2 hover:bg-slate-100 rounded-xl">
                                            <ArrowLeft className="w-4 h-4" />
                                        </Button>
                                    </Link>

                                    <div className="flex items-center gap-4">
                                        <Avatar className="w-16 h-16 ring-4 ring-white shadow-xl">
                                            <AvatarImage src="/placeholder-avatar.jpg" alt={client.name} />
                                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-bold">
                                                {getUserInitials()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                                {client.name}
                                            </h1>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-slate-600 text-sm">
                                                    Cliente desde {formatDate(client.created_at)}
                                                </p>
                                                {segmentInfo && (
                                                    <Badge className={cn("border", segmentInfo.color)}>
                                                        <segmentInfo.icon className="w-3 h-3 mr-1" />
                                                        {segmentInfo.label}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleRefresh}
                                                disabled={refreshing}
                                                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200"
                                            >
                                                <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Atualizar dados</p>
                                        </TooltipContent>
                                    </Tooltip>

                                    <Button
                                        onClick={handleScheduleAppointment}
                                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 border-0"
                                    >
                                        <Calendar className="w-4 h-4 mr-2" />
                                        Novo Agendamento
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="p-2">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem asChild>
                                                <Link href={`/clientes/${clientId}/editar`}>
                                                    <Edit3 className="w-4 h-4 mr-2" />
                                                    Editar Cliente
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/clientes/${clientId}/historico`}>
                                                    <History className="w-4 h-4 mr-2" />
                                                    Ver Histórico
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => setDeleteDialogOpen(true)}
                                                className="text-red-600 focus:text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Excluir Cliente
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Content */}
                    <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                        <div className="max-w-7xl mx-auto space-y-6">

                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-slate-600">Total Gasto</p>
                                                <p className="text-2xl font-bold text-slate-900">
                                                    {formatCurrency(client.total_spent || 0)}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl">
                                                <DollarSign className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-slate-600">Total de Visitas</p>
                                                <p className="text-2xl font-bold text-slate-900">
                                                    {client.total_visits || 0}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl">
                                                <CalendarDays className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-slate-600">Taxa de Conclusão</p>
                                                <p className="text-2xl font-bold text-slate-900">
                                                    {completionRate.toFixed(1)}%
                                                </p>
                                            </div>
                                            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl">
                                                <Activity className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-slate-600">Status</p>
                                                <p className="text-2xl font-bold text-slate-900 capitalize">
                                                    {client.status === 'active' ? 'Ativo' :
                                                        client.status === 'inactive' ? 'Inativo' : 'Bloqueado'}
                                                </p>
                                            </div>
                                            <div className={cn(
                                                "p-3 rounded-2xl",
                                                client.status === 'active' ? "bg-gradient-to-br from-green-500 to-emerald-500" :
                                                    client.status === 'inactive' ? "bg-gradient-to-br from-gray-500 to-slate-500" :
                                                        "bg-gradient-to-br from-red-500 to-red-600"
                                            )}>
                                                <CheckCircle className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Main Content Tabs */}
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                                <TabsList className="grid w-full grid-cols-3 lg:w-96">
                                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                                    <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
                                    <TabsTrigger value="details">Detalhes</TabsTrigger>
                                </TabsList>

                                <TabsContent value="overview" className="space-y-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Recent Appointments */}
                                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Clock className="w-5 h-5 text-blue-500" />
                                                    Agendamentos Recentes
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {recentAppointments && recentAppointments.length > 0 ? (
                                                    <div className="space-y-4">
                                                        {recentAppointments.slice(0, 3).map((appointment) => {
                                                            const StatusIcon = getStatusIcon(appointment.status)
                                                            return (
                                                                <div key={appointment.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                                                    <StatusIcon className={cn("w-5 h-5", getStatusColor(appointment.status))} />
                                                                    <div className="flex-1">
                                                                        <p className="font-medium text-slate-900">
                                                                            {appointment.procedure?.name || 'Procedimento'}
                                                                        </p>
                                                                        <p className="text-sm text-slate-600">
                                                                            {formatDate(appointment.scheduled_datetime)}
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="font-semibold text-slate-900">
                                                                            {formatCurrency(appointment.price || 0)}
                                                                        </p>
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {appointment.status}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                        <Link href={`/clientes/${clientId}/historico`}>
                                                            <Button variant="outline" className="w-full">
                                                                Ver Histórico Completo
                                                                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8">
                                                        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                                        <p className="text-slate-500">Nenhum agendamento encontrado</p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        {/* Quick Actions */}
                                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Zap className="w-5 h-5 text-purple-500" />
                                                    Ações Rápidas
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <Button
                                                    onClick={handleScheduleAppointment}
                                                    className="w-full justify-start h-auto p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 text-blue-700"
                                                >
                                                    <Calendar className="w-5 h-5 mr-3" />
                                                    <div className="text-left">
                                                        <p className="font-medium">Novo Agendamento</p>
                                                        <p className="text-sm opacity-75">Agendar próxima consulta</p>
                                                    </div>
                                                </Button>

                                                <Link href={`/clientes/${clientId}/historico`} className="block">
                                                    <Button
                                                        variant="outline"
                                                        className="w-full justify-start h-auto p-4 hover:bg-amber-50 border-amber-200"
                                                    >
                                                        <History className="w-5 h-5 text-amber-600 mr-3" />
                                                        <div className="text-left">
                                                            <p className="font-medium text-slate-900">Ver Histórico</p>
                                                            <p className="text-sm text-slate-600">Cronologia completa</p>
                                                        </div>
                                                    </Button>
                                                </Link>

                                                <Link href={`/clientes/${clientId}/editar`} className="block">
                                                    <Button
                                                        variant="outline"
                                                        className="w-full justify-start h-auto p-4 hover:bg-green-50 border-green-200"
                                                    >
                                                        <Edit3 className="w-5 h-5 text-green-600 mr-3" />
                                                        <div className="text-left">
                                                            <p className="font-medium text-slate-900">Editar Dados</p>
                                                            <p className="text-sm text-slate-600">Atualizar informações</p>
                                                        </div>
                                                    </Button>
                                                </Link>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>

                                <TabsContent value="appointments" className="space-y-6">
                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader>
                                            <CardTitle>Todos os Agendamentos</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {recentAppointments && recentAppointments.length > 0 ? (
                                                <div className="space-y-4">
                                                    {recentAppointments.map((appointment) => {
                                                        const StatusIcon = getStatusIcon(appointment.status)
                                                        return (
                                                            <div key={appointment.id} className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                                                <StatusIcon className={cn("w-6 h-6", getStatusColor(appointment.status))} />
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <h3 className="font-semibold text-slate-900">
                                                                            {appointment.procedure?.name || 'Procedimento'}
                                                                        </h3>
                                                                        <Badge variant="outline">
                                                                            {appointment.status}
                                                                        </Badge>
                                                                    </div>
                                                                    <p className="text-sm text-slate-600">
                                                                        {formatDate(appointment.scheduled_datetime)} às {new Date(appointment.scheduled_datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                    {appointment.notes && (
                                                                        <p className="text-sm text-slate-500 mt-1">{appointment.notes}</p>
                                                                    )}
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-bold text-lg text-slate-900">
                                                                        {formatCurrency(appointment.price || 0)}
                                                                    </p>
                                                                    {appointment.duration_minutes && (
                                                                        <p className="text-sm text-slate-500">
                                                                            {appointment.duration_minutes} min
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-center py-12">
                                                    <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                                        Nenhum agendamento encontrado
                                                    </h3>
                                                    <p className="text-slate-500 mb-6">
                                                        Este cliente ainda não possui agendamentos registrados.
                                                    </p>
                                                    <Button onClick={handleScheduleAppointment}>
                                                        <Calendar className="w-4 h-4 mr-2" />
                                                        Criar Primeiro Agendamento
                                                    </Button>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="details" className="space-y-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Contact Information */}
                                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <User className="w-5 h-5 text-blue-500" />
                                                    Informações de Contato
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {client.email && (
                                                    <div className="flex items-center gap-3">
                                                        <Mail className="w-5 h-5 text-slate-400" />
                                                        <div>
                                                            <p className="font-medium text-slate-900">Email</p>
                                                            <p className="text-slate-600">{client.email}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {client.phone && (
                                                    <div className="flex items-center gap-3">
                                                        <Phone className="w-5 h-5 text-slate-400" />
                                                        <div>
                                                            <p className="font-medium text-slate-900">Telefone</p>
                                                            <p className="text-slate-600">{client.phone}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {client.cpf && (
                                                    <div className="flex items-center gap-3">
                                                        <CreditCard className="w-5 h-5 text-slate-400" />
                                                        <div>
                                                            <p className="font-medium text-slate-900">CPF</p>
                                                            <p className="text-slate-600">{client.cpf}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {client.birthday && (
                                                    <div className="flex items-center gap-3">
                                                        <Calendar className="w-5 h-5 text-slate-400" />
                                                        <div>
                                                            <p className="font-medium text-slate-900">Data de Nascimento</p>
                                                            <p className="text-slate-600">{formatDate(client.birthday)}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {client.address && (
                                                    <div className="flex items-center gap-3">
                                                        <MapPin className="w-5 h-5 text-slate-400" />
                                                        <div>
                                                            <p className="font-medium text-slate-900">Endereço</p>
                                                            <p className="text-slate-600">
                                                                {typeof client.address === 'string' ?
                                                                    client.address :
                                                                    JSON.stringify(client.address)
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        {/* Additional Info */}
                                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <FileText className="w-5 h-5 text-green-500" />
                                                    Informações Adicionais
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div>
                                                    <p className="font-medium text-slate-900 mb-2">Segmento</p>
                                                    <div className="flex items-center gap-2">
                                                        {segmentInfo ? (
                                                            <Badge className={cn("border", segmentInfo.color)}>
                                                                <segmentInfo.icon className="w-3 h-3 mr-1" />
                                                                {segmentInfo.label}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline">Não definido</Badge>
                                                        )}
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm">
                                                                    <Edit3 className="w-3 h-3" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent>
                                                                <DropdownMenuItem onClick={() => handleUpdateSegment('new')}>
                                                                    <UserPlus className="w-4 h-4 mr-2" />
                                                                    Novo
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleUpdateSegment('regular')}>
                                                                    <Users className="w-4 h-4 mr-2" />
                                                                    Regular
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleUpdateSegment('vip')}>
                                                                    <Crown className="w-4 h-4 mr-2" />
                                                                    VIP
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleUpdateSegment('at_risk')}>
                                                                    <AlertCircle className="w-4 h-4 mr-2" />
                                                                    Em Risco
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                    {segmentInfo && (
                                                        <p className="text-sm text-slate-600 mt-1">{segmentInfo.description}</p>
                                                    )}
                                                </div>

                                                {client.preferences && (
                                                    <div>
                                                        <p className="font-medium text-slate-900 mb-1">Preferências</p>
                                                        <p className="text-slate-600 text-sm">{client.preferences}</p>
                                                    </div>
                                                )}

                                                {client.observations && (
                                                    <div>
                                                        <p className="font-medium text-slate-900 mb-1">Observações</p>
                                                        <p className="text-slate-600 text-sm">{client.observations}</p>
                                                    </div>
                                                )}

                                                <div>
                                                    <p className="font-medium text-slate-900 mb-1">Cadastrado em</p>
                                                    <p className="text-slate-600 text-sm">{formatDate(client.created_at)}</p>
                                                </div>

                                                {client.updated_at && (
                                                    <div>
                                                        <p className="font-medium text-slate-900 mb-1">Última atualização</p>
                                                        <p className="text-slate-600 text-sm">{formatDate(client.updated_at)}</p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </main>
                </div>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Excluir Cliente</DialogTitle>
                            <DialogDescription>
                                Tem certeza que deseja excluir <strong>{client.name}</strong>?
                                Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setDeleteDialogOpen(false)}
                                disabled={isDeleting}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDeleteClient}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Excluindo...
                                    </div>
                                ) : (
                                    'Excluir Cliente'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    )
}

export default ClientProfilePage