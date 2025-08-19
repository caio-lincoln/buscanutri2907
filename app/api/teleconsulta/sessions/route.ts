import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { withErrorHandling, validateAuth, ValidationError, ConflictError } from '@/src/lib/middleware/error-handler'
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
      patient_profiles!patient_id(id, full_name, email),
      nutritionist_profiles!nutritionist_id(id, full_name, email, specialties)
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
  console.log("🚀 ~ scheduledDate:", scheduledDate)
  if (scheduledDate <= new Date()) {
    throw new ValidationError('Data deve ser futura')
  }

  // Verificar se o nutricionista existe
  const { data: nutritionist, error: nutritionistError } = await supabase
  .from('nutritionist_profiles')
  .select('id, user_id')
  .eq('id', nutritionist_id)
  .single()
  
  if (nutritionistError || !nutritionist) {
    throw new ValidationError('Nutricionista não encontrado')
  }

  // Buscar perfil do paciente
  const { data: patient, error: patientError } = await supabase
    .from('patient_profiles')
    .select('id, user_id')
    .eq('user_id', userId)
    .single()

  if (patientError || !patient) {
    throw new ValidationError('Perfil do paciente não encontrado')
  }

  // Verificar se já existe uma sessão no mesmo horário
  const endTime = new Date(scheduledDate.getTime() + duration_minutes * 60000)
  const { data: existingSessions, error: sessionError } = await supabase
  .from('teleconsulta_sessions')
  .select('id')
  .eq('nutritionist_id', nutritionist.id)
  .eq('status', 'scheduled')
  .gte('scheduled_at', scheduled_for)
  .lt('scheduled_at', endTime.toISOString())
  
  if (sessionError) {
    throw new Error('Erro ao verificar disponibilidade')
  }

  if (existingSessions && existingSessions.length > 0) {
    throw new ConflictError('Já existe uma teleconsulta agendada neste horário')
  }

  // Gerar token único para a sessão
  const sessionToken = uuidv4()
  const origin = new URL(request.url).origin;
  const joinUrl = `${origin}/teleconsulta/${sessionToken}`

  // Criar sessão
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
      status: 'scheduled',
      join_url: joinUrl
    })
    .select()
    .single()

  console.log("🚀 ~ createError:", createError)
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