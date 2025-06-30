'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    DollarSign
} from 'lucide-react'
import { format, addDays, isSameDay, setHours, setMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TimeSlots from '@/components/calendar/TimeSlots'

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
    clientPhone: z.string().optional(),
    confirmationRequired: z.boolean().default(false)
})

type AppointmentFormData = z.infer<typeof appointmentSchema>

interface Client {
    id: string
    name: string
    email?: string
    phone?: string
    totalVisits: number
    lastVisit?: string
}

interface Procedure {
    id: string
    name: string
    durationMinutes: number
    price: number
    description?: string
    category: string
}

const timeSlots = Array.from({ length: 21 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8
    const minute = (i % 2) * 30
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
})

const NovoAgendamentoPage: React.FC = () => {
    const router = useRouter()
    const [selectedDate, setSelectedDate] = useState<Date>()
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null)
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [clientSearch, setClientSearch] = useState('')
    const [procedureSearch, setProcedureSearch] = useState('')
    const [conflicts, setConflicts] = useState<any[]>([])
    const [showTimeSlots, setShowTimeSlots] = useState(false)

    // Mock data - substituir por dados reais da API
    const [clients] = useState<Client[]>([
        {
            id: '1',
            name: 'Maria Silva',
            email: 'maria@email.com',
            phone: '(11) 99999-9999',
            totalVisits: 15,
            lastVisit: '2024-01-15'
        },
        {
            id: '2',
            name: 'João Santos',
            phone: '(11) 88888-8888',
            totalVisits: 8,
            lastVisit: '2024-01-10'
        },
        {
            id: '3',
            name: 'Ana Costa',
            email: 'ana@email.com',
            totalVisits: 3,
            lastVisit: '2024-01-20'
        }
    ])

    const [procedures] = useState<Procedure[]>([
        {
            id: '1',
            name: 'Limpeza de Pele',
            durationMinutes: 60,
            price: 120.00,
            category: 'Facial',
            description: 'Limpeza profunda com extração'
        },
        {
            id: '2',
            name: 'Massagem Relaxante',
            durationMinutes: 90,
            price: 150.00,
            category: 'Corporal',
            description: 'Massagem com óleos essenciais'
        },
        {
            id: '3',
            name: 'Peeling Químico',
            durationMinutes: 45,
            price: 200.00,
            category: 'Facial',
            description: 'Renovação celular com ácidos'
        },
        {
            id: '4',
            name: 'Drenagem Linfática',
            durationMinutes: 60,
            price: 120.00,
            category: 'Corporal',
            description: 'Redução de inchaço e toxinas'
        }
    ])

    const [appointments] = useState([
        {
            id: '1',
            clientName: 'Cliente Teste',
            scheduledDateTime: new Date().toISOString(),
            durationMinutes: 60,
            status: 'confirmed'
        }
    ])

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
            confirmationRequired: false
        }
    })

    const watchedValues = watch()

    // Filtrar clientes por busca
    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        client.phone?.includes(clientSearch) ||
        client.email?.toLowerCase().includes(clientSearch.toLowerCase())
    )

    // Filtrar procedimentos por busca
    const filteredProcedures = procedures.filter(procedure =>
        procedure.name.toLowerCase().includes(procedureSearch.toLowerCase()) ||
        procedure.category.toLowerCase().includes(procedureSearch.toLowerCase())
    )

    // Agrupar procedimentos por categoria
    const proceduresByCategory = filteredProcedures.reduce((acc, procedure) => {
        if (!acc[procedure.category]) {
            acc[procedure.category] = []
        }
        acc[procedure.category].push(procedure)
        return acc
    }, {} as Record<string, Procedure[]>)

    // Atualizar duração quando procedimento for selecionado
    useEffect(() => {
        if (selectedProcedure) {
            setValue('durationMinutes', selectedProcedure.durationMinutes)
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
        if (watchedValues.date && watchedValues.time && watchedValues.durationMinutes) {
            checkConflicts()
        }
    }, [watchedValues.date, watchedValues.time, watchedValues.durationMinutes])

    const checkConflicts = async () => {
        if (!watchedValues.date || !watchedValues.time) return

        // Simular verificação de conflitos
        const appointmentDateTime = setMinutes(
            setHours(watchedValues.date, parseInt(watchedValues.time.split(':')[0])),
            parseInt(watchedValues.time.split(':')[1])
        )

        const potentialConflicts = appointments.filter(apt => {
            const aptDateTime = new Date(apt.scheduledDateTime)
            const aptEndTime = new Date(aptDateTime.getTime() + apt.durationMinutes * 60000)
            const newEndTime = new Date(appointmentDateTime.getTime() + watchedValues.durationMinutes * 60000)

            return isSameDay(aptDateTime, appointmentDateTime) &&
                ((appointmentDateTime >= aptDateTime && appointmentDateTime < aptEndTime) ||
                    (newEndTime > aptDateTime && newEndTime <= aptEndTime))
        })

        setConflicts(potentialConflicts)
    }

    const handleClientChange = (clientId: string) => {
        const client = clients.find(c => c.id === clientId)
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
            setShowTimeSlots(true)
        }
    }

    const handleTimeSelect = (date: Date, time: string) => {
        setSelectedDate(date)
        setValue('date', date)
        setValue('time', time)
        setShowTimeSlots(false)
    }

    const onSubmit = async (data: AppointmentFormData) => {
        try {
            setIsLoading(true)

            // Simular criação do agendamento
            console.log('Criando agendamento:', data)

            // Simular delay da API
            await new Promise(resolve => setTimeout(resolve, 2000))

            // Redirecionar para lista de agendamentos
            router.push('/agendamentos?success=created')
        } catch (error) {
            console.error('Erro ao criar agendamento:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const calculateTotalPrice = () => {
        return selectedProcedure ? selectedProcedure.price : 0
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/agendamentos">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Novo Agendamento</h1>
                        <p className="text-gray-600 mt-1">
                            Crie um novo agendamento com integração ao Google Calendar
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Formulário Principal */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Seleção de Cliente */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    Selecionar Cliente
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Buscar cliente por nome, telefone ou email..."
                                        value={clientSearch}
                                        onChange={(e) => setClientSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                <Select value={watchedValues.clientId} onValueChange={handleClientChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um cliente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredClients.map((client) => (
                                            <SelectItem key={client.id} value={client.id}>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{client.name}</span>
                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                        {client.phone && <span>{client.phone}</span>}
                                                        {client.email && <span>{client.email}</span>}
                                                        <Badge variant="outline" className="text-xs">
                                                            {client.totalVisits} visitas
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.clientId && (
                                    <p className="text-sm text-red-600">{errors.clientId.message}</p>
                                )}

                                {/* Info do cliente selecionado */}
                                {selectedClient && (
                                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
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
                                                    {selectedClient.totalVisits} visitas
                                                </div>
                                                {selectedClient.lastVisit && (
                                                    <div className="text-xs text-blue-600">
                                                        Última: {format(new Date(selectedClient.lastVisit), 'dd/MM/yyyy')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Seleção de Procedimento */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Scissors className="w-5 h-5" />
                                    Selecionar Procedimento
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Buscar procedimento..."
                                        value={procedureSearch}
                                        onChange={(e) => setProcedureSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                <Select value={watchedValues.procedureId} onValueChange={handleProcedureChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um procedimento" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(proceduresByCategory).map(([category, procedures]) => (
                                            <div key={category}>
                                                <div className="px-2 py-1 text-sm font-medium text-gray-500 bg-gray-50">
                                                    {category}
                                                </div>
                                                {procedures.map((procedure) => (
                                                    <SelectItem key={procedure.id} value={procedure.id}>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{procedure.name}</span>
                                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                <span>{procedure.durationMinutes} min</span>
                                                                <span>R$ {procedure.price.toFixed(2)}</span>
                                                            </div>
                                                            {procedure.description && (
                                                                <span className="text-xs text-gray-400">{procedure.description}</span>
                                                            )}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </div>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.procedureId && (
                                    <p className="text-sm text-red-600">{errors.procedureId.message}</p>
                                )}

                                {/* Info do procedimento selecionado */}
                                {selectedProcedure && (
                                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-green-900">{selectedProcedure.name}</p>
                                                <p className="text-sm text-green-700">{selectedProcedure.description}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-medium text-green-900">
                                                    R$ {selectedProcedure.price.toFixed(2)}
                                                </div>
                                                <div className="text-xs text-green-600">
                                                    {selectedProcedure.durationMinutes} minutos
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Data e Horário */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CalendarIcon className="w-5 h-5" />
                                    Data e Horário
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
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

                                {/* Botão para mostrar slots de horário */}
                                {selectedDate && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowTimeSlots(!showTimeSlots)}
                                        className="w-full"
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
                                        {...register('durationMinutes', { valueAsNumber: true })}
                                    />
                                    {errors.durationMinutes && (
                                        <p className="text-sm text-red-600">{errors.durationMinutes.message}</p>
                                    )}
                                </div>

                                {/* Conflitos */}
                                {conflicts.length > 0 && (
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            <div className="space-y-1">
                                                <p className="font-medium">Conflito de horário detectado!</p>
                                                {conflicts.map((conflict, index) => (
                                                    <p key={index} className="text-sm">
                                                        • {conflict.clientName} às {format(new Date(conflict.scheduledDateTime), 'HH:mm')}
                                                    </p>
                                                ))}
                                            </div>
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>

                        {/* Observações */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Observações</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    {...register('notes')}
                                    placeholder="Observações adicionais sobre o agendamento..."
                                    rows={3}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Resumo */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="w-5 h-5" />
                                    Resumo do Agendamento
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                                        <p className="text-sm text-gray-500">{selectedProcedure.durationMinutes} minutos</p>
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
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <GoogleCalendarIcon className="w-5 h-5" />
                                    Opções
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                                className="w-full"
                                disabled={isLoading || isSubmitting || conflicts.length > 0}
                            >
                                {isLoading || isSubmitting ? (
                                    <>Criando Agendamento...</>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Criar Agendamento
                                    </>
                                )}
                            </Button>
                            <Link href="/agendamentos">
                                <Button variant="outline" className="w-full" disabled={isLoading}>
                                    Cancelar
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </form>

            {/* Slots de horário */}
            {showTimeSlots && selectedDate && (
                <Card>
                    <CardHeader>
                        <CardTitle>Horários Disponíveis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <TimeSlots
                            selectedDate={selectedDate}
                            onTimeSelect={handleTimeSelect}
                            appointments={appointments}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default NovoAgendamentoPage