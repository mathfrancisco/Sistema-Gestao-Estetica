'use client'

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    Users,
    User,
    Mail,
    Phone,
    Calendar,
    MapPin,
    Save,
    ArrowLeft,
    CheckCircle,
    AlertCircle,
    Crown,
    UserPlus,
    Target,
    Sparkles,
    Brain,
    Zap,
    ArrowRight,
    RefreshCw,
    Eye,
    EyeOff,
    Shield,
    Lightbulb,
    Star,
    TrendingUp,
    Loader2,
    FileText,
    CreditCard,
    Home,
    Keyboard
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Database } from '@/lib/database/supabase/types'
import { useCreateClient } from "@/lib/hooks/useClients"
import { useAuthStore } from '@/store/useAuthStore'
import { Sidebar } from '@/components/layout/sidebar'
import { cn } from '@/lib/utils/utils'

type ClientInsert = Database['public']['Tables']['clients']['Insert']
type ClientStatus = Database['public']['Enums']['client_status_enum']
type ClientSegment = Database['public']['Enums']['client_segment_enum']

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

interface FormStep {
    id: string
    title: string
    description: string
    icon: React.ElementType
    fields: string[]
    optional?: boolean
}

interface FieldValidation {
    field: string
    isValid: boolean
    message?: string
    suggestion?: string
}

const NewClientPage: React.FC = () => {
    const router = useRouter()
    const { mutate: createClient, isPending } = useCreateClient()
    const { user } = useAuthStore()

    // Estados principais
    const [currentStep, setCurrentStep] = useState(0)
    const [completedSteps, setCompletedSteps] = useState<number[]>([])
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [validationState, setValidationState] = useState<FieldValidation[]>([])
    const [isDirty, setIsDirty] = useState(false)
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [showPreview, setShowPreview] = useState(false)
    const [keyboardNavigation, setKeyboardNavigation] = useState(false)

    // Referencias para navegação
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()
    const formRefs = useRef<{ [key: string]: HTMLInputElement | HTMLTextAreaElement }>({})

    const [formData, setFormData] = useState<FormData>({
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

    // Configuração dos steps
    const formSteps: FormStep[] = useMemo(() => [
        {
            id: 'basic',
            title: 'Dados Básicos',
            description: 'Informações essenciais do cliente',
            icon: User,
            fields: ['name', 'email', 'phone', 'cpf', 'birthday']
        },
        {
            id: 'address',
            title: 'Endereço',
            description: 'Localização e contato',
            icon: MapPin,
            fields: ['address.street', 'address.number', 'address.city', 'address.state'],
            optional: true
        },
        {
            id: 'preferences',
            title: 'Preferências',
            description: 'Segmentação e observações',
            icon: Target,
            fields: ['segment', 'preferences', 'observations'],
            optional: true
        }
    ], [])

    // Auto-save functionality
    useEffect(() => {
        if (autoSaveEnabled && isDirty && !isPending) {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current)
            }

            autoSaveTimeoutRef.current = setTimeout(() => {
                const isFormValid = validationState.every(v => v.isValid) && formData.name.trim()
                if (isFormValid) {
                    // Simular auto-save local
                    localStorage.setItem('newClientDraft', JSON.stringify(formData))
                    setLastSaved(new Date())
                    toast.success('Rascunho salvo automaticamente', { duration: 2000 })
                }
            }, 3000)
        }

        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current)
            }
        }
    }, [formData, isDirty, autoSaveEnabled, isPending, validationState])

    // Carregar rascunho salvo
    useEffect(() => {
        const savedDraft = localStorage.getItem('newClientDraft')
        if (savedDraft) {
            try {
                const parsedData = JSON.parse(savedDraft)
                if (parsedData.name) {
                    toast.info('Rascunho encontrado! Dados restaurados.')
                    setFormData(parsedData)
                    setIsDirty(true)
                }
            } catch (error) {
                console.error('Erro ao carregar rascunho:', error)
            }
        }
    }, [])

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault()
                        if (currentStep === formSteps.length - 1) {
                            handleSubmit()
                        } else {
                            handleNext()
                        }
                        break
                    case 'ArrowRight':
                        e.preventDefault()
                        handleNext()
                        break
                    case 'ArrowLeft':
                        e.preventDefault()
                        handleBack()
                        break
                    case 'p':
                        e.preventDefault()
                        setShowPreview(!showPreview)
                        break
                }
            }

            // Tab navigation within steps
            if (e.key === 'Tab') {
                setKeyboardNavigation(true)
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [currentStep, formSteps.length, showPreview])

    // Real-time validation
    const validateField = useCallback((field: string, value: any): FieldValidation => {
        switch (field) {
            case 'name':
                const nameValid = value.trim().length >= 2
                return {
                    field,
                    isValid: nameValid,
                    message: !nameValid ? 'Nome deve ter pelo menos 2 caracteres' : undefined,
                    suggestion: !nameValid ? 'Digite o nome completo do cliente' : undefined
                }
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                const emailValid = !value || emailRegex.test(value)
                return {
                    field,
                    isValid: emailValid,
                    message: !emailValid ? 'Email inválido' : undefined,
                    suggestion: !emailValid ? 'Formato: exemplo@dominio.com' : undefined
                }
            case 'phone':
                const phoneNumbers = value.replace(/\D/g, '')
                const phoneValid = !value || phoneNumbers.length >= 10
                return {
                    field,
                    isValid: phoneValid,
                    message: !phoneValid ? 'Telefone deve ter pelo menos 10 dígitos' : undefined,
                    suggestion: !phoneValid ? 'Formato: (11) 99999-9999' : undefined
                }
            case 'cpf':
                const cpfNumbers = value.replace(/\D/g, '')
                const cpfValid = !value || cpfNumbers.length === 11
                return {
                    field,
                    isValid: cpfValid,
                    message: !cpfValid ? 'CPF deve ter 11 dígitos' : undefined,
                    suggestion: !cpfValid ? 'Formato: 000.000.000-00' : undefined
                }
            default:
                return { field, isValid: true }
        }
    }, [])

    // Form completion progress
    const completionProgress = useMemo(() => {
        const requiredFields = ['name']
        const optionalFields = ['email', 'phone', 'cpf', 'birthday', 'address.city', 'segment']

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

    // Validation for current step
    const validateStep = useCallback((step: number): boolean => {
        const newErrors: Record<string, string> = {}
        const stepConfig = formSteps[step]

        if (stepConfig.optional) return true

        stepConfig.fields.forEach(field => {
            if (field.includes('.')) {
                const [parent, child] = field.split('.')
                const value = (formData as any)[parent][child]
                if (!value && (field === 'address.street' || field === 'address.city')) {
                    newErrors[field] = 'Campo obrigatório'
                }
            } else {
                const value = (formData as any)[field]
                if (!value && field === 'name') {
                    newErrors[field] = 'Nome é obrigatório'
                }

                const validation = validateField(field, value)
                if (!validation.isValid && validation.message) {
                    newErrors[field] = validation.message
                }
            }
        })

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }, [formSteps, formData, validateField])

    // Navigation handlers
    const handleNext = useCallback(() => {
        if (validateStep(currentStep)) {
            setCompletedSteps(prev => [...new Set([...prev, currentStep])])
            if (currentStep < formSteps.length - 1) {
                setCurrentStep(currentStep + 1)
            } else {
                handleSubmit()
            }
        } else {
            toast.error('Preencha os campos obrigatórios antes de continuar')
        }
    }, [currentStep, formSteps.length, validateStep])

    const handleBack = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }, [currentStep])

    // Input handlers
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
                [field]: ''
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

        const errorKey = `address.${field}`
        if (errors[errorKey]) {
            setErrors(prev => ({
                ...prev,
                [errorKey]: ''
            }))
        }
    }, [errors])

    // Submit handler
    const handleSubmit = useCallback(async () => {
        if (!user) {
            toast.error('Usuário não autenticado. Faça login novamente.')
            router.push('/login')
            return
        }

        try {
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
                user_id: user.id,
                total_spent: 0,
                total_visits: 0
            }

            createClient(submitData, {
                onSuccess: (newClient) => {
                    localStorage.removeItem('newClientDraft')
                    toast.success('Cliente cadastrado com sucesso!')
                    router.push('/clientes')
                },
                onError: (error) => {
                    toast.error(`Erro ao cadastrar cliente: ${error.message}`)
                }
            })
        } catch (error) {
            toast.error('Erro ao processar dados')
        }
    }, [formData, user, createClient, router])

    // Utility functions
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
            vip: { label: 'VIP', color: 'bg-amber-100 text-amber-800', icon: Crown },
            regular: { label: 'Regular', color: 'bg-blue-100 text-blue-800', icon: Users },
            new: { label: 'Novo', color: 'bg-green-100 text-green-800', icon: UserPlus },
            at_risk: { label: 'Em Risco', color: 'bg-red-100 text-red-800', icon: AlertCircle },
            lost: { label: 'Perdido', color: 'bg-gray-100 text-gray-800', icon: Target }
        }

        return segment ? segmentConfig[segment] : null
    }, [])

    const getFieldValidation = useCallback((field: string) => {
        return validationState.find(v => v.field === field)
    }, [validationState])

    const currentStepConfig = formSteps[currentStep]
    const progress = ((currentStep + 1) / formSteps.length) * 100

    // Smart suggestions
    const smartSuggestions = useMemo(() => {
        const suggestions = []

        if (formData.name && !formData.email) {
            suggestions.push({
                icon: Mail,
                title: 'Adicionar Email',
                description: 'Facilita o envio de campanhas e confirmações',
                action: () => formRefs.current['email']?.focus()
            })
        }

        if (formData.name && !formData.phone) {
            suggestions.push({
                icon: Phone,
                title: 'Adicionar Telefone',
                description: 'Essencial para WhatsApp e lembretes',
                action: () => formRefs.current['phone']?.focus()
            })
        }

        if (currentStep === 2 && !formData.segment) {
            suggestions.push({
                icon: Brain,
                title: 'Definir Segmento',
                description: 'Ajuda na personalização do atendimento',
                action: () => handleInputChange('segment', 'new')
            })
        }

        return suggestions
    }, [formData, currentStep, handleInputChange])

    if (!user) {
        router.push('/login')
        return null
    }

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <Sidebar />

                <div className="lg:ml-64">
                    {/* Header */}
                    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
                        <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <Link href="/clientes">
                                            <Button variant="ghost" size="sm" className="p-2 hover:bg-slate-100 rounded-xl">
                                                <ArrowLeft className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/25">
                                            <UserPlus className="w-4 h-4 text-white" />
                                        </div>
                                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                            Novo Cliente
                                        </h1>
                                        {isPending && (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin text-green-500" />
                                                <span className="text-sm text-green-600">Salvando...</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-slate-600 text-xs sm:text-sm font-medium ml-12">
                                        Cadastro inteligente com auto-save e validação em tempo real
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-3">
                                    <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg shadow-emerald-500/25 text-xs">
                                        <Brain className="w-3 h-3 mr-1" />
                                        IA Assistente
                                    </Badge>

                                    <div className="flex items-center gap-1">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                                                    className={cn(
                                                        "p-2 rounded-xl transition-colors",
                                                        autoSaveEnabled ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-600"
                                                    )}
                                                >
                                                    <Save className="w-4 h-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{autoSaveEnabled ? 'Auto-save ativo' : 'Auto-save desativado'}</p>
                                            </TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setShowPreview(!showPreview)}
                                                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                                                >
                                                    {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Preview do cliente (Ctrl+P)</p>
                                            </TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                                                >
                                                    <Keyboard className="w-4 h-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Navegação: ←→ | Salvar: Ctrl+S</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Content */}
                    <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                        <div className="max-w-6xl mx-auto">
                            <div className={cn(
                                "grid gap-6",
                                showPreview ? "lg:grid-cols-3" : "lg:grid-cols-1"
                            )}>

                                {/* Main Form */}
                                <div className={cn(showPreview ? "lg:col-span-2" : "lg:col-span-1")}>
                                    <div className="space-y-6">

                                        {/* Progress Header */}
                                        <Card className="border-0 shadow-lg overflow-hidden">
                                            <CardContent className="p-6">
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <span className="text-sm font-medium text-slate-600">
                                                                Etapa {currentStep + 1} de {formSteps.length}
                                                            </span>
                                                            {lastSaved && (
                                                                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                                                    <CheckCircle className="w-3 h-3" />
                                                                    Salvo {format(lastSaved, 'HH:mm')}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-sm font-medium text-slate-600">
                                                                {completionProgress}% concluído
                                                            </span>
                                                            <div className="flex items-center gap-1 mt-1">
                                                                <Star className="w-3 h-3 text-amber-500" />
                                                                <span className="text-xs text-slate-500">
                                                                    {completionProgress > 80 ? 'Excelente!' :
                                                                        completionProgress > 50 ? 'Bom progresso' : 'Continue!'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Progress value={progress} className="h-3" />
                                                    <div className="flex justify-between">
                                                        {formSteps.map((step, index) => (
                                                            <div
                                                                key={step.id}
                                                                className={cn(
                                                                    "flex items-center gap-2 transition-all duration-300",
                                                                    index <= currentStep ? 'text-green-600' : 'text-slate-400',
                                                                    index === currentStep && 'scale-110'
                                                                )}
                                                            >
                                                                <div className={cn(
                                                                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                                                                    completedSteps.includes(index)
                                                                        ? 'bg-green-100 text-green-600 shadow-lg shadow-green-500/25'
                                                                        : index === currentStep
                                                                            ? 'bg-blue-100 text-blue-600 shadow-lg shadow-blue-500/25'
                                                                            : 'bg-slate-100 text-slate-400'
                                                                )}>
                                                                    {completedSteps.includes(index) ? (
                                                                        <CheckCircle className="w-4 h-4" />
                                                                    ) : (
                                                                        <step.icon className="w-4 h-4" />
                                                                    )}
                                                                </div>
                                                                <span className="text-sm font-medium hidden sm:block">
                                                                    {step.title}
                                                                </span>
                                                                {step.optional && (
                                                                    <Badge variant="secondary" className="text-xs hidden sm:block">
                                                                        Opcional
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Smart Suggestions */}
                                        {smartSuggestions.length > 0 && (
                                            <Alert className="border-l-4 border-l-blue-500 bg-blue-50/50">
                                                <Lightbulb className="h-4 w-4" />
                                                <AlertDescription>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="font-medium">Sugestões Inteligentes</div>
                                                            <div className="text-sm text-slate-600">
                                                                {smartSuggestions[0].description}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={smartSuggestions[0].action}
                                                        >
                                                            {smartSuggestions[0].title}
                                                        </Button>
                                                    </div>
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        {/* Form Step Content */}
                                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                                <CardTitle className="flex items-center gap-2">
                                                    <currentStepConfig.icon className="w-5 h-5 text-green-500" />
                                                    {currentStepConfig.title}
                                                    {currentStepConfig.optional && (
                                                        <Badge variant="secondary">Opcional</Badge>
                                                    )}
                                                </CardTitle>
                                                <p className="text-slate-600 text-sm">{currentStepConfig.description}</p>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                <form className="space-y-6">
                                                    {/* Step 1: Dados Básicos */}
                                                    {currentStep === 0 && (
                                                        <div className="space-y-6">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                {/* Nome */}
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="name" className="flex items-center gap-1">
                                                                        <User className="w-4 h-4" />
                                                                        Nome Completo *
                                                                    </Label>
                                                                    <Input
                                                                        id="name"
                                                                        ref={(el) => el && (formRefs.current['name'] = el)}
                                                                        value={formData.name}
                                                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                                                        placeholder="Digite o nome completo"
                                                                        className={cn(
                                                                            "transition-all duration-200",
                                                                            errors.name ? 'border-red-500 focus:border-red-500' :
                                                                                getFieldValidation('name')?.isValid ? 'border-green-500 focus:border-green-500' :
                                                                                    'border-slate-200 focus:border-green-500 focus:ring-green-500/20'
                                                                        )}
                                                                        autoFocus
                                                                    />
                                                                    {getFieldValidation('name')?.isValid && formData.name && (
                                                                        <p className="text-sm text-green-600 flex items-center gap-1">
                                                                            <CheckCircle className="w-3 h-3" />
                                                                            Nome válido
                                                                        </p>
                                                                    )}
                                                                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                                                </div>

                                                                {/* CPF */}
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="cpf" className="flex items-center gap-1">
                                                                        <CreditCard className="w-4 h-4" />
                                                                        CPF
                                                                    </Label>
                                                                    <Input
                                                                        id="cpf"
                                                                        ref={(el) => el && (formRefs.current['cpf'] = el)}
                                                                        value={formData.cpf}
                                                                        onChange={(e) => handleInputChange('cpf', formatCPF(e.target.value))}
                                                                        placeholder="000.000.000-00"
                                                                        maxLength={14}
                                                                        className={cn(
                                                                            "transition-all duration-200",
                                                                            errors.cpf ? 'border-red-500' :
                                                                                getFieldValidation('cpf')?.isValid && formData.cpf ? 'border-green-500' :
                                                                                    'border-slate-200 focus:border-green-500 focus:ring-green-500/20'
                                                                        )}
                                                                    />
                                                                    {errors.cpf && <p className="text-sm text-red-500">{errors.cpf}</p>}
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                {/* Email */}
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="email" className="flex items-center gap-1">
                                                                        <Mail className="w-4 h-4" />
                                                                        Email
                                                                    </Label>
                                                                    <Input
                                                                        id="email"
                                                                        ref={(el) => el && (formRefs.current['email'] = el)}
                                                                        type="email"
                                                                        value={formData.email}
                                                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                                                        placeholder="email@exemplo.com"
                                                                        className={cn(
                                                                            "transition-all duration-200",
                                                                            errors.email ? 'border-red-500' :
                                                                                getFieldValidation('email')?.isValid && formData.email ? 'border-green-500' :
                                                                                    'border-slate-200 focus:border-green-500 focus:ring-green-500/20'
                                                                        )}
                                                                    />
                                                                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                                                                </div>

                                                                {/* Telefone */}
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="phone" className="flex items-center gap-1">
                                                                        <Phone className="w-4 h-4" />
                                                                        Telefone
                                                                    </Label>
                                                                    <Input
                                                                        id="phone"
                                                                        ref={(el) => el && (formRefs.current['phone'] = el)}
                                                                        value={formData.phone}
                                                                        onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
                                                                        placeholder="(00) 00000-0000"
                                                                        className={cn(
                                                                            "transition-all duration-200",
                                                                            errors.phone ? 'border-red-500' :
                                                                                getFieldValidation('phone')?.isValid && formData.phone ? 'border-green-500' :
                                                                                    'border-slate-200 focus:border-green-500 focus:ring-green-500/20'
                                                                        )}
                                                                    />
                                                                    {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                {/* Data de Nascimento */}
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="birthday" className="flex items-center gap-1">
                                                                        <Calendar className="w-4 h-4" />
                                                                        Data de Nascimento
                                                                    </Label>
                                                                    <Input
                                                                        id="birthday"
                                                                        type="date"
                                                                        value={formData.birthday}
                                                                        onChange={(e) => handleInputChange('birthday', e.target.value)}
                                                                        className="border-slate-200 focus:border-green-500 focus:ring-green-500/20"
                                                                    />
                                                                </div>

                                                                {/* Status */}
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="status" className="flex items-center gap-1">
                                                                        <Shield className="w-4 h-4" />
                                                                        Status
                                                                    </Label>
                                                                    <Select value={formData.status} onValueChange={(value: ClientStatus) => handleInputChange('status', value)}>
                                                                        <SelectTrigger className="border-slate-200 focus:border-green-500 focus:ring-green-500/20">
                                                                            <SelectValue />
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
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Step 2: Endereço */}
                                                    {currentStep === 1 && (
                                                        <div className="space-y-6">
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                <div className="md:col-span-2 space-y-2">
                                                                    <Label htmlFor="street" className="flex items-center gap-1">
                                                                        <Home className="w-4 h-4" />
                                                                        Rua
                                                                    </Label>
                                                                    <Input
                                                                        id="street"
                                                                        value={formData.address.street}
                                                                        onChange={(e) => handleAddressChange('street', e.target.value)}
                                                                        placeholder="Nome da rua"
                                                                        className="border-slate-200 focus:border-green-500 focus:ring-green-500/20"
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="number">Número</Label>
                                                                    <Input
                                                                        id="number"
                                                                        value={formData.address.number}
                                                                        onChange={(e) => handleAddressChange('number', e.target.value)}
                                                                        placeholder="123"
                                                                        className="border-slate-200 focus:border-green-500 focus:ring-green-500/20"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="complement">Complemento</Label>
                                                                    <Input
                                                                        id="complement"
                                                                        value={formData.address.complement}
                                                                        onChange={(e) => handleAddressChange('complement', e.target.value)}
                                                                        placeholder="Apto, Bloco, etc."
                                                                        className="border-slate-200 focus:border-green-500 focus:ring-green-500/20"
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="neighborhood">Bairro</Label>
                                                                    <Input
                                                                        id="neighborhood"
                                                                        value={formData.address.neighborhood}
                                                                        onChange={(e) => handleAddressChange('neighborhood', e.target.value)}
                                                                        placeholder="Nome do bairro"
                                                                        className="border-slate-200 focus:border-green-500 focus:ring-green-500/20"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="city">Cidade</Label>
                                                                    <Input
                                                                        id="city"
                                                                        value={formData.address.city}
                                                                        onChange={(e) => handleAddressChange('city', e.target.value)}
                                                                        placeholder="Nome da cidade"
                                                                        className="border-slate-200 focus:border-green-500 focus:ring-green-500/20"
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
                                                                        className="border-slate-200 focus:border-green-500 focus:ring-green-500/20"
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="zipCode">CEP</Label>
                                                                    <Input
                                                                        id="zipCode"
                                                                        value={formData.address.zipCode}
                                                                        onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                                                                        placeholder="00000-000"
                                                                        className="border-slate-200 focus:border-green-500 focus:ring-green-500/20"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Step 3: Preferências */}
                                                    {currentStep === 2 && (
                                                        <div className="space-y-6">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="segment" className="flex items-center gap-1">
                                                                    <Target className="w-4 h-4" />
                                                                    Segmento do Cliente
                                                                </Label>
                                                                <Select
                                                                    value={formData.segment || ''}
                                                                    onValueChange={(value: ClientSegment) => handleInputChange('segment', value || null)}
                                                                >
                                                                    <SelectTrigger className="border-slate-200 focus:border-green-500 focus:ring-green-500/20">
                                                                        <SelectValue placeholder="Selecione o segmento" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="new">
                                                                            <div className="flex items-center gap-2">
                                                                                <UserPlus className="w-4 h-4 text-green-500" />
                                                                                Novo Cliente
                                                                            </div>
                                                                        </SelectItem>
                                                                        <SelectItem value="regular">
                                                                            <div className="flex items-center gap-2">
                                                                                <Users className="w-4 h-4 text-blue-500" />
                                                                                Cliente Regular
                                                                            </div>
                                                                        </SelectItem>
                                                                        <SelectItem value="vip">
                                                                            <div className="flex items-center gap-2">
                                                                                <Crown className="w-4 h-4 text-amber-500" />
                                                                                Cliente VIP
                                                                            </div>
                                                                        </SelectItem>
                                                                        <SelectItem value="at_risk">
                                                                            <div className="flex items-center gap-2">
                                                                                <AlertCircle className="w-4 h-4 text-red-500" />
                                                                                Em Risco
                                                                            </div>
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                {formData.segment && (
                                                                    <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                                                                        <Badge className={getSegmentInfo(formData.segment)?.color}>
                                                                            {getSegmentInfo(formData.segment)?.label}
                                                                        </Badge>
                                                                        <p className="text-sm text-slate-600 mt-1">
                                                                            {formData.segment === 'new' && 'Cliente recém-cadastrado, ideal para campanhas de boas-vindas'}
                                                                            {formData.segment === 'regular' && 'Cliente com padrão estável de consumo'}
                                                                            {formData.segment === 'vip' && 'Cliente de alto valor, merece atenção especial'}
                                                                            {formData.segment === 'at_risk' && 'Cliente que necessita estratégias de retenção'}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>

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
                                                                    className="border-slate-200 focus:border-green-500 focus:ring-green-500/20 resize-none"
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
                                                                    className="border-slate-200 focus:border-green-500 focus:ring-green-500/20 resize-none"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </form>
                                            </CardContent>
                                        </Card>

                                        {/* Navigation Actions */}
                                        <Card className="border-0 shadow-lg">
                                            <CardContent className="p-6">
                                                <div className="flex flex-col sm:flex-row justify-between gap-4">
                                                    <div className="flex items-center gap-4">
                                                        {currentStep > 0 && (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={handleBack}
                                                                disabled={isPending}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <ArrowLeft className="w-4 h-4" />
                                                                Voltar
                                                            </Button>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        <Link href="/clientes">
                                                            <Button variant="ghost" disabled={isPending}>
                                                                Cancelar
                                                            </Button>
                                                        </Link>

                                                        <Button
                                                            onClick={handleNext}
                                                            disabled={isPending}
                                                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/25 border-0"
                                                        >
                                                            {isPending ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                    Salvando...
                                                                </div>
                                                            ) : currentStep === formSteps.length - 1 ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Save className="w-4 h-4" />
                                                                    Salvar Cliente
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    Próximo
                                                                    <ArrowRight className="w-4 h-4" />
                                                                </div>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>

                                {/* Preview Panel */}
                                {showPreview && (
                                    <div className="lg:col-span-1">
                                        <div className="sticky top-32">
                                            <Card className="border-0 shadow-xl shadow-slate-200/60">
                                                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
                                                    <CardTitle className="flex items-center gap-2 text-green-800">
                                                        <Eye className="w-5 h-5" />
                                                        Preview do Cliente
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-6">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                                                <User className="w-6 h-6 text-white" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-semibold text-green-900">
                                                                    {formData.name || 'Nome do Cliente'}
                                                                </h3>
                                                                <p className="text-sm text-green-700">
                                                                    {formData.email || 'email@exemplo.com'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-3 text-sm">
                                                            <div className="flex justify-between items-center">
                                                                <span className="font-medium text-green-800">Telefone:</span>
                                                                <span className="text-green-700">
                                                                    {formData.phone || 'Não informado'}
                                                                </span>
                                                            </div>

                                                            <div className="flex justify-between items-center">
                                                                <span className="font-medium text-green-800">CPF:</span>
                                                                <span className="text-green-700">
                                                                    {formData.cpf || 'Não informado'}
                                                                </span>
                                                            </div>

                                                            <div className="flex justify-between items-center">
                                                                <span className="font-medium text-green-800">Segmento:</span>
                                                                <span>
                                                                    {formData.segment ? (
                                                                        <Badge className={getSegmentInfo(formData.segment)?.color}>
                                                                            {getSegmentInfo(formData.segment)?.label}
                                                                        </Badge>
                                                                    ) : (
                                                                        <span className="text-green-700">Não definido</span>
                                                                    )}
                                                                </span>
                                                            </div>

                                                            <div className="flex justify-between items-center">
                                                                <span className="font-medium text-green-800">Cidade:</span>
                                                                <span className="text-green-700">
                                                                    {formData.address.city || 'Não informada'}
                                                                </span>
                                                            </div>

                                                            <div className="flex justify-between items-center">
                                                                <span className="font-medium text-green-800">Status:</span>
                                                                <Badge className="bg-green-100 text-green-800">
                                                                    {formData.status === 'active' ? 'Ativo' :
                                                                        formData.status === 'inactive' ? 'Inativo' : 'Bloqueado'}
                                                                </Badge>
                                                            </div>
                                                        </div>

                                                        {/* Completion Score */}
                                                        <div className="pt-4 border-t border-green-200">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-sm font-medium text-green-800">Completude</span>
                                                                <span className="text-sm text-green-600">{completionProgress}%</span>
                                                            </div>
                                                            <Progress value={completionProgress} className="h-2" />
                                                            <p className="text-xs text-green-600 mt-1">
                                                                {completionProgress === 100 ? 'Perfil completo!' :
                                                                    completionProgress > 70 ? 'Quase lá!' :
                                                                        'Continue preenchendo...'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Smart Tips */}
                            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 mt-8">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Zap className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-blue-900 mb-2">Dicas para um Cadastro Eficiente</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                                                <div className="space-y-1">
                                                    <p>• Use Ctrl+S para salvar rapidamente</p>
                                                    <p>• Navegue com ← → entre etapas</p>
                                                    <p>• Auto-save protege seu progresso</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p>• Segmentação ajuda no marketing</p>
                                                    <p>• Email e telefone são essenciais</p>
                                                    <p>• Preview mostra resultado final</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </main>
                </div>
            </div>
        </TooltipProvider>
    )
}

export default NewClientPage