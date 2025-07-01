// app/api/calendar/disconnect/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json()

        if (!userId) {
            return NextResponse.json(
                { error: 'ID do usuário não fornecido' },
                { status: 400 }
            )
        }

        console.log('🔌 Desconectando Google Calendar para usuário:', userId)

        // ✅ Remover tokens do Google Calendar
        const { error: updateError } = await supabase
            .from('users')
            .update({
                google_access_token: null,
                google_refresh_token: null,
                google_calendar_id: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)

        if (updateError) {
            console.error('❌ Erro ao desconectar:', updateError)
            throw updateError
        }

        console.log('✅ Google Calendar desconectado com sucesso')

        return NextResponse.json({
            success: true,
            message: 'Google Calendar desconectado com sucesso'
        })

    } catch (error) {
        console.error('❌ Erro na desconexão:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}