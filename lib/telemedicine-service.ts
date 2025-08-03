import { createSupabaseClient } from "./supabase"

// Usar o cliente que mantém a autenticação
const supabase = createSupabaseClient()
import type { TelemedicineConsultation } from "./supabase"
import { RealtimeService } from "./realtime-service" // Importar o serviço de tempo real
import { format, parseISO } from "date-fns"
import ptBR from "date-fns/locale/pt-BR"

export interface Consultation {
  id: string
  nutritionist_id: string
  patient_id: string | null // Pode ser null para slots bloqueados
  start_time: string
  end_time: string
  status: "scheduled" | "completed" | "cancelled" | "pending" | "rescheduled" | "in-progress"
  consultation_type: "online" | "presential"
  notes: string | null
  recording_url: string | null
  room_id: string | null
  patient_notes: string | null
  nutritionist_notes: string | null
  is_blocked_slot: boolean // Novo campo
  block_reason: string | null // Novo campo
  price: number
  payment_status: "pending" | "paid" | "refunded"
  created_at: string
  updated_at: string
  // Adicionar dados do paciente e nutricionista para exibição
  patient_profiles?: {
    full_name: string
    profile_image_url?: string
  } | null
  nutritionist_profiles?: {
    full_name: string
    profile_image_url?: string
    address?: string | null // Adicionado para exibir endereço em consultas presenciais
  } | null
  // Campos de cancelamento/reagendamento
  cancelled_by_user_id?: string | null
  cancel_reason?: string | null
  rescheduled_by_user_id?: string | null
  reschedule_reason?: string | null
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

export interface PatientStats {
  totalConsultations: number
  scheduledConsultations: number
  completedConsultations: number
  favoriteNutritionists: number
  averageRating: number
}

// Chat and Forum interfaces
export interface ChatConversation {
  id: string
  patient_id: string
  nutritionist_id: string
  appointment_id?: string
  status: 'active' | 'closed'
  closed_by?: string
  closure_reason?: string
  closed_at?: string
  last_message_at?: string
  created_at: string
  updated_at: string
  nutritionist_profiles?: {
    full_name: string
    profile_image_url?: string
    crn: string
    is_verified: boolean
  }
  patient_profiles?: {
    full_name: string
    profile_image_url?: string
  }
  last_message?: {
    message_text: string
    sender_type: 'patient' | 'nutritionist'
    created_at: string
  }
}

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: 'patient' | 'nutritionist'
  message_text: string
  message_type: 'text' | 'image' | 'file'
  file_url?: string
  file_name?: string
  is_read: boolean
  read_at?: string
  created_at: string
  updated_at: string
  sender_profile?: {
    full_name: string
    profile_image_url?: string
  }
}

export interface ForumQuestion {
  id: string
  patient_id: string
  title: string
  content: string
  category: string
  status: 'open' | 'closed'
  is_anonymous: boolean
  views_count: number
  answers_count: number
  created_at: string
  updated_at: string
  patient_profiles?: {
    full_name: string
    profile_image_url?: string
  }
  forum_answers?: ForumAnswer[]
}

export interface ForumAnswer {
  id: string
  question_id: string
  nutritionist_id: string
  content: string
  is_best_answer: boolean
  likes_count: number
  created_at: string
  updated_at: string
  nutritionist_profiles?: {
    full_name: string
    profile_image_url?: string
    crn: string
    is_verified: boolean
  }
}

// Instância do RealtimeService (singleton ou passada via contexto)
// Para simplificar, vamos criar uma instância aqui. Em uma aplicação real, você pode querer gerenciar isso de forma mais global.
let realtimeService: RealtimeService | null = null

export function initializeRealtimeService(userId: string) {
  if (!realtimeService) {
    realtimeService = new RealtimeService(userId)
  }
  return realtimeService
}

async function sendConsultationNotification(
  userId: string,
  consultationId: string,
  title: string,
  message: string,
  notificationType: string,
  data?: any,
) {
  // Validar IDs
  if (!userId || userId === 'null' || userId === 'undefined') {
    console.error("Invalid userId provided to sendConsultationNotification:", userId)
    return
  }
  if (!consultationId || consultationId === 'null' || consultationId === 'undefined') {
    console.error("Invalid consultationId provided to sendConsultationNotification:", consultationId)
    return
  }

  if (!realtimeService) {
    console.warn("RealtimeService não inicializado. Notificação não enviada.")
    return
  }
  await realtimeService.sendNotification(userId, consultationId, title, message, notificationType, data)
}

// ─────────────────────────────────────────────────────────────────────────
// Consultas do nutricionista
export async function getConsultationsForNutritionist(
  nutritionistId: string,
  startDate?: Date,
  endDate?: Date,
  status?: string,
  consultationType?: string,
  patientName?: string,
): Promise<Consultation[]> {
  try {
    // Validar se o nutritionistId é válido
    if (!nutritionistId || nutritionistId === 'null' || nutritionistId === 'undefined') {
      console.error("Invalid nutritionistId provided to getConsultationsForNutritionist:", nutritionistId)
      return []
    }

    let query = supabase
      .from("telemedicine_consultations")
      .select(
        `
        *,
        patient_profiles(full_name, profile_image_url),
        nutritionist_profiles(full_name, profile_image_url, address)
      `,
      )
      .eq("nutritionist_id", nutritionistId)
      .order("start_time", { ascending: true })

  if (startDate) {
    query = query.gte("start_time", startDate.toISOString())
  }
  if (endDate) {
    query = query.lte("start_time", endDate.toISOString())
  }
  if (status && status !== "all") {
    query = query.eq("status", status)
  }
  if (consultationType && consultationType !== "all") {
    query = query.eq("consultation_type", consultationType)
  }
  if (patientName) {
    query = query.ilike("patient_profiles.full_name", `%${patientName}%`)
  }

    const { data, error } = await query

    if (error) {
      console.error("Erro ao buscar consultas para nutricionista:", error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    return data.map((c: any) => ({
      ...c,
      patient_profiles: c.patient_profiles || null,
      nutritionist_profiles: c.nutritionist_profiles || null,
    }))
  } catch (err) {
    console.error("Error in getConsultationsForNutritionist:", err)
    return []
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Consultas do paciente (histórico completo)
export async function getPatientConsultations(patientUserId: string): Promise<Consultation[]> {
  try {
    // Validar se o patientUserId é válido
    if (!patientUserId || patientUserId === 'null' || patientUserId === 'undefined') {
      console.error("Invalid patientUserId provided to getPatientConsultations:", patientUserId)
      return []
    }

    // Garantir que o perfil do paciente existe
    const patientProfile = await ensurePatientProfile(patientUserId)
    
    if (!patientProfile) {
      console.error("Could not find or create patient profile for consultations:", patientUserId)
      return []
    }

    const { data: consultations, error } = await supabase
      .from("telemedicine_consultations")
      .select(`
        *
      `)
      .eq("patient_id", patientUserId)
      .order("start_time", { ascending: false })

    if (error) {
      console.error("Error fetching patient consultations:", error)
      return []
    }
    if (!consultations || consultations.length === 0) return []

    // Buscar perfis dos nutricionistas
    const nutritionistIds = [...new Set(consultations.map(c => c.nutritionist_id).filter(Boolean))]
    const { data: nutritionistProfiles } = await supabase
      .from("nutritionist_profiles")
      .select("user_id, full_name, crn, rating, profile_image_url, total_reviews")
      .in("user_id", nutritionistIds)

    // Buscar perfis dos pacientes
    const patientIds = [...new Set(consultations.map(c => c.patient_id).filter(Boolean))]
    const { data: patientProfiles } = await supabase
      .from("patient_profiles")
      .select("user_id, full_name, phone")
      .in("user_id", patientIds)

    // Combinar os dados
    return consultations.map((c: any) => {
      const nutritionistProfile = nutritionistProfiles?.find(np => np.user_id === c.nutritionist_id)
      const patientProfile = patientProfiles?.find(pp => pp.user_id === c.patient_id)
      
      return {
        ...c,
        nutritionist_profiles: nutritionistProfile ? {
          full_name: nutritionistProfile.full_name,
          crn: nutritionistProfile.crn,
          rating: nutritionistProfile.rating,
          profile_image_url: nutritionistProfile.profile_image_url,
          total_reviews: nutritionistProfile.total_reviews
        } : null,
        patient_profiles: patientProfile ? {
          full_name: patientProfile.full_name,
          phone: patientProfile.phone
        } : null,
      }
    }) as Consultation[]
  } catch (err) {
    console.error("Error fetching patient consultations:", err)
    return []
  }
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

    // Se não existe, buscar dados do usuário para criar o perfil usando RPC
    const { data: userData, error: userError } = await supabase
      .rpc("get_user_data", { user_uuid: userId })

    if (userError || !userData || userData.length === 0) {
      console.error("Error fetching user data:", userError)
      return null
    }

    const user = userData[0]

    // Criar o perfil usando dados do usuário com UPSERT para evitar conflitos
    const insertData = {
      user_id: userId,
      full_name: user.email?.split('@')[0] || "Usuário",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
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

// Buscar nutricionistas favoritos do paciente
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
      console.error("Could not find or create patient profile for user:", patientUserId)
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
    console.error("Error fetching favorite nutritionists:", error)
    return []
  }
}

// Buscar estatísticas do paciente via função RPC
export async function getPatientStats(patientUserId: string): Promise<PatientStats> {
  try {
    // Validar se o patientUserId é válido
    if (!patientUserId || patientUserId === 'null' || patientUserId === 'undefined') {
      console.error("Invalid patientUserId provided to getPatientStats:", patientUserId)
      return {
        totalConsultations: 0,
        scheduledConsultations: 0,
        completedConsultations: 0,
        favoriteNutritionists: 0,
        averageRating: 0,
      }
    }

    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error("User not authenticated:", authError)
      return {
        totalConsultations: 0,
        scheduledConsultations: 0,
        completedConsultations: 0,
        favoriteNutritionists: 0,
        averageRating: 0,
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
        averageRating: 0,
      }
    }

    // Garantir que o perfil do paciente existe
    const patientProfile = await ensurePatientProfile(patientUserId)
    
    if (!patientProfile) {
      console.error("Could not find or create patient profile for stats:", patientUserId)
      return {
        totalConsultations: 0,
        scheduledConsultations: 0,
        completedConsultations: 0,
        favoriteNutritionists: 0,
        averageRating: 0,
      }
    }

    // Usar o user_id diretamente na função RPC, não o profile.id
    const { data, error } = await supabase.rpc("get_patient_stats", {
      p_patient_user_id: patientUserId,
    })

    if (error) {
      console.error("Error in RPC get_patient_stats:", error)
      return {
        totalConsultations: 0,
        scheduledConsultations: 0,
        completedConsultations: 0,
        favoriteNutritionists: 0,
        averageRating: 0,
      }
    }

    // A função RPC retorna um array com um objeto
    const stats = Array.isArray(data) && data.length > 0 ? data[0] : {}

    return {
      totalConsultations: stats.total_consultations ?? 0,
      scheduledConsultations: stats.scheduled_consultations ?? 0,
      completedConsultations: stats.completed_consultations ?? 0,
      favoriteNutritionists: stats.favorite_nutritionists ?? 0,
      averageRating: Number(stats.average_rating ?? 0),
    }
  } catch (err) {
    console.error("Error fetching patient stats:", err)
    return {
      totalConsultations: 0,
      scheduledConsultations: 0,
      completedConsultations: 0,
      favoriteNutritionists: 0,
      averageRating: 0,
    }
  }
}

// Buscar mensagens de uma consulta
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

// Buscar notas de uma consulta
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

// Adicionar nutricionista aos favoritos
export async function addFavoriteNutritionist(patientUserId: string, nutritionistProfileId: string): Promise<boolean> {
  try {
    // Validar IDs
    if (!patientUserId || patientUserId === 'null' || patientUserId === 'undefined') {
      console.error("Invalid patientUserId provided to addFavoriteNutritionist:", patientUserId)
      return false
    }
    if (!nutritionistProfileId || nutritionistProfileId === 'null' || nutritionistProfileId === 'undefined') {
      console.error("Invalid nutritionistProfileId provided to addFavoriteNutritionist:", nutritionistProfileId)
      return false
    }

    // Garantir que o perfil do paciente existe
    const patientProfile = await ensurePatientProfile(patientUserId)

    if (!patientProfile) {
      console.error("Could not find or create patient profile for user:", patientUserId)
      return false
    }

    const { error } = await supabase.from("patient_favorite_nutritionists").insert({
      patient_id: patientProfile.id,
      nutritionist_id: nutritionistProfileId,
    })

    if (error) {
      console.error("Error adding favorite nutritionist:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error adding favorite nutritionist:", error)
    return false
  }
}

// Remover nutricionista dos favoritos
export async function removeFavoriteNutritionist(patientUserId: string, nutritionistProfileId: string): Promise<boolean> {
  try {
    // Validar IDs
    if (!patientUserId || patientUserId === 'null' || patientUserId === 'undefined') {
      console.error("Invalid patientUserId provided to removeFavoriteNutritionist:", patientUserId)
      return false
    }
    if (!nutritionistProfileId || nutritionistProfileId === 'null' || nutritionistProfileId === 'undefined') {
      console.error("Invalid nutritionistProfileId provided to removeFavoriteNutritionist:", nutritionistProfileId)
      return false
    }

    // Garantir que o perfil do paciente existe
    const patientProfile = await ensurePatientProfile(patientUserId)

    if (!patientProfile) {
      console.error("Could not find or create patient profile for user:", patientUserId)
      return false
    }

    const { error } = await supabase
      .from("patient_favorite_nutritionists")
      .delete()
      .eq("patient_id", patientProfile.id)
      .eq("nutritionist_id", nutritionistProfileId)

    if (error) {
      console.error("Error removing favorite nutritionist:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error removing favorite nutritionist:", error)
    return false
  }
}

// Criar avaliação de consulta
export async function createConsultationReview(
  consultationId: string,
  patientId: string,
  nutritionistId: string,
  rating: number,
  comment?: string,
): Promise<boolean> {
  try {
    // Validar IDs
    if (!consultationId || consultationId === 'null' || consultationId === 'undefined') {
      console.error("Invalid consultationId provided to createConsultationReview:", consultationId)
      return false
    }
    if (!patientId || patientId === 'null' || patientId === 'undefined') {
      console.error("Invalid patientId provided to createConsultationReview:", patientId)
      return false
    }
    if (!nutritionistId || nutritionistId === 'null' || nutritionistId === 'undefined') {
      console.error("Invalid nutritionistId provided to createConsultationReview:", nutritionistId)
      return false
    }

    const { error } = await supabase.from("consultation_reviews").insert({
      consultation_id: consultationId,
      patient_id: patientId,
      nutritionist_id: nutritionistId,
      rating,
      comment,
    })

    if (error) {
      console.error("Error creating consultation review:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error creating consultation review:", error)
    return false
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Buscar consulta por ID (com perfis do nutricionista e do paciente)
export async function getConsultationById(consultationId: string): Promise<Consultation | null> {
  try {
    /* ------------------------------------------------------------------
     * 1) Consulta principal
     * ------------------------------------------------------------------ */
    const { data: consultation, error } = await supabase
      .from("telemedicine_consultations")
      .select(
        `
        *,
        nutritionist_profiles(full_name, crn, rating, profile_image_url, total_reviews, address),
        patient_profiles(full_name, phone)
      `,
      )
      .eq("id", consultationId)
      .single()

    if (error || !consultation) {
      console.error("Error fetching consultation:", error)
      return null
    }

    /* ------------------------------------------------------------------
     * 4) Combina tudo em um único objeto
     * ------------------------------------------------------------------ */
    return {
      ...consultation,
      nutritionist_profiles: consultation.nutritionist_profiles || undefined,
      patient_profiles: consultation.patient_profiles || undefined,
    } as Consultation
  } catch (e) {
    console.error("Error fetching consultation:", e)
    return null
  }
}

// Adicionar função para atualizar status da consulta
export async function updateConsultationStatus(
  consultationId: string,
  status: TelemedicineConsultation["status"],
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("telemedicine_consultations")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", consultationId)

    if (error) {
      console.error("Error updating consultation status:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error updating consultation status:", error)
    return false
  }
}

// Adicionar função para criar sessão de consulta
export async function createConsultationSession(
  consultationId: string,
  patientId: string,
  nutritionistId: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("consultation_sessions")
      .insert({
        consultation_id: consultationId,
        patient_id: patientId,
        nutritionist_id: nutritionistId,
        session_status: "waiting",
        patient_connected: false,
        nutritionist_connected: false,
      })
      .select("id")
      .single()

    if (error) {
      console.error("Error creating consultation session:", error)
      return null
    }

    return data.id
  } catch (error) {
    console.error("Error creating consultation session:", error)
    return null
  }
}

// Adicionar função para verificar se consulta pode iniciar


export async function createConsultation(
  nutritionistId: string,
  patientId: string,
  startTime: Date,
  endTime: Date,
  consultationType: "online" | "presential",
  price: number,
): Promise<TelemedicineConsultation> {
  // Validar IDs
  if (!nutritionistId || nutritionistId === 'null' || nutritionistId === 'undefined') {
    throw new Error("Invalid nutritionistId provided to createConsultation")
  }
  if (!patientId || patientId === 'null' || patientId === 'undefined') {
    throw new Error("Invalid patientId provided to createConsultation")
  }

  const { data, error } = await supabase
    .from("telemedicine_consultations")
    .insert({
      nutritionist_id: nutritionistId,
      patient_id: patientId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: "scheduled",
      consultation_type: consultationType,
      price: price,
      payment_status: "pending",
    })
    .select()
    .single()

  if (error) {
    console.error("Erro ao criar consulta:", error)
    throw error
  }

  // Enviar notificação para o nutricionista
  const nutritionistProfile = await supabase
    .from("nutritionist_profiles")
    .select("full_name")
    .eq("user_id", nutritionistId)
    .maybeSingle()
  const patientProfile = await supabase.from("patient_profiles").select("full_name").eq("user_id", patientId).maybeSingle()

  if (nutritionistProfile.data && patientProfile.data) {
    await sendConsultationNotification(
      nutritionistId,
      data.id,
      "Nova Consulta Agendada!",
      `Você tem uma nova consulta agendada com ${patientProfile.data.full_name} para ${format(startTime, "dd/MM/yyyy HH:mm", { locale: ptBR })}.`,
      "new_appointment",
      { patientName: patientProfile.data.full_name, startTime: startTime.toISOString() },
    )
  }

  return data
}

export async function blockTimeSlot(
  nutritionistId: string,
  startTime: Date,
  endTime: Date,
  reason: string,
): Promise<TelemedicineConsultation> {
  // Validar ID
  if (!nutritionistId || nutritionistId === 'null' || nutritionistId === 'undefined') {
    throw new Error("Invalid nutritionistId provided to blockTimeSlot")
  }

  // Validar datas
  if (!startTime || !endTime) {
    throw new Error("Invalid dates provided to blockTimeSlot")
  }

  if (startTime >= endTime) {
    throw new Error("Start time must be before end time")
  }

  // Validar se o horário não está no passado
  if (startTime < new Date()) {
    throw new Error("Cannot block time slots in the past")
  }

  const { data, error } = await supabase
    .from("telemedicine_consultations")
    .insert({
      nutritionist_id: nutritionistId,
      patient_id: null, // Não há paciente para um slot bloqueado
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: "scheduled", // Pode ser um status específico para bloqueio, mas "scheduled" funciona para ocupar o slot
      consultation_type: "online",
      notes: reason,
      price: 0, // Slots bloqueados não têm preço
      payment_status: "pending",
      is_blocked_slot: true,
      block_reason: reason,
    })
    .select()
    .single()

  if (error) {
    console.error("Erro ao bloquear horário:", error)
    throw error
  }
  return data
}

export async function unblockTimeSlot(consultationId: string): Promise<void> {
  // Validar ID
  if (!consultationId || consultationId === 'null' || consultationId === 'undefined') {
    throw new Error("Invalid consultationId provided to unblockTimeSlot")
  }

  const { data, error } = await supabase.from("telemedicine_consultations").delete().eq("id", consultationId)

  if (error) {
    console.error("Erro ao desbloquear horário:", error)
    throw error
  }
}

export async function rescheduleConsultation(
  consultationId: string,
  newStartTime: Date,
  newEndTime: Date,
  rescheduledByUserId: string,
  reason?: string,
): Promise<TelemedicineConsultation> {
  // Validar IDs
  if (!consultationId || consultationId === 'null' || consultationId === 'undefined') {
    throw new Error("Invalid consultationId provided to rescheduleConsultation")
  }
  if (!rescheduledByUserId || rescheduledByUserId === 'null' || rescheduledByUserId === 'undefined') {
    throw new Error("Invalid rescheduledByUserId provided to rescheduleConsultation")
  }

  const { data, error } = await supabase
    .from("telemedicine_consultations")
    .update({
      start_time: newStartTime.toISOString(),
      end_time: newEndTime.toISOString(),
      status: "scheduled",
      updated_at: new Date().toISOString(),
      notes: reason || null,
    })
    .eq("id", consultationId)
    .select()
    .single()

  if (error) {
    console.error("Erro ao reagendar consulta:", error)
    throw error
  }

  // Enviar notificações para ambos os lados
  if (data) {
    const originalConsultation = await getConsultationById(consultationId)
    if (originalConsultation) {
      const patientId = originalConsultation.patient_id
      const nutritionistId = originalConsultation.nutritionist_id

      const newTimeFormatted = format(newStartTime, "dd/MM/yyyy HH:mm", { locale: ptBR })
      const oldTimeFormatted = format(parseISO(originalConsultation.start_time), "dd/MM/yyyy HH:mm", { locale: ptBR })

      // Notificação para o paciente
      if (patientId) {
        await sendConsultationNotification(
          patientId,
          data.id,
          "Consulta Reagendada!",
          `Sua consulta com ${originalConsultation.nutritionist_profiles?.full_name} foi reagendada de ${oldTimeFormatted} para ${newTimeFormatted}.`,
          "appointment_rescheduled",
          {
            nutritionistName: originalConsultation.nutritionist_profiles?.full_name,
            oldTime: originalConsultation.start_time,
            newTime: newStartTime.toISOString(),
            reason: reason,
          },
        )
      }

      // Notificação para o nutricionista
      if (nutritionistId) {
        await sendConsultationNotification(
          nutritionistId,
          data.id,
          "Consulta Reagendada!",
          `A consulta com ${originalConsultation.patient_profiles?.full_name} foi reagendada de ${oldTimeFormatted} para ${newTimeFormatted}.`,
          "appointment_rescheduled",
          {
            patientName: originalConsultation.patient_profiles?.full_name,
            oldTime: originalConsultation.start_time,
            newTime: newStartTime.toISOString(),
            reason: reason,
          },
        )
      }
    }
  }

  return data
}

export async function cancelConsultation(
  consultationId: string,
  cancelledByUserId: string,
  reason?: string,
): Promise<TelemedicineConsultation> {
  // Validar IDs
  if (!consultationId || consultationId === 'null' || consultationId === 'undefined') {
    throw new Error("Invalid consultationId provided to cancelConsultation")
  }
  if (!cancelledByUserId || cancelledByUserId === 'null' || cancelledByUserId === 'undefined') {
    throw new Error("Invalid cancelledByUserId provided to cancelConsultation")
  }

  const { data, error } = await supabase
    .from("telemedicine_consultations")
    .update({
      status: "cancelled",
      notes: reason ? `Cancelado: ${reason}` : "Cancelado",
      updated_at: new Date().toISOString(),
    })
    .eq("id", consultationId)
    .select()
    .single()

  if (error) {
    console.error("Erro ao cancelar consulta:", error)
    throw error
  }

  // Enviar notificações para ambos os lados
  if (data) {
    const originalConsultation = await getConsultationById(consultationId)
    if (originalConsultation) {
      const patientId = originalConsultation.patient_id
      const nutritionistId = originalConsultation.nutritionist_id
      const consultationTimeFormatted = format(parseISO(originalConsultation.start_time), "dd/MM/yyyy HH:mm", {
        locale: ptBR,
      })

      // Notificação para o paciente
      if (patientId) {
        await sendConsultationNotification(
          patientId,
          data.id,
          "Consulta Cancelada!",
          `Sua consulta com ${originalConsultation.nutritionist_profiles?.full_name} em ${consultationTimeFormatted} foi cancelada.`,
          "appointment_cancelled",
          {
            nutritionistName: originalConsultation.nutritionist_profiles?.full_name,
            time: originalConsultation.start_time,
            reason: reason,
          },
        )
      }

      // Notificação para o nutricionista
      if (nutritionistId) {
        await sendConsultationNotification(
          nutritionistId,
          data.id,
          "Consulta Cancelada!",
          `A consulta com ${originalConsultation.patient_profiles?.full_name} em ${consultationTimeFormatted} foi cancelada.`,
          "appointment_cancelled",
          {
            patientName: originalConsultation.patient_profiles?.full_name,
            time: originalConsultation.start_time,
            reason: reason,
          },
        )
      }
    }
  }

  return data
}

// Funções para notificações automáticas (lembretes)
export async function sendReminderNotification(consultation: Consultation, type: "24h" | "1h"): Promise<void> {
  const patientId = consultation.patient_id
  const nutritionistId = consultation.nutritionist_id
  const consultationTimeFormatted = format(parseISO(consultation.start_time), "dd/MM/yyyy HH:mm", { locale: ptBR })

  const title = type === "24h" ? "Lembrete de Consulta (24h)" : "Lembrete de Consulta (1h)"
  const patientMessage =
    type === "24h"
      ? `Sua consulta com ${consultation.nutritionist_profiles?.full_name} é amanhã às ${consultationTimeFormatted}.`
      : `Sua consulta com ${consultation.nutritionist_profiles?.full_name} começa em 1 hora, às ${consultationTimeFormatted}.`
  const nutritionistMessage =
    type === "24h"
      ? `Você tem uma consulta com ${consultation.patient_profiles?.full_name} amanhã às ${consultationTimeFormatted}.`
      : `Sua consulta com ${consultation.patient_profiles?.full_name} começa em 1 hora, às ${consultationTimeFormatted}.`

  if (patientId) {
    await sendConsultationNotification(patientId, consultation.id, title, patientMessage, `reminder_${type}`, {
      consultationId: consultation.id,
      time: consultation.start_time,
    })
  }
  if (nutritionistId) {
    await sendConsultationNotification(
      nutritionistId,
      consultation.id,
      title,
      nutritionistMessage,
      `reminder_${type}`,
      {
        consultationId: consultation.id,
        time: consultation.start_time,
      },
    )
  }
}

// Função para enviar notificação de confirmação de agendamento
export async function sendConfirmationNotification(consultation: Consultation): Promise<void> {
  const patientId = consultation.patient_id
  const nutritionistId = consultation.nutritionist_id
  const consultationTimeFormatted = format(parseISO(consultation.start_time), "dd/MM/yyyy HH:mm", { locale: ptBR })

  const title = "Agendamento Confirmado!"
  const patientMessage = `Sua consulta com ${consultation.nutritionist_profiles?.full_name} foi confirmada para ${consultationTimeFormatted}.`
  const nutritionistMessage = `A consulta com ${consultation.patient_profiles?.full_name} foi confirmada para ${consultationTimeFormatted}.`

  if (patientId) {
    await sendConsultationNotification(patientId, consultation.id, title, patientMessage, "appointment_confirmed", {
      consultationId: consultation.id,
      time: consultation.start_time,
    })
  }
  if (nutritionistId) {
    await sendConsultationNotification(
      nutritionistId,
      consultation.id,
      title,
      nutritionistMessage,
      "appointment_confirmed",
      {
        consultationId: consultation.id,
        time: consultation.start_time,
      },
    )
  }
}

// ===== CHAT FUNCTIONS =====

/**
 * Get patient chat conversations
 */
export async function getPatientChatConversations(patientUserId: string): Promise<ChatConversation[]> {
  try {
    if (!patientUserId) {
      throw new Error('Patient user ID is required')
    }

    // Ensure patient profile exists
    const patientProfile = await ensurePatientProfile(patientUserId)
    if (!patientProfile) {
      throw new Error('Patient profile not found')
    }

    const { data, error } = await supabase
      .from('chat_conversations')
      .select(`
        *,
        nutritionist_profiles!chat_conversations_nutritionist_id_fkey (
          full_name,
          profile_image_url,
          crn,
          is_verified
        ),
        patient_profiles!chat_conversations_patient_id_fkey (
          full_name,
          profile_image_url
        )
      `)
      .eq('patient_id', patientProfile.user_id)
      .order('last_message_at', { ascending: false })

    if (error) {
      console.error('Error fetching chat conversations:', error)
      throw error
    }

    // Get last message for each conversation
    const conversationsWithLastMessage = await Promise.all(
      (data || []).map(async (conversation) => {
        const { data: lastMessage } = await supabase
          .from('chat_messages')
          .select('message_text, sender_type, created_at')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        return {
          ...conversation,
          last_message: lastMessage || null
        }
      })
    )

    return conversationsWithLastMessage
  } catch (error) {
    console.error('Error in getPatientChatConversations:', error)
    throw error
  }
}

/**
 * Get chat conversations for a nutritionist
 */
export async function getNutritionistChatConversations(nutritionistUserId: string): Promise<ChatConversation[]> {
  try {
    if (!nutritionistUserId) {
      throw new Error('Nutritionist user ID is required')
    }

    // Ensure nutritionist profile exists
    const nutritionistProfile = await ensureNutritionistProfile(nutritionistUserId)
    if (!nutritionistProfile) {
      throw new Error('Nutritionist profile not found')
    }

    const { data, error } = await supabase
      .from('chat_conversations')
      .select(`
        *,
        nutritionist_profiles!chat_conversations_nutritionist_id_fkey (
          full_name,
          profile_image_url,
          crn,
          is_verified
        ),
        patient_profiles!chat_conversations_patient_id_fkey (
          full_name,
          profile_image_url
        )
      `)
      .eq('nutritionist_id', nutritionistProfile.user_id)
      .order('last_message_at', { ascending: false })

    if (error) {
      console.error('Error fetching nutritionist chat conversations:', error)
      throw error
    }

    // Get last message for each conversation
    const conversationsWithLastMessage = await Promise.all(
      (data || []).map(async (conversation) => {
        const { data: lastMessage } = await supabase
          .from('chat_messages')
          .select('message_text, sender_type, created_at')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        return {
          ...conversation,
          last_message: lastMessage || null
        }
      })
    )

    return conversationsWithLastMessage
  } catch (error) {
    console.error('Error in getNutritionistChatConversations:', error)
    throw error
  }
}

/**
 * Get chat messages for a conversation
 */
export async function getChatMessages(conversationId: string, userId: string, userType: 'patient' | 'nutritionist'): Promise<ChatMessage[]> {
  try {
    if (!conversationId || !userId) {
      throw new Error('Conversation ID and user ID are required')
    }

    // Verify user has access to this conversation
    let conversation
    if (userType === 'patient') {
      const patientProfile = await ensurePatientProfile(userId)
      if (!patientProfile) {
        throw new Error('Patient profile not found')
      }

      const { data } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('patient_id', userId)
        .single()
      
      conversation = data
    } else {
      const nutritionistProfile = await ensureNutritionistProfile(userId)
      if (!nutritionistProfile) {
        throw new Error('Nutritionist profile not found')
      }

      const { data } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('nutritionist_id', userId)
        .single()
      
      conversation = data
    }

    if (!conversation) {
      throw new Error('Conversation not found or access denied')
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender_profile:sender_id (
          full_name,
          profile_image_url
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching chat messages:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getChatMessages:', error)
    throw error
  }
}

/**
 * Send a chat message
 */
export async function sendChatMessage(
  conversationId: string,
  userId: string,
  userType: 'patient' | 'nutritionist',
  messageText: string,
  messageType: 'text' | 'image' | 'file' = 'text',
  fileUrl?: string,
  fileName?: string
): Promise<ChatMessage> {
  try {
    if (!conversationId || !userId || !messageText.trim()) {
      throw new Error('Conversation ID, user ID, and message text are required')
    }

    // Verify user has access to this conversation
    let conversation
    if (userType === 'patient') {
      const patientProfile = await ensurePatientProfile(userId)
      if (!patientProfile) {
        throw new Error('Patient profile not found')
      }

      const { data } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('patient_id', userId)
        .single()
      
      conversation = data
    } else {
      const nutritionistProfile = await ensureNutritionistProfile(userId)
      if (!nutritionistProfile) {
        throw new Error('Nutritionist profile not found')
      }

      const { data } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('nutritionist_id', userId)
        .single()
      
      conversation = data
    }

    if (!conversation) {
      throw new Error('Conversation not found or access denied')
    }

    // Insert the message
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        sender_type: userType,
        message_text: messageText.trim(),
        message_type: messageType,
        file_url: fileUrl,
        file_name: fileName,
        is_read: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error sending chat message:', error)
      throw error
    }

    // Update conversation last_message_at
    await supabase
      .from('chat_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId)

    return data
  } catch (error) {
    console.error('Error in sendChatMessage:', error)
    throw error
  }
}

/**
 * Create a new chat conversation
 */
export async function createChatConversation(
  patientUserId: string,
  nutritionistId: string,
  appointmentId?: string
): Promise<ChatConversation> {
  try {
    if (!patientUserId || !nutritionistId) {
      throw new Error('Patient user ID and nutritionist ID are required')
    }

    // Ensure patient profile exists
    const patientProfile = await ensurePatientProfile(patientUserId)
    if (!patientProfile) {
      throw new Error('Patient profile not found')
    }

    // Check if conversation already exists
    const { data: existingConversation } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('patient_id', patientUserId)
      .eq('nutritionist_id', nutritionistId)
      .eq('status', 'active')
      .single()

    if (existingConversation) {
      // Return existing conversation
      const { data } = await supabase
        .from('chat_conversations')
        .select(`
          *,
          nutritionist_profiles!chat_conversations_nutritionist_id_fkey (
            full_name,
            profile_image_url,
            crn,
            is_verified
          ),
          patient_profiles!chat_conversations_patient_id_fkey (
            full_name,
            profile_image_url
          )
        `)
        .eq('id', existingConversation.id)
        .single()

      return data!
    }

    // Create new conversation
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        patient_id: patientUserId,
        nutritionist_id: nutritionistId,
        appointment_id: appointmentId,
        status: 'active'
      })
      .select(`
        *,
        nutritionist_profiles!chat_conversations_nutritionist_id_fkey (
          full_name,
          profile_image_url,
          crn,
          is_verified
        ),
        patient_profiles!chat_conversations_patient_id_fkey (
          full_name,
          profile_image_url
        )
      `)
      .single()

    if (error) {
      console.error('Error creating chat conversation:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in createChatConversation:', error)
    throw error
  }
}

// ===== FORUM FUNCTIONS =====

/**
 * Get forum questions for patient dashboard
 */
export async function getForumQuestions(
  patientUserId?: string,
  category?: string,
  limit: number = 20
): Promise<ForumQuestion[]> {
  try {
    let query = supabase
      .from('forum_questions')
      .select(`
        *,
        patient_profiles!forum_questions_patient_id_fkey (
          full_name,
          profile_image_url
        ),
        forum_answers (
          id,
          content,
          is_best_answer,
          likes_count,
          created_at,
          nutritionist_profiles!forum_answers_nutritionist_id_fkey (
            full_name,
            profile_image_url,
            crn,
            is_verified
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching forum questions:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getForumQuestions:', error)
    throw error
  }
}

/**
 * Get patient's forum questions
 */
export async function getPatientForumQuestions(patientUserId: string): Promise<ForumQuestion[]> {
  try {
    if (!patientUserId) {
      throw new Error('Patient user ID is required')
    }

    // Ensure patient profile exists
    const patientProfile = await ensurePatientProfile(patientUserId)
    if (!patientProfile) {
      throw new Error('Patient profile not found')
    }

    const { data, error } = await supabase
      .from('forum_questions')
      .select(`
        *,
        patient_profiles!forum_questions_patient_id_fkey (
          full_name,
          profile_image_url
        ),
        forum_answers (
          id,
          content,
          is_best_answer,
          likes_count,
          created_at,
          nutritionist_profiles!forum_answers_nutritionist_id_fkey (
            full_name,
            profile_image_url,
            crn,
            is_verified
          )
        )
      `)
      .eq('patient_id', patientProfile.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching patient forum questions:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getPatientForumQuestions:', error)
    throw error
  }
}

/**
 * Create a new forum question
 */
export async function createForumQuestion(
  patientUserId: string,
  title: string,
  content: string,
  category: string,
  isAnonymous: boolean = false
): Promise<ForumQuestion> {
  try {
    if (!patientUserId || !title.trim() || !content.trim() || !category) {
      throw new Error('Patient user ID, title, content, and category are required')
    }

    // Ensure patient profile exists
    const patientProfile = await ensurePatientProfile(patientUserId)
    if (!patientProfile) {
      throw new Error('Patient profile not found')
    }

    const { data, error } = await supabase
      .from('forum_questions')
      .insert({
        patient_id: patientProfile.id,
        title: title.trim(),
        content: content.trim(),
        category: category,
        is_anonymous: isAnonymous,
        status: 'open',
        views_count: 0,
        answers_count: 0
      })
      .select(`
        *,
        patient_profiles!forum_questions_patient_id_fkey (
          full_name,
          profile_image_url
        )
      `)
      .single()

    if (error) {
      console.error('Error creating forum question:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in createForumQuestion:', error)
    throw error
  }
}

/**
 * Increment forum question views
 */
export async function incrementForumQuestionViews(questionId: string): Promise<void> {
  try {
    if (!questionId) {
      throw new Error('Question ID is required')
    }

    const { error } = await supabase
      .from('forum_questions')
      .update({ views_count: supabase.raw('views_count + 1') })
      .eq('id', questionId)

    if (error) {
      console.error('Error incrementing forum question views:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in incrementForumQuestionViews:', error)
    throw error
  }
}

/**
 * Get forum question by ID
 */
export async function getForumQuestionById(questionId: string): Promise<ForumQuestion | null> {
  try {
    if (!questionId) {
      throw new Error('Question ID is required')
    }

    const { data, error } = await supabase
      .from('forum_questions')
      .select(`
        *,
        patient_profiles!forum_questions_patient_id_fkey (
          full_name,
          profile_image_url
        ),
        forum_answers (
          id,
          content,
          is_best_answer,
          likes_count,
          created_at,
          nutritionist_profiles!forum_answers_nutritionist_id_fkey (
            full_name,
            profile_image_url,
            crn,
            is_verified
          )
        )
      `)
      .eq('id', questionId)
      .single()

    if (error) {
      console.error('Error fetching forum question by ID:', error)
      return null
    }

    // Increment views
    await incrementForumQuestionViews(questionId)

    return data
  } catch (error) {
    console.error('Error in getForumQuestionById:', error)
    return null
  }
}

// Like a forum question
export async function likeForumQuestion(questionId: string, userId: string): Promise<boolean> {
  try {
    // Check if user already liked this question
    const { data: existingLike } = await supabase
      .from('forum_question_likes')
      .select('id')
      .eq('question_id', questionId)
      .eq('user_id', userId)
      .single()

    if (existingLike) {
      // Unlike - remove the like
      const { error: deleteError } = await supabase
        .from('forum_question_likes')
        .delete()
        .eq('question_id', questionId)
        .eq('user_id', userId)

      if (deleteError) {
        console.error('Error removing like:', deleteError)
        return false
      }

      // Decrement likes count
      const { error: updateError } = await supabase
        .from('forum_questions')
        .update({ likes: supabase.sql`likes - 1` })
        .eq('id', questionId)

      return !updateError
    } else {
      // Like - add the like
      const { error: insertError } = await supabase
        .from('forum_question_likes')
        .insert({ question_id: questionId, user_id: userId })

      if (insertError) {
        console.error('Error adding like:', insertError)
        return false
      }

      // Increment likes count
      const { error: updateError } = await supabase
        .from('forum_questions')
        .update({ likes: supabase.sql`likes + 1` })
        .eq('id', questionId)

      return !updateError
    }
  } catch (error) {
    console.error('Error liking forum question:', error)
    return false
  }
}

// Like a forum answer
export async function likeForumAnswer(answerId: string, userId: string): Promise<boolean> {
  try {
    // Check if user already liked this answer
    const { data: existingLike } = await supabase
      .from('forum_answer_likes')
      .select('id')
      .eq('answer_id', answerId)
      .eq('user_id', userId)
      .single()

    if (existingLike) {
      // Unlike - remove the like
      const { error: deleteError } = await supabase
        .from('forum_answer_likes')
        .delete()
        .eq('answer_id', answerId)
        .eq('user_id', userId)

      if (deleteError) {
        console.error('Error removing like:', deleteError)
        return false
      }

      // Decrement likes count
      const { error: updateError } = await supabase
        .from('forum_answers')
        .update({ likes: supabase.sql`likes - 1` })
        .eq('id', answerId)

      return !updateError
    } else {
      // Like - add the like
      const { error: insertError } = await supabase
        .from('forum_answer_likes')
        .insert({ answer_id: answerId, user_id: userId })

      if (insertError) {
        console.error('Error adding like:', insertError)
        return false
      }

      // Increment likes count
      const { error: updateError } = await supabase
        .from('forum_answers')
        .update({ likes: supabase.sql`likes + 1` })
        .eq('id', answerId)

      return !updateError
    }
  } catch (error) {
    console.error('Error liking forum answer:', error)
    return false
  }
}

// Select best answer for a forum question
export async function selectBestAnswer(questionId: string, answerId: string, userId: string): Promise<boolean> {
  try {
    // Verify that the user is the author of the question
    const { data: question } = await supabase
      .from('forum_questions')
      .select('patient_id')
      .eq('id', questionId)
      .single()

    if (!question || question.patient_id !== userId) {
      console.error('User is not authorized to select best answer for this question')
      return false
    }

    // Remove any existing best answer for this question
    await supabase
      .from('forum_answers')
      .update({ is_best_answer: false })
      .eq('question_id', questionId)

    // Set the new best answer
    const { error } = await supabase
      .from('forum_answers')
      .update({ is_best_answer: true })
      .eq('id', answerId)
      .eq('question_id', questionId)

    if (error) {
      console.error('Error selecting best answer:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error selecting best answer:', error)
    return false
  }
}

// Create a forum answer
export async function createForumAnswer(
  questionId: string,
  content: string,
  userId: string,
  userType: 'patient' | 'nutritionist'
): Promise<ForumAnswer | null> {
  try {
    const answerData: any = {
      question_id: questionId,
      content,
      likes_count: 0,
      is_best_answer: false
    }

    if (userType === 'patient') {
      answerData.patient_id = userId
    } else {
      answerData.nutritionist_id = userId
    }

    const { data, error } = await supabase
      .from('forum_answers')
      .insert(answerData)
      .select(`
        *,
        nutritionist_profiles!forum_answers_nutritionist_id_fkey (
          full_name,
          profile_image_url,
          crn,
          is_verified
        )
      `)
      .single()

    if (error) {
      console.error('Error creating forum answer:', error)
      return null
    }

    // Increment answers count on the question
    await supabase
      .from('forum_questions')
      .update({ answers_count: supabase.sql`answers_count + 1` })
      .eq('id', questionId)

    return data
  } catch (error) {
    console.error('Error creating forum answer:', error)
    return null
  }
}
