import { createSupabaseClient } from "./supabase"

// Usar o cliente que mantém a autenticação
const supabase = createSupabaseClient()
import type { TelemedicineConsultation } from "./supabase"

export interface Consultation {
  id: string
  nutritionist_id: string
  patient_id: string | null
  start_time: string
  end_time: string
  status: "scheduled" | "completed" | "cancelled" | "pending" | "rescheduled" | "in-progress"
  consultation_type: "online" | "presential"
  notes: string | null
  recording_url: string | null
  room_id: string | null
  patient_notes: string | null
  nutritionist_notes: string | null
  is_blocked_slot: boolean
  block_reason: string | null
  price: number
  payment_status: "pending" | "paid" | "refunded"
  created_at: string
  updated_at: string
  patient_profiles?: {
    full_name: string
    profile_image_url?: string
  } | null
  nutritionist_profiles?: {
    full_name: string
    profile_image_url?: string
    address?: string | null
  } | null
  cancelled_by_user_id?: string | null
  cancel_reason?: string | null
  rescheduled_by_user_id?: string | null
  reschedule_reason?: string | null
}

export interface PatientStats {
  totalConsultations: number
  scheduledConsultations: number
  completedConsultations: number
  favoriteNutritionists: number
  averageRating: number
}

export interface NutritionistStats {
  totalConsultations: number
  scheduledConsultations: number
  completedConsultations: number
  totalPatients: number
  averageRating: number
  totalRevenue: number
}

export interface ConsultationMessage {
  id: string
  consultation_id: string
  sender_id: string
  message: string
  message_type: "text" | "file" | "image"
  file_url?: string
  file_name?: string
  sent_at: string
  read_at?: string
  delivered_at: string
}

export interface ConsultationNote {
  id: string
  consultation_id: string
  author_id: string
  title: string
  content: string
  category: "symptoms" | "diagnosis" | "treatment" | "followup" | "general"
  created_at: string
  updated_at: string
}

export interface FavoriteNutritionist {
  id: string
  patient_id: string
  nutritionist_id: string
  created_at: string
  nutritionist_profiles: {
    full_name: string
    crn: string
    specialties: string[]
    rating: number
    total_reviews: number
  }
}

export interface ConsultationReview {
  id: string
  consultation_id: string
  patient_id: string
  nutritionist_id: string
  rating: number
  comment?: string
  created_at: string
}

// Função auxiliar para garantir que o perfil do paciente existe
async function ensurePatientProfile(userId: string): Promise<{ user_id: string } | null> {
  try {
    // Validar se o userId é válido
    if (!userId || userId === 'null' || userId === 'undefined') {
      console.error("Invalid userId provided:", userId)
      return null
    }

    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error("User not authenticated:", authError)
      return null
    }

    // Verificar se o usuário autenticado é o mesmo que está sendo solicitado
    if (user.id !== userId) {
      console.error("User ID mismatch. Authenticated user:", user.id, "Requested user:", userId)
      return null
    }

    // Primeiro, tentar buscar o perfil existente
    const { data: existingProfile, error: fetchError } = await supabase
      .from("patient_profiles")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle()

    if (fetchError) {
      console.error("Error fetching patient profile:", fetchError)
      return null
    }

    if (existingProfile) {
      console.log("✅ Patient profile found for user:", userId)
      return existingProfile
    }

    // Se não existe, criar o perfil usando dados do usuário autenticado
    const insertData = {
      user_id: userId,
      full_name: user.email?.split('@')[0] || "Usuário"
    }
    
    const { data: newProfile, error: createError } = await supabase
      .from("patient_profiles")
      .upsert(insertData, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })
      .select("user_id")
      .single()

    if (createError) {
      console.error("Error creating patient profile:", createError)
      return null
    }

    console.log("✅ Patient profile ensured successfully for user:", userId)
    return newProfile
  } catch (error) {
    console.error("Error ensuring patient profile:", error)
    return null
  }
}

export async function getPatientConsultations(patientUserId: string): Promise<Consultation[]> {
  try {
    // Garantir que o perfil do paciente existe
    const patientProfile = await ensurePatientProfile(patientUserId)
    if (!patientProfile) {
      console.error("Failed to ensure patient profile for user:", patientUserId)
      return []
    }

    const { data, error } = await supabase
      .from("consultations")
      .select(`
        *,
        patient_profiles!consultations_patient_id_fkey (
          full_name,
          profile_image_url
        ),
        nutritionist_profiles!consultations_nutritionist_id_fkey (
          full_name,
          profile_image_url,
          address
        )
      `)
      .eq("patient_id", patientUserId)
      .order("start_time", { ascending: false })

    if (error) {
      console.error("Error fetching patient consultations:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getPatientConsultations:", error)
    return []
  }
}

// Função para buscar consultas do nutricionista
export async function getNutritionistConsultations(
  nutritionistId: string,
  startDate?: Date,
  endDate?: Date,
  status?: string,
  consultationType?: string,
  patientName?: string
): Promise<Consultation[]> {
  try {
    let query = supabase
      .from("consultations")
      .select(`
        *,
        patient_profiles!consultations_patient_id_fkey (
          full_name,
          profile_image_url
        ),
        nutritionist_profiles!consultations_nutritionist_id_fkey (
          full_name,
          profile_image_url,
          address
        )
      `)
      .eq("nutritionist_id", nutritionistId)

    if (startDate) {
      query = query.gte("start_time", startDate.toISOString())
    }
    if (endDate) {
      query = query.lte("start_time", endDate.toISOString())
    }
    if (status) {
      query = query.eq("status", status)
    }
    if (consultationType) {
      query = query.eq("consultation_type", consultationType)
    }

    const { data, error } = await query.order("start_time", { ascending: false })

    if (error) {
      console.error("Error fetching nutritionist consultations:", error)
      return []
    }

    let consultations = data || []

    // Filtrar por nome do paciente se fornecido
    if (patientName) {
      consultations = consultations.filter((consultation) =>
        consultation.patient_profiles?.full_name
          ?.toLowerCase()
          .includes(patientName.toLowerCase())
      )
    }

    return consultations
  } catch (error) {
    console.error("Error in getNutritionistConsultations:", error)
    return []
  }
}

// Função para buscar estatísticas do paciente
export async function getPatientStats(patientUserId: string): Promise<PatientStats> {
  try {
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error("User not authenticated:", authError)
      return {
        totalConsultations: 0,
        scheduledConsultations: 0,
        completedConsultations: 0,
        favoriteNutritionists: 0,
        averageRating: 0
      }
    }

    // Verificar se o usuário autenticado é o mesmo que está sendo solicitado
    if (user.id !== patientUserId) {
      console.error("User ID mismatch. Authenticated user:", user.id, "Requested user:", patientUserId)
      return {
        totalConsultations: 0,
        scheduledConsultations: 0,
        completedConsultations: 0,
        favoriteNutritionists: 0,
        averageRating: 0
      }
    }

    const { data, error } = await supabase.rpc('get_patient_stats', {
      patient_user_id: patientUserId
    })

    if (error) {
      console.error("Error fetching patient stats:", error)
      return {
        totalConsultations: 0,
        scheduledConsultations: 0,
        completedConsultations: 0,
        favoriteNutritionists: 0,
        averageRating: 0
      }
    }

    return data || {
      totalConsultations: 0,
      scheduledConsultations: 0,
      completedConsultations: 0,
      favoriteNutritionists: 0,
      averageRating: 0
    }
  } catch (error) {
    console.error("Error in getPatientStats:", error)
    return {
      totalConsultations: 0,
      scheduledConsultations: 0,
      completedConsultations: 0,
      favoriteNutritionists: 0,
      averageRating: 0
    }
  }
}

// Função para buscar estatísticas do nutricionista
export async function getNutritionistStats(nutritionistUserId: string): Promise<NutritionistStats> {
  try {
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error("User not authenticated:", authError)
      return {
        totalConsultations: 0,
        scheduledConsultations: 0,
        completedConsultations: 0,
        totalPatients: 0,
        averageRating: 0,
        totalReviews: 0,
        monthlyRevenue: 0
      }
    }

    // Verificar se o usuário autenticado é o mesmo que está sendo solicitado
    if (user.id !== nutritionistUserId) {
      console.error("User ID mismatch. Authenticated user:", user.id, "Requested user:", nutritionistUserId)
      return {
        totalConsultations: 0,
        scheduledConsultations: 0,
        completedConsultations: 0,
        totalPatients: 0,
        averageRating: 0,
        totalReviews: 0,
        monthlyRevenue: 0
      }
    }

    const { data, error } = await supabase.rpc('get_nutritionist_stats', {
      nutritionist_user_id: nutritionistUserId
    })

    if (error) {
      console.error("Error fetching nutritionist stats:", error)
      return {
        totalConsultations: 0,
        scheduledConsultations: 0,
        completedConsultations: 0,
        totalPatients: 0,
        averageRating: 0,
        totalRevenue: 0
      }
    }

    return data || {
      totalConsultations: 0,
      scheduledConsultations: 0,
      completedConsultations: 0,
      totalPatients: 0,
      averageRating: 0,
      totalRevenue: 0
    }
  } catch (error) {
    console.error("Error in getNutritionistStats:", error)
    return {
      totalConsultations: 0,
      scheduledConsultations: 0,
      completedConsultations: 0,
      totalPatients: 0,
      averageRating: 0,
      totalRevenue: 0
    }
  }
}

// Função para buscar nutricionistas favoritos do paciente
export async function getPatientFavoriteNutritionists(patientUserId: string): Promise<FavoriteNutritionist[]> {
  try {
    // Validar se o patientUserId é válido
    if (!patientUserId || patientUserId === 'null' || patientUserId === 'undefined') {
      console.error("Invalid patientUserId provided to getPatientFavoriteNutritionists:", patientUserId)
      return []
    }

    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error("User not authenticated:", authError)
      return []
    }

    // Verificar se o usuário autenticado é o mesmo que está sendo solicitado
    if (user.id !== patientUserId) {
      console.error("User ID mismatch. Authenticated user:", user.id, "Requested user:", patientUserId)
      return []
    }

    // Garantir que o perfil do paciente existe
    const patientProfile = await ensurePatientProfile(patientUserId)
    if (!patientProfile) {
      console.error("Failed to ensure patient profile for user:", patientUserId)
      return []
    }

    // Usar função RPC para evitar problemas de permissão
    const { data, error } = await supabase.rpc("get_patient_favorite_nutritionists", {
      p_patient_user_id: patientUserId,
    })

    if (error) {
      console.error("Error fetching favorite nutritionists:", error)
      return []
    }

    // Mapear os dados para o formato esperado
    const favorites: FavoriteNutritionist[] = (data || []).map((item: any) => ({
      id: item.id,
      patient_id: item.patient_id,
      nutritionist_id: item.nutritionist_id,
      created_at: item.created_at,
      nutritionist_profiles: {
        full_name: item.nutritionist_full_name,
        crn: item.nutritionist_crn,
        rating: item.nutritionist_rating,
        total_reviews: item.nutritionist_total_reviews,
        specialties: item.nutritionist_specialties,
        profile_image_url: item.nutritionist_profile_image_url,
        location: item.nutritionist_location,
        email: item.nutritionist_email,
      }
    }))

    return favorites
  } catch (error) {
    console.error("Error in getPatientFavoriteNutritionists:", error)
    return []
  }
}

// Função para adicionar nutricionista aos favoritos
export async function addFavoriteNutritionist(patientUserId: string, nutritionistProfileId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("patient_favorite_nutritionists")
      .insert({
        patient_id: patientUserId,
        nutritionist_id: nutritionistProfileId
      })

    if (error) {
      console.error("Error adding favorite nutritionist:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in addFavoriteNutritionist:", error)
    return false
  }
}

// Função para remover nutricionista dos favoritos
export async function removeFavoriteNutritionist(patientUserId: string, nutritionistProfileId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("patient_favorite_nutritionists")
      .delete()
      .eq("patient_id", patientUserId)
      .eq("nutritionist_id", nutritionistProfileId)

    if (error) {
      console.error("Error removing favorite nutritionist:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in removeFavoriteNutritionist:", error)
    return false
  }
}

// Função para buscar consulta por ID
export async function getConsultationById(consultationId: string): Promise<Consultation | null> {
  try {
    const { data, error } = await supabase
      .from("consultations")
      .select(`
        *,
        patient_profiles!consultations_patient_id_fkey (
          full_name,
          profile_image_url
        ),
        nutritionist_profiles!consultations_nutritionist_id_fkey (
          full_name,
          profile_image_url,
          address
        )
      `)
      .eq("id", consultationId)
      .single()

    if (error) {
      console.error("Error fetching consultation:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getConsultationById:", error)
    return null
  }
}

// Função para atualizar status da consulta
export async function updateConsultationStatus(
  consultationId: string,
  status: TelemedicineConsultation["status"]
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("consultations")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", consultationId)

    if (error) {
      console.error("Error updating consultation status:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updateConsultationStatus:", error)
    return false
  }
}

// Função para verificar se a consulta pode ser iniciada
export async function canStartConsultation(consultationId: string): Promise<boolean> {
  try {
    const consultation = await getConsultationById(consultationId)
    if (!consultation) return false

    const now = new Date()
    const startTime = new Date(consultation.start_time)
    const timeDiff = startTime.getTime() - now.getTime()
    const minutesDiff = timeDiff / (1000 * 60)

    // Permitir iniciar 15 minutos antes do horário agendado
    return minutesDiff <= 15 && consultation.status === "scheduled"
  } catch (error) {
    console.error("Error in canStartConsultation:", error)
    return false
  }
}

// Função para cancelar consulta
export async function cancelConsultation(
  consultationId: string,
  cancelledByUserId: string,
  reason?: string
): Promise<TelemedicineConsultation> {
  try {
    const { data, error } = await supabase
      .from("consultations")
      .update({
        status: "cancelled",
        cancelled_by_user_id: cancelledByUserId,
        cancel_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq("id", consultationId)
      .select()
      .single()

    if (error) {
      console.error("Error cancelling consultation:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error in cancelConsultation:", error)
    throw error
  }
}

// Função para reagendar consulta
export async function rescheduleConsultation(
  consultationId: string,
  newStartTime: Date,
  newEndTime: Date,
  rescheduledByUserId: string,
  reason?: string
): Promise<TelemedicineConsultation> {
  try {
    const { data, error } = await supabase
      .from("consultations")
      .update({
        start_time: newStartTime.toISOString(),
        end_time: newEndTime.toISOString(),
        status: "rescheduled",
        rescheduled_by_user_id: rescheduledByUserId,
        reschedule_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq("id", consultationId)
      .select()
      .single()

    if (error) {
      console.error("Error rescheduling consultation:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error in rescheduleConsultation:", error)
    throw error
  }
}

// Função para criar avaliação da consulta
export async function createConsultationReview(
  consultationId: string,
  patientId: string,
  nutritionistId: string,
  rating: number,
  comment?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("consultation_reviews")
      .insert({
        consultation_id: consultationId,
        patient_id: patientId,
        nutritionist_id: nutritionistId,
        rating,
        comment
      })

    if (error) {
      console.error("Error creating consultation review:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in createConsultationReview:", error)
    return false
  }
}

// Função para bloquear horário
export async function blockTimeSlot(
  nutritionistId: string,
  startDateTime: string,
  endDateTime: string,
  reason?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('consultations')
      .insert({
        nutritionist_id: nutritionistId,
        start_time: startDateTime,
        end_time: endDateTime,
        status: 'cancelled',
        consultation_type: 'online',
        is_blocked_slot: true,
        block_reason: reason || 'Time slot blocked by nutritionist',
        price: 0,
        payment_status: 'paid'
      })

    if (error) {
      console.error('Error blocking time slot:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in blockTimeSlot:', error)
    return false
  }
}

// Função para desbloquear horário
export async function unblockTimeSlot(consultationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('consultations')
      .delete()
      .eq('id', consultationId)
      .eq('is_blocked_slot', true)

    if (error) {
      console.error('Error unblocking time slot:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in unblockTimeSlot:', error)
    return false
  }
}

// Get consultation messages
export async function getConsultationMessages(consultationId: string): Promise<ConsultationMessage[]> {
  try {
    const { data, error } = await supabase
      .from("consultation_messages")
      .select("*")
      .eq("consultation_id", consultationId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching consultation messages:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching consultation messages:", error)
    return []
  }
}

// Get consultation notes
export async function getConsultationNotes(consultationId: string): Promise<ConsultationNote[]> {
  try {
    const { data, error } = await supabase
      .from("consultation_notes")
      .select("*")
      .eq("consultation_id", consultationId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching consultation notes:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error fetching consultation notes:", error)
    return []
  }
}