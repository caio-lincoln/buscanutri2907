'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ptBR } from 'date-fns/locale'
import { startOfDay, endOfDay, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { Video } from 'lucide-react'

import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { useAuth } from '@/contexts/auth-context'
import { createSupabaseClient } from '@/lib/supabase'
import { AvailabilityManager, TeleconsultaCard, TeleconsultaFilters } from '@/components/teleconsulta'
import { useDebouncedValue } from '@/hooks/use-debounce'

type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

interface Person {
  id: string
  user_id: string
  full_name: string
  phone?: string
  profile_image_url?: string | null
}

interface TeleconsultaSession {
  id: string
  session_token: string
  scheduled_at: string
  started_at?: string | null
  ended_at?: string | null
  duration_minutes: number
  price: number | null
  status: SessionStatus
  join_url?: string | null
  nutritionist?: Person
  patient?: Person
  nutritionist_id: string
  patient_id: string
  created_at?: string
  updated_at?: string
}

interface AgendaAvailability {
  id: string
  nutritionist_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
  created_at: string
}

interface AvailabilitySlot {
  id?: string
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
}

type FiltersState = {
  search: string
  status: 'all' | SessionStatus
  dateFrom: string | null // ISO yyyy-MM-dd
  dateTo: string | null   // ISO yyyy-MM-dd
  priceMin: string
  priceMax: string
}

export default function NutricionistaTeleconsultasTab() {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseClient(), [])
  const { user, nutritionistProfile } = useAuth()

  const [ teleconsultas, setTeleconsultas ] = useState<TeleconsultaSession[]>([])
  const [ availability, setAvailability ] = useState<AgendaAvailability[]>([])
  const [ loading, setLoading ] = useState(true)
  const [ isExpanded, setIsExpanded ] = useState(false)
  // estado único de filtros
  const [ filters, setFilters ] = useState<FiltersState>({
    search: '',
    status: 'all',
    dateFrom: null,
    dateTo: null,
    priceMin: '',
    priceMax: '',
  })

  // somente estes impactam a query do Supabase
  const serverFilters = useMemo(() => ({
    status: filters.status,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
  }), [ filters ])

  // aplica debounce (500ms)
  const debouncedServerFilters = useDebouncedValue(serverFilters, 500)

  const loadTeleconsultas = useCallback(async () => {
    if (!nutritionistProfile?.id) return
    try {
      setLoading(true)

      let q = supabase
        .from('teleconsulta_sessions')
        .select(`
          id, session_token, scheduled_at, started_at, ended_at,
          duration_minutes, price, status, join_url, nutritionist_id, patient_id,
          nutritionist:nutritionist_profiles!teleconsulta_sessions_nutritionist_id_fkey (
            id, user_id, full_name, profile_image_url
          ),
          patient:patient_profiles!teleconsulta_sessions_patient_id_fkey (
            id, user_id, full_name, phone, profile_image_url
          )
        `)
        .eq('nutritionist_id', nutritionistProfile.id)
        .order('scheduled_at', { ascending: true })

      const { status, dateFrom, dateTo, priceMin, priceMax } = debouncedServerFilters

      if (status !== 'all') q = q.eq('status', status)
      if (dateFrom) q = q.gte('scheduled_at', startOfDay(dateFrom).toISOString())
      if (dateTo) q = q.lte('scheduled_at', endOfDay(dateTo).toISOString())
      if (priceMin) q = q.gte('price', Number(priceMin))
      if (priceMax) q = q.lte('price', Number(priceMax))

      const { data, error } = await q
      if (error) throw error
      setTeleconsultas(data || [])
    } catch (err) {
      console.error('Erro ao carregar teleconsultas:', err)
      toast.error('Erro ao carregar teleconsultas')
    } finally {
      if (isExpanded) {
        setIsExpanded(true)
      }
      setLoading(false)
    }
  }, [ supabase, nutritionistProfile?.id, debouncedServerFilters ])

  const loadAvailability = useCallback(async () => {
    if (!nutritionistProfile?.id) return
    try {
      const { data, error } = await supabase
        .from('nutritionist_availability')
        .select('*')
        .eq('nutritionist_id', nutritionistProfile.id)
        .eq('is_available', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true })

      if (error) throw error
      setAvailability(data || [])
    } catch (error) {
      console.error('Erro ao carregar disponibilidade:', error)
      toast.error('Erro ao carregar disponibilidade')
    }
  }, [ supabase, nutritionistProfile?.id ])

  useEffect(() => {
    if (user) {
      loadTeleconsultas()
    }
  }, [ user, loadTeleconsultas ])

  // ------- ACTIONS -------

  const handleStartTeleconsulta = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/teleconsulta/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao iniciar teleconsulta')
      }
      router.push(`/teleconsulta/${sessionId}`)
    } catch (error) {
      console.error('Erro ao iniciar teleconsulta:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao iniciar teleconsulta')
    }
  }

  const handleCancelTeleconsulta = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/teleconsulta/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao cancelar teleconsulta')
      }
      toast.success('Teleconsulta cancelada com sucesso')
      loadTeleconsultas()
    } catch (error) {
      console.error('Erro ao cancelar teleconsulta:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao cancelar teleconsulta')
    }
  }

  const handleAddAvailability = async (slotData: Omit<AvailabilitySlot, 'id'>) => {
    const res = await fetch('/api/teleconsulta/agenda', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slotData),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Erro ao adicionar disponibilidade')
    }
    loadAvailability()
  }

  const handleUpdateAvailability = async (id: string, slotData: Omit<AvailabilitySlot, 'id'>) => {
    const res = await fetch(`/api/teleconsulta/agenda/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slotData),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Erro ao atualizar disponibilidade')
    }
    loadAvailability()
  }

  const handleDeleteAvailability = async (id: string) => {
    const res = await fetch(`/api/teleconsulta/agenda/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Erro ao excluir disponibilidade')
    }
    loadAvailability()
  }

  const filteredTeleconsultas = useMemo(() => {
    const term = filters.search.trim().toLowerCase()
    if (!term) return teleconsultas
    return teleconsultas.filter(t =>
      t.patient?.full_name?.toLowerCase().includes(term)
    )
  }, [ teleconsultas, filters.search ])

  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#1E1D40]" />
  //     </div>
  //   )
  // }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1E1D40]">Teleconsultas</h1>
          <p className="text-gray-600 mt-2">Gerencie suas teleconsultas</p>
        </div>
      </div>

      <Tabs defaultValue="teleconsultas" className="space-y-6">
        <TabsContent value="teleconsultas" className="space-y-6">
          <TeleconsultaFilters
            searchTerm={filters.search}
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
            onSearchChange={(v: string) =>
              setFilters(prev => ({ ...prev, search: v }))
            }
            statusFilter={filters.status}
            onStatusChange={(s: FiltersState[ 'status' ]) =>
              setFilters(prev => ({ ...prev, status: s }))
            }
            filters={filters}
            onFiltersChange={(next: Partial<FiltersState>) =>
              setFilters(prev => ({ ...prev, ...next }))
            }
            searchPlaceholder="Buscar por paciente..."
            className="mb-6"
          />

          {loading ? <>
            <div className="text-center py-12 flex flex-col items-center justify-center ">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-500 mx-auto"></div>
              <p className="text-[#1E1D40]/70">Carregando suas consultas...</p>
            </div>
          </> : <>
            <div className="grid gap-4">
              {filteredTeleconsultas.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Video className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Nenhuma teleconsulta encontrada
                    </h3>
                    <p className="text-gray-600 text-center">
                      {filters.search || filters.status !== 'all'
                        ? 'Tente ajustar os filtros de busca'
                        : 'Você ainda não possui teleconsultas agendadas'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredTeleconsultas.map(session => (
                  <TeleconsultaCard
                    key={session.id}
                    session={session}
                    userRole="nutricionista"
                    onStart={handleStartTeleconsulta}
                    onCancel={handleCancelTeleconsulta}
                  />
                ))
              )}
            </div>
          </>}

        </TabsContent>

        <TabsContent value="disponibilidade" className="space-y-6">
          <AvailabilityManager
            availability={availability}
            onAdd={handleAddAvailability}
            onUpdate={handleUpdateAvailability}
            onDelete={handleDeleteAvailability}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
