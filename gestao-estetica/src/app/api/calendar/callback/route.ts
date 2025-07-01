// src/app/api/auth/google/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/database/supabase/client'

export async function GET(request: NextRequest) {
    const supabase = createServerClient()

    try {
        const { searchParams } = new URL(request.url)
        const code = searchParams.get('code')
        const state = searchParams.get('state') // user_id
        const error = searchParams.get('error')

        if (error) {
            console.error('❌ Erro OAuth:', error)
            return NextResponse.redirect(
                new URL('/agendamentos/configuracao?error=oauth_error', request.url)
            )
        }

        if (!code || !state) {
            console.error('❌ Código ou state ausente')
            return NextResponse.redirect(
                new URL('/agendamentos/configuracao?error=missing_params', request.url)
            )
        }

        console.log('🔗 Processando callback Google OAuth...')

        // Trocar código por tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                code,
                grant_type: 'authorization_code',
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
            }),
        })

        if (!tokenResponse.ok) {
            throw new Error(`Erro ao trocar código por tokens: ${tokenResponse.status}`)
        }

        const tokens = await tokenResponse.json()

        if (!tokens.access_token) {
            throw new Error('Access token não recebido')
        }

        console.log('✅ Tokens obtidos com sucesso')

        // Obter informações do calendário principal
        const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`,
            },
        })

        if (!calendarResponse.ok) {
            throw new Error(`Erro ao obter calendário: ${calendarResponse.status}`)
        }

        const calendar = await calendarResponse.json()

        console.log('✅ Informações do calendário obtidas:', calendar.id)

        // Salvar tokens no banco de dados
        const { error: updateError } = await supabase
            .from('users')
            .update({
                google_access_token: tokens.access_token,
                google_refresh_token: tokens.refresh_token,
                google_calendar_id: calendar.id,
                updated_at: new Date().toISOString()
            })
            .eq('id', state)

        if (updateError) {
            console.error('❌ Erro ao salvar tokens:', updateError)
            throw updateError
        }

        console.log('✅ Tokens salvos no banco de dados')

        // Redirecionar de volta para a página de configuração com sucesso
        return NextResponse.redirect(
            new URL('/agendamentos/configuracao?success=google_connected', request.url)
        )

    } catch (error) {
        console.error('❌ Erro no callback Google OAuth:', error)
        return NextResponse.redirect(
            new URL('/agendamentos/configuracao?error=connection_failed', request.url)
        )
    }
}