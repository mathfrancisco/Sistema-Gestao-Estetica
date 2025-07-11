'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    Users,
    Mail,
    Phone,
    Calendar,
    MapPin,
    FileText,
    Save,
    Trash2,
    User,
    CreditCard,
    Heart,
    Target,
    AlertTriangle,
    CheckCircle,
    Eye,
    EyeOff,
    Sparkles,
    Clock,
    TrendingUp,
    Award,
    Zap,
    RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Database } from '@/lib/database/supabase/types'
import { cn } from '@/lib/utils/utils'

type Client = Database['public']['Tables']['clients']['Row']
type ClientInsert = Database['public']['Tables']['clients']['Insert']
type ClientStatus = Database['public']['Enums']['client_status_enum']
type ClientSegment = Database['public']['Enums']['client_segment_enum']

interface ClientModalProps {
    isOpen: boolean
    onClose: () => void
    client?: Client
    onSave: (data: ClientInsert) => void
    onDelete?: () => void
    autoSave?: boolean
    showAdvancedStats?: boolean
}

interface FormData {
    name: string
    email: string
    phone: string
    cpf: string
    birthday: string
    status: ClientStatus
    segment: ClientSegment | null
    preferences: string
    observations: string
    address: {
        street: string
        number: string
        complement: string
        neighborhood: string
        city: string
        state: string
        zipCode: string
    }
}

interface ValidationErrors {
    [key: string]: string | undefined
}

interface FieldValidation {
    field: keyof FormData | string
    isValid: boolean
    message?: string
}

const ClientModal: React.FC<ClientModalProps> = ({
                                                     isOpen,
                                                     onClose,
                                                     client,
                                                     onSave,
                                                     onDelete,
                                                     autoSave = false,
                                                     showAdvancedStats = true
                                                 }) => {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        phone: '',
        cpf: '',
        birthday: '',
        status: 'active',
        segment: null,
        preferences: '',
        observations: '',
        address: {
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: '',
            zipCode: ''
        }
    })

    const [errors, setErrors] = useState<ValidationErrors>({})
    const [loading, setLoading] = useState(false)
    const [validationState, setValidationState] = useState<FieldValidation[]>([])
    const [isDirty, setIsDirty] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()

    // Form completion progress
    const completionProgress = useMemo(() => {
        const requiredFields = ['name']
        const optionalFields = ['email', 'phone', 'cpf', 'birthday', 'address.city']

        let requiredCount = 0
        let optionalCount = 0

        requiredFields.forEach(field => {
            if (formData[field as keyof FormData]) requiredCount++
        })

        optionalFields.forEach(field => {
            if (field.includes('.')) {
                const [parent, child] = field.split('.')
                if (formData[parent as keyof FormData]?.[child as keyof FormData['address']]) {
                    optionalCount++
                }
            } else if (formData[field as keyof FormData]) {
                optionalCount++
            }
        })

        const totalProgress = (requiredCount / requiredFields.length) * 70 + (optionalCount / optionalFields.length) * 30
        return Math.round(totalProgress)
    }, [formData])

    // Real-time validation
    const validateField = useCallback((field: string, value: any): FieldValidation => {
        switch (field) {
            case 'name':
                return {
                    field,
                    isValid: value.trim().length >= 2,
                    message: value.trim().length === 0 ? 'Nome é obrigatório' : value.trim().length < 2 ? 'Nome deve ter pelo menos 2 caracteres' : undefined
                }
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                return {
                    field,
                    isValid: !value || emailRegex.test(value),
                    message: value && !emailRegex.test(value) ? 'Email inválido' : undefined
                }
            case 'phone':
                const phoneRegex = /^[\d\s\(\)\-\+]{10,}$/
                return {
                    field,
                    isValid: !value || phoneRegex.test(value.replace(/\D/g, '')),
                    message: value && value.replace(/\D/g, '').length < 10 ? 'Telefone deve ter pelo menos 10 dígitos' : undefined
                }
            case 'cpf':
                const cpfNumbers = value.replace(/\D/g, '')
                return {
                    field,
                    isValid: !value || cpfNumbers.length === 11,
                    message: value && cpfNumbers.length !== 11 ? 'CPF deve ter 11 dígitos' : undefined
                }
            default:
                return { field, isValid: true }
        }
    }, [])

    // Auto-save functionality
    useEffect(() => {
        if (autoSave && isDirty && !loading) {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current)
            }

            autoSaveTimeoutRef.current = setTimeout(() => {
                const isFormValid = validationState.every(v => v.isValid) && formData.name.trim()
                if (isFormValid) {
                    handleSave(true) // Silent save
                }
            }, 2000)
        }

        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current)
            }
        }
    }, [formData, isDirty, autoSave, loading])

    // Load client data
    useEffect(() => {
        if (client) {
            const address = client.address as any || {}
            setFormData({
                name: client.name || '',
                email: client.email || '',
                phone: client.phone || '',
                cpf: client.cpf || '',
                birthday: client.birthday ? format(new Date(client.birthday), 'yyyy-MM-dd') : '',
                status: client.status,
                segment: client.segment,
                preferences: client.preferences || '',
                observations: client.observations || '',
                address: {
                    street: address.street || '',
                    number: address.number || '',
                    complement: address.complement || '',
                    neighborhood: address.neighborhood || '',
                    city: address.city || '',
                    state: address.state || '',
                    zipCode: address.zipCode || ''
                }
            })
            setIsDirty(false)
        } else {
            // Reset for new client
            setFormData({
                name: '',
                email: '',
                phone: '',
                cpf: '',
                birthday: '',
                status: 'active',
                segment: 'new',
                preferences: '',
                observations: '',
                address: {
                    street: '',
                    number: '',
                    complement: '',
                    neighborhood: '',
                    city: '',
                    state: '',
                    zipCode: ''
                }
            })
            setIsDirty(false)
        }
        setErrors({})
        setValidationState([])
    }, [client, isOpen])

    const handleInputChange = useCallback((field: keyof FormData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
        setIsDirty(true)

        // Real-time validation
        const validation = validateField(field, value)
        setValidationState(prev => {
            const filtered = prev.filter(v => v.field !== field)
            return [...filtered, validation]
        })

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: undefined
            }))
        }
    }, [errors, validateField])

    const handleAddressChange = useCallback((field: keyof FormData['address'], value: string) => {
        setFormData(prev => ({
            ...prev,
            address: {
                ...prev.address,
                [field]: value
            }
        }))
        setIsDirty(true)
    }, [])

    const handleSave = useCallback(async (silent = false) => {
        if (!silent) setLoading(true)

        try {
            // Final validation
            const finalValidation = Object.keys(formData).map(key =>
                validateField(key, formData[key as keyof FormData])
            )

            const hasErrors = finalValidation.some(v => !v.isValid)
            if (hasErrors) {
                const newErrors: ValidationErrors = {}
                finalValidation.forEach(v => {
                    if (!v.isValid && v.message) {
                        newErrors[v.field] = v.message
                    }
                })
                setErrors(newErrors)
                return
            }

            const submitData: ClientInsert = {
                name: formData.name.trim(),
                email: formData.email.trim() || null,
                phone: formData.phone.trim() || null,
                cpf: formData.cpf.replace(/\D/g, '') || null,
                birthday: formData.birthday || null,
                status: formData.status,
                segment: formData.segment,
                preferences: formData.preferences.trim() || null,
                observations: formData.observations.trim() || null,
                address: formData.address.street ? formData.address : null,
                user_id: '',
                total_spent: client?.total_spent || 0,
                total_visits: client?.total_visits || 0
            }

            await onSave(submitData)
            setIsDirty(false)

            if (!silent) {
                onClose()
            }
        } catch (error) {
            console.error('Error saving client:', error)
        } finally {
            if (!silent) setLoading(false)
        }
    }, [formData, onSave, onClose, client, validateField])

    const formatCPF = useCallback((value: string) => {
        const numbers = value.replace(/\D/g, '')
        return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }, [])

    const formatPhone = useCallback((value: string) => {
        const numbers = value.replace(/\D/g, '')
        if (numbers.length <= 10) {
            return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
        }
        return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }, [])

    const getSegmentInfo = useCallback((segment: ClientSegment | null) => {
        const segmentConfig = {
            vip: {
                label: 'VIP',
                color: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
                icon: Users,
                description: 'Cliente de alto valor'
            },
            regular: {
                label: 'Regular',
                color: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
                icon: User,
                description: 'Cliente padrão'
            },
            new: {
                label: 'Novo',
                color: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
                icon: Sparkles,
                description: 'Cliente recém-cadastrado'
            },
            at_risk: {
                label: 'Em Risco',
                color: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
                icon: AlertTriangle,
                description: 'Requer atenção especial'
            },
            lost: {
                label: 'Perdido',
                color: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white',
                icon: Target,
                description: 'Cliente inativo há muito tempo'
            }
        }

        return segment ? segmentConfig[segment] : null
    }, [])

    const getFieldValidationState = useCallback((field: string) => {
        const validation = validationState.find(v => v.field === field)
        if (!validation) return null

        return {
            isValid: validation.isValid,
            message: validation.message
        }
    }, [validationState])

    const FormStep = ({ step, title, icon: Icon, children }: {
        step: number
        title: string
        icon: React.ElementType
        children: React.ReactNode
    }) => (
        <Card className={cn(
            "transition-all duration-300",
            step === currentStep ? "ring-2 ring-purple-500 shadow-lg" : "opacity-75"
        )}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        step === currentStep
                            ? "bg-gradient-to-r from-purple-500 to-pink-600"
                            : "bg-slate-200"
                    )}>
                        <Icon className={cn(
                            "w-4 h-4",
                            step === currentStep ? "text-white" : "text-slate-500"
                        )} />
                    </div>
                    {title}
                    {step === currentStep && (
                        <Badge variant="secondary" className="ml-auto">
                            Atual
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {children}
            </CardContent>
        </Card>
    )

    const InputField = ({
                            label,
                            field,
                            type = 'text',
                            placeholder,
                            icon: Icon,
                            required = false,
                            formatter,
                            ...props
                        }: {
        label: string
        field: keyof FormData
        type?: string
        placeholder?: string
        icon?: React.ElementType
        required?: boolean
        formatter?: (value: string) => string
        [key: string]: any
    }) => {
        const validation = getFieldValidationState(field)
        const value = formData[field] as string

        return (
            <div className="space-y-2">
                <Label htmlFor={field} className="flex items-center gap-1">
                    {Icon && <Icon className="w-4 h-4" />}
                    {label}
                    {required && <span className="text-red-500">*</span>}
                </Label>
                <div className="relative">
                    <Input
                        id={field}
                        type={type}
                        value={value}
                        onChange={(e) => {
                            const newValue = formatter ? formatter(e.target.value) : e.target.value
                            handleInputChange(field, newValue)
                        }}
                        placeholder={placeholder}
                        className={cn(
                            "transition-all duration-200",
                            validation?.isValid === false && "border-red-500 focus:border-red-500",
                            validation?.isValid === true && value && "border-green-500 focus:border-green-500"
                        )}
                        {...props}
                    />
                    {validation?.isValid === true && value && (
                        <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                    )}
                    {validation?.isValid === false && (
                        <AlertTriangle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-500" />
                    )}
                </div>
                {validation?.message && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {validation.message}
                    </p>
                )}
            </div>
        )
    }

    return (
        <TooltipProvider>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                                <Users className="w-4 h-4 text-white" />
                            </div>
                            {client ? 'Editar Cliente' : 'Novo Cliente'}
                            {autoSave && isDirty && (
                                <Badge variant="outline" className="ml-auto bg-blue-50 text-blue-700">
                                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                    Auto-salvando...
                                </Badge>
                            )}
                        </DialogTitle>
                        <DialogDescription className="flex items-center justify-between">
                            <span>
                                {client ? 'Atualize as informações do cliente' : 'Cadastre um novo cliente no sistema'}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs">Progresso:</span>
                                <Progress value={completionProgress} className="w-24 h-2" />
                                <span className="text-xs font-medium">{completionProgress}%</span>
                            </div>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Navigation tabs */}
                        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                            {[
                                { label: 'Dados Básicos', icon: User },
                                { label: 'Contato & Endereço', icon: MapPin },
                                { label: 'Observações', icon: FileText },
                                ...(client && showAdvancedStats ? [{ label: 'Estatísticas', icon: TrendingUp }] : [])
                            ].map((tab, index) => (
                                <Button
                                    key={index}
                                    variant={currentStep === index ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setCurrentStep(index)}
                                    className="flex-1 justify-center"
                                >
                                    <tab.icon className="w-4 h-4 mr-2" />
                                    {tab.label}
                                </Button>
                            ))}
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                            {/* Step 0: Basic Information */}
                            {currentStep === 0 && (
                                <FormStep step={0} title="Informações Básicas" icon={User}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InputField
                                            label="Nome"
                                            field="name"
                                            placeholder="Nome completo do cliente"
                                            icon={User}
                                            required
                                        />

                                        <InputField
                                            label="CPF"
                                            field="cpf"
                                            placeholder="000.000.000-00"
                                            icon={CreditCard}
                                            formatter={formatCPF}
                                            maxLength={14}
                                        />

                                        <InputField
                                            label="Data de Nascimento"
                                            field="birthday"
                                            type="date"
                                            icon={Calendar}
                                        />

                                        <div className="space-y-2">
                                            <Label htmlFor="status" className="flex items-center gap-1">
                                                <CheckCircle className="w-4 h-4" />
                                                Status
                                            </Label>
                                            <Select
                                                value={formData.status}
                                                onValueChange={(value: ClientStatus) => handleInputChange('status', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                            Ativo
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="inactive">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                                            Inativo
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="blocked">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                            Bloqueado
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="segment" className="flex items-center gap-1">
                                                <Target className="w-4 h-4" />
                                                Segmento
                                            </Label>
                                            <Select
                                                value={formData.segment || ''}
                                                onValueChange={(value: ClientSegment) => handleInputChange('segment', value || null)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o segmento" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="new">
                                                        <div className="flex items-center gap-2">
                                                            <Sparkles className="w-4 h-4 text-green-500" />
                                                            Novo Cliente
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="regular">
                                                        <div className="flex items-center gap-2">
                                                            <User className="w-4 h-4 text-blue-500" />
                                                            Cliente Regular
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="vip">
                                                        <div className="flex items-center gap-2">
                                                            <Award className="w-4 h-4 text-amber-500" />
                                                            Cliente VIP
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="at_risk">
                                                        <div className="flex items-center gap-2">
                                                            <AlertTriangle className="w-4 h-4 text-red-500" />
                                                            Em Risco
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="lost">
                                                        <div className="flex items-center gap-2">
                                                            <Target className="w-4 h-4 text-gray-500" />
                                                            Cliente Perdido
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {formData.segment && (
                                                <div className="mt-2">
                                                    <Badge className={getSegmentInfo(formData.segment)?.color}>
                                                        {getSegmentInfo(formData.segment)?.label}
                                                    </Badge>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {getSegmentInfo(formData.segment)?.description}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </FormStep>
                            )}

                            {/* Step 1: Contact & Address */}
                            {currentStep === 1 && (
                                <FormStep step={1} title="Contato & Endereço" icon={MapPin}>
                                    <div className="space-y-6">
                                        {/* Contact Info */}
                                        <div>
                                            <h4 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
                                                <Phone className="w-4 h-4" />
                                                Informações de Contato
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <InputField
                                                    label="Email"
                                                    field="email"
                                                    type="email"
                                                    placeholder="email@exemplo.com"
                                                    icon={Mail}
                                                />

                                                <InputField
                                                    label="Telefone"
                                                    field="phone"
                                                    placeholder="(00) 00000-0000"
                                                    icon={Phone}
                                                    formatter={formatPhone}
                                                />
                                            </div>
                                        </div>

                                        {/* Address */}
                                        <div>
                                            <h4 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                Endereço
                                            </h4>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="md:col-span-2 space-y-2">
                                                        <Label htmlFor="street">Rua</Label>
                                                        <Input
                                                            id="street"
                                                            value={formData.address.street}
                                                            onChange={(e) => handleAddressChange('street', e.target.value)}
                                                            placeholder="Nome da rua"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="number">Número</Label>
                                                        <Input
                                                            id="number"
                                                            value={formData.address.number}
                                                            onChange={(e) => handleAddressChange('number', e.target.value)}
                                                            placeholder="123"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="complement">Complemento</Label>
                                                        <Input
                                                            id="complement"
                                                            value={formData.address.complement}
                                                            onChange={(e) => handleAddressChange('complement', e.target.value)}
                                                            placeholder="Apto, Bloco, etc."
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="neighborhood">Bairro</Label>
                                                        <Input
                                                            id="neighborhood"
                                                            value={formData.address.neighborhood}
                                                            onChange={(e) => handleAddressChange('neighborhood', e.target.value)}
                                                            placeholder="Nome do bairro"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="city">Cidade</Label>
                                                        <Input
                                                            id="city"
                                                            value={formData.address.city}
                                                            onChange={(e) => handleAddressChange('city', e.target.value)}
                                                            placeholder="Nome da cidade"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="state">Estado</Label>
                                                        <Input
                                                            id="state"
                                                            value={formData.address.state}
                                                            onChange={(e) => handleAddressChange('state', e.target.value)}
                                                            placeholder="SP"
                                                            maxLength={2}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="zipCode">CEP</Label>
                                                        <Input
                                                            id="zipCode"
                                                            value={formData.address.zipCode}
                                                            onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                                                            placeholder="00000-000"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </FormStep>
                            )}

                            {/* Step 2: Notes & Preferences */}
                            {currentStep === 2 && (
                                <FormStep step={2} title="Observações e Preferências" icon={FileText}>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="preferences" className="flex items-center gap-1">
                                                <Heart className="w-4 h-4" />
                                                Preferências
                                            </Label>
                                            <Textarea
                                                id="preferences"
                                                value={formData.preferences}
                                                onChange={(e) => handleInputChange('preferences', e.target.value)}
                                                placeholder="Preferências do cliente (horários, procedimentos, etc.)"
                                                rows={3}
                                                className="resize-none"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="observations" className="flex items-center gap-1">
                                                <FileText className="w-4 h-4" />
                                                Observações
                                            </Label>
                                            <Textarea
                                                id="observations"
                                                value={formData.observations}
                                                onChange={(e) => handleInputChange('observations', e.target.value)}
                                                placeholder="Observações importantes sobre o cliente"
                                                rows={3}
                                                className="resize-none"
                                            />
                                        </div>
                                    </div>
                                </FormStep>
                            )}

                            {/* Step 3: Statistics (only for existing clients) */}
                            {currentStep === 3 && client && showAdvancedStats && (
                                <FormStep step={3} title="Estatísticas do Cliente" icon={TrendingUp}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <CreditCard className="w-5 h-5 text-blue-600" />
                                                    <span className="text-sm font-medium text-blue-800">Valor Total</span>
                                                </div>
                                                <p className="text-2xl font-bold text-blue-900">
                                                    R$ {client.total_spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </p>
                                            </CardContent>
                                        </Card>

                                        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Users className="w-5 h-5 text-green-600" />
                                                    <span className="text-sm font-medium text-green-800">Total de Visitas</span>
                                                </div>
                                                <p className="text-2xl font-bold text-green-900">
                                                    {client.total_visits}
                                                </p>
                                            </CardContent>
                                        </Card>

                                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Target className="w-5 h-5 text-purple-600" />
                                                    <span className="text-sm font-medium text-purple-800">LTV Score</span>
                                                </div>
                                                <p className="text-2xl font-bold text-purple-900">
                                                    {client.ltv_score || 0}
                                                </p>
                                            </CardContent>
                                        </Card>

                                        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Clock className="w-5 h-5 text-amber-600" />
                                                    <span className="text-sm font-medium text-amber-800">Última Visita</span>
                                                </div>
                                                <p className="text-sm font-bold text-amber-900">
                                                    {client.last_visit
                                                        ? format(new Date(client.last_visit), 'dd/MM/yyyy', { locale: ptBR })
                                                        : 'Nunca'
                                                    }
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <Card className="mt-6">
                                        <CardContent className="p-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-slate-700">Cliente desde:</span>
                                                    <span className="text-slate-600">
                                                        {format(new Date(client.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-slate-700">Primeira visita:</span>
                                                    <span className="text-slate-600">
                                                        {client.first_visit
                                                            ? format(new Date(client.first_visit), 'dd/MM/yyyy', { locale: ptBR })
                                                            : 'Não registrada'
                                                        }
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-slate-700">Ticket médio:</span>
                                                    <span className="text-slate-600">
                                                        R$ {client.total_visits > 0
                                                        ? (client.total_spent / client.total_visits).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                                                        : '0,00'
                                                    }
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-slate-700">Status de atividade:</span>
                                                    <Badge
                                                        variant={client.status === 'active' ? 'default' : 'secondary'}
                                                        className="text-xs"
                                                    >
                                                        {client.status === 'active' ? 'Ativo' :
                                                            client.status === 'inactive' ? 'Inativo' : 'Bloqueado'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </FormStep>
                            )}
                        </form>

                        {/* Step Navigation */}
                        <div className="flex justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                                disabled={currentStep === 0}
                            >
                                Anterior
                            </Button>

                            <div className="flex gap-2">
                                {currentStep < (client && showAdvancedStats ? 3 : 2) ? (
                                    <Button
                                        type="button"
                                        onClick={() => setCurrentStep(Math.min(client && showAdvancedStats ? 3 : 2, currentStep + 1))}
                                    >
                                        Próximo
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={() => handleSave()}
                                        disabled={loading || !formData.name.trim()}
                                        className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                                    >
                                        {loading ? (
                                            <div className="flex items-center gap-2">
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Salvando...
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Save className="w-4 h-4" />
                                                {client ? 'Atualizar' : 'Salvar'} Cliente
                                            </div>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="border-t pt-4">
                        <div className="flex flex-1 justify-between items-center">
                            <div className="flex gap-2">
                                {client && onDelete && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                onClick={() => setShowDeleteConfirm(true)}
                                                disabled={loading}
                                                size="sm"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Excluir
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Excluir cliente permanentemente</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    disabled={loading}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </DialogFooter>

                    {/* Delete Confirmation Modal */}
                    {showDeleteConfirm && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <Card className="w-96">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-red-600">
                                        <AlertTriangle className="w-5 h-5" />
                                        Confirmar Exclusão
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-600 mb-4">
                                        Tem certeza que deseja excluir o cliente <strong>{client?.name}</strong>?
                                        Esta ação não pode ser desfeita.
                                    </p>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowDeleteConfirm(false)}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={() => {
                                                onDelete?.()
                                                setShowDeleteConfirm(false)
                                            }}
                                        >
                                            Confirmar Exclusão
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    )
}

export default ClientModal