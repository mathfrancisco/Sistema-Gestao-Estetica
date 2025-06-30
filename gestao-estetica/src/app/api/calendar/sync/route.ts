import { NextRequest, NextResponse } from 'next/server'
import { AppointmentService } from '@/lib/services/appointment.service'
import { CalendarSyncService } from '@/lib/google-calendar/sync'
import { ClientService } from '@/lib/services/client.service'

export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json()

        if (!userId) {
            return NextResponse.json(
                { error: 'ID do usuário não fornecido' },
                { status: 400 }
            )
        }

        // Buscar agendamentos não sincronizados
        const unsyncedAppointments = await AppointmentService.getUnsyncedAppointments(userId)

        const results = []

        for (const appointment of unsyncedAppointments) {
            try {
                // Buscar os dados do cliente relacionado ao agendamento
                const client = await ClientService.getClientById(appointment.client_id)

                const eventData = {
                    summary: `Agendamento - ${client?.name || 'Cliente'}`,
                    description: appointment.notes || '',
                    startDateTime: appointment.scheduled_datetime,
                    endDateTime: new Date(
                        new Date(appointment.scheduled_datetime).getTime() +
                        (appointment.duration_minutes || 60) * 60000
                    ).toISOString(),
                    attendees: client?.email ? [client.email] : [],
                    location: client?.address ? JSON.stringify(client.address) : ''
                }

                const event = await CalendarSyncService.createEventFromAppointment(
                    userId,
                    appointment.id,
                    eventData
                )

                results.push({ appointmentId: appointment.id, eventId: event.id, success: true })
            } catch (error) {
                results.push({
                    appointmentId: appointment.id,
                    error: error instanceof Error ? error.message : 'Erro desconhecido',
                    success: false
                })
            }
        }

        return NextResponse.json({ results, syncedCount: results.filter(r => r.success).length })

    } catch (error) {
        console.error('Erro na sincronização:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}