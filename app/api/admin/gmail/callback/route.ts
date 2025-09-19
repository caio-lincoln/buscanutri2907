import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens, getMe, saveRefreshToken } from '@/lib/email/oauth'
import { requireAdmin } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    
    // Obtém o código de autorização da URL
    const searchParams = await request.nextUrl.searchParams
    const code = searchParams.get('code')
    
    if (!code) {
      return NextResponse.json({ connected: false, error: 'no_code' })
    }
    
    // Troca o código por tokens
    const tokens = await exchangeCodeForTokens(code)
    
    if (!tokens.refresh_token) {
      return NextResponse.json({ connected: false, error: 'no_refresh_token' })
    }
    
    const me = await getMe()
    const email = me.emailAddress || process.env['GMAIL_SENDER_EMAIL']
    
    if (!email) {
      return NextResponse.json({ connected: false, error: 'no_email' })
    }
    
    await saveRefreshToken(email, tokens.refresh_token)
    // Redireciona para o dashboard com sucesso
    return NextResponse.json({ connected: true })
  } catch (error) {
    console.error('Erro no callback do Gmail:', error)
    return NextResponse.redirect(new URL(`/dashboard/admin?error=${encodeURIComponent(String(error))}`, request.url))
  }
}
