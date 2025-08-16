import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/api-middleware'
import { validateAuth } from '@/lib/auth-utils'
import { createNotification } from '@/lib/notifications-service'
import { createSupabaseClient } from '@/lib/supabase'
import { z } from 'zod'
import { ValidationError, NotFoundError } from '@/lib/errors'

// Schema para notificações de teleconsulta
const teleconsultaNotificationSchema = z.object({
  session_id: z.string().uuid(),
  notification_type: z.enum([
    'session_scheduled',
    'session_reminder',
    'session_started',
    'session_ended',
    'session_cancelled',
    'participant_joined',
    'participant_left',
    'agenda_updated'
  ]),
  recipient_id: z.string().uuid().optional(), // Se não especificado, notifica todos os participantes
  custom_message: z.string().optional()
})

const supabase = createSupabaseClient()

// Mensagens padrão para cada tipo de notificação
const getNotificationContent = (type: string, sessionData: any, customMessage?: string) => {
  const baseMessages = {
    session_scheduled: {
      title: 'Teleconsulta Agendada',
      message: customMessage || `Sua teleconsulta foi agendada para ${new Date(sessionData.scheduled_for).toLocaleString('pt-BR')}`
    },
    session_reminder: {
      title: 'Lembrete de Teleconsulta',
      message: customMessage || `Sua teleconsulta começará em 15 minutos (${new Date(sessionData.scheduled_for).toLocaleString('pt-BR')})`
    },
    session_started: {
      title: 'Teleconsulta Iniciada',
      message: customMessage || 'Sua teleconsulta foi iniciada. Clique para entrar na sala.'
    },
    session_ended: {
      title: 'Teleconsulta Finalizada',
      message: customMessage || 'Sua teleconsulta foi finalizada. Obrigado pela participação!'
    },
    session_cancelled: {
      title: 'Teleconsulta Cancelada',
      message: customMessage || `Sua teleconsulta agendada para ${new Date(sessionData.scheduled_for).toLocaleString('pt-BR')} foi cancelada.`
    },
    participant_joined: {
      title: 'Participante Entrou',
      message: customMessage || 'Um participante entrou na teleconsulta.'
    },
    participant_left: {
      title: 'Participante Saiu',
      message: customMessage || 'Um participante saiu da teleconsulta.'
    },
    agenda_updated: {
      title: 'Agenda Atualizada',
      message: customMessage || 'Sua agenda de teleconsultas foi atualizada.'
    }
  }

  return baseMessages[type as keyof typeof baseMessages] || {
    title: 'Notificação de Teleconsulta',
    message: customMessage || 'Você tem uma nova notificação sobre sua teleconsulta.'
  }
}

// POST - Enviar notificação de teleconsulta
export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await validateAuth(request)
  const body = await request.json()
  
  const validatedData = teleconsultaNotificationSchema.parse(body)
  
  // Buscar dados da sessão
  const { data: session, error: sessionError } = await supabase
    .from('teleconsulta_sessions')
    .select(`
      *,
      patient:patient_id(id, name, email),
      nutritionist:nutritionist_id(id, name, email)
    `)
    .eq('id', validatedData.session_id)
    .single()

  if (sessionError || !session) {
    throw new NotFoundError('Sessão de teleconsulta não encontrada')
  }

  // Verificar se o usuário tem permissão para enviar notificações desta sessão
  const isParticipant = session.patient_id === user.id || session.nutritionist_id === user.id
  const isAdmin = user.user_metadata?.role === 'admin'
  
  if (!isParticipant && !isAdmin) {
    throw new ValidationError('Sem permissão para enviar notificações desta sessão')
  }

  // Determinar destinatários
  let recipients: string[] = []
  
  if (validatedData.recipient_id) {
    // Verificar se o recipient_id é um participante da sessão
    if (validatedData.recipient_id !== session.patient_id && validatedData.recipient_id !== session.nutritionist_id) {
      throw new ValidationError('Destinatário não é participante desta sessão')
    }
    recipients = [validatedData.recipient_id]
  } else {
    // Notificar todos os participantes
    recipients = [session.patient_id, session.nutritionist_id]
  }

  // Obter conteúdo da notificação
  const notificationContent = getNotificationContent(
    validatedData.notification_type,
    session,
    validatedData.custom_message
  )

  // Enviar notificações para todos os destinatários
  const notificationPromises = recipients.map(async (recipientId) => {
    return createNotification({
      userId: recipientId,
      title: notificationContent.title,
      message: notificationContent.message,
      notificationType: `teleconsulta_${validatedData.notification_type}`,
      consultationId: validatedData.session_id,
      data: {
        session_id: validatedData.session_id,
        notification_type: validatedData.notification_type,
        scheduled_for: session.scheduled_for,
        status: session.status
      }
    })
  })

  const results = await Promise.all(notificationPromises)
  const successCount = results.filter(Boolean).length

  if (successCount === 0) {
    throw new ValidationError('Erro ao enviar notificações')
  }

  return NextResponse.json({
    success: true,
    message: `${successCount} notificação(ões) enviada(s) com sucesso`,
    recipients_count: recipients.length,
    success_count: successCount
  })
})