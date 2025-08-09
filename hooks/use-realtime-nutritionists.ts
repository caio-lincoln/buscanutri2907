"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { RealtimeChannel } from "@supabase/supabase-js"

export interface NutritionistProfile {
  id: string
  user_id: string
  full_name: string
  bio?: string
  location?: string
  profile_image_url?: string
  crn: string
  rating?: number
  total_reviews?: number
  experience_years?: number
  is_verified: boolean
  nutritionist_services?: any[]
  nutritionist_specialties?: any[]
}

export interface UseRealtimeNutritionistsProps {
  searchTerm?: string
  specialty?: string
  state?: string
  priceRange?: { min: number; max: number }
  onlineOnly?: boolean
  verifiedOnly?: boolean
  sortBy?: string
}

export function useRealtimeNutritionists(filters: UseRealtimeNutritionistsProps = {}) {
  const [nutritionists, setNutritionists] = useState<NutritionistProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Função para carregar nutricionistas com filtros
  const loadNutritionists = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Query simplificada sem especialidades para teste
      let query = supabase.from("nutritionist_profiles").select(`
        id,
        user_id,
        full_name,
        bio,
        location,
        profile_image_url,
        crn,
        rating,
        total_reviews,
        experience_years,
        is_verified,
        nutritionist_services (*)
      `)

      // Aplicar filtros
      if (filters.searchTerm) {
        query = query.or(`full_name.ilike.%${filters.searchTerm}%,bio.ilike.%${filters.searchTerm}%`)
      }

      if (filters.state && filters.state !== "Todas") {
        query = query.ilike("location", `%${filters.state}%`)
      }

      if (filters.verifiedOnly) {
        query = query.eq("is_verified", true)
      }

      // Filtrar apenas nutricionistas aprovados (conforme política RLS)
      query = query.eq("verification_status", "aprovado")

      const { data, error } = await query

      if (error) {
        console.error("Error loading nutritionists:", error)
        throw error
      }

      let filteredData: NutritionistProfile[] = data || []

      // Filtrar nutricionistas com IDs válidos
      filteredData = filteredData.filter((nutritionist) => {
        if (!nutritionist.id || nutritionist.id === 'null' || nutritionist.id === 'undefined') {
          console.warn('Nutricionista com ID inválido encontrado:', nutritionist)
          return false
        }
        return true
      })

      // Filtrar por especialidade (temporariamente desabilitado)
      // if (filters.specialty && filters.specialty !== "Todas") {
      //   filteredData = filteredData.filter((nutritionist) =>
      //     nutritionist.nutritionist_specialties?.some(
      //       (spec: any) => spec.specialties?.name === filters.specialty,
      //     ),
      //   )
      // }

      // Filtrar por preço
      if (filters.priceRange) {
        filteredData = filteredData.filter((nutritionist) => {
          const minPrice = getMinPrice(nutritionist.nutritionist_services)
          if (minPrice === null) return false
          return minPrice >= filters.priceRange!.min && minPrice <= filters.priceRange!.max
        })
      }

      // Filtrar por consulta online
      if (filters.onlineOnly) {
        filteredData = filteredData.filter((nutritionist) =>
          nutritionist.nutritionist_services?.some((service: any) => service.online_available)
        )
      }

      // Ordenar
      filteredData.sort((a, b) => {
        switch (filters.sortBy) {
          case "rating":
            return (b.rating || 0) - (a.rating || 0)
          case "price-low":
            return (getMinPrice(a.nutritionist_services) || 0) - (getMinPrice(b.nutritionist_services) || 0)
          case "price-high":
            return (getMinPrice(b.nutritionist_services) || 0) - (getMinPrice(a.nutritionist_services) || 0)
          case "name":
            return a.full_name.localeCompare(b.full_name)
          case "experience":
            return (b.experience_years || 0) - (a.experience_years || 0)
          default:
            return 0
        }
      })

      setNutritionists(filteredData)
    } catch (error) {
      console.error("Error loading nutritionists:", error)
      setError("Erro ao carregar nutricionistas")
    } finally {
      setLoading(false)
    }
  }, [filters, supabase])

  // Função auxiliar para obter preço mínimo
  const getMinPrice = (services: any[]) => {
    if (!services || services.length === 0) return null
    return Math.min(...services.map((service) => service.price))
  }

  // Configurar realtime para monitorar mudanças
  useEffect(() => {
    // Carregar dados iniciais
    loadNutritionists()

    // Configurar canal realtime
    const channel = supabase
      .channel('nutritionist_profiles_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escutar INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'nutritionist_profiles'
        },
        (payload) => {
          console.log('🔄 Mudança detectada em nutritionist_profiles:', payload)
          // Recarregar dados quando houver mudanças
          loadNutritionists()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nutritionist_services'
        },
        (payload) => {
          console.log('🔄 Mudança detectada em nutritionist_services:', payload)
          // Recarregar dados quando houver mudanças nos serviços
          loadNutritionists()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nutritionist_specialties'
        },
        (payload) => {
          console.log('🔄 Mudança detectada em nutritionist_specialties:', payload)
          // Recarregar dados quando houver mudanças nas especialidades
          loadNutritionists()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Inscrito em atualizações de nutricionistas em tempo real')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro ao inscrever-se em atualizações de nutricionistas')
        }
      })

    channelRef.current = channel

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
        console.log('🔌 Desconectado das atualizações de nutricionistas')
      }
    }
  }, [loadNutritionists, supabase])

  // Função para atualizar manualmente
  const refreshNutritionists = useCallback(() => {
    loadNutritionists()
  }, [loadNutritionists])

  return {
    nutritionists,
    loading,
    error,
    refreshNutritionists
  }
}