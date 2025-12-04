import { NextResponse } from 'next/server'
import { generateAuthUrl } from '@/lib/email/oauth'
import { requireAdmin } from '@/lib/auth-utils'

export async function GET() {
  try {
    await requireAdmin()
    
    // Gera a URL de autorização
    const authUrl = generateAuthUrl()
    
    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Erro ao gerar URL de autorização:', error)
    return NextResponse.json(
      { error: 'Falha ao gerar URL de autorização' },
      { status: 500 }
    )
  }
}
