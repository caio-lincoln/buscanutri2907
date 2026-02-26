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

export async function getNutritionistStats(
  nutritionistId: string
): Promise<NutritionistStats> {
  try {
    const { data, error } = await supabase.rpc('get_nutritionist_stats', {
      p_nutritionist_id: nutritionistId,
      p_tz: 'America/Sao_Paulo' // Pass timezone explicitly if procedure requires it
    })

    if (error) {
      console.error('Error fetching statistics:', error)
      return {
        activePatients: 0,
        scheduledAppointments: 0,
        unreadMessages: 0,
        totalConsultations: 0,
      }
    }

    // Handle single object return from RPC (it usually returns setof record or json, need to check if it's array or object)
    // Based on previous tool output, it returns a record. Supabase client might return array of records.
    const stats = Array.isArray(data) ? data[0] : data

    return {
      activePatients: stats?.active_patients || 0,
      scheduledAppointments: stats?.scheduled_appointments || 0,
      unreadMessages: stats?.unread_messages || 0,
      totalConsultations: stats?.total_consultations || 0,
    }
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return {
      activePatients: 0,
      scheduledAppointments: 0,
      unreadMessages: 0,
      totalConsultations: 0,
    }
  }
}

export async function getActivePatients(
  nutritionistId: string
): Promise<ActivePatient[]> {
  try {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('id, patient_id, last_message_at, patient_profiles(full_name, profile_image_url), chat_messages(message_text)')
      .eq('nutritionist_id', nutritionistId)
      .eq('status', 'active') // Ensure 'active' status is correct for your schema
      .order('last_message_at', { ascending: false })
      .limit(10)

    if (error) {
      return []
    }

    return (
      data?.map((conv: any) => ({
        id: conv.patient_id,
        name: conv.patient_profiles?.full_name || 'Paciente',
        lastMessage: conv.chat_messages?.[0]?.message_text || 'Sem mensagens',
        lastMessageTime: conv.last_message_at
          ? new Date(conv.last_message_at).toLocaleString('pt-BR')
          : '',
        avatar: conv.patient_profiles?.profile_image_url || '/placeholder.svg',
      })) || []
    )
  } catch (error) {
    return []
  }
}

export async function getScheduledAppointments(
  nutritionistId: string
): Promise<ScheduledAppointment[]> {
  return getUpcomingAppointments(nutritionistId, 100)
}

export async function getUnreadMessages(
  nutritionistId: string
): Promise<UnreadMessage[]> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, message_text, created_at, conversation_id, sender_id, chat_conversations(patient_profiles(full_name))')
      .neq('sender_id', nutritionistId)
      .is('read_at', null)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      return []
    }

    return (
      data?.map((message: any) => ({
        id: message.id,
        patientName:
          message.chat_conversations?.patient_profiles?.full_name || 'Paciente',
        message: message.message_text || '',
        time: new Date(message.created_at).toLocaleString('pt-BR'),
        conversationId: message.conversation_id,
      })) || []
    )
  } catch (error) {
    return []
  }
}

export async function markMessagesAsRead(
  conversationId: string,
  nutritionistId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .update({
        read_at: new Date().toISOString(),
        is_read: true,
      })
      .eq('conversation_id', conversationId)
      .neq('sender_id', nutritionistId)
      .is('read_at', null)

    if (error) {
      // Silent error handling
    }
  } catch (error) {
    // Silent error handling
  }
}

export async function getUpcomingAppointments(
  nutritionistId: string,
  limit: number = 5
): Promise<ScheduledAppointment[]> {
  try {
    const { data, error } = await supabase
      .from('teleconsulta_sessions')
      .select(`
        id, scheduled_at, status,
        patient:patient_profiles!teleconsulta_sessions_patient_id_fkey (
          full_name
        )
      `)
      .eq('nutritionist_id', nutritionistId)
      .in('status', ['scheduled', 'in_progress'])
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error fetching upcoming appointments:', error)
      return []
    }

    return (data || []).map((session: any) => {
        const dateObj = new Date(session.scheduled_at)
        return {
            id: session.id,
            patientName: session.patient?.full_name || 'Paciente',
            date: dateObj.toLocaleDateString('pt-BR'),
            time: dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            type: 'video',
            status: session.status
        }
    })
  } catch (error) {
      console.error('Error fetching upcoming appointments:', error)
      return []
  }
}
