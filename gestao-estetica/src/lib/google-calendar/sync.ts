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

            if (!response.ok) throw new Error('Erro ao criar evento')

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

            if (!response.ok) throw new Error('Erro ao atualizar evento')

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

            if (!response.ok) throw new Error('Erro ao deletar evento')

            return true
        } catch (error) {
            console.error('Erro ao deletar evento do Google Calendar:', error)
            throw error
        }
    }
}