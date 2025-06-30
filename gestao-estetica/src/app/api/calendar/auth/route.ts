// app/api/calendar/auth/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'
import { Database } from "@/lib/database/supabase/types"

const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Generate auth URL
export async function POST() {
    try {
        console.log('POST /api/calendar/auth - Generating auth URL')
        console.log('=== ENVIRONMENT VARIABLES DEBUG ===')
        console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set')
        console.log('NEXT_PUBLIC_GOOGLE_CLIENT_ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'Set' : 'Not set')
        console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set')
        console.log('GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI || 'Not set')
        console.log('NEXT_PUBLIC_GOOGLE_REDIRECT_URI:', process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || 'Not set')
        // Verificar variáveis de ambiente - CORRIGIDO PARA USAR AS VARIÁVEIS CORRETAS
        const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI

        console.log('Environment check:', {
            clientId: clientId ? 'Set' : 'Missing',
            clientSecret: clientSecret ? 'Set' : 'Missing',
            redirectUri: redirectUri ? redirectUri : 'Missing'
        })

        if (!clientId || !clientSecret || !redirectUri) {
            console.error('Missing environment variables:', {
                GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
                NEXT_PUBLIC_GOOGLE_CLIENT_ID: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
                GOOGLE_REDIRECT_URI: !!process.env.GOOGLE_REDIRECT_URI,
                NEXT_PUBLIC_GOOGLE_REDIRECT_URI: !!process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI,
            })

            return NextResponse.json(
                { error: 'Configuração do Google OAuth incompleta' },
                { status: 500 }
            )
        }

        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
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

        console.log('Generated auth URL:', authUrl)

        return NextResponse.json({ authUrl })
    } catch (error) {
        console.error('Error generating auth URL:', error)
        return NextResponse.json(
            { error: 'Erro ao gerar URL de autenticação' },
            { status: 500 }
        )
    }
}

// Handle OAuth callback
export async function GET(request: NextRequest) {
    try {
        console.log('GET /api/calendar/auth - Processing OAuth callback')

        const { searchParams } = new URL(request.url)
        const code = searchParams.get('code')
        const userId = searchParams.get('userId')

        console.log('Callback params:', { code: code ? 'Present' : 'Missing', userId })

        if (!code || !userId) {
            return NextResponse.json(
                { error: 'Código de autorização ou ID do usuário não fornecido' },
                { status: 400 }
            )
        }

        // Verificar variáveis de ambiente - CORRIGIDO
        const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI

        if (!clientId || !clientSecret || !redirectUri) {
            return NextResponse.json(
                { error: 'Configuração do Google OAuth incompleta' },
                { status: 500 }
            )
        }

        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        )

        // Exchange code for tokens
        console.log('Exchanging code for tokens...')
        const { tokens } = await oauth2Client.getToken(code)
        oauth2Client.setCredentials(tokens)

        // Get primary calendar
        console.log('Getting primary calendar...')
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

        console.log('Primary calendar found:', primaryCalendar.id)

        // Update user with Google Calendar credentials
        console.log('Updating user credentials...')
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

        console.log('User updated successfully')

        // Redirect to success page instead of JSON response
        const successUrl = new URL('/connect-calendar', request.url)
        successUrl.searchParams.set('success', 'true')
        successUrl.searchParams.set('calendarId', primaryCalendar.id!)

        return NextResponse.redirect(successUrl)

    } catch (error) {
        console.error('Google Calendar auth error:', error)

        // Redirect to error page
        const errorUrl = new URL('/connect-calendar', request.url)
        errorUrl.searchParams.set('error', 'auth_failed')

        return NextResponse.redirect(errorUrl)
    }
}