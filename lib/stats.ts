import { createSupabaseClient } from '@/lib/supabase'

export interface PlatformStats {
  totalNutricionistas: number
  totalPacientes: number
  averageRating: number
  totalAvaliacoes: number
}

// Cache para as estatísticas
let statsCache: { data: PlatformStats; timestamp: number } | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export async function getPlatformStats(): Promise<PlatformStats> {
  // Verificar cache
  if (statsCache && Date.now() - statsCache.timestamp < CACHE_DURATION) {
    return statsCache.data
  }

  const supabase = createSupabaseClient()

  try {
    // Usar função RPC para contornar políticas RLS
    const { data, error } = await supabase.rpc('get_platform_stats')

    if (error) {
      throw error
    }

    const stats: PlatformStats = {
      totalNutricionistas: data.total_nutritionists || 0,
      totalPacientes: data.total_patients || 0,
      averageRating: data.rating || 0,
      totalAvaliacoes: data.totalAvaliacoes || 0,
    }

    // Atualizar cache
    statsCache = {
      data: stats,
      timestamp: Date.now(),
    }

    return stats
  } catch (error) {
    // Silent error handling: Error fetching platform statistics

    // Retornar valores padrão em caso de erro
    const defaultStats: PlatformStats = {
      totalNutricionistas: 0,
      totalPacientes: 0,
      averageRating: 0,
      totalAvaliacoes: 0,
    }

    // Se não há cache, usar valores padrão
    if (!statsCache) {
      statsCache = {
        data: defaultStats,
        timestamp: Date.now(),
      }
    }

    return statsCache.data
  }
}

export function formatNumber(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k+`
  }
  return `${num}+`
}

export function formatRating(rating: number): string {
  return rating > 0 ? rating.toFixed(1) : '9.7'
}
