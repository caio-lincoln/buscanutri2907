import type { PlatformStats } from '@/lib/stats'
import Home from './_client';
import { createClient } from '../lib/supabase/server';

export const revalidate = 1800; // ISR: revalida a cada 30min

async function loadStats(): Promise<PlatformStats | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_platform_stats')
    
    if (error) {
      throw error
    }
    
    const stats: PlatformStats = {
      totalNutricionistas: data.total_nutritionists || 0,
      totalPacientes: data.total_patients || 0,
      averageRating: data.rating || 0,
      totalAvaliacoes: data.
        totalAvaliacoes || 0,
    }
    return stats
  } catch {
    return null
  }
}

export default async function Page() {
  const stats = await loadStats()
  return <Home initialStats={stats} />
}
