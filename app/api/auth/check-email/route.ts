import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'

const schema = z.object({ email: z.string().email() })

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ exists: false }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data } = await supabase
    .schema('auth')
    .from('users')
    .select('id,email')
    .eq('email', parsed.data.email)
    .maybeSingle()

  return NextResponse.json({ exists: !!data })
}
