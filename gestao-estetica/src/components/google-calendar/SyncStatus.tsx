// components/google-calendar/SyncStatus.tsx
'use client'

import { useState, useEffect } from 'react'
import {
    RefreshCw,
    CheckCircle,
    AlertTriangle,
    Clock,
    Calendar,
    ExternalLink,
    RotateCw,
    X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { useGoogleCalendar } from '@/lib/hooks/useGoogleCalendar'
import { useAuthStore } from '@/store/useAuthStore'
import { formatDistance } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {useAppointments} from "@/lib/hooks/useAppointment";

interface SyncResult {
    appointmentId: string
    eventId?: string
    success: boolean
    error?: string
}

interface SyncStatusProps {
    onSyncComplete?: (results: SyncResult[]) => void
}

export default function SyncStatus({ onSyncComplete }: SyncStatusProps) {
    const [syncResults, setSyncResults] = useState<SyncResult[]>([])
    const [isSyncing, setIsSyncing] = useState(false)
    const [syncProgress, setSyncProgress] = useState(0)
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

    const { user } = useAuthStore()
    const { isAuthenticated, loading: calendarLoading } = useGoogleCalendar()
    const { getUnsyncedAppointments, syncWithGoogleCalendar } = useAppointments()

    // Buscar agendamentos não sincronizados
    const [unsyncedCount, setUnsyncedCount] = useState(0)

    useEffect(() => {
        const fetchUnsyncedCount = async () => {
            if (user && isAuthenticated) {
                const unsynced = await getUnsyncedAppointments()
                setUnsyncedCount(unsynced.length)
            }
        }

        fetchUnsyncedCount()
    }, [user, isAuthenticated, getUnsyncedAppointments])

    const handleBulkSync = async () => {
        if (!user || !isAuthenticated) return

        setIsSyncing(true)
        setSyncProgress(0)
        setSyncResults([])

        try {
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
            setSyncResults(data.results)
            setLastSyncTime(new Date())
            setUnsyncedCount(Math.max(0, unsyncedCount - data.syncedCount))

            if (onSyncComplete) {
                onSyncComplete(data.results)
            }
        } catch (error) {
            console.error('Erro na sincronização:', error)
            setSyncResults([{
                appointmentId: 'error',
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            }])
        } finally {
            setIsSyncing(false)
            setSyncProgress(100)
        }
    }

    const getSyncStatusIcon = () => {
        if (isSyncing) return <RefreshCw className="h-4 w-4 animate-spin" />
        if (unsyncedCount === 0) return <CheckCircle className="h-4 w-4 text-green-500" />
        if (unsyncedCount > 0) return <AlertTriangle className="h-4 w-4 text-yellow-500" />
        return <Clock className="h-4 w-4 text-gray-500" />
    }

    const getSyncStatusText = () => {
        if (isSyncing) return 'Sincronizando...'
        if (unsyncedCount === 0) return 'Tudo sincronizado'
        if (unsyncedCount > 0) return `${unsyncedCount} agendamento(s) pendente(s)`
        return 'Status desconhecido'
    }

    const getSyncStatusVariant = () => {
        if (unsyncedCount === 0) return 'secondary'
        if (unsyncedCount > 0) return 'outline'
        return 'secondary'
    }

    if (calendarLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center p-8">
                    <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                        <span>Carregando status...</span>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!isAuthenticated) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5" />
                        <span>Sincronização</span>
                    </CardTitle>
                    <CardDescription>
                        Conecte sua conta do Google Calendar para sincronizar agendamentos
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Google Calendar não está conectado. Vá para as configurações para conectar sua conta.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <RotateCw className="h-5 w-5" />
                            <CardTitle>Status da Sincronização</CardTitle>
                        </div>
                        <Badge variant={getSyncStatusVariant()}>
                            {getSyncStatusIcon()}
                            <span className="ml-1">{getSyncStatusText()}</span>
                        </Badge>
                    </div>
                    <CardDescription>
                        Mantenha seus agendamentos sincronizados com o Google Calendar
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {isSyncing && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span>Sincronizando agendamentos...</span>
                                <span>{Math.round(syncProgress)}%</span>
                            </div>
                            <Progress value={syncProgress} className="w-full" />
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex items-center space-x-2">
                                <Calendar className="h-5 w-5 text-blue-600" />
                                <span className="font-medium text-blue-900">Total</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-900 mt-1">
                                {unsyncedCount + (syncResults.filter(r => r.success).length)}
                            </p>
                            <p className="text-sm text-blue-700">Agendamentos</p>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4">
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="font-medium text-green-900">Sincronizados</span>
                            </div>
                            <p className="text-2xl font-bold text-green-900 mt-1">
                                {syncResults.filter(r => r.success).length}
                            </p>
                            <p className="text-sm text-green-700">Com sucesso</p>
                        </div>

                        <div className="bg-yellow-50 rounded-lg p-4">
                            <div className="flex items-center space-x-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                <span className="font-medium text-yellow-900">Pendentes</span>
                            </div>
                            <p className="text-2xl font-bold text-yellow-900 mt-1">
                                {unsyncedCount}
                            </p>
                            <p className="text-sm text-yellow-700">Não sincronizados</p>
                        </div>
                    </div>

                    {lastSyncTime && (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Clock className="h-4 w-4" />
                                <span>
                  Última sincronização: {formatDistance(lastSyncTime, new Date(), {
                                    addSuffix: true,
                                    locale: ptBR
                                })}
                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                            onClick={handleBulkSync}
                            disabled={isSyncing || unsyncedCount === 0}
                            className="flex-1"
                        >
                            {isSyncing ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Sincronizando...
                                </>
                            ) : (
                                <>
                                    <RotateCw className="h-4 w-4 mr-2" />
                                    Sincronizar Agendamentos
                                </>
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => window.open('https://calendar.google.com', '_blank')}
                            className="flex-1"
                        >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Abrir Google Calendar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {syncResults.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Resultados da Sincronização</CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSyncResults([])}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {syncResults.map((result, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center justify-between p-3 rounded-lg border ${
                                        result.success
                                            ? 'bg-green-50 border-green-200'
                                            : 'bg-red-50 border-red-200'
                                    }`}
                                >
                                    <div className="flex items-center space-x-2">
                                        {result.success ? (
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <X className="h-4 w-4 text-red-600" />
                                        )}
                                        <span className="text-sm font-medium">
                      Agendamento {result.appointmentId.slice(0, 8)}
                    </span>
                                    </div>

                                    <div className="text-right">
                                        {result.success ? (
                                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                                                Sincronizado
                                            </Badge>
                                        ) : (
                                            <div className="space-y-1">
                                                <Badge variant="destructive">Erro</Badge>
                                                {result.error && (
                                                    <p className="text-xs text-red-600 max-w-xs truncate">
                                                        {result.error}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}