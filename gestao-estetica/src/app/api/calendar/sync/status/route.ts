// app/api/calendar/sync/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
        return NextResponse.json(
            { error: 'ID do usuário não fornecido' },
            { status: 400 }
        )
    }

    try {
        // Buscar agendamentos sincronizados e não sincronizados
        const { data: appointments, error: appointmentsError } = await supabase
            .from('appointments')
            .select(`
                id,
                calendar_synced,
                google_event_id,
                created_at,
                updated_at
            `)
            .eq('user_id', userId)

        if (appointmentsError) {
            throw appointmentsError
        }

        // Calcular métricas
        const totalAppointments = appointments?.length || 0
        const syncedAppointments = appointments?.filter(apt => apt.calendar_synced).length || 0
        const unsyncedAppointments = totalAppointments - syncedAppointments

        // Buscar histórico de sincronizações (simulado com base nos dados existentes)
        const history = appointments
            ?.filter(apt => apt.calendar_synced && apt.google_event_id)
            .map(apt => ({
                id: `sync-${apt.id}`,
                type: 'sync_to_google',
                status: 'completed',
                startTime: apt.updated_at,
                endTime: apt.updated_at,
                progress: 100,
                details: {
                    totalItems: 1,
                    processedItems: 1,
                    successItems: 1,
                    failedItems: 0
                }
            }))
            .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
            .slice(0, 10) || [] // Últimas 10 operações

        const response = {
            eventsInSync: syncedAppointments,
            eventsOutOfSync: unsyncedAppointments,
            totalEvents: totalAppointments,
            history,
            lastSyncCheck: new Date().toISOString()
        }

        return NextResponse.json(response)

    } catch (error) {
        console.error('Erro ao verificar status de sincronização:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}