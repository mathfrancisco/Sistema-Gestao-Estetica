import { AppointmentService } from '@/lib/services/appointment.service'

export interface CalendarEventData {
    summary: string
    description?: string
    startDateTime: string
    endDateTime: string
    attendees?: string[]
    location?: string
    timeZone?: string
}

export interface SyncResult {
    appointmentId: string
    eventId?: string
    success: boolean
    error?: string
}

export interface SyncResponse {
    results: SyncResult[]
    syncedCount: number
}

export class CalendarSyncService {
    static async createEventFromAppointment(
        userId: string,
        appointmentId: string,
        eventData: CalendarEventData
    ) {
        try {
            const response = await fetch('/api/calendar/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, eventData })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Erro ao criar evento')
            }

            const { event } = await response.json()

            // Atualizar agendamento com ID do evento
            await AppointmentService.syncWithGoogleCalendar(appointmentId, event.id)

            return event
        } catch (error) {
            console.error('Erro ao sincronizar com Google Calendar:', error)
            throw error
        }
    }

    static async updateEventFromAppointment(
        userId: string,
        eventId: string,
        eventData: Partial<CalendarEventData>
    ) {
        try {
            const response = await fetch('/api/calendar/events', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, eventId, eventData })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Erro ao atualizar evento')
            }

            return await response.json()
        } catch (error) {
            console.error('Erro ao atualizar evento no Google Calendar:', error)
            throw error
        }
    }

    static async deleteEvent(userId: string, eventId: string) {
        try {
            const response = await fetch(`/api/calendar/events?userId=${userId}&eventId=${eventId}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Erro ao deletar evento')
            }

            return true
        } catch (error) {
            console.error('Erro ao deletar evento do Google Calendar:', error)
            throw error
        }
    }

    // Novo método para sincronizar todos os agendamentos não sincronizados
    static async syncAllUnsyncedAppointments(userId: string): Promise<SyncResponse> {
        try {
            const response = await fetch('/api/calendar/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Erro na sincronização')
            }

            return await response.json()
        } catch (error) {
            console.error('Erro ao sincronizar agendamentos:', error)
            throw error
        }
    }

    // Novo método para sincronizar um agendamento específico
    static async syncSpecificAppointment(
        userId: string,
        appointmentId: string,
        appointmentData: any
    ): Promise<SyncResult> {
        try {
            const eventData: CalendarEventData = {
                summary: `Agendamento - ${appointmentData.clients?.name || 'Cliente'}`,
                description: appointmentData.notes || '',
                startDateTime: appointmentData.scheduled_datetime,
                endDateTime: new Date(
                    new Date(appointmentData.scheduled_datetime).getTime() +
                    (appointmentData.duration_minutes || 60) * 60000
                ).toISOString(),
                attendees: appointmentData.clients?.email ? [appointmentData.clients.email] : [],
                location: appointmentData.clients?.address ? JSON.stringify(appointmentData.clients.address) : '',
                timeZone: 'America/Sao_Paulo'
            }

            const event = await this.createEventFromAppointment(userId, appointmentId, eventData)

            return {
                appointmentId,
                eventId: event.id,
                success: true
            }
        } catch (error) {
            return {
                appointmentId,
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            }
        }
    }

    // Verificar status de sincronização
    static async getSyncStatus(userId: string) {
        try {
            const response = await fetch(`/api/calendar/sync/status?userId=${userId}`)

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Erro ao verificar status')
            }

            return await response.json()
        } catch (error) {
            console.error('Erro ao verificar status de sincronização:', error)
            throw error
        }
    }
}