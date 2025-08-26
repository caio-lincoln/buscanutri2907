import { supabase } from './supabase'
import { createRatingReceivedNotification } from './rating-notification-service'

export interface Rating {
  id: string
  consultation_id: string
  patient_id: string
  nutritionist_id: string
  rating: number
  comment?: string
  created_at: string
}

export interface RatingStats {
  averageRating: number
  totalReviews: number
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

// Criar uma avaliação
export async function createRating(
  consultationId: string,
  patientId: string,
  nutritionistId: string,
  rating: number,
  comment?: string
): Promise<Rating> {
  const { data, error } = await supabase
    .from('consultation_ratings')
    .insert({
      consultation_id: consultationId,
      patient_id: patientId,
      nutritionist_id: nutritionistId,
      rating,
      comment,
    })
    .select()
    .single()

  if (error) {
    // Silent error handling: Error creating rating
    throw error
  }

  // Atualizar as estatísticas do nutricionista
  await updateNutritionistRating(nutritionistId)

  // Buscar nome do paciente para a notificação
  let patientName: string | undefined
  try {
    const { data: patientData } = await supabase
      .from('patient_profiles')
      .select('full_name')
      .eq('user_id', patientId)
      .single()

    patientName = patientData?.full_name
  } catch {
    // Silent error handling: Error fetching patient name
  }

  // Criar notificação para o nutricionista
  try {
    await createRatingReceivedNotification(
      nutritionistId,
      consultationId,
      rating,
      patientName
    )
  } catch {
    // Silent error handling: Error creating notification
  }

  return data
}

// Buscar avaliação de uma consulta específica
export async function getRatingByConsultation(
  consultationId: string
): Promise<Rating | null> {
  const { data, error } = await supabase
    .from('consultation_ratings')
    .select('*')
    .eq('consultation_id', consultationId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // Silent error handling: Error fetching rating
    throw error
  }

  return data || null
}

// Buscar avaliações de um nutricionista
export async function getNutritionistRatings(
  nutritionistId: string,
  limit = 10,
  offset = 0
): Promise<Rating[]> {
  const { data, error } = await supabase
    .from('consultation_ratings')
    .select(`
      *,
      patient_profiles(full_name, avatar_url)
    `)
    .eq('nutritionist_id', nutritionistId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    // Silent error handling: Error fetching nutritionist ratings
    throw error
  }

  return data || []
}

// Buscar estatísticas de avaliação de um nutricionista
export async function getNutritionistRatingStats(
  nutritionistId: string
): Promise<RatingStats> {
  const { data, error } = await supabase
    .from('consultation_ratings')
    .select('rating')
    .eq('nutritionist_id', nutritionistId)

  if (error) {
    // Silent error handling: Error fetching rating statistics
    throw error
  }

  if (!data || data.length === 0) {
    return {
      averageRating: 5.0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    }
  }

  const ratings = data.map(r => r.rating)
  const averageRating =
    ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
  const totalReviews = ratings.length

  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  ratings.forEach(rating => {
    ratingDistribution[ rating as keyof typeof ratingDistribution ]++
  })

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    ratingDistribution,
  }
}

// Atualizar rating do nutricionista na tabela nutritionist_profiles
export async function updateNutritionistRating(
  nutritionistId: string
): Promise<void> {
  const stats = await getNutritionistRatingStats(nutritionistId)

  const { error } = await supabase
    .from('nutritionist_profiles')
    .update({
      rating: stats.averageRating,
      total_reviews: stats.totalReviews,
    })
    .eq('user_id', nutritionistId)

  if (error) {
    // Silent error handling: Error updating nutritionist rating
    throw error
  }
}

// Verificar se uma consulta pode ser avaliada
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
      .from('consultation_ratings')
      .select('id')
      .eq('consultation_id', consultationId)
      .single()

    if (ratingError && ratingError.code !== 'PGRST116') {
      return false
    }

    // Pode avaliar se não existe rating
    return !rating
  } catch {
    // Silent error handling: Error checking if consultation can be rated
    return false
  }
}

// Buscar consultas que podem ser avaliadas por um paciente
export async function getConsultationsToRate(
  patientId: string
): Promise<any[]> {
  try {
    const { data: consultations, error } = await supabase
      .from('consultations')
      .select(`
        id,
        start_time,
        nutritionist_profiles(full_name, specialties, avatar_url)
      `)
      .eq('patient_id', patientId)
      .eq('status', 'completed')
      .order('start_time', { ascending: false })

    if (error) {
      throw error
    }

    // Filtrar apenas consultas que não foram avaliadas
    const consultationsWithoutRating = await Promise.all(
      (consultations || []).map(async (consultation) => {
        const { data: rating } = await supabase
          .from('consultation_ratings')
          .select('id')
          .eq('consultation_id', consultation.id)
          .single()

        return rating ? null : consultation
      })
    )

    return consultationsWithoutRating.filter(Boolean)
  } catch {
    // Silent error handling: Error fetching consultations to rate
    return []
  }
}
