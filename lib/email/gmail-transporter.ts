import nodemailer from 'nodemailer'
import { getCurrentGmailConfig, getAccessToken } from './oauth'

const {
  GMAIL_SENDER_EMAIL,
  GMAIL_SENDER_NAME,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
} = process.env

// Only throw error in production or when actually using the Gmail functionality
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  if (!GMAIL_SENDER_EMAIL || !GMAIL_SENDER_NAME || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn('Gmail OAuth2 environment variables missing. Gmail functionality will be disabled.')
  }
}

export async function getTransporter() {
  // Check if Gmail is configured
  if (!GMAIL_SENDER_EMAIL || !GMAIL_SENDER_NAME || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Gmail OAuth2 not configured')
  }

  // Tenta obter o refresh token do banco de dados primeiro
  const gmailConfig = await getCurrentGmailConfig()
  let refreshToken = gmailConfig?.refresh_token
  // Se não encontrar no banco, usa o da variável de ambiente
  if (!refreshToken) {
    if (!GOOGLE_REFRESH_TOKEN) {
      throw new Error('Refresh token não encontrado no banco de dados ou nas variáveis de ambiente')
    }
    refreshToken = GOOGLE_REFRESH_TOKEN
  }

  // Obtém o access token usando o refresh token
  const accessToken = await getAccessToken(refreshToken)

  if (!accessToken) {
    throw new Error('Falha ao obter accessToken do Gmail OAuth2')
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: gmailConfig?.email || GMAIL_SENDER_EMAIL,
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      refreshToken,
      accessToken,
    },
  })
}

