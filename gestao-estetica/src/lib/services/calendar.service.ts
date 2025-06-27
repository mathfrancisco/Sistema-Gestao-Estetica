// lib/services/calendarService.ts
import { google } from 'googleapis'
import { supabase } from '@/lib/database/supabase/client'
import type { Database } from '@/lib/database/supabase/types'

type User = Database['public']['Tables']['users']['Row']

export interface GoogleCalendarEvent {
    id: string
    summary: string
    description?: string
    start: {
        dateTime: string
        timeZone: string
    }
    end: {
        dateTime: string
        timeZone: string
    }
    attendees?: Array<{
        email: string
        responseStatus: string
    }>
    htmlLink: string
    hangoutLink?: string
}

export interface CreateEventData {
    summary: string
    description?: string
    startDateTime: string
    endDateTime: string
    timeZone?: string
    attendees?: string[]
    location?: string
    reminders?: {
        useDefault: boolean
        overrides?: Array<{
            method: 'email' | 'popup'
            minutes: number
        }>
    }
}

export class CalendarService {
    private static getOAuth2Client(accessToken: string, refreshToken: string) {
        const oauth2Client = new google.auth.OAuth2(
            process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
        )

        oauth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken
        })

        return oauth2Client
    }

    private static async refreshAccessToken(refreshToken: string): Promise<string> {
        const oauth2Client = new google.auth.OAuth2(
            process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
        )

        oauth2Client.setCredentials({
            refresh_token: refreshToken
        })

        try {
            const { credentials } = await oauth2Client.refreshAccessToken()
            return credentials.access_token!
        } catch (error) {
            throw new Error('Erro ao renovar token de acesso')
        }
    }

    private static mapEventToGoogleCalendarEvent(event: any): GoogleCalendarEvent {
        return {
            id: event.id!,
            summary: event.summary || '',
            description: event.description || undefined,
            start: {
                dateTime: event.start?.dateTime || event.start?.date || '',
                timeZone: event.start?.timeZone || 'UTC'
            },
            end: {
                dateTime: event.end?.dateTime || event.end?.date || '',
                timeZone: event.end?.timeZone || 'UTC'
            },
            attendees: event.attendees?.map((attendee: any) => ({
                email: attendee.email || '',
                responseStatus: attendee.responseStatus || 'needsAction'
            })),
            htmlLink: event.htmlLink || '',
            hangoutLink: event.hangoutLink || undefined
        }
    }

    static async authenticateUser(code: string): Promise<{
        accessToken: string
        refreshToken: string
        calendarId: string
    }> {
        const oauth2Client = new google.auth.OAuth2(
            process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
        )

        try {
            const { tokens } = await oauth2Client.getToken(code)
            oauth2Client.setCredentials(tokens)

            // Buscar calendário principal
            const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
            const calendarsResponse = await calendar.calendarList.list()

            const primaryCalendar = calendarsResponse.data.items?.find(
                cal => cal.primary === true
            )

            if (!primaryCalendar) {
                throw new Error('Calendário principal não encontrado')
            }

            return {
                accessToken: tokens.access_token!,
                refreshToken: tokens.refresh_token!,
                calendarId: primaryCalendar.id!
            }
        } catch (error) {
            throw new Error('Erro na autenticação com Google')
        }
    }

    static async getCalendarEvents(
        user: User,
        timeMin?: string,
        timeMax?: string,
        maxResults: number = 100
    ): Promise<GoogleCalendarEvent[]> {
        if (!user.google_access_token || !user.google_refresh_token || !user.google_calendar_id) {
            throw new Error('Usuário não autenticado com Google Calendar')
        }

        try {
            const oauth2Client = this.getOAuth2Client(
                user.google_access_token,
                user.google_refresh_token
            )

            const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

            const response = await calendar.events.list({
                calendarId: user.google_calendar_id,
                timeMin: timeMin || new Date().toISOString(),
                timeMax,
                maxResults,
                singleEvents: true,
                orderBy: 'startTime'
            })

            return response.data.items?.map(this.mapEventToGoogleCalendarEvent) || []

        } catch (error: any) {
            if (error.code === 401) {
                // Token expirado, tentar renovar
                try {
                    const newAccessToken = await this.refreshAccessToken(user.google_refresh_token)

                    // Atualizar token no banco
                    await supabase
                        .from('users')
                        .update({ google_access_token: newAccessToken })
                        .eq('id', user.id)

                    // Tentar novamente com novo token
                    const oauth2Client = this.getOAuth2Client(
                        newAccessToken,
                        user.google_refresh_token
                    )

                    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
                    const response = await calendar.events.list({
                        calendarId: user.google_calendar_id,
                        timeMin: timeMin || new Date().toISOString(),
                        timeMax,
                        maxResults,
                        singleEvents: true,
                        orderBy: 'startTime'
                    })

                    return response.data.items?.map(this.mapEventToGoogleCalendarEvent) || []

                } catch (refreshError) {
                    throw new Error('Erro ao renovar token de acesso')
                }
            }
            throw new Error(`Erro ao buscar eventos: ${error.message}`)
        }
    }

    static async createEvent(user: User, eventData: CreateEventData): Promise<GoogleCalendarEvent> {
        if (!user.google_access_token || !user.google_refresh_token || !user.google_calendar_id) {
            throw new Error('Usuário não autenticado com Google Calendar')
        }

        try {
            const oauth2Client = this.getOAuth2Client(
                user.google_access_token,
                user.google_refresh_token
            )

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
                attendees: eventData.attendees?.map(email => ({ email })),
                location: eventData.location,
                reminders: eventData.reminders || {
                    useDefault: false,
                    overrides: [
                        { method: 'email' as const, minutes: 60 },
                        { method: 'popup' as const, minutes: 15 }
                    ]
                },
                conferenceData: {
                    createRequest: {
                        requestId: `meet-${Date.now()}`,
                        conferenceSolutionKey: { type: 'hangoutsMeet' }
                    }
                }
            }

            const response = await calendar.events.insert({
                calendarId: user.google_calendar_id,
                requestBody: event,
                conferenceDataVersion: 1,
                sendUpdates: 'all'
            })

            return this.mapEventToGoogleCalendarEvent(response.data)

        } catch (error: any) {
            if (error.code === 401) {
                const newAccessToken = await this.refreshAccessToken(user.google_refresh_token)
                await supabase
                    .from('users')
                    .update({ google_access_token: newAccessToken })
                    .eq('id', user.id)

                return this.createEvent({ ...user, google_access_token: newAccessToken }, eventData)
            }
            throw new Error(`Erro ao criar evento: ${error.message}`)
        }
    }

    static async updateEvent(
        user: User,
        eventId: string,
        eventData: Partial<CreateEventData>
    ): Promise<GoogleCalendarEvent> {
        if (!user.google_access_token || !user.google_refresh_token || !user.google_calendar_id) {
            throw new Error('Usuário não autenticado com Google Calendar')
        }

        try {
            const oauth2Client = this.getOAuth2Client(
                user.google_access_token,
                user.google_refresh_token
            )

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
                updateData.attendees = eventData.attendees.map(email => ({ email }))
            }

            if (eventData.reminders) {
                updateData.reminders = eventData.reminders
            }

            const response = await calendar.events.patch({
                calendarId: user.google_calendar_id,
                eventId,
                requestBody: updateData,
                sendUpdates: 'all'
            })

            return this.mapEventToGoogleCalendarEvent(response.data)

        } catch (error: any) {
            if (error.code === 401) {
                const newAccessToken = await this.refreshAccessToken(user.google_refresh_token)
                await supabase
                    .from('users')
                    .update({ google_access_token: newAccessToken })
                    .eq('id', user.id)

                return this.updateEvent({ ...user, google_access_token: newAccessToken }, eventId, eventData)
            }
            throw new Error(`Erro ao atualizar evento: ${error.message}`)
        }
    }

    static async deleteEvent(user: User, eventId: string): Promise<void> {
        if (!user.google_access_token || !user.google_refresh_token || !user.google_calendar_id) {
            throw new Error('Usuário não autenticado com Google Calendar')
        }

        try {
            const oauth2Client = this.getOAuth2Client(
                user.google_access_token,
                user.google_refresh_token
            )

            const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

            await calendar.events.delete({
                calendarId: user.google_calendar_id,
                eventId,
                sendUpdates: 'all'
            })

        } catch (error: any) {
            if (error.code === 401) {
                const newAccessToken = await this.refreshAccessToken(user.google_refresh_token)
                await supabase
                    .from('users')
                    .update({ google_access_token: newAccessToken })
                    .eq('id', user.id)

                return this.deleteEvent({ ...user, google_access_token: newAccessToken }, eventId)
            }
            throw new Error(`Erro ao deletar evento: ${error.message}`)
        }
    }

    static async getEvent(user: User, eventId: string): Promise<GoogleCalendarEvent> {
        if (!user.google_access_token || !user.google_refresh_token || !user.google_calendar_id) {
            throw new Error('Usuário não autenticado com Google Calendar')
        }

        try {
            const oauth2Client = this.getOAuth2Client(
                user.google_access_token,
                user.google_refresh_token
            )

            const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

            const response = await calendar.events.get({
                calendarId: user.google_calendar_id,
                eventId
            })

            return this.mapEventToGoogleCalendarEvent(response.data)

        } catch (error: any) {
            if (error.code === 401) {
                const newAccessToken = await this.refreshAccessToken(user.google_refresh_token)
                await supabase
                    .from('users')
                    .update({ google_access_token: newAccessToken })
                    .eq('id', user.id)

                return this.getEvent({ ...user, google_access_token: newAccessToken }, eventId)
            }
            throw new Error(`Erro ao buscar evento: ${error.message}`)
        }
    }

    static async checkAvailability(
        user: User,
        startDateTime: string,
        endDateTime: string,
        timeZone: string = 'America/Sao_Paulo'
    ): Promise<boolean> {
        if (!user.google_access_token || !user.google_refresh_token || !user.google_calendar_id) {
            throw new Error('Usuário não autenticado com Google Calendar')
        }

        try {
            const oauth2Client = this.getOAuth2Client(
                user.google_access_token,
                user.google_refresh_token
            )

            const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

            const response = await calendar.freebusy.query({
                requestBody: {
                    timeMin: startDateTime,
                    timeMax: endDateTime,
                    timeZone,
                    items: [{ id: user.google_calendar_id }]
                }
            })

            const busyTimes = response.data.calendars?.[user.google_calendar_id]?.busy || []
            return busyTimes.length === 0

        } catch (error: any) {
            if (error.code === 401) {
                const newAccessToken = await this.refreshAccessToken(user.google_refresh_token)
                await supabase
                    .from('users')
                    .update({ google_access_token: newAccessToken })
                    .eq('id', user.id)

                return this.checkAvailability(
                    { ...user, google_access_token: newAccessToken },
                    startDateTime,
                    endDateTime,
                    timeZone
                )
            }
            throw new Error(`Erro ao verificar disponibilidade: ${error.message}`)
        }
    }

    static async findAvailableSlots(
        user: User,
        duration: number, // em minutos
        timeMin: string,
        timeMax: string,
        workingHours: { start: string; end: string } = { start: '09:00', end: '18:00' },
        timeZone: string = 'America/Sao_Paulo'
    ): Promise<Array<{ start: string; end: string }>> {
        if (!user.google_access_token || !user.google_refresh_token || !user.google_calendar_id) {
            throw new Error('Usuário não autenticado com Google Calendar')
        }

        try {
            const oauth2Client = this.getOAuth2Client(
                user.google_access_token,
                user.google_refresh_token
            )

            const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

            // Buscar eventos ocupados no período
            const response = await calendar.freebusy.query({
                requestBody: {
                    timeMin,
                    timeMax,
                    timeZone,
                    items: [{ id: user.google_calendar_id }]
                }
            })

            const busyTimes = response.data.calendars?.[user.google_calendar_id]?.busy || []

            // Algoritmo para encontrar slots disponíveis
            const availableSlots: Array<{ start: string; end: string }> = []
            const startDate = new Date(timeMin)
            const endDate = new Date(timeMax)

            // Iterar por cada dia no período
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dayStart = new Date(d)
                const [startHour, startMinute] = workingHours.start.split(':').map(Number)
                dayStart.setHours(startHour, startMinute, 0, 0)

                const dayEnd = new Date(d)
                const [endHour, endMinute] = workingHours.end.split(':').map(Number)
                dayEnd.setHours(endHour, endMinute, 0, 0)

                // Encontrar slots livres no dia
                let currentTime = new Date(dayStart)

                while (currentTime < dayEnd) {
                    const slotEnd = new Date(currentTime.getTime() + duration * 60000)

                    if (slotEnd > dayEnd) break

                    // Verificar se o slot conflita com eventos ocupados
                    const hasConflict = busyTimes.some(busy => {
                        const busyStart = new Date(busy.start!)
                        const busyEnd = new Date(busy.end!)

                        return (currentTime < busyEnd && slotEnd > busyStart)
                    })

                    if (!hasConflict) {
                        availableSlots.push({
                            start: currentTime.toISOString(),
                            end: slotEnd.toISOString()
                        })
                    }

                    // Avançar para o próximo slot (15 minutos)
                    currentTime.setMinutes(currentTime.getMinutes() + 15)
                }
            }

            return availableSlots

        } catch (error: any) {
            if (error.code === 401) {
                const newAccessToken = await this.refreshAccessToken(user.google_refresh_token)
                await supabase
                    .from('users')
                    .update({ google_access_token: newAccessToken })
                    .eq('id', user.id)

                return this.findAvailableSlots(
                    { ...user, google_access_token: newAccessToken },
                    duration,
                    timeMin,
                    timeMax,
                    workingHours,
                    timeZone
                )
            }
            throw new Error(`Erro ao buscar slots disponíveis: ${error.message}`)
        }
    }

    static getAuthUrl(): string {
        const oauth2Client = new google.auth.OAuth2(
            process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
        )

        const scopes = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events'
        ]

        return oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent'
        })
    }
}