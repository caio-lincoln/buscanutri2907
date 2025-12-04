import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'

const schema = z.object({ email: z.string().email() })

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  const checked_at = new Date().toISOString()
  if (!parsed.success) {
    return NextResponse.json({ exists: false, checked_at }, { status: 400 })
  }

  const normalizedEmail = parsed.data.email.trim().toLowerCase()
  const supabase = createAdminClient()
  const { data } = await supabase
    .schema('auth')
    .from('users')
    .select('id,email')
    .eq('email', normalizedEmail)
    .maybeSingle()

  const exists = !!data
  return NextResponse.json({ exists, checked_at })
}
