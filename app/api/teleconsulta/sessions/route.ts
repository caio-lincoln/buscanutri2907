export const runtime = 'nodejs'

import { createAdminClient, createClient as createServerClient } from '../../../../lib/supabase/server'

export async function POST(req: Request): Promise<Response> {
  try {
    console.log('STAGE 1 - endpoint iniciou')

    const body = await req.json()
    console.log('STAGE 2 - body recebido', body)

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      throw new Error('ENV_MISSING_SUPABASE_URL')
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('ENV_MISSING_SERVICE_ROLE')
    }

    console.log('STAGE 3 - env ok')

    const supabaseAdmin = createAdminClient()
    const supabaseUser = await createServerClient()

    const { data: authData, error: authError } = await (supabaseUser as any).auth.getUser()

    console.log('STAGE 4 - auth', authData, authError)

    if (authError || !authData?.user) {
      return Response.json(
        { ok: false, stage: 'AUTH_FAIL', error: authError ?? null },
        { status: 401 },
      )
    }

    const scheduledAtUTC = new Date(body.scheduled_for).toISOString()
    console.log('STAGE 5 - date UTC', scheduledAtUTC)

    if (Number.isNaN(new Date(scheduledAtUTC).getTime())) {
      return Response.json(
        { ok: false, stage: 'INVALID_DATE', message: 'Data de agendamento inválida' },
        { status: 400 },
      )
    }

    const { data, error } = await supabaseAdmin
      .from('teleconsulta_sessions')
      .insert({
        nutritionist_id: body.nutritionist_id,
        patient_id: authData.user.id,
        scheduled_at: scheduledAtUTC,
        duration_minutes: body.duration_minutes,
        price: body.price,
        status: 'pending',
      })
      .select()
      .single()

    console.log('STAGE 6 - insert result', data, error)

    if (error) {
      return Response.json(
        {
          ok: false,
          stage: 'INSERT_FAIL',
          error: error.message,
          details: error,
        },
        { status: 400 },
      )
    }

    return Response.json(
      {
        ok: true,
        stage: 'SUCCESS',
        session: data,
      },
      { status: 200 },
    )
  } catch (e: any) {
    console.error('STAGE 500 - catch', e)
    return Response.json(
      {
        ok: false,
        stage: 'CATCH_ROOT',
        message: String(e),
      },
      { status: 500 },
    )
  }
}

