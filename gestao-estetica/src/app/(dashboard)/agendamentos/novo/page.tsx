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
    CheckCircle,
    AlertCircle,
    Plus,
    Search,
    DollarSign,
    Activity,
    TrendingUp,
    ChevronRight,
    Bell,
    Filter,
    Download,
    Settings,
    Users,
    Sparkles,
    Calendar as CalendarDays,
    RefreshCw
} from 'lucide-react'
import { format, isToday, isTomorrow, isYesterday, addDays, startOfDay, endOfDay, setHours, setMinutes } from 'date-fns'
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
type AppointmentInsert = Database['public']['Tables']['appointments']['Insert']

// Schema de validação
const appointmentSchema = z.object({
    client_id: z.string().min(1, 'Selecione um cliente'),
    procedure_id: z.string().min(1, 'Selecione um procedimento'),
    scheduled_datetime: z.date({ required_error: 'Selecione uma data' }),
    time: z.string().min(1, 'Selecione um horário'),
    duration_minutes: z.number().min(15, 'Duração mínima de 15 minutos'),
    notes: z.string().optional(),
    createGoogleEvent: z.boolean().optional().default(true),
    sendReminder: z.boolean().optional().default(true),
    clientEmail: z.string().email('Email inválido').optional().or(z.literal('')),
    clientPhone: z.string().optional(),
    confirmationRequired: z.boolean().optional().default(false)
})

type AppointmentFormData = z.infer<typeof appointmentSchema>

const timeSlots = Array.from({ length: 21 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8
    const minute = (i % 2) * 30
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
})

const NovoAgendamentoPage: React.FC = () => {
    const router = useRouter()
    const { user } = useAuthStore()
    const [selectedDate, setSelectedDate] = useState<Date>()
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null)
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
    const [clientSearch, setClientSearch] = useState('')
    const [procedureSearch, setProcedureSearch] = useState('')
    const [conflicts, setConflicts] = useState<any[]>([])
    const [showTimeSlots, setShowTimeSlots] = useState(false)

    // Hooks para gerenciar dados reais
    const {
        data: clientsData,
        isLoading: clientsLoading,
        error: clientsError
    } = useClients({
        page: 1,
        limit: 100, // Carregar todos os clientes para o formulário
        filters: {}
    })

    const {
        data: proceduresData,
        isLoading: proceduresLoading,
        error: proceduresError
    } = useProcedures({
        page: 1,
        limit: 100, // Carregar todos os procedimentos
        filters: { is_active: true }
    })

    const {
        createAppointment,
        loading: appointmentLoading,
        error: appointmentError,
        checkConflicts,
        clearError
    } = useAppointments({
        autoFetch: false
    })

    const {
        createEvent,
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
            createGoogleEvent: true,
            sendReminder: true,
            confirmationRequired: false,
            notes: '',
            clientEmail: '',
            clientPhone: ''
        }
    })

    const watchedValues = watch()

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

    // Atualizar dados do cliente quando selecionado
    useEffect(() => {
        if (selectedClient) {
            setValue('clientEmail', selectedClient.email || '')
            setValue('clientPhone', selectedClient.phone || '')
        }
    }, [selectedClient, setValue])

    // Verificar conflitos quando data/hora mudarem
    useEffect(() => {
        if (watchedValues.scheduled_datetime && watchedValues.time && watchedValues.duration_minutes && user) {
            handleCheckConflicts()
        }
    }, [watchedValues.scheduled_datetime, watchedValues.time, watchedValues.duration_minutes, user])

    // Limpar erros
    useEffect(() => {
        if (appointmentError) {
            toast.error(appointmentError)
            clearError()
        }
    }, [appointmentError, clearError])

    const handleCheckConflicts = async () => {
        if (!watchedValues.scheduled_datetime || !watchedValues.time || !user) return

        try {
            const appointmentDateTime = setMinutes(
                setHours(watchedValues.scheduled_datetime, parseInt(watchedValues.time.split(':')[0])),
                parseInt(watchedValues.time.split(':')[1])
            )

            const conflictingAppointments = await checkConflicts(
                appointmentDateTime.toISOString(),
                watchedValues.duration_minutes
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
        if (!user) {
            toast.error('Usuário não autenticado')
            return
        }

        try {
            // Construir data/hora completa
            const appointmentDateTime = setMinutes(
                setHours(data.scheduled_datetime, parseInt(data.time.split(':')[0])),
                parseInt(data.time.split(':')[1])
            )

            // Dados do agendamento para o banco
            const appointmentData: AppointmentInsert = {
                user_id: user.id,
                client_id: data.client_id,
                procedure_id: data.procedure_id,
                scheduled_datetime: appointmentDateTime.toISOString(),
                duration_minutes: data.duration_minutes,
                notes: data.notes || null,
                status: 'scheduled',
                calendar_synced: false
            }

            // Criar agendamento
            const newAppointment = await createAppointment(appointmentData)

            if (!newAppointment) {
                throw new Error('Erro ao criar agendamento')
            }

            // Criar evento no Google Calendar se solicitado
            if (data.createGoogleEvent && selectedClient && selectedProcedure) {
                try {
                    const eventData = {
                        summary: `${selectedProcedure.name} - ${selectedClient.name}`,
                        description: `Procedimento: ${selectedProcedure.name}\nCliente: ${selectedClient.name}\n${selectedClient.phone ? `Telefone: ${selectedClient.phone}\n` : ''}${data.notes ? `Observações: ${data.notes}` : ''}`,
                        startDateTime: appointmentDateTime.toISOString(),
                        endDateTime: new Date(appointmentDateTime.getTime() + data.duration_minutes * 60000).toISOString(),
                        attendees: selectedClient.email ? [selectedClient.email] : [],
                        reminders: data.sendReminder ? {
                            useDefault: false,
                            overrides: [
                                { method: 'email' as const, minutes: 60 },
                                { method: 'popup' as const, minutes: 15 }
                            ]
                        } : undefined
                    }

                    await createEvent(eventData)
                } catch (calendarError) {
                    console.error('Erro ao criar evento no calendário:', calendarError)
                    toast.warning('Agendamento criado, mas houve erro ao sincronizar com o Google Calendar')
                }
            }

            toast.success('Agendamento criado com sucesso!')
            router.push('/agendamentos?success=created')
        } catch (error) {
            console.error('Erro ao criar agendamento:', error)
            toast.error('Erro ao criar agendamento')
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

    // Mostrar loading se os dados ainda estão carregando
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

    if (clientsLoading || proceduresLoading) {
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
    if (clientsError || proceduresError) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <Sidebar />
                <div className="lg:ml-64">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                            <p className="text-red-600 mb-4">Erro ao carregar dados necessários</p>
                            <Button onClick={() => window.location.reload()} className="bg-blue-500 hover:bg-blue-600">
                                Tentar novamente
                            </Button>
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
                                        <Plus className="w-4 h-4 text-white" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                        Novo Agendamento
                                    </h1>
                                </div>
                                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                    Crie um novo agendamento com integração ao Google Calendar
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
                                    <Link href="/agendamentos">
                                        <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50 shadow-sm">
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            <span className="hidden sm:inline">Agendamentos</span>
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
                                                Selecionar Cliente
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
                                            {/* Mensagem quando não há clientes */}
                                            {filteredClients.length === 0 && clientSearch && (
                                                <div className="p-3 text-sm text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                                                    <div className="flex items-center gap-2">
                                                        <Search className="w-4 h-4" />
                                                        <span>Nenhum cliente encontrado para "{clientSearch}"</span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        Tente buscar por nome, telefone ou email
                                                    </p>
                                                </div>
                                            )}

                                            {clients.length === 0 && !clientsLoading && (
                                                <div className="p-3 text-sm text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4" />
                                                        <span>Nenhum cliente cadastrado</span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        Cadastre um cliente primeiro para criar agendamentos
                                                    </p>
                                                </div>
                                            )}

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
                                                Selecionar Procedimento
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

                                            {/* Mensagem quando não há procedimentos */}
                                            {filteredProcedures.length === 0 && procedureSearch && (
                                                <div className="p-3 text-sm text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                                                    <div className="flex items-center gap-2">
                                                        <Search className="w-4 h-4" />
                                                        <span>Nenhum procedimento encontrado para "{procedureSearch}"</span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        Tente buscar por nome ou categoria
                                                    </p>
                                                </div>
                                            )}

                                            {procedures.length === 0 && !proceduresLoading && (
                                                <div className="p-3 text-sm text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                                                    <div className="flex items-center gap-2">
                                                        <Scissors className="w-4 h-4" />
                                                        <span>Nenhum procedimento cadastrado</span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        Cadastre um procedimento primeiro para criar agendamentos
                                                    </p>
                                                </div>
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

                                            {/* Botão para mostrar slots de horário */}
                                            {selectedDate && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setShowTimeSlots(!showTimeSlots)}
                                                    className="w-full bg-white border-slate-200 hover:bg-slate-50"
                                                >
                                                    <Clock className="w-4 h-4 mr-2" />
                                                    {showTimeSlots ? 'Ocultar' : 'Ver'} Horários Disponíveis
                                                </Button>
                                            )}

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
                                                Resumo do Agendamento
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
                                                Opções
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 lg:p-6 space-y-4">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="createGoogleEvent"
                                                    checked={watchedValues.createGoogleEvent}
                                                    onCheckedChange={(checked) => setValue('createGoogleEvent', !!checked)}
                                                />
                                                <Label htmlFor="createGoogleEvent" className="text-sm">
                                                    Criar evento no Google Calendar
                                                </Label>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="sendReminder"
                                                    checked={watchedValues.sendReminder}
                                                    onCheckedChange={(checked) => setValue('sendReminder', !!checked)}
                                                />
                                                <Label htmlFor="sendReminder" className="text-sm">
                                                    Enviar lembrete por email
                                                </Label>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="confirmationRequired"
                                                    checked={watchedValues.confirmationRequired}
                                                    onCheckedChange={(checked) => setValue('confirmationRequired', !!checked)}
                                                />
                                                <Label htmlFor="confirmationRequired" className="text-sm">
                                                    Requer confirmação do cliente
                                                </Label>
                                            </div>
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
                                                conflicts.length > 0 ||
                                                clients.length === 0 ||
                                                procedures.length === 0
                                            }
                                        >
                                            {isLoading || isSubmitting ? (
                                                <>
                                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                    Criando Agendamento...
                                                </>
                                            ) : clients.length === 0 ? (
                                                <>
                                                    <User className="w-4 h-4 mr-2" />
                                                    Cadastre um Cliente Primeiro
                                                </>
                                            ) : procedures.length === 0 ? (
                                                <>
                                                    <Scissors className="w-4 h-4 mr-2" />
                                                    Cadastre um Procedimento Primeiro
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Criar Agendamento
                                                </>
                                            )}
                                        </Button>
                                        <Link href="/agendamentos">
                                            <Button variant="outline" className="w-full bg-white border-slate-200 hover:bg-slate-50" disabled={isLoading}>
                                                Cancelar
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

                        {/* Ações Rápidas */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Sparkles className="w-5 h-5 text-purple-500" />
                                    Ações Rápidas
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 lg:p-6">
                                <div className="flex flex-wrap gap-3">
                                    <Link href="/clientes/novo">
                                        <Button
                                            variant="outline"
                                            className="bg-white border-slate-200 hover:bg-slate-50"
                                        >
                                            <User className="w-4 h-4 mr-2" />
                                            Novo Cliente
                                        </Button>
                                    </Link>
                                    <Link href="/procedimentos/novo">
                                        <Button
                                            variant="outline"
                                            className="bg-white border-slate-200 hover:bg-slate-50"
                                        >
                                            <Scissors className="w-4 h-4 mr-2" />
                                            Novo Procedimento
                                        </Button>
                                    </Link>
                                    <Link href="/agendamentos/calendario">
                                        <Button
                                            variant="outline"
                                            className="bg-white border-slate-200 hover:bg-slate-50"
                                        >
                                            <CalendarDays className="w-4 h-4 mr-2" />
                                            Ver Calendário
                                        </Button>
                                    </Link>
                                    <Link href="/agendamentos/configuracao">
                                        <Button
                                            variant="outline"
                                            className="bg-white border-slate-200 hover:bg-slate-50"
                                        >
                                            <Settings className="w-4 h-4 mr-2" />
                                            Configurações
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default NovoAgendamentoPage