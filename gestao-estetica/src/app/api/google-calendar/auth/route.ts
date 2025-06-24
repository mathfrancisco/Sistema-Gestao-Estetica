// app/api/calendar/auth/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const userId = searchParams.get('userId')

    if (!code || !userId) {
        return NextResponse.json(
            { error: 'Código de autorização ou ID do usuário não fornecido' },
            { status: 400 }
        )
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
    )

    try {
        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code)
        oauth2Client.setCredentials(tokens)

        // Get primary calendar
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
        const calendarsResponse = await calendar.calendarList.list()

        const primaryCalendar = calendarsResponse.data.items?.find(
            cal => cal.primary === true
        )

        if (!primaryCalendar) {
            return NextResponse.json(
                { error: 'Calendário principal não encontrado' },
                { status: 404 }
            )
        }

        // Update user with Google Calendar credentials
        const { error: updateError } = await supabase
            .from('users')
            .update({
                google_access_token: tokens.access_token,
                google_refresh_token: tokens.refresh_token,
                google_calendar_id: primaryCalendar.id,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)

        if (updateError) {
            console.error('Error updating user:', updateError)
            return NextResponse.json(
                { error: 'Erro ao salvar credenciais' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            calendarId: primaryCalendar.id
        })

    } catch (error) {
        console.error('Google Calendar auth error:', error)
        return NextResponse.json(
            { error: 'Erro na autenticação com Google Calendar' },
            { status: 500 }
        )
    }
}

// Generate auth URL
export async function POST() {
    const oauth2Client = new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
    )

    const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
    ]

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent'
    })

    return NextResponse.json({ authUrl })
}