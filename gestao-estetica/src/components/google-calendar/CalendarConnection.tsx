'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
    Calendar as GoogleCalendarIcon,
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCw,
    Settings,
    Shield,
    Zap,
    Clock,
    Users,
    Link as LinkIcon,
    Unlink,
    ExternalLink
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils/utils'
import { useGoogleCalendar } from '@/lib/hooks/useGoogleCalendar'
import { useAuthStore } from '@/store/useAuthStore'
import { toast } from 'sonner'

interface CalendarConnectionProps {
    onConnectionChange?: (connected: boolean) => void
    onError?: (error: string) => void
    className?: string
}

const CalendarConnection: React.FC<CalendarConnectionProps> = ({
                                                                   onConnectionChange,
                                                                   onError,
                                                                   className
                                                               }) => {
    const { user, userProfile } = useAuthStore()
    const {
        loading,
        error,
        isAuthenticated,
        events,
        checkAuthentication,
        startAuthentication,
        disconnect,
        refreshEvents,
        clearError
    } = useGoogleCalendar()

    const [connectionProgress, setConnectionProgress] = useState(0)
    const [lastSync, setLastSync] = useState<Date | null>(null)
    const [syncStats, setSyncStats] = useState({
        totalEvents: 0,
        syncedEvents: 0,
        failedEvents: 0,
        lastSyncDuration: 0
    })

    // Verificar autenticação inicial
    useEffect(() => {
        if (user && userProfile) {
            checkAuthentication()
        }
    }, [user, userProfile, checkAuthentication])

    // Notificar mudanças de conexão
    useEffect(() => {
        onConnectionChange?.(isAuthenticated)
    }, [isAuthenticated, onConnectionChange])

    // Notificar erros
    useEffect(() => {
        if (error) {
            onError?.(error)
            toast.error(error)
        }
    }, [error, onError])

    // Calcular estatísticas quando eventos mudarem
    useEffect(() => {
        if (events.length > 0) {
            setSyncStats(prev => ({
                ...prev,
                totalEvents: events.length,
                syncedEvents: events.length,
                failedEvents: 0
            }))
            setLastSync(new Date())
        }
    }, [events])

    const handleConnect = async () => {
        try {
            clearError()
            setConnectionProgress(0)

            // Simular progresso de conexão
            const progressInterval = setInterval(() => {
                setConnectionProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval)
                        return prev
                    }
                    return prev + 10
                })
            }, 200)

            const success = await startAuthentication()

            clearInterval(progressInterval)
            setConnectionProgress(100)

            if (!success) {
                toast.error('Falha ao iniciar autenticação')
                setConnectionProgress(0)
            } else {
                toast.success('Redirecionando para autenticação...')
            }
        } catch (error) {
            setConnectionProgress(0)
            toast.error('Erro ao conectar com Google Calendar')
        }
    }

    const handleDisconnect = async () => {
        if (!window.confirm('Tem certeza que deseja desconectar o Google Calendar?')) {
            return
        }

        try {
            const success = await disconnect()
            if (success) {
                toast.success('Google Calendar desconectado com sucesso')
                setSyncStats({
                    totalEvents: 0,
                    syncedEvents: 0,
                    failedEvents: 0,
                    lastSyncDuration: 0
                })
                setLastSync(null)
            } else {
                toast.error('Erro ao desconectar Google Calendar')
            }
        } catch (error) {
            toast.error('Erro ao desconectar')
        }
    }

    const handleTestConnection = async () => {
        try {
            clearError()
            const startTime = Date.now()

            await refreshEvents()

            const duration = (Date.now() - startTime) / 1000
            setSyncStats(prev => ({
                ...prev,
                lastSyncDuration: duration
            }))
            setLastSync(new Date())

            toast.success('Teste de conexão realizado com sucesso')
        } catch (error) {
            toast.error('Falha no teste de conexão')
        }
    }

    const handleSyncAppointments = async () => {
        if (!user) return

        try {
            clearError()

            const response = await fetch('/api/calendar/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId: user.id })
            })

            if (!response.ok) {
                throw new Error('Erro na sincronização')
            }

            const data = await response.json()

            toast.success(`${data.syncedCount} agendamentos sincronizados`)
            await refreshEvents()
        } catch (error) {
            toast.error('Erro ao sincronizar agendamentos')
        }
    }

    const getConnectionStatusBadge = () => {
        if (loading) {
            return (
                <Badge variant="secondary" className="flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    {connectionProgress > 0 ? 'Conectando...' : 'Verificando...'}
                </Badge>
            )
        }

        if (error) {
            return (
                <Badge variant="destructive" className="flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    Erro
                </Badge>
            )
        }

        if (isAuthenticated) {
            return (
                <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3" />
                    Conectado
                </Badge>
            )
        }

        return (
            <Badge variant="secondary" className="flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                Desconectado
            </Badge>
        )
    }

    const renderConnectedView = () => (
        <div className="space-y-4">
            {/* Info da conexão */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <GoogleCalendarIcon className="w-5 h-5 text-green-600" />
                        <div>
                            <p className="font-medium text-green-900">
                                Calendário Principal
                            </p>
                            <p className="text-sm text-green-700">
                                {userProfile?.email || user?.email}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        {getConnectionStatusBadge()}
                        <p className="text-xs text-green-600 mt-1">
                            Sincronizado
                        </p>
                    </div>
                </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">
                        {syncStats.totalEvents}
                    </div>
                    <div className="text-sm text-blue-700">Total de Eventos</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                        {syncStats.syncedEvents}
                    </div>
                    <div className="text-sm text-green-700">Sincronizados</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-lg font-bold text-red-600">
                        {syncStats.failedEvents}
                    </div>
                    <div className="text-sm text-red-700">Falhas</div>
                </div>
            </div>

            {/* Última sincronização */}
            {lastSync && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Última sincronização:</span>
                    </div>
                    <div className="text-right text-sm">
                        <p className="font-medium">
                            {format(lastSync, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                        {syncStats.lastSyncDuration > 0 && (
                            <p className="text-gray-500">
                                {syncStats.lastSyncDuration.toFixed(1)}s
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Ações */}
            <div className="grid grid-cols-2 gap-2">
                <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={loading}
                    className="flex items-center gap-2"
                >
                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    Testar Conexão
                </Button>
                <Button
                    variant="outline"
                    onClick={handleSyncAppointments}
                    disabled={loading}
                    className="flex items-center gap-2"
                >
                    <Users className="w-4 h-4" />
                    Sincronizar Agendamentos
                </Button>
                <Button
                    variant="outline"
                    onClick={() => window.open('https://calendar.google.com', '_blank')}
                    className="flex items-center gap-2"
                >
                    <ExternalLink className="w-4 h-4" />
                    Abrir Google Calendar
                </Button>
                <Button
                    variant="destructive"
                    onClick={handleDisconnect}
                    disabled={loading}
                    className="flex items-center gap-2"
                >
                    <Unlink className="w-4 h-4" />
                    Desconectar
                </Button>
            </div>
        </div>
    )

    const renderDisconnectedView = () => (
        <div className="space-y-4">
            <div className="text-center py-8">
                <GoogleCalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Google Calendar não conectado
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Conecte sua conta do Google Calendar para sincronizar agendamentos
                    automaticamente e enviar convites profissionais para seus clientes.
                </p>

                {/* Progresso da conexão */}
                {loading && connectionProgress > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Conectando ao Google Calendar...</span>
                        </div>
                        <Progress value={connectionProgress} className="max-w-sm mx-auto" />
                    </div>
                )}

                <Button
                    onClick={handleConnect}
                    disabled={loading}
                    size="lg"
                    className="flex items-center gap-2"
                >
                    <LinkIcon className="w-4 h-4" />
                    {loading ? 'Conectando...' : 'Conectar Google Calendar'}
                </Button>
            </div>

            {/* Benefícios */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg text-center">
                    <Zap className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <h4 className="font-medium mb-1">Sincronização Automática</h4>
                    <p className="text-sm text-gray-600">
                        Agendamentos sincronizados em tempo real
                    </p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                    <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <h4 className="font-medium mb-1">Convites Profissionais</h4>
                    <p className="text-sm text-gray-600">
                        Clientes recebem convites via Google
                    </p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                    <Shield className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <h4 className="font-medium mb-1">Segurança Google</h4>
                    <p className="text-sm text-gray-600">
                        Dados protegidos pelo Google
                    </p>
                </div>
            </div>
        </div>
    )

    const renderErrorView = () => (
        <div className="space-y-4">
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    <div className="space-y-2">
                        <p className="font-medium">Erro de conexão</p>
                        <p>{error}</p>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={handleConnect} disabled={loading}>
                                Tentar Novamente
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={clearError}
                            >
                                Limpar Erro
                            </Button>
                        </div>
                    </div>
                </AlertDescription>
            </Alert>

            {/* Dicas de resolução */}
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-800 mb-2">Possíveis soluções:</h4>
                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                    <li>Verifique sua conexão com a internet</li>
                    <li>Certifique-se de que tem permissão para acessar o Google Calendar</li>
                    <li>Tente desabilitar bloqueadores de popup</li>
                    <li>Verifique se o Google Calendar está funcionando normalmente</li>
                    <li>Se o problema persistir, tente reconectar sua conta</li>
                </ul>
            </div>

            {/* Status de serviços do Google */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Status dos serviços Google:</span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open('https://status.cloud.google.com/', '_blank')}
                >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Verificar
                </Button>
            </div>
        </div>
    )

    const renderSettingsButton = () => (
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurações
        </Button>
    )

    return (
        <Card className={cn("w-full", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                    <GoogleCalendarIcon className="w-5 h-5" />
                    Google Calendar
                </CardTitle>
                <div className="flex items-center gap-2">
                    {getConnectionStatusBadge()}
                    {isAuthenticated && renderSettingsButton()}
                </div>
            </CardHeader>
            <CardContent>
                {error ? renderErrorView() :
                    isAuthenticated ? renderConnectedView() :
                        renderDisconnectedView()}
            </CardContent>
        </Card>
    )
}

export default CalendarConnection