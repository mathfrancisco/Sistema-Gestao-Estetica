'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
    Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import Link from 'next/link'
import { useGoogleCalendar } from '@/lib/hooks/useGoogleCalendar'
import { useAuthStore } from '@/store/useAuthStore'
import CalendarSync from '@/components/calendar/CalendarSync'

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

    const { user, userProfile, hasGoogleCalendar, refreshProfile } = useAuthStore()

    const {
        isAuthenticated,
        loading: calendarLoading,
        error: calendarError,
        startAuthentication,
        disconnect,
        refreshEvents,
        clearError
    } = useGoogleCalendar()

    // Carregamento inicial das configurações
    useEffect(() => {
        // Em produção, carregar configurações salvas do usuário
        if (userProfile?.google_calendar_settings) {
            try {
                const savedConfig = userProfile.google_calendar_settings as any
                setConfig(prev => ({ ...prev, ...savedConfig }))
            } catch (error) {
                console.error('Erro ao carregar configurações:', error)
            }
        }
    }, [userProfile])

    const handleConnect = async () => {
        try {
            const success = await startAuthentication()
            if (success) {
                // Aguardar um pouco para o redirect acontecer
                setTimeout(() => {
                    refreshProfile()
                }, 1000)
            }
        } catch (error) {
            console.error('Erro ao conectar:', error)
        }
    }

    const handleDisconnect = async () => {
        if (!window.confirm('Tem certeza que deseja desconectar o Google Calendar? Todos os eventos sincronizados permanecerão, mas a sincronização automática será interrompida.')) {
            return
        }

        try {
            const success = await disconnect()
            if (success) {
                await refreshProfile()
            }
        } catch (error) {
            console.error('Erro ao desconectar:', error)
        }
    }

    const handleSaveSettings = async () => {
        setIsSaving(true)
        setSaveError(null)

        try {
            // Em produção, salvar no Supabase
            // await supabase
            //   .from('business_profile')
            //   .update({
            //     google_calendar_settings: config
            //   })
            //   .eq('user_id', user!.id)

            console.log('Configurações salvas:', config)

            // Simular delay
            await new Promise(resolve => setTimeout(resolve, 1000))

        } catch (error) {
            setSaveError('Erro ao salvar configurações')
            console.error('Erro ao salvar configurações:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleTestSync = async () => {
        try {
            await refreshEvents()
        } catch (error) {
            console.error('Erro no teste de sincronização:', error)
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

    if (calendarLoading && !userProfile) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        )
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
                        <h1 className="text-3xl font-bold text-gray-900">Configurações do Google Calendar</h1>
                        <p className="text-gray-600 mt-1">
                            Gerencie a integração e sincronização com o Google Calendar
                        </p>
                    </div>
                </div>
            </div>

            {/* Status da Conexão */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GoogleCalendarIcon className="w-5 h-5" />
                        Status da Conexão
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {hasGoogleCalendar() && isAuthenticated ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <div>
                                        <p className="font-medium text-green-900">Conectado ao Google Calendar</p>
                                        <p className="text-sm text-green-700">
                                            {userProfile?.email} • Calendário Principal
                                        </p>
                                    </div>
                                </div>
                                <Button variant="outline" onClick={handleDisconnect} disabled={calendarLoading}>
                                    <Unlink className="w-4 h-4 mr-2" />
                                    Desconectar
                                </Button>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleTestSync}
                                    disabled={calendarLoading}
                                    className="flex-1"
                                >
                                    <RefreshCw className={cn("w-4 h-4 mr-2", calendarLoading && "animate-spin")} />
                                    Testar Sincronização
                                </Button>
                                <Button
                                    onClick={handleSaveSettings}
                                    disabled={isSaving}
                                    className="flex-1"
                                >
                                    {isSaving ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        'Salvar Configurações'
                                    )}
                                </Button>
                            </div>

                            {saveError && (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{saveError}</AlertDescription>
                                </Alert>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div className="flex items-center gap-3">
                                    <XCircle className="w-5 h-5 text-yellow-600" />
                                    <div>
                                        <p className="font-medium text-yellow-900">Google Calendar não conectado</p>
                                        <p className="text-sm text-yellow-700">
                                            Conecte sua conta para sincronizar agendamentos automaticamente
                                        </p>
                                    </div>
                                </div>
                                <Button onClick={handleConnect} disabled={calendarLoading}>
                                    <LinkIcon className="w-4 h-4 mr-2" />
                                    {calendarLoading ? 'Conectando...' : 'Conectar'}
                                </Button>
                            </div>

                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Ao conectar o Google Calendar, você poderá:
                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                        <li>Sincronizar agendamentos automaticamente</li>
                                        <li>Enviar convites profissionais para clientes</li>
                                        <li>Receber confirmações via Google Calendar</li>
                                        <li>Acessar agendamentos em qualquer dispositivo</li>
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}

                    {/* Mostrar erro se houver */}
                    {calendarError && (
                        <Alert className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <div className="flex items-center justify-between">
                                    <span>{calendarError}</span>
                                    <Button variant="outline" size="sm" onClick={clearError}>
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
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="sync">Sincronização</TabsTrigger>
                        <TabsTrigger value="notifications">Notificações</TabsTrigger>
                        <TabsTrigger value="privacy">Privacidade</TabsTrigger>
                        <TabsTrigger value="schedule">Horários</TabsTrigger>
                    </TabsList>

                    {/* Configurações de Sincronização */}
                    <TabsContent value="sync" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <RefreshCw className="w-5 h-5" />
                                    Configurações de Sincronização
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-base font-medium">Sincronização Automática</Label>
                                        <p className="text-sm text-gray-600">
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
                                    <div className="space-y-4">
                                        <div>
                                            <Label>Intervalo de Sincronização</Label>
                                            <Select
                                                value={config.syncInterval.toString()}
                                                onValueChange={(value) =>
                                                    updateConfig({ syncInterval: parseInt(value) })
                                                }
                                            >
                                                <SelectTrigger className="w-full">
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
                                            <Label>Direção da Sincronização</Label>
                                            <Select
                                                value={config.syncDirection}
                                                onValueChange={(value: any) =>
                                                    updateConfig({ syncDirection: value })
                                                }
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="bidirectional">Bidirecional (Sistema ↔ Google)</SelectItem>
                                                    <SelectItem value="system_to_google">Sistema → Google apenas</SelectItem>
                                                    <SelectItem value="google_to_system">Google → Sistema apenas</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {config.syncDirection === 'bidirectional' &&
                                                    'Eventos são sincronizados em ambas as direções'}
                                                {config.syncDirection === 'system_to_google' &&
                                                    'Apenas eventos criados no sistema vão para o Google'}
                                                {config.syncDirection === 'google_to_system' &&
                                                    'Apenas eventos do Google vêm para o sistema'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Componente de sincronização detalhada */}
                        <CalendarSync />
                    </TabsContent>

                    {/* Configurações de Notificações */}
                    <TabsContent value="notifications" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="w-5 h-5" />
                                    Configurações de Notificações
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-base font-medium">Notificações do Google Calendar</Label>
                                        <p className="text-sm text-gray-600">
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
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label>Lembrete por Email</Label>
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
                                                        <Label className="text-sm">Minutos antes</Label>
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
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label>Lembrete Popup</Label>
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
                                                        <Label className="text-sm">Minutos antes</Label>
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
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    Configurações de Privacidade
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Configure quais informações serão compartilhadas nos eventos do Google Calendar.
                                        Informações sensíveis podem ser ocultadas para manter a privacidade dos clientes.
                                    </AlertDescription>
                                </Alert>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label className="text-base font-medium">Compartilhar nomes dos clientes</Label>
                                            <p className="text-sm text-gray-600">
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

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label className="text-base font-medium">Compartilhar contatos dos clientes</Label>
                                            <p className="text-sm text-gray-600">
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

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label className="text-base font-medium">Compartilhar observações</Label>
                                            <p className="text-sm text-gray-600">
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

                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <h4 className="font-medium text-blue-900 mb-2">Exemplo de evento no Google Calendar:</h4>
                                    <div className="text-sm space-y-1">
                                        <p><strong>Título:</strong> {
                                            config.privacySettings.shareClientNames
                                                ? "Limpeza de Pele - Maria Silva"
                                                : "Limpeza de Pele"
                                        }</p>
                                        <p><strong>Descrição:</strong></p>
                                        <ul className="list-disc list-inside ml-2 text-blue-700">
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
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    Horários de Funcionamento
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-base font-medium">Definir horários de funcionamento</Label>
                                        <p className="text-sm text-gray-600">
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
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Horário de início</Label>
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
                                                />
                                            </div>
                                            <div>
                                                <Label>Horário de fim</Label>
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
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label>Dias de funcionamento</Label>
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                {dayOptions.map((day) => (
                                                    <div key={day.value} className="flex items-center space-x-2">
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
                                                            className="rounded border-gray-300"
                                                        />
                                                        <Label htmlFor={day.value} className="text-sm">
                                                            {day.label}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    )
}

export default ConfiguracaoPage