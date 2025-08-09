import { supabase } from "./supabase"
import type { NutritionistProfile } from "./supabase"
import { getNutritionistBadges, type NutritionistBadge } from "./badge-service" // Importar o serviço de insígnias
import { profileViewsService, type ProfileViewStats } from "./profile-views-service" // Importar o serviço de visualizações

// Helper para formatar dados do nutricionista para exibição
export function formatNutritionistData(
  nutritionist: NutritionistProfile & { badges?: NutritionistBadge[]; viewStats?: ProfileViewStats }, // Adicionar badges e viewStats ao tipo
) {
  const formattedName = nutritionist.full_name || "Nutricionista Desconhecido"
  const formattedSpecialty = nutritionist.specialties?.[0] || "Nutrição"
  const formattedLocation = nutritionist.address || "Localização não informada"
  const formattedRating = nutritionist.rating || 0
  const formattedReviews = nutritionist.total_reviews || 0
  const formattedExperience = nutritionist.experience_years || 0
  const formattedPrice = nutritionist.consultation_price || 0
  const formattedBio = nutritionist.bio || "Sem biografia disponível."
  const formattedImage =
    nutritionist?.profile_image_url || `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(formattedName)}`
  const formattedOnlineConsultation = nutritionist.service_online_available || false
  const formattedCrn = nutritionist.crn || "Não informado"

  // Garante que os valores são arrays, mesmo que venham como string ou null
  const toArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.map(item => typeof item === "string" ? item.replace(/\\"/g, '"') : item)
    }
    if (typeof value === "string" && value.trim() !== "") {
      // Remover escapes duplos se existirem
      const cleanValue = value.replace(/\\"/g, '"')
      
      try {
        const parsed = JSON.parse(cleanValue)
        if (Array.isArray(parsed)) return parsed
      } catch {
        /* not JSON, continue */
      }
      return cleanValue
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    }
    return []
  }

  const formattedServices = toArray(nutritionist.services).map((service: any) => ({
    name: service.name || "Serviço",
    price: service.price || 0,
    duration: service.duration || "N/A",
  }))
  const formattedSpecializations = toArray(nutritionist.specialties)

  return {
    id: nutritionist.id,
    name: formattedName,
    specialty: formattedSpecialty,
    location: formattedLocation,
    rating: formattedRating,
    reviews: formattedReviews,
    experience: formattedExperience,
    price: formattedPrice,
    bio: formattedBio,
    image: formattedImage,
    onlineConsultation: formattedOnlineConsultation,
    crn: formattedCrn,
    services: formattedServices,
    specializations: formattedSpecializations,
    is_verified: nutritionist.is_verified || false, // Inclui o status de verificação
    badges: nutritionist.badges || [], // Inclui as insígnias
    totalViews: nutritionist.total_views || 0, // Inclui total de visualizações
    uniqueViews: nutritionist.unique_views || 0, // Inclui visualizações únicas
    lastViewAt: nutritionist.last_view_at, // Inclui última visualização
    viewStats: nutritionist.viewStats, // Inclui estatísticas de visualizações
  }
}

export async function getNutritionistById(
  id: string,
): Promise<(NutritionistProfile & { badges?: NutritionistBadge[]; viewStats?: ProfileViewStats }) | null> {
  try {
    // Validar se o ID é válido
    if (!id || id === "null" || id === "undefined") {
      console.error("Invalid nutritionist ID provided:", id)
      return null
    }

    // Durante o build, retorne null se as variáveis de ambiente não estiverem definidas
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn("Supabase environment variables not found during build, returning null")
      return null
    }

    const { data, error } = await supabase.rpc("get_nutritionists_safe", {
      p_nutritionist_id: id
    })

    if (error) {
      console.error("Erro ao buscar nutricionista por ID:", error)
      return null
    }

    if (!data || data.length === 0) {
      return null
    }

    const nutritionist = data[0]
    // Adiciona o email do usuário ao objeto do nutricionista
    const nutritionistWithEmail = {
      ...nutritionist,
      email: nutritionist.email || null,
    } as NutritionistProfile

    // Busca as insígnias do nutricionista
    const badges = await getNutritionistBadges(nutritionistWithEmail.id)
    
    // Busca as estatísticas de visualizações
    const viewStats = await profileViewsService.getViewStats(nutritionistWithEmail.id)
    
    return {
      ...nutritionistWithEmail,
      badges: badges,
      viewStats: viewStats || undefined,
    }
  } catch (err) {
    console.error("Error in getNutritionistById:", err)
    return null
  }
}

export async function getAllNutritionists(): Promise<(NutritionistProfile & { badges?: NutritionistBadge[]; viewStats?: ProfileViewStats })[]> {
  try {
    const { data, error } = await supabase.rpc("get_nutritionists_safe", {})

    if (error) {
      console.error("Erro ao buscar todos os nutricionistas:", error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // Mapeia os dados para incluir o email e garantir a tipagem correta
    const nutritionistsWithEmail = data.map((n: any) => ({
      ...n,
      email: n.email || null,
    })) as NutritionistProfile[]

    // Para cada nutricionista, busca suas insígnias
    const nutritionistsWithBadges = await Promise.all(
      nutritionistsWithEmail.map(async (nutri) => {
        const badges = await getNutritionistBadges(nutri.id)
        return { ...nutri, badges }
      }),
    )

    return nutritionistsWithBadges
  } catch (err) {
    console.error("Error in getAllNutritionists:", err)
    return []
  }
}

export async function getNutritionistsBySpecialty(
  specialty: string,
): Promise<(NutritionistProfile & { badges?: NutritionistBadge[]; viewStats?: ProfileViewStats })[]> {
  try {
    const { data, error } = await supabase.rpc("get_nutritionists_safe", {
      p_specialty: specialty
    })

    if (error) {
      console.error("Erro ao buscar nutricionistas por especialidade:", error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    const nutritionistsWithEmail = data.map((n: any) => ({
      ...n,
      email: n.email || null,
    })) as NutritionistProfile[]

    const nutritionistsWithBadges = await Promise.all(
      nutritionistsWithEmail.map(async (nutri) => {
        const badges = await getNutritionistBadges(nutri.id)
        return { ...nutri, badges }
      }),
    )

    return nutritionistsWithBadges
  } catch (err) {
    console.error("Error in getNutritionistsBySpecialty:", err)
    return []
  }
}

export async function getNutritionistsByLocation(
  location: string,
): Promise<(NutritionistProfile & { badges?: NutritionistBadge[]; viewStats?: ProfileViewStats })[]> {
  try {
    const { data, error } = await supabase.rpc("get_nutritionists_safe", {
      p_location: location
    })

    if (error) {
      console.error("Erro ao buscar nutricionistas por localização:", error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    const nutritionistsWithEmail = data.map((n: any) => ({
      ...n,
      email: n.email || null,
    })) as NutritionistProfile[]

    const nutritionistsWithBadges = await Promise.all(
      nutritionistsWithEmail.map(async (nutri) => {
        const badges = await getNutritionistBadges(nutri.id)
        return { ...nutri, badges }
      }),
    )

    return nutritionistsWithBadges
  } catch (err) {
    console.error("Error in getNutritionistsByLocation:", err)
    return []
  }
}

export async function getTopRatedNutritionists(
  limit = 5,
): Promise<(NutritionistProfile & { badges?: NutritionistBadge[]; viewStats?: ProfileViewStats })[]> {
  try {
    const { data, error } = await supabase.rpc("get_nutritionists_safe", {
      p_limit: limit
    })

    if (error) {
      console.error("Erro ao buscar nutricionistas mais bem avaliados:", error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    const nutritionistsWithEmail = data.map((n: any) => ({
      ...n,
      email: n.email || null,
    })) as NutritionistProfile[]

    const nutritionistsWithBadges = await Promise.all(
      nutritionistsWithEmail.map(async (nutri) => {
        const badges = await getNutritionistBadges(nutri.id)
        return { ...nutri, badges }
      }),
    )

    return nutritionistsWithBadges
  } catch (err) {
    console.error("Error in getTopRatedNutritionists:", err)
    return []
  }
}

