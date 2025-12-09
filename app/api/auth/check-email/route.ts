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
  // Fallback seguro: se faltar a service role key em produção, não bloquear login
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ exists: true, checked_at })
  }

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .schema('auth')
      .from('users')
      .select('id,email')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (error) {
      // Em caso de erro na consulta admin, não bloquear login do usuário
      return NextResponse.json({ exists: true, checked_at })
    }

    const exists = !!data
    return NextResponse.json({ exists, checked_at })
  } catch {
    // Em qualquer falha inesperada, retornar exists=true para evitar falsos negativos
    return NextResponse.json({ exists: true, checked_at })
  }
}
