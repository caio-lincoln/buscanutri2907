'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TeleconsultaCard } from '@/components/teleconsulta/TeleconsultaCard'
import { TeleconsultaFilters } from '@/components/teleconsulta/TeleconsultaFilters'
import {
  Video,
  Calendar,
  Clock,
  User,
  Phone,
  PhoneOff,
  VideoOff,
  ArrowLeft,
  Plus,
  Filter,
  Search,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { getUserProfile } from '@/lib/auth'
import type { PatientProfile } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'

interface TeleconsultaSession {
  id: string
  session_token: string
  nutritionist_id: string
  patient_id: string
  scheduled_at: string
  duration_minutes: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  join_url: string
  price: number
  created_at: string
  nutritionist: {
    id: string
    full_name: string
    profile_image_url: string | null
  }
  patient: {
    id: string
    full_name: string
    profile_image_url: string | null
  }
}



export default function TeleconsultasPage() {
  const [ profile, setProfile ] = useState<PatientProfile | null>(null)
  const [ sessions, setSessions ] = useState<TeleconsultaSession[]>([])
  const [ loading, setLoading ] = useState(true)
  const [ searchTerm, setSearchTerm ] = useState('')
  const [ statusFilter, setStatusFilter ] = useState('all')
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading) {
      loadProfile()
    }
  }, [ user, authLoading ])

  useEffect(() => {
    if (profile?.user_id) {
      loadSessions()
    }
  }, [ profile ])

  const loadProfile = async () => {
    try {
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await getUserProfile(user.id, 'paciente')
      setProfile(profileData)
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    }
  }

  const loadSessions = async () => {
    try {
      if (!profile?.user_id) return

      const response = await fetch(
        `/api/teleconsulta/sessions?userId=${profile.user_id}&userType=patient`
      )

      if (!response.ok) {
        throw new Error('Erro ao carregar sessões')
      }

      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (error) {
      console.error('Erro ao carregar sessões:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinSession = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (!session) return
    if (session.status === 'scheduled') {
      const scheduledTime = parseISO(session.scheduled_at)
      const now = new Date()
      const timeDiff = scheduledTime.getTime() - now.getTime()
      const minutesDiff = Math.floor(timeDiff / (1000 * 60))

      if (minutesDiff > 15) {
        alert('A consulta só pode ser iniciada até 15 minutos antes do horário agendado.')
        return
      }

      try {
        // Atualizar status para 'in_progress' se ainda estiver agendada
        const response = await fetch(`/api/teleconsulta/sessions/${session.id}`, {
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
          // Se o erro for de transição inválida, pode ser que já esteja em progresso
          if (!errorData.error?.includes('alterar status')) {
            throw new Error(errorData.error || 'Erro ao entrar na teleconsulta')
          }
        }
      } catch (error) {
        console.error('Erro ao entrar na teleconsulta:', error)
        alert(error instanceof Error ? error.message : 'Erro ao entrar na teleconsulta')
        return
      }
    }

    router.push(`/teleconsulta/${session.session_token}`)
  }

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.nutritionist.full_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const upcomingSessions = filteredSessions.filter(
    session => session.status === 'scheduled' && parseISO(session.scheduled_at) > new Date()
  )

  const pastSessions = filteredSessions.filter(
    session => session.status === 'completed' ||
      (session.status === 'scheduled' && parseISO(session.scheduled_at) <= new Date())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Teleconsultas</h1>
            <p className="text-gray-600">Gerencie suas consultas online</p>
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
          search: '',
          dateFrom: '',
          dateTo: '',
          nutritionist: "",
          patient: '',
          priceMax: '',
          priceMin: '',
          status: ''
        }}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        searchPlaceholder="Buscar por nutricionista..."
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
            {upcomingSessions.map((session) => (
              <TeleconsultaCard
                key={session.id}
                session={session}
                userType="patient"
                onJoin={handleJoinSession}
              />
            ))}
          </div>
        </div>
      )}

      {/* Histórico de Consultas */}
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
            {pastSessions.map((session) => (
              <TeleconsultaCard
                key={session.id}
                session={session}
                userType="patient"
                onJoin={handleJoinSession}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}