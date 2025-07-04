'use client'

import React, { useState } from 'react'
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
    Zap, ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Database } from '@/lib/database/supabase/types'
import { useCreateClient } from "@/lib/hooks/useClients"
import { useAuthStore } from '@/store/useAuthStore' // Importar o store de autenticação
import { Sidebar } from '@/components/layout/sidebar'

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
}

const NewClientPage: React.FC = () => {
    const router = useRouter()
    const { mutate: createClient, isPending } = useCreateClient()

    // Obter dados do usuário logado
    const { user } = useAuthStore()

    const [currentStep, setCurrentStep] = useState(0)
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

    const [errors, setErrors] = useState<Record<string, string>>({})

    const formSteps: FormStep[] = [
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
            fields: ['address.street', 'address.number', 'address.city', 'address.state']
        },
        {
            id: 'preferences',
            title: 'Preferências',
            description: 'Segmentação e observações',
            icon: Target,
            fields: ['segment', 'preferences', 'observations']
        }
    ]

    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {}
        const stepConfig = formSteps[step]

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
                if (field === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    newErrors[field] = 'Email inválido'
                }
                if (field === 'phone' && value && !/^[\d\s\(\)\-\+]+$/.test(value)) {
                    newErrors[field] = 'Telefone inválido'
                }
            }
        })

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNext = () => {
        if (validateStep(currentStep)) {
            if (currentStep < formSteps.length - 1) {
                setCurrentStep(currentStep + 1)
            } else {
                handleSubmit()
            }
        }
    }

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    const handleInputChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))

        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }))
        }
    }

    const handleAddressChange = (field: keyof FormData['address'], value: string) => {
        setFormData(prev => ({
            ...prev,
            address: {
                ...prev.address,
                [field]: value
            }
        }))

        const errorKey = `address.${field}`
        if (errors[errorKey]) {
            setErrors(prev => ({
                ...prev,
                [errorKey]: ''
            }))
        }
    }

    const handleSubmit = async () => {
        console.log('🔄 Iniciando criação do cliente...')

        // Verificar se o usuário está logado
        if (!user) {
            console.error('❌ Usuário não autenticado')
            toast.error('Usuário não autenticado. Faça login novamente.')
            router.push('/login')
            return
        }

        console.log('✅ Usuário autenticado:', {
            userId: user.id,
            email: user.email
        })

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

            console.log('📝 Dados a serem enviados:', submitData)
            console.log('🕐 Iniciando mutation...')

            createClient(submitData, {
                onSuccess: (newClient) => {
                    console.log('✅ Cliente criado com sucesso:', newClient)
                    toast.success('Cliente cadastrado com sucesso!')
                    router.push('/clientes')
                },
                onError: (error) => {
                    console.error('❌ Erro detalhado na criação:', {
                        error,
                        message: error.message,
                        stack: error.stack,
                        userData: submitData
                    })
                    toast.error(`Erro ao cadastrar cliente: ${error.message}`)
                }
            })
        } catch (error) {
            console.error('❌ Erro no processamento dos dados:', error)
            toast.error('Erro ao processar dados')
        }
    }

    const formatCPF = (value: string) => {
        const numbers = value.replace(/\D/g, '')
        return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }

    const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, '')
        if (numbers.length <= 10) {
            return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
        }
        return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }

    const getSegmentInfo = (segment: ClientSegment | null) => {
        const segmentConfig = {
            vip: { label: 'VIP', color: 'bg-amber-100 text-amber-800', icon: Crown },
            regular: { label: 'Regular', color: 'bg-blue-100 text-blue-800', icon: Users },
            new: { label: 'Novo', color: 'bg-green-100 text-green-800', icon: UserPlus },
            at_risk: { label: 'Em Risco', color: 'bg-red-100 text-red-800', icon: AlertCircle },
            lost: { label: 'Perdido', color: 'bg-gray-100 text-gray-800', icon: Target }
        }

        return segment ? segmentConfig[segment] : null
    }

    const progress = ((currentStep + 1) / formSteps.length) * 100
    const currentStepConfig = formSteps[currentStep]

    // Se o usuário não estiver logado, redirecionar
    if (!user) {
        router.push('/login')
        return null
    }

    return (
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
                                        <Button variant="ghost" size="sm" className="p-2">
                                            <ArrowLeft className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                        <UserPlus className="w-4 h-4 text-white" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                        Novo Cliente
                                    </h1>
                                </div>
                                <p className="text-slate-600 text-xs sm:text-sm font-medium ml-12">
                                    Cadastre um novo cliente no sistema
                                </p>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3">
                                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg shadow-emerald-500/25 text-xs">
                                    <Brain className="w-3 h-3 mr-1" />
                                    Cadastro Inteligente
                                </Badge>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="max-w-4xl mx-auto space-y-6">

                        {/* Progress */}
                        <Card className="border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-slate-600">
                                            Etapa {currentStep + 1} de {formSteps.length}
                                        </span>
                                        <span className="text-sm font-medium text-slate-600">
                                            {progress.toFixed(0)}% concluído
                                        </span>
                                    </div>
                                    <Progress value={progress} className="h-2" />
                                    <div className="flex justify-between">
                                        {formSteps.map((step, index) => (
                                            <div
                                                key={step.id}
                                                className={`flex items-center gap-2 ${
                                                    index <= currentStep ? 'text-green-600' : 'text-slate-400'
                                                }`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                    index < currentStep
                                                        ? 'bg-green-100 text-green-600'
                                                        : index === currentStep
                                                            ? 'bg-blue-100 text-blue-600'
                                                            : 'bg-slate-100 text-slate-400'
                                                }`}>
                                                    {index < currentStep ? (
                                                        <CheckCircle className="w-4 h-4" />
                                                    ) : (
                                                        <step.icon className="w-4 h-4" />
                                                    )}
                                                </div>
                                                <span className="text-sm font-medium hidden sm:block">
                                                    {step.title}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Form Content */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                <CardTitle className="flex items-center gap-2">
                                    <currentStepConfig.icon className="w-5 h-5 text-green-500" />
                                    {currentStepConfig.title}
                                </CardTitle>
                                <p className="text-slate-600 text-sm">{currentStepConfig.description}</p>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form className="space-y-6">
                                    {/* Step 1: Dados Básicos */}
                                    {currentStep === 0 && (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name">Nome Completo *</Label>
                                                    <Input
                                                        id="name"
                                                        value={formData.name}
                                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                                        placeholder="Digite o nome completo"
                                                        className={errors.name ? 'border-red-500' : 'border-slate-200 focus:border-green-500 focus:ring-green-500/20'}
                                                    />
                                                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="cpf">CPF</Label>
                                                    <Input
                                                        id="cpf"
                                                        value={formData.cpf}
                                                        onChange={(e) => handleInputChange('cpf', formatCPF(e.target.value))}
                                                        placeholder="000.000.000-00"
                                                        maxLength={14}
                                                        className={errors.cpf ? 'border-red-500' : 'border-slate-200 focus:border-green-500 focus:ring-green-500/20'}
                                                    />
                                                    {errors.cpf && <p className="text-sm text-red-500">{errors.cpf}</p>}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label htmlFor="email">Email</Label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                        <Input
                                                            id="email"
                                                            type="email"
                                                            value={formData.email}
                                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                                            placeholder="email@exemplo.com"
                                                            className={`pl-10 ${errors.email ? 'border-red-500' : 'border-slate-200 focus:border-green-500 focus:ring-green-500/20'}`}
                                                        />
                                                    </div>
                                                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="phone">Telefone</Label>
                                                    <div className="relative">
                                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                        <Input
                                                            id="phone"
                                                            value={formData.phone}
                                                            onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
                                                            placeholder="(00) 00000-0000"
                                                            className={`pl-10 ${errors.phone ? 'border-red-500' : 'border-slate-200 focus:border-green-500 focus:ring-green-500/20'}`}
                                                        />
                                                    </div>
                                                    {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label htmlFor="birthday">Data de Nascimento</Label>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                        <Input
                                                            id="birthday"
                                                            type="date"
                                                            value={formData.birthday}
                                                            onChange={(e) => handleInputChange('birthday', e.target.value)}
                                                            className="pl-10 border-slate-200 focus:border-green-500 focus:ring-green-500/20"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="status">Status</Label>
                                                    <Select value={formData.status} onValueChange={(value: ClientStatus) => handleInputChange('status', value)}>
                                                        <SelectTrigger className="border-slate-200 focus:border-green-500 focus:ring-green-500/20">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="active">Ativo</SelectItem>
                                                            <SelectItem value="inactive">Inativo</SelectItem>
                                                            <SelectItem value="blocked">Bloqueado</SelectItem>
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
                                                    <Label htmlFor="street">Rua *</Label>
                                                    <Input
                                                        id="street"
                                                        value={formData.address.street}
                                                        onChange={(e) => handleAddressChange('street', e.target.value)}
                                                        placeholder="Nome da rua"
                                                        className={errors['address.street'] ? 'border-red-500' : 'border-slate-200 focus:border-green-500 focus:ring-green-500/20'}
                                                    />
                                                    {errors['address.street'] && <p className="text-sm text-red-500">{errors['address.street']}</p>}
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
                                                    <Label htmlFor="city">Cidade *</Label>
                                                    <Input
                                                        id="city"
                                                        value={formData.address.city}
                                                        onChange={(e) => handleAddressChange('city', e.target.value)}
                                                        placeholder="Nome da cidade"
                                                        className={errors['address.city'] ? 'border-red-500' : 'border-slate-200 focus:border-green-500 focus:ring-green-500/20'}
                                                    />
                                                    {errors['address.city'] && <p className="text-sm text-red-500">{errors['address.city']}</p>}
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
                                                <Label htmlFor="segment">Segmento do Cliente</Label>
                                                <Select
                                                    value={formData.segment || ''}
                                                    onValueChange={(value: ClientSegment) => handleInputChange('segment', value || null)}
                                                >
                                                    <SelectTrigger className="border-slate-200 focus:border-green-500 focus:ring-green-500/20">
                                                        <SelectValue placeholder="Selecione o segmento" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="new">Novo Cliente</SelectItem>
                                                        <SelectItem value="regular">Cliente Regular</SelectItem>
                                                        <SelectItem value="vip">Cliente VIP</SelectItem>
                                                        <SelectItem value="at_risk">Em Risco</SelectItem>
                                                        <SelectItem value="lost">Cliente Perdido</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {formData.segment && (
                                                    <div className="mt-2">
                                                        <Badge className={getSegmentInfo(formData.segment)?.color}>
                                                            {getSegmentInfo(formData.segment)?.label}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="preferences">Preferências</Label>
                                                <Textarea
                                                    id="preferences"
                                                    value={formData.preferences}
                                                    onChange={(e) => handleInputChange('preferences', e.target.value)}
                                                    placeholder="Preferências do cliente (horários, procedimentos, etc.)"
                                                    rows={4}
                                                    className="border-slate-200 focus:border-green-500 focus:ring-green-500/20"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="observations">Observações</Label>
                                                <Textarea
                                                    id="observations"
                                                    value={formData.observations}
                                                    onChange={(e) => handleInputChange('observations', e.target.value)}
                                                    placeholder="Observações importantes sobre o cliente"
                                                    rows={4}
                                                    className="border-slate-200 focus:border-green-500 focus:ring-green-500/20"
                                                />
                                            </div>

                                            {/* Preview do Cliente */}
                                            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                                                <CardHeader>
                                                    <CardTitle className="flex items-center gap-2 text-green-800">
                                                        <Sparkles className="w-5 h-5" />
                                                        Preview do Cliente
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
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

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                            <div>
                                                                <span className="font-medium text-green-800">Telefone:</span>
                                                                <span className="ml-2 text-green-700">
                                                                    {formData.phone || 'Não informado'}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-green-800">Segmento:</span>
                                                                <span className="ml-2">
                                                                    {formData.segment ? (
                                                                        <Badge className={getSegmentInfo(formData.segment)?.color}>
                                                                            {getSegmentInfo(formData.segment)?.label}
                                                                        </Badge>
                                                                    ) : (
                                                                        <span className="text-green-700">Não definido</span>
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-green-800">Cidade:</span>
                                                                <span className="ml-2 text-green-700">
                                                                    {formData.address.city || 'Não informada'}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-green-800">Status:</span>
                                                                <span className="ml-2">
                                                                    <Badge className="bg-green-100 text-green-800">
                                                                        {formData.status === 'active' ? 'Ativo' :
                                                                            formData.status === 'inactive' ? 'Inativo' : 'Bloqueado'}
                                                                    </Badge>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    )}
                                </form>
                            </CardContent>
                        </Card>

                        {/* Actions */}
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
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

                        {/* Dicas Inteligentes */}
                        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Zap className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-blue-900 mb-2">Dicas para um Cadastro Eficiente</h3>
                                        <ul className="space-y-1 text-sm text-blue-800">
                                            <li>• Complete o máximo de informações para melhor segmentação</li>
                                            <li>• Use preferências para personalizar o atendimento</li>
                                            <li>• A segmentação automática ajuda nas campanhas de marketing</li>
                                            <li>• Informações de contato são essenciais para follow-ups</li>
                                        </ul>
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

export default NewClientPage