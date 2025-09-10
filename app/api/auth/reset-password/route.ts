import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Inclua letra maiúscula')
    .regex(/[a-z]/, 'Inclua letra minúscula')
    .regex(/[0-9]/, 'Inclua número'),
})

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'Senha inválida' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}
