import { createSupabaseClient } from "./supabase"

const supabase = createSupabaseClient()

export interface Consultation {
  id: string
  patient_id: string
  nutritionist_id: string
  start_time: string
  end_time: string
  status: 'scheduled' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
  nutritionist_profiles?: {
    full_name: string
    specialties: string[]
    avatar_url?: string
  }
  patient_profiles?: {
    full_name: string
    avatar_url?: string
  }
}

export interface FavoriteNutritionist {
  id: string
  patient_id: string
  nutritionist_id: string
  created_at: string
  nutritionist_profiles: {
    full_name: string
    profile_image_url: string;
    specialties: string[]
    rating: number
    total_reviews: number
    avatar_url?: string
  }
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
export async function getPatientConsultations(
  patientId: string
): Promise<Consultation[]> {
  try {
    const { data, error } = await supabase
      .from('consultations')
      .select(`
        *,
        nutritionist_profiles(
          full_name,
          specialties,
          avatar_url
        ),
        patient_profiles(
          full_name,
          avatar_url
        )
      `)
      .eq('patient_id', patientId)
      .order('start_time', { ascending: false })

    if (error) {
      // Silent error handling: Error fetching patient consultations
      return []
    }

    return data || []
  } catch (error) {
    // Silent error handling: Error fetching patient consultations
    return []
  }
}

/**
 * Busca consultas completadas que podem ser avaliadas
 */
export async function getCompletedConsultationsForRating(
  patientId: string
): Promise<Consultation[]> {
  try {
    const { data, error } = await supabase
      .from('teleconsulta_sessions')
      .select(`
      *,
      nutritionist_profiles(
        full_name,
        profile_image_url
        )
        `)
      .eq('patient_id', patientId)
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: false })

    if (error) {
      // Silent error handling: Error fetching completed consultations
      return []
    }

    // Filtrar apenas consultas que não foram avaliadas ainda
    const consultationsWithoutRating = await Promise.all(
      (data || []).map(async (consultation) => {
        const { data: rating } = await supabase
          .from('consultation_reviews')
          .select('id')
          .eq('consultation_id', consultation.id)
          .maybeSingle()

        return rating ? null : consultation
      })
    )

    return consultationsWithoutRating.filter(Boolean) as Consultation[]
  } catch (error) {
    // Silent error handling: Error fetching completed consultations
    return []
  }
}

/**
 * Busca nutricionistas favoritos de um paciente
 */
export async function getPatientFavoriteNutritionists(
  patientId: string
): Promise<FavoriteNutritionist[]> {
  try {
    const { data, error } = await supabase
      .from('patient_favorite_nutritionists')
      .select(`
        *,
        nutritionist_profiles(
          full_name,
          specialties,
          rating,
          total_reviews,
          avatar_url
        )
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

    if (error) {
      // Silent error handling: Error fetching favorite nutritionists
      return []
    }

    return data || []
  } catch (error) {
    // Silent error handling: Error fetching favorite nutritionists
    return []
  }
}

/**
 * Adiciona um nutricionista aos favoritos
 */
export async function addFavoriteNutritionist(
  patientId: string,
  nutritionistId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('patient_favorite_nutritionists')
      .insert({
        patient_id: patientId,
        nutritionist_id: nutritionistId,
      })

    if (error) {
      // Silent error handling: Error adding favorite nutritionist
      throw error
    }
  } catch (error) {
    // Silent error handling: Error adding favorite nutritionist

    return false
  }
  return true
}

/**
 * Remove um nutricionista dos favoritos
 */
export async function removeFavoriteNutritionist(
  patientId: string,
  nutritionistId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('patient_favorite_nutritionists')
      .delete()
      .eq('patient_id', patientId)
      .eq('nutritionist_id', nutritionistId)

    if (error) {
      // Silent error handling: Error removing favorite nutritionist
      throw error
    }
  } catch (error) {
    // Silent error handling: Error removing favorite nutritionist
    return false
  }
  return true
}

/**
 * Busca estatísticas do paciente
 */
export async function getPatientStats(patientId: string): Promise<PatientStats> {
  try {
    const { data, error } = await supabase.rpc('get_patient_stats', {
      patient_user_id: patientId,
    })

    if (error) {
      // Silent error handling: Error fetching patient stats
      return {
        totalConsultations: 0,
        scheduledConsultations: 0,
        completedConsultations: 0,
        favoriteNutritionists: 0,
        averageRating: 0,
      }
    }

    return {
      totalConsultations: data?.total_consultations || 0,
      scheduledConsultations: data?.scheduled_consultations || 0,
      completedConsultations: data?.completed_consultations || 0,
      favoriteNutritionists: data?.favorite_nutritionists || 0,
      averageRating: data?.average_rating || 0,
    }
  } catch (error) {
    // Silent error handling: Error fetching patient stats
    return {
      totalConsultations: 0,
      scheduledConsultations: 0,
      completedConsultations: 0,
      favoriteNutritionists: 0,
      averageRating: 0,
    }
  }
}

/**
 * Verifica se uma consulta pode ser avaliada
 */
export async function canRateConsultation(
  consultationId: string,
  patientId: string
): Promise<boolean> {
  try {
    // Verificar se a consulta existe e está completa
    const { data: consultation, error: consultationError } = await supabase
      .from('consultations')
      .select('status')
      .eq('id', consultationId)
      .eq('patient_id', patientId)
      .single()

    if (consultationError || !consultation) {
      return false
    }

    if (consultation.status !== 'completed') {
      return false
    }

    // Verificar se já foi avaliada
    const { data: rating, error: ratingError } = await supabase
      .from('consultation_reviews')
      .select('id')
      .eq('consultation_id', consultationId)
      .single()

    if (ratingError && ratingError.code !== 'PGRST116') {
      return false
    }

    // Pode avaliar se não existe rating
    return !rating
  } catch (error) {
    // Silent error handling: Error checking if consultation can be rated
    return false
  }
}
