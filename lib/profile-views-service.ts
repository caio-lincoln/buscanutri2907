import { supabase } from './supabase'

export interface ProfileView {
  id: string
  nutritionist_id: string
  viewer_ip?: string
  viewer_user_agent?: string
  viewed_at: string
  session_id?: string
  referrer?: string
  created_at: string
}

export interface ProfileViewStats {
  total_views: number
  unique_views: number
  last_view_at?: string
  daily_views?: { date: string; unique_views: number }[]
}

class ProfileViewsService {
  async recordView(nutritionistId: string, referrer?: string): Promise<void> {
    try {
      if (typeof window === 'undefined' || !window.navigator) return

      let sessionId = 'no-session'
      try {
        sessionId = sessionStorage.getItem('profile_view_session') || ''
        if (!sessionId) {
          sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
          sessionStorage.setItem('profile_view_session', sessionId)
        }
      } catch {
        sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
      }

      // const viewedKey = `viewed_${nutritionistId}`
      try {
        // if (sessionStorage.getItem(viewedKey)) return
      } catch { }

      const effectiveRef =
        referrer || (typeof document !== 'undefined' ? document.referrer : '') || 'direct'

      const response = await fetch('/api/profile-views/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nutritionistId,
          sessionId,
          referrer: effectiveRef,
          userAgent: navigator.userAgent,
        }),
      })
      const json = await response.json()

      try {
        // sessionStorage.setItem(viewedKey, 'true') 
        
      } catch { }
    } catch {
      // silencioso
    }
  }

  async getViewStats(nutritionistId: string): Promise<ProfileViewStats> {
    if (typeof window === 'undefined' || !window.navigator) {
      const { data, error } = await supabase.rpc('get_profile_view_stats', {
        p_nutritionist_id: nutritionistId,
      })

      if (error) {
        return { total_views: 0, unique_views: 0, last_view_at: '' }
      }

      return data?.stats || { total_views: 0, unique_views: 0, last_view_at: '' }
    }

    const response = await fetch(`/api/profile-views/stats/${nutritionistId}`)
    if (!response.ok) return { total_views: 0, unique_views: 0, last_view_at: '' }
    const data = await response.json()
    return { total_views: data.stats.totalViews || 0, unique_views: data.stats.uniqueViews || 0, last_view_at: data.stats.lastViewAt }
  }

  // Obter visualizações diárias para um nutricionista (últimos 30 dias)
  async getDailyViews(
    nutritionistId: string,
    daysBack: number = 30
  ): Promise<{ date: string; unique_views: number }[]> {
    try {
      // Usar query direta em vez de RPC para evitar problemas de sessão
      const { data, error } = await supabase
        .from('profile_views')
        .select('viewed_at')
        .eq('nutritionist_id', nutritionistId)
        .gte(
          'viewed_at',
          new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()
        )
        .order('viewed_at', { ascending: false })

      if (error) {
        // Silent error handling - error getting daily views
        return []
      }

      // Processar dados para agrupar por dia
      const dailyViews: { [ key: string ]: Set<string> } = {}
      data?.forEach(view => {
        const date = new Date(view.viewed_at).toISOString().split('T')[ 0 ]
        if (date && !dailyViews[ date ]) {
          dailyViews[ date ] = new Set()
        }
        if (date && dailyViews[ date ]) {
          dailyViews[ date ].add(view.viewed_at) // Usar timestamp como identificador único
        }
      })

      return Object.entries(dailyViews)
        .map(([ date, views ]) => ({
          date,
          unique_views: views.size,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
    } catch (error) {
      // Silent error handling - error getting daily views
      return []
    }
  }

  // Obter total de visualizações usando query direta
  async getTotalViews(nutritionistId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('nutritionist_id', nutritionistId)

      if (error) {
        // Silent error handling - error getting total views
        return 0
      }

      return count || 0
    } catch (error) {
      // Silent error handling - error getting total views
      return 0
    }
  }

  // Obter visualizações únicas usando query direta
  async getUniqueViews(nutritionistId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('profile_views')
        .select('session_id')
        .eq('nutritionist_id', nutritionistId)

      if (error) {
        // Silent error handling - error getting unique views
        return 0
      }

      // Contar sessões únicas
      const uniqueSessions = new Set(
        data?.map(view => view.session_id).filter(Boolean)
      )
      return uniqueSessions.size
    } catch (error) {
      // Silent error handling - error getting unique views
      return 0
    }
  }

  // Obter visualizações recentes para um nutricionista (para dashboard)
  async getRecentViews(
    nutritionistId: string,
    limit: number = 10
  ): Promise<ProfileView[]> {
    try {
      const { data, error } = await supabase
        .from('profile_views')
        .select('*')
        .eq('nutritionist_id', nutritionistId)
        .order('viewed_at', { ascending: false })
        .limit(limit)

      if (error) {
        // Silent error handling - error getting recent views
        return []
      }

      return data || []
    } catch (error) {
      // Silent error handling - error getting recent views
      return []
    }
  }
}

export const profileViewsService = new ProfileViewsService()
export default profileViewsService
