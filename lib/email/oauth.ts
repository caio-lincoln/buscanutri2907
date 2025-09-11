import { google } from 'googleapis'
import { createAdminClient } from '../supabase/server'
import { OAuth2Client } from 'google-auth-library'

const OAuth2 = google.auth.OAuth2

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
} = process.env

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error('Env de Google OAuth2 ausentes. Verifique .env.local')
}

const oauth2Client = new OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/admin/gmail/callback'
)

export function generateAuthUrl() {
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
  const { tokens } = await oauth2Client.getToken(code)
  oauth2Client.setCredentials(tokens)
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

export async function getRefreshToken() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('gmail_credentials')
    .select('refresh_token')
    .eq('in_use', true)
    .single()

  if (error) {
    console.error('Erro ao obter refresh token:', error)
    return null
  }

  return data?.refresh_token
}

export async function getAccessToken(refreshToken: string, client?: OAuth2Client) {
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  try {
    const { token } = await oauth2Client.getAccessToken()
    return typeof token === 'string' ? token : token?.access_token
  } catch (error) {
    console.error('Erro ao obter access token:', error)
    return null
  }
}

export async function getMe(client?: OAuth2Client) {
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
  const { data } = await gmail.users.getProfile({ userId: 'me' })
  return data
}
