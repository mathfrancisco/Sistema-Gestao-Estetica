// hooks/useAppointments.ts
import { useState, useEffect, useCallback, useMemo } from 'react'

import type { Database } from '@/lib/supabase/types'
import {
    AppointmentFilters,
    AppointmentService,
    AppointmentsPaginationOptions,
    AppointmentsResponse,
    AppointmentWithDetails
} from '../services/appointment.service'

type Appointment = Database['public']['Tables']['appointments']['Row']
type AppointmentInsert = Database['public']['Tables']['appointments']['Insert']
type AppointmentUpdate = Database['public']['Tables']['appointments']['Update']
type AppointmentStatus = Database['public']['Enums']['appointment_status_enum']

interface UseAppointmentsState {
    appointments: Appointment[]
    appointmentsWithDetails: AppointmentWithDetails[]
    loading: boolean
    error: string | null
    pagination: {
        page: number
        totalPages: number
        total: number
        limit: number
    }
    stats: {
        total: number
        scheduled: number
        confirmed: number
        completed: number
        cancelled: number
        noShow: number
        todayTotal: number
        weekTotal: number
        monthTotal: number
    } | null
}

interface UseAppointmentsOptions {
    initialPage?: number
    initialLimit?: number
    initialFilters?: AppointmentFilters
    sortBy?: keyof Appointment
    sortOrder?: 'asc' | 'desc'
    autoFetch?: boolean
    userId?: string
}

export const useAppointments = (options: UseAppointmentsOptions = {}) => {
    const {
        initialPage = 1,
        initialLimit = 10,
        initialFilters = {},
        sortBy = 'scheduled_datetime',
        sortOrder = 'asc',
        autoFetch = true,
        userId
    } = options

    const [state, setState] = useState<UseAppointmentsState>({
        appointments: [],
        appointmentsWithDetails: [],
        loading: false,
        error: null,
        pagination: {
            page: initialPage,
            totalPages: 0,
            total: 0,
            limit: initialLimit
        },
        stats: null
    })

    const [filters, setFilters] = useState<AppointmentFilters>(initialFilters)

    // Fetch appointments with pagination
    const fetchAppointments = useCallback(async (
        page: number = state.pagination.page,
        limit: number = state.pagination.limit,
        currentFilters: AppointmentFilters = filters
    ) => {
        setState(prev => ({ ...prev, loading: true, error: null }))

        try {
            const options: AppointmentsPaginationOptions = {
                page,
                limit,
                filters: currentFilters,
                sortBy,
                sortOrder
            }

            const response: AppointmentsResponse = await AppointmentService.getAppointments(options)

            setState(prev => ({
                ...prev,
                appointments: response.data,
                pagination: {
                    page: response.page,
                    totalPages: response.totalPages,
                    total: response.total,
                    limit
                },
                loading: false
            }))
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Erro ao buscar agendamentos',
                loading: false
            }))
        }
    }, [filters, sortBy, sortOrder])

    // Fetch appointments with details
    const fetchAppointmentsWithDetails = useCallback(async (
        page: number = state.pagination.page,
        limit: number = state.pagination.limit,
        currentFilters: AppointmentFilters = filters
    ) => {
        setState(prev => ({ ...prev, loading: true, error: null }))

        try {
            const options: AppointmentsPaginationOptions = {
                page,
                limit,
                filters: currentFilters,
                sortBy,
                sortOrder
            }

            const response = await AppointmentService.getAppointmentsWithDetails(options)

            setState(prev => ({
                ...prev,
                appointmentsWithDetails: response.data,
                pagination: {
                    page: response.page,
                    totalPages: response.totalPages,
                    total: response.total,
                    limit
                },
                loading: false
            }))
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Erro ao buscar agendamentos com detalhes',
                loading: false
            }))
        }
    }, [filters, sortBy, sortOrder])

    // Create appointment
    const createAppointment = useCallback(async (appointmentData: AppointmentInsert): Promise<Appointment | null> => {
        setState(prev => ({ ...prev, loading: true, error: null }))

        try {
            const newAppointment = await AppointmentService.createAppointment(appointmentData)

            // Refresh the list
            await fetchAppointments()

            return newAppointment
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Erro ao criar agendamento',
                loading: false
            }))
            return null
        }
    }, [fetchAppointments])

    // Update appointment
    const updateAppointment = useCallback(async (
        id: string,
        appointmentData: AppointmentUpdate
    ): Promise<Appointment | null> => {
        setState(prev => ({ ...prev, loading: true, error: null }))

        try {
            const updatedAppointment = await AppointmentService.updateAppointment(id, appointmentData)

            // Update local state
            setState(prev => ({
                ...prev,
                appointments: prev.appointments.map(app =>
                    app.id === id ? updatedAppointment : app
                ),
                appointmentsWithDetails: prev.appointmentsWithDetails.map(app =>
                    app.id === id ? { ...app, ...updatedAppointment } : app
                ),
                loading: false
            }))

            return updatedAppointment
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Erro ao atualizar agendamento',
                loading: false
            }))
            return null
        }
    }, [])

    // Delete appointment
    const deleteAppointment = useCallback(async (id: string): Promise<boolean> => {
        setState(prev => ({ ...prev, loading: true, error: null }))

        try {
            await AppointmentService.deleteAppointment(id)

            // Remove from local state
            setState(prev => ({
                ...prev,
                appointments: prev.appointments.filter(app => app.id !== id),
                appointmentsWithDetails: prev.appointmentsWithDetails.filter(app => app.id !== id),
                loading: false
            }))

            return true
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Erro ao deletar agendamento',
                loading: false
            }))
            return false
        }
    }, [])

    // Update appointment status
    const updateAppointmentStatus = useCallback(async (
        id: string,
        status: AppointmentStatus
    ): Promise<boolean> => {
        const result = await updateAppointment(id, { status })
        return result !== null
    }, [updateAppointment])

    // Bulk update status
    const bulkUpdateStatus = useCallback(async (
        appointmentIds: string[],
        status: AppointmentStatus
    ): Promise<boolean> => {
        setState(prev => ({ ...prev, loading: true, error: null }))

        try {
            await AppointmentService.bulkUpdateAppointmentStatus(appointmentIds, status)

            // Refresh the list
            await fetchAppointments()

            return true
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Erro ao atualizar agendamentos em lote',
                loading: false
            }))
            return false
        }
    }, [fetchAppointments])

    // Get appointment by ID
    const getAppointmentById = useCallback(async (id: string): Promise<AppointmentWithDetails | null> => {
        try {
            return await AppointmentService.getAppointmentById(id)
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Erro ao buscar agendamento'
            }))
            return null
        }
    }, [])

    // Get appointments by date
    const getAppointmentsByDate = useCallback(async (date: string): Promise<AppointmentWithDetails[]> => {
        try {
            return await AppointmentService.getAppointmentsByDate(date, userId)
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Erro ao buscar agendamentos por data'
            }))
            return []
        }
    }, [userId])

    // Get appointments by date range
    const getAppointmentsByDateRange = useCallback(async (
        startDate: string,
        endDate: string
    ): Promise<AppointmentWithDetails[]> => {
        try {
            return await AppointmentService.getAppointmentsByDateRange(startDate, endDate, userId)
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Erro ao buscar agendamentos por período'
            }))
            return []
        }
    }, [userId])

    // Get today's appointments
    const getTodayAppointments = useCallback(async (): Promise<AppointmentWithDetails[]> => {
        try {
            return await AppointmentService.getTodayAppointments(userId)
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Erro ao buscar agendamentos de hoje'
            }))
            return []
        }
    }, [userId])

    // Get upcoming appointments
    const getUpcomingAppointments = useCallback(async (days: number = 7): Promise<AppointmentWithDetails[]> => {
        try {
            return await AppointmentService.getUpcomingAppointments(userId, days)
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Erro ao buscar próximos agendamentos'
            }))
            return []
        }
    }, [userId])

    // Get appointment stats
    const fetchStats = useCallback(async () => {
        try {
            const stats = await AppointmentService.getAppointmentStats(userId)
            setState(prev => ({ ...prev, stats }))
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Erro ao buscar estatísticas'
            }))
        }
    }, [userId])

    // Check for conflicting appointments
    const checkConflicts = useCallback(async (
        scheduledDateTime: string,
        durationMinutes: number,
        excludeId?: string
    ): Promise<Appointment[]> => {
        try {
            return await AppointmentService.getConflictingAppointments(
                scheduledDateTime,
                durationMinutes,
                userId,
                excludeId
            )
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Erro ao verificar conflitos'
            }))
            return []
        }
    }, [userId])

    // Sync with Google Calendar
    const syncWithGoogleCalendar = useCallback(async (
        id: string,
        googleEventId: string
    ): Promise<boolean> => {
        try {
            await AppointmentService.syncWithGoogleCalendar(id, googleEventId)

            // Update local state
            setState(prev => ({
                ...prev,
                appointments: prev.appointments.map(app =>
                    app.id === id ? { ...app, google_event_id: googleEventId, calendar_synced: true } : app
                ),
                appointmentsWithDetails: prev.appointmentsWithDetails.map(app =>
                    app.id === id ? { ...app, google_event_id: googleEventId, calendar_synced: true } : app
                )
            }))

            return true
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Erro ao sincronizar com Google Calendar'
            }))
            return false
        }
    }, [])

    // Get unsynced appointments
    const getUnsyncedAppointments = useCallback(async (): Promise<Appointment[]> => {
        try {
            return await AppointmentService.getUnsyncedAppointments(userId)
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Erro ao buscar agendamentos não sincronizados'
            }))
            return []
        }
    }, [userId])

    // Pagination controls
    const goToPage = useCallback((page: number) => {
        fetchAppointments(page)
    }, [fetchAppointments])

    const nextPage = useCallback(() => {
        if (state.pagination.page < state.pagination.totalPages) {
            goToPage(state.pagination.page + 1)
        }
    }, [state.pagination.page, state.pagination.totalPages, goToPage])

    const prevPage = useCallback(() => {
        if (state.pagination.page > 1) {
            goToPage(state.pagination.page - 1)
        }
    }, [state.pagination.page, goToPage])

    // Filter controls
    const updateFilters = useCallback((newFilters: Partial<AppointmentFilters>) => {
        const updatedFilters = { ...filters, ...newFilters }
        setFilters(updatedFilters)
        fetchAppointments(1, state.pagination.limit, updatedFilters)
    }, [filters, fetchAppointments, state.pagination.limit])

    const clearFilters = useCallback(() => {
        setFilters({})
        fetchAppointments(1, state.pagination.limit, {})
    }, [fetchAppointments, state.pagination.limit])

    // Refresh data
    const refresh = useCallback(() => {
        fetchAppointments()
    }, [fetchAppointments])

    const refreshWithDetails = useCallback(() => {
        fetchAppointmentsWithDetails()
    }, [fetchAppointmentsWithDetails])

    // Clear error
    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }))
    }, [])

    // Memoized values
    const hasNextPage = useMemo(() =>
            state.pagination.page < state.pagination.totalPages,
        [state.pagination.page, state.pagination.totalPages]
    )

    const hasPrevPage = useMemo(() =>
            state.pagination.page > 1,
        [state.pagination.page]
    )

    const isEmpty = useMemo(() =>
            state.appointments.length === 0 && !state.loading,
        [state.appointments.length, state.loading]
    )

    // Auto-fetch on mount
    useEffect(() => {
        if (autoFetch) {
            fetchAppointments()
            fetchStats()
        }
    }, [autoFetch, fetchAppointments, fetchStats])

    return {
        // State
        ...state,
        filters,

        // Computed values
        hasNextPage,
        hasPrevPage,
        isEmpty,

        // Actions
        fetchAppointments,
        fetchAppointmentsWithDetails,
        createAppointment,
        updateAppointment,
        deleteAppointment,
        updateAppointmentStatus,
        bulkUpdateStatus,
        getAppointmentById,
        getAppointmentsByDate,
        getAppointmentsByDateRange,
        getTodayAppointments,
        getUpcomingAppointments,
        fetchStats,
        checkConflicts,
        syncWithGoogleCalendar,
        getUnsyncedAppointments,

        // Pagination
        goToPage,
        nextPage,
        prevPage,

        // Filters
        updateFilters,
        clearFilters,

        // Utilities
        refresh,
        refreshWithDetails,
        clearError
    }
}