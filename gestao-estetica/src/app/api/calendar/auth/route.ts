// app/api/calendar/auth/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'
import { Database } from "@/lib/database/supabase/types"

const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ✅ CORRIGIDO: Padronizar variáveis de ambiente
const getEnvVars = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI

    console.log('=== ENVIRONMENT VARIABLES DEBUG ===')
    console.log('GOOGLE_CLIENT_ID:', clientId ? 'Set ✅' : 'Not set ❌')
    console.log('GOOGLE_CLIENT_SECRET:', clientSecret ? 'Set ✅' : 'Not set ❌')
    console.log('GOOGLE_REDIRECT_URI:', redirectUri || 'Not set ❌')

    return { clientId, clientSecret, redirectUri }
}

// Generate auth URL
export async function POST() {
    try {
        console.log('POST /api/calendar/auth - Generating auth URL')

        const { clientId, clientSecret, redirectUri } = getEnvVars()

        if (!clientId || !clientSecret || !redirectUri) {
            console.error('❌ Missing environment variables')
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
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
        ]

        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent',
            include_granted_scopes: true
        })

        console.log('✅ Generated auth URL successfully')
        return NextResponse.json({ authUrl })
    } catch (error) {
        console.error('❌ Error generating auth URL:', error)
        return NextResponse.json(
            { error: 'Erro ao gerar URL de autenticação' },
            { status: 500 }
        )
    }
}

// ✅ CORRIGIDO: Handle OAuth callback with proper data persistence
export async function GET(request: NextRequest) {
    try {
        console.log('GET /api/calendar/auth - Processing OAuth callback')

        const { searchParams } = new URL(request.url)
        const code = searchParams.get('code')
        const userId = searchParams.get('userId') || searchParams.get('state')
        const error = searchParams.get('error')

        console.log('Callback params:', {
            code: code ? 'Present ✅' : 'Missing ❌',
            userId: userId || 'Missing ❌',
            error: error || 'None'
        })

        // Check for OAuth errors
        if (error) {
            console.error('❌ OAuth error:', error)
            const errorUrl = new URL('/connect-calendar', request.url)
            errorUrl.searchParams.set('error', error)
            return NextResponse.redirect(errorUrl)
        }

        if (!code || !userId) {
            console.error('❌ Missing code or userId')
            const errorUrl = new URL('/connect-calendar', request.url)
            errorUrl.searchParams.set('error', 'missing_params')
            return NextResponse.redirect(errorUrl)
        }

        // ✅ Verify user exists in database
        console.log('🔍 Verifying user exists...', userId)
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, email')
            .eq('id', userId)
            .single()

        if (userError || !user) {
            console.error('❌ User not found:', userError)
            const errorUrl = new URL('/connect-calendar', request.url)
            errorUrl.searchParams.set('error', 'user_not_found')
            return NextResponse.redirect(errorUrl)
        }

        console.log('✅ User verified:', user.email)

        const { clientId, clientSecret, redirectUri } = getEnvVars()

        if (!clientId || !clientSecret || !redirectUri) {
            console.error('❌ Missing environment variables for token exchange')
            const errorUrl = new URL('/connect-calendar', request.url)
            errorUrl.searchParams.set('error', 'config_error')
            return NextResponse.redirect(errorUrl)
        }

        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        )

        // ✅ Exchange code for tokens
        console.log('🔄 Exchanging code for tokens...')
        const { tokens } = await oauth2Client.getToken(code)
        oauth2Client.setCredentials(tokens)

        console.log('✅ Tokens received:', {
            access_token: tokens.access_token ? 'Present ✅' : 'Missing ❌',
            refresh_token: tokens.refresh_token ? 'Present ✅' : 'Missing ❌',
            expiry_date: tokens.expiry_date || 'Not set'
        })

        // ✅ Get user info from Google
        console.log('👤 Getting user info from Google...')
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
        const userInfoResponse = await oauth2.userinfo.get()
        const googleUserInfo = userInfoResponse.data

        console.log('✅ Google user info:', {
            email: googleUserInfo.email,
            name: googleUserInfo.name,
            verified_email: googleUserInfo.verified_email
        })

        // ✅ Get primary calendar
        console.log('📅 Getting primary calendar...')
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
        const calendarsResponse = await calendar.calendarList.list()

        const primaryCalendar = calendarsResponse.data.items?.find(
            cal => cal.primary === true
        )

        if (!primaryCalendar) {
            console.error('❌ Primary calendar not found')
            const errorUrl = new URL('/connect-calendar', request.url)
            errorUrl.searchParams.set('error', 'no_calendar')
            return NextResponse.redirect(errorUrl)
        }

        console.log('✅ Primary calendar found:', primaryCalendar.id)

        // ✅ CORRIGIDO: Update user with Google Calendar credentials
        console.log('💾 Updating user with Google Calendar credentials...')
        const updateData = {
            google_access_token: tokens.access_token,
            google_refresh_token: tokens.refresh_token,
            google_calendar_id: primaryCalendar.id,
            updated_at: new Date().toISOString()
        }

        console.log('🔄 Saving to database...', {
            user_id: userId,
            calendar_id: primaryCalendar.id,
            has_tokens: !!(tokens.access_token && tokens.refresh_token)
        })

        const { error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId)

        if (updateError) {
            console.error('❌ Error updating user:', updateError)
            const errorUrl = new URL('/connect-calendar', request.url)
            errorUrl.searchParams.set('error', 'save_failed')
            return NextResponse.redirect(errorUrl)
        }

        console.log('✅ User updated successfully')

        // ✅ Verify the update was successful
        console.log('🔍 Verifying update...')
        const { data: updatedUser, error: verifyError } = await supabase
            .from('users')
            .select('google_access_token, google_refresh_token, google_calendar_id')
            .eq('id', userId)
            .single()

        if (verifyError || !updatedUser) {
            console.error('❌ Failed to verify update:', verifyError)
        } else {
            console.log('✅ Update verified:', {
                has_access_token: !!updatedUser.google_access_token,
                has_refresh_token: !!updatedUser.google_refresh_token,
                has_calendar_id: !!updatedUser.google_calendar_id
            })
        }

        // ✅ Create test event to verify integration
        try {
            console.log('🧪 Creating test event to verify integration...')
            const testEvent = {
                summary: 'Teste de Integração - Sistema de Gestão',
                description: `Seu Google Calendar foi conectado com sucesso!\n\nData: ${new Date().toLocaleString('pt-BR')}\nUsuário: ${user.email}`,
                start: {
                    dateTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
                    timeZone: 'America/Sao_Paulo'
                },
                end: {
                    dateTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now
                    timeZone: 'America/Sao_Paulo'
                },
                attendees: [{ email: user.email }],
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'popup', minutes: 5 }
                    ]
                }
            }

            const testEventResponse = await calendar.events.insert({
                calendarId: primaryCalendar.id!,
                requestBody: testEvent,
                sendUpdates: 'all'
            })

            console.log('✅ Test event created:', testEventResponse.data.id)
        } catch (testError) {
            console.warn('⚠️ Failed to create test event (non-critical):', testError)
        }

        // ✅ CORRIGIDO: Redirect to success page
        const successUrl = new URL('/connect-calendar', request.url)
        successUrl.searchParams.set('success', 'true')
        successUrl.searchParams.set('calendarId', primaryCalendar.id!)

        console.log('🎉 Authentication completed successfully!')
        console.log('📍 Redirecting to:', successUrl.toString())

        return NextResponse.redirect(successUrl)

    } catch (error) {
        console.error('❌ Google Calendar auth error:', error)

        // ✅ Detailed error logging
        if (error instanceof Error) {
            console.error('Error name:', error.name)
            console.error('Error message:', error.message)
            console.error('Error stack:', error.stack)
        }

        // Redirect to error page
        const errorUrl = new URL('/connect-calendar', request.url)
        errorUrl.searchParams.set('error', 'auth_failed')
        errorUrl.searchParams.set('message', error instanceof Error ? error.message : 'Unknown error')

        return NextResponse.redirect(errorUrl)
    }
}