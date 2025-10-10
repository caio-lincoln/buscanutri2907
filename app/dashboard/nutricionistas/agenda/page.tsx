'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  Video,
  User,
  ArrowLeft,
  Save,
  X,
  CalendarDays,
  Users,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import Loading from '@/components/ui/loading'
import { format, parseISO, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

interface AgendaAvailability {
  id: string
  nutritionist_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
  created_at: string
}

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
  patient: {
    id: string
    full_name: string
    profile_image_url: string | null
  }
}

const daysOfWeek = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
]

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00'
]

const statusLabels = {
  scheduled: 'Agendada',
  in_progress: 'Em andamento',
  completed: 'Concluída',
  cancelled: 'Cancelada',
}

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function AgendaPage() {
  const [availability, setAvailability] = useState<AgendaAvailability[]>([])
  const [sessions, setSessions] = useState<TeleconsultaSession[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditingAvailability, setIsEditingAvailability] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState(new Date())
  const [newAvailability, setNewAvailability] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
    is_available: true,
  })
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false)
  const [newSession, setNewSession] = useState({
    patient_id: '',
    scheduled_at: '',
    duration_minutes: 60,
    price: 150,
  })
  const router = useRouter()
  const { user, nutritionistProfile, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading) {
      if (!user || !nutritionistProfile) {
        router.push('/login')
        return
      }
      loadData()
    }
  }, [user, nutritionistProfile, authLoading])

  const loadData = async () => {
    try {
      await Promise.all([
        loadAvailability(),
        loadSessions(),
      ])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados da agenda')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailability = async () => {
    try {
      if (!nutritionistProfile?.user_id) return

      const response = await fetch(
        `/api/teleconsulta/agenda?nutritionistId=${nutritionistProfile.user_id}`
      )
      
      if (!response.ok) {
        throw new Error('Erro ao carregar disponibilidade')
      }

      const data = await response.json()
      setAvailability(data.availability || [])
    } catch (error) {
      console.error('Erro ao carregar disponibilidade:', error)
    }
  }

  const loadSessions = async () => {
    try {
      if (!nutritionistProfile?.user_id) return

      const response = await fetch(
        `/api/teleconsulta/sessions?userId=${nutritionistProfile.user_id}&userType=nutritionist`
      )
      
      if (!response.ok) {
        throw new Error('Erro ao carregar sessões')
      }

      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (error) {
      console.error('Erro ao carregar sessões:', error)
    }
  }

  const handleSaveAvailability = async () => {
    try {
      if (!nutritionistProfile?.user_id) return

      const response = await fetch('/api/teleconsulta/agenda', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nutritionist_id: nutritionistProfile.user_id,
          availability: availability,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar disponibilidade')
      }

      toast.success('Disponibilidade atualizada com sucesso!')
      setIsEditingAvailability(false)
      await loadAvailability()
    } catch (error) {
      console.error('Erro ao salvar disponibilidade:', error)
      toast.error('Erro ao salvar disponibilidade')
    }
  }

  const handleAddAvailability = async () => {
    try {
      if (!nutritionistProfile?.user_id) return

      const response = await fetch('/api/teleconsulta/agenda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nutritionist_id: nutritionistProfile.user_id,
          ...newAvailability,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao adicionar disponibilidade')
      }

      toast.success('Horário adicionado com sucesso!')
      setNewAvailability({
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00',
        is_available: true,
      })
      await loadAvailability()
    } catch (error) {
      console.error('Erro ao adicionar disponibilidade:', error)
      toast.error('Erro ao adicionar horário')
    }
  }

  const handleCreateSession = async () => {
    try {
      if (!nutritionistProfile?.user_id) return

      const response = await fetch('/api/teleconsulta/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nutritionist_id: nutritionistProfile.user_id,
          ...newSession,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao criar sessão')
      }

      toast.success('Teleconsulta agendada com sucesso!')
      setIsCreateSessionOpen(false)
      setNewSession({
        patient_id: '',
        scheduled_at: '',
        duration_minutes: 60,
        price: 150,
      })
      await loadSessions()
    } catch (error) {
      console.error('Erro ao criar sessão:', error)
      toast.error('Erro ao agendar teleconsulta')
    }
  }

  const handleJoinSession = (session: TeleconsultaSession) => {
    router.push(`/teleconsulta/${session.session_token}`)
  }

  const getWeekDays = () => {
    const start = startOfWeek(selectedWeek, { weekStartsOn: 0 })
    const end = endOfWeek(selectedWeek, { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }

  const getSessionsForDay = (date: Date) => {
    return sessions.filter(session => 
      isSameDay(parseISO(session.scheduled_at), date)
    )
  }

  const getAvailabilityForDay = (dayOfWeek: number) => {
    return availability.filter(avail => avail.day_of_week === dayOfWeek && avail.is_available)
  }

  if (loading) {
    return <Loading message="Carregando agenda..." />
  }

  const weekDays = getWeekDays()
  const upcomingSessions = sessions.filter(
    session => session.status === 'scheduled' && parseISO(session.scheduled_at) > new Date()
  ).slice(0, 5)

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
            <h1 className="text-3xl font-bold text-gray-900">Agenda de Teleconsultas</h1>
            <p className="text-gray-600">Gerencie sua disponibilidade e consultas online</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateSessionOpen} onOpenChange={setIsCreateSessionOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nova Teleconsulta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agendar Nova Teleconsulta</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="patient_id">ID do Paciente</Label>
                  <Input
                    id="patient_id"
                    value={newSession.patient_id}
                    onChange={(e) => setNewSession({ ...newSession, patient_id: e.target.value })}
                    placeholder="Digite o ID do paciente"
                  />
                </div>
                <div>
                  <Label htmlFor="scheduled_at">Data e Hora</Label>
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    value={newSession.scheduled_at}
                    onChange={(e) => setNewSession({ ...newSession, scheduled_at: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duração (minutos)</Label>
                  <Select
                    value={newSession.duration_minutes.toString()}
                    onValueChange={(value) => setNewSession({ ...newSession, duration_minutes: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="60">60 minutos</SelectItem>
                      <SelectItem value="90">90 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newSession.price}
                    onChange={(e) => setNewSession({ ...newSession, price: parseFloat(e.target.value) })}
                    placeholder="150.00"
                  />
                </div>
                <Button onClick={handleCreateSession} className="w-full">
                  Agendar Teleconsulta
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Próximas Consultas */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-green-600" />
                Próximas Teleconsultas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma teleconsulta agendada
                  </h3>
                  <p className="text-gray-600">
                    Suas próximas consultas online aparecerão aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={session.patient.profile_image_url || ''}
                            alt={session.patient.full_name}
                          />
                          <AvatarFallback>
                            {session.patient.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{session.patient.full_name}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            {format(parseISO(session.scheduled_at), "dd 'de' MMMM 'às' HH:mm", {
                              locale: ptBR,
                            })}
                            <span>•</span>
                            <span>{session.duration_minutes} min</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusColors[session.status]}>
                          {statusLabels[session.status]}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handleJoinSession(session)}
                          className="flex items-center gap-2"
                        >
                          <Video className="h-4 w-4" />
                          Entrar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Configuração de Disponibilidade */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Disponibilidade
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingAvailability(!isEditingAvailability)}
                >
                  {isEditingAvailability ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {daysOfWeek.map((day) => {
                  const dayAvailability = getAvailabilityForDay(day.value)
                  return (
                    <div key={day.value} className="border-b pb-3 last:border-b-0">
                      <h4 className="font-medium text-sm text-gray-900 mb-2">
                        {day.label}
                      </h4>
                      {dayAvailability.length === 0 ? (
                        <p className="text-sm text-gray-500">Indisponível</p>
                      ) : (
                        <div className="space-y-1">
                          {dayAvailability.map((avail) => (
                            <div key={avail.id} className="text-sm text-gray-700">
                              {avail.start_time} - {avail.end_time}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}

                {isEditingAvailability && (
                  <div className="pt-4 border-t space-y-4">
                    <h4 className="font-medium">Adicionar Horário</h4>
                    <div className="space-y-3">
                      <Select
                        value={newAvailability.day_of_week.toString()}
                        onValueChange={(value) => setNewAvailability({ ...newAvailability, day_of_week: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {daysOfWeek.map((day) => (
                            <SelectItem key={day.value} value={day.value.toString()}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={newAvailability.start_time}
                          onValueChange={(value) => setNewAvailability({ ...newAvailability, start_time: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Início" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeSlots.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={newAvailability.end_time}
                          onValueChange={(value) => setNewAvailability({ ...newAvailability, end_time: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Fim" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeSlots.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddAvailability} size="sm" className="flex-1">
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar
                        </Button>
                        <Button onClick={handleSaveAvailability} size="sm" variant="outline" className="flex-1">
                          <Save className="h-4 w-4 mr-2" />
                          Salvar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}