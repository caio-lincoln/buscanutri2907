import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { getCurrentGmailConfig } from '@/lib/email/oauth'

export async function GET() {
  try {
    // Verifica se o usuário é admin
    await requireAdmin()

    // Verifica se existe um refresh token no banco de dados
    const email = process.env[ "GMAIL_SENDER_EMAIL" ]
    if (!email) {
      return NextResponse.json({ connected: false })
    }

    const gmailConfig = await getCurrentGmailConfig()

    return NextResponse.json({ connected: !!gmailConfig, email: gmailConfig?.email })
  } catch (error) {
    console.error('Erro ao verificar status do Gmail:', error)
    return NextResponse.json({ connected: false })
  }
}
