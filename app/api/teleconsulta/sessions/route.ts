import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'
import { withErrorHandling, validateAuth, ValidationError, ConflictError } from '@/src/lib/middleware/error-handler'
import { createTeleconsultaSessionSchema } from '@/src/lib/validations/teleconsulta'
import { createNotification } from '@/lib/notifications-service'
import { createClient } from '../../../../lib/supabase/server'

// GET - Listar sessões de teleconsulta
export const GET = withErrorHandling(async (request: NextRequest) => {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const userId = validateAuth(authError ? null : user?.id || null)

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  // Construir query base
  let query = supabase
    .from('teleconsulta_sessions')
    .select(`
      *,
      patient:patient_id(id, name, email),
      nutritionist:nutritionist_id(id, name, email, specialties)
    `)
    .or(`patient_id.eq.${userId},nutritionist_id.eq.${userId}`)
    .order('scheduled_for', { ascending: true })

  // Aplicar filtros
  if (status) {
    query = query.eq('current_status', status)
  }

  if (startDate) {
    query = query.gte('scheduled_for', startDate)
  }

  if (endDate) {
    query = query.lte('scheduled_for', endDate)
  }

  const { data: sessions, error: sessionsError } = await query

  if (sessionsError) {
    throw new Error('Erro ao buscar teleconsultas')
  }

  return NextResponse.json({ sessions })
})

// POST - Criar nova sessão de teleconsulta
export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = await createClient()
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const userId = validateAuth(authError ? null : user?.id || null)

  // Validar dados do corpo da requisição
  const body = await request.json()
  const { nutritionist_id, scheduled_for, duration_minutes, price, notes } = createTeleconsultaSessionSchema.parse(body)

  // Validar se a data é futura
  const scheduledDate = new Date(scheduled_for)
  if (scheduledDate <= new Date()) {
    throw new ValidationError('Data deve ser futura')
  }

  // Verificar se o nutricionista existe
  const { data: nutritionist, error: nutritionistError } = await supabase
    .from('nutritionist_profiles')
    .select('id')
    .eq('id', nutritionist_id)
    .single()

  if (nutritionistError || !nutritionist) {
    throw new ValidationError('Nutricionista não encontrado')
  }

  // Verificar se já existe uma sessão no mesmo horário
  const endTime = new Date(scheduledDate.getTime() + duration_minutes * 60000)
  const { data: existingSessions, error: sessionError } = await supabase
    .from('teleconsulta_sessions')
    .select('id')
    .eq('nutritionist_id', nutritionist_id)
    .eq('current_status', 'scheduled')
    .gte('scheduled_for', scheduled_for)
    .lt('scheduled_for', endTime.toISOString())

  if (sessionError) {
    throw new Error('Erro ao verificar disponibilidade')
  }

  if (existingSessions && existingSessions.length > 0) {
    throw new ConflictError('Já existe uma teleconsulta agendada neste horário')
  }

  // Gerar token único para a sessão
  const sessionToken = uuidv4()
  const joinUrl = `${process.env.NEXT_PUBLIC_APP_URL}/teleconsulta/${sessionToken}`

  // Criar sessão
  const { data: session, error: createError } = await supabase
    .from('teleconsulta_sessions')
    .insert({
      session_token: sessionToken,
      patient_id: userId,
      nutritionist_id,
      scheduled_for,
      duration_minutes,
      price,
      notes,
      current_status: 'scheduled',
      join_url: joinUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (createError) {
    throw new Error('Erro ao criar sessão de teleconsulta')
  }

  // Enviar notificações para paciente e nutricionista
  try {
    const scheduledDateTime = new Date(scheduled_for).toLocaleString('pt-BR')
    
    // Notificação para o paciente
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
        join_url: joinUrl
      }
    })

    // Notificação para o nutricionista
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
        join_url: joinUrl
      }
    })
  } catch (notificationError) {
    // Log do erro mas não falha a criação da sessão
    console.error('Erro ao enviar notificações:', notificationError)
  }

  return NextResponse.json({ session }, { status: 201 })
})