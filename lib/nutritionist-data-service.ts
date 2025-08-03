import { supabase } from './supabase'

export interface NutritionistStats {
  activePatients: number
  scheduledAppointments: number
  unreadMessages: number
  totalConsultations: number
}

export interface ActivePatient {
  id: string
  name: string
  lastMessage: string
  lastMessageTime: string
  avatar?: string
}

export interface ScheduledAppointment {
  id: string
  patientName: string
  date: string
  time: string
  type: 'video' | 'audio'
  status: string
}

export interface UnreadMessage {
  id: string
  patientName: string
  message: string
  time: string
  conversationId: string
}

export async function getNutritionistStats(nutritionistId: string): Promise<NutritionistStats> {
  try {
    const { data, error } = await supabase.rpc('get_nutritionist_stats', {
      nutritionist_user_id: nutritionistId
    })

    if (error) {
      console.error('Erro ao buscar estatísticas:', error)
      return {
        activePatients: 0,
        scheduledAppointments: 0,
        unreadMessages: 0,
        totalConsultations: 0
      }
    }

    return {
      activePatients: data?.active_patients || 0,
      scheduledAppointments: data?.scheduled_appointments || 0,
      unreadMessages: data?.unread_messages || 0,
      totalConsultations: data?.total_consultations || 0
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return {
      activePatients: 0,
      scheduledAppointments: 0,
      unreadMessages: 0,
      totalConsultations: 0
    }
  }
}

export async function getActivePatients(nutritionistId: string): Promise<ActivePatient[]> {
  try {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select(`
        id,
        patient_id,
        last_message_at,
        patient_profiles!inner(full_name, profile_image_url),
        chat_messages(message_text, created_at)
      `)
      .eq('nutritionist_id', nutritionistId)
      .eq('status', 'active')
      .order('last_message_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Erro ao buscar pacientes ativos:', error)
      return []
    }

    return data?.map(conv => ({
      id: conv.patient_id,
      name: conv.patient_profiles?.full_name || 'Paciente',
      lastMessage: conv.chat_messages?.[0]?.message_text || 'Sem mensagens',
      lastMessageTime: conv.last_message_at ? new Date(conv.last_message_at).toLocaleString('pt-BR') : '',
      avatar: conv.patient_profiles?.profile_image_url
    })) || []
  } catch (error) {
    console.error('Erro ao buscar pacientes ativos:', error)
    return []
  }
}

export async function getScheduledAppointments(nutritionistId: string): Promise<ScheduledAppointment[]> {
  try {
    const { data, error } = await supabase
      .from('consultations')
      .select(`
        id,
        scheduled_time,
        consultation_type,
        status,
        patient_profiles!inner(full_name)
      `)
      .eq('nutritionist_id', nutritionistId)
      .eq('status', 'scheduled')
      .gte('scheduled_time', new Date().toISOString())
      .order('scheduled_time', { ascending: true })
      .limit(10)

    if (error) {
      console.error('Erro ao buscar consultas agendadas:', error)
      return []
    }

    return data?.map(consultation => ({
      id: consultation.id,
      patientName: consultation.patient_profiles?.full_name || 'Paciente',
      date: new Date(consultation.scheduled_time).toLocaleDateString('pt-BR'),
      time: new Date(consultation.scheduled_time).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      type: consultation.consultation_type as 'video' | 'audio',
      status: consultation.status
    })) || []
  } catch (error) {
    console.error('Erro ao buscar consultas agendadas:', error)
    return []
  }
}

export async function getUnreadMessages(nutritionistId: string): Promise<UnreadMessage[]> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        id,
        message_text,
        created_at,
        conversation_id,
        chat_conversations!inner(
          patient_id,
          patient_profiles!inner(full_name)
        )
      `)
      .eq('chat_conversations.nutritionist_id', nutritionistId)
      .neq('sender_id', nutritionistId)
      .is('read_at', null)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Erro ao buscar mensagens não lidas:', error)
      return []
    }

    return data?.map(message => ({
      id: message.id,
      patientName: message.chat_conversations?.patient_profiles?.full_name || 'Paciente',
      message: message.message_text || '',
      time: new Date(message.created_at).toLocaleString('pt-BR'),
      conversationId: message.conversation_id
    })) || []
  } catch (error) {
    console.error('Erro ao buscar mensagens não lidas:', error)
    return []
  }
}

export async function markMessagesAsRead(conversationId: string, nutritionistId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .update({ 
        read_at: new Date().toISOString(),
        is_read: true 
      })
      .eq('conversation_id', conversationId)
      .neq('sender_id', nutritionistId)
      .is('read_at', null)

    if (error) {
      console.error('Erro ao marcar mensagens como lidas:', error)
    }
  } catch (error) {
    console.error('Erro ao marcar mensagens como lidas:', error)
  }
}

export async function getUpcomingAppointments(nutritionistId: string, limit: number = 5): Promise<ScheduledAppointment[]> {
  try {
    const { data, error } = await supabase
      .from('consultations')
      .select(`
        id,
        scheduled_time,
        consultation_type,
        status,
        patient_profiles!inner(full_name)
      `)
      .eq('nutritionist_id', nutritionistId)
      .in('status', ['scheduled', 'confirmed'])
      .gte('scheduled_time', new Date().toISOString())
      .order('scheduled_time', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Erro ao buscar próximas consultas:', error)
      return []
    }

    return data?.map(consultation => ({
      id: consultation.id,
      patientName: consultation.patient_profiles?.full_name || 'Paciente',
      date: new Date(consultation.scheduled_time).toLocaleDateString('pt-BR'),
      time: new Date(consultation.scheduled_time).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      type: consultation.consultation_type as 'video' | 'audio',
      status: consultation.status
    })) || []
  } catch (error) {
    console.error('Erro ao buscar próximas consultas:', error)
    return []
  }
}