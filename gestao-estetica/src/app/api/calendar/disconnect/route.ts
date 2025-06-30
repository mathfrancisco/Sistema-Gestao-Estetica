// app/api/calendar/disconnect/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from "@/lib/database/supabase/types"

const supabase = createClient<Database>(
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

        // Remove Google Calendar credentials from user
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
            console.error('Error disconnecting calendar:', updateError)
            return NextResponse.json(
                { error: 'Erro ao desconectar calendário' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Google Calendar desconectado com sucesso'
        })

    } catch (error) {
        console.error('Disconnect calendar error:', error)
        return NextResponse.json(
            { error: 'Erro ao desconectar calendário' },
            { status: 500 }
        )
    }
}