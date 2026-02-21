import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { ZodError } from 'zod'
import { withErrorHandling, ValidationError, ConflictError, validateAuth } from '@/src/lib/middleware/error-handler'
import { createTeleconsultaSessionSchema } from '@/src/lib/validations/teleconsulta'
import { createNotification } from '@/lib/notifications-service'
import { createClient } from '../../../../lib/supabase/server'
import { format, parseISO } from 'date-fns'

// GET - Listar sessões de teleconsulta
export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = await createClient()

  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const userId = validateAuth(authError ? null : user?.id || null)

  const { searchParams } = new URL(request.url)
  const userType = searchParams.get('userType') || 'patient'
  const status = searchParams.get('status')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  // Buscar o ID do perfil baseado no tipo de usuário
  let profileId: string
  if (userType === 'nutritionist') {
    const { data: nutritionist, error: nutritionistError } = await supabase
      .from('nutritionist_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (nutritionistError || !nutritionist) {
      throw new Error('Perfil de nutricionista não encontrado')
    }
    profileId = nutritionist.id
  } else {
    const { data: patient, error: patientError } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (patientError || !patient) {
      throw new Error('Perfil de paciente não encontrado')
    }
    profileId = patient.id
  }

  // Construir query base
  let query = supabase
    .from('teleconsulta_sessions')
    .select(`
      *,
      nutritionist:nutritionist_profiles!teleconsulta_sessions_nutritionist_id_fkey (
            id, user_id, full_name, profile_image_url
          ),
          patient:patient_profiles!teleconsulta_sessions_patient_id_fkey (
            id, user_id, full_name, phone, profile_image_url
          )
    `)
    .eq(userType === 'nutritionist' ? 'nutritionist_id' : 'patient_id', profileId)
    .order('scheduled_at', { ascending: true })

  // Aplicar filtros
  if (status) {
    query = query.eq('status', status)
  }

  if (startDate) {
    query = query.gte('scheduled_at', startDate)
  }

  if (endDate) {
    query = query.lte('scheduled_at', endDate)
  }

  const { data: sessions, error: sessionsError } = await query

  if (sessionsError) {
    throw new Error('Erro ao buscar teleconsultas')
  }

  return NextResponse.json({ sessions })
})

function buildErrorResponse(requestId: string, code: string, message: string, status: number, details?: Record<string, unknown>) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
        details: {
          requestId,
          ...details,
        },
      },
    },
    { status },
  )
}

function buildSuccessResponse(requestId: string, data: Record<string, unknown>, status: number = 200) {
  return NextResponse.json(
    {
      ok: true,
      data,
      requestId,
    },
    { status },
  )
}

export const POST = async (request: NextRequest) => {
  const requestId = uuidv4()
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user?.id) {
      console.error('teleconsulta/sessions POST auth error', { requestId, authError })
      return buildErrorResponse(requestId, 'AUTH_REQUIRED', 'Usuário não autenticado', 401)
    }

    const userId = user.id

    const body = await request.json()

    let parsedBody: any
    try {
      parsedBody = createTeleconsultaSessionSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.errors
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join(', ')
        console.error('teleconsulta/sessions POST validation error', {
          requestId,
          error: errorMessage,
        })
        return buildErrorResponse(
          requestId,
          'INVALID_DATETIME',
          `Dados de agendamento inválidos: ${errorMessage}`,
          422,
          { fields: error.errors },
        )
      }
      console.error('teleconsulta/sessions POST schema error', { requestId, error })
      return buildErrorResponse(
        requestId,
        'INVALID_DATETIME',
        'Dados de agendamento inválidos',
        422,
      )
    }

    const { nutritionist_id, scheduled_for, duration_minutes, price, notes } = parsedBody

    const scheduledDate = new Date(scheduled_for)
    const nowUtcMs = Date.now()
    const minFutureMs = nowUtcMs + 5 * 60 * 1000

    if (Number.isNaN(scheduledDate.getTime())) {
      console.error('teleconsulta/sessions POST invalid datetime', { requestId, scheduled_for })
      return buildErrorResponse(requestId, 'INVALID_DATETIME', 'Data e horário inválidos', 400)
    }

    if (scheduledDate.getTime() <= minFutureMs) {
      console.error('teleconsulta/sessions POST datetime not future', { requestId, scheduled_for, nowUtcMs })
      return buildErrorResponse(requestId, 'DATETIME_MUST_BE_FUTURE', 'Data deve ser futura', 422)
    }

    const validDurations = [30, 45, 60, 90, 120]
    if (!validDurations.includes(duration_minutes)) {
      console.error('teleconsulta/sessions POST invalid duration', { requestId, duration_minutes })
      return buildErrorResponse(requestId, 'INVALID_DATETIME', 'Duração inválida para teleconsulta', 400)
    }

    const { data: nutritionist, error: nutritionistError } = await supabase
      .from('nutritionist_profiles')
      .select('id, user_id')
      .eq('id', nutritionist_id)
      .single()

    if (nutritionistError || !nutritionist) {
      console.error('teleconsulta/sessions POST nutritionist not found', { requestId, nutritionist_id, nutritionistError })
      return buildErrorResponse(requestId, 'NUTRITIONIST_NOT_FOUND', 'Nutricionista não encontrado', 404)
    }

    const { data: patient, error: patientError } = await supabase
      .from('patient_profiles')
      .select('id, user_id')
      .eq('user_id', userId)
      .single()

    if (patientError || !patient) {
      console.error('teleconsulta/sessions POST patient profile not found', { requestId, userId, patientError })
      return buildErrorResponse(
        requestId,
        'PROFILE_NOT_FOUND',
        'Seu perfil não foi encontrado. Faça login novamente ou complete seu cadastro.',
        404,
      )
    }

    const endTime = new Date(scheduledDate.getTime() + duration_minutes * 60000)
    const { data: existingSessions, error: sessionError } = await supabase
      .from('teleconsulta_sessions')
      .select('id')
      .eq('nutritionist_id', nutritionist.id)
      .eq('status', 'scheduled')
      .gte('scheduled_at', scheduled_for)
      .lt('scheduled_at', endTime.toISOString())

    if (sessionError) {
      console.error('teleconsulta/sessions POST availability check error', { requestId, sessionError })
      return buildErrorResponse(requestId, 'DB_ERROR', 'Erro ao verificar disponibilidade', 500)
    }

    if (existingSessions && existingSessions.length > 0) {
      console.error('teleconsulta/sessions POST slot conflict', { requestId, nutritionist_id, scheduled_for })
      return buildErrorResponse(
        requestId,
        'SLOT_CONFLICT',
        'Horário indisponível. Escolha outro horário.',
        409,
      )
    }

    const sessionToken = uuidv4()
    const origin = process.env.APP_BASE_URL || new URL(request.url).origin
    const joinUrl = `${origin}/teleconsulta/${sessionToken}`

    const { data: session, error: createError } = await supabase
      .from('teleconsulta_sessions')
      .insert({
        session_token: sessionToken,
        patient_id: patient.id,
        nutritionist_id: nutritionist.id,
        scheduled_at: scheduled_for,
        duration_minutes,
        price,
        notes,
        status: 'pending_payment',
        join_url: joinUrl,
      })
      .select()
      .single()

    if (createError || !session) {
      const code = createError?.code === '42501' ? 'RLS_DENIED' : 'DB_ERROR'
      const message =
        createError?.code === '42501'
          ? 'Permissão insuficiente. Faça login novamente.'
          : 'Erro ao criar sessão de teleconsulta'
      console.error('teleconsulta/sessions POST create session error', { requestId, createError })
      return buildErrorResponse(requestId, code, message, createError?.code === '42501' ? 403 : 500)
    }

    try {
      const scheduledDateTime = new Date(scheduled_for).toLocaleString('pt-BR')

      await createNotification({
        userId: userId,
        title: 'Teleconsulta Agendada',
        message: `Sua teleconsulta foi agendada para ${scheduledDateTime}`,
        notificationType: 'teleconsulta_session_scheduled',
        consultationId: session.id,
        data: {
          session_id: session.id,
          scheduled_for,
          nutritionist_id,
          join_url: joinUrl,
        },
      })

      await createNotification({
        userId: nutritionist_id,
        title: 'Nova Teleconsulta Agendada',
        message: `Uma nova teleconsulta foi agendada para ${scheduledDateTime}`,
        notificationType: 'teleconsulta_session_scheduled',
        consultationId: session.id,
        data: {
          session_id: session.id,
          scheduled_for,
          patient_id: userId,
          join_url: joinUrl,
        },
      })
    } catch (notificationError) {
      console.error('teleconsulta/sessions POST notification error', { requestId, notificationError })
    }

    const responseData = {
      sessionId: session.id,
      amount: session.price,
      currency: 'brl',
      session,
    }

    return buildSuccessResponse(requestId, responseData, 201)
  } catch (error) {
    console.error('teleconsulta/sessions POST unexpected error', { requestId, error })
    return buildErrorResponse(requestId, 'DB_ERROR', 'Erro interno ao criar sessão de teleconsulta', 500)
  }
}
