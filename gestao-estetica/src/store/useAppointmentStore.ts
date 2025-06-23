import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Database } from '@/lib/supabase/types'

type Appointment = Database['public']['Tables']['appointments']['Row']
type AppointmentInsert = Database['public']['Tables']['appointments']['Insert']
type AppointmentUpdate = Database['public']['Tables']['appointments']['Update']
type AppointmentStatus = Database['public']['Enums']['appointment_status_enum']

interface AppointmentState {
    appointments: Appointment[]
    selectedAppointment: Appointment | null
    isLoading: boolean
    selectedDate: Date | null
    viewMode: 'day' | 'week' | 'month'
    filters: {
        status?: AppointmentStatus
        clientId?: string
        procedureId?: string
        dateRange?: {
            start: Date
            end: Date
        }
    }
    pagination: {
        page: number
        limit: number
        total: number
    }
}

interface AppointmentActions {
    setAppointments: (appointments: Appointment[]) => void
    addAppointment: (appointment: Appointment) => void
    updateAppointment: (id: string, appointment: Partial<Appointment>) => void
    removeAppointment: (id: string) => void
    setSelectedAppointment: (appointment: Appointment | null) => void
    setLoading: (loading: boolean) => void
    setSelectedDate: (date: Date | null) => void
    setViewMode: (mode: 'day' | 'week' | 'month') => void
    setFilters: (filters: Partial<AppointmentState['filters']>) => void
    setPagination: (pagination: Partial<AppointmentState['pagination']>) => void
    clearFilters: () => void
    getAppointmentById: (id: string) => Appointment | undefined
    getAppointmentsForDate: (date: Date) => Appointment[]
    getAppointmentsForDateRange: (start: Date, end: Date) => Appointment[]
    getAppointmentsByStatus: (status: AppointmentStatus) => Appointment[]
    getAppointmentsByClient: (clientId: string) => Appointment[]
    getTodayAppointments: () => Appointment[]
    getUpcomingAppointments: () => Appointment[]
    getPendingAppointments: () => Appointment[]
    getCompletedAppointments: () => Appointment[]
    getCancelledAppointments: () => Appointment[]
    updateAppointmentStatus: (id: string, status: AppointmentStatus) => void
}

type AppointmentStore = AppointmentState & AppointmentActions

export const useAppointmentStore = create<AppointmentStore>()(
    persist(
        (set, get) => ({
            // Estado inicial
            appointments: [],
            selectedAppointment: null,
            isLoading: false,
            selectedDate: null,
            viewMode: 'week',
            filters: {},
            pagination: {
                page: 1,
                limit: 50,
                total: 0,
            },

            // Actions
            setAppointments: (appointments) => set({ appointments }),

            addAppointment: (appointment) => set((state) => ({
                appointments: [...state.appointments, appointment].sort(
                    (a, b) => new Date(a.scheduled_datetime).getTime() - new Date(b.scheduled_datetime).getTime()
                ),
            })),

            updateAppointment: (id, updatedAppointment) => set((state) => ({
                appointments: state.appointments.map(appointment =>
                    appointment.id === id ? { ...appointment, ...updatedAppointment } : appointment
                ),
                selectedAppointment: state.selectedAppointment?.id === id
                    ? { ...state.selectedAppointment, ...updatedAppointment }
                    : state.selectedAppointment,
            })),

            removeAppointment: (id) => set((state) => ({
                appointments: state.appointments.filter(appointment => appointment.id !== id),
                selectedAppointment: state.selectedAppointment?.id === id ? null : state.selectedAppointment,
            })),

            setSelectedAppointment: (appointment) => set({ selectedAppointment: appointment }),

            setLoading: (isLoading) => set({ isLoading }),

            setSelectedDate: (selectedDate) => set({ selectedDate }),

            setViewMode: (viewMode) => set({ viewMode }),

            setFilters: (filters) => set((state) => ({
                filters: { ...state.filters, ...filters },
            })),

            setPagination: (pagination) => set((state) => ({
                pagination: { ...state.pagination, ...pagination },
            })),

            clearFilters: () => set({
                filters: {},
            }),

            getAppointmentById: (id) => {
                return get().appointments.find(appointment => appointment.id === id)
            },

            getAppointmentsForDate: (date) => {
                const appointments = get().appointments
                const targetDate = new Date(date)
                targetDate.setHours(0, 0, 0, 0)

                return appointments.filter(appointment => {
                    const appointmentDate = new Date(appointment.scheduled_datetime)
                    appointmentDate.setHours(0, 0, 0, 0)
                    return appointmentDate.getTime() === targetDate.getTime()
                })
            },

            getAppointmentsForDateRange: (start, end) => {
                const appointments = get().appointments
                const startTime = new Date(start).getTime()
                const endTime = new Date(end).getTime()

                return appointments.filter(appointment => {
                    const appointmentTime = new Date(appointment.scheduled_datetime).getTime()
                    return appointmentTime >= startTime && appointmentTime <= endTime
                })
            },

            getAppointmentsByStatus: (status) => {
                return get().appointments.filter(appointment => appointment.status === status)
            },

            getAppointmentsByClient: (clientId) => {
                return get().appointments.filter(appointment => appointment.client_id === clientId)
            },

            getTodayAppointments: () => {
                const today = new Date()
                return get().getAppointmentsForDate(today)
            },

            getUpcomingAppointments: () => {
                const now = new Date()
                return get().appointments.filter(appointment => {
                    const appointmentDate = new Date(appointment.scheduled_datetime)
                    return appointmentDate > now && appointment.status === 'scheduled'
                }).sort((a, b) =>
                    new Date(a.scheduled_datetime).getTime() - new Date(b.scheduled_datetime).getTime()
                )
            },

            getPendingAppointments: () => {
                return get().getAppointmentsByStatus('scheduled')
            },

            getCompletedAppointments: () => {
                return get().getAppointmentsByStatus('completed')
            },

            getCancelledAppointments: () => {
                return get().getAppointmentsByStatus('cancelled')
            },

            updateAppointmentStatus: (id, status) => {
                get().updateAppointment(id, {
                    status,
                    updated_at: new Date().toISOString()
                })
            },
        }),
        {
            name: 'appointment-storage',
            partialize: (state) => ({
                selectedAppointment: state.selectedAppointment,
                selectedDate: state.selectedDate,
                viewMode: state.viewMode,
                filters: state.filters,
                pagination: state.pagination,
            }),
        }
    )
)