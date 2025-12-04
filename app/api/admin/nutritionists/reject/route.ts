import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '../../../../../lib/supabase/server'
import { requireAdmin } from '../../../../../lib/auth-utils'

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
    return NextResponse.json({ ok: false, message: 'Payload inválido' }, { status: 400 })
  }
  const { nutritionistProfileId, reason } = parsed.data

  // Marcar perfil como não verificado e salvar motivo da rejeição no campo verification_notes dos documentos mais recentes
  const { error: upErr } = await supabaseAdmin
    .from('nutritionist_profiles')
    .update({ is_verified: false, verified_at: null })
    .eq('id', nutritionistProfileId)

  if (upErr) {
    return NextResponse.json({ ok: false, message: upErr.message || 'Falha ao rejeitar' }, { status: 500 })
  }

  // Opcional: anexar notas de verificação aos documentos pendentes do nutricionista
  const { error: notesErr } = await supabaseAdmin
    .from('nutritionist_documents')
    .update({ verification_notes: reason, is_verified: false })
    .eq('nutritionist_id', nutritionistProfileId)

  if (notesErr) {
    // Não falhar a operação principal por erro secundário de notas; retornar ok com aviso
    return NextResponse.json({ ok: true, message: 'Rejeição registrada, porém falha ao salvar notas' })
  }

  return NextResponse.json({ ok: true })
}
