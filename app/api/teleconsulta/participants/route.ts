import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { withErrorHandling, validateAuth, ValidationError } from '@/src/lib/middleware/error-handler'
import { createNotification } from '@/lib/notifications-service'

// POST /api/teleconsulta/participants - Adicionar participante à sessão
export const POST = withErrorHandling(async (request: NextRequest) => {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  validateAuth(authError ? null : user?.id || null)

  const { session_id, user_id, role } = await request.json()

  if (!session_id || !user_id || !role) {
    throw new ValidationError('session_id, user_id e role são obrigatórios')
  }

  // Verificar se o participante já existe na sessão
  const { data: existingParticipant, error: checkError } = await supabase
    .from('teleconsulta_participants')
    .select('id')
    .eq('session_id', session_id)
    .eq('user_id', user_id)
    .single()

  if (existingParticipant) {
    throw new ValidationError('Participante já existe na sessão')
  }

  // Adicionar participante
  const { data: participant, error: insertError } = await supabase
    .from('teleconsulta_participants')
    .insert({
      session_id,
      user_id,
      role,
      joined_at: new Date().toISOString(),
      is_connected: false
    })
    .select(`
      *,
      user:user_id(id, name, email)
    `)
    .single()

  if (insertError) {
    throw new Error('Erro ao adicionar participante')
  }

  // Buscar dados da sessão para notificações
  try {
    const { data: session } = await supabase
      .from('teleconsulta_sessions')
      .select('patient_id, nutritionist_id')
      .eq('id', session_id)
      .single()

    if (session) {
      // Buscar dados do usuário que entrou
      const { data: userData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user_id)
        .single()

      const userName = userData?.full_name || 'Um participante'
      
      // Notificar outros participantes da sessão
      const participantsToNotify = [session.patient_id, session.nutritionist_id]
        .filter(id => id !== user_id) // Não notificar quem entrou
      
      for (const participantId of participantsToNotify) {
        await createNotification({
          userId: participantId,
          title: 'Participante Entrou',
          message: `${userName} entrou na teleconsulta`,
          notificationType: 'teleconsulta_participant_joined',
          consultationId: session_id,
          data: {
            session_id,
            joined_user_id: user_id,
            joined_user_name: userName
          }
        })
      }
    }
  } catch (notificationError) {
    console.error('Erro ao enviar notificações:', notificationError)
  }

  return NextResponse.json({ participant }, { status: 201 })
})

// GET /api/teleconsulta/participants - Listar participantes de uma sessão
export const GET = withErrorHandling(async (request: NextRequest) => {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  validateAuth(authError ? null : user?.id || null)

  const { searchParams } = new URL(request.url)
  const session_id = searchParams.get('session_id')

  if (!session_id) {
    throw new ValidationError('session_id é obrigatório')
  }

  // Buscar participantes da sessão
  const { data: participants, error: participantsError } = await supabase
    .from('teleconsulta_participants')
    .select(`
      *,
      user:user_id(id, name, email)
    `)
    .eq('session_id', session_id)

  if (participantsError) {
    throw new Error('Erro ao buscar participantes')
  }

  return NextResponse.json({ participants })
})

// DELETE /api/teleconsulta/participants - Remover participante da sessão
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  validateAuth(authError ? null : user?.id || null)

  const { session_id, user_id } = await request.json()

  if (!session_id || !user_id) {
    throw new ValidationError('session_id e user_id são obrigatórios')
  }

  // Buscar dados antes de remover para notificações
  let userName = 'Um participante'
  let sessionData = null
  
  try {
    const { data: userData } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user_id)
      .single()
    
    const { data: session } = await supabase
      .from('teleconsulta_sessions')
      .select('patient_id, nutritionist_id')
      .eq('id', session_id)
      .single()
    
    userName = userData?.full_name || 'Um participante'
    sessionData = session
  } catch (error) {
    console.error('Erro ao buscar dados para notificação:', error)
  }

  // Remover participante
  const { error: deleteError } = await supabase
    .from('teleconsulta_participants')
    .delete()
    .eq('session_id', session_id)
    .eq('user_id', user_id)

  if (deleteError) {
    throw new Error('Erro ao remover participante')
  }

  // Enviar notificações sobre saída do participante
  try {
    if (sessionData) {
      const participantsToNotify = [sessionData.patient_id, sessionData.nutritionist_id]
        .filter(id => id !== user_id) // Não notificar quem saiu
      
      for (const participantId of participantsToNotify) {
        await createNotification({
          userId: participantId,
          title: 'Participante Saiu',
          message: `${userName} saiu da teleconsulta`,
          notificationType: 'teleconsulta_participant_left',
          consultationId: session_id,
          data: {
            session_id,
            left_user_id: user_id,
            left_user_name: userName
          }
        })
      }
    }
  } catch (notificationError) {
    console.error('Erro ao enviar notificações:', notificationError)
  }

  return NextResponse.json({ message: 'Participante removido com sucesso' })
})