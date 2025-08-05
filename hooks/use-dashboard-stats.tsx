"use client"

import { useState, useEffect } from "react"

export interface DashboardStats {
  totalConsultations: number
  scheduledConsultations: number
  completedConsultations: number
  favoriteNutritionists: number
  averageRating: number
  unreadNotifications: number
  upcomingAppointments: number
  availableJobs: number
  pendingReports: number
  pendingModerations: number
}

export function useDashboardStats(userType: string) {
  const [stats, setStats] = useState<DashboardStats>({
    totalConsultations: 0,
    scheduledConsultations: 0,
    completedConsultations: 0,
    favoriteNutritionists: 0,
    averageRating: 0,
    unreadNotifications: 0,
    upcomingAppointments: 0,
    availableJobs: 0,
    pendingReports: 0,
    pendingModerations: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        // Aqui você pode implementar a lógica para buscar as estatísticas
        // baseado no tipo de usuário
        
        // Por enquanto, retornando dados mock
        const mockStats: DashboardStats = {
          totalConsultations: 12,
          scheduledConsultations: 3,
          completedConsultations: 9,
          favoriteNutritionists: 5,
          averageRating: 4.8,
          unreadNotifications: 2,
          upcomingAppointments: 3,
          availableJobs: 8,
          pendingReports: 1,
          pendingModerations: 0,
        }

        setStats(mockStats)
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [userType])

  return { stats, loading }
}