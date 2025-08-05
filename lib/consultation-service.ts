import { supabase } from "@/lib/supabase"

export interface Consultation {
  id: string
  patient_id: string
  nutritionist_id: string
  start_time: string
  end_time: string
  status: "scheduled" | "completed" | "cancelled"
  notes?: string
  created_at: string
  updated_at: string
}

export interface FavoriteNutritionist {
  id: string
  patient_id: string
  nutritionist_id: string
  nutritionist_name: string
  nutritionist_avatar?: string
  nutritionist_rating: number
  created_at: string
}

export interface PatientStats {
  totalConsultations: number
  scheduledConsultations: number
  completedConsultations: number
  favoriteNutritionists: number
  averageRating: number
}

/**
 * Busca consultas de um paciente
 */
export async function getPatientConsultations(patientId: string): Promise<Consultation[]> {
  try {
    // Como a funcionalidade de telemedicina foi removida, retornamos array vazio
    // Quando a funcionalidade for reativada, implementar a busca real
    return []
  } catch (error) {
    console.error("Erro ao buscar consultas do paciente:", error)
    return []
  }
}

/**
 * Busca nutricionistas favoritos de um paciente
 */
export async function getPatientFavoriteNutritionists(patientId: string): Promise<FavoriteNutritionist[]> {
  try {
    const { data, error } = await supabase
      .from("patient_favorite_nutritionists")
      .select(`
        id,
        patient_id,
        nutritionist_id,
        created_at,
        nutritionist_profiles!inner (
          full_name,
          profile_image_url,
          rating
        )
      `)
      .eq("patient_id", patientId)

    if (error) {
      console.error("Erro ao buscar nutricionistas favoritos:", error)
      return []
    }

    return data?.map((item: any) => ({
      id: item.id,
      patient_id: item.patient_id,
      nutritionist_id: item.nutritionist_id,
      nutritionist_name: item.nutritionist_profiles?.full_name || "Nutricionista",
      nutritionist_avatar: item.nutritionist_profiles?.profile_image_url || "/placeholder.svg",
      nutritionist_rating: item.nutritionist_profiles?.rating || 0,
      created_at: item.created_at
    })) || []
  } catch (error) {
    console.error("Erro ao buscar nutricionistas favoritos:", error)
    return []
  }
}

/**
 * Busca estatísticas de um paciente
 */
export async function getPatientStats(patientId: string): Promise<PatientStats> {
  try {
    // Buscar nutricionistas favoritos
    const { data: favorites, error: favoritesError } = await supabase
      .from("patient_favorite_nutritionists")
      .select("id")
      .eq("patient_id", patientId)

    if (favoritesError) {
      console.error("Erro ao buscar favoritos:", favoritesError)
    }

    // Como a funcionalidade de telemedicina foi removida, retornamos valores padrão
    return {
      totalConsultations: 0,
      scheduledConsultations: 0,
      completedConsultations: 0,
      favoriteNutritionists: favorites?.length || 0,
      averageRating: 0
    }
  } catch (error) {
    console.error("Erro ao buscar estatísticas do paciente:", error)
    return {
      totalConsultations: 0,
      scheduledConsultations: 0,
      completedConsultations: 0,
      favoriteNutritionists: 0,
      averageRating: 0
    }
  }
}

/**
 * Adiciona um nutricionista aos favoritos do paciente
 */
export async function addFavoriteNutritionist(patientId: string, nutritionistId: string): Promise<boolean> {
  try {
    // Verificar se já existe
    const { data: existing, error: checkError } = await supabase
      .from("patient_favorite_nutritionists")
      .select("id")
      .eq("patient_id", patientId)
      .eq("nutritionist_id", nutritionistId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Erro ao verificar favorito existente:", checkError)
      return false
    }

    if (existing) {
      console.log("Nutricionista já está nos favoritos")
      return true
    }

    // Adicionar aos favoritos
    const { error } = await supabase
      .from("patient_favorite_nutritionists")
      .insert({
        patient_id: patientId,
        nutritionist_id: nutritionistId
      })

    if (error) {
      console.error("Erro ao adicionar nutricionista aos favoritos:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Erro ao adicionar nutricionista aos favoritos:", error)
    return false
  }
}

/**
 * Remove um nutricionista dos favoritos do paciente
 */
export async function removeFavoriteNutritionist(patientId: string, nutritionistId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("patient_favorite_nutritionists")
      .delete()
      .eq("patient_id", patientId)
      .eq("nutritionist_id", nutritionistId)

    if (error) {
      console.error("Erro ao remover nutricionista dos favoritos:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Erro ao remover nutricionista dos favoritos:", error)
    return false
  }
}