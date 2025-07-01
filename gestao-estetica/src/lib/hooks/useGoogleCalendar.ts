// lib/hooks/useGoogleCalendar.ts
'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'

export interface GoogleCalendarEvent {
    id: string
    summary: string
    description?: string
    start: {
        dateTime: string
        timeZone: string
    }
    end: {
        dateTime: string
        timeZone: string
    }
    attendees?: Array<{
        email: string
        responseStatus: string
    }>
    htmlLink: string
    hangoutLink?: string
}

export interface CreateEventData {
    summary: string
    description?: string
    startDateTime: string
    endDateTime: string
    timeZone?: string
    attendees?: string[]
    location?: string
    createMeet?: boolean
    reminders?: {
        useDefault: boolean
        overrides?: Array<{
            method: 'email' | 'popup'
            minutes: number
        }>
    }
}

interface UseGoogleCalendarState {
    events: GoogleCalendarEvent[]
    loading: boolean
    error: string | null
    isAuthenticated: boolean
}

export const useGoogleCalendar = () => {
    const [state, setState] = useState<UseGoogleCalendarState>({
        events: [],
        loading: false,
        error: null,
        isAuthenticated: false
    })

    const { user, hasGoogleCalendar } = useAuthStore()

    // Update state helper
    const updateState = useCallback((updates: Partial<UseGoogleCalendarState>) => {
        setState(prev => ({ ...prev, ...updates }))
    }, [])

    // Handle API errors
    const handleError = useCallback((error: any, context: string) => {
        console.error(`[useGoogleCalendar] ${context}:`, error)
        const errorMessage = error?.message || `Erro em ${context}`
        updateState({ error: errorMessage, loading: false })
    }, [updateState])

    // Check authentication status
    const checkAuthentication = useCallback(async () => {
        if (!user) {
            updateState({ isAuthenticated: false, loading: false })
            return false
        }

        try {
            updateState({ loading: true, error: null })
            const isAuthenticated = hasGoogleCalendar()
            updateState({ isAuthenticated, loading: false })
            return isAuthenticated
        } catch (error) {
            handleError(error, 'checkAuthentication')
            return false
        }
    }, [user, hasGoogleCalendar, updateState, handleError])

    // Get calendar events
    const getEvents = useCallback(async (
        timeMin?: string,
        timeMax?: string,
        maxResults: number = 100
    ) => {
        if (!user) {
            updateState({ error: 'Usuário não autenticado' })
            return []
        }

        try {
            updateState({ loading: true, error: null })

            const params = new URLSearchParams({
                userId: user.id,
                maxResults: maxResults.toString()
            })

            if (timeMin) params.append('timeMin', timeMin)
            if (timeMax) params.append('timeMax', timeMax)

            const response = await fetch(`/api/calendar/events?${params}`)

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Erro ao buscar eventos')
            }

            const data = await response.json()
            updateState({ events: data.events, loading: false })
            return data.events
        } catch (error) {
            handleError(error, 'getEvents')
            return []
        }
    }, [user, updateState, handleError])

    // Create calendar event
    const createEvent = useCallback(async (eventData: CreateEventData) => {
        if (!user) {
            updateState({ error: 'Usuário não autenticado' })
            return null
        }

        try {
            updateState({ loading: true, error: null })

            const response = await fetch('/api/calendar/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: user.id,
                    eventData
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Erro ao criar evento')
            }

            const data = await response.json()
            const newEvent = data.event

            // Update events list
            updateState({
                events: [...state.events, newEvent].sort(
                    (a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime()
                ),
                loading: false
            })

            return newEvent
        } catch (error) {
            handleError(error, 'createEvent')
            return null
        }
    }, [user, state.events, updateState, handleError])

    // Update calendar event
    const updateEvent = useCallback(async (
        eventId: string,
        eventData: Partial<CreateEventData>
    ) => {
        if (!user) {
            updateState({ error: 'Usuário não autenticado' })
            return null
        }

        try {
            updateState({ loading: true, error: null })

            const response = await fetch('/api/calendar/events', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: user.id,
                    eventId,
                    eventData
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Erro ao atualizar evento')
            }

            const data = await response.json()
            const updatedEvent = data.event

            // Update events list
            const updatedEvents = state.events.map(event =>
                event.id === eventId ? updatedEvent : event
            )

            updateState({ events: updatedEvents, loading: false })
            return updatedEvent
        } catch (error) {
            handleError(error, 'updateEvent')
            return null
        }
    }, [user, state.events, updateState, handleError])

    // Delete calendar event
    const deleteEvent = useCallback(async (eventId: string) => {
        if (!user) {
            updateState({ error: 'Usuário não autenticado' })
            return false
        }

        try {
            updateState({ loading: true, error: null })

            const params = new URLSearchParams({
                userId: user.id,
                eventId
            })

            const response = await fetch(`/api/calendar/events?${params}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Erro ao deletar evento')
            }

            // Remove event from list
            const filteredEvents = state.events.filter(event => event.id !== eventId)
            updateState({ events: filteredEvents, loading: false })

            return true
        } catch (error) {
            handleError(error, 'deleteEvent')
            return false
        }
    }, [user, state.events, updateState, handleError])

    // Refresh events
    const refreshEvents = useCallback(async () => {
        if (state.isAuthenticated) {
            await getEvents()
        }
    }, [state.isAuthenticated, getEvents])

    // Clear error
    const clearError = useCallback(() => {
        updateState({ error: null })
    }, [updateState])

    // Get events for specific date
    const getEventsForDate = useCallback((date: Date) => {
        const targetDate = new Date(date)
        targetDate.setHours(0, 0, 0, 0)

        return state.events.filter(event => {
            const eventDate = new Date(event.start.dateTime)
            eventDate.setHours(0, 0, 0, 0)
            return eventDate.getTime() === targetDate.getTime()
        })
    }, [state.events])

    // Check if time slot is available
    const isTimeSlotAvailable = useCallback((
        startDateTime: string,
        endDateTime: string
    ) => {
        const startTime = new Date(startDateTime).getTime()
        const endTime = new Date(endDateTime).getTime()

        return !state.events.some(event => {
            const eventStart = new Date(event.start.dateTime).getTime()
            const eventEnd = new Date(event.end.dateTime).getTime()

            // Check for overlap
            return (startTime < eventEnd && endTime > eventStart)
        })
    }, [state.events])

    // Initialize authentication check
    useEffect(() => {
        if (user) {
            checkAuthentication()
        }
    }, [user, checkAuthentication])

    return {
        // State
        ...state,

        // Event methods
        getEvents,
        createEvent,
        updateEvent,
        deleteEvent,
        refreshEvents,

        // Utility methods
        getEventsForDate,
        isTimeSlotAvailable,
        clearError
    }
}