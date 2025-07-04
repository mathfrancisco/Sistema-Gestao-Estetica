// lib/hooks/useRealCalendarSync.ts
'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { CalendarSyncService, SyncResult, SyncResponse } from '@/lib/google-calendar/sync'
import { AppointmentService } from '@/lib/services/appointment.service'

export interface SyncOperation {
    id: string
    type: 'sync_to_google' | 'manual_sync'
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

export interface SyncMetrics {
    totalSyncs: number
    successfulSyncs: number
    failedSyncs: number
    averageDuration: number
    lastSuccessfulSync?: Date
    eventsInSync: number
    eventsOutOfSync: number
}

interface UseRealCalendarSyncState {
    currentOperation: SyncOperation | null
    recentOperations: SyncOperation[]
    metrics: SyncMetrics
    loading: boolean
    error: string | null
}

export const useRealCalendarSync = (autoRefresh: boolean = true) => {
    const [state, setState] = useState<UseRealCalendarSyncState>({
        currentOperation: null,
        recentOperations: [],
        metrics: {
            totalSyncs: 0,
            successfulSyncs: 0,
            failedSyncs: 0,
            averageDuration: 0,
            eventsInSync: 0,
            eventsOutOfSync: 0
        },
        loading: false,
        error: null
    })

    const { user } = useAuthStore()

    // Update state helper
    const updateState = useCallback((updates: Partial<UseRealCalendarSyncState>) => {
        setState(prev => ({ ...prev, ...updates }))
    }, [])

    // Handle errors
    const handleError = useCallback((error: any, context: string) => {
        console.error(`[useRealCalendarSync] ${context}:`, error)
        const errorMessage = error?.message || `Erro em ${context}`
        updateState({ error: errorMessage, loading: false })
    }, [updateState])

    // Load sync metrics
    const loadSyncMetrics = useCallback(async () => {
        if (!user) return

        try {
            updateState({ loading: true, error: null })

            // Buscar agendamentos para calcular métricas
            const unsyncedAppointments = await AppointmentService.getUnsyncedAppointments(user.id)
            const allAppointments = await AppointmentService.getAppointmentsByUser(user.id)

            // Buscar histórico de sincronizações (se implementado no backend)
            let syncHistory: any[] = []
            try {
                const statusResponse = await CalendarSyncService.getSyncStatus(user.id)
                syncHistory = statusResponse.history || []
            } catch (statusError) {
                console.warn('Histórico de sincronização não disponível:', statusError)
            }

            const totalSyncs = syncHistory.length
            const successfulSyncs = syncHistory.filter((op: any) => op.status === 'completed').length
            const failedSyncs = totalSyncs - successfulSyncs

            const eventsInSync = allAppointments.filter((apt: any) => apt.calendar_synced).length
            const eventsOutOfSync = unsyncedAppointments.length

            const lastSuccessfulSync = syncHistory
                .filter((op: any) => op.status === 'completed')
                .sort((a: any, b: any) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())[0]?.endTime

            const averageDuration = totalSyncs > 0
                ? syncHistory
                .filter((op: any) => op.endTime)
                .reduce((acc: number, op: any) => {
                    const duration = (new Date(op.endTime).getTime() - new Date(op.startTime).getTime()) / 1000
                    return acc + duration
                }, 0) / totalSyncs
                : 0

            const metrics: SyncMetrics = {
                totalSyncs,
                successfulSyncs,
                failedSyncs,
                averageDuration,
                lastSuccessfulSync: lastSuccessfulSync ? new Date(lastSuccessfulSync) : undefined,
                eventsInSync,
                eventsOutOfSync
            }

            const recentOperations: SyncOperation[] = syncHistory
                .slice(0, 5)
                .map((op: any) => ({
                    id: op.id,
                    type: op.type || 'sync_to_google',
                    status: op.status,
                    startTime: new Date(op.startTime),
                    endTime: op.endTime ? new Date(op.endTime) : undefined,
                    progress: op.progress || 100,
                    details: op.details || {
                        totalItems: 0,
                        processedItems: 0,
                        successItems: 0,
                        failedItems: 0
                    },
                    error: op.error
                }))

            updateState({
                metrics,
                recentOperations,
                loading: false
            })

        } catch (error) {
            handleError(error, 'loadSyncMetrics')
        }
    }, [user, updateState, handleError])

    // Sync all unsynced appointments
    const syncAllAppointments = useCallback(async (): Promise<SyncResponse | null> => {
        if (!user) {
            updateState({ error: 'Usuário não autenticado' })
            return null
        }

        try {
            const operation: SyncOperation = {
                id: Date.now().toString(),
                type: 'sync_to_google',
                status: 'running',
                startTime: new Date(),
                progress: 0,
                details: {
                    totalItems: 0,
                    processedItems: 0,
                    successItems: 0,
                    failedItems: 0
                }
            }

            updateState({ currentOperation: operation, error: null })

            // Get unsynced appointments
            const unsyncedAppointments = await AppointmentService.getUnsyncedAppointments(user.id)

            operation.details.totalItems = unsyncedAppointments.length
            updateState({ currentOperation: { ...operation } })

            // Se não há itens para sincronizar, retornar sucesso vazio
            if (unsyncedAppointments.length === 0) {
                const completedOperation: SyncOperation = {
                    ...operation,
                    status: 'completed',
                    endTime: new Date(),
                    progress: 100
                }

                updateState({
                    currentOperation: null,
                    recentOperations: [completedOperation, ...state.recentOperations.slice(0, 4)]
                })

                return {
                    results: [],
                    syncedCount: 0
                }
            }

            // Call sync API
            const response = await CalendarSyncService.syncAllUnsyncedAppointments(user.id)

            // Update operation with final results
            const completedOperation: SyncOperation = {
                ...operation,
                status: 'completed',
                endTime: new Date(),
                progress: 100,
                details: {
                    totalItems: response.results.length,
                    processedItems: response.results.length,
                    successItems: response.syncedCount,
                    failedItems: response.results.length - response.syncedCount
                }
            }

            // Update state
            updateState({
                currentOperation: null,
                recentOperations: [completedOperation, ...state.recentOperations.slice(0, 4)],
                metrics: {
                    ...state.metrics,
                    totalSyncs: state.metrics.totalSyncs + 1,
                    successfulSyncs: state.metrics.successfulSyncs + (response.syncedCount > 0 ? 1 : 0),
                    failedSyncs: state.metrics.failedSyncs + (response.syncedCount === 0 ? 1 : 0),
                    lastSuccessfulSync: response.syncedCount > 0 ? new Date() : state.metrics.lastSuccessfulSync,
                    eventsInSync: state.metrics.eventsInSync + response.syncedCount,
                    eventsOutOfSync: Math.max(0, state.metrics.eventsOutOfSync - response.syncedCount)
                }
            })

            // Reload metrics to get updated data
            await loadSyncMetrics()

            return response

        } catch (error) {
            const failedOperation: SyncOperation = {
                id: Date.now().toString(),
                type: 'sync_to_google',
                status: 'failed',
                startTime: new Date(),
                endTime: new Date(),
                progress: 0,
                details: {
                    totalItems: 0,
                    processedItems: 0,
                    successItems: 0,
                    failedItems: 0
                },
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            }

            updateState({
                currentOperation: null,
                recentOperations: [failedOperation, ...state.recentOperations.slice(0, 4)],
                metrics: {
                    ...state.metrics,
                    totalSyncs: state.metrics.totalSyncs + 1,
                    failedSyncs: state.metrics.failedSyncs + 1
                }
            })

            handleError(error, 'syncAllAppointments')
            return null
        }
    }, [user, state.recentOperations, state.metrics, updateState, handleError, loadSyncMetrics])

    // Sync specific appointment
    const syncSpecificAppointment = useCallback(async (
        appointmentId: string,
        appointmentData: any
    ): Promise<SyncResult | null> => {
        if (!user) {
            updateState({ error: 'Usuário não autenticado' })
            return null
        }

        try {
            updateState({ loading: true, error: null })

            const result = await CalendarSyncService.syncSpecificAppointment(
                user.id,
                appointmentId,
                appointmentData
            )

            // Reload metrics after successful sync
            if (result.success) {
                await loadSyncMetrics()
            }

            updateState({ loading: false })
            return result

        } catch (error) {
            handleError(error, 'syncSpecificAppointment')
            return null
        }
    }, [user, updateState, handleError, loadSyncMetrics])

    // Clear error
    const clearError = useCallback(() => {
        updateState({ error: null })
    }, [updateState])

    // Auto-refresh metrics
    useEffect(() => {
        if (user) {
            loadSyncMetrics()
        }
    }, [user, loadSyncMetrics])

    useEffect(() => {
        if (autoRefresh && user) {
            const interval = setInterval(loadSyncMetrics, 30000) // 30 seconds
            return () => clearInterval(interval)
        }
    }, [autoRefresh, user, loadSyncMetrics])

    return {
        // State
        ...state,

        // Methods
        syncAllAppointments,
        syncSpecificAppointment,
        loadSyncMetrics,
        clearError
    }
}