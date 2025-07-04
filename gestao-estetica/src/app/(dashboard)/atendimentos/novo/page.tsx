'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
    Heart,
    ArrowLeft,
    DollarSign,
    Star,
    User,
    CreditCard,
    Receipt,
    Save,
    Calculator,
    CheckCircle,
    Clock,
    AlertCircle,
    Zap,
    TrendingUp,
    TrendingDown,
    Calendar,
    MessageSquare,
    Sparkles,
    Shield,
    Target,
    Award,
    Minus,
    Banknote,
    Phone,
    Mail,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Database } from '@/lib/database/supabase/types'
import { useClients } from "@/lib/hooks/useClients"
import { useProcedures } from "@/lib/hooks/useProcedures"
import { useFinancials } from "@/lib/hooks/useFinancials"
import { Sidebar } from '@/components/layout/sidebar'
import { useAuthStore } from '@/store/useAuthStore'

type PaymentStatus = Database['public']['Enums']['payment_status_enum']
type PaymentMethod = Database['public']['Enums']['payment_method_enum']

const NovoAtendimentoPage: React.FC = () => {
    const router = useRouter()

    // Auth store
    const { user, userProfile, isLoading: authLoading, isInitialized } = useAuthStore()

    // Get user ID from authenticated user
    const userId = user?.id

    const [formData, setFormData] = useState({
        client_id: '',
        procedure_id: '',
        date: new Date().toISOString().split('T')[0] + 'T' + new Date().toTimeString().split(' ')[0].substring(0,5),
        value: '',
        discount: '0',
        product_cost: '0',
        payment_method: '' as PaymentMethod | '',
        payment_status: 'pending' as PaymentStatus,
        observations: '',
        rating: 'no_rating' // Changed from empty string to avoid Select error
    })

    const [loading, setLoading] = useState(false)
    const [selectedProcedure, setSelectedProcedure] = useState<any>(null)
    const [selectedClient, setSelectedClient] = useState<any>(null)
    const [calculatedValues, setCalculatedValues] = useState({
        finalValue: 0,
        profit: 0,
        profitMargin: 0
    })

    const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})
    const [currentStep, setCurrentStep] = useState(1)
    const [showCalculator, setShowCalculator] = useState(false)

    // Hooks
    const { createAttendance } = useFinancials()

    const {
        data: clientsData,
        isLoading: clientsLoading
    } = useClients({
        page: 1,
        limit: 100,
        filters: {}
    })

    const {
        data: proceduresData,
        isLoading: proceduresLoading
    } = useProcedures({
        page: 1,
        limit: 100
    })

    const clients = clientsData?.data || []
    const procedures = proceduresData?.data || []

    // Atualizar valores calculados
    useEffect(() => {
        const value = parseFloat(formData.value) || 0
        const discount = parseFloat(formData.discount) || 0
        const productCost = parseFloat(formData.product_cost) || 0

        const finalValue = value - discount
        const profit = finalValue - productCost
        const profitMargin = finalValue > 0 ? (profit / finalValue) * 100 : 0

        setCalculatedValues({
            finalValue,
            profit,
            profitMargin
        })
    }, [formData.value, formData.discount, formData.product_cost])

    // Buscar procedimento selecionado
    useEffect(() => {
        if (formData.procedure_id) {
            const procedure = procedures.find(p => p.id === formData.procedure_id)
            setSelectedProcedure(procedure)

            if (procedure && !formData.value) {
                setFormData(prev => ({
                    ...prev,
                    value: procedure.price?.toString() || '',
                    product_cost: procedure.cost?.toString() || '0'
                }))
            }
        } else {
            setSelectedProcedure(null)
        }
    }, [formData.procedure_id, procedures, formData.value])

    // Buscar cliente selecionado
    useEffect(() => {
        if (formData.client_id) {
            const client = clients.find(c => c.id === formData.client_id)
            setSelectedClient(client)
        } else {
            setSelectedClient(null)
        }
    }, [formData.client_id, clients])

    // Validar formulário
    const validateForm = () => {
        const errors: {[key: string]: string} = {}

        if (!formData.client_id) errors.client_id = 'Cliente é obrigatório'
        if (!formData.procedure_id) errors.procedure_id = 'Procedimento é obrigatório'
        if (!formData.date) errors.date = 'Data e hora são obrigatórias'
        if (!formData.value || parseFloat(formData.value) <= 0) errors.value = 'Valor deve ser maior que zero'

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            toast.error('Preencha todos os campos obrigatórios', {
                description: 'Verifique os campos destacados em vermelho.'
            })
            return
        }

        // Check if user is authenticated
        if (!userId || !user) {
            toast.error('Usuário não autenticado. Faça login novamente.')
            router.push('/login') // Adjust the login route as needed
            return
        }

        setLoading(true)
        try {
            const data = {
                user_id: userId, // Added missing user_id field
                client_id: formData.client_id,
                procedure_id: formData.procedure_id,
                date: new Date(formData.date).toISOString(),
                value: parseFloat(formData.value),
                discount: parseFloat(formData.discount) || 0,
                product_cost: parseFloat(formData.product_cost) || 0,
                payment_method: formData.payment_method || null,
                payment_status: formData.payment_status,
                observations: formData.observations || null,
                rating: formData.rating === 'no_rating' ? null : parseInt(formData.rating) // Handle no_rating case
            }

            await createAttendance(data)
            toast.success('Atendimento criado com sucesso!', {
                description: 'O atendimento foi registrado no sistema.',
                action: {
                    label: 'Ver atendimentos',
                    onClick: () => router.push('/atendimentos')
                }
            })
            router.push('/atendimentos')
        } catch (error) {
            toast.error('Erro ao criar atendimento', {
                description: 'Tente novamente ou entre em contato com o suporte.'
            })
        } finally {
            setLoading(false)
        }
    }

    const getPaymentStatusConfig = (status: PaymentStatus) => {
        const configs = {
            pending: {
                label: 'Pendente',
                color: 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border-yellow-200',
                icon: Clock,
                description: 'Aguardando pagamento'
            },
            paid: {
                label: 'Pago',
                color: 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-200',
                icon: CheckCircle,
                description: 'Pagamento confirmado'
            },
            cancelled: {
                label: 'Cancelado',
                color: 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-red-200',
                icon: AlertCircle,
                description: 'Atendimento cancelado'
            },
            refunded: {
                label: 'Reembolsado',
                color: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-200',
                icon: Receipt,
                description: 'Valor reembolsado'
            }
        }
        return configs[status] || configs.pending
    }

    const getPaymentMethodConfig = (method: PaymentMethod) => {
        const configs = {
            cash: { label: 'Dinheiro', icon: Banknote, color: 'text-emerald-600', description: 'Pagamento em espécie' },
            pix: { label: 'PIX', icon: Zap, color: 'text-blue-600', description: 'Transferência instantânea' },
            debit: { label: 'Cartão de Débito', icon: CreditCard, color: 'text-purple-600', description: 'Débito em conta' },
            credit: { label: 'Cartão de Crédito', icon: CreditCard, color: 'text-orange-600', description: 'Crédito parcelável' },
            installment: { label: 'Parcelado', icon: Receipt, color: 'text-pink-600', description: 'Pagamento em parcelas' }
        }
        return configs[method]
    }

    const isLoading = clientsLoading || proceduresLoading || authLoading || !isInitialized

    // Redirect if not authenticated
    useEffect(() => {
        if (isInitialized && !user) {
            router.push('/login') // Adjust the login route as needed
        }
    }, [isInitialized, user, router])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <Sidebar />
                <div className="lg:ml-64">
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <div className="relative">
                            <div className="w-20 h-20 bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 rounded-full animate-pulse shadow-lg"></div>
                            <Heart className="w-10 h-10 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-xl font-bold text-slate-800">
                                {authLoading || !isInitialized ? 'Verificando autenticação...' : 'Carregando dados...'}
                            </p>
                            <p className="text-sm text-slate-500">Preparando o formulário de atendimento</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Show message if not authenticated (after initialization)
    if (isInitialized && !user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <Sidebar />
                <div className="lg:ml-64">
                    <div className="flex flex-col items-center justify-center h-64 gap-6">
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                                <Shield className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-2">Acesso Restrito</h2>
                                <p className="text-slate-600 max-w-md">
                                    Você precisa estar logado para criar um novo atendimento.
                                    Faça login para continuar.
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => router.push('/login')}
                            className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                            <Shield className="w-4 h-4 mr-2" />
                            Fazer Login
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <Sidebar />

            <div className="lg:ml-64">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
                    <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
                        <div className="flex items-center gap-4">
                            <Link href="/atendimentos">
                                <Button variant="outline" size="sm" className="bg-white border-slate-200 hover:bg-slate-50 transition-all duration-300 hover:scale-105 hover:shadow-md">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Voltar
                                </Button>
                            </Link>

                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/25 group-hover:shadow-pink-500/40 transition-all duration-300">
                                        <Heart className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                                            Novo Atendimento
                                        </h1>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
                                            <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                                Registre um novo atendimento realizado
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Progress Indicator */}
                <div className="px-4 sm:px-6 lg:px-8 py-2">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center justify-center gap-4 py-4">
                            {[
                                { step: 1, label: 'Dados Básicos', icon: User },
                                { step: 2, label: 'Financeiro', icon: DollarSign },
                                { step: 3, label: 'Finalizar', icon: CheckCircle }
                            ].map(({ step, label, icon: Icon }) => (
                                <div key={step} className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                                        currentStep >= step
                                            ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg scale-110'
                                            : 'bg-slate-200 text-slate-500'
                                    }`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <span className={`text-sm font-medium transition-colors ${
                                        currentStep >= step ? 'text-pink-600' : 'text-slate-500'
                                    }`}>
                                        {label}
                                    </span>
                                    {step < 3 && (
                                        <div className={`w-8 h-0.5 mx-2 transition-colors ${
                                            currentStep > step ? 'bg-pink-500' : 'bg-slate-200'
                                        }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Conteúdo */}
                <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="max-w-5xl mx-auto">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Coluna 1 - Informações Básicas */}
                                <div className="lg:col-span-2 space-y-6">
                                    <Card className="border-0 shadow-xl shadow-slate-200/60 transition-all duration-300 hover:shadow-2xl">
                                        <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg shadow-lg">
                                                    <User className="w-5 h-5 text-white" />
                                                </div>
                                                Informações do Atendimento
                                                <Badge className="bg-blue-100 text-blue-700 border-blue-200 ml-auto">
                                                    Etapa 1/3
                                                </Badge>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6 space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label htmlFor="client_id" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                        <User className="w-4 h-4 text-blue-500" />
                                                        Cliente *
                                                    </Label>
                                                    <Select
                                                        value={formData.client_id}
                                                        onValueChange={(value) => {
                                                            setFormData(prev => ({ ...prev, client_id: value }))
                                                            setFormErrors(prev => ({ ...prev, client_id: '' }))
                                                        }}
                                                    >
                                                        <SelectTrigger className={`border-slate-200 hover:border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300 ${formErrors.client_id ? 'border-red-300 ring-red-500/20' : ''}`}>
                                                            <SelectValue placeholder="Selecione um cliente" />
                                                        </SelectTrigger>
                                                        <SelectContent className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
                                                            {clients.map((client) => (
                                                                <SelectItem key={client.id} value={client.id} className="hover:bg-blue-50 transition-colors">
                                                                    <div className="flex items-center gap-3 py-1">
                                                                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                                                            {client.name?.charAt(0).toUpperCase()}
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-semibold text-slate-900">{client.name}</div>
                                                                            <div className="text-sm text-slate-500">{client.email}</div>
                                                                        </div>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {formErrors.client_id && (
                                                        <p className="text-sm text-red-600 flex items-center gap-1">
                                                            <AlertCircle className="w-3 h-3" />
                                                            {formErrors.client_id}
                                                        </p>
                                                    )}
                                                    {selectedClient && (
                                                        <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100 transition-all duration-300 hover:shadow-md">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                                                    {selectedClient.name?.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-blue-800">{selectedClient.name}</p>
                                                                    <p className="text-sm text-blue-600">Cliente selecionado</p>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                                                <div className="flex items-center gap-2 text-blue-700">
                                                                    <Mail className="w-3 h-3" />
                                                                    <span>{selectedClient.email}</span>
                                                                </div>
                                                                {selectedClient.phone && (
                                                                    <div className="flex items-center gap-2 text-blue-700">
                                                                        <Phone className="w-3 h-3" />
                                                                        <span>{selectedClient.phone}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="procedure_id" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                        <Heart className="w-4 h-4 text-pink-500" />
                                                        Procedimento *
                                                    </Label>
                                                    <Select
                                                        value={formData.procedure_id}
                                                        onValueChange={(value) => {
                                                            setFormData(prev => ({ ...prev, procedure_id: value }))
                                                            setFormErrors(prev => ({ ...prev, procedure_id: '' }))
                                                        }}
                                                    >
                                                        <SelectTrigger className={`border-slate-200 hover:border-pink-300 focus:border-pink-500 focus:ring-pink-500/20 transition-all duration-300 ${formErrors.procedure_id ? 'border-red-300 ring-red-500/20' : ''}`}>
                                                            <SelectValue placeholder="Selecione um procedimento" />
                                                        </SelectTrigger>
                                                        <SelectContent className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
                                                            {procedures.map((procedure) => (
                                                                <SelectItem key={procedure.id} value={procedure.id} className="hover:bg-pink-50 transition-colors">
                                                                    <div className="py-1">
                                                                        <div className="font-semibold text-slate-900">{procedure.name}</div>
                                                                        <div className="text-sm text-slate-500 flex items-center gap-2">
                                                                            <span>R$ {procedure.price?.toFixed(2)}</span>
                                                                            <span>•</span>
                                                                            <span>{procedure.duration_minutes}min</span>
                                                                        </div>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {formErrors.procedure_id && (
                                                        <p className="text-sm text-red-600 flex items-center gap-1">
                                                            <AlertCircle className="w-3 h-3" />
                                                            {formErrors.procedure_id}
                                                        </p>
                                                    )}
                                                    {selectedProcedure && (
                                                        <div className="mt-3 p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-100 transition-all duration-300 hover:shadow-md">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg">
                                                                    <Heart className="w-5 h-5 text-white" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-pink-800">{selectedProcedure.name}</p>
                                                                    <p className="text-sm text-pink-600">Procedimento selecionado</p>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="text-center p-3 bg-white rounded-lg shadow-sm border border-pink-100">
                                                                    <p className="text-sm text-pink-600 mb-1">Preço</p>
                                                                    <p className="text-lg font-bold text-pink-700">R$ {selectedProcedure.price?.toFixed(2)}</p>
                                                                </div>
                                                                <div className="text-center p-3 bg-white rounded-lg shadow-sm border border-pink-100">
                                                                    <p className="text-sm text-pink-600 mb-1">Duração</p>
                                                                    <p className="text-lg font-bold text-pink-700">{selectedProcedure.duration_minutes}min</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="date" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-purple-500" />
                                                    Data e Hora *
                                                </Label>
                                                <Input
                                                    type="datetime-local"
                                                    value={formData.date}
                                                    onChange={(e) => {
                                                        setFormData(prev => ({ ...prev, date: e.target.value }))
                                                        setFormErrors(prev => ({ ...prev, date: '' }))
                                                    }}
                                                    className={`border-slate-200 hover:border-purple-300 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300 ${formErrors.date ? 'border-red-300 ring-red-500/20' : ''}`}
                                                    required
                                                />
                                                {formErrors.date && (
                                                    <p className="text-sm text-red-600 flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" />
                                                        {formErrors.date}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="observations" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                    <MessageSquare className="w-4 h-4 text-green-500" />
                                                    Observações
                                                </Label>
                                                <Textarea
                                                    value={formData.observations}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                                                    placeholder="Observações sobre o atendimento, produtos utilizados, reações do cliente..."
                                                    rows={3}
                                                    className="border-slate-200 hover:border-green-300 focus:border-green-500 focus:ring-green-500/20 transition-all duration-300 resize-none"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="rating" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                    <Star className="w-4 h-4 text-yellow-500" />
                                                    Avaliação do Cliente
                                                </Label>
                                                <Select value={formData.rating} onValueChange={(value) => setFormData(prev => ({ ...prev, rating: value }))}>
                                                    <SelectTrigger className="border-slate-200 hover:border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all duration-300">
                                                        <SelectValue placeholder="Selecione uma avaliação" />
                                                    </SelectTrigger>
                                                    <SelectContent className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
                                                        <SelectItem value="no_rating" className="hover:bg-gray-50">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                                                                <span>Sem avaliação</span>
                                                            </div>
                                                        </SelectItem>
                                                        {[1, 2, 3, 4, 5].map((rating) => (
                                                            <SelectItem key={rating} value={rating.toString()} className="hover:bg-yellow-50 transition-colors">
                                                                <div className="flex items-center gap-3 py-1">
                                                                    <div className="flex">
                                                                        {[...Array(5)].map((_, i) => (
                                                                            <Star
                                                                                key={i}
                                                                                className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                    <span className="font-medium">{rating} estrela{rating > 1 ? 's' : ''}</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Informações Financeiras */}
                                    <Card className="border-0 shadow-xl shadow-slate-200/60 transition-all duration-300 hover:shadow-2xl">
                                        <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg shadow-lg">
                                                    <DollarSign className="w-5 h-5 text-white" />
                                                </div>
                                                Informações Financeiras
                                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 ml-auto">
                                                    Etapa 2/3
                                                </Badge>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6 space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label htmlFor="value" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                        <DollarSign className="w-4 h-4 text-emerald-500" />
                                                        Valor do Serviço *
                                                    </Label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 font-medium">R$</span>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={formData.value}
                                                            onChange={(e) => {
                                                                setFormData(prev => ({ ...prev, value: e.target.value }))
                                                                setFormErrors(prev => ({ ...prev, value: '' }))
                                                            }}
                                                            placeholder="0,00"
                                                            className={`pl-10 border-slate-200 hover:border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-300 ${formErrors.value ? 'border-red-300 ring-red-500/20' : ''}`}
                                                            required
                                                        />
                                                    </div>
                                                    {formErrors.value && (
                                                        <p className="text-sm text-red-600 flex items-center gap-1">
                                                            <AlertCircle className="w-3 h-3" />
                                                            {formErrors.value}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="discount" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                        <Minus className="w-4 h-4 text-orange-500" />
                                                        Desconto
                                                    </Label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 font-medium">R$</span>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={formData.discount}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, discount: e.target.value }))}
                                                            placeholder="0,00"
                                                            className="pl-10 border-slate-200 hover:border-orange-300 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-300"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="product_cost" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                        <Receipt className="w-4 h-4 text-purple-500" />
                                                        Custo dos Produtos
                                                    </Label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 font-medium">R$</span>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={formData.product_cost}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, product_cost: e.target.value }))}
                                                            placeholder="0,00"
                                                            className="pl-10 border-slate-200 hover:border-purple-300 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="payment_method" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                        <CreditCard className="w-4 h-4 text-blue-500" />
                                                        Método de Pagamento
                                                    </Label>
                                                    <Select value={formData.payment_method} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value as PaymentMethod }))}>
                                                        <SelectTrigger className="border-slate-200 hover:border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300">
                                                            <SelectValue placeholder="Selecione o método" />
                                                        </SelectTrigger>
                                                        <SelectContent className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
                                                            {[
                                                                { value: 'cash', label: 'Dinheiro', icon: Banknote, color: 'text-emerald-600' },
                                                                { value: 'pix', label: 'PIX', icon: Zap, color: 'text-blue-600' },
                                                                { value: 'debit', label: 'Cartão de Débito', icon: CreditCard, color: 'text-purple-600' },
                                                                { value: 'credit', label: 'Cartão de Crédito', icon: CreditCard, color: 'text-orange-600' },
                                                                { value: 'installment', label: 'Parcelado', icon: Receipt, color: 'text-pink-600' }
                                                            ].map(({ value, label, icon: Icon, color }) => (
                                                                <SelectItem key={value} value={value} className="hover:bg-blue-50 transition-colors">
                                                                    <div className="flex items-center gap-3 py-1">
                                                                        <Icon className={`w-4 h-4 ${color}`} />
                                                                        <span className="font-medium">{label}</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="md:col-span-2 space-y-2">
                                                    <Label htmlFor="payment_status" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                        Status do Pagamento
                                                    </Label>
                                                    <Select value={formData.payment_status} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_status: value as PaymentStatus }))}>
                                                        <SelectTrigger className="border-slate-200 hover:border-green-300 focus:border-green-500 focus:ring-green-500/20 transition-all duration-300">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
                                                            {[
                                                                { value: 'pending', label: 'Pendente', icon: Clock, color: 'text-yellow-600' },
                                                                { value: 'paid', label: 'Pago', icon: CheckCircle, color: 'text-emerald-600' },
                                                                { value: 'cancelled', label: 'Cancelado', icon: AlertCircle, color: 'text-red-600' },
                                                                { value: 'refunded', label: 'Reembolsado', icon: Receipt, color: 'text-gray-600' }
                                                            ].map(({ value, label, icon: Icon, color }) => (
                                                                <SelectItem key={value} value={value} className="hover:bg-green-50 transition-colors">
                                                                    <div className="flex items-center gap-3 py-1">
                                                                        <Icon className={`w-4 h-4 ${color}`} />
                                                                        <span className="font-medium">{label}</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {/* Calculadora Visual */}
                                            <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                        <Calculator className="w-4 h-4 text-blue-500" />
                                                        Calculadora de Valores
                                                    </h4>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setShowCalculator(!showCalculator)}
                                                        className="text-xs"
                                                    >
                                                        {showCalculator ? 'Ocultar' : 'Mostrar'} Detalhes
                                                    </Button>
                                                </div>

                                                {showCalculator && (
                                                    <div className="space-y-3 text-sm">
                                                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                            <span className="text-slate-600">Valor do Serviço:</span>
                                                            <span className="font-semibold">R$ {(parseFloat(formData.value) || 0).toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                            <span className="text-slate-600">(-) Desconto:</span>
                                                            <span className="font-semibold text-red-600">R$ {(parseFloat(formData.discount) || 0).toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                            <span className="text-slate-600">(-) Custo Produtos:</span>
                                                            <span className="font-semibold text-orange-600">R$ {(parseFloat(formData.product_cost) || 0).toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="mt-4 pt-4 border-t border-slate-200">
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                        <div className="text-center p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-100">
                                                            <p className="text-xs text-emerald-600 mb-1">Valor Final</p>
                                                            <p className="text-lg font-bold text-emerald-700">R$ {calculatedValues.finalValue.toFixed(2)}</p>
                                                        </div>
                                                        <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                                                            <p className="text-xs text-blue-600 mb-1">Lucro</p>
                                                            <p className={`text-lg font-bold ${calculatedValues.profit >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                                                                R$ {calculatedValues.profit.toFixed(2)}
                                                            </p>
                                                        </div>
                                                        <div className="text-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                                                            <p className="text-xs text-purple-600 mb-1">Margem</p>
                                                            <p className={`text-lg font-bold ${calculatedValues.profitMargin >= 0 ? 'text-purple-700' : 'text-red-600'}`}>
                                                                {calculatedValues.profitMargin.toFixed(1)}%
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Coluna 2 - Resumo e Ações */}
                                <div className="space-y-6">
                                    {/* Resumo Financeiro */}
                                    <Card className="border-0 shadow-xl shadow-slate-200/60 sticky top-24 transition-all duration-300 hover:shadow-2xl">
                                        <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg">
                                                    <Calculator className="w-5 h-5 text-white" />
                                                </div>
                                                Resumo do Atendimento
                                                <Badge className="bg-purple-100 text-purple-700 border-purple-200 ml-auto">
                                                    Preview
                                                </Badge>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            {/* Cliente e Procedimento */}
                                            {(selectedClient || selectedProcedure) && (
                                                <div className="space-y-4 mb-6 pb-6 border-b border-slate-100">
                                                    {selectedClient && (
                                                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                                {selectedClient.name?.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-blue-800 text-sm">{selectedClient.name}</p>
                                                                <p className="text-xs text-blue-600">Cliente</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {selectedProcedure && (
                                                        <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
                                                            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg">
                                                                <Heart className="w-4 h-4 text-white" />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-pink-800 text-sm">{selectedProcedure.name}</p>
                                                                <p className="text-xs text-pink-600">{selectedProcedure.duration_minutes}min</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Resumo Financeiro */}
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                                    <span className="text-sm text-slate-600">Valor do Serviço:</span>
                                                    <span className="font-semibold text-slate-900">R$ {(parseFloat(formData.value) || 0).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                                    <span className="text-sm text-slate-600">Desconto:</span>
                                                    <span className="font-semibold text-red-600">- R$ {(parseFloat(formData.discount) || 0).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-3 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-green-50 px-3 -mx-3 rounded-lg">
                                                    <span className="text-sm font-semibold text-emerald-800">Valor Final:</span>
                                                    <span className="font-bold text-emerald-600 text-xl">R$ {calculatedValues.finalValue.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                                    <span className="text-sm text-slate-600">Custo dos Produtos:</span>
                                                    <span className="font-semibold text-orange-600">R$ {(parseFloat(formData.product_cost) || 0).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                                    <span className="text-sm font-semibold text-slate-800">Lucro:</span>
                                                    <span className={`font-bold text-lg ${calculatedValues.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                                        R$ {calculatedValues.profit.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center py-3">
                                                    <span className="text-sm font-semibold text-slate-800">Margem de Lucro:</span>
                                                    <Badge className={`${calculatedValues.profitMargin >= 0 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'} text-sm font-bold`}>
                                                        {calculatedValues.profitMargin.toFixed(1)}%
                                                    </Badge>
                                                </div>

                                                {/* Status Preview */}
                                                <div className="pt-4 border-t border-slate-100 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-slate-600">Status do Pagamento:</span>
                                                        <Badge className={getPaymentStatusConfig(formData.payment_status).color}>
                                                            {React.createElement(getPaymentStatusConfig(formData.payment_status).icon, { className: "w-3 h-3 mr-1" })}
                                                            {getPaymentStatusConfig(formData.payment_status).label}
                                                        </Badge>
                                                    </div>
                                                    {formData.payment_method && (
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm text-slate-600">Método:</span>
                                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                                {React.createElement(getPaymentMethodConfig(formData.payment_method).icon, { className: "w-3 h-3 mr-1" })}
                                                                {getPaymentMethodConfig(formData.payment_method).label}
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Indicadores de Performance */}
                                                <div className="mt-6 pt-4 border-t border-slate-100">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                                                            <div className="flex items-center justify-center gap-1 mb-1">
                                                                {calculatedValues.profitMargin >= 60 ? (
                                                                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                                                                ) : calculatedValues.profitMargin >= 30 ? (
                                                                    <Target className="w-3 h-3 text-yellow-500" />
                                                                ) : (
                                                                    <TrendingDown className="w-3 h-3 text-red-500" />
                                                                )}
                                                                <span className="text-xs font-medium text-slate-600">Performance</span>
                                                            </div>
                                                            <span className={`text-sm font-bold ${
                                                                calculatedValues.profitMargin >= 60 ? 'text-emerald-600' :
                                                                    calculatedValues.profitMargin >= 30 ? 'text-yellow-600' : 'text-red-600'
                                                            }`}>
                                                                {calculatedValues.profitMargin >= 60 ? 'Excelente' :
                                                                    calculatedValues.profitMargin >= 30 ? 'Boa' : 'Baixa'}
                                                            </span>
                                                        </div>
                                                        <div className="text-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                                                            <div className="flex items-center justify-center gap-1 mb-1">
                                                                <Award className="w-3 h-3 text-purple-500" />
                                                                <span className="text-xs font-medium text-slate-600">Categoria</span>
                                                            </div>
                                                            <span className="text-sm font-bold text-purple-600">
                                                                {calculatedValues.finalValue >= 200 ? 'Premium' :
                                                                    calculatedValues.finalValue >= 100 ? 'Standard' : 'Básico'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Botões de Ação */}
                                    <div className="flex flex-col gap-3">
                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 hover:from-pink-600 hover:via-rose-600 hover:to-red-600 shadow-lg shadow-pink-500/25 border-0 h-12 transition-all duration-300 hover:shadow-pink-500/40 hover:scale-105"
                                        >
                                            {loading ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    <span>Salvando...</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Save className="w-4 h-4" />
                                                    <span>Salvar Atendimento</span>
                                                </div>
                                            )}
                                        </Button>

                                        <Link href="/atendimentos">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full bg-white border-slate-200 hover:bg-slate-50 h-12 transition-all duration-300 hover:scale-105 hover:shadow-md"
                                                disabled={loading}
                                            >
                                                Cancelar
                                            </Button>
                                        </Link>

                                        {/* Atalhos */}
                                        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                                            <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4" />
                                                Atalhos Rápidos
                                            </h4>
                                            <div className="space-y-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full justify-start text-blue-700 hover:bg-blue-100 transition-all duration-300"
                                                    onClick={() => setFormData(prev => ({ ...prev, payment_status: 'paid' }))}
                                                >
                                                    <CheckCircle className="w-3 h-3 mr-2" />
                                                    Marcar como Pago
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full justify-start text-blue-700 hover:bg-blue-100 transition-all duration-300"
                                                    onClick={() => setFormData(prev => ({ ...prev, discount: '0', product_cost: '0' }))}
                                                >
                                                    <Calculator className="w-3 h-3 mr-2" />
                                                    Limpar Custos
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default NovoAtendimentoPage