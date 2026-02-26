'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Video, ArrowLeft, Plus } from 'lucide-react'
import { TeleconsultaCard } from '@/components/teleconsulta/TeleconsultaCard'
import { TeleconsultaFilters } from '@/components/teleconsulta/TeleconsultaFilters'
import { useAuth } from '@/contexts/auth-context'
import { createSupabaseClient, type PatientProfile } from '@/lib/supabase'
import { startOfDay, endOfDay, parseISO } from 'date-fns'
import { useDebouncedValue } from '../../../../hooks/use-debounce'
import { toast } from 'sonner'

type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

interface TeleconsultaSession {
  id: string
  session_token: string
  nutritionist_id: string
  patient_id: string
  scheduled_at: string
  started_at?: string | null
  ended_at?: string | null
  duration_minutes: number
  status: SessionStatus
  join_url: string
  price: number
  nutritionist: {
    id: string
    full_name: string
    name: string // Adicionado para compatibilidade
    profile_image_url: string | null
    avatar_url?: string | null // Adicionado para compatibilidade
    crn?: string
  }
  patient: {
    id: string
    full_name: string
    name: string // Adicionado para compatibilidade
    profile_image_url: string | null
    avatar_url?: string | null // Adicionado para compatibilidade
  }
}

type FiltersState = {
  search: string
  status: 'all' | SessionStatus
  dateFrom: string | null // ISO yyyy-MM-dd
  dateTo: string | null   // ISO yyyy-MM-dd
  priceMin: string
  priceMax: string
}

export default function TeleconsultasPage() {
  const supabase = useMemo(() => createSupabaseClient(), [])
  const router = useRouter()
  const { user, loading: authLoading, patientProfile } = useAuth()

  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [sessions, setSessions] = useState<TeleconsultaSession[]>([])
  const [isFetching, setIsFetching] = useState(false)         // estado "real" de busca
  const [loadingVisible, setLoadingVisible] = useState(false) // loading com debounce visual
  const [isExpanded, setIsExpanded] = useState(false)

  const [filters, setFilters] = useState<FiltersState>({
    search: '',
    status: 'all',
    dateFrom: null,
    dateTo: null,
    priceMin: '',
    priceMax: '',
  })

  // apenas filtros que impactam a query no servidor
  const serverFilters = useMemo(() => ({
    status: filters.status,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
  }), [filters])

  // debounce de 500ms para evitar "chatter" no servidor
  const debouncedServerFilters = useDebouncedValue(serverFilters, 500)

  // debounce visual do spinner (evita piscar em buscas muito rápidas)
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null
    if (isFetching) {
      t = setTimeout(() => setLoadingVisible(true), 250)
    } else {
      setLoadingVisible(false)
    }
    return () => { if (t) clearTimeout(t) }
  }, [isFetching])

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [authLoading, user, router])

  useEffect(() => {
    if (!authLoading && patientProfile?.id) {
      loadTeleconsultas()
    }
  }, [authLoading, patientProfile?.id, debouncedServerFilters]) // refaz quando filtros (debounced) mudam

  const loadTeleconsultas = useCallback(async () => {
    if (!patientProfile?.id) return
    try {
      setIsFetching(true)

      let q = supabase
        .from('appointments')
        .select(`
          id, scheduled_at, price, status,
          appointment_date, appointment_time, duration_minutes,
          nutritionist:nutritionist_profiles!fk_appointments_nutritionist_id (
            id, user_id, full_name, profile_image_url
          ),
          patient:patient_profiles!appointments_patient_id_fkey (
            id, user_id, full_name, phone, profile_image_url
          )
        `)
        .eq('patient_id', patientProfile.id)
        .order('scheduled_at', { ascending: false })

      const { status, dateFrom, dateTo, priceMin, priceMax } = debouncedServerFilters

      // Mapeamento de status do filtro para o banco
      if (status !== 'all') {
        if (status === 'scheduled') q = q.in('status', ['paid', 'confirmed', 'agendado', 'confirmada'])
        else if (status === 'cancelled') q = q.in('status', ['cancelled', 'cancelado'])
        else if (status === 'completed') q = q.in('status', ['completed', 'realizada', 'concluido'])
      } else {
        // Por padrão, não mostrar agendamentos pendentes de pagamento ou cancelados
        // Apenas pagos/confirmados e concluídos devem aparecer na lista geral
        q = q.in('status', ['paid', 'confirmed', 'agendado', 'confirmada', 'completed', 'realizada', 'concluido'])
      }

      if (dateFrom) q = q.gte('scheduled_at', startOfDay(dateFrom).toISOString())
      if (dateTo)   q = q.lte('scheduled_at', endOfDay(dateTo).toISOString())
      if (priceMin) q = q.gte('price', Number(priceMin))
      if (priceMax) q = q.lte('price', Number(priceMax))

      const { data, error } = await q
      if (error) throw error

      // Mapear para o formato esperado pela interface
      const mappedSessions: TeleconsultaSession[] = (data || []).map((app: any) => {
        // Normalização de status
        let normalizedStatus: SessionStatus = 'scheduled' // Default fallback
        const rawStatus = (app.status || '').toLowerCase()

        if (['paid', 'confirmed', 'confirmada', 'agendado', 'scheduled'].includes(rawStatus)) {
          normalizedStatus = 'scheduled'
        } else if (['cancelled', 'cancelado'].includes(rawStatus)) {
          normalizedStatus = 'cancelled'
        } else if (['completed', 'realizada', 'concluido'].includes(rawStatus)) {
          normalizedStatus = 'completed'
        } else if (['in_progress', 'em_andamento'].includes(rawStatus)) {
          normalizedStatus = 'in_progress'
        }

        // Fallback para scheduled_at se estiver nulo
        let scheduledAt = app.scheduled_at
        if (!scheduledAt && app.appointment_date && app.appointment_time) {
          scheduledAt = `${app.appointment_date}T${app.appointment_time}`
        }

        return {
          id: app.id,
          session_token: app.id, // Usando ID como token por enquanto
          nutritionist_id: app.nutritionist?.id,
          patient_id: app.patient?.id,
          scheduled_at: scheduledAt,
          duration_minutes: app.duration_minutes || 60,
          price: app.price || 0,
          status: normalizedStatus,
          join_url: `/teleconsulta/${app.id}`,
          nutritionist: {
            id: app.nutritionist?.id,
            full_name: app.nutritionist?.full_name || 'Nutricionista',
            profile_image_url: app.nutritionist?.profile_image_url,
            name: app.nutritionist?.full_name || 'Nutricionista',
            avatar_url: app.nutritionist?.profile_image_url
          },
          patient: {
            id: app.patient?.id,
            full_name: app.patient?.full_name || 'Paciente',
            profile_image_url: app.patient?.profile_image_url,
            name: app.patient?.full_name || 'Paciente',
            avatar_url: app.patient?.profile_image_url
          }
        }
      }).filter(s => s.scheduled_at) // Remove sessões sem data válida

      setSessions(mappedSessions)
    } catch (err) {
      console.error('Erro ao carregar teleconsultas:', err)
      toast.error('Erro ao carregar teleconsultas')
    } finally {
      setIsFetching(false)
    }
  }, [supabase, patientProfile?.id, debouncedServerFilters])

  const handleJoinSession = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (!session) return

    // permite entrar até 15 min antes
    if (session.status === 'scheduled') {
      const now = Date.now()
      const scheduled = parseISO(session.scheduled_at).getTime()
      const diffMin = Math.floor((scheduled - now) / 60000)
      if (diffMin > 15) {
        toast.info('Você poderá entrar na sala até 15 minutos antes do horário agendado.')
        return
      }

      try {
        const r = await fetch(`/api/teleconsulta/sessions/${session.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'in_progress' }),
        })
        if (!r.ok) {
          const e = await r.json()
          // se não for erro de transição inválida, repasse
          if (!String(e?.error || '').includes('alterar status')) throw new Error(e?.error)
        }
      } catch (e) {
        console.error(e)
        toast.error(e instanceof Error ? e.message : 'Erro ao entrar na teleconsulta')
        return
      }
    }

    router.push(`/teleconsulta/${session.session_token}`)
  }

  // filtro local por texto (nome do nutricionista)
  const textFiltered = sessions.filter(s =>
    s.nutritionist.full_name.toLowerCase().includes(filters.search.toLowerCase())
  )

  const inProgressSessions = textFiltered.filter(s => s.status === 'in_progress')

  const upcomingSessions = textFiltered.filter(
    s => s.status === 'scheduled' && parseISO(s.scheduled_at) > new Date()
  ).concat(inProgressSessions)

  const pastSessions = textFiltered.filter(
    s => s.status === 'completed' || s.status === 'cancelled' ||
      (s.status === 'scheduled' && parseISO(s.scheduled_at) <= new Date())
  )

  if (loadingVisible) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#1E1D40]" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button> */}
          <div>
            <h1 className="text-3xl font-bold text-[#1E1D40]">Teleconsultas</h1>
            <p className="text-gray-600 mt-2">Gerencie suas consultas online</p>
          </div>
        </div>
        <Link href="/dashboard/paciente/agendar">
          <Button className="flex items-center gap-2 bg-[#4AB0D9] hover:bg-[#4AB0D9]/90">
            <Plus className="h-4 w-4" />
            Agendar Nova Consulta
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <TeleconsultaFilters
        filters={{
          search: filters.search,
          status: filters.status,
          dateFrom: filters.dateFrom ? parseISO(filters.dateFrom) : undefined,
          dateTo: filters.dateTo ? parseISO(filters.dateTo) : undefined,
          priceMin: filters.priceMin ? Number(filters.priceMin) : undefined,
          priceMax: filters.priceMax ? Number(filters.priceMax) : undefined,
        }}
        onFiltersChange={(newFilters) => {
           setFilters(prev => ({
             ...prev,
             search: newFilters.search || '',
             status: (newFilters.status as any) || 'all',
             dateFrom: newFilters.dateFrom ? newFilters.dateFrom.toISOString() : null,
             dateTo: newFilters.dateTo ? newFilters.dateTo.toISOString() : null,
             priceMin: newFilters.priceMin ? String(newFilters.priceMin) : '',
             priceMax: newFilters.priceMax ? String(newFilters.priceMax) : '',
           }))
        }}
        userRole="patient"
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        className="mb-6"
      />

      {/* Próximas Consultas */}
      {upcomingSessions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            Próximas Consultas
          </h2>
          <div className="grid gap-4">
            {upcomingSessions.map(s => (
              <TeleconsultaCard
                key={s.id}
                session={s as any} // Cast para evitar erro de tipo por causa de propriedades extras/diferentes
                userRole="paciente"
                onJoin={handleJoinSession}
              />
            ))}
          </div>
        </div>
      )}

      {/* Histórico */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-600" />
          Histórico de Consultas
        </h2>

        {pastSessions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma consulta encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                Você ainda não possui consultas online realizadas.
              </p>
              <Link href="/dashboard/paciente/agendar">
                <Button className="bg-[#4AB0D9] hover:bg-[#4AB0D9]/90">
                  Agendar Primeira Consulta
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pastSessions.map(s => (
              <TeleconsultaCard
                key={s.id}
                session={s as any}
                userRole="paciente"
                onJoin={handleJoinSession}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
