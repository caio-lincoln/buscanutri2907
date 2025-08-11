'use client'

import { useState, useEffect } from 'react'
import { getDashboardStats, type DashboardStats } from '@/lib/dashboard-stats'

interface UseDashboardStatsProps {
  userType: string
  userId: string
  enabled?: boolean
}

interface UseDashboardStatsReturn {
  stats: DashboardStats
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useDashboardStats({
  userType,
  userId,
  enabled = true,
}: UseDashboardStatsProps): UseDashboardStatsReturn {
  const [stats, setStats] = useState<DashboardStats>({
    upcomingAppointments: 0,
    availableJobs: 0,
    unreadNotifications: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    if (!enabled || !userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const newStats = await getDashboardStats(userType, userId)
      setStats(newStats)
    } catch (err) {
      // Error loading stats - silently handled
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadStats = async () => {
      if (!enabled || !userId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const newStats = await getDashboardStats(userType, userId)
        setStats(newStats)
      } catch (err) {
        // Error loading stats - silently handled
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [userType, userId, enabled])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  }
}
