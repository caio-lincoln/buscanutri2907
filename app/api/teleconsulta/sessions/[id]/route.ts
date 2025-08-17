import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { withErrorHandling, validateAuth, validateResourceExists, ValidationError, ForbiddenError } from '@/src/lib/middleware/error-handler'
import { updateSessionStatusSchema, idParamSchema } from '@/src/lib/validations/teleconsulta'
import { createNotification } from '@/lib/notifications-service'

// PUT /api/teleconsulta/sessions/[id] - Atualizar status da sessão
export const PUT = withErrorHandling(async (
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
  
  // Validar dados do corpo da requisição
  const body = await request.json()
  const { status } = updateSessionStatusSchema.parse(body)

  // Verificar se a sessão existe e se o usuário tem permissão
  const { data: session, error: sessionError } = await supabase
    .from('teleconsulta_sessions')
    .select('*, patient_id, nutritionist_id')
    .eq('id', sessionId)
    .single()

  const validSession = validateResourceExists(sessionError ? null : session, 'Sessão não encontrada')

  // Verificar permissão (paciente ou nutricionista da sessão)
  if (validSession.patient_id !== userId && validSession.nutritionist_id !== userId) {
    throw new ForbiddenError('Sem permissão para modificar esta sessão')
  }

  // Validar transições de status
  const currentStatus = validSession.status
  const validTransitions: Record<string, string[]> = {
    'scheduled': ['in_progress', 'cancelled'],
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

  // Adicionar timestamps específicos
  if (status === 'in_progress') {
    updateData.started_at = new Date().toISOString()
  } else if (status === 'completed') {
    updateData.ended_at = new Date().toISOString()
  }

  // Atualizar sessão
  const { data: updatedSession, error: updateError } = await supabase
    .from('teleconsulta_sessions')
    .update(updateData)
    .eq('id', sessionId)
    .select()
    .single()

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
        message: `Sua teleconsulta agendada para ${new Date(validSession.scheduled_for).toLocaleString('pt-BR')} foi cancelada.`
      }
    }

    const notification = notificationMessages[status as keyof typeof notificationMessages]
    
    if (notification) {
      // Notificar paciente
      await createNotification({
        userId: validSession.patient_id,
        title: notification.title,
        message: notification.message,
        notificationType: `teleconsulta_session_${status}`,
        consultationId: sessionId,
        data: {
          session_id: sessionId,
          status,
          scheduled_for: validSession.scheduled_for
        }
      })

      // Notificar nutricionista
      await createNotification({
        userId: validSession.nutritionist_id,
        title: notification.title,
        message: notification.message,
        notificationType: `teleconsulta_session_${status}`,
        consultationId: sessionId,
        data: {
          session_id: sessionId,
          status,
          scheduled_for: validSession.scheduled_for
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
    .from('teleconsulta_sessions')
    .select('*, patient_id, nutritionist_id')
    .eq('id', sessionId)
    .single()

  const validSession = validateResourceExists(sessionError ? null : session, 'Sessão não encontrada')

  // Verificar permissão (paciente ou nutricionista da sessão)
  if (validSession.patient_id !== userId && validSession.nutritionist_id !== userId) {
    throw new ForbiddenError('Sem permissão para deletar esta sessão')
  }

  // Só permitir deletar sessões agendadas
  if (validSession.status !== 'scheduled') {
    throw new ValidationError('Só é possível deletar sessões agendadas')
  }

  // Deletar sessão
  const { error: deleteError } = await supabase
    .from('teleconsulta_sessions')
    .delete()
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
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const userId = validateAuth(authError ? null : user?.id || null)

  // Validar parâmetros
  const { id: sessionId } = idParamSchema.parse(params)

  // Buscar sessão com dados relacionados
  const { data: session, error: sessionError } = await supabase
    .from('teleconsulta_sessions')
    .select(`
      *,
      patient_profiles!inner(
        full_name,
        phone,
        email
      ),
      nutritionist_profiles!inner(
        full_name,
        phone,
        email,
        specialties
      )
    `)
    .eq('id', sessionId)
    .or(`nutritionist_id.eq.${userId},patient_id.eq.${userId}`)
    .single()

  const validSession = validateResourceExists(sessionError ? null : session, 'Sessão não encontrada')

  return NextResponse.json({ session: validSession })
})