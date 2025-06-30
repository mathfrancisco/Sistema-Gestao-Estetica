'use client'

import React, { useState, useEffect } from 'react'
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
    TrendingUp
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils/utils'

interface SyncOperation {
    id: string
    type: 'system_to_google' | 'google_to_system' | 'bidirectional'
    status: 'running' | 'completed' | 'failed' | 'queued'
    startTime: Date
    endTime?: Date
    progress: number
    details: {
        totalItems: number
        processedItems: number
        successItems: number
        failedItems: number
        currentItem?: string
    }
    error?: string
}

interface SyncMetrics {
    totalSyncs: number
    successfulSyncs: number
    failedSyncs: number
    averageDuration: number
    lastSuccessfulSync?: Date
    uptime: number
    eventsInSync: number
    eventsOutOfSync: number
}

interface CalendarSyncProps {
    autoRefresh?: boolean
    onSyncTrigger?: () => Promise<void>
    onToggleAutoSync?: (enabled: boolean) => Promise<void>
    className?: string
}

const CalendarSync: React.FC<CalendarSyncProps> = ({
                                                       autoRefresh = true,
                                                       onSyncTrigger,
                                                       onToggleAutoSync,
                                                       className
                                                   }) => {
    const [currentOperation, setCurrentOperation] = useState<SyncOperation | null>(null)
    const [recentOperations, setRecentOperations] = useState<SyncOperation[]>([])
    const [metrics, setMetrics] = useState<SyncMetrics>({
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        averageDuration: 0,
        uptime: 95.8,
        eventsInSync: 0,
        eventsOutOfSync: 0
    })
    const [autoSyncEnabled, setAutoSyncEnabled] = useState(true)
    const [isLoading, setIsLoading] = useState(false)

    // Simular dados de sincronização
    useEffect(() => {
        const loadSyncData = () => {
            const mockMetrics: SyncMetrics = {
                totalSyncs: 247,
                successfulSyncs: 241,
                failedSyncs: 6,
                averageDuration: 3.2,
                lastSuccessfulSync: new Date(Date.now() - 15 * 60 * 1000), // 15 minutos atrás
                uptime: 97.6,
                eventsInSync: 156,
                eventsOutOfSync: 3
            }

            const mockOperations: SyncOperation[] = [
                {
                    id: '1',
                    type: 'bidirectional',
                    status: 'completed',
                    startTime: new Date(Date.now() - 15 * 60 * 1000),
                    endTime: new Date(Date.now() - 14 * 60 * 1000 - 30 * 1000),
                    progress: 100,
                    details: {
                        totalItems: 12,
                        processedItems: 12,
                        successItems: 12,
                        failedItems: 0
                    }
                },
                {
                    id: '2',
                    type: 'system_to_google',
                    status: 'completed',
                    startTime: new Date(Date.now() - 45 * 60 * 1000),
                    endTime: new Date(Date.now() - 44 * 60 * 1000),
                    progress: 100,
                    details: {
                        totalItems: 5,
                        processedItems: 5,
                        successItems: 4,
                        failedItems: 1
                    }
                },
                {
                    id: '3',
                    type: 'google_to_system',
                    status: 'failed',
                    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
                    endTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30 * 1000),
                    progress: 30,
                    details: {
                        totalItems: 8,
                        processedItems: 2,
                        successItems: 0,
                        failedItems: 2
                    },
                    error: 'Token de acesso expirado'
                }
            ]

            setMetrics(mockMetrics)
            setRecentOperations(mockOperations)
        }

        loadSyncData()

        // Auto-refresh se habilitado
        if (autoRefresh) {
            const interval = setInterval(loadSyncData, 30000) // 30 segundos
            return () => clearInterval(interval)
        }
    }, [autoRefresh])

    // Simular operação de sincronização em andamento
    const simulateSync = async () => {
        const operation: SyncOperation = {
            id: Date.now().toString(),
            type: 'bidirectional',
            status: 'running',
            startTime: new Date(),
            progress: 0,
            details: {
                totalItems: 15,
                processedItems: 0,
                successItems: 0,
                failedItems: 0
            }
        }

        setCurrentOperation(operation)
        setIsLoading(true)

        // Simular progresso
        for (let i = 0; i <= 15; i++) {
            await new Promise(resolve => setTimeout(resolve, 200))

            const updatedOperation: SyncOperation = {
                ...operation,
                progress: (i / 15) * 100,
                details: {
                    ...operation.details,
                    processedItems: i,
                    successItems: Math.max(0, i - Math.floor(Math.random() * 2)),
                    failedItems: Math.floor(Math.random() * 2),
                    currentItem: i < 15 ? `Evento ${i + 1}` : undefined
                }
            }

            if (i === 15) {
                updatedOperation.status = 'completed'
                updatedOperation.endTime = new Date()
            }

            setCurrentOperation(updatedOperation)
        }

        // Adicionar à lista de operações recentes
        setRecentOperations(prev => [operation, ...prev.slice(0, 4)])
        setCurrentOperation(null)
        setIsLoading(false)

        // Atualizar métricas
        setMetrics(prev => ({
            ...prev,
            totalSyncs: prev.totalSyncs + 1,
            successfulSyncs: prev.successfulSyncs + 1,
            lastSuccessfulSync: new Date(),
            eventsInSync: prev.eventsInSync + 3
        }))
    }

    const handleManualSync = async () => {
        try {
            await onSyncTrigger?.()
            await simulateSync()
        } catch (error) {
            console.error('Erro na sincronização manual:', error)
        }
    }

    const handleToggleAutoSync = async () => {
        try {
            const newState = !autoSyncEnabled
            await onToggleAutoSync?.(newState)
            setAutoSyncEnabled(newState)
        } catch (error) {
            console.error('Erro ao alterar auto-sync:', error)
        }
    }

    const getStatusIcon = (status: SyncOperation['status']) => {
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

    const getTypeLabel = (type: SyncOperation['type']) => {
        switch (type) {
            case 'bidirectional':
                return 'Bidirecional'
            case 'system_to_google':
                return 'Sistema → Google'
            case 'google_to_system':
                return 'Google → Sistema'
            default:
                return 'Desconhecido'
        }
    }

    const getStatusBadge = (status: SyncOperation['status']) => {
        const config = {
            running: { label: 'Em Andamento', variant: 'secondary' as const },
            completed: { label: 'Concluído', variant: 'default' as const },
            failed: { label: 'Falha', variant: 'destructive' as const },
            queued: { label: 'Na Fila', variant: 'secondary' as const }
        }

        const { label, variant } = config[status] || config.queued
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

                    {/* Uptime */}
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg mb-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-900">Disponibilidade do serviço:</span>
                        </div>
                        <span className="font-bold text-green-600">{metrics.uptime}%</span>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2">
                        <Button
                            onClick={handleManualSync}
                            disabled={isLoading || !!currentOperation}
                            className="flex-1"
                        >
                            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                            Sincronizar Agora
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => window.location.reload()}
                            className="flex-1"
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
                                                onClick={() => handleManualSync()}
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
                            <Button size="sm" onClick={handleManualSync} className="mt-2">
                                Sincronizar Agora
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    )
}

export default CalendarSync