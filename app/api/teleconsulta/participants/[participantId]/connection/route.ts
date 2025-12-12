import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withErrorHandling, validateAuth, ValidationError, NotFoundError, ForbiddenError } from '@/src/lib/middleware/error-handler'
import { idParamSchema } from '@/src/lib/validations/teleconsulta'
import { createNotification } from '@/lib/notifications-service'
import { z } from 'zod'

const connectionStatusSchema = z.object({
  is_connected: z.boolean(),
  connection_quality: z.enum(['excellent', 'good', 'fair', 'poor']).optional()
})

// PATCH /api/teleconsulta/participants/[participantId]/connection - Atualizar status de conexão
export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { participantId: string } }
) => {
  const supabase = await createClient()
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const userId = validateAuth(authError ? null : user?.id || null)

  // Validar ID do participante
  const { id: participantId } = idParamSchema.parse({ id: params.participantId })
  
  // Validar dados de entrada
  const body = await request.json()
  const { is_connected, connection_quality } = connectionStatusSchema.parse(body)

  // Buscar participante e dados da sessão
  const { data: participant, error: participantError } = await supabase
    .from('teleconsulta_participants')
    .select(`
      *,
      session:teleconsulta_sessions(id, patient_id, nutritionist_id)
    `)
    .eq('id', participantId)
    .single()

  if (participantError || !participant) {
    throw new NotFoundError('Participante não encontrado')
  }

  // Verificar permissão (apenas o próprio usuário pode atualizar sua conexão)
  if (participant.user_id !== userId) {
    throw new ForbiddenError('Sem permissão para atualizar este participante')
  }

  // Buscar dados do usuário para notificações
  const { data: userData } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single()

  const userName = userData?.full_name || 'Um participante'
  const previousConnectionStatus = participant.is_connected

  // Atualizar status de conexão
  const updateData: any = { 
    is_connected,
    updated_at: new Date().toISOString()
  }
  
  if (connection_quality) {
    updateData.connection_quality = connection_quality
  }

  // Se está se conectando, atualizar joined_at
  if (is_connected && !previousConnectionStatus) {
    updateData.joined_at = new Date().toISOString()
  }
  
  // Se está se desconectando, atualizar left_at
  if (!is_connected && previousConnectionStatus) {
    updateData.left_at = new Date().toISOString()
  }

  const { data: updatedParticipant, error: updateError } = await supabase
    .from('teleconsulta_participants')
    .update(updateData)
    .eq('id', participantId)
    .select()
    .single()

  if (updateError) {
    throw new ValidationError('Erro ao atualizar status de conexão')
  }

  // Enviar notificações sobre mudança de status de conexão
  try {
    if (participant.session && previousConnectionStatus !== is_connected) {
      const session = participant.session
      const participantsToNotify = [session.patient_id, session.nutritionist_id]
        .filter(id => id !== userId) // Não notificar quem mudou o status
      
      const kind = is_connected 
        ? 'teleconsulta_participant_connected' 
        : 'teleconsulta_participant_disconnected'
      
      const title = is_connected 
        ? 'Participante Conectado' 
        : 'Participante Desconectado'
      
      const message = is_connected 
        ? `${userName} se conectou à teleconsulta`
        : `${userName} se desconectou da teleconsulta`
      
      for (const participantToNotify of participantsToNotify) {
        await createNotification({
          userId: participantToNotify,
          title,
          message,
          type: 'info',
          actionUrl: undefined,
          metadata: {
            kind,
            session_id: session.id,
            participant_id: participantId,
            user_id: userId,
            user_name: userName,
            is_connected,
            connection_quality: connection_quality || null
          }
        })
      }
    }
  } catch (notificationError) {
    console.error('Erro ao enviar notificações de conexão:', notificationError)
  }

  return NextResponse.json({ 
    participant: updatedParticipant,
    message: `Status de conexão atualizado para ${is_connected ? 'conectado' : 'desconectado'}`
  })
})
