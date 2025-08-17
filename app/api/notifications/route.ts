import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/api-middleware'
import { requireAuth } from '@/lib/auth-utils'
import { createNotification, getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, getUnreadNotificationsCount } from '@/lib/notifications-service'
import { z } from 'zod'
import { ValidationError } from '@/lib/errors'

// Schema para criar notificação
const createNotificationSchema = z.object({
  user_id: z.string().uuid(),
  title: z.string().min(1, 'Título é obrigatório'),
  message: z.string().min(1, 'Mensagem é obrigatória'),
  notification_type: z.string().min(1, 'Tipo de notificação é obrigatório'),
  consultation_id: z.string().uuid().optional(),
  data: z.record(z.any()).optional()
})

// Schema para marcar como lida
const markAsReadSchema = z.object({
  notification_id: z.string().uuid().optional(),
  mark_all: z.boolean().optional()
})

// Schema para query parameters
const notificationsQuerySchema = z.object({
  limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(100)).optional(),
  unread_only: z.string().transform(val => val === 'true').optional()
})

// GET - Buscar notificações do usuário
export const GET = withErrorHandling(async (request: NextRequest) => {
  const user = await validateAuth(request)
  
  const { searchParams } = new URL(request.url)
  const query = notificationsQuerySchema.parse({
    limit: searchParams.get('limit'),
    unread_only: searchParams.get('unread_only')
  })

  // Se for solicitado apenas contagem de não lidas
  if (searchParams.get('count_only') === 'true') {
    const count = await getUnreadNotificationsCount(user.id)
    return NextResponse.json({ count })
  }

  const notifications = await getUserNotifications(user.id, query.limit || 50)
  
  // Filtrar apenas não lidas se solicitado
  const filteredNotifications = query.unread_only 
    ? notifications.filter(n => !n.read)
    : notifications

  return NextResponse.json({ notifications: filteredNotifications })
})

// POST - Criar nova notificação
export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await validateAuth(request)
  const body = await request.json()
  
  const validatedData = createNotificationSchema.parse(body)
  
  // Verificar se o usuário tem permissão para criar notificação para o user_id especificado
  // Por enquanto, apenas admins ou o próprio usuário podem criar notificações
  if (validatedData.user_id !== user.id && user.user_metadata?.role !== 'admin') {
    throw new ValidationError('Sem permissão para criar notificação para este usuário')
  }

  const success = await createNotification({
    userId: validatedData.user_id,
    title: validatedData.title,
    message: validatedData.message,
    notificationType: validatedData.notification_type,
    consultationId: validatedData.consultation_id,
    data: validatedData.data || {}
  })

  if (!success) {
    throw new ValidationError('Erro ao criar notificação')
  }

  return NextResponse.json({ success: true, message: 'Notificação criada com sucesso' })
})

// PATCH - Marcar notificação(ões) como lida(s)
export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const user = await validateAuth(request)
  const body = await request.json()
  
  const validatedData = markAsReadSchema.parse(body)
  
  if (validatedData.mark_all) {
    // Marcar todas as notificações como lidas
    const success = await markAllNotificationsAsRead(user.id)
    if (!success) {
      throw new ValidationError('Erro ao marcar todas as notificações como lidas')
    }
    return NextResponse.json({ success: true, message: 'Todas as notificações foram marcadas como lidas' })
  } else if (validatedData.notification_id) {
    // Marcar notificação específica como lida
    const success = await markNotificationAsRead(validatedData.notification_id)
    if (!success) {
      throw new ValidationError('Erro ao marcar notificação como lida')
    }
    return NextResponse.json({ success: true, message: 'Notificação marcada como lida' })
  } else {
    throw new ValidationError('É necessário especificar notification_id ou mark_all')
  }
})