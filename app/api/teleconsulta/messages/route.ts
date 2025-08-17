import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { withErrorHandling, validateAuth, ValidationError, NotFoundError, ForbiddenError } from '@/src/lib/middleware/error-handler'
import { createNotification } from '@/lib/notifications-service'
import { z } from 'zod'

const createMessageSchema = z.object({
  session_id: z.string().uuid('ID da sessão deve ser um UUID válido'),
  message: z.string().min(1, 'Mensagem não pode estar vazia').max(1000, 'Mensagem muito longa'),
  message_type: z.enum(['text', 'file', 'system']).default('text')
})

const getMessagesQuerySchema = z.object({
  session_id: z.string().uuid('ID da sessão deve ser um UUID válido'),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
  offset: z.string().optional().transform(val => val ? parseInt(val) : 0)
})

// GET /api/teleconsulta/messages - Buscar mensagens de uma sessão
export const GET = withErrorHandling(async (request: NextRequest) => {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const userId = validateAuth(authError ? null : user?.id || null)

  // Validar parâmetros de query
  const { searchParams } = new URL(request.url)
  const queryParams = Object.fromEntries(searchParams.entries())
  const { session_id, limit, offset } = getMessagesQuerySchema.parse(queryParams)

  // Verificar se o usuário tem acesso à sessão
  const { data: session, error: sessionError } = await supabase
    .from('teleconsulta_sessions')
    .select('patient_id, nutritionist_id')
    .eq('id', session_id)
    .single()

  if (sessionError || !session) {
    throw new NotFoundError('Sessão não encontrada')
  }

  // Verificar permissão
  if (session.patient_id !== userId && session.nutritionist_id !== userId) {
    throw new ForbiddenError('Sem permissão para acessar mensagens desta sessão')
  }

  // Buscar mensagens
  const { data: messages, error: messagesError } = await supabase
    .from('teleconsulta_messages')
    .select(`
      *,
      sender:profiles!sender_id(id, full_name, avatar_url)
    `)
    .eq('session_id', session_id)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  if (messagesError) {
    throw new ValidationError('Erro ao buscar mensagens')
  }

  return NextResponse.json({ messages })
})

// POST /api/teleconsulta/messages - Enviar mensagem
export const POST = withErrorHandling(async (request: NextRequest) => {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const userId = validateAuth(authError ? null : user?.id || null)

  // Validar dados de entrada
  const body = await request.json()
  const { session_id, message, message_type } = createMessageSchema.parse(body)

  // Verificar se o usuário tem acesso à sessão
  const { data: session, error: sessionError } = await supabase
    .from('teleconsulta_sessions')
    .select('patient_id, nutritionist_id, status')
    .eq('id', session_id)
    .single()

  if (sessionError || !session) {
    throw new NotFoundError('Sessão não encontrada')
  }

  // Verificar permissão
  if (session.patient_id !== userId && session.nutritionist_id !== userId) {
    throw new ForbiddenError('Sem permissão para enviar mensagens nesta sessão')
  }

  // Verificar se a sessão está ativa
  if (session.status !== 'in_progress' && session.status !== 'scheduled') {
    throw new ValidationError('Não é possível enviar mensagens em sessões finalizadas ou canceladas')
  }

  // Criar mensagem
  const { data: newMessage, error: messageError } = await supabase
    .from('teleconsulta_messages')
    .insert({
      session_id,
      sender_id: userId,
      message,
      message_type,
      created_at: new Date().toISOString()
    })
    .select(`
      *,
      sender:profiles!sender_id(id, full_name, avatar_url)
    `)
    .single()

  if (messageError) {
    throw new ValidationError('Erro ao enviar mensagem')
  }

  // Buscar dados do remetente para notificações
  const { data: senderData } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single()

  const senderName = senderData?.full_name || 'Participante'

  // Enviar notificação para o outro participante
  try {
    const recipientId = session.patient_id === userId 
      ? session.nutritionist_id 
      : session.patient_id

    if (recipientId) {
      await createNotification({
        userId: recipientId,
        title: 'Nova Mensagem na Teleconsulta',
        message: `${senderName}: ${message.length > 50 ? message.substring(0, 50) + '...' : message}`,
        notificationType: 'teleconsulta_message',
        consultationId: session_id,
        data: {
          session_id,
          message_id: newMessage.id,
          sender_id: userId,
          sender_name: senderName,
          message_preview: message.substring(0, 100)
        }
      })
    }
  } catch (notificationError) {
    console.error('Erro ao enviar notificação de mensagem:', notificationError)
  }

  return NextResponse.json({ message: newMessage }, { status: 201 })
})