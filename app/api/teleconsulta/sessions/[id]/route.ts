import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { withErrorHandling, validateAuth, validateResourceExists, ValidationError, ForbiddenError } from '@/src/lib/middleware/error-handler'
import { updateSessionStatusSchema, idParamSchema } from '@/src/lib/validations/teleconsulta'
import { createNotification } from '@/lib/notifications-service'
import { createClient } from '../../../../../lib/supabase/server'

// PUT /api/teleconsulta/sessions/[id] - Atualizar status da sessão
export const PUT = withErrorHandling(async (
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) => {
  const params = await props.params;

  const supabase = await createClient()
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const userId = validateAuth(authError ? null : user?.id || null)

  // Validar parâmetros
  const { id: sessionId } = idParamSchema.parse(params)
  
  // Validar dados do corpo da requisição
  const body = await request.json()
  const { status } = updateSessionStatusSchema.parse(body)

  // Verificar se a sessão existe e se o usuário tem permissão
  const { data: session, error: sessionError } = await supabase
  .from('appointments')
  .select(`
    id, scheduled_at, price, status,
    nutritionist:nutritionist_profiles!fk_appointments_nutritionist_id (
      id, user_id, full_name, profile_image_url
    ),
    patient:patient_profiles!appointments_patient_id_fkey (
      id, user_id, full_name, phone, profile_image_url
    )
  `)
  .eq('id', sessionId)
  .single()

  const validSession = validateResourceExists(sessionError ? null : session, 'Sessão não encontrada')

  // Verificar permissão (paciente ou nutricionista da sessão)
  if (validSession.patient.user_id !== userId && validSession.nutritionist.user_id !== userId) {
    throw new ForbiddenError('Sem permissão para modificar esta sessão')
  }

  // Validar transições de status
  const currentStatus = validSession.status
  const validTransitions: Record<string, string[]> = {
    'paid': ['in_progress', 'cancelled'], // 'paid' equivale a 'scheduled'
    'scheduled': ['in_progress', 'cancelled'], // caso já tenha sido migrado ou criado como scheduled
    'in_progress': ['completed', 'cancelled'],
    'completed': [],
    'cancelled': []
  }

  if (!validTransitions[currentStatus]?.includes(status)) {
    throw new ValidationError(`Não é possível alterar status de '${currentStatus}' para '${status}'`)
  }

  // Preparar dados para atualização
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  }
  
  // Atualizar sessão
  const { data: updatedSession, error: updateError } = await supabase
  .from('appointments')
  .update(updateData)
  .eq('id', sessionId)
  .select('*')
  .maybeSingle()
  
  if (updateError) {
    throw new Error('Erro ao atualizar sessão')
  }

  // Enviar notificações baseadas no novo status
  try {
    const notificationMessages = {
      'in_progress': {
        title: 'Teleconsulta Iniciada',
        message: 'Sua teleconsulta foi iniciada. Clique para entrar na sala.'
      },
      'completed': {
        title: 'Teleconsulta Finalizada',
        message: 'Sua teleconsulta foi finalizada. Obrigado pela participação!'
      },
      'cancelled': {
        title: 'Teleconsulta Cancelada',
        message: `Sua teleconsulta agendada para ${new Date(validSession.scheduled_at).toLocaleString('pt-BR')} foi cancelada.`
      }
    }

    const notification = notificationMessages[status as keyof typeof notificationMessages]
    
    if (notification) {
      // Notificar paciente
      await createNotification({
        userId: validSession.patient.user_id, // Usando user_id do perfil
        title: notification.title,
        message: notification.message,
        notificationType: `teleconsulta_session_${status}`,
        consultationId: sessionId,
        data: {
          session_id: sessionId,
          status,
          scheduled_at: validSession.scheduled_at
        }
      })

      // Notificar nutricionista
      await createNotification({
        userId: validSession.nutritionist.user_id, // Usando user_id do perfil
        title: notification.title,
        message: notification.message,
        notificationType: `teleconsulta_session_${status}`,
        consultationId: sessionId,
        data: {
          session_id: sessionId,
          status,
          scheduled_at: validSession.scheduled_at
        }
      })
    }
  } catch (notificationError) {
    // Log do erro mas não falha a atualização
    console.error('Erro ao enviar notificações:', notificationError)
  }

  return NextResponse.json({ session: updatedSession })
})

// DELETE /api/teleconsulta/sessions/[id] - Deletar sessão (apenas se agendada)
export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const userId = validateAuth(authError ? null : user?.id || null)

  // Validar parâmetros
  const { id: sessionId } = idParamSchema.parse(params)

  // Verificar se a sessão existe e se o usuário tem permissão
  const { data: session, error: sessionError } = await supabase
    .from('appointments')
    .select('*, patient:patient_profiles!appointments_patient_id_fkey(user_id), nutritionist:nutritionist_profiles!fk_appointments_nutritionist_id(user_id)')
    .eq('id', sessionId)
    .single()

  const validSession = validateResourceExists(sessionError ? null : session, 'Sessão não encontrada')

  // Verificar permissão (paciente ou nutricionista da sessão)
  const patientUserId = validSession.patient?.user_id
  const nutritionistUserId = validSession.nutritionist?.user_id
  
  if (patientUserId !== userId && nutritionistUserId !== userId) {
    throw new ForbiddenError('Sem permissão para deletar esta sessão')
  }

  // Só permitir deletar sessões agendadas/pagas
  if (validSession.status !== 'paid' && validSession.status !== 'scheduled') {
    throw new ValidationError('Só é possível deletar sessões agendadas')
  }

  // Soft delete sessão
  const { error: deleteError } = await supabase
    .from('appointments')
    .update({ is_deleted: true, deleted_at: new Date().toISOString(), status: 'cancelled' })
    .eq('id', sessionId)

  if (deleteError) {
    throw new Error('Erro ao deletar sessão')
  }

  return NextResponse.json({ message: 'Sessão deletada com sucesso' })
})

// GET /api/teleconsulta/sessions/[id] - Buscar sessão específica
export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const supabase = await createClient()
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  validateAuth(authError ? null : user?.id || null)

  // Validar parâmetros
  const { id: sessionId } = idParamSchema.parse(await params)

  // Buscar sessão com dados relacionados
  const { data: session, error: sessionError } = await supabase
    .from('appointments')
    .select(`
      id, scheduled_at, price, status, join_url:online_meeting_link,
      nutritionist:nutritionist_profiles!fk_appointments_nutritionist_id (
        id, user_id, full_name, profile_image_url
      ),
      patient:patient_profiles!appointments_patient_id_fkey (
        id, user_id, full_name, phone, profile_image_url
      )
    `)
    .eq('id', sessionId)
    // .or(`nutritionist_id.eq.${userId},patient_id.eq.${userId}`)
    .maybeSingle()

  const validSession = validateResourceExists(sessionError ? null : session, 'Sessão não encontrada')

  return NextResponse.json({ session: validSession })
})
