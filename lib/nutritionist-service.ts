import { supabase } from './supabase'
import type { NutritionistProfile } from './supabase'
import { getNutritionistBadges, type NutritionistBadge } from './badge-service' // Importar o serviço de insígnias
import { profileViewsService } from './profile-views-service' // Importar o serviço de visualizações
// Definir o tipo ProfileViewStats localmente para evitar problemas de importação
type ProfileViewStats = {
  totalViews: number
  uniqueViews: number
  lastViewAt: string | null
}
import {
  normalizeStringArray,
  logNormalizationEvent,
} from './structured-data-utils'

// Helper para formatar dados do nutricionista para exibição
export function formatNutritionistData(
  nutritionist: NutritionistProfile & {
    badges?: NutritionistBadge[]
    viewStats?: ProfileViewStats
  } // Adicionar badges e viewStats ao tipo
) {
  const formattedName = nutritionist.full_name || 'Nutricionista Desconhecido'
  // Parse specialties if it's a JSON string
  let specialtiesArray: string[] = []
  try {
    if (typeof nutritionist.specialties === 'string') {
      specialtiesArray = JSON.parse(nutritionist.specialties)
    } else if (Array.isArray(nutritionist.specialties)) {
      specialtiesArray = nutritionist.specialties
    }
  } catch (e) {
    specialtiesArray = []
  }
  
  const formattedSpecialty = specialtiesArray[0] || 'Nutrição'
  const formattedLocation = nutritionist.address || 'Localização não informada'
  const formattedRating = nutritionist.rating || 0
  const formattedReviews = nutritionist.total_reviews || 0
  const formattedExperience = nutritionist.experience_years || 0
  const formattedPrice = nutritionist.consultation_price || 0
  const formattedBio = nutritionist.bio || 'Sem biografia disponível.'
  const formattedImage =
    nutritionist?.profile_image_url ||
    `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(formattedName)}`
  const formattedOnlineConsultation =
    nutritionist.service_online_available || false
  const formattedCrn = nutritionist.crn || 'Não informado'

  // Função wrapper para manter compatibilidade
  const toArray = (value: unknown): string[] => {
    const result = normalizeStringArray(value)

    // Log eventos de normalização para telemetria
    if (result.wasCorrupted) {
      logNormalizationEvent('nutritionist_field', result, {
        context: 'nutritionist-service',
      }, result.wasCorrupted)
    }

    return result.data
  }

  const formattedServices = [] // Removido temporariamente pois a propriedade services não existe no tipo
  const formattedSpecializations = specialtiesArray

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
  }
}

export async function getNutritionistById(id: string): Promise<
  | (NutritionistProfile & {
      badges?: any[]
    })
  | null
> {
  try {
    // Validar se o ID é válido
    if (!id || id === 'null' || id === 'undefined') {
      // Silent error handling: Invalid nutritionist ID provided
      return null
    }

    // Durante o build, retorne null se as variáveis de ambiente não estiverem definidas
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      // Silent warning: Supabase environment variables not found during build
      return null
    }

    const { data, error } = await supabase.rpc('get_nutritionist_by_id', {
      p_id: id,
    }).maybeSingle()
    console.log("🚀 ~ getNutritionistById ~ data:", data)
    
    if (error) {
      // Silent error handling: Error fetching nutritionist by ID
      return null
    }

    if (!data) {
      return null
    }

    const nutritionist = data
    // Adiciona o email do usuário ao objeto do nutricionista
    const nutritionistWithEmail = {
      ...nutritionist,
    } as NutritionistProfile

    // Busca as insígnias do nutricionista
    const badges = await getNutritionistBadges(nutritionistWithEmail.id)

    // Busca as estatísticas de visualizações
    const viewStatsRaw = await profileViewsService.getViewStats(
      nutritionistWithEmail.id
    )
    
    const viewStats = viewStatsRaw ? {
      totalViews: viewStatsRaw.total_views,
      uniqueViews: viewStatsRaw.unique_views,
      lastViewAt: viewStatsRaw.last_view_at || null,
    } : undefined

    return {
      ...nutritionistWithEmail,
      badges: badges,
      viewStats: viewStats,
    }
  } catch (err) {
    // Silent error handling: Error in getNutritionistById
    return null
  }
}

export async function getAllNutritionists(): Promise<
  (NutritionistProfile & {
    badges?: any[]
    viewStats?: ProfileViewStats
  })[]
> {
  try {
    const { data, error } = await supabase.rpc('get_nutritionists_safe', {})

    if (error) {
      // Silent error handling: Error fetching all nutritionists
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

    // Para cada nutricionista, busca suas insígnias e estatísticas
    const nutritionistsWithBadges = await Promise.all(
      nutritionistsWithEmail.map(async nutri => {
        const badges = await getNutritionistBadges(nutri.id)
        const viewStatsRaw = await profileViewsService.getViewStats(nutri.id)
        const viewStats = viewStatsRaw ? {
          totalViews: viewStatsRaw.total_views,
          uniqueViews: viewStatsRaw.unique_views,
          lastViewAt: viewStatsRaw.last_view_at || null,
        } : undefined
        return { 
          ...nutri, 
          badges, 
          viewStats,
        }
      })
    )

    return nutritionistsWithBadges
  } catch (err) {
    // Silent error handling: Error in getAllNutritionists
    return []
  }
}

export async function getNutritionistsBySpecialty(specialty: string): Promise<
  (NutritionistProfile & {
    badges?: any[]
    viewStats?: ProfileViewStats
  })[]
> {
  try {
    const { data, error } = await supabase.rpc('get_nutritionists_safe', {
      p_specialty: specialty,
    })

    if (error) {
      // Silent error handling: Error fetching nutritionists by specialty
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
      nutritionistsWithEmail.map(async nutri => {
        const badges = await getNutritionistBadges(nutri.id)
        const viewStatsRaw = await profileViewsService.getViewStats(nutri.id)
        const viewStats = viewStatsRaw ? {
          totalViews: viewStatsRaw.total_views,
          uniqueViews: viewStatsRaw.unique_views,
          lastViewAt: viewStatsRaw.last_view_at || null,
        } : undefined
        return { 
          ...nutri, 
          badges, 
          viewStats,
        }
      })
    )

    return nutritionistsWithBadges
  } catch (err) {
    // Silent error handling: Error in getNutritionistsBySpecialty
    return []
  }
}

export async function getNutritionistsByLocation(location: string): Promise<
  (NutritionistProfile & {
    badges?: any[]
    viewStats?: ProfileViewStats
  })[]
> {
  try {
    const { data, error } = await supabase.rpc('get_nutritionists_safe', {
      p_location: location,
    })

    if (error) {
      // Silent error handling: Error fetching nutritionists by location
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
      nutritionistsWithEmail.map(async nutri => {
        const badges = await getNutritionistBadges(nutri.id)
        const viewStatsRaw = await profileViewsService.getViewStats(nutri.id)
        const viewStats = viewStatsRaw ? {
          totalViews: viewStatsRaw.total_views,
          uniqueViews: viewStatsRaw.unique_views,
          lastViewAt: viewStatsRaw.last_view_at || null,
        } : undefined
        return { 
          ...nutri, 
          badges, 
          viewStats,
        }
      })
    )

    return nutritionistsWithBadges
  } catch (err) {
    // Silent error handling: Error in getNutritionistsByLocation
    return []
  }
}

export async function getTopRatedNutritionists(limit = 5): Promise<
  (NutritionistProfile & {
    badges?: any[]
    viewStats?: ProfileViewStats
  })[]
> {
  try {
    const { data, error } = await supabase.rpc('get_nutritionists_safe', {
      p_limit: limit,
    })

    if (error) {
      // Silent error handling: Error fetching top rated nutritionists
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
      nutritionistsWithEmail.map(async nutri => {
        const badges = await getNutritionistBadges(nutri.id)
        const viewStatsRaw = await profileViewsService.getViewStats(nutri.id)
        const viewStats = viewStatsRaw ? {
          totalViews: viewStatsRaw.total_views,
          uniqueViews: viewStatsRaw.unique_views,
          lastViewAt: viewStatsRaw.last_view_at || null,
        } : undefined
        return { 
          ...nutri, 
          badges, 
          viewStats,
        }
      })
    )

    return nutritionistsWithBadges
  } catch (err) {
    // Silent error handling: Error in getTopRatedNutritionists
    return []
  }
}
