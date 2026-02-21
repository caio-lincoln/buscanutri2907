import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { withErrorHandling } from '@/src/lib/middleware/error-handler'
import { createTeleconsultaSessionSchema } from '@/src/lib/validations/teleconsulta'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabaseUser = await createClient()
  const supabaseAdmin = createAdminClient()

  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user?.id) {
    return NextResponse.json({ ok: false, message: 'Não autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createTeleconsultaSessionSchema.parse(body)

  const { nutritionist_id, scheduled_for, duration_minutes, price, notes } = parsed

  const scheduledAtUTC = new Date(scheduled_for).toISOString()
  if (Number.isNaN(new Date(scheduledAtUTC).getTime())) {
    return NextResponse.json({ ok: false, message: 'Data inválida' }, { status: 400 })
  }

  const { data: nutritionist } = await supabaseAdmin
    .from('nutritionist_profiles')
    .select('id')
    .eq('id', nutritionist_id)
    .single()

  if (!nutritionist) {
    return NextResponse.json({ ok: false, message: 'Nutricionista não encontrado' }, { status: 404 })
  }

  const { data: patient } = await supabaseAdmin
    .from('patient_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!patient) {
    return NextResponse.json({ ok: false, message: 'Perfil do paciente não encontrado' }, { status: 404 })
  }

  const sessionToken = uuidv4()
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_BASE_URL ||
    new URL(request.url).origin

  const joinUrl = `${siteUrl}/teleconsulta/${sessionToken}`

  const { data: session, error } = await supabaseAdmin
    .from('teleconsulta_sessions')
    .insert({
      session_token: sessionToken,
      join_url: joinUrl,
      scheduled_at: scheduledAtUTC,
      duration_minutes,
      price,
      notes,
      patient_id: patient.id,
      nutritionist_id: nutritionist.id,
      status: 'pending_payment',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message, details: error },
      { status: 500 },
    )
  }

  return NextResponse.json(
    {
      ok: true,
      sessionId: session.id,
      session_token: session.session_token,
      join_url: session.join_url,
      amount: session.price,
      currency: 'brl',
    },
    { status: 201 },
  )
})
