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
import {
    CalendarIcon,
    Clock,
    User,
    Scissors,
    Phone,
    Mail,
    Calendar as GoogleCalendarIcon,
    AlertCircle,
    Check,
    Loader2
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

// Horários disponíveis (8h às 18h em intervalos de 10 min)
const timeSlots = Array.from({ length: 21 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8
    const minute = (i % 2) * 10
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
    }

    const handleProcedureChange = (procedureId: string) => {
        const procedure = procedures.find(p => p.id === procedureId)
        setSelectedProcedure(procedure || null)
        setValue('procedureId', procedureId)
    }

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            setSelectedDate(date)
            setValue('date', date)
            setIsDatePickerOpen(false)
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5" />
                        {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Cliente */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Cliente *
                        </Label>

                        {/* Campo de busca de cliente */}
                        <Input
                            placeholder="Buscar cliente..."
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            className="mb-2"
                        />

                        <Select value={watchedValues.clientId} onValueChange={handleClientChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                {allClients.map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{client.name}</span>
                                            {client.phone && (
                                                <span className="text-sm text-gray-500">{client.phone}</span>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.clientId && (
                            <p className="text-sm text-red-600">{errors.clientId.message}</p>
                        )}
                    </div>

                    {/* Procedimento */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Scissors className="w-4 h-4" />
                            Procedimento *
                        </Label>
                        <Select value={watchedValues.procedureId} onValueChange={handleProcedureChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um procedimento" />
                            </SelectTrigger>
                            <SelectContent>
                                {procedures.map((procedure) => (
                                    <SelectItem key={procedure.id} value={procedure.id}>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{procedure.name}</span>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <span>{procedure.duration_minutes} min</span>
                                                <span>R$ {procedure.price.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.procedureId && (
                            <p className="text-sm text-red-600">{errors.procedureId.message}</p>
                        )}
                    </div>

                    {/* Data e Horário */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Data *</Label>
                            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
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
                            {errors.date && (
                                <p className="text-sm text-red-600">{errors.date.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Horário *</Label>
                            <Select value={watchedValues.time} onValueChange={(value) => setValue('time', value)}>
                                <SelectTrigger>
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
                            {...register('durationMinutes', { valueAsNumber: true })}
                        />
                        {errors.durationMinutes && (
                            <p className="text-sm text-red-600">{errors.durationMinutes.message}</p>
                        )}
                    </div>

                    {/* Informações de contato */}
                    {selectedClient && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Email do cliente
                                </Label>
                                <Input
                                    type="email"
                                    {...register('clientEmail')}
                                    placeholder="email@exemplo.com"
                                />
                                {errors.clientEmail && (
                                    <p className="text-sm text-red-600">{errors.clientEmail.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    Telefone do cliente
                                </Label>
                                <Input
                                    {...register('clientPhone')}
                                    placeholder="(11) 99999-9999"
                                />
                            </div>
                        </div>
                    )}

                    {/* Observações */}
                    <div className="space-y-2">
                        <Label>Observações</Label>
                        <Textarea
                            {...register('notes')}
                            placeholder="Observações adicionais sobre o agendamento"
                            rows={3}
                        />
                    </div>

                    {/* Opções de integração */}
                    {hasGoogleCalendar && (
                        <div className="space-y-4 border-t pt-4">
                            <h4 className="font-medium flex items-center gap-2">
                                <GoogleCalendarIcon className="w-4 h-4" />
                                Integração Google Calendar
                            </h4>

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

                            {watchedValues.createGoogleEvent && (
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                                        <div className="text-sm">
                                            <p className="font-medium text-blue-900">Evento será criado no Google Calendar</p>
                                            <p className="text-blue-700 mt-1">
                                                O cliente receberá um convite por email e o evento aparecerá em seu calendário.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Conflitos */}
                    {conflicts.length > 0 && (
                        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium text-red-900">Conflito de horário detectado!</p>
                                    {conflicts.map((conflict, index) => (
                                        <p key={index} className="text-red-700 mt-1">
                                            • Agendamento existente às {format(new Date(conflict.scheduled_datetime), 'HH:mm')}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Status do agendamento para edição */}
                    {appointment && (
                        <div className="border-t pt-4">
                            <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">Status do Agendamento</h4>
                                <Badge variant={appointment.calendar_synced ? "default" : "destructive"}>
                                    {appointment.calendar_synced ? "Sincronizado" : "Não Sincronizado"}
                                </Badge>
                            </div>
                            {appointment.google_event_id && (
                                <p className="text-sm text-gray-600">
                                    ID do evento no Google: {appointment.google_event_id}
                                </p>
                            )}
                        </div>
                    )}

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        {appointment && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={appointmentsLoading}
                            >
                                {appointmentsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}
                            </Button>
                        )}
                        <div className="flex gap-2 ml-auto">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting || appointmentsLoading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || appointmentsLoading || conflicts.length > 0}
                            >
                                {isSubmitting || appointmentsLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <Check className="w-4 h-4 mr-2" />
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