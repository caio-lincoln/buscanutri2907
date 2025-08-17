'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'


import {

  Video,

} from 'lucide-react'
import { format, parseISO, addDays, startOfWeek, endOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
// import { AvailabilityManager } from '../../../../src/components/teleconsulta/AvailabilityManager'
import { useAuth } from '../../../../contexts/auth-context'
import { supabase } from '../../../../lib/supabase'
import { AvailabilityManager, TeleconsultaCard, TeleconsultaFilters } from '../../../../components/teleconsulta'

interface TeleconsultaSession {
  id: string
  session_token: string
  nutritionist_id: string
  patient_id: string
  scheduled_at: string
  duration_minutes: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  meeting_url?: string
  notes?: string
  created_at: string
  updated_at: string
  patient_profiles?: {
    full_name: string
    phone?: string
    email?: string
  }
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

export default function NutricionistaTeleconsultasPage() {
  const router = useRouter()
  const [ teleconsultas, setTeleconsultas ] = useState<TeleconsultaSession[]>([])
  const [ availability, setAvailability ] = useState<AgendaAvailability[]>([])
  const [ loading, setLoading ] = useState(true)
  const [ searchTerm, setSearchTerm ] = useState('')
  const [ statusFilter, setStatusFilter ] = useState<string>('all')
  const [ selectedDate, setSelectedDate ] = useState<Date>(new Date())
  const { user, loading: authLoading, nutritionistProfile } = useAuth()

  const checkUser = async () => {
    try {

      if (!authLoading && !user) {
        router.push('/login')
        return
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error)
      router.push('/login')
    }
  }

  const loadTeleconsultas = useCallback(async () => {
    try {
      setLoading(true)
      const startDate = startOfWeek(selectedDate, { locale: ptBR })
      const endDate = endOfWeek(selectedDate, { locale: ptBR })

      const { data, error } = await supabase
        .from('teleconsulta_sessions')
        .select(`
          *
        `)
        .eq('nutritionist_id', nutritionistProfile.id)
        .gte('scheduled_at', startDate.toISOString())
        .lte('scheduled_at', endDate.toISOString())
        .order('scheduled_at', { ascending: true })

      if (error) throw error
      setTeleconsultas(data || [])
    } catch (error) {
      console.error('Erro ao carregar teleconsultas:', error)
      toast.error('Erro ao carregar teleconsultas')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadAvailability = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    if (user) {
      loadTeleconsultas()
      loadAvailability()
    }
  }, [ user, loadAvailability, loadTeleconsultas ])

  useEffect(() => {
    checkUser()
  }, [])

  const handleStartTeleconsulta = async (sessionId: string) => {
    try {
      // Atualizar status para 'in_progress'
      const response = await fetch(`/api/teleconsulta/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'in_progress',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao iniciar teleconsulta')
      }

      // Redirecionar para a sala de teleconsulta
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'cancelled',
        }),
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
    try {
      const response = await fetch('/api/teleconsulta/agenda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slotData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao adicionar disponibilidade')
      }

      loadAvailability()
    } catch (error) {
      console.error('Erro ao adicionar disponibilidade:', error)
      throw error
    }
  }

  const handleUpdateAvailability = async (id: string, slotData: Omit<AvailabilitySlot, 'id'>) => {
    try {
      const response = await fetch(`/api/teleconsulta/agenda/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slotData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar disponibilidade')
      }

      loadAvailability()
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade:', error)
      throw error
    }
  }

  const handleDeleteAvailability = async (id: string) => {
    try {
      const response = await fetch(`/api/teleconsulta/agenda/${id}`, {
        method: 'DELETE',
      })
      console.log("🚀 ~ handleDeleteAvailability ~ response:", response)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao excluir disponibilidade')
      }

      loadAvailability()
    } catch (error) {
      console.error('Erro ao excluir disponibilidade:', error)
      throw error
    }
  }

  const filteredTeleconsultas = teleconsultas.filter((teleconsulta) => {
    const matchesSearch = teleconsulta.patient_profiles?.full_name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || teleconsulta.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getDayName = (dayOfWeek: number) => {
    const days = [ 'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado' ]
    return days[ dayOfWeek ]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#1E1D40]"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1E1D40]">Teleconsultas</h1>
          <p className="text-gray-600 mt-2">
            Gerencie suas teleconsultas e disponibilidade
          </p>
        </div>
      </div>

      <Tabs defaultValue="teleconsultas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="teleconsultas">Teleconsultas</TabsTrigger>
          <TabsTrigger value="disponibilidade">Disponibilidade</TabsTrigger>
        </TabsList>

        <TabsContent value="teleconsultas" className="space-y-6">
          <TeleconsultaFilters
            searchTerm={searchTerm}
            filters={{
              search: '',
              dateFrom: '',
              dateTo: '',
              nutritionist: "",
              patient: '',
              priceMax: '',
              priceMin: '',
              status: ''
            }}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            searchPlaceholder="Buscar por paciente..."
            className="mb-6"
          />

          <div className="grid gap-4">
            {filteredTeleconsultas.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Video className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma teleconsulta encontrada
                  </h3>
                  <p className="text-gray-600 text-center">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Tente ajustar os filtros de busca'
                      : 'Você ainda não possui teleconsultas agendadas'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredTeleconsultas.map((teleconsulta) => (
                <TeleconsultaCard
                  key={teleconsulta.id}
                  session={teleconsulta}
                  userType="nutritionist"
                  onStart={handleStartTeleconsulta}
                  onCancel={handleCancelTeleconsulta}
                />
              ))
            )}
          </div>
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