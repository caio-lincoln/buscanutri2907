import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '../../../../lib/email/send-email'
import { createAdminClient } from '../../../../lib/supabase/server'

function mapRole(raw?: string) {
  const r = (raw || '').toUpperCase()
  if ([ 'NUTRITIONIST', 'NUTRICIONISTA' ].includes(r)) return 'NUTRITIONIST'
  if ([ 'COMPANY', 'EMPRESA' ].includes(r)) return 'COMPANY'
  return 'PATIENT'
}

export async function POST(req: NextRequest) {
  if (req.headers.get('x-webhook-token') !== `${process.env[ 'WEBHOOK_TOKEN' ]}`) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const body = await req.json()
  const rec = body?.record ?? body?.user ?? body

  const email = rec?.email

  if (!rec || !email) {
    return NextResponse.json({ error: 'Dados de usuário inválidos' }, { status: 400 })
  }

  const userType = rec?.raw_user_meta_data?.user_type
  const collection = userType === 'paciente' ? "patient_profiles" : "nutritionist_profiles"

  const supabase = createAdminClient()
  const { data: profile, error } = await supabase
    .from(collection)
    .select('*')
    .eq('user_id', rec.id)
    .single()

  if (error) {
    console.error('Erro ao buscar perfil:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao buscar perfil' }, { status: 500 })
  }

  const name = profile?.name
  const role = mapRole(userType ?? rec?.user_metadata?.user_type)

  if (!email) return NextResponse.json({ ok: false, error: 'no email' }, { status: 400 })

  await sendWelcomeEmail({ to: email, name, role })
  return NextResponse.json({ ok: true })
}
