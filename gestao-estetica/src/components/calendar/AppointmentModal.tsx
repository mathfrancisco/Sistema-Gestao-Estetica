'use client'

import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
    CalendarIcon,
    Clock,
    User,
    Scissors,
    AlertCircle,
    Check,
    Loader2,
    Search,
    Trash2,
    Save,
    Eye,
    EyeOff, FileText
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSearchClients } from '@/lib/hooks/useClients'
import { useGoogleCalendar } from '@/lib/hooks/useGoogleCalendar'
import { useAuthStore } from '@/store/useAuthStore'
import type { Database } from '@/lib/database/supabase/types'
import {useAppointments} from "@/lib/hooks/useAppointment";

type Appointment = Database['public']['Tables']['appointments']['Row']
type AppointmentInsert = Database['public']['Tables']['appointments']['Insert']
type AppointmentUpdate = Database['public']['Tables']['appointments']['Update']

// Schema de validação
const appointmentSchema = z.object({
    clientId: z.string().min(1, 'Selecione um cliente'),
    procedureId: z.string().min(1, 'Selecione um procedimento'),
    date: z.date({ required_error: 'Selecione uma data' }),
    time: z.string().min(1, 'Selecione um horário'),
    durationMinutes: z.number().min(15, 'Duração mínima de 15 minutos'),
    notes: z.string().optional(),
    createGoogleEvent: z.boolean().default(true),
    sendReminder: z.boolean().default(true),
    clientEmail: z.string().email('Email inválido').optional().or(z.literal('')),
    clientPhone: z.string().optional()
})

type AppointmentFormData = z.infer<typeof appointmentSchema>

interface Client {
    id: string
    name: string
    email?: string
    phone?: string
}

interface Procedure {
    id: string
    name: string
    duration_minutes: number
    price: number
    description?: string
}

interface AppointmentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    appointment?: Appointment
    clients: Client[]
    procedures: Procedure[]
    loading?: boolean
}

// Horários disponíveis (8h às 18h em intervalos de 30 min)
const timeSlots = Array.from({ length: 21 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8
    const minute = (i % 2) * 30
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
})

const AppointmentModal: React.FC<AppointmentModalProps> = ({
                                                               open,
                                                               onOpenChange,
                                                               appointment,
                                                               clients,
                                                               procedures
                                                           }) => {
    const [selectedDate, setSelectedDate] = useState<Date>()
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null)
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
    const [clientSearch, setClientSearch] = useState('')
    const [conflicts, setConflicts] = useState<Appointment[]>([])
    const [currentStep, setCurrentStep] = useState(1)
    const [showAdvanced, setShowAdvanced] = useState(false)

    const { user } = useAuthStore()
    const {
        createAppointment,
        updateAppointment,
        deleteAppointment,
        checkConflicts,
        loading: appointmentsLoading
    } = useAppointments({ userId: user?.id })

    const { createEvent, isAuthenticated: hasGoogleCalendar } = useGoogleCalendar()

    const { data: searchedClients } = useSearchClients(clientSearch, 10)

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
            durationMinutes: 60
        }
    })

    const watchedValues = watch()

    // Combinar clientes passados como prop com resultados da busca
    const allClients = React.useMemo(() => {
        const clientMap = new Map()

        // Adicionar clientes da prop
        clients.forEach(client => clientMap.set(client.id, client))

        // Adicionar clientes da busca
        searchedClients?.forEach(client => clientMap.set(client.id, client))

        return Array.from(clientMap.values())
    }, [clients, searchedClients])

    // Carregar dados do agendamento para edição
    useEffect(() => {
        if (appointment) {
            const appointmentDate = new Date(appointment.scheduled_datetime)
            setSelectedDate(appointmentDate)

            const client = allClients.find(c => c.id === appointment.client_id)
            const procedure = procedures.find(p => p.id === appointment.procedure_id)

            setSelectedClient(client || null)
            setSelectedProcedure(procedure || null)

            reset({
                clientId: appointment.client_id,
                procedureId: appointment.procedure_id,
                date: appointmentDate,
                time: format(appointmentDate, 'HH:mm'),
                durationMinutes: appointment.duration_minutes || 60,
                notes: appointment.notes || '',
                createGoogleEvent: !appointment.calendar_synced,
                sendReminder: true,
                clientEmail: client?.email || '',
                clientPhone: client?.phone || ''
            })
        } else {
            // Reset para novo agendamento
            reset({
                createGoogleEvent: hasGoogleCalendar,
                sendReminder: true,
                durationMinutes: 60
            })
            setSelectedDate(undefined)
            setSelectedClient(null)
            setSelectedProcedure(null)
            setCurrentStep(1)
        }
    }, [appointment, allClients, procedures, reset, hasGoogleCalendar])

    // Atualizar duração quando procedimento for selecionado
    useEffect(() => {
        if (selectedProcedure) {
            setValue('durationMinutes', selectedProcedure.duration_minutes)
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
        const checkAppointmentConflicts = async () => {
            if (watchedValues.date && watchedValues.time && watchedValues.durationMinutes) {
                const dateTime = new Date(watchedValues.date)
                const [hours, minutes] = watchedValues.time.split(':').map(Number)
                dateTime.setHours(hours, minutes)

                const conflictingAppointments = await checkConflicts(
                    dateTime.toISOString(),
                    watchedValues.durationMinutes,
                    appointment?.id
                )

                setConflicts(conflictingAppointments)
            }
        }

        checkAppointmentConflicts()
    }, [watchedValues.date, watchedValues.time, watchedValues.durationMinutes, checkConflicts, appointment?.id])

    const handleClientChange = (clientId: string) => {
        const client = allClients.find(c => c.id === clientId)
        setSelectedClient(client || null)
        setValue('clientId', clientId)
        if (currentStep === 1) setCurrentStep(2)
    }

    const handleProcedureChange = (procedureId: string) => {
        const procedure = procedures.find(p => p.id === procedureId)
        setSelectedProcedure(procedure || null)
        setValue('procedureId', procedureId)
        if (currentStep === 2) setCurrentStep(3)
    }

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            setSelectedDate(date)
            setValue('date', date)
            setIsDatePickerOpen(false)
            if (currentStep === 3) setCurrentStep(4)
        }
    }

    const onSubmit = async (data: AppointmentFormData) => {
        try {
            const dateTime = new Date(data.date)
            const [hours, minutes] = data.time.split(':').map(Number)
            dateTime.setHours(hours, minutes)

            const appointmentData: AppointmentInsert | AppointmentUpdate = {
                user_id: user!.id,
                client_id: data.clientId,
                procedure_id: data.procedureId,
                scheduled_datetime: dateTime.toISOString(),
                duration_minutes: data.durationMinutes,
                notes: data.notes || null,
                status: 'scheduled'
            }

            let savedAppointment: Appointment | null = null

            if (appointment) {
                // Atualizar agendamento existente
                savedAppointment = await updateAppointment(appointment.id, appointmentData)
            } else {
                // Criar novo agendamento
                savedAppointment = await createAppointment(appointmentData as AppointmentInsert)
            }

            // Criar evento no Google Calendar se solicitado
            if (data.createGoogleEvent && hasGoogleCalendar && savedAppointment) {
                try {
                    const eventData = {
                        summary: `${selectedProcedure?.name} - ${selectedClient?.name}`,
                        description: data.notes || `Procedimento: ${selectedProcedure?.name}`,
                        startDateTime: dateTime.toISOString(),
                        endDateTime: new Date(dateTime.getTime() + data.durationMinutes * 60000).toISOString(),
                        attendees: data.clientEmail ? [data.clientEmail] : [],
                        reminders: {
                            useDefault: false,
                            overrides: [
                                { method: 'email', minutes: 60 },
                                { method: 'popup', minutes: 15 }
                            ]
                        }
                    }

                    await createEvent(eventData)
                } catch (error) {
                    console.error('Erro ao criar evento no Google Calendar:', error)
                    // Não bloquear o salvamento do agendamento por erro no Google Calendar
                }
            }

            onOpenChange(false)
        } catch (error) {
            console.error('Erro ao salvar agendamento:', error)
        }
    }

    const handleDelete = async () => {
        if (appointment && window.confirm('Tem certeza que deseja excluir este agendamento?')) {
            try {
                const success = await deleteAppointment(appointment.id)
                if (success) {
                    onOpenChange(false)
                }
            } catch (error) {
                console.error('Erro ao excluir agendamento:', error)
            }
        }
    }

    const getStepProgress = () => {
        const totalSteps = 4
        return (currentStep / totalSteps) * 100
    }

    const canProceedToNextStep = () => {
        switch (currentStep) {
            case 1: return !!watchedValues.clientId
            case 2: return !!watchedValues.procedureId
            case 3: return !!watchedValues.date
            case 4: return !!watchedValues.time
            default: return false
        }
    }

    const renderStepIndicator = () => (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                    {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
                </h3>
                {!appointment && (
                    <span className="text-sm text-slate-500 font-medium">
                        Passo {currentStep} de 4
                    </span>
                )}
            </div>
            {!appointment && (
                <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${getStepProgress()}%` }}
                    />
                </div>
            )}
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-white via-slate-50/50 to-white">
                <DialogHeader className="pb-6">
                    <DialogTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                            <CalendarIcon className="w-6 h-6" />
                        </div>
                        {renderStepIndicator()}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Formulário Principal */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Seção 1: Cliente */}
                            <div className={cn(
                                "p-6 rounded-2xl border-2 transition-all duration-300",
                                currentStep === 1 ? "border-blue-200 bg-blue-50/50 shadow-lg" : "border-slate-200 bg-white"
                            )}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={cn(
                                        "p-2 rounded-lg transition-all duration-300",
                                        currentStep === 1 ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                                    )}>
                                        <User className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-semibold">Cliente</h3>
                                    {selectedClient && (
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                                            <Check className="w-3 h-3 mr-1" />
                                            Selecionado
                                        </Badge>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="Buscar cliente por nome..."
                                            value={clientSearch}
                                            onChange={(e) => setClientSearch(e.target.value)}
                                            className="pl-10 h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                                        />
                                    </div>

                                    <Select value={watchedValues.clientId} onValueChange={handleClientChange}>
                                        <SelectTrigger className="h-12 border-slate-300 focus:border-blue-500">
                                            <SelectValue placeholder="Selecione um cliente" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allClients.map((client) => (
                                                <SelectItem key={client.id} value={client.id}>
                                                    <div className="flex flex-col py-1">
                                                        <span className="font-medium">{client.name}</span>
                                                        {client.phone && (
                                                            <span className="text-sm text-slate-500">{client.phone}</span>
                                                        )}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.clientId && (
                                        <p className="text-sm text-red-600 flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" />
                                            {errors.clientId.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Seção 2: Procedimento */}
                            <div className={cn(
                                "p-6 rounded-2xl border-2 transition-all duration-300",
                                currentStep === 2 ? "border-blue-200 bg-blue-50/50 shadow-lg" : "border-slate-200 bg-white",
                                !canProceedToNextStep() && currentStep > 1 ? "opacity-50" : ""
                            )}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={cn(
                                        "p-2 rounded-lg transition-all duration-300",
                                        currentStep === 2 ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                                    )}>
                                        <Scissors className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-semibold">Procedimento</h3>
                                    {selectedProcedure && (
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                                            <Check className="w-3 h-3 mr-1" />
                                            Selecionado
                                        </Badge>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <Select value={watchedValues.procedureId} onValueChange={handleProcedureChange}>
                                        <SelectTrigger className="h-12 border-slate-300 focus:border-blue-500">
                                            <SelectValue placeholder="Selecione um procedimento" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {procedures.map((procedure) => (
                                                <SelectItem key={procedure.id} value={procedure.id}>
                                                    <div className="flex flex-col py-1">
                                                        <span className="font-medium">{procedure.name}</span>
                                                        <div className="flex items-center gap-3 text-sm text-slate-500">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {procedure.duration_minutes} min
                                                            </span>
                                                            <span className="font-medium text-green-600">
                                                                R$ {procedure.price.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.procedureId && (
                                        <p className="text-sm text-red-600 flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" />
                                            {errors.procedureId.message}
                                        </p>
                                    )}

                                    {selectedProcedure && (
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-slate-600">Duração:</span>
                                                    <p className="font-medium">{selectedProcedure.duration_minutes} minutos</p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-600">Valor:</span>
                                                    <p className="font-medium text-green-600">R$ {selectedProcedure.price.toFixed(2)}</p>
                                                </div>
                                            </div>
                                            {selectedProcedure.description && (
                                                <p className="text-sm text-slate-600 mt-2">{selectedProcedure.description}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Seção 3: Data e Horário */}
                            <div className={cn(
                                "p-6 rounded-2xl border-2 transition-all duration-300",
                                currentStep >= 3 ? "border-blue-200 bg-blue-50/50 shadow-lg" : "border-slate-200 bg-white",
                                currentStep < 3 ? "opacity-50" : ""
                            )}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={cn(
                                        "p-2 rounded-lg transition-all duration-300",
                                        currentStep >= 3 ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                                    )}>
                                        <CalendarIcon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-semibold">Data e Horário</h3>
                                    {selectedDate && watchedValues.time && (
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                                            <Check className="w-3 h-3 mr-1" />
                                            Agendado
                                        </Badge>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Data</Label>
                                        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full h-12 justify-start text-left font-normal border-slate-300 hover:border-blue-500",
                                                        !selectedDate && "text-slate-500"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-3 h-4 w-4" />
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
                                        {errors.date && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <AlertCircle className="w-4 h-4" />
                                                {errors.date.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Horário</Label>
                                        <Select value={watchedValues.time} onValueChange={(value) => setValue('time', value)}>
                                            <SelectTrigger className="h-12 border-slate-300 focus:border-blue-500">
                                                <SelectValue placeholder="Selecionar horário" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {timeSlots.map((time) => (
                                                    <SelectItem key={time} value={time}>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4 text-slate-400" />
                                                            {time}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.time && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <AlertCircle className="w-4 h-4" />
                                                {errors.time.message}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <Label className="text-sm font-medium">Duração (minutos)</Label>
                                    <Input
                                        type="number"
                                        min="15"
                                        step="15"
                                        className="mt-1 h-12 border-slate-300 focus:border-blue-500"
                                        {...register('durationMinutes', { valueAsNumber: true })}
                                    />
                                    {errors.durationMinutes && (
                                        <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                            <AlertCircle className="w-4 h-4" />
                                            {errors.durationMinutes.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Seção 4: Observações */}
                            <div className="p-6 rounded-2xl border-2 border-slate-200 bg-white">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-lg bg-slate-100 text-slate-500">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-semibold">Observações</h3>
                                </div>
                                <Textarea
                                    {...register('notes')}
                                    placeholder="Observações adicionais sobre o agendamento..."
                                    rows={4}
                                    className="border-slate-300 focus:border-blue-500 resize-none"
                                />
                            </div>
                        </div>

                        {/* Sidebar de Resumo */}
                        <div className="space-y-6">
                            {/* Resumo do Agendamento */}
                            <div className="p-6 rounded-2xl border-2 border-slate-200 bg-white sticky top-6">
                                <h3 className="text-lg font-semibold mb-4">Resumo</h3>

                                <div className="space-y-4">
                                    {selectedClient && (
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                            <User className="w-5 h-5 text-blue-600" />
                                            <div>
                                                <p className="font-medium">{selectedClient.name}</p>
                                                <p className="text-sm text-slate-500">{selectedClient.phone}</p>
                                            </div>
                                        </div>
                                    )}

                                    {selectedProcedure && (
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                            <Scissors className="w-5 h-5 text-purple-600" />
                                            <div>
                                                <p className="font-medium">{selectedProcedure.name}</p>
                                                <p className="text-sm text-slate-500">
                                                    {selectedProcedure.duration_minutes}min • R$ {selectedProcedure.price.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {selectedDate && watchedValues.time && (
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                            <CalendarIcon className="w-5 h-5 text-green-600" />
                                            <div>
                                                <p className="font-medium">
                                                    {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                                                </p>
                                                <p className="text-sm text-slate-500">às {watchedValues.time}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Opções Avançadas */}
                                <div className="mt-6 pt-6 border-t border-slate-200">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                        className="w-full justify-between"
                                    >
                                        Opções Avançadas
                                        {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </Button>

                                    {showAdvanced && (
                                        <div className="mt-4 space-y-4">
                                            {/* Informações de contato */}
                                            {selectedClient && (
                                                <div className="space-y-3">
                                                    <div>
                                                        <Label className="text-sm">Email do cliente</Label>
                                                        <Input
                                                            type="email"
                                                            {...register('clientEmail')}
                                                            placeholder="email@exemplo.com"
                                                            className="mt-1 h-10 text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm">Telefone do cliente</Label>
                                                        <Input
                                                            {...register('clientPhone')}
                                                            placeholder="(11) 99999-9999"
                                                            className="mt-1 h-10 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Integração Google Calendar */}
                                            {hasGoogleCalendar && (
                                                <div className="space-y-3">
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
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Conflitos */}
                            {conflicts.length > 0 && (
                                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                        <div className="text-sm">
                                            <p className="font-medium text-red-900 mb-1">Conflito de horário!</p>
                                            {conflicts.map((conflict, index) => (
                                                <p key={index} className="text-red-700">
                                                    • Agendamento às {format(new Date(conflict.scheduled_datetime), 'HH:mm')}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Status do agendamento */}
                            {appointment && (
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-medium text-sm">Status</h4>
                                        <Badge variant={appointment.calendar_synced ? "default" : "destructive"}>
                                            {appointment.calendar_synced ? "Sincronizado" : "Não Sincronizado"}
                                        </Badge>
                                    </div>
                                    {appointment.google_event_id && (
                                        <p className="text-xs text-slate-600">
                                            ID: {appointment.google_event_id}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator className="my-8" />

                    <DialogFooter className="flex items-center justify-between">
                        <div className="flex gap-2">
                            {appointment && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={appointmentsLoading}
                                    className="hover:scale-105 transition-transform duration-200"
                                >
                                    {appointmentsLoading ?
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" /> :
                                        <Trash2 className="w-4 h-4 mr-2" />
                                    }
                                    Excluir
                                </Button>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting || appointmentsLoading}
                                className="hover:scale-105 transition-transform duration-200"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || appointmentsLoading || conflicts.length > 0}
                                className="hover:scale-105 transition-transform duration-200 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                            >
                                {isSubmitting || appointmentsLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                {appointment ? 'Atualizar' : 'Criar'} Agendamento
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default AppointmentModal