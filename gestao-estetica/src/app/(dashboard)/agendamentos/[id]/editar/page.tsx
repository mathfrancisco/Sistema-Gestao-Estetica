'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    CalendarIcon,
    Clock,
    User,
    Scissors,
    Phone,
    Mail,
    ArrowLeft,
    Calendar as GoogleCalendarIcon,
    AlertCircle,
    Save,
    Search,
    DollarSign,
    Activity,
    TrendingUp,
    ChevronRight,
    Users,
    RefreshCw,
    History,
} from 'lucide-react'
import { format, setHours, setMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TimeSlots from '@/components/calendar/TimeSlots'
import { Sidebar } from '@/components/layout/sidebar'
import { useClients } from '@/lib/hooks/useClients'
import { useProcedures } from '@/lib/hooks/useProcedures'
import { useGoogleCalendar } from '@/lib/hooks/useGoogleCalendar'
import { useAuthStore } from '@/store/useAuthStore'
import { toast } from 'sonner'
import type { Database } from '@/lib/database/supabase/types'
import {useAppointments} from "@/lib/hooks/useAppointment";

// Tipos baseados no schema do banco
type Client = Database['public']['Tables']['clients']['Row']
type Procedure = Database['public']['Tables']['procedures']['Row'] & {
    procedure_categories?: Database['public']['Tables']['procedure_categories']['Row'] | null
}
type AppointmentUpdate = Database['public']['Tables']['appointments']['Update']

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
    } | null
    procedures?: {
        id: string
        name: string
        description: string | null
        price: number
        duration_minutes: number
    } | null
}

// Schema de validação
const appointmentSchema = z.object({
    client_id: z.string().min(1, 'Selecione um cliente'),
    procedure_id: z.string().min(1, 'Selecione um procedimento'),
    scheduled_datetime: z.date({ required_error: 'Selecione uma data' }),
    time: z.string().min(1, 'Selecione um horário'),
    duration_minutes: z.number().min(15, 'Duração mínima de 15 minutos'),
    notes: z.string().optional(),
    status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']),
    updateGoogleEvent: z.boolean().optional().default(true),
    sendNotification: z.boolean().optional().default(false)
})

type AppointmentFormData = z.infer<typeof appointmentSchema>

const timeSlots = Array.from({ length: 21 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8
    const minute = (i % 2) * 30
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
})

interface EditarAgendamentoPageProps {
    params: {
        id: string
    }
}

const EditarAgendamentoPage: React.FC<EditarAgendamentoPageProps> = ({ params }) => {
    const router = useRouter()
    const { user } = useAuthStore()
    const [appointment, setAppointment] = useState<AppointmentWithDetails | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date>()
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null)
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
    const [clientSearch, setClientSearch] = useState('')
    const [procedureSearch, setProcedureSearch] = useState('')
    const [conflicts, setConflicts] = useState<any[]>([])
    const [showTimeSlots, setShowTimeSlots] = useState(false)
    const [isLoadingAppointment, setIsLoadingAppointment] = useState(true)

    // Hooks para gerenciar dados reais
    const {
        data: clientsData,
        isLoading: clientsLoading,
        error: clientsError
    } = useClients({
        page: 1,
        limit: 100,
        filters: {}
    })

    const {
        data: proceduresData,
        isLoading: proceduresLoading,
        error: proceduresError
    } = useProcedures({
        page: 1,
        limit: 100,
        filters: { is_active: true }
    })

    const {
        getAppointmentById,
        updateAppointment,
        loading: appointmentLoading,
        error: appointmentError,
        checkConflicts,
        clearError
    } = useAppointments({
        autoFetch: false
    })

    const {
        updateEvent,
        loading: calendarLoading,
        error: calendarError
    } = useGoogleCalendar()

    // Dados dos hooks
    const clients = clientsData?.data || []
    const procedures = proceduresData?.data || []
    const isLoading = appointmentLoading || calendarLoading

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<AppointmentFormData>({
        resolver: zodResolver(appointmentSchema),
        defaultValues: {
            updateGoogleEvent: true,
            sendNotification: false,
            notes: '',
            status: 'scheduled'
        }
    })

    const watchedValues = watch()

    // Carregar dados do agendamento
    useEffect(() => {
        const loadAppointment = async () => {
            if (!params.id || !user) return

            try {
                setIsLoadingAppointment(true)
                const data = await getAppointmentById(params.id)
                if (data) {
                    setAppointment(data)

                    // Preencher formulário com dados existentes
                    const appointmentDate = new Date(data.scheduled_datetime)
                    const timeString = format(appointmentDate, 'HH:mm')

                    setSelectedDate(appointmentDate)
                    setValue('scheduled_datetime', appointmentDate)
                    setValue('time', timeString)
                    setValue('client_id', data.client_id)
                    setValue('procedure_id', data.procedure_id)
                    setValue('duration_minutes', data.duration_minutes)
                    setValue('notes', data.notes || '')
                    setValue('status', data.status)

                    // Encontrar e definir cliente e procedimento selecionados
                    setTimeout(() => {
                        const client = clients.find(c => c.id === data.client_id)
                        const procedure = procedures.find(p => p.id === data.procedure_id)

                        if (client) setSelectedClient(client)
                        if (procedure) setSelectedProcedure(procedure)
                    }, 100)
                } else {
                    toast.error('Agendamento não encontrado')
                    router.push('/agendamentos')
                }
            } catch (error) {
                console.error('Erro ao carregar agendamento:', error)
                toast.error('Erro ao carregar agendamento')
                router.push('/agendamentos')
            } finally {
                setIsLoadingAppointment(false)
            }
        }

        if (clients.length > 0 && procedures.length > 0) {
            loadAppointment()
        }
    }, [params.id, user, getAppointmentById, router, clients, procedures, setValue])

    // Filtrar clientes por busca
    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        client.phone?.toLowerCase().includes(clientSearch.toLowerCase()) ||
        client.email?.toLowerCase().includes(clientSearch.toLowerCase())
    )

    // Filtrar procedimentos por busca
    const filteredProcedures = procedures.filter(procedure =>
        procedure.name.toLowerCase().includes(procedureSearch.toLowerCase()) ||
        procedure.procedure_categories?.name.toLowerCase().includes(procedureSearch.toLowerCase())
    )

    // Agrupar procedimentos por categoria
    const proceduresByCategory = filteredProcedures.reduce((acc, procedure) => {
        const categoryName = procedure.procedure_categories?.name || 'Sem categoria'
        if (!acc[categoryName]) {
            acc[categoryName] = []
        }
        acc[categoryName].push(procedure)
        return acc
    }, {} as Record<string, Procedure[]>)

    // Atualizar duração quando procedimento for selecionado
    useEffect(() => {
        if (selectedProcedure) {
            setValue('duration_minutes', selectedProcedure.duration_minutes)
        }
    }, [selectedProcedure, setValue])

    // Verificar conflitos quando data/hora mudarem
    useEffect(() => {
        if (watchedValues.scheduled_datetime && watchedValues.time && watchedValues.duration_minutes && user && appointment) {
            handleCheckConflicts()
        }
    }, [watchedValues.scheduled_datetime, watchedValues.time, watchedValues.duration_minutes, user, appointment])

    // Limpar erros
    useEffect(() => {
        if (appointmentError) {
            toast.error(appointmentError)
            clearError()
        }
    }, [appointmentError, clearError])

    const handleCheckConflicts = async () => {
        if (!watchedValues.scheduled_datetime || !watchedValues.time || !user || !appointment) return

        try {
            const appointmentDateTime = setMinutes(
                setHours(watchedValues.scheduled_datetime, parseInt(watchedValues.time.split(':')[0])),
                parseInt(watchedValues.time.split(':')[1])
            )

            const conflictingAppointments = await checkConflicts(
                appointmentDateTime.toISOString(),
                watchedValues.duration_minutes,
                appointment.id // Excluir o próprio agendamento da verificação
            )

            setConflicts(conflictingAppointments || [])
        } catch (error) {
            console.error('Erro ao verificar conflitos:', error)
            setConflicts([])
        }
    }

    const handleClientChange = (clientId: string) => {
        const client = clients.find(c => c.id === clientId)
        setSelectedClient(client || null)
        setValue('client_id', clientId)
    }

    const handleProcedureChange = (procedureId: string) => {
        const procedure = procedures.find(p => p.id === procedureId)
        setSelectedProcedure(procedure || null)
        setValue('procedure_id', procedureId)
    }

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            setSelectedDate(date)
            setValue('scheduled_datetime', date)
            setIsDatePickerOpen(false)
            setShowTimeSlots(true)
        }
    }

    const handleTimeSelect = (date: Date, time: string) => {
        setSelectedDate(date)
        setValue('scheduled_datetime', date)
        setValue('time', time)
        setShowTimeSlots(false)
    }

    const onSubmit = async (data: AppointmentFormData) => {
        if (!user || !appointment) {
            toast.error('Dados insuficientes para atualização')
            return
        }

        try {
            // Construir data/hora completa
            const appointmentDateTime = setMinutes(
                setHours(data.scheduled_datetime, parseInt(data.time.split(':')[0])),
                parseInt(data.time.split(':')[1])
            )

            // Dados de atualização do agendamento
            const updateData: AppointmentUpdate = {
                client_id: data.client_id,
                procedure_id: data.procedure_id,
                scheduled_datetime: appointmentDateTime.toISOString(),
                duration_minutes: data.duration_minutes,
                notes: data.notes || null,
                status: data.status
            }

            // Atualizar agendamento
            const updatedAppointment = await updateAppointment(appointment.id, updateData)

            if (!updatedAppointment) {
                throw new Error('Erro ao atualizar agendamento')
            }

            // Atualizar evento no Google Calendar se solicitado
            if (data.updateGoogleEvent && appointment.google_event_id && selectedClient && selectedProcedure) {
                try {
                    const eventData = {
                        summary: `${selectedProcedure.name} - ${selectedClient.name}`,
                        description: `Procedimento: ${selectedProcedure.name}\nCliente: ${selectedClient.name}\n${selectedClient.phone ? `Telefone: ${selectedClient.phone}\n` : ''}${data.notes ? `Observações: ${data.notes}` : ''}`,
                        startDateTime: appointmentDateTime.toISOString(),
                        endDateTime: new Date(appointmentDateTime.getTime() + data.duration_minutes * 60000).toISOString(),
                        attendees: selectedClient.email ? [selectedClient.email] : []
                    }

                    await updateEvent(appointment.google_event_id, eventData)
                } catch (calendarError) {
                    console.error('Erro ao atualizar evento no calendário:', calendarError)
                    toast.warning('Agendamento atualizado, mas houve erro ao sincronizar com o Google Calendar')
                }
            }

            toast.success('Agendamento atualizado com sucesso!')
            router.push(`/agendamentos/${appointment.id}`)
        } catch (error) {
            console.error('Erro ao atualizar agendamento:', error)
            toast.error('Erro ao atualizar agendamento')
        }
    }

    const calculateTotalPrice = () => {
        return selectedProcedure ? selectedProcedure.price : 0
    }

    // Dados das métricas principais
    const getFormStats = () => {
        return {
            clientsAvailable: clients.length,
            proceduresAvailable: procedures.length,
            conflictsDetected: conflicts.length,
            estimatedDuration: selectedProcedure ? selectedProcedure.duration_minutes : 0
        }
    }

    const statsData = getFormStats()

    const metricsData = [
        {
            title: 'Clientes Disponíveis',
            value: statsData.clientsAvailable,
            icon: Users,
            description: 'Clientes cadastrados',
            gradient: 'from-blue-500 to-blue-600',
            trend: { value: statsData.clientsAvailable, label: 'clientes', isPositive: true }
        },
        {
            title: 'Procedimentos',
            value: statsData.proceduresAvailable,
            icon: Scissors,
            description: 'Serviços disponíveis',
            gradient: 'from-emerald-500 to-emerald-600',
            trend: { value: statsData.proceduresAvailable, label: 'serviços', isPositive: true }
        },
        {
            title: 'Duração Estimada',
            value: `${statsData.estimatedDuration}min`,
            icon: Clock,
            description: selectedProcedure ? selectedProcedure.name : 'Nenhum selecionado',
            gradient: 'from-purple-500 to-purple-600',
            trend: { value: statsData.estimatedDuration, label: 'minutos', isPositive: true }
        },
        {
            title: 'Conflitos',
            value: statsData.conflictsDetected,
            icon: AlertCircle,
            description: 'Horários em conflito',
            gradient: statsData.conflictsDetected > 0 ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600',
            trend: { value: statsData.conflictsDetected, label: 'conflitos', isPositive: statsData.conflictsDetected === 0 }
        }
    ]

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

    if (clientsLoading || proceduresLoading || isLoadingAppointment) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <Sidebar />
                <div className="lg:ml-64">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                            <p className="text-slate-600">Carregando dados...</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Mostrar erro se houve falha no carregamento
    if (clientsError || proceduresError || !appointment) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <Sidebar />
                <div className="lg:ml-64">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                            <p className="text-red-600 mb-4">Erro ao carregar dados necessários</p>
                            <div className="space-x-2">
                                <Button onClick={() => window.location.reload()} className="bg-blue-500 hover:bg-blue-600">
                                    Tentar novamente
                                </Button>
                                <Link href="/agendamentos">
                                    <Button variant="outline">
                                        Voltar aos Agendamentos
                                    </Button>
                                </Link>
                            </div>
                        </div>
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
                                        <Save className="w-4 h-4 text-white" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                        Editar Agendamento
                                    </h1>
                                </div>
                                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                    Modifique os dados do agendamento e mantenha sincronizado com o Google Calendar
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
                                    <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                        <RefreshCw className="w-4 h-4 text-slate-600" />
                                    </button>
                                    <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                        <History className="w-4 h-4 text-slate-600" />
                                    </button>
                                </div>

                                {/* Botões Principais */}
                                <div className="flex items-center gap-2 ml-2">
                                    <Link href={`/agendamentos/${appointment.id}`}>
                                        <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50 shadow-sm">
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            <span className="hidden sm:inline">Cancelar</span>
                                            <span className="sm:hidden">Voltar</span>
                                        </Button>
                                    </Link>
                                    <Link href="/agendamentos/calendario">
                                        <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50 shadow-sm">
                                            <CalendarIcon className="w-4 h-4 mr-2" />
                                            <span className="hidden sm:inline">Calendário</span>
                                            <span className="sm:hidden">Cal</span>
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

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Formulário Principal */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Seleção de Cliente */}
                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <User className="w-5 h-5 text-blue-500" />
                                                Cliente do Agendamento
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 lg:p-6 space-y-4">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                <Input
                                                    placeholder="Buscar cliente por nome, telefone ou email..."
                                                    value={clientSearch}
                                                    onChange={(e) => setClientSearch(e.target.value)}
                                                    className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                                                />
                                            </div>

                                            <Select value={watchedValues.client_id} onValueChange={handleClientChange}>
                                                <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20">
                                                    <SelectValue placeholder="Selecione um cliente" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {filteredClients.length > 0 ? (
                                                        filteredClients.map((client) => (
                                                            <SelectItem key={client.id} value={client.id}>
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">{client.name}</span>
                                                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                                                        {client.phone && <span>{client.phone}</span>}
                                                                        {client.email && <span>{client.email}</span>}
                                                                    </div>
                                                                </div>
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        <div className="p-2 text-sm text-slate-500 text-center">
                                                            Nenhum cliente encontrado
                                                        </div>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            {errors.client_id && (
                                                <p className="text-sm text-red-600">{errors.client_id.message}</p>
                                            )}

                                            {/* Info do cliente selecionado */}
                                            {selectedClient && (
                                                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium text-blue-900">{selectedClient.name}</p>
                                                            <div className="flex items-center gap-4 text-sm text-blue-700">
                                                                {selectedClient.phone && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Phone className="w-3 h-3" />
                                                                        {selectedClient.phone}
                                                                    </span>
                                                                )}
                                                                {selectedClient.email && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Mail className="w-3 h-3" />
                                                                        {selectedClient.email}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm font-medium text-blue-900">
                                                                {selectedClient.total_visits} visitas
                                                            </div>
                                                            {selectedClient.birthday && (
                                                                <div className="text-xs text-blue-600">
                                                                    Nascimento: {format(new Date(selectedClient.birthday), 'dd/MM/yyyy')}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Seleção de Procedimento */}
                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <Scissors className="w-5 h-5 text-emerald-500" />
                                                Procedimento do Agendamento
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 lg:p-6 space-y-4">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                <Input
                                                    placeholder="Buscar procedimento..."
                                                    value={procedureSearch}
                                                    onChange={(e) => setProcedureSearch(e.target.value)}
                                                    className="pl-10 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                                                />
                                            </div>

                                            <Select value={watchedValues.procedure_id} onValueChange={handleProcedureChange}>
                                                <SelectTrigger className="border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20">
                                                    <SelectValue placeholder="Selecione um procedimento" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {filteredProcedures.length > 0 ? (
                                                        Object.entries(proceduresByCategory).map(([category, procedures]) => (
                                                            <div key={category}>
                                                                <div className="px-2 py-1 text-sm font-medium text-slate-500 bg-slate-50">
                                                                    {category}
                                                                </div>
                                                                {procedures.map((procedure) => (
                                                                    <SelectItem key={procedure.id} value={procedure.id}>
                                                                        <div className="flex flex-col">
                                                                            <span className="font-medium">{procedure.name}</span>
                                                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                                                <span>{procedure.duration_minutes} min</span>
                                                                                <span>R$ {procedure.price.toFixed(2)}</span>
                                                                            </div>
                                                                            {procedure.description && (
                                                                                <span className="text-xs text-slate-400">{procedure.description}</span>
                                                                            )}
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="p-2 text-sm text-slate-500 text-center">
                                                            Nenhum procedimento encontrado
                                                        </div>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            {errors.procedure_id && (
                                                <p className="text-sm text-red-600">{errors.procedure_id.message}</p>
                                            )}

                                            {/* Info do procedimento selecionado */}
                                            {selectedProcedure && (
                                                <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium text-emerald-900">{selectedProcedure.name}</p>
                                                            <p className="text-sm text-emerald-700">{selectedProcedure.description || 'Sem descrição'}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm font-medium text-emerald-900">
                                                                R$ {selectedProcedure.price.toFixed(2)}
                                                            </div>
                                                            <div className="text-xs text-emerald-600">
                                                                {selectedProcedure.duration_minutes} minutos
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Data e Horário */}
                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <CalendarIcon className="w-5 h-5 text-purple-500" />
                                                Data e Horário
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 lg:p-6 space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Data *</Label>
                                                    <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                className={cn(
                                                                    "w-full justify-start text-left font-normal border-slate-200",
                                                                    !selectedDate && "text-muted-foreground"
                                                                )}
                                                            >
                                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                                {selectedDate ? (
                                                                    format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
                                                                ) : (
                                                                    "Selecionar data"
                                                                )}
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={selectedDate}
                                                                onSelect={handleDateSelect}
                                                                disabled={(date) => date < new Date()}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    {errors.scheduled_datetime && (
                                                        <p className="text-sm text-red-600">{errors.scheduled_datetime.message}</p>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Horário *</Label>
                                                    <Select value={watchedValues.time} onValueChange={(value) => setValue('time', value)}>
                                                        <SelectTrigger className="border-slate-200">
                                                            <SelectValue placeholder="Selecionar horário" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {timeSlots.map((time) => (
                                                                <SelectItem key={time} value={time}>
                                                                    {time}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {errors.time && (
                                                        <p className="text-sm text-red-600">{errors.time.message}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Duração */}
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    Duração (minutos) *
                                                </Label>
                                                <Input
                                                    type="number"
                                                    min="15"
                                                    step="15"
                                                    {...register('duration_minutes', { valueAsNumber: true })}
                                                    className="border-slate-200 focus:border-purple-500 focus:ring-purple-500/20"
                                                />
                                                {errors.duration_minutes && (
                                                    <p className="text-sm text-red-600">{errors.duration_minutes.message}</p>
                                                )}
                                            </div>

                                            {/* Status */}
                                            <div className="space-y-2">
                                                <Label>Status do Agendamento *</Label>
                                                <Select value={watchedValues.status} onValueChange={(value) => setValue('status', value as any)}>
                                                    <SelectTrigger className="border-slate-200">
                                                        <SelectValue placeholder="Selecionar status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="scheduled">Agendado</SelectItem>
                                                        <SelectItem value="confirmed">Confirmado</SelectItem>
                                                        <SelectItem value="completed">Concluído</SelectItem>
                                                        <SelectItem value="cancelled">Cancelado</SelectItem>
                                                        <SelectItem value="no_show">Não Compareceu</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {errors.status && (
                                                    <p className="text-sm text-red-600">{errors.status.message}</p>
                                                )}
                                            </div>

                                            {/* Conflitos */}
                                            {conflicts.length > 0 && (
                                                <Alert className="border-red-200 bg-red-50">
                                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                                    <AlertDescription className="text-red-800">
                                                        <div className="space-y-1">
                                                            <p className="font-medium">Conflito de horário detectado!</p>
                                                            {conflicts.map((conflict, index) => (
                                                                <p key={index} className="text-sm">
                                                                    • Agendamento às {format(new Date(conflict.scheduled_datetime), 'HH:mm')}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Observações */}
                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                            <CardTitle className="text-lg">Observações</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 lg:p-6">
                                            <Textarea
                                                {...register('notes')}
                                                placeholder="Observações adicionais sobre o agendamento..."
                                                rows={3}
                                                className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                                            />
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Sidebar */}
                                <div className="space-y-6">
                                    {/* Resumo */}
                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <DollarSign className="w-5 h-5 text-green-500" />
                                                Resumo das Alterações
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 lg:p-6 space-y-4">
                                            {selectedClient && (
                                                <div>
                                                    <Label>Cliente</Label>
                                                    <p className="font-medium">{selectedClient.name}</p>
                                                </div>
                                            )}

                                            {selectedProcedure && (
                                                <div>
                                                    <Label>Procedimento</Label>
                                                    <p className="font-medium">{selectedProcedure.name}</p>
                                                    <p className="text-sm text-slate-500">{selectedProcedure.duration_minutes} minutos</p>
                                                </div>
                                            )}

                                            {selectedDate && watchedValues.time && (
                                                <div>
                                                    <Label>Data e Horário</Label>
                                                    <p className="font-medium">
                                                        {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })} às {watchedValues.time}
                                                    </p>
                                                </div>
                                            )}

                                            {watchedValues.status && (
                                                <div>
                                                    <Label>Status</Label>
                                                    <p className="font-medium">
                                                        {watchedValues.status === 'scheduled' && 'Agendado'}
                                                        {watchedValues.status === 'confirmed' && 'Confirmado'}
                                                        {watchedValues.status === 'completed' && 'Concluído'}
                                                        {watchedValues.status === 'cancelled' && 'Cancelado'}
                                                        {watchedValues.status === 'no_show' && 'Não Compareceu'}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="pt-4 border-t">
                                                <div className="flex justify-between items-center">
                                                    <Label>Total</Label>
                                                    <p className="text-lg font-bold">R$ {calculateTotalPrice().toFixed(2)}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Opções */}
                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <GoogleCalendarIcon className="w-5 h-5 text-indigo-500" />
                                                Opções de Sincronização
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 lg:p-6 space-y-4">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="updateGoogleEvent"
                                                    checked={watchedValues.updateGoogleEvent}
                                                    onCheckedChange={(checked) => setValue('updateGoogleEvent', !!checked)}
                                                    disabled={!appointment.google_event_id}
                                                />
                                                <Label htmlFor="updateGoogleEvent" className="text-sm">
                                                    Atualizar evento no Google Calendar
                                                </Label>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="sendNotification"
                                                    checked={watchedValues.sendNotification}
                                                    onCheckedChange={(checked) => setValue('sendNotification', !!checked)}
                                                />
                                                <Label htmlFor="sendNotification" className="text-sm">
                                                    Notificar cliente sobre alterações
                                                </Label>
                                            </div>

                                            {!appointment.google_event_id && (
                                                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                                                    <div className="flex items-center gap-2 text-orange-700">
                                                        <AlertCircle className="w-4 h-4" />
                                                        <span className="text-sm">Agendamento não está sincronizado com Google Calendar</span>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Ações */}
                                    <div className="space-y-2">
                                        <Button
                                            type="submit"
                                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 border-0"
                                            disabled={
                                                isLoading ||
                                                isSubmitting ||
                                                conflicts.length > 0
                                            }
                                        >
                                            {isLoading || isSubmitting ? (
                                                <>
                                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                    Salvando Alterações...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4 mr-2" />
                                                    Salvar Alterações
                                                </>
                                            )}
                                        </Button>
                                        <Link href={`/agendamentos/${appointment.id}`}>
                                            <Button variant="outline" className="w-full bg-white border-slate-200 hover:bg-slate-50" disabled={isLoading}>
                                                Cancelar Edição
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* Slots de horário */}
                        {showTimeSlots && selectedDate && (
                            <Card className="border-0 shadow-xl shadow-slate-200/60">
                                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Clock className="w-5 h-5 text-blue-500" />
                                        Horários Disponíveis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 lg:p-6">
                                    <TimeSlots
                                        selectedDate={selectedDate}
                                        onTimeSelect={handleTimeSelect}
                                        appointments={[]} // Vai ser buscado dinamicamente pelo componente
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {/* Histórico de Alterações */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <History className="w-5 h-5 text-purple-500" />
                                    Histórico do Agendamento
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 lg:p-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">Agendamento criado</p>
                                            <p className="text-xs text-slate-500">
                                                {format(new Date(appointment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                            </p>
                                        </div>
                                    </div>

                                    {appointment.updated_at !== appointment.created_at && (
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">Última modificação</p>
                                                <p className="text-xs text-slate-500">
                                                    {format(new Date(appointment.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">Editando agora</p>
                                            <p className="text-xs text-slate-500">
                                                {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default EditarAgendamentoPage