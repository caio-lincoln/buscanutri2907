import { NextResponse } from 'next/server'
import { checkOutdatedPackages } from '@/lib/update-checker'
import { sendSystemUpdateNotification } from '@/lib/email/system-notifications'
import { requireAdmin } from '@/lib/auth-utils'

// Emails que receberão as notificações
// Pode ser configurado via variável de ambiente: SYSTEM_UPDATE_EMAILS="email1@test.com,email2@test.com"
const DEFAULT_RECIPIENTS = process.env.SYSTEM_UPDATE_EMAILS 
  ? process.env.SYSTEM_UPDATE_EMAILS.split(',') 
  : ['admin@buscanutri.com.br'] // Fallback

export async function GET(request: Request) {
  try {
    // Verificação de segurança:
    // 1. Tenta autenticação de admin (sessão)
    // 2. OU verifica header de autorização para CRON (se configurado)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`

    if (!isCron) {
      // Se não for cron autenticado, exige sessão de admin
      await requireAdmin()
    }

    console.log('🔍 Iniciando verificação de atualizações do sistema...')

    const result = await checkOutdatedPackages()

    if (result.error) {
      return NextResponse.json({ 
        ok: false, 
        message: 'Erro ao verificar atualizações', 
        error: result.error 
      }, { status: 500 })
    }

    if (!result.hasUpdates) {
      return NextResponse.json({ 
        ok: true, 
        message: 'Sistema atualizado. Nenhuma nova versão encontrada.',
        timestamp: new Date().toISOString()
      })
    }

    // Se houver atualizações, envia e-mail
    console.log(`📦 Encontrados ${Object.keys(result.packages).length} pacotes desatualizados. Enviando notificação...`)
    
    // Filtra destinatários vazios e limpa espaços
    const recipients = DEFAULT_RECIPIENTS
      .map(e => e.trim())
      .filter(e => e.length > 0)

    await sendSystemUpdateNotification(result.packages, recipients)

    return NextResponse.json({
      ok: true,
      message: 'Atualizações encontradas e notificação enviada com sucesso.',
      updates_found: Object.keys(result.packages).length,
      recipients,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Falha na verificação de atualizações:', error)
    return NextResponse.json({ 
      ok: false, 
      message: 'Erro interno no servidor', 
      error: String(error) 
    }, { status: 500 })
  }
}
