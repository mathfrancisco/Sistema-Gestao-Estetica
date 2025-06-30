import React, { useState, useEffect } from 'react'
import { Calendar, Clock, User,MapPin, FileText, Save, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { useAppointments } from '@/lib/hooks/useAppointment'
import { useGoogleCalendar } from '@/lib/hooks/useGoogleCalendar'
import { useAuthStore } from '@/store/useAuthStore'
import { useSearchClients, useCreateClient } from '@/lib/hooks/useClients'
import { toast } from 'sonner'
import type { Database } from '@/lib/database/supabase/types'

// Tipos
type Client = Database['public']['Tables']['clients']['Row']
type ClientInsert = Database['public']['Tables']['clients']['Insert']
type AppointmentStatus = Database['public']['Enums']['appointment_status_enum']

interface AppointmentFormData {
    client_name: string
    client_email: string
    client_phone: string
    service_type: string
    scheduled_datetime: string
    duration_minutes: number
    location?: string
    notes?: string
    price?: number
    status: AppointmentStatus
    create_google_event?: boolean
    send_confirmation?: boolean
}

interface AppointmentFormProps {
    initialData?: Partial<AppointmentFormData>
    appointmentId?: string
    onSave?: (data: AppointmentFormData) => void
    onCancel?: () => void
    isEditing?: boolean
    preselectedDateTime?: string
}

const SERVICE_TYPES = [
    'Limpeza de Pele',
    'Peeling',
    'Hidratação Facial',
    'Massagem Relaxante',
    'Drenagem Linfática',
    'Depilação',
    'Design de Sobrancelhas',
    'Manicure e Pedicure',
    'Tratamento Capilar',
    'Consulta',
    'Outro'
]

const DURATIONS = [
    { value: 30, label: '30 minutos' },
    { value: 45, label: '45 minutos' },
    { value: 60, label: '1 hora' },
    { value: 90, label: '1h 30min' },
    { value: 120, label: '2 horas' },
    { value: 180, label: '3 horas' }
]

const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
    { value: 'scheduled', label: 'Agendado' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'completed', label: 'Concluído' },
    { value: 'cancelled', label: 'Cancelado' },
    { value: 'no_show', label: 'Não Compareceu' }
]

export default function AppointmentForm({
                                            initialData,
                                            appointmentId,
                                            onSave,
                                            onCancel,
                                            isEditing = false,
                                            preselectedDateTime
                                        }: AppointmentFormProps) {
    const { user } = useAuthStore()
    const [formData, setFormData] = useState<AppointmentFormData>({
        client_name: '',
        client_email: '',
        client_phone: '',
        service_type: '',
        scheduled_datetime: preselectedDateTime || '',
        duration_minutes: 60,
        location: '',
        notes: '',
        price: 0,
        status: 'scheduled',
        create_google_event: true,
        send_confirmation: true,
        ...initialData
    })

    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)

    // Hooks
    const { createAppointment, updateAppointment, checkConflicts } = useAppointments()
    const { isAuthenticated: isGoogleCalendarConnected, createEvent } = useGoogleCalendar()
    const createClientMutation = useCreateClient()

    // Buscar clientes quando o usuário digitar
    const {
        data: searchResults = [],
        isLoading: isSearching
    } = useSearchClients(
        searchQuery,
        5
    )

    // Atualizar dados quando initialData mudar
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }))
        }
    }, [initialData])

    // Atualizar datetime quando preselectedDateTime mudar
    useEffect(() => {
        if (preselectedDateTime) {
            setFormData(prev => ({ ...prev, scheduled_datetime: preselectedDateTime }))
        }
    }, [preselectedDateTime])

    // Atualizar busca quando nome do cliente mudar
    useEffect(() => {
        if (formData.client_name.length >= 2 && !selectedClient) {
            setSearchQuery(formData.client_name)
        } else if (formData.client_name.length < 2) {
            setSearchQuery('')
        }
    }, [formData.client_name, selectedClient])

    const handleInputChange = (field: keyof AppointmentFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))

        // Limpar cliente selecionado se nome mudar
        if (field === 'client_name' && selectedClient) {
            setSelectedClient(null)
        }

        // Limpar erro do campo quando o usuário começar a digitar
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    const handleClientSelect = (client: Client) => {
        setSelectedClient(client)
        setFormData(prev => ({
            ...prev,
            client_name: client.name,
            client_email: client.email || '',
            client_phone: client.phone || ''
        }))
        setSearchQuery('')
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        // Campos obrigatórios
        if (!formData.client_name.trim()) {
            newErrors.client_name = 'Nome do cliente é obrigatório'
        }

        if (!formData.client_phone.trim()) {
            newErrors.client_phone = 'Telefone é obrigatório'
        }

        if (!formData.service_type) {
            newErrors.service_type = 'Tipo de serviço é obrigatório'
        }

        if (!formData.scheduled_datetime) {
            newErrors.scheduled_datetime = 'Data e horário são obrigatórios'
        }

        // Validar email se fornecido
        if (formData.client_email && !/\S+@\S+\.\S+/.test(formData.client_email)) {
            newErrors.client_email = 'Email inválido'
        }

        // Validar telefone
        const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/
        if (formData.client_phone && !phoneRegex.test(formData.client_phone)) {
            newErrors.client_phone = 'Formato: (XX) XXXXX-XXXX'
        }

        // Validar data/hora
        if (formData.scheduled_datetime) {
            const scheduledDate = new Date(formData.scheduled_datetime)
            const now = new Date()

            if (scheduledDate <= now) {
                newErrors.scheduled_datetime = 'Data deve ser no futuro'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const checkForConflicts = async () => {
        if (!formData.scheduled_datetime) return true

        try {
            const conflicts = await checkConflicts(
                formData.scheduled_datetime,
                formData.duration_minutes,
                appointmentId
            )

            if (conflicts.length > 0) {
                setErrors(prev => ({
                    ...prev,
                    scheduled_datetime: 'Já existe um agendamento neste horário'
                }))
                return false
            }

            return true
        } catch (error) {
            console.error('Erro ao verificar conflitos:', error)
            return true // Continuar mesmo com erro na verificação
        }
    }

    const findOrCreateClient = async (): Promise<string> => {
        if (!user) throw new Error('Usuário não autenticado')

        // Se já temos um cliente selecionado, usar ele
        if (selectedClient) {
            return selectedClient.id
        }

        // Verificar se existe cliente com mesmo telefone nos resultados da busca
        const existingClient = searchResults.find(
            client => client.phone === formData.client_phone || client.name === formData.client_name
        )

        if (existingClient) {
            return existingClient.id
        }

        // Criar novo cliente
        try {
            const clientData: ClientInsert = {
                user_id: user.id,
                name: formData.client_name,
                email: formData.client_email || null,
                phone: formData.client_phone || null,
                status: 'active'
            }

            const newClient = await createClientMutation.mutateAsync(clientData)
            return newClient.id
        } catch (error) {
            console.error('Erro ao criar cliente:', error)
            throw new Error('Erro ao processar dados do cliente')
        }
    }

    const findOrCreateProcedure = async (): Promise<string> => {
        if (!user) throw new Error('Usuário não autenticado')

        try {
            // Buscar procedimento existente pelo nome
            const { data: procedures, error } = await import('@/lib/database/supabase/client')
                .then(({ supabase }) => supabase
                    .from('procedures')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('name', formData.service_type)
                    .eq('is_active', true)
                    .limit(1)
                    .single()
                )

            if (!error && procedures) {
                return procedures.id
            }

            // Criar novo procedimento se não encontrar
            const { data: newProcedure, error: createError } = await import('@/lib/database/supabase/client')
                .then(({ supabase }) => supabase
                    .from('procedures')
                    .insert({
                        user_id: user.id,
                        name: formData.service_type,
                        price: formData.price || 0,
                        duration_minutes: formData.duration_minutes,
                        is_active: true
                    })
                    .select('id')
                    .single()
                )

            if (createError) {
                throw createError
            }

            return newProcedure?.id
        } catch (error) {
            console.error('Erro ao encontrar/criar procedimento:', error)
            throw new Error('Erro ao processar tipo de serviço')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!user) {
            toast.error('Usuário não autenticado')
            return
        }

        if (!validateForm()) return

        setIsSubmitting(true)

        try {
            // Verificar conflitos
            const noConflicts = await checkForConflicts()
            if (!noConflicts) {
                setIsSubmitting(false)
                return
            }

            // Encontrar ou criar cliente e procedimento
            const [clientId, procedureId] = await Promise.all([
                findOrCreateClient(),
                findOrCreateProcedure()
            ])

            // Preparar dados do agendamento
            const appointmentData = {
                user_id: user.id,
                client_id: clientId,
                procedure_id: procedureId,
                scheduled_datetime: formData.scheduled_datetime,
                duration_minutes: formData.duration_minutes,
                status: formData.status,
                notes: formData.notes || null,
                calendar_synced: false
            }

            let result

            if (isEditing && appointmentId) {
                // Atualizar agendamento existente
                result = await updateAppointment(appointmentId, appointmentData)
            } else {
                // Criar novo agendamento
                result = await createAppointment(appointmentData)
            }

            if (result) {
                // Criar evento no Google Calendar se solicitado
                if (formData.create_google_event && isGoogleCalendarConnected) {
                    try {
                        const endDateTime = new Date(formData.scheduled_datetime)
                        endDateTime.setMinutes(endDateTime.getMinutes() + formData.duration_minutes)

                        const googleEvent = await createEvent({
                            summary: `${formData.service_type} - ${formData.client_name}`,
                            description: formData.notes || '',
                            startDateTime: formData.scheduled_datetime,
                            endDateTime: endDateTime.toISOString(),
                            attendees: formData.client_email ? [formData.client_email] : [],
                            location: formData.location,
                            createMeet: true
                        })

                        if (googleEvent) {
                            // Atualizar agendamento com ID do evento do Google
                            await updateAppointment(result.id, {
                                google_event_id: googleEvent.id,
                                calendar_synced: true,
                                google_meet_link: googleEvent.hangoutLink || null
                            })
                        }
                    } catch (error) {
                        console.error('Erro ao criar evento no Google Calendar:', error)
                        toast.warning('Agendamento criado, mas houve erro na sincronização com Google Calendar')
                    }
                }

                toast.success(isEditing ? 'Agendamento atualizado com sucesso!' : 'Agendamento criado com sucesso!')
                onSave?.(formData)
            }
        } catch (error) {
            console.error('Erro ao salvar agendamento:', error)
            setErrors(prev => ({
                ...prev,
                submit: error instanceof Error ? error.message : 'Erro ao salvar agendamento. Tente novamente.'
            }))
            toast.error('Erro ao salvar agendamento')
        } finally {
            setIsSubmitting(false)
        }
    }

    const formatPhoneNumber = (value: string) => {
        const numbers = value.replace(/\D/g, '')
        if (numbers.length <= 11) {
            return numbers.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')
        }
        return value
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5" />
                        <span>{isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}</span>
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Dados do Cliente */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>Dados do Cliente</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="client_name">Nome do Cliente *</Label>
                                <div className="relative">
                                    <Input
                                        id="client_name"
                                        value={formData.client_name}
                                        onChange={(e) => handleInputChange('client_name', e.target.value)}
                                        placeholder="Nome completo"
                                        className={errors.client_name ? 'border-red-500' : ''}
                                    />

                                    {/* Resultados da busca */}
                                    {searchResults.length > 0 && !selectedClient && formData.client_name.length >= 2 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                            {searchResults.map((client) => (
                                                <button
                                                    key={client.id}
                                                    type="button"
                                                    onClick={() => handleClientSelect(client)}
                                                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                                                >
                                                    <User className="h-4 w-4 text-gray-400" />
                                                    <div>
                                                        <p className="font-medium">{client.name}</p>
                                                        {client.phone && (
                                                            <p className="text-sm text-gray-500">{client.phone}</p>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {errors.client_name && (
                                    <p className="text-sm text-red-500">{errors.client_name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="client_phone">Telefone *</Label>
                                <Input
                                    id="client_phone"
                                    value={formData.client_phone}
                                    onChange={(e) => handleInputChange('client_phone', formatPhoneNumber(e.target.value))}
                                    placeholder="(XX) XXXXX-XXXX"
                                    className={errors.client_phone ? 'border-red-500' : ''}
                                />
                                {errors.client_phone && (
                                    <p className="text-sm text-red-500">{errors.client_phone}</p>
                                )}
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="client_email">Email</Label>
                                <Input
                                    id="client_email"
                                    type="email"
                                    value={formData.client_email}
                                    onChange={(e) => handleInputChange('client_email', e.target.value)}
                                    placeholder="email@exemplo.com"
                                    className={errors.client_email ? 'border-red-500' : ''}
                                />
                                {errors.client_email && (
                                    <p className="text-sm text-red-500">{errors.client_email}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Dados do Agendamento */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>Dados do Agendamento</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="service_type">Tipo de Serviço *</Label>
                                <Select
                                    value={formData.service_type}
                                    onValueChange={(value) => handleInputChange('service_type', value)}
                                >
                                    <SelectTrigger className={errors.service_type ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Selecione o serviço" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SERVICE_TYPES.map((service) => (
                                            <SelectItem key={service} value={service}>
                                                {service}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.service_type && (
                                    <p className="text-sm text-red-500">{errors.service_type}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="duration">Duração</Label>
                                <Select
                                    value={formData.duration_minutes.toString()}
                                    onValueChange={(value) => handleInputChange('duration_minutes', parseInt(value))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DURATIONS.map((duration) => (
                                            <SelectItem key={duration.value} value={duration.value.toString()}>
                                                {duration.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="scheduled_datetime">Data e Horário *</Label>
                                <Input
                                    id="scheduled_datetime"
                                    type="datetime-local"
                                    value={formData.scheduled_datetime.slice(0, 16)}
                                    onChange={(e) => handleInputChange('scheduled_datetime', e.target.value + ':00.000Z')}
                                    className={errors.scheduled_datetime ? 'border-red-500' : ''}
                                />
                                {errors.scheduled_datetime && (
                                    <p className="text-sm text-red-500">{errors.scheduled_datetime}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location">Local</Label>
                                <div className="flex items-center space-x-2">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    <Input
                                        id="location"
                                        value={formData.location || ''}
                                        onChange={(e) => handleInputChange('location', e.target.value)}
                                        placeholder="Local do atendimento"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="price">Valor (R$)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.price || ''}
                                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                                    placeholder="0,00"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Observações</Label>
                            <div className="flex items-start space-x-2">
                                <FileText className="h-4 w-4 mt-2 text-gray-400" />
                                <Textarea
                                    id="notes"
                                    value={formData.notes || ''}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    placeholder="Informações adicionais sobre o agendamento"
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status e Integrações */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Status e Integrações</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="status">Status do Agendamento</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value: AppointmentStatus) => handleInputChange('status', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUS_OPTIONS.map((status) => (
                                            <SelectItem key={status.value} value={status.value}>
                                                {status.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="create_google_event"
                                        checked={formData.create_google_event}
                                        onCheckedChange={(checked) => handleInputChange('create_google_event', checked)}
                                        disabled={!isGoogleCalendarConnected}
                                    />
                                    <Label htmlFor="create_google_event" className="cursor-pointer">
                                        Criar evento no Google Calendar
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="send_confirmation"
                                        checked={formData.send_confirmation}
                                        onCheckedChange={(checked) => handleInputChange('send_confirmation', checked)}
                                    />
                                    <Label htmlFor="send_confirmation" className="cursor-pointer">
                                        Enviar confirmação ao cliente
                                    </Label>
                                </div>

                                {!isGoogleCalendarConnected && (
                                    <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                                        Google Calendar não está conectado.
                                        <br />
                                        Conecte para criar eventos automaticamente.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Cliente selecionado */}
                    {selectedClient && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800">
                                    Cliente selecionado: {selectedClient.name}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedClient(null)}
                                    className="text-green-600 hover:text-green-800"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Loading de criação de cliente */}
                    {createClientMutation.isPending && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <span className="text-sm text-blue-800">
                                    Criando novo cliente...
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Mensagem de erro */}
                    {errors.submit && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{errors.submit}</AlertDescription>
                        </Alert>
                    )}

                    {/* Botões */}
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="flex items-center space-x-1"
                        >
                            <X className="h-4 w-4" />
                            <span>Cancelar</span>
                        </Button>

                        <Button
                            type="submit"
                            disabled={isSubmitting || createClientMutation.isPending}
                            className="flex items-center space-x-1"
                        >
                            <Save className="h-4 w-4" />
                            <span>
                                {isSubmitting ? 'Salvando...' :
                                    createClientMutation.isPending ? 'Criando cliente...' :
                                        'Salvar Agendamento'}
                            </span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    )
}