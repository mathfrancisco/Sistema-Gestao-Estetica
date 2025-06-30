// app/api/calendar/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getOAuth2Client(userId: string) {
    const { data: user, error } = await supabase
        .from('users')
        .select('google_access_token, google_refresh_token, google_calendar_id')
        .eq('id', userId)
        .single()

    if (error || !user) {
        throw new Error('Usuário não encontrado')
    }

    if (!user.google_access_token || !user.google_refresh_token) {
        throw new Error('Usuário não autenticado com Google Calendar')
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
    )

    oauth2Client.setCredentials({
        access_token: user.google_access_token,
        refresh_token: user.google_refresh_token
    })

    return { oauth2Client, user }
}

async function refreshAccessToken(oauth2Client: any, userId: string) {
    try {
        const { credentials } = await oauth2Client.refreshAccessToken()

        // Update new access token in database
        await supabase
            .from('users')
            .update({ google_access_token: credentials.access_token })
            .eq('id', userId)

        return credentials.access_token
    } catch (error) {
        throw new Error('Erro ao renovar token de acesso')
    }
}

// GET - List calendar events
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const timeMin = searchParams.get('timeMin')
    const timeMax = searchParams.get('timeMax')
    const maxResults = parseInt(searchParams.get('maxResults') || '100')

    if (!userId) {
        return NextResponse.json(
            { error: 'ID do usuário não fornecido' },
            { status: 400 }
        )
    }

    try {
        const { oauth2Client, user } = await getOAuth2Client(userId)
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

        const response = await calendar.events.list({
            calendarId: user.google_calendar_id,
            timeMin: timeMin || new Date().toISOString(),
            timeMax: timeMax || undefined,
            maxResults,
            singleEvents: true,
            orderBy: 'startTime'
        })

        const events = response.data.items?.map(event => ({
            id: event.id,
            summary: event.summary || '',
            description: event.description || '',
            start: {
                dateTime: event.start?.dateTime || event.start?.date || '',
                timeZone: event.start?.timeZone || 'UTC'
            },
            end: {
                dateTime: event.end?.dateTime || event.end?.date || '',
                timeZone: event.end?.timeZone || 'UTC'
            },
            attendees: event.attendees?.map(attendee => ({
                email: attendee.email || '',
                responseStatus: attendee.responseStatus || 'needsAction'
            })),
            htmlLink: event.htmlLink || '',
            hangoutLink: event.hangoutLink
        })) || []

        return NextResponse.json({ events })

    } catch (error: any) {
        console.error('Error fetching events:', error)

        if (error.code === 401) {
            try {
                const { oauth2Client } = await getOAuth2Client(userId)
                await refreshAccessToken(oauth2Client, userId)

                // Retry the request
                return GET(request)
            } catch (refreshError) {
                return NextResponse.json(
                    { error: 'Token expirado. Reconecte sua conta.' },
                    { status: 401 }
                )
            }
        }

        return NextResponse.json(
            { error: 'Erro ao buscar eventos' },
            { status: 500 }
        )
    }
}

// POST - Create calendar event
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId, eventData } = body

        if (!userId || !eventData) {
            return NextResponse.json(
                { error: 'Dados inválidos' },
                { status: 400 }
            )
        }

        const { oauth2Client, user } = await getOAuth2Client(userId)
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

        const event = {
            summary: eventData.summary,
            description: eventData.description,
            start: {
                dateTime: eventData.startDateTime,
                timeZone: eventData.timeZone || 'America/Sao_Paulo'
            },
            end: {
                dateTime: eventData.endDateTime,
                timeZone: eventData.timeZone || 'America/Sao_Paulo'
            },
            attendees: eventData.attendees?.map((email: string) => ({ email })),
            location: eventData.location,
            reminders: eventData.reminders || {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 60 },
                    { method: 'popup', minutes: 15 }
                ]
            },
            conferenceData: eventData.createMeet ? {
                createRequest: {
                    requestId: `meet-${Date.now()}`,
                    conferenceSolutionKey: { type: 'hangoutsMeet' }
                }
            } : undefined
        }

        const response = await calendar.events.insert({
            calendarId: user.google_calendar_id,
            requestBody: event,
            conferenceDataVersion: eventData.createMeet ? 1 : 0,
            sendUpdates: 'all'
        })

        const createdEvent = {
            id: response.data.id,
            summary: response.data.summary || '',
            description: response.data.description || '',
            start: {
                dateTime: response.data.start?.dateTime || response.data.start?.date || '',
                timeZone: response.data.start?.timeZone || 'UTC'
            },
            end: {
                dateTime: response.data.end?.dateTime || response.data.end?.date || '',
                timeZone: response.data.end?.timeZone || 'UTC'
            },
            attendees: response.data.attendees?.map(attendee => ({
                email: attendee.email || '',
                responseStatus: attendee.responseStatus || 'needsAction'
            })),
            htmlLink: response.data.htmlLink || '',
            hangoutLink: response.data.hangoutLink
        }

        return NextResponse.json({ event: createdEvent })

    } catch (error: any) {
        console.error('Error creating event:', error)

        if (error.code === 401) {
            return NextResponse.json(
                { error: 'Token expirado. Reconecte sua conta.' },
                { status: 401 }
            )
        }

        return NextResponse.json(
            { error: 'Erro ao criar evento' },
            { status: 500 }
        )
    }
}

// PUT - Update calendar event
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId, eventId, eventData } = body

        if (!userId || !eventId || !eventData) {
            return NextResponse.json(
                { error: 'Dados inválidos' },
                { status: 400 }
            )
        }

        const { oauth2Client, user } = await getOAuth2Client(userId)
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

        const updateData: any = {}

        if (eventData.summary) updateData.summary = eventData.summary
        if (eventData.description !== undefined) updateData.description = eventData.description
        if (eventData.location !== undefined) updateData.location = eventData.location

        if (eventData.startDateTime) {
            updateData.start = {
                dateTime: eventData.startDateTime,
                timeZone: eventData.timeZone || 'America/Sao_Paulo'
            }
        }

        if (eventData.endDateTime) {
            updateData.end = {
                dateTime: eventData.endDateTime,
                timeZone: eventData.timeZone || 'America/Sao_Paulo'
            }
        }

        if (eventData.attendees) {
            updateData.attendees = eventData.attendees.map((email: string) => ({ email }))
        }

        const response = await calendar.events.patch({
            calendarId: user.google_calendar_id,
            eventId,
            requestBody: updateData,
            sendUpdates: 'all'
        })

        const updatedEvent = {
            id: response.data.id,
            summary: response.data.summary || '',
            description: response.data.description || '',
            start: {
                dateTime: response.data.start?.dateTime || response.data.start?.date || '',
                timeZone: response.data.start?.timeZone || 'UTC'
            },
            end: {
                dateTime: response.data.end?.dateTime || response.data.end?.date || '',
                timeZone: response.data.end?.timeZone || 'UTC'
            },
            attendees: response.data.attendees?.map(attendee => ({
                email: attendee.email || '',
                responseStatus: attendee.responseStatus || 'needsAction'
            })),
            htmlLink: response.data.htmlLink || '',
            hangoutLink: response.data.hangoutLink
        }

        return NextResponse.json({ event: updatedEvent })

    } catch (error: any) {
        console.error('Error updating event:', error)

        if (error.code === 401) {
            return NextResponse.json(
                { error: 'Token expirado. Reconecte sua conta.' },
                { status: 401 }
            )
        }

        return NextResponse.json(
            { error: 'Erro ao atualizar evento' },
            { status: 500 }
        )
    }
}

// DELETE - Delete calendar event
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const eventId = searchParams.get('eventId')

    if (!userId || !eventId) {
        return NextResponse.json(
            { error: 'ID do usuário ou evento não fornecido' },
            { status: 400 }
        )
    }

    try {
        const { oauth2Client, user } = await getOAuth2Client(userId)
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

        await calendar.events.delete({
            calendarId: user.google_calendar_id,
            eventId,
            sendUpdates: 'all'
        })

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Error deleting event:', error)

        if (error.code === 401) {
            return NextResponse.json(
                { error: 'Token expirado. Reconecte sua conta.' },
                { status: 401 }
            )
        }

        return NextResponse.json(
            { error: 'Erro ao deletar evento' },
            { status: 500 }
        )
    }
}