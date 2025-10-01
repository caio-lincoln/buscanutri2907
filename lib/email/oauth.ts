import { google } from 'googleapis'
import { createAdminClient } from '../supabase/server'
import { OAuth2Client } from 'google-auth-library'

const OAuth2 = google.auth.OAuth2

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
} = process.env

// Only throw error in production or when actually using the OAuth functionality
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn('Google OAuth2 environment variables missing. Gmail functionality will be disabled.')
  }
}

// Create oauth2Client only if credentials are available
const oauth2Client = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET 
  ? new OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/admin/gmail/callback'
    )
  : null

export function generateAuthUrl() {
  if (!oauth2Client) {
    throw new Error('Google OAuth2 not configured')
  }
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://mail.google.com/',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose',
    ],
    prompt: 'consent',
  })
}

export async function exchangeCodeForTokens(code: string, client?: OAuth2Client) {
  const clientToUse = client || oauth2Client
  if (!clientToUse) {
    throw new Error('Google OAuth2 not configured')
  }
  const { tokens } = await clientToUse.getToken(code)
  clientToUse.setCredentials(tokens)
  return tokens
}

export async function saveRefreshToken(email: string, refreshToken: string) {
  const supabase = createAdminClient()

  await supabase.from('gmail_credentials').update({ in_use: false })

  const { data, error } = await supabase
    .from('gmail_credentials')
    .upsert({
      email,
      refresh_token: refreshToken,
      in_use: true,
    }, { onConflict: 'email' })
    .select()

  if (error) throw new Error(`Erro ao salvar refresh token: ${error.message}`)

  return data
}

export async function getCurrentGmailConfig() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('gmail_credentials')
    .select('refresh_token, email')
    .eq('in_use', true)
    .single()

  if (error) {
    console.error('Erro ao obter refresh token:', error)
    return null
  }

  return data
}

export async function getAccessToken(refreshToken: string, client?: OAuth2Client) {
  const clientToUse = client || oauth2Client
  if (!clientToUse) {
    throw new Error('Google OAuth2 not configured')
  }
  clientToUse.setCredentials({ refresh_token: refreshToken })

  try {
    const { credentials } = await clientToUse.refreshAccessToken()
    return credentials.access_token
  } catch (error) {
    console.error('Erro ao obter access token:', error)
    throw error
  }
}

export async function getMe(client?: OAuth2Client) {
  const clientToUse = client || oauth2Client
  if (!clientToUse) {
    throw new Error('Google OAuth2 not configured')
  }
  const gmail = google.gmail({ version: 'v1', auth: clientToUse })
  const response = await gmail.users.getProfile({ userId: 'me' })
  return response.data
}
