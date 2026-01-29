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
  aceita_cupons?: boolean | null
  nutritionist_services?: any[]
  nutritionist_specialties?: any[]
}

export interface UseRealtimeNutritionistsProps {
  searchTerm?: string | undefined
  specialty?: string | undefined
  state?: string | undefined
  city?: string | undefined
  region?: 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul' | undefined
  priceRange?: { min: number; max: number } | undefined
  onlineOnly?: boolean | undefined
  verifiedOnly?: boolean | undefined
  sortBy?: string | undefined
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

      // Mapa de estados por região (UFs)
      const REGION_STATES: Record<string, string[]> = {
        'Norte': [ 'AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO' ],
        'Nordeste': [ 'AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE' ],
        'Centro-Oeste': [ 'GO', 'MT', 'MS', 'DF' ],
        'Sudeste': [ 'ES', 'MG', 'RJ', 'SP' ],
        'Sul': [ 'PR', 'RS', 'SC' ],
      }

      // specialty: inner join só quando filtra
      const specJoin =
        filters.specialty && filters.specialty !== 'Todas'
          ? `,nutritionist_specialties!inner(
             specialty_id,
             specialties:specialties ( id, name )
           )`
          : `,nutritionist_specialties(
             specialty_id,
             specialties:specialties ( id, name )
           )`

      // addresses: inner join quando filtra por UF, cidade ou região
      const addrJoin =
        (filters.state && filters.state !== 'Todas') ||
        (filters.city && filters.city !== 'Todas') ||
        (filters.region && filters.region !== 'Todas')
          ? `,nutritionist_addresses!inner(*)`
          : `,nutritionist_addresses(*)`

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
        aceita_cupons,
        online_available:service_online_available,
        nutritionist_services(*)
        ${addrJoin}
        ${specJoin}
      `)
        .eq('is_listed', true)

      // Exclude test users
      const TEST_USER_IDS = [
        'db607821-762e-4cb0-b6b4-727d1cdc60e7', // nutricionista@buscanutri.com
        'e69b468d-185a-44ca-aaea-75bfd99d95a7', // paciente@buscanutri.com
        '2343be01-adc8-4087-b8d1-0c0913b182da'  // empresa@buscanutri.com
      ]
      // Use filter with not.in format for UUIDs: '("uuid1","uuid2")'
      const idsString = `(${TEST_USER_IDS.map(id => `"${id}"`).join(',')})`
      query = query.filter('user_id', 'not.in', idsString)

      // busca por texto
      if (filters.searchTerm) {
        query = query.or(
          `full_name.ilike.%${filters.searchTerm}%,bio.ilike.%${filters.searchTerm}%`
        )
      }

      // filtro por UF (ex.: 'SE', 'PB'...)
      if (filters.state && filters.state !== 'Todas') {
        // usar eq; com !inner acima restringe também o pai
        query = query.eq('nutritionist_addresses.state', filters.state)
        // se preferir por nome completo do estado (quando sua UI envia o nome):
        // query = query.ilike('nutritionist_addresses.state', `%${filters.state}%`)
      }

      // filtro por cidade (case-insensitive)
      if (filters.city && filters.city !== 'Todas') {
        // Usar ilike para evitar problemas de maiúsculas/minúsculas/acentos
        query = query.ilike('nutritionist_addresses.city', `%${filters.city}%`)
      }

      // filtro por região (aplica IN nos estados da região)
      if (filters.region && filters.region !== 'Todas') {
        const ufs = REGION_STATES[ filters.region ] || []
        if (ufs.length > 0) {
          query = query.in('nutritionist_addresses.state', ufs)
        }
      }

      if (filters.verifiedOnly) {
        query = query.eq('verification_status', 'aprovado')
      }

      if (filters.specialty && filters.specialty !== 'Todas') {
        query = query.eq('nutritionist_specialties.specialty_id', filters.specialty)
      }

      const { data, error } = await query
      if (error) throw error

      let filteredData: NutritionistProfile[] = (data as any) || []
      filteredData = filteredData.filter(n => n.id && n.id !== 'null' && n.id !== 'undefined')

      if (filters.priceRange && filters.priceRange.label !== 'Todos') {
        filteredData = filteredData.filter(n => {
          const minPrice = getMinPrice(n.nutritionist_services)
          return minPrice != null &&
            minPrice >= filters.priceRange!.min &&
            minPrice <= filters.priceRange!.max
        })
      }

      if (filters.onlineOnly) {
        filteredData = filteredData.filter(n =>
          n.nutritionist_services?.some((s: any) => s.online_available) ||
          n.online_available
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
      console.error('Error loading nutritionists:', e)
      setError('Erro ao carregar nutricionistas')
    } finally {
      setLoading(false)
    }
  }, [
    filters.searchTerm,
    filters.priceRange,
    filters.state,
    filters.city,
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
