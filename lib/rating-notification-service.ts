import { supabase } from './supabase'

export interface RatingNotification {
  id: string
  patient_id: string
  consultation_id: string
  nutritionist_id: string
  notification_type: 'rating_reminder' | 'rating_received'
  message: string
  is_read: boolean
  created_at: string
  consultation?: {
    start_time: string
    nutritionist_profiles?: {
      full_name: string
    }
  }
}

/**
 * Criar notificação de lembrete para avaliar consulta
 */
export async function createRatingReminderNotification(
  patientId: string,
  consultationId: string,
  nutritionistId: string
): Promise<void> {
  try {
    // Buscar informações da consulta
    const { data: consultation } = await supabase
      .from('consultations')
      .select(`
        start_time,
        nutritionist_profiles(full_name)
      `)
      .eq('id', consultationId)
      .single()

    if (!consultation) {
      throw new Error('Consulta não encontrada')
    }

    const nutritionistName = consultation.nutritionist_profiles?.full_name || 'Nutricionista'
    const message = `Como foi sua consulta com ${nutritionistName}? Avalie sua experiência para ajudar outros pacientes.`

    const { error } = await supabase
      .from('realtime_notifications')
      .insert({
        user_id: patientId,
        type: 'rating_reminder',
        title: 'Avalie sua consulta',
        message,
        data: {
          consultation_id: consultationId,
          nutritionist_id: nutritionistId,
          nutritionist_name: nutritionistName
        },
        is_read: false
      })

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Erro ao criar notificação de avaliação:', error)
    throw error
  }
}

/**
 * Criar notificação quando nutricionista recebe avaliação
 */
export async function createRatingReceivedNotification(
  nutritionistId: string,
  consultationId: string,
  rating: number,
  patientName?: string
): Promise<void> {
  try {
    const ratingText = rating >= 4 ? 'positiva' : rating >= 3 ? 'neutra' : 'negativa'
    const message = patientName
      ? `Você recebeu uma avaliação ${ratingText} de ${patientName}`
      : `Você recebeu uma nova avaliação ${ratingText}`

    const { error } = await supabase
      .from('realtime_notifications')
      .insert({
        user_id: nutritionistId,
        type: 'rating_received',
        title: 'Nova avaliação recebida',
        message,
        data: {
          consultation_id: consultationId,
          rating,
          patient_name: patientName
        },
        is_read: false
      })

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Erro ao criar notificação de avaliação recebida:', error)
    throw error
  }
}

/**
 * Buscar notificações de avaliação de um usuário
 */
export async function getRatingNotifications(
  userId: string,
  limit = 10
): Promise<RatingNotification[]> {
  try {
    const { data, error } = await supabase
      .from('realtime_notifications')
      .select('*')
      .eq('user_id', userId)
      .in('type', [ 'rating_reminder', 'rating_received' ])
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Erro ao buscar notificações de avaliação:', error)
    return []
  }
}

/**
 * Marcar notificação como lida
 */
export async function markRatingNotificationAsRead(
  notificationId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('realtime_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error)
    throw error
  }
}

/**
 * Verificar se há consultas que precisam de lembretes de avaliação
 */
export async function checkForRatingReminders(): Promise<void> {
  try {
    // Buscar consultas completadas há mais de 1 dia e menos de 7 dias
    // que ainda não foram avaliadas
    const { data: consultations, error } = await supabase
      .from('consultations')
      .select(`
        id,
        patient_id,
        nutritionist_id,
        start_time
      `)
      .eq('status', 'completed')
      .gte('start_time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .lt('start_time', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (error) {
      throw error
    }

    // Para cada consulta, verificar se já foi avaliada
    for (const consultation of consultations || []) {
      const { data: existingRating } = await supabase
        .from('consultation_ratings')
        .select('id')
        .eq('consultation_id', consultation.id)
        .single()

      // Se não foi avaliada, verificar se já existe notificação
      if (!existingRating) {
        const { data: existingNotification } = await supabase
          .from('realtime_notifications')
          .select('id')
          .eq('user_id', consultation.patient_id)
          .eq('type', 'rating_reminder')
          .eq('data->consultation_id', consultation.id)
          .single()

        // Se não existe notificação, criar uma
        if (!existingNotification) {
          await createRatingReminderNotification(
            consultation.patient_id,
            consultation.id,
            consultation.nutritionist_id
          )
        }
      }
    }
  } catch (error) {
    console.error('Erro ao verificar lembretes de avaliação:', error)
  }
}

/**
 * Enviar lembretes de avaliação para consultas específicas
 */
export async function sendRatingRemindersForConsultations(
  consultationIds: string[]
): Promise<void> {
  try {
    for (const consultationId of consultationIds) {
      const { data: consultation } = await supabase
        .from('consultations')
        .select('patient_id, nutritionist_id')
        .eq('id', consultationId)
        .eq('status', 'completed')
        .single()

      if (consultation) {
        // Verificar se já foi avaliada
        const { data: existingRating } = await supabase
          .from('consultation_ratings')
          .select('id')
          .eq('consultation_id', consultationId)
          .single()

        if (!existingRating) {
          await createRatingReminderNotification(
            consultation.patient_id,
            consultationId,
            consultation.nutritionist_id
          )
        }
      }
    }
  } catch (error) {
    console.error('Erro ao enviar lembretes de avaliação:', error)
    throw error
  }
}
