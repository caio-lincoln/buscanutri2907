import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '../../../../../lib/supabase/server'
import { requireAdmin } from '../../../../../lib/auth-utils'

const schema = z.object({
  nutritionistProfileId: z.string().uuid(),
})

export async function POST(req: Request) {
  await requireAdmin()
  const supabaseAdmin = createAdminClient()

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'Payload inválido' }, { status: 400 })
  }
  const { nutritionistProfileId } = parsed.data

  const { error: pErr } = await supabaseAdmin.from('nutritionist_profiles')
    .update({ verification_status: 'aprovado', is_verified: true, verified_at: new Date().toISOString() })
    .eq('id', nutritionistProfileId)

  if (pErr) {
    return NextResponse.json(
      { ok: false, message: (pErr)?.message || 'Falha ao aprovar' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
