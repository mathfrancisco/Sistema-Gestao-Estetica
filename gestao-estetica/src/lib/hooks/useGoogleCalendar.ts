// hooks/useGoogleCalendar.ts
import { useState, useCallback, useEffect } from 'react'

import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import {CalendarService, CreateEventData, GoogleCalendarEvent} from "@/lib/services/calendar.service";

type User = Database['public']['Tables']['users']['Row']

interface UseGoogleCalendarState {
    events: GoogleCalendarEvent[]
    loading: boolean
    error: string | null
    isAuthenticated: boolean
    user: User | null
}

interface AvailableSlot {
    start: string
    end: string
}

interface WorkingHours {
    start: string
    end: string
}

export const useGoogleCalendar = () => {
    const [state, setState] = useState<UseGoogleCalendarState>({
        events: [],
        loading: false,
        error: null,
        isAuthenticated: false,
        user: null
    })

    // Função para atualizar estado de forma segura
    const updateState = useCallback((updates: Partial<UseGoogleCalendarState>) => {
        setState(prev => ({ ...prev, ...updates }))
    }, [])

    // Função para lidar com erros
    const handleError = useCallback((error: unknown, context: string) => {
        const errorMessage = error instanceof Error ? error.message : `Erro desconhecido em ${context}`
        console.error(`[useGoogleCalendar] ${context}:`, error)
        updateState({ error: errorMessage, loading: false })
    }, [updateState])

    // Verificar se usuário está autenticado
    const checkAuthentication = useCallback(async () => {
        try {
            updateState({ loading: true, error: null })

            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

            if (authError || !authUser) {
                updateState({ isAuthenticated: false, user: null, loading: false })
                return false
            }

            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single()

            if (userError || !userData) {
                updateState({ isAuthenticated: false, user: null, loading: false })
                return false
            }

            const isAuthenticated = !!(
                userData.google_access_token &&
                userData.google_refresh_token &&
                userData.google_calendar_id
            )

            updateState({
                isAuthenticated,
                user: userData,
                loading: false
            })

            return isAuthenticated
        } catch (error) {
            handleError(error, 'checkAuthentication')
            return false
        }
    }, [updateState, handleError])

    // Obter URL de autenticação
    const getAuthUrl = useCallback(() => {
        try {
            return CalendarService.getAuthUrl()
        } catch (error) {
            handleError(error, 'getAuthUrl')
            return null
        }
    }, [handleError])

    // Autenticar usuário com código do Google
    const authenticateUser = useCallback(async (code: string) => {
        try {
            updateState({ loading: true, error: null })

            const authData = await CalendarService.authenticateUser(code)

            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

            if (authError || !authUser) {
                throw new Error('Usuário não autenticado no Supabase')
            }

            // Atualizar dados do usuário no Supabase
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    google_access_token: authData.accessToken,
                    google_refresh_token: authData.refreshToken,
                    google_calendar_id: authData.calendarId,
                    updated_at: new Date().toISOString()
                })
                .eq('id', authUser.id)

            if (updateError) {
                throw new Error('Erro ao salvar dados de autenticação')
            }

            // Verificar autenticação novamente para atualizar estado
            await checkAuthentication()

            return true
        } catch (error) {
            handleError(error, 'authenticateUser')
            return false
        }
    }, [updateState, handleError, checkAuthentication])

    // Buscar eventos do calendário
    const getEvents = useCallback(async (
        timeMin?: string,
        timeMax?: string,
        maxResults: number = 100
    ) => {
        if (!state.user) {
            updateState({ error: 'Usuário não autenticado' })
            return []
        }

        try {
            updateState({ loading: true, error: null })

            const events = await CalendarService.getCalendarEvents(
                state.user,
                timeMin,
                timeMax,
                maxResults
            )

            updateState({ events, loading: false })
            return events
        } catch (error) {
            handleError(error, 'getEvents')
            return []
        }
    }, [state.user, updateState, handleError])

    // Criar evento
    const createEvent = useCallback(async (eventData: CreateEventData) => {
        if (!state.user) {
            updateState({ error: 'Usuário não autenticado' })
            return null
        }

        try {
            updateState({ loading: true, error: null })

            const newEvent = await CalendarService.createEvent(state.user, eventData)

            // Atualizar lista de eventos
            updateState({
                events: [...state.events, newEvent],
                loading: false
            })

            return newEvent
        } catch (error) {
            handleError(error, 'createEvent')
            return null
        }
    }, [state.user, state.events, updateState, handleError])

    // Atualizar evento
    const updateEvent = useCallback(async (
        eventId: string,
        eventData: Partial<CreateEventData>
    ) => {
        if (!state.user) {
            updateState({ error: 'Usuário não autenticado' })
            return null
        }

        try {
            updateState({ loading: true, error: null })

            const updatedEvent = await CalendarService.updateEvent(
                state.user,
                eventId,
                eventData
            )

            // Atualizar evento na lista
            const updatedEvents = state.events.map(event =>
                event.id === eventId ? updatedEvent : event
            )

            updateState({
                events: updatedEvents,
                loading: false
            })

            return updatedEvent
        } catch (error) {
            handleError(error, 'updateEvent')
            return null
        }
    }, [state.user, state.events, updateState, handleError])

    // Deletar evento
    const deleteEvent = useCallback(async (eventId: string) => {
        if (!state.user) {
            updateState({ error: 'Usuário não autenticado' })
            return false
        }

        try {
            updateState({ loading: true, error: null })

            await CalendarService.deleteEvent(state.user, eventId)

            // Remover evento da lista
            const filteredEvents = state.events.filter(event => event.id !== eventId)

            updateState({
                events: filteredEvents,
                loading: false
            })

            return true
        } catch (error) {
            handleError(error, 'deleteEvent')
            return false
        }
    }, [state.user, state.events, updateState, handleError])

    // Buscar evento específico
    const getEvent = useCallback(async (eventId: string) => {
        if (!state.user) {
            updateState({ error: 'Usuário não autenticado' })
            return null
        }

        try {
            updateState({ loading: true, error: null })

            const event = await CalendarService.getEvent(state.user, eventId)

            updateState({ loading: false })
            return event
        } catch (error) {
            handleError(error, 'getEvent')
            return null
        }
    }, [state.user, updateState, handleError])

    // Verificar disponibilidade
    const checkAvailability = useCallback(async (
        startDateTime: string,
        endDateTime: string,
        timeZone: string = 'America/Sao_Paulo'
    ) => {
        if (!state.user) {
            updateState({ error: 'Usuário não autenticado' })
            return false
        }

        try {
            updateState({ loading: true, error: null })

            const isAvailable = await CalendarService.checkAvailability(
                state.user,
                startDateTime,
                endDateTime,
                timeZone
            )

            updateState({ loading: false })
            return isAvailable
        } catch (error) {
            handleError(error, 'checkAvailability')
            return false
        }
    }, [state.user, updateState, handleError])

    // Encontrar slots disponíveis
    const findAvailableSlots = useCallback(async (
        duration: number,
        timeMin: string,
        timeMax: string,
        workingHours: WorkingHours = { start: '09:00', end: '18:00' },
        timeZone: string = 'America/Sao_Paulo'
    ): Promise<AvailableSlot[]> => {
        if (!state.user) {
            updateState({ error: 'Usuário não autenticado' })
            return []
        }

        try {
            updateState({ loading: true, error: null })

            const slots = await CalendarService.findAvailableSlots(
                state.user,
                duration,
                timeMin,
                timeMax,
                workingHours,
                timeZone
            )

            updateState({ loading: false })
            return slots
        } catch (error) {
            handleError(error, 'findAvailableSlots')
            return []
        }
    }, [state.user, updateState, handleError])

    // Recarregar eventos
    const refreshEvents = useCallback(async () => {
        if (state.isAuthenticated) {
            await getEvents()
        }
    }, [state.isAuthenticated, getEvents])

    // Limpar erro
    const clearError = useCallback(() => {
        updateState({ error: null })
    }, [updateState])

    // Desconectar Google Calendar
    const disconnect = useCallback(async () => {
        try {
            updateState({ loading: true, error: null })

            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

            if (authError || !authUser) {
                throw new Error('Usuário não autenticado')
            }

            const { error: updateError } = await supabase
                .from('users')
                .update({
                    google_access_token: null,
                    google_refresh_token: null,
                    google_calendar_id: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', authUser.id)

            if (updateError) {
                throw new Error('Erro ao desconectar Google Calendar')
            }

            updateState({
                isAuthenticated: false,
                user: null,
                events: [],
                loading: false
            })

            return true
        } catch (error) {
            handleError(error, 'disconnect')
            return false
        }
    }, [updateState, handleError])

    // Inicializar hook
    useEffect(() => {
        checkAuthentication()
    }, [checkAuthentication])

    return {
        // Estado
        ...state,

        // Métodos de autenticação
        checkAuthentication,
        getAuthUrl,
        authenticateUser,
        disconnect,

        // Métodos de eventos
        getEvents,
        createEvent,
        updateEvent,
        deleteEvent,
        getEvent,
        refreshEvents,

        // Métodos de disponibilidade
        checkAvailability,
        findAvailableSlots,

        // Utilitários
        clearError
    }
}