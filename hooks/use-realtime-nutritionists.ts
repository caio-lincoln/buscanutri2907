'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

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
  const [ nutritionists, setNutritionists ] = useState<NutritionistProfile[]>([])
  const [ loading, setLoading ] = useState(true)
  const [ error, setError ] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // sempre aponta para a versão mais recente do loader (para evitar stale-closure nos handlers)
  const latestLoadRef = useRef<() => Promise<void>>(() => Promise.resolve())

  const getMinPrice = (services: any[]) => {
    if (!services || services.length === 0) return null
    return Math.min(...services.map((s) => s.price))
  }

  const loadNutritionists = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const specJoin = (filters.specialty && filters.specialty !== 'Todas')
        ? `,nutritionist_specialties!inner (
           specialty_id,
           specialties:specialties ( id, name )
         )`
        : `,nutritionist_specialties (
           specialty_id,
           specialties:specialties ( id, name )
         )`

      let query = supabase
        .from('nutritionist_profiles')
        .select(`
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
          nutritionist_services(*)
          ${specJoin}
        `)

      // Filtros
      if (filters.searchTerm) {
        query = query.or(
          `full_name.ilike.%${filters.searchTerm}%,bio.ilike.%${filters.searchTerm}%`
        )
      }

      if (filters.state && filters.state !== 'Todas') {
        query = query.ilike('location', `%${filters.state}%`)
      }

      if (filters.verifiedOnly) {
        query = query.eq('verification_status', 'aprovado')
      }

      if (filters.specialty !== "Todas" && filters.specialty) {
        query = query.eq('nutritionist_specialties.specialty_id', filters.specialty)
      }

      const { data, error } = await query

      if (error) throw error

      let filteredData: NutritionistProfile[] = (data as any) || []

      // remove ids ruins
      filteredData = filteredData.filter((n) => n.id && n.id !== 'null' && n.id !== 'undefined')

      if (filters.priceRange && filters.priceRange.label !== "Todos") {
        filteredData = filteredData.filter((n) => {
          const minPrice = getMinPrice(n.nutritionist_services)
          return minPrice != null &&
            minPrice >= filters.priceRange!.min &&
            minPrice <= filters.priceRange!.max
        })
      }

      if (filters.onlineOnly) {
        filteredData = filteredData.filter((n) =>
          n.nutritionist_services?.some((s: any) => s.online_available
          )
        )
      }

      // ordenação
      filteredData.sort((a, b) => {
        switch (filters.sortBy) {
          case 'rating':
            return (b.rating || 0) - (a.rating || 0)
          case 'price-low':
            return (getMinPrice(a.nutritionist_services) || 0) -
              (getMinPrice(b.nutritionist_services) || 0)
          case 'price-high':
            return (getMinPrice(b.nutritionist_services) || 0) -
              (getMinPrice(a.nutritionist_services) || 0)
          case 'name':
            return a.full_name.localeCompare(b.full_name)
          case 'experience':
            return (b.experience_years || 0) - (a.experience_years || 0)
          default:
            return 0
        }
      })

      setNutritionists(filteredData)
    } catch (e) {
      console.log("🚀 ~ useRealtimeNutritionists ~ e:", e)
      console.error('Error loading nutritionists:', e)
      setError('Erro ao carregar nutricionistas')
    } finally {
      setLoading(false)
    }
  }, [
    filters.searchTerm,
    filters.priceRange,
    filters.state,
    filters.onlineOnly,
    filters.verifiedOnly,
    filters.sortBy,
    filters.specialty
  ])

  // mantém o ref apontando para a versão atual do loader
  useEffect(() => {
    latestLoadRef.current = loadNutritionists
  }, [ loadNutritionists ])

  // Recarrega quando os filtros mudarem
  useEffect(() => {
    loadNutritionists()
  }, [ loadNutritionists ])

  // Inscrição realtime (uma vez) usando o ref para chamar a versão atual do loader
  useEffect(() => {
    const ch = supabase
      .channel('nutritionist_profiles_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'nutritionist_profiles' },
        () => latestLoadRef.current()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'nutritionist_services' },
        () => latestLoadRef.current()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'nutritionist_specialties' },
        () => latestLoadRef.current()
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime inscrito')
        }
      })

    channelRef.current = ch
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, []) // não depende dos filtros – usamos latestLoadRef dentro dos handlers

  const refreshNutritionists = useCallback(() => {
    return latestLoadRef.current()
  }, [])

  return { nutritionists, loading, error, refreshNutritionists }
}