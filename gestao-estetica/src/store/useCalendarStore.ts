import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GoogleCalendarEvent {
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

interface CalendarState {
    isConnected: boolean
    calendarId: string | null
    isSyncing: boolean
    lastSyncDate: Date | null
    syncErrors: string[]
    settings: {
        autoCreateEvents: boolean
        sendInvites: boolean
        defaultReminder: number // minutes
        defaultColor: string
        timeZone: string
    }
    events: GoogleCalendarEvent[]
    selectedEvent: GoogleCalendarEvent | null
}

interface CalendarActions {
    setConnected: (connected: boolean) => void
    setCalendarId: (calendarId: string | null) => void
    setSyncing: (syncing: boolean) => void
    setLastSyncDate: (date: Date | null) => void
    addSyncError: (error: string) => void
    clearSyncErrors: () => void
    updateSettings: (settings: Partial<CalendarState['settings']>) => void
    setEvents: (events: GoogleCalendarEvent[]) => void
    addEvent: (event: GoogleCalendarEvent) => void
    updateEvent: (eventId: string, event: Partial<GoogleCalendarEvent>) => void
    removeEvent: (eventId: string) => void
    setSelectedEvent: (event: GoogleCalendarEvent | null) => void
    getEventById: (id: string) => GoogleCalendarEvent | undefined
    getEventsForDate: (date: Date) => GoogleCalendarEvent[]
    disconnect: () => void
    resetSync: () => void
}

type CalendarStore = CalendarState & CalendarActions

export const useCalendarStore = create<CalendarStore>()(
    persist(
        (set, get) => ({
            // Estado inicial
            isConnected: false,
            calendarId: null,
            isSyncing: false,
            lastSyncDate: null,
            syncErrors: [],
            settings: {
                autoCreateEvents: true,
                sendInvites: true,
                defaultReminder: 60,
                defaultColor: '#4285F4',
                timeZone: 'America/Sao_Paulo',
            },
            events: [],
            selectedEvent: null,

            // Actions
            setConnected: (isConnected) => set({ isConnected }),

            setCalendarId: (calendarId) => set({ calendarId }),

            setSyncing: (isSyncing) => set({ isSyncing }),

            setLastSyncDate: (lastSyncDate) => set({ lastSyncDate }),

            addSyncError: (error) => set((state) => ({
                syncErrors: [...state.syncErrors, error],
            })),

            clearSyncErrors: () => set({ syncErrors: [] }),

            updateSettings: (newSettings) => set((state) => ({
                settings: { ...state.settings, ...newSettings },
            })),

            setEvents: (events) => set({ events }),

            addEvent: (event) => set((state) => ({
                events: [...state.events, event].sort(
                    (a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime()
                ),
            })),

            updateEvent: (eventId, updatedEvent) => set((state) => ({
                events: state.events.map(event =>
                    event.id === eventId ? { ...event, ...updatedEvent } : event
                ),
                selectedEvent: state.selectedEvent?.id === eventId
                    ? { ...state.selectedEvent, ...updatedEvent }
                    : state.selectedEvent,
            })),

            removeEvent: (eventId) => set((state) => ({
                events: state.events.filter(event => event.id !== eventId),
                selectedEvent: state.selectedEvent?.id === eventId ? null : state.selectedEvent,
            })),

            setSelectedEvent: (event) => set({ selectedEvent: event }),

            getEventById: (id) => {
                return get().events.find(event => event.id === id)
            },

            getEventsForDate: (date) => {
                const events = get().events
                const targetDate = new Date(date)
                targetDate.setHours(0, 0, 0, 0)

                return events.filter(event => {
                    const eventDate = new Date(event.start.dateTime)
                    eventDate.setHours(0, 0, 0, 0)
                    return eventDate.getTime() === targetDate.getTime()
                })
            },

            disconnect: () => set({
                isConnected: false,
                calendarId: null,
                events: [],
                selectedEvent: null,
                syncErrors: [],
                lastSyncDate: null,
            }),

            resetSync: () => set({
                isSyncing: false,
                syncErrors: [],
                lastSyncDate: null,
            }),
        }),
        {
            name: 'calendar-storage',
            partialize: (state) => ({
                isConnected: state.isConnected,
                calendarId: state.calendarId,
                settings: state.settings,
                lastSyncDate: state.lastSyncDate,
            }),
        }
    )
)