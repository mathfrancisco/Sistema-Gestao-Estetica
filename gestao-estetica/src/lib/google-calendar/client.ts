// lib/google-calendar/client.ts
import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'

export const createOAuth2Client = (accessToken?: string, refreshToken?: string) => {
    const oauth2Client = new OAuth2Client(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        REDIRECT_URI
    )

    if (accessToken && refreshToken) {
        oauth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
        })
    }

    return oauth2Client
}

export const getAuthUrl = () => {
    const oauth2Client = createOAuth2Client()

    const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
    ]

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
    })
}

export const getTokensFromCode = async (code: string) => {
    const oauth2Client = createOAuth2Client()
    const { tokens } = await oauth2Client.getToken(code)
    return tokens
}

export const createCalendarClient = (accessToken: string, refreshToken: string) => {
    const auth = createOAuth2Client(accessToken, refreshToken)
    return google.calendar({ version: 'v3', auth })
}

export const refreshAccessToken = async (refreshToken: string) => {
    const oauth2Client = createOAuth2Client()
    oauth2Client.setCredentials({ refresh_token: refreshToken })

    try {
        const { credentials } = await oauth2Client.refreshAccessToken()
        return credentials
    } catch (error) {
        console.error('Error refreshing access token:', error)
        throw error
    }
}