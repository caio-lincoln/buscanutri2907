'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, Clock, ArrowLeft, Video, Star, MapPin, DollarSign } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { getUserProfile } from '@/lib/auth'
import type { PatientProfile } from '@/lib/supabase'
import { format, parseISO, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

interface NutritionistProfile {
  id: string
  user_id: string
  full_name: string
  profile_image_url: string | null
  bio: string | null
  specialties: string[]
  experience_years: number
  consultation_price: number
  rating: number
  total_reviews: number
  city: string | null
  state: string | null
}

interface AvailableSlot {
  datetime: string
  date: string
  time: string
  duration: number
  available: boolean
}

export default function AgendarTeleconsultaPage() {
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [nutritionist, setNutritionist] = useState<NutritionistProfile | null>(null)
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const nutritionistId = params.nutritionistId as string

  useEffect(() => {
    if (!authLoading) {
      loadProfile()
    }
  }, [user, authLoading])

  useEffect(() => {
    if (nutritionistId) {
      loadNutritionist()
      loadAvailableSlots()
    }
  }, [nutritionistId])

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
      toast.error('Erro ao carregar perfil do usuário')
    }
  }

  const loadNutritionist = async () => {
    try {
      const response = await fetch(`/api/nutritionists/${nutritionistId}`)
      if (!response.ok) {
        throw new Error('Erro ao carregar nutricionista')
      }
      const data = await response.json()
      setNutritionist(data.nutritionist)
    } catch (error) {
      console.error('Erro ao carregar nutricionista:', error)
      toast.error('Erro ao carregar dados do nutricionista')
    }
  }

  const loadAvailableSlots = async () => {
    try {
      const startDate = new Date().toISOString()
      const endDate = addDays(new Date(), 14).toISOString()
      
      const response = await fetch(
        `/api/teleconsulta/horarios-disponiveis?nutritionistId=${nutritionistId}&startDate=${startDate}&endDate=${endDate}`
      )
      
      if (!response.ok) {
        throw new Error('Erro ao carregar horários disponíveis')
      }
      
      const data = await response.json()
      setAvailableSlots(data.availableSlots || [])
    } catch (error) {
      console.error('Erro ao carregar horários:', error)
      toast.error('Erro ao carregar horários disponíveis')
    } finally {
      setLoading(false)
    }
  }

  const handleBooking = async () => {
    if (!selectedSlot || !profile || !nutritionist) {
      toast.error('Selecione um horário para continuar')
      return
    }

    setBooking(true)
    try {
      const response = await fetch('/api/teleconsulta/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nutritionist_id: nutritionist.user_id,
          patient_id: profile.user_id,
          scheduled_at: selectedSlot.datetime,
          duration_minutes: selectedSlot.duration,
          price: nutritionist.consultation_price,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao agendar teleconsulta')
      }

      const data = await response.json()
      toast.success('Teleconsulta agendada com sucesso!')
      router.push('/dashboard/paciente/teleconsultas')
    } catch (error) {
      console.error('Erro ao agendar:', error)
      toast.error('Erro ao agendar teleconsulta')
    } finally {
      setBooking(false)
    }
  }

  // Agrupar slots por data
  const slotsByDate = availableSlots.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = []
    }
    acc[slot.date].push(slot)
    return acc
  }, {} as Record<string, AvailableSlot[]>)

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
      <div className="flex items-center gap-4 mb-8">
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
          <h1 className="text-3xl font-bold text-gray-900">Agendar Teleconsulta</h1>
          <p className="text-gray-600">Escolha o melhor horário para sua consulta online</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Informações do Nutricionista */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-green-600" />
                Teleconsulta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {nutritionist && (
                <>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={nutritionist.profile_image_url || ''}
                        alt={nutritionist.full_name}
                      />
                      <AvatarFallback>
                        {nutritionist.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{nutritionist.full_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{nutritionist.rating.toFixed(1)}</span>
                        <span>({nutritionist.total_reviews} avaliações)</span>
                      </div>
                      {nutritionist.city && nutritionist.state && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{nutritionist.city}, {nutritionist.state}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {nutritionist.bio && (
                    <div>
                      <h4 className="font-medium mb-2">Sobre</h4>
                      <p className="text-sm text-gray-600">{nutritionist.bio}</p>
                    </div>
                  )}

                  {nutritionist.specialties && nutritionist.specialties.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Especialidades</h4>
                      <div className="flex flex-wrap gap-2">
                        {nutritionist.specialties.map((specialty, index) => (
                          <Badge key={index} variant="secondary">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Valor da consulta:</span>
                      <div className="flex items-center gap-1 font-semibold text-lg text-green-600">
                        <DollarSign className="h-4 w-4" />
                        R$ {nutritionist.consultation_price.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-600">Duração:</span>
                      <span className="font-medium">60 minutos</span>
                    </div>
                  </div>

                  {selectedSlot && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Horário Selecionado</h4>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-green-800">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">
                            {format(parseISO(selectedSlot.datetime), "dd 'de' MMMM 'de' yyyy", {
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-green-800 mt-1">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">
                            {format(parseISO(selectedSlot.datetime), 'HH:mm', {
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={handleBooking}
                        disabled={booking}
                        className="w-full mt-4"
                      >
                        {booking ? 'Agendando...' : 'Confirmar Agendamento'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Horários Disponíveis */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Horários Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(slotsByDate).length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum horário disponível
                  </h3>
                  <p className="text-gray-600">
                    Este nutricionista não possui horários disponíveis nas próximas 2 semanas.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(slotsByDate).map(([date, slots]) => (
                    <div key={date}>
                      <h3 className="font-medium text-lg mb-3">
                        {format(parseISO(date), "EEEE, dd 'de' MMMM", {
                          locale: ptBR,
                        })}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {slots.map((slot, index) => (
                          <Button
                            key={index}
                            variant={selectedSlot?.datetime === slot.datetime ? 'default' : 'outline'}
                            onClick={() => setSelectedSlot(slot)}
                            className="h-12 flex items-center justify-center"
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            {slot.time}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}