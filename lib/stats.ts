import { createSupabaseClient } from "@/lib/supabase"

export interface PlatformStats {
  totalNutricionistas: number
  totalPacientes: number
  averageRating: number
  totalAvaliacoes: number
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const supabase = createSupabaseClient()

  try {
    // Buscar total de nutricionistas
    const { count: nutritionistsCount } = await supabase
      .from("nutritionist_profiles")
      .select("*", { count: "exact", head: true })

    // Buscar total de pacientes
    const { count: totalPatients, error: patientsError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("user_type", "paciente")

    // Buscar todas as avaliações para calcular média e total
    const { data: reviews } = await supabase
      .from("reviews")
      .select("rating")

    const totalReviews = reviews?.length || 0
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0

    return {
      totalNutricionistas: nutritionistsCount || 0,
      totalPacientes: totalPatients || 0,
      averageRating: Math.round(averageRating * 10) / 10, // Arredondar para 1 casa decimal
      totalAvaliacoes: totalReviews
    }
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error)
    
    // Retornar valores padrão em caso de erro
    return {
      totalNutricionistas: 0,
      totalPacientes: 0,
      averageRating: 0,
      totalAvaliacoes: 0
    }
  }
}

export function formatNumber(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k+`
  }
  return `${num}+`
}

export function formatRating(rating: number): string {
  return rating > 0 ? rating.toFixed(1) : "0.0"
}
