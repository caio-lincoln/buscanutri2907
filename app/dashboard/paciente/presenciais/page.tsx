'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, Plus } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { createSupabaseClient, type PatientProfile } from '@/lib/supabase'
import { startOfDay, endOfDay, parseISO, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import PresenciaisFilters, { type PresenciaisFilters as FiltersState } from '@/components/presenciais/PresenciaisFilters'

type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'

interface PresencialAppointment {
  id: string
  appointment_date: string
  duration_minutes: number
  status: AppointmentStatus
  type: 'consultation' | 'follow_up' | 'emergency'
  patient_notes?: string | null
  price?: number | null
  nutritionist_id: string
  patient_id: string
  address_main?: {
    is_main?: boolean
    status?: string
    type?: string
    street?: string | null
    number?: string | null
    neighborhood?: string | null
    city?: string | null
    state?: string | null
    zip_code?: string | null
  } | null
  nutritionist: {
    id: string
    full_name: string
    profile_image_url: string | null
    address?: string | null
    addresses?: Array<{
      id: string
      street: string
      number: string
      neighborhood: string
      city: string
      state: string
      zip_code: string
    }>
  }
  patient: {
    id: string
    full_name: string
    profile_image_url: string | null
  }
}

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string }> = {
  scheduled: { label: 'Agendada', color: 'text-yellow-700 bg-yellow-100 border-yellow-200' },
  confirmed: { label: 'Confirmada', color: 'text-green-700 bg-green-100 border-green-200' },
  completed: { label: 'Concluída', color: 'text-gray-700 bg-gray-100 border-gray-200' },
  cancelled: { label: 'Cancelada', color: 'text-red-700 bg-red-100 border-red-200' },
  no_show: { label: 'Não compareceu', color: 'text-rose-700 bg-rose-100 border-rose-200' },
}

export default function PresenciaisPage() {
  const supabase = useMemo(() => createSupabaseClient(), [])
  const router = useRouter()
  const { user, loading: authLoading, patientProfile } = useAuth()

  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [appointments, setAppointments] = useState<PresencialAppointment[]>([])
  const [isFetching, setIsFetching] = useState(false)
  const [loadingVisible, setLoadingVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const [filters, setFilters] = useState<FiltersState>({
    search: '',
    status: 'all',
    dateFrom: undefined,
    dateTo: undefined,
  })

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [authLoading, user, router])

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
    if (!authLoading && patientProfile?.id) {
      loadAppointments()
    }
  }, [authLoading, patientProfile?.id, filters])

  const loadAppointments = useCallback(async () => {
    if (!patientProfile?.id) return
    try {
      setIsFetching(true)

      // NOTE: Using 'in_person_consultations' table as the correct source for in-person appointments.
      let q = supabase
        .from('in_person_consultations')
        .select(`
          id, scheduled_at, duration_minutes, status, type, patient_notes, nutritionist_id, patient_id,
          nutritionist:nutritionist_profiles!in_person_consultations_nutritionist_id_fkey (
            id, user_id, full_name, profile_image_url, address,
            addresses:nutritionist_addresses(*)
          ),
          patient:patient_profiles!in_person_consultations_patient_id_fkey ( id, full_name, profile_image_url )
        `)
        .eq('patient_id', patientProfile.id)
        .order('scheduled_at', { ascending: false })

      const { status, dateFrom, dateTo } = filters
      if (status && status !== 'all') {
        let dbStatus: string[] = []
        if (status === 'scheduled') dbStatus = ['scheduled', 'agendado']
        else if (status === 'confirmed') dbStatus = ['confirmed', 'confirmado', 'confirmada']
        else if (status === 'completed') dbStatus = ['completed', 'concluido']
        else if (status === 'cancelled') dbStatus = ['cancelled', 'cancelado']
        else if (status === 'no_show') dbStatus = ['no_show']

        if (dbStatus.length > 0) {
          q = q.in('status', dbStatus)
        }
      }
      if (dateFrom) q = q.gte('scheduled_at', startOfDay(dateFrom).toISOString())
      if (dateTo) q = q.lte('scheduled_at', endOfDay(dateTo).toISOString())

      const { data, error } = await q
      if (error) throw error
      console.debug('[Presenciais] patientProfile.id:', patientProfile.id, 'rows:', Array.isArray(data) ? data.length : 0)

      const mapped = ((data as any[]) || []).map((row: any) => {
        // Map database status to frontend status (en)
        let status = row.status
        if (status === 'agendado') status = 'scheduled'
        else if (status === 'confirmado' || status === 'confirmada') status = 'confirmed'
        else if (status === 'concluido') status = 'completed'
        else if (status === 'cancelado') status = 'cancelled'
        
        // Try to find a structured address from the nutritionist's addresses
        // Since in_person_consultations doesn't link to a specific address, we use the first one available
        // or rely on the nutritionist's profile address string.
        const structuredAddress = row.nutritionist?.addresses?.[0] || null;

        return {
        id: row.id,
        appointment_date: row.scheduled_at, // Use ISO string directly
        duration_minutes: row.duration_minutes || 60,
        status: status,
        type: row.type,
        patient_notes: row.patient_notes,
        price: null, // Price is not in in_person_consultations table
        nutritionist_id: row.nutritionist_id,
        patient_id: row.patient_id,
        address_main: structuredAddress,
        nutritionist: row.nutritionist,
        patient: row.patient,
      }})

      setAppointments(mapped)

    } catch (err) {
      console.error('Erro ao carregar consultas presenciais:', err)
      toast.error('Erro ao carregar consultas presenciais')
    } finally {
      setIsFetching(false)
    }
  }, [supabase, patientProfile?.id, filters])

  const textFiltered = appointments.filter(a =>
    ((a.nutritionist?.full_name || '').toLowerCase()).includes((filters.search || '').toLowerCase())
  )

  // Todas as consultas presenciais devem aparecer no Histórico
  const pastAppointments = textFiltered

  const formatDateTime = (iso: string) => {
    const d = parseISO(iso)
    return format(d, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
  }

  const formatAddress = (addr?: PresencialAppointment['address_main']) => {
    if (!addr) return ''
    const parts = [
      addr.street && addr.number ? `${addr.street}, ${addr.number}` : addr.street || '',
      addr.neighborhood || '',
      addr.city && addr.state ? `${addr.city}/${addr.state}` : addr.city || addr.state || '',
      addr.zip_code ? `CEP ${addr.zip_code}` : ''
    ].filter(Boolean)
    return parts.join(' - ')
  }

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
        <div>
          <h1 className="text-3xl font-bold text-[#1E1D40]">Consultas Presenciais</h1>
          <p className="text-gray-600 mt-2">Gerencie suas consultas no consultório</p>
        </div>
        <Link href="/dashboard/paciente/agendar/presencial">
          <Button className="flex items-center gap-2 bg-[#4AB0D9] hover:bg-[#4AB0D9]/90">
            <Plus className="h-4 w-4" />
            Agendar Nova Consulta
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <PresenciaisFilters
        filters={filters}
        onFiltersChange={(next) => setFilters(next)}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        className="mb-6"
      />

      {/* Removida a seção de Próximas Consultas: todas listadas abaixo em Histórico */}

      {/* Histórico */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-600" />
          Histórico de Consultas
        </h2>

        {pastAppointments.length === 0 ? (
          <Card className="border border-gray-200">
            <CardContent className="p-6 text-center text-gray-600">
              Nenhuma consulta presencial encontrada.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pastAppointments.map(a => (
              <Card key={a.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_CONFIG[a.status].color}`}>
                          {STATUS_CONFIG[a.status].label}
                        </span>
                      </div>
                      <Link
                        href={a.nutritionist?.id ? `/nutricionistas/${a.nutritionist.id}` : '/nutricionistas'}
                        className="text-lg font-semibold mt-2 cursor-pointer hover:underline"
                      >
                        {a.nutritionist?.full_name || 'Nutricionista'}
                      </Link>
                      <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{formatAddress(a.address_main) || a.nutritionist?.address || 'Endereço não informado'}</span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDateTime(a.appointment_date)}</span>
                        <Clock className="h-4 w-4 ml-3" />
                        <span>{a.duration_minutes} min</span>
                      </div>
                      {a.patient_notes && (
                        <div className="mt-3 text-sm text-gray-700">
                          Observações: {a.patient_notes}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs text-gray-500">Tipo: {a.type === 'follow_up' ? 'Retorno' : a.type === 'emergency' ? 'Emergência' : 'Consulta'}</span>
                      {a.price && (
                        <span className="text-sm font-medium">R$ {Number(a.price).toFixed(2)}</span>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Link href={`/dashboard/paciente/presenciais/${a.id}`}>
                          <Button variant="outline" size="sm">Ver detalhes</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
