'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import {
    ArrowLeft,
    Calendar as GoogleCalendarIcon,
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCw,
    Link as LinkIcon,
    Unlink,
    Clock,
    Bell,
    Shield,
    Loader2,
    Activity,
    TrendingUp,
    ChevronRight,
    Settings,
    Download,
    Filter,
    Sparkles,
    Zap,
    Globe,
    Users
} from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import Link from 'next/link'
import { useGoogleCalendar } from '@/lib/hooks/useGoogleCalendar'
import { useAuthStore } from '@/store/useAuthStore'
import CalendarSync from '@/components/calendar/CalendarSync'
import { Sidebar } from '@/components/layout/sidebar'
import {supabase} from "@/lib/database/supabase/client"

interface GoogleCalendarConfig {
    autoSyncEnabled: boolean
    syncInterval: number
    syncDirection: 'bidirectional' | 'system_to_google' | 'google_to_system'
    notificationsEnabled: boolean
    reminderSettings: {
        email: boolean
        popup: boolean
        emailMinutes: number
        popupMinutes: number
    }
    privacySettings: {
        shareClientNames: boolean
        shareClientContacts: boolean
        shareNotes: boolean
    }
    workingHours: {
        enabled: boolean
        start: string
        end: string
        days: string[]
    }
}

const ConfiguracaoPage: React.FC = () => {
    const [config, setConfig] = useState<GoogleCalendarConfig>({
        autoSyncEnabled: true,
        syncInterval: 15,
        syncDirection: 'bidirectional',
        notificationsEnabled: true,
        reminderSettings: {
            email: true,
            popup: true,
            emailMinutes: 60,
            popupMinutes: 15
        },
        privacySettings: {
            shareClientNames: true,
            shareClientContacts: false,
            shareNotes: false
        },
        workingHours: {
            enabled: true,
            start: '08:00',
            end: '18:00',
            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        }
    })

    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)

    const { user, userProfile, businessProfile, hasGoogleCalendar, refreshProfile } = useAuthStore()

    const {
        isAuthenticated,
        loading: calendarLoading,
        error: calendarError,
        startAuthentication,
        disconnect,
        refreshEvents,
        clearError
    } = useGoogleCalendar()

    // ✅ CORRIGIDO: Carregamento inicial das configurações do campo correto
    useEffect(() => {
        const loadConfigurations = async () => {
            try {
                if (businessProfile?.google_calendar_settings) {
                    // Carregar do business_profile
                    const savedConfig = businessProfile.google_calendar_settings as any
                    setConfig(prev => ({ ...prev, ...savedConfig }))
                } else if (userProfile && hasGoogleCalendar()) {
                    // Se não há configurações salvas, mas há autenticação, criar configurações padrão
                    const defaultConfig = {
                        autoSyncEnabled: true,
                        syncInterval: 15,
                        syncDirection: 'bidirectional' as const,
                        notificationsEnabled: true,
                        reminderSettings: {
                            email: true,
                            popup: true,
                            emailMinutes: 60,
                            popupMinutes: 15
                        },
                        privacySettings: {
                            shareClientNames: true,
                            shareClientContacts: false,
                            shareNotes: false
                        },
                        workingHours: {
                            enabled: true,
                            start: '08:00',
                            end: '18:00',
                            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
                        }
                    }
                    setConfig(defaultConfig)
                }
            } catch (error) {
                console.error('Erro ao carregar configurações:', error)
            }
        }

        loadConfigurations()
    }, [businessProfile, userProfile, hasGoogleCalendar])

    const handleConnect = async () => {
        try {
            console.log('🔗 Iniciando conexão com Google Calendar...')
            const success = await startAuthentication()
            if (success) {
                console.log('✅ Redirecionamento para Google iniciado')
                // Aguardar um pouco para o redirect acontecer
                setTimeout(() => {
                    refreshProfile()
                }, 1000)
            }
        } catch (error) {
            console.error('❌ Erro ao conectar:', error)
        }
    }

    const handleDisconnect = async () => {
        if (!window.confirm('Tem certeza que deseja desconectar o Google Calendar? Todos os eventos sincronizados permanecerão, mas a sincronização automática será interrompida.')) {
            return
        }

        try {
            console.log('🔌 Desconectando Google Calendar...')
            const success = await disconnect()
            if (success) {
                console.log('✅ Google Calendar desconectado')
                await refreshProfile()
            }
        } catch (error) {
            console.error('❌ Erro ao desconectar:', error)
        }
    }

    // ✅ CORRIGIDO: Salvar no campo correto
    const handleSaveSettings = async () => {
        setIsSaving(true)
        setSaveError(null)

        try {
            console.log('💾 Salvando configurações...', config)

            // Garantir que existe um business_profile
            if (!businessProfile && user) {
                console.log('📋 Criando business_profile...')
                const { error: createError } = await supabase
                    .from('business_profile')
                    .insert({
                        user_id: user.id,
                        business_name: 'Meu Negócio',
                        google_calendar_settings: config
                    })

                if (createError) {
                    throw createError
                }
            } else if (businessProfile) {
                console.log('🔄 Atualizando configurações existentes...')
                const { error: updateError } = await supabase
                    .from('business_profile')
                    .update({
                        google_calendar_settings: config
                    })
                    .eq('user_id', user!.id)

                if (updateError) {
                    throw updateError
                }
            }

            console.log('✅ Configurações salvas com sucesso!')
            await refreshProfile() // Atualizar perfil para refletir mudanças

            // Simular delay para feedback visual
            await new Promise(resolve => setTimeout(resolve, 1000))

        } catch (error) {
            setSaveError('Erro ao salvar configurações')
            console.error('❌ Erro ao salvar configurações:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleTestSync = async () => {
        try {
            console.log('🔄 Testando sincronização...')
            await refreshEvents()
            console.log('✅ Teste de sincronização concluído')
        } catch (error) {
            console.error('❌ Erro no teste de sincronização:', error)
        }
    }

    const dayOptions = [
        { value: 'monday', label: 'Segunda-feira' },
        { value: 'tuesday', label: 'Terça-feira' },
        { value: 'wednesday', label: 'Quarta-feira' },
        { value: 'thursday', label: 'Quinta-feira' },
        { value: 'friday', label: 'Sexta-feira' },
        { value: 'saturday', label: 'Sábado' },
        { value: 'sunday', label: 'Domingo' }
    ]

    const syncIntervalOptions = [
        { value: 5, label: '5 minutos' },
        { value: 15, label: '15 minutos' },
        { value: 30, label: '30 minutos' },
        { value: 60, label: '1 hora' }
    ]

    const updateConfig = (updates: Partial<GoogleCalendarConfig>) => {
        setConfig(prev => ({ ...prev, ...updates }))
    }

    // Dados das métricas de configuração
    const getConfigStats = () => {
        const activeFeatures = [
            config.autoSyncEnabled,
            config.notificationsEnabled,
            config.workingHours.enabled,
            hasGoogleCalendar() && isAuthenticated
        ].filter(Boolean).length

        return {
            connected: hasGoogleCalendar() && isAuthenticated ? 1 : 0,
            syncInterval: config.syncInterval,
            activeFeatures,
            workingDays: config.workingHours.days.length
        }
    }

    const statsData = getConfigStats()

    const metricsData = [
        {
            title: 'Status da Conexão',
            value: statsData.connected ? 'Conectado' : 'Desconectado',
            icon: GoogleCalendarIcon,
            description: hasGoogleCalendar() && isAuthenticated ? 'Google Calendar ativo' : 'Não conectado',
            gradient: statsData.connected ? 'from-emerald-500 to-emerald-600' : 'from-orange-500 to-orange-600',
            trend: { value: statsData.connected, label: 'status', isPositive: !!statsData.connected }
        },
        {
            title: 'Intervalo de Sinc',
            value: `${statsData.syncInterval}min`,
            icon: RefreshCw,
            description: 'Frequência de sincronização',
            gradient: 'from-blue-500 to-blue-600',
            trend: { value: statsData.syncInterval, label: 'minutos', isPositive: true }
        },
        {
            title: 'Recursos Ativos',
            value: statsData.activeFeatures,
            icon: Zap,
            description: 'Funcionalidades habilitadas',
            gradient: 'from-purple-500 to-purple-600',
            trend: { value: statsData.activeFeatures, label: 'recursos', isPositive: true }
        },
        {
            title: 'Dias Úteis',
            value: statsData.workingDays,
            icon: Clock,
            description: 'Dias de funcionamento',
            gradient: 'from-indigo-500 to-indigo-600',
            trend: { value: statsData.workingDays, label: 'dias', isPositive: true }
        }
    ]

    if (calendarLoading && !userProfile) {
        return (
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                    <Sidebar />
                    <div className="lg:ml-64">
                        <div className="flex items-center justify-center h-64">
                            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
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
                                            <Settings className="w-4 h-4 text-white" />
                                        </div>
                                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                            Configurações do Google Calendar
                                        </h1>
                                    </div>
                                    <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                        Gerencie a integração e sincronização com o Google Calendar
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                    {/* Status Badge */}
                                    <Badge className={cn(
                                        "border-0 shadow-lg text-xs",
                                        hasGoogleCalendar() && isAuthenticated
                                            ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-emerald-500/25"
                                            : "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-orange-500/25"
                                    )}>
                                        <Activity className="w-3 h-3 mr-1" />
                                        <span className="hidden sm:inline">
                                            {hasGoogleCalendar() && isAuthenticated ? 'Google Conectado' : 'Desconectado'}
                                        </span>
                                        <span className="sm:hidden">
                                            {hasGoogleCalendar() && isAuthenticated ? 'Conectado' : 'Off'}
                                        </span>
                                    </Badge>

                                    {/* Botões de Ação */}
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <button
                                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                                            onClick={handleTestSync}
                                            disabled={calendarLoading}
                                        >
                                            <RefreshCw className={cn("w-4 h-4 text-slate-600", calendarLoading && "animate-spin")} />
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
                                        <Button
                                            onClick={handleSaveSettings}
                                            disabled={isSaving}
                                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 border-0"
                                        >
                                            {isSaving ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                            )}
                                            <span className="hidden sm:inline">Salvar Configurações</span>
                                            <span className="sm:hidden">Salvar</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Conteúdo */}
                    <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                        <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

                            {/* Debug Info - Apenas para desenvolvimento */}
                            {process.env.NODE_ENV === 'development' && (
                                <Card className="border-yellow-200 bg-yellow-50">
                                    <CardContent className="p-4">
                                        <h3 className="font-semibold text-yellow-800 mb-2">🛠️ Debug Info:</h3>
                                        <div className="text-sm text-yellow-700 space-y-1">
                                            <p>• User ID: {user?.id}</p>
                                            <p>• Has Google Calendar: {hasGoogleCalendar() ? '✅' : '❌'}</p>
                                            <p>• Is Authenticated: {isAuthenticated ? '✅' : '❌'}</p>
                                            <p>• Google Access Token: {userProfile?.google_access_token ? '✅' : '❌'}</p>
                                            <p>• Google Refresh Token: {userProfile?.google_refresh_token ? '✅' : '❌'}</p>
                                            <p>• Google Calendar ID: {userProfile?.google_calendar_id || 'N/A'}</p>
                                            <p>• Business Profile: {businessProfile ? '✅' : '❌'}</p>
                                            <p>• Calendar Settings: {businessProfile?.google_calendar_settings ? '✅' : '❌'}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

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

                            {/* Status da Conexão */}
                            <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                    <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                                        <GoogleCalendarIcon className="w-5 h-5 text-blue-500" />
                                        Status da Conexão
                                        {calendarLoading && <RefreshCw className="w-4 h-4 animate-spin ml-2 text-blue-500" />}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 lg:p-6">
                                    {hasGoogleCalendar() && isAuthenticated ? (
                                        <div className="space-y-4">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 lg:p-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                                                <div className="flex items-center gap-3 mb-3 sm:mb-0">
                                                    <div className="p-2 bg-emerald-500 rounded-full">
                                                        <CheckCircle className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-emerald-900">Conectado ao Google Calendar</p>
                                                        <p className="text-sm text-emerald-700">
                                                            {userProfile?.email} • Calendário Principal
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    onClick={handleDisconnect}
                                                    disabled={calendarLoading}
                                                    className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                                >
                                                    <Unlink className="w-4 h-4 mr-2" />
                                                    Desconectar
                                                </Button>
                                            </div>

                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <Button
                                                    variant="outline"
                                                    onClick={handleTestSync}
                                                    disabled={calendarLoading}
                                                    className="flex-1 bg-white border-slate-200 hover:bg-slate-50"
                                                >
                                                    <RefreshCw className={cn("w-4 h-4 mr-2", calendarLoading && "animate-spin")} />
                                                    Testar Sincronização
                                                </Button>
                                                <Button
                                                    onClick={handleSaveSettings}
                                                    disabled={isSaving}
                                                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 border-0"
                                                >
                                                    {isSaving ? (
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                    )}
                                                    Salvar Configurações
                                                </Button>
                                            </div>

                                            {saveError && (
                                                <Alert className="border-red-200 bg-red-50">
                                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                                    <AlertDescription className="text-red-800">{saveError}</AlertDescription>
                                                </Alert>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 lg:p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                                                <div className="flex items-center gap-3 mb-3 sm:mb-0">
                                                    <div className="p-2 bg-orange-500 rounded-full">
                                                        <XCircle className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-orange-900">Google Calendar não conectado</p>
                                                        <p className="text-sm text-orange-700">
                                                            Conecte sua conta para sincronizar agendamentos automaticamente
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={handleConnect}
                                                    disabled={calendarLoading}
                                                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 border-0"
                                                >
                                                    <LinkIcon className="w-4 h-4 mr-2" />
                                                    {calendarLoading ? 'Conectando...' : 'Conectar'}
                                                </Button>
                                            </div>

                                            <Alert className="border-blue-200 bg-blue-50">
                                                <AlertCircle className="h-4 w-4 text-blue-600" />
                                                <AlertDescription className="text-blue-800">
                                                    <strong className="font-semibold">Benefícios da integração com Google Calendar:</strong>
                                                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                                                        <li>Sincronização automática de agendamentos</li>
                                                        <li>Envio de convites profissionais para clientes</li>
                                                        <li>Recebimento de confirmações via Google Calendar</li>
                                                        <li>Acesso aos agendamentos em qualquer dispositivo</li>
                                                        <li>Lembretes automáticos por email e notificação</li>
                                                    </ul>
                                                </AlertDescription>
                                            </Alert>
                                        </div>
                                    )}

                                    {/* Mostrar erro se houver */}
                                    {calendarError && (
                                        <Alert className="mt-4 border-red-200 bg-red-50">
                                            <AlertCircle className="h-4 w-4 text-red-600" />
                                            <AlertDescription className="text-red-800">
                                                <div className="flex items-center justify-between">
                                                    <span>{calendarError}</span>
                                                    <Button variant="outline" size="sm" onClick={clearError} className="ml-2">
                                                        Limpar
                                                    </Button>
                                                </div>
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Configurações (só mostra se conectado) */}
                            {hasGoogleCalendar() && isAuthenticated && (
                                <Tabs defaultValue="sync" className="space-y-6">
                                    <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <Sparkles className="w-5 h-5 text-purple-500" />
                                                Configurações Avançadas
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 lg:p-6">
                                            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-slate-100 border-0">
                                                <TabsTrigger value="sync" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                                    <RefreshCw className="w-4 h-4 mr-2" />
                                                    <span className="hidden sm:inline">Sincronização</span>
                                                    <span className="sm:hidden">Sync</span>
                                                </TabsTrigger>
                                                <TabsTrigger value="notifications" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                                    <Bell className="w-4 h-4 mr-2" />
                                                    <span className="hidden sm:inline">Notificações</span>
                                                    <span className="sm:hidden">Notif</span>
                                                </TabsTrigger>
                                                <TabsTrigger value="privacy" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                                    <Shield className="w-4 h-4 mr-2" />
                                                    <span className="hidden sm:inline">Privacidade</span>
                                                    <span className="sm:hidden">Privacy</span>
                                                </TabsTrigger>
                                                <TabsTrigger value="schedule" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                                    <Clock className="w-4 h-4 mr-2" />
                                                    <span className="hidden sm:inline">Horários</span>
                                                    <span className="sm:hidden">Hours</span>
                                                </TabsTrigger>
                                            </TabsList>
                                        </CardContent>
                                    </Card>

                                    {/* Configurações de Sincronização */}
                                    <TabsContent value="sync" className="space-y-6">
                                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                                <CardTitle className="flex items-center gap-2">
                                                    <RefreshCw className="w-5 h-5 text-blue-500" />
                                                    Configurações de Sincronização
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-6 space-y-6">
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                    <div className="flex-1">
                                                        <Label className="text-base font-semibold text-slate-900">Sincronização Automática</Label>
                                                        <p className="text-sm text-slate-600 mt-1">
                                                            Sincronizar agendamentos automaticamente em intervalos regulares
                                                        </p>
                                                    </div>
                                                    <Switch
                                                        checked={config.autoSyncEnabled}
                                                        onCheckedChange={(checked) =>
                                                            updateConfig({ autoSyncEnabled: checked })
                                                        }
                                                    />
                                                </div>

                                                {config.autoSyncEnabled && (
                                                    <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                            <div>
                                                                <Label className="font-medium">Intervalo de Sincronização</Label>
                                                                <Select
                                                                    value={config.syncInterval.toString()}
                                                                    onValueChange={(value) =>
                                                                        updateConfig({ syncInterval: parseInt(value) })
                                                                    }
                                                                >
                                                                    <SelectTrigger className="w-full bg-white border-slate-200">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {syncIntervalOptions.map((option) => (
                                                                            <SelectItem key={option.value} value={option.value.toString()}>
                                                                                {option.label}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>

                                                            <div>
                                                                <Label className="font-medium">Direção da Sincronização</Label>
                                                                <Select
                                                                    value={config.syncDirection}
                                                                    onValueChange={(value: any) =>
                                                                        updateConfig({ syncDirection: value })
                                                                    }
                                                                >
                                                                    <SelectTrigger className="w-full bg-white border-slate-200">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="bidirectional">Bidirecional (Sistema ↔ Google)</SelectItem>
                                                                        <SelectItem value="system_to_google">Sistema → Google apenas</SelectItem>
                                                                        <SelectItem value="google_to_system">Google → Sistema apenas</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>

                                                        <Alert className="border-blue-200 bg-blue-50">
                                                            <AlertCircle className="h-4 w-4 text-blue-600" />
                                                            <AlertDescription className="text-blue-800">
                                                                <strong>Direção atual:</strong>{' '}
                                                                {config.syncDirection === 'bidirectional' &&
                                                                    'Eventos são sincronizados em ambas as direções'}
                                                                {config.syncDirection === 'system_to_google' &&
                                                                    'Apenas eventos criados no sistema vão para o Google'}
                                                                {config.syncDirection === 'google_to_system' &&
                                                                    'Apenas eventos do Google vêm para o sistema'}
                                                            </AlertDescription>
                                                        </Alert>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        {/* Componente de sincronização detalhada */}
                                        <CalendarSync />
                                    </TabsContent>

                                    {/* Configurações de Notificações */}
                                    <TabsContent value="notifications" className="space-y-6">
                                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                                <CardTitle className="flex items-center gap-2">
                                                    <Bell className="w-5 h-5 text-green-500" />
                                                    Configurações de Notificações
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-6 space-y-6">
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                    <div className="flex-1">
                                                        <Label className="text-base font-semibold text-slate-900">Notificações do Google Calendar</Label>
                                                        <p className="text-sm text-slate-600 mt-1">
                                                            Usar as notificações nativas do Google Calendar
                                                        </p>
                                                    </div>
                                                    <Switch
                                                        checked={config.notificationsEnabled}
                                                        onCheckedChange={(checked) =>
                                                            updateConfig({ notificationsEnabled: checked })
                                                        }
                                                    />
                                                </div>

                                                {config.notificationsEnabled && (
                                                    <div className="space-y-4 p-4 bg-green-50 rounded-xl border border-green-200">
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                            <div className="space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <Label className="font-medium">Lembrete por Email</Label>
                                                                    <Switch
                                                                        checked={config.reminderSettings.email}
                                                                        onCheckedChange={(checked) =>
                                                                            updateConfig({
                                                                                reminderSettings: {
                                                                                    ...config.reminderSettings,
                                                                                    email: checked
                                                                                }
                                                                            })
                                                                        }
                                                                    />
                                                                </div>
                                                                {config.reminderSettings.email && (
                                                                    <div>
                                                                        <Label className="text-sm font-medium">Minutos antes</Label>
                                                                        <Input
                                                                            type="number"
                                                                            value={config.reminderSettings.emailMinutes}
                                                                            onChange={(e) =>
                                                                                updateConfig({
                                                                                    reminderSettings: {
                                                                                        ...config.reminderSettings,
                                                                                        emailMinutes: parseInt(e.target.value) || 60
                                                                                    }
                                                                                })
                                                                            }
                                                                            className="bg-white border-slate-200"
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <Label className="font-medium">Lembrete Popup</Label>
                                                                    <Switch
                                                                        checked={config.reminderSettings.popup}
                                                                        onCheckedChange={(checked) =>
                                                                            updateConfig({
                                                                                reminderSettings: {
                                                                                    ...config.reminderSettings,
                                                                                    popup: checked
                                                                                }
                                                                            })
                                                                        }
                                                                    />
                                                                </div>
                                                                {config.reminderSettings.popup && (
                                                                    <div>
                                                                        <Label className="text-sm font-medium">Minutos antes</Label>
                                                                        <Input
                                                                            type="number"
                                                                            value={config.reminderSettings.popupMinutes}
                                                                            onChange={(e) =>
                                                                                updateConfig({
                                                                                    reminderSettings: {
                                                                                        ...config.reminderSettings,
                                                                                        popupMinutes: parseInt(e.target.value) || 15
                                                                                    }
                                                                                })
                                                                            }
                                                                            className="bg-white border-slate-200"
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    {/* Configurações de Privacidade */}
                                    <TabsContent value="privacy" className="space-y-6">
                                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                                <CardTitle className="flex items-center gap-2">
                                                    <Shield className="w-5 h-5 text-purple-500" />
                                                    Configurações de Privacidade
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-6 space-y-6">
                                                <Alert className="border-purple-200 bg-purple-50">
                                                    <AlertCircle className="h-4 w-4 text-purple-600" />
                                                    <AlertDescription className="text-purple-800">
                                                        Configure quais informações serão compartilhadas nos eventos do Google Calendar.
                                                        Informações sensíveis podem ser ocultadas para manter a privacidade dos clientes.
                                                    </AlertDescription>
                                                </Alert>

                                                <div className="space-y-4">
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-slate-200 rounded-xl">
                                                        <div className="flex-1">
                                                            <Label className="text-base font-semibold text-slate-900">Compartilhar nomes dos clientes</Label>
                                                            <p className="text-sm text-slate-600 mt-1">
                                                                Mostrar o nome do cliente no título do evento
                                                            </p>
                                                        </div>
                                                        <Switch
                                                            checked={config.privacySettings.shareClientNames}
                                                            onCheckedChange={(checked) =>
                                                                updateConfig({
                                                                    privacySettings: {
                                                                        ...config.privacySettings,
                                                                        shareClientNames: checked
                                                                    }
                                                                })
                                                            }
                                                        />
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-slate-200 rounded-xl">
                                                        <div className="flex-1">
                                                            <Label className="text-base font-semibold text-slate-900">Compartilhar contatos dos clientes</Label>
                                                            <p className="text-sm text-slate-600 mt-1">
                                                                Incluir telefone e email do cliente na descrição do evento
                                                            </p>
                                                        </div>
                                                        <Switch
                                                            checked={config.privacySettings.shareClientContacts}
                                                            onCheckedChange={(checked) =>
                                                                updateConfig({
                                                                    privacySettings: {
                                                                        ...config.privacySettings,
                                                                        shareClientContacts: checked
                                                                    }
                                                                })
                                                            }
                                                        />
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-slate-200 rounded-xl">
                                                        <div className="flex-1">
                                                            <Label className="text-base font-semibold text-slate-900">Compartilhar observações</Label>
                                                            <p className="text-sm text-slate-600 mt-1">
                                                                Incluir observações e notas sobre o atendimento
                                                            </p>
                                                        </div>
                                                        <Switch
                                                            checked={config.privacySettings.shareNotes}
                                                            onCheckedChange={(checked) =>
                                                                updateConfig({
                                                                    privacySettings: {
                                                                        ...config.privacySettings,
                                                                        shareNotes: checked
                                                                    }
                                                                })
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                <div className="p-4 lg:p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                                                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                                        <Globe className="w-4 h-4 text-blue-600" />
                                                        Prévia do evento no Google Calendar:
                                                    </h4>
                                                    <div className="text-sm space-y-2 bg-white p-4 rounded-lg border">
                                                        <p><strong>Título:</strong> {
                                                            config.privacySettings.shareClientNames
                                                                ? "Limpeza de Pele - Maria Silva"
                                                                : "Limpeza de Pele"
                                                        }</p>
                                                        <p><strong>Descrição:</strong></p>
                                                        <ul className="list-disc list-inside ml-2 text-slate-700 space-y-1">
                                                            <li>Procedimento: Limpeza de Pele (60 min)</li>
                                                            {config.privacySettings.shareClientContacts && (
                                                                <>
                                                                    <li>Cliente: (11) 99999-9999</li>
                                                                    <li>Email: maria@email.com</li>
                                                                </>
                                                            )}
                                                            {config.privacySettings.shareNotes && (
                                                                <li>Observações: Cliente com pele sensível</li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    {/* Configurações de Horários */}
                                    <TabsContent value="schedule" className="space-y-6">
                                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                                <CardTitle className="flex items-center gap-2">
                                                    <Clock className="w-5 h-5 text-indigo-500" />
                                                    Horários de Funcionamento
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-6 space-y-6">
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                    <div className="flex-1">
                                                        <Label className="text-base font-semibold text-slate-900">Definir horários de funcionamento</Label>
                                                        <p className="text-sm text-slate-600 mt-1">
                                                            Evitar agendamentos fora do horário comercial
                                                        </p>
                                                    </div>
                                                    <Switch
                                                        checked={config.workingHours.enabled}
                                                        onCheckedChange={(checked) =>
                                                            updateConfig({
                                                                workingHours: {
                                                                    ...config.workingHours,
                                                                    enabled: checked
                                                                }
                                                            })
                                                        }
                                                    />
                                                </div>

                                                {config.workingHours.enabled && (
                                                    <div className="space-y-6 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                            <div>
                                                                <Label className="font-medium">Horário de início</Label>
                                                                <Input
                                                                    type="time"
                                                                    value={config.workingHours.start}
                                                                    onChange={(e) =>
                                                                        updateConfig({
                                                                            workingHours: {
                                                                                ...config.workingHours,
                                                                                start: e.target.value
                                                                            }
                                                                        })
                                                                    }
                                                                    className="bg-white border-slate-200"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="font-medium">Horário de fim</Label>
                                                                <Input
                                                                    type="time"
                                                                    value={config.workingHours.end}
                                                                    onChange={(e) =>
                                                                        updateConfig({
                                                                            workingHours: {
                                                                                ...config.workingHours,
                                                                                end: e.target.value
                                                                            }
                                                                        })
                                                                    }
                                                                    className="bg-white border-slate-200"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <Label className="font-medium mb-3 block">Dias de funcionamento</Label>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                                                {dayOptions.map((day) => (
                                                                    <div key={day.value} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-slate-200">
                                                                        <input
                                                                            type="checkbox"
                                                                            id={day.value}
                                                                            checked={config.workingHours.days.includes(day.value)}
                                                                            onChange={(e) => {
                                                                                const days = e.target.checked
                                                                                    ? [...config.workingHours.days, day.value]
                                                                                    : config.workingHours.days.filter(d => d !== day.value)

                                                                                updateConfig({
                                                                                    workingHours: {
                                                                                        ...config.workingHours,
                                                                                        days
                                                                                    }
                                                                                })
                                                                            }}
                                                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                        />
                                                                        <Label htmlFor={day.value} className="text-sm font-medium cursor-pointer">
                                                                            {day.label}
                                                                        </Label>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <Alert className="border-indigo-200 bg-indigo-50">
                                                            <Clock className="h-4 w-4 text-indigo-600" />
                                                            <AlertDescription className="text-indigo-800">
                                                                <strong>Horário configurado:</strong> {config.workingHours.start} às {config.workingHours.end}, {config.workingHours.days.length} dias por semana
                                                            </AlertDescription>
                                                        </Alert>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </Tabs>
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
                                        <Button
                                            variant="outline"
                                            className="bg-white border-slate-200 hover:bg-slate-50"
                                            onClick={handleTestSync}
                                            disabled={calendarLoading}
                                        >
                                            <RefreshCw className={cn("w-4 h-4 mr-2", calendarLoading && "animate-spin")} />
                                            Testar Conexão
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="bg-white border-slate-200 hover:bg-slate-50"
                                            onClick={() => {
                                                console.log('Exportar configurações')
                                            }}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Exportar Configurações
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="bg-white border-slate-200 hover:bg-slate-50"
                                            onClick={() => {
                                                console.log('Restaurar padrões')
                                            }}
                                        >
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Restaurar Padrões
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="bg-white border-slate-200 hover:bg-slate-50"
                                            onClick={() => {
                                                console.log('Ver documentação')
                                            }}
                                        >
                                            <Users className="w-4 h-4 mr-2" />
                                            Ajuda e Suporte
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </main>
                </div>
            </div>
    )
}

export default ConfiguracaoPage