import { supabase } from "./supabase"

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
    .from("consultation_ratings")
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
    console.error("Erro ao criar avaliação:", error)
    throw error
  }

  // Atualizar as estatísticas do nutricionista
  await updateNutritionistRating(nutritionistId)

  return data
}

// Buscar avaliação de uma consulta específica
export async function getRatingByConsultation(consultationId: string): Promise<Rating | null> {
  const { data, error } = await supabase
    .from("consultation_ratings")
    .select("*")
    .eq("consultation_id", consultationId)
    .single()

  if (error && error.code !== "PGRST116") {
    console.error("Erro ao buscar avaliação:", error)
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
    .from("consultation_ratings")
    .select("*")
    .eq("nutritionist_id", nutritionistId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("Erro ao buscar avaliações do nutricionista:", error)
    throw error
  }

  return data || []
}

// Buscar estatísticas de avaliação de um nutricionista
export async function getNutritionistRatingStats(nutritionistId: string): Promise<RatingStats> {
  const { data, error } = await supabase
    .from("consultation_ratings")
    .select("rating")
    .eq("nutritionist_id", nutritionistId)

  if (error) {
    console.error("Erro ao buscar estatísticas de avaliação:", error)
    throw error
  }

  if (!data || data.length === 0) {
    return {
      averageRating: 5.0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    }
  }

  const ratings = data.map((r) => r.rating)
  const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
  const totalReviews = ratings.length

  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  ratings.forEach((rating) => {
    ratingDistribution[rating as keyof typeof ratingDistribution]++
  })

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    ratingDistribution,
  }
}

// Atualizar rating do nutricionista na tabela nutritionist_profiles
export async function updateNutritionistRating(nutritionistId: string): Promise<void> {
  const stats = await getNutritionistRatingStats(nutritionistId)

  const { error } = await supabase
    .from("nutritionist_profiles")
    .update({
      rating: stats.averageRating,
      total_reviews: stats.totalReviews,
    })
    .eq("user_id", nutritionistId)

  if (error) {
    console.error("Erro ao atualizar rating do nutricionista:", error)
    throw error
  }
}

// Verificar se uma consulta pode ser avaliada
export async function canRateConsultation(consultationId: string): Promise<boolean> {
  // Função removida - não há mais consultas de telemedicina
  return false
}

// Buscar consultas que podem ser avaliadas por um paciente
export async function getConsultationsToRate(patientId: string): Promise<any[]> {
  // Função removida - não há mais consultas de telemedicina
  return []
}