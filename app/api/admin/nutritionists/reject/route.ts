import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '../../../../../lib/supabase/server'
import { requireAdmin } from '../../../../../lib/auth-utils'
import { getTransporter } from '../../../../../lib/email/gmail-transporter'

const schema = z.object({
  nutritionistProfileId: z.string().uuid(),
  reason: z.string().min(3).max(2000)
})

export async function POST(req: Request) {
  await requireAdmin()
  const supabaseAdmin = createAdminClient()

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    console.error('[ADMIN][nutritionists/reject] Payload inválido', parsed.error?.flatten?.())
    return NextResponse.json({ ok: false, message: 'Payload inválido' }, { status: 400 })
  }
  const { nutritionistProfileId, reason } = parsed.data

  console.log('[ADMIN][nutritionists/reject] Iniciando rejeição de nutricionista', {
    nutritionistProfileId,
    reason,
  })

  const { error: upErr } = await supabaseAdmin
    .from('nutritionist_profiles')
    .update({ verification_status: 'reprovado', is_verified: false, verified_at: null })
    .eq('id', nutritionistProfileId)

  if (upErr) {
    console.error('[ADMIN][nutritionists/reject] Erro ao atualizar perfil', {
      nutritionistProfileId,
      reason,
      error: upErr,
    })
    return NextResponse.json({ ok: false, message: upErr.message || 'Falha ao rejeitar' }, { status: 500 })
  }

  // Opcional: anexar notas de verificação aos documentos pendentes do nutricionista
  const { error: notesErr } = await supabaseAdmin
    .from('nutritionist_documents')
    .update({ verification_notes: reason, is_verified: false })
    .eq('nutritionist_id', nutritionistProfileId)

  if (notesErr) {
    console.error('[ADMIN][nutritionists/reject] Falha ao salvar notas de verificação', {
      nutritionistProfileId,
      reason,
      error: notesErr,
    })
    return NextResponse.json({ ok: true, message: 'Rejeição registrada, porém falha ao salvar notas' })
  }

  try {
    const { data: profileRow, error: profileErr } = await supabaseAdmin
      .from('nutritionist_profiles')
      .select('id, user_id, full_name')
      .eq('id', nutritionistProfileId)
      .maybeSingle()

    if (profileErr || !profileRow?.user_id) {
      console.error('[ADMIN][nutritionists/reject] Falha ao buscar perfil para notificação', {
        nutritionistProfileId,
        reason,
        error: profileErr,
      })
      return NextResponse.json({ ok: true })
    }

    const { data: userRow, error: userErr } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('id', profileRow.user_id)
      .maybeSingle()

    if (userErr || !userRow?.email) {
      console.error('[ADMIN][nutritionists/reject] Falha ao buscar usuário para notificação', {
        nutritionistProfileId,
        reason,
        error: userErr,
      })
      return NextResponse.json({ ok: true })
    }

    const { data: settings } = await supabaseAdmin
      .from('platform_settings')
      .select('platform_name, contact_email')
      .eq('id', 1)
      .maybeSingle()

    const appName = settings?.platform_name || process.env.NEXT_PUBLIC_APP_NAME || 'BuscaNutri'
    const supportEmail = settings?.contact_email || process.env.GMAIL_SENDER_EMAIL || 'contato@buscanutri.com'
    const whatsappDisplay =
      process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_DISPLAY || '(79) 9 9813-4938'
    const whatsappRaw =
      process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_RAW || '5579998134938'

    const transporter = await getTransporter()

    const subject = `[${appName}] Seu cadastro de nutricionista foi reprovado`

    const html = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f9fafb; color: #111827;">
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">Seu cadastro foi analisado</h2>
        <p style="margin-bottom: 12px;">
          Olá${profileRow.full_name ? `, ${profileRow.full_name.split(' ')[0]}` : ''}!
        </p>
        <p style="margin-bottom: 12px;">
          O seu cadastro como nutricionista na plataforma <strong>${appName}</strong> foi analisado,
          mas no momento <strong>não foi aprovado</strong>.
        </p>
        <p style="margin-bottom: 12px;">
          <strong>Motivo informado pela equipe:</strong><br />
          <span style="white-space: pre-line;">${reason}</span>
        </p>
        <p style="margin-bottom: 12px;">
          Se tiver qualquer dúvida ou quiser ajustar seus dados/documentos, fale com o nosso time
          pelo WhatsApp em horário comercial:
        </p>
        <p style="margin-bottom: 12px;">
          <a href="https://wa.me/${whatsappRaw}" style="color: #10b981; font-weight: 600; text-decoration: none;">
            ${whatsappDisplay}
          </a>
        </p>
        <p style="margin-top: 24px; font-size: 13px; color: #6b7280;">
          Atenciosamente,<br />
          Equipe ${appName}
        </p>
      </div>
    `

    const text = [
      `Seu cadastro de nutricionista na plataforma ${appName} foi analisado, mas no momento não foi aprovado.`,
      '',
      'Motivo informado pela equipe:',
      reason,
      '',
      `Em caso de dúvidas, fale com nosso time pelo WhatsApp: ${whatsappDisplay}`,
    ].join('\n')

    await transporter.sendMail({
      from: `${appName} <${supportEmail}>`,
      to: userRow.email,
      subject,
      text,
      html,
    })

    console.log('[ADMIN][nutritionists/reject] Email de reprovação enviado com sucesso', {
      nutritionistProfileId,
      userId: userRow.id,
      email: userRow.email,
    })
  } catch (notifyErr) {
    console.error('[ADMIN][nutritionists/reject] Falha ao enviar notificação de reprovação', {
      nutritionistProfileId,
      reason,
      error: notifyErr,
    })
  }

  return NextResponse.json({ ok: true })
}
