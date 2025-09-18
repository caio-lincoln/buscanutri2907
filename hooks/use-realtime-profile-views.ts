'use client'

import { useState, useEffect, useCallback } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { profileViewsService } from '@/lib/profile-views-service'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface ProfileViewStats {
  totalViews: number
  uniqueViews: number
  lastViewAt: string | null
}

export function useRealtimeProfileViews(
  nutritionistId: string,
  initialStats?: ProfileViewStats
) {
  const [viewStats, setViewStats] = useState<ProfileViewStats>(
    initialStats || {
      totalViews: 0,
      uniqueViews: 0,
      lastViewAt: null,
    }
  )
  const [loading, setLoading] = useState(true)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const supabase = createSupabaseClient()

  // Carregar estatísticas iniciais
  const loadViewStats = useCallback(async () => {
    if (!nutritionistId) return

    try {
      setLoading(true)
      const stats = await profileViewsService.getViewStats(nutritionistId)
      if (stats) {
        setViewStats({
          totalViews: stats.total_views,
          uniqueViews: stats.unique_views,
          lastViewAt: stats.last_view_at as string,
        })
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas de visualização:', error)
    } finally {
      setLoading(false)
    }
  }, [nutritionistId])

  // Atualizar estatísticas quando uma nova visualização é registrada
  const handleNewView = useCallback(async () => {
    try {
      const stats = await profileViewsService.getViewStats(nutritionistId)
      if (stats) {
        setViewStats({
          totalViews: stats.total_views,
          uniqueViews: stats.unique_views,
          lastViewAt: stats.last_view_at || null,
        })
      }
    } catch (error) {
      console.error('Erro ao atualizar estatísticas de visualização:', error)
    }
  }, [nutritionistId])

  useEffect(() => {
    if (!nutritionistId) return

    loadViewStats()

    const realtimeChannel = supabase
      .channel(`profile_views_${nutritionistId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'nutritionist_profiles',
          filter: `id=eq.${nutritionistId}`,
        },
        payload => {
          console.log("🚀 ~ useRealtimeProfileViews ~ payload:", payload)
          // Atualizar estatísticas quando uma nova visualização é inserida
          handleNewView()
        }
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
        } else if (status === 'CHANNEL_ERROR') {
          console.error(
            '❌ Erro ao inscrever-se em atualizações de visualização'
          )
        }
      })

    setChannel(realtimeChannel)

    // Cleanup
    return () => {
      if (realtimeChannel) {
        realtimeChannel.unsubscribe()
        
      }
    }
  }, [nutritionistId, loadViewStats, handleNewView, supabase])

  // Registrar uma nova visualização
  const recordView = useCallback(async () => {
    try {
      await profileViewsService.recordView(nutritionistId)
      // As estatísticas serão atualizadas automaticamente via realtime
    } catch (error) {
      console.error('Erro ao registrar visualização:', error)
      // Em caso de erro, tentar atualizar as estatísticas manualmente
      handleNewView()
    }
  }, [nutritionistId, handleNewView])

  return {
    viewStats,
    loading,
    recordView,
    refreshStats: loadViewStats,
  }
}
