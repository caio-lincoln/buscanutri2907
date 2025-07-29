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
    nutritionist.profile_image_url || `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(formattedName)}`
  const formattedOnlineConsultation = nutritionist.online_consultation || false
  const formattedCrn = nutritionist.crn || "Não informado"

  // Garante que os valores são arrays, mesmo que venham como string ou null
  const toArray = (value: unknown): string[] => {
    if (Array.isArray(value)) return value
    if (typeof value === "string" && value.trim() !== "") {
      try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) return parsed
      } catch {
        /* not JSON, continue */
      }
      return value
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
    if (!id || id === 'null' || id === 'undefined') {
      console.error("Invalid nutritionist ID provided:", id)
      return null
    }

    const { data, error } = await supabase
      .from("nutritionist_profiles")
      .select(
        `
        *,
        user:user_id (email)
      `,
      )
      .eq("id", id)
      .single()

    if (error) {
      console.error("Erro ao buscar nutricionista por ID:", error)
      return null
    }

    if (data) {
      // Adiciona o email do usuário ao objeto do nutricionista
      const nutritionistWithEmail = {
        ...data,
        email: data.user?.email || null,
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
    }

    return null
  } catch (err) {
    console.error("Error in getNutritionistById:", err)
    return null
  }
}

export async function getAllNutritionists(): Promise<(NutritionistProfile & { badges?: NutritionistBadge[]; viewStats?: ProfileViewStats })[]> {
  try {
    const { data, error } = await supabase
      .from("nutritionist_profiles")
      .select(
        `
        *,
        user:user_id (email)
      `,
      )
      .order("rating", { ascending: false }) // Ordena por avaliação por padrão

    if (error) {
      console.error("Erro ao buscar todos os nutricionistas:", error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // Mapeia os dados para incluir o email e garantir a tipagem correta
    const nutritionistsWithEmail = data.map((n) => ({
      ...n,
      email: n.user?.email || null,
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
  const { data, error } = await supabase
    .from("nutritionist_profiles")
    .select(
      `
      *,
      user:user_id (email)
    `,
    )
    .contains("specialties", [specialty])
    .order("rating", { ascending: false })

  if (error) {
    console.error(`Erro ao buscar nutricionistas por especialidade (${specialty}):`, error)
    return []
  }

  const nutritionistsWithEmail = data.map((n) => ({
    ...n,
    email: n.user?.email || null,
  })) as NutritionistProfile[]

  const nutritionistsWithBadges = await Promise.all(
    nutritionistsWithEmail.map(async (nutri) => {
      const badges = await getNutritionistBadges(nutri.id)
      return { ...nutri, badges }
    }),
  )

  return nutritionistsWithBadges
}

export async function getNutritionistsByLocation(
  location: string,
): Promise<(NutritionistProfile & { badges?: NutritionistBadge[]; viewStats?: ProfileViewStats })[]> {
  const { data, error } = await supabase
    .from("nutritionist_profiles")
    .select(
      `
      *,
      user:user_id (email)
    `,
    )
    .ilike("address", `%${location}%`) // Busca por parte do endereço
    .order("rating", { ascending: false })

  if (error) {
    console.error(`Erro ao buscar nutricionistas por localização (${location}):`, error)
    return []
  }

  const nutritionistsWithEmail = data.map((n) => ({
    ...n,
    email: n.user?.email || null,
  })) as NutritionistProfile[]

  const nutritionistsWithBadges = await Promise.all(
    nutritionistsWithEmail.map(async (nutri) => {
      const badges = await getNutritionistBadges(nutri.id)
      return { ...nutri, badges }
    }),
  )

  return nutritionistsWithBadges
}

export async function getTopRatedNutritionists(
  limit = 5,
): Promise<(NutritionistProfile & { badges?: NutritionistBadge[]; viewStats?: ProfileViewStats })[]> {
  const { data, error } = await supabase
    .from("nutritionist_profiles")
    .select(
      `
      *,
      user:user_id (email)
    `,
    )
    .order("rating", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Erro ao buscar nutricionistas mais bem avaliados:", error)
    return []
  }

  const nutritionistsWithEmail = data.map((n) => ({
    ...n,
    email: n.user?.email || null,
  })) as NutritionistProfile[]

  const nutritionistsWithBadges = await Promise.all(
    nutritionistsWithEmail.map(async (nutri) => {
      const badges = await getNutritionistBadges(nutri.id)
      return { ...nutri, badges }
    }),
  )

  return nutritionistsWithBadges
}
