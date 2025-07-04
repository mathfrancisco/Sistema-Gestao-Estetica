// app/api/calendar/sync/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { AppointmentService } from '@/lib/services/appointment.service'
import { CalendarSyncService } from '@/lib/google-calendar/sync'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getClientById(clientId: string) {
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

    if (error) {
        console.error('Erro ao buscar cliente:', error)
        return null
    }

    return data
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json()

        if (!userId) {
            return NextResponse.json(
                { error: 'ID do usuário não fornecido' },
                { status: 400 }
            )
        }

        console.log('🔄 Iniciando sincronização para usuário:', userId)

        // Buscar agendamentos não sincronizados
        const unsyncedAppointments = await AppointmentService.getUnsyncedAppointments(userId)

        console.log('📋 Agendamentos não sincronizados encontrados:', unsyncedAppointments.length)

        if (unsyncedAppointments.length === 0) {
            return NextResponse.json({
                results: [],
                syncedCount: 0,
                message: 'Nenhum agendamento para sincronizar'
            })
        }

        const results = []

        for (const appointment of unsyncedAppointments) {
            try {
                console.log('⚙️ Processando agendamento:', appointment.id)

                // Buscar os dados do cliente relacionado ao agendamento
                let client = null
                if (appointment.clients) {
                    client = appointment.clients
                } else if (appointment.client_id) {
                    client = await getClientById(appointment.client_id)
                }

                const eventData = {
                    summary: `Agendamento - ${client?.name || 'Cliente'}`,
                    description: appointment.notes || '',
                    startDateTime: appointment.scheduled_datetime,
                    endDateTime: new Date(
                        new Date(appointment.scheduled_datetime).getTime() +
                        (appointment.duration_minutes || 60) * 60000
                    ).toISOString(),
                    attendees: client?.email ? [client?.email] : [],
                    location: client?.address ? JSON.stringify(client?.address) : '',
                    timeZone: 'America/Sao_Paulo'
                }

                console.log('📅 Criando evento no Google Calendar...', {
                    summary: eventData.summary,
                    startDateTime: eventData.startDateTime
                })

                const event = await CalendarSyncService.createEventFromAppointment(
                    userId,
                    appointment.id,
                    eventData
                )

                console.log('✅ Evento criado com sucesso:', event.id)

                results.push({
                    appointmentId: appointment.id,
                    eventId: event.id,
                    success: true
                })
            } catch (error) {
                console.error(`❌ Erro ao sincronizar agendamento ${appointment.id}:`, error)
                results.push({
                    appointmentId: appointment.id,
                    error: error instanceof Error ? error.message : 'Erro desconhecido',
                    success: false
                })
            }
        }

        const syncedCount = results.filter(r => r.success).length
        const failedCount = results.length - syncedCount

        console.log('🎯 Sincronização concluída:', {
            total: results.length,
            success: syncedCount,
            failed: failedCount
        })

        return NextResponse.json({
            results,
            syncedCount,
            totalProcessed: results.length,
            failedCount
        })

    } catch (error) {
        console.error('💥 Erro na sincronização:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}