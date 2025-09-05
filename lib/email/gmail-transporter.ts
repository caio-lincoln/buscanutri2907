import nodemailer from 'nodemailer'
import { google } from 'googleapis'

const OAuth2 = google.auth.OAuth2

const {
  GMAIL_SENDER_EMAIL,
  GMAIL_SENDER_NAME,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
} = process.env

if (!GMAIL_SENDER_EMAIL || !GMAIL_SENDER_NAME || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
  throw new Error('Env de Gmail OAuth2 ausentes. Verifique .env.local')
}

const oauth2Client = new OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
)
console.log("🚀 ~ oauth2Client:", oauth2Client)

oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN })

export async function getTransporter() {
  const { token } = await oauth2Client.getAccessToken()
  console.log("🚀 ~ getTransporter ~ token:", token)
  const accessToken = typeof token === 'string' ? token : token?.access_token

  if (!accessToken) throw new Error('Falha ao obter accessToken do Gmail OAuth2')

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: GMAIL_SENDER_EMAIL,
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      refreshToken: GOOGLE_REFRESH_TOKEN,
      accessToken,
    },
  })
}

export const FROM = `${GMAIL_SENDER_NAME} <${GMAIL_SENDER_EMAIL}>`