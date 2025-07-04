'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    RefreshCw,
    CheckCircle,
    XCircle,
    AlertCircle,
    Clock,
    ArrowUpDown,
    Calendar,
    Zap,
    Pause,
    Play,
    RotateCcw,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils/utils'
import { useRealCalendarSync } from '@/lib/hooks/useRealCalendarSync'
import { toast } from 'sonner'

interface RealSyncStatusProps {
    autoRefresh?: boolean
    onToggleAutoSync?: (enabled: boolean) => Promise<void>
    className?: string
}

const RealSyncStatus: React.FC<RealSyncStatusProps> = ({
                                                           autoRefresh = true,
                                                           onToggleAutoSync,
                                                           className
                                                       }) => {
    const [autoSyncEnabled, setAutoSyncEnabled] = useState(true)

    const {
        currentOperation,
        recentOperations,
        metrics,
        loading,
        error,
        syncAllAppointments,
        loadSyncMetrics,
        clearError
    } = useRealCalendarSync(autoRefresh)

    const handleManualSync = async () => {
        try {
            const result = await syncAllAppointments()

            if (result) {
                const { syncedCount, results } = result
                const failedCount = results.filter(r => !r.success).length

                if (syncedCount > 0) {
                    toast.success(`${syncedCount} agendamento(s) sincronizado(s) com sucesso!`)
                }

                if (failedCount > 0) {
                    toast.warning(`${failedCount} agendamento(s) falharam na sincronização`)
                }
            } else {
                toast.error('Erro na sincronização')
            }
        } catch (error) {
            toast.error('Erro ao executar sincronização')
        }
    }

    const handleToggleAutoSync = async () => {
        try {
            const newState = !autoSyncEnabled
            await onToggleAutoSync?.(newState)
            setAutoSyncEnabled(newState)
            toast.success(`Auto-sincronização ${newState ? 'ativada' : 'desativada'}`)
        } catch (error) {
            toast.error('Erro ao alterar auto-sincronização')
        }
    }

    const handleRefreshStatus = async () => {
        try {
            await loadSyncMetrics()
            toast.success('Status atualizado')
        } catch (error) {
            toast.error('Erro ao atualizar status')
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'running':
                return <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-green-600" />
            case 'failed':
                return <XCircle className="w-4 h-4 text-red-600" />
            case 'queued':
                return <Clock className="w-4 h-4 text-yellow-600" />
            default:
                return <AlertCircle className="w-4 h-4 text-gray-400" />
        }
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'sync_to_google':
                return 'Sistema → Google'
            case 'manual_sync':
                return 'Sincronização Manual'
            default:
                return 'Sincronização'
        }
    }

    const getStatusBadge = (status: string) => {
        const config = {
            running: { label: 'Em Andamento', variant: 'secondary' as const },
            completed: { label: 'Concluído', variant: 'default' as const },
            failed: { label: 'Falha', variant: 'destructive' as const },
            queued: { label: 'Na Fila', variant: 'secondary' as const }
        }

        const { label, variant } = config[status as keyof typeof config] || config.queued
        return <Badge variant={variant}>{label}</Badge>
    }

    const getSuccessRate = () => {
        if (metrics.totalSyncs === 0) return 0
        return (metrics.successfulSyncs / metrics.totalSyncs) * 100
    }

    const getSyncHealthColor = () => {
        const rate = getSuccessRate()
        if (rate >= 95) return 'text-green-600'
        if (rate >= 85) return 'text-yellow-600'
        return 'text-red-600'
    }

    // Mostrar erro se existir
    if (error) {
        return (
            <div className={cn("space-y-6", className)}>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        <div className="space-y-2">
                            <p className="font-medium">Erro na sincronização</p>
                            <p>{error}</p>
                            <div className="flex gap-2">
                                <Button size="sm" onClick={clearError}>
                                    Fechar
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleRefreshStatus}>
                                    Tentar Novamente
                                </Button>
                            </div>
                        </div>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className={cn("space-y-6", className)}>
            {/* Status Geral */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <ArrowUpDown className="w-5 h-5" />
                            Status de Sincronização
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Badge variant={autoSyncEnabled ? "default" : "secondary"}>
                                {autoSyncEnabled ? 'Auto-sync Ativo' : 'Auto-sync Inativo'}
                            </Badge>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleToggleAutoSync}
                            >
                                {autoSyncEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Métricas Principais */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                                {metrics.eventsInSync}
                            </div>
                            <div className="text-sm text-blue-700">Eventos Sincronizados</div>
                        </div>
                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-600">
                                {metrics.eventsOutOfSync}
                            </div>
                            <div className="text-sm text-yellow-700">Fora de Sincronia</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className={cn("text-2xl font-bold", getSyncHealthColor())}>
                                {getSuccessRate().toFixed(1)}%
                            </div>
                            <div className="text-sm text-green-700">Taxa de Sucesso</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                                {metrics.averageDuration.toFixed(1)}s
                            </div>
                            <div className="text-sm text-purple-700">Tempo Médio</div>
                        </div>
                    </div>

                    {/* Última Sincronização */}
                    {metrics.lastSuccessfulSync && (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium">Última sincronização:</span>
                            </div>
                            <div className="text-right text-sm">
                                <p className="font-medium">
                                    {format(metrics.lastSuccessfulSync, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                                <p className="text-gray-500">
                                    {formatDistanceToNow(metrics.lastSuccessfulSync, {
                                        addSuffix: true,
                                        locale: ptBR
                                    })}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Ações */}
                    <div className="flex gap-2">
                        <Button
                            onClick={handleManualSync}
                            disabled={loading || !!currentOperation}
                            className="flex-1"
                        >
                            <RefreshCw className={cn("w-4 h-4 mr-2", (loading || currentOperation) && "animate-spin")} />
                            {currentOperation ? 'Sincronizando...' : 'Sincronizar Agora'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleRefreshStatus}
                            className="flex-1"
                            disabled={loading}
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Atualizar Status
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Operação Atual */}
            {currentOperation && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="w-5 h-5" />
                            Sincronização em Andamento
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {getStatusIcon(currentOperation.status)}
                                <span className="font-medium">
                                    {getTypeLabel(currentOperation.type)}
                                </span>
                            </div>
                            <div className="text-sm text-gray-600">
                                {currentOperation.details.processedItems} / {currentOperation.details.totalItems}
                            </div>
                        </div>

                        <Progress value={currentOperation.progress} className="w-full" />

                        {currentOperation.details.currentItem && (
                            <p className="text-sm text-gray-600">
                                Processando: {currentOperation.details.currentItem}
                            </p>
                        )}

                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="font-medium text-green-600">
                                    {currentOperation.details.successItems}
                                </div>
                                <div className="text-xs text-gray-500">Sucessos</div>
                            </div>
                            <div>
                                <div className="font-medium text-red-600">
                                    {currentOperation.details.failedItems}
                                </div>
                                <div className="text-xs text-gray-500">Falhas</div>
                            </div>
                            <div>
                                <div className="font-medium text-blue-600">
                                    {Math.round(currentOperation.progress)}%
                                </div>
                                <div className="text-xs text-gray-500">Progresso</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Histórico de Operações */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Operações Recentes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {recentOperations.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhuma operação de sincronização recente</p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={handleManualSync}
                                disabled={loading || !!currentOperation}
                            >
                                Iniciar primeira sincronização
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentOperations.map((operation) => (
                                <div
                                    key={operation.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {getStatusIcon(operation.status)}
                                        <div>
                                            <p className="font-medium text-sm">
                                                {getTypeLabel(operation.type)}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span>
                                                    {format(operation.startTime, 'dd/MM HH:mm', { locale: ptBR })}
                                                </span>
                                                {operation.endTime && (
                                                    <span>
                                                        Duração: {Math.round((operation.endTime.getTime() - operation.startTime.getTime()) / 1000)}s
                                                    </span>
                                                )}
                                                <span>
                                                    {operation.details.successItems}/{operation.details.totalItems} sucessos
                                                </span>
                                            </div>
                                            {operation.error && (
                                                <p className="text-xs text-red-600 mt-1">{operation.error}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(operation.status)}
                                        {operation.status === 'failed' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleManualSync}
                                                disabled={loading || !!currentOperation}
                                            >
                                                <RotateCcw className="w-3 h-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Alertas */}
            {metrics.eventsOutOfSync > 0 && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        <div className="space-y-1">
                            <p className="font-medium">Eventos fora de sincronia detectados</p>
                            <p>
                                Existem {metrics.eventsOutOfSync} eventos que não estão sincronizados entre o sistema e o Google Calendar.
                            </p>
                            <Button
                                size="sm"
                                onClick={handleManualSync}
                                className="mt-2"
                                disabled={loading || !!currentOperation}
                            >
                                Sincronizar Agora
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    )
}

export default RealSyncStatus