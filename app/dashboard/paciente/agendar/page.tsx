'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Calendar, 
  Clock, 
  ArrowLeft, 
  Video, 
  Star, 
  MapPin, 
  DollarSign,
  Search,
  Filter,
  Grid,
  List
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { getUserProfile } from '@/lib/auth'
import type { PatientProfile } from '@/lib/supabase'
import { format, parseISO, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { formatNutritionistData } from '@/lib/nutritionist-service'

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
  offers_online_consultation: boolean
}

interface AvailableSlot {
  datetime: string
  date: string
  time: string
  duration: number
  available: boolean
}

export default function AgendarPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  
  // Estados para busca de nutricionistas
  const [nutritionists, setNutritionists] = useState<NutritionistProfile[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('Todas')
  const [selectedState, setSelectedState] = useState('Todas')
  const [selectedPriceRange, setSelectedPriceRange] = useState({ min: 0, max: 500 })
  const [onlineOnly, setOnlineOnly] = useState(true) // Padrão para teleconsultas
  const [sortBy, setSortBy] = useState('rating')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [loading, setLoading] = useState(false)
  
  // Estados para agendamento
  const [selectedNutritionist, setSelectedNutritionist] = useState<NutritionistProfile | null>(null)
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [booking, setBooking] = useState(false)
  const [step, setStep] = useState<'search' | 'schedule'>('search')
  
  // Verificar se há um nutricionista pré-selecionado
  useEffect(() => {
    const nutritionistId = searchParams.get('nutritionistId')
    if (nutritionistId) {
      // Buscar dados do nutricionista específico
      loadSpecificNutritionist(nutritionistId)
    }
  }, [searchParams])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    
    if (user) {
      loadProfile()
      if (step === 'search') {
        loadNutritionists()
      }
    }
  }, [user, authLoading, step, searchTerm, selectedSpecialty, selectedState, selectedPriceRange, onlineOnly, sortBy])

  const loadProfile = async () => {
    try {
      const profileData = await getUserProfile()
      setProfile(profileData)
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    }
  }

  const loadSpecificNutritionist = async (nutritionistId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/nutritionists/${nutritionistId}`)
      if (!response.ok) {
        throw new Error('Nutricionista não encontrado')
      }
      const data = await response.json()
      setSelectedNutritionist(data)
      setStep('schedule')
      loadAvailableSlots(nutritionistId)
    } catch (error) {
      console.error('Erro ao carregar nutricionista:', error)
      toast.error('Erro ao carregar dados do nutricionista')
    } finally {
      setLoading(false)
    }
  }

  const loadNutritionists = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        specialty: selectedSpecialty,
        state: selectedState,
        minPrice: selectedPriceRange.min.toString(),
        maxPrice: selectedPriceRange.max.toString(),
        onlineOnly: onlineOnly.toString(),
        sortBy: sortBy,
        limit: '20'
      })
      
      const response = await fetch(`/api/nutritionists?${params}`)
      if (!response.ok) {
        throw new Error('Erro ao buscar nutricionistas')
      }
      
      const data = await response.json()
      setNutritionists(data.nutritionists || [])
    } catch (error) {
      console.error('Erro ao carregar nutricionistas:', error)
      setNutritionists([])
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableSlots = async (nutritionistId: string) => {
    try {
      setLoading(true)
      const startDate = format(new Date(), 'yyyy-MM-dd')
      const endDate = format(addDays(new Date(), 14), 'yyyy-MM-dd')
      
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

  const handleSelectNutritionist = (nutritionist: NutritionistProfile) => {
    setSelectedNutritionist(nutritionist)
    setStep('schedule')
    loadAvailableSlots(nutritionist.id)
  }

  const handleBooking = async () => {
    if (!selectedSlot || !profile || !selectedNutritionist) {
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
          nutritionist_id: selectedNutritionist.id,
          scheduled_for: selectedSlot.datetime,
          duration_minutes: selectedSlot.duration,
          price: selectedNutritionist.consultation_price,
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

  if (loading && step === 'search') {
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
          onClick={() => {
            if (step === 'schedule') {
              setStep('search')
              setSelectedNutritionist(null)
              setSelectedSlot(null)
            } else {
              router.back()
            }
          }}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {step === 'schedule' ? 'Voltar à busca' : 'Voltar'}
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {step === 'search' ? 'Buscar Nutricionista' : 'Agendar Teleconsulta'}
          </h1>
          <p className="text-gray-600">
            {step === 'search' 
              ? 'Encontre o nutricionista ideal para sua teleconsulta'
              : 'Escolha o melhor horário para sua consulta online'
            }
          </p>
        </div>
      </div>

      {step === 'search' ? (
        // Tela de busca de nutricionistas
        <div className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros de Busca
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Nome ou especialidade..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Especialidade</label>
                  <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todas">Todas</SelectItem>
                      <SelectItem value="Nutrição Clínica">Nutrição Clínica</SelectItem>
                      <SelectItem value="Nutrição Esportiva">Nutrição Esportiva</SelectItem>
                      <SelectItem value="Nutrição Infantil">Nutrição Infantil</SelectItem>
                      <SelectItem value="Nutrição Geriátrica">Nutrição Geriátrica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Estado</label>
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todas">Todos</SelectItem>
                      <SelectItem value="SP">São Paulo</SelectItem>
                      <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                      <SelectItem value="MG">Minas Gerais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Ordenar por</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">Melhor avaliado</SelectItem>
                      <SelectItem value="price_low">Menor preço</SelectItem>
                      <SelectItem value="price_high">Maior preço</SelectItem>
                      <SelectItem value="experience">Mais experiente</SelectItem>
                      <SelectItem value="name">Nome A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resultados */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {nutritionists.length} nutricionista(s) encontrado(s)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {nutritionists.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum nutricionista encontrado
                  </h3>
                  <p className="text-gray-600">
                    Tente ajustar os filtros de busca para encontrar mais resultados.
                  </p>
                </div>
              ) : (
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                      : 'space-y-4'
                  }
                >
                  {nutritionists.map(nutritionist => {
                    const formatted = formatNutritionistData(nutritionist)
                    
                    return (
                      <Card key={nutritionist.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-16 w-16">
                              <AvatarImage
                                src={nutritionist.profile_image_url || ''}
                                alt={nutritionist.full_name}
                              />
                              <AvatarFallback>
                                {nutritionist.full_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg truncate">
                                {nutritionist.full_name}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span>{nutritionist.rating.toFixed(1)}</span>
                                <span>({nutritionist.total_reviews} avaliações)</span>
                              </div>
                              {nutritionist.city && nutritionist.state && (
                                <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{nutritionist.city}, {nutritionist.state}</span>
                                </div>
                              )}
                              {nutritionist.specialties && nutritionist.specialties.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {nutritionist.specialties.slice(0, 2).map((specialty, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {specialty}
                                    </Badge>
                                  ))}
                                  {nutritionist.specialties.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{nutritionist.specialties.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 font-semibold text-green-600">
                                  <DollarSign className="h-4 w-4" />
                                  R$ {nutritionist.consultation_price.toFixed(2)}
                                </div>
                                <Button
                                  onClick={() => handleSelectNutritionist(nutritionist)}
                                  className="flex items-center gap-2"
                                >
                                  <Video className="h-4 w-4" />
                                  Agendar
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        // Tela de agendamento
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
                {selectedNutritionist && (
                  <>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={selectedNutritionist.profile_image_url || ''}
                          alt={selectedNutritionist.full_name}
                        />
                        <AvatarFallback>
                          {selectedNutritionist.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{selectedNutritionist.full_name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{selectedNutritionist.rating.toFixed(1)}</span>
                          <span>({selectedNutritionist.total_reviews} avaliações)</span>
                        </div>
                        {selectedNutritionist.city && selectedNutritionist.state && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{selectedNutritionist.city}, {selectedNutritionist.state}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedNutritionist.bio && (
                      <div>
                        <h4 className="font-medium mb-2">Sobre</h4>
                        <p className="text-sm text-gray-600">{selectedNutritionist.bio}</p>
                      </div>
                    )}

                    {selectedNutritionist.specialties && selectedNutritionist.specialties.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Especialidades</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedNutritionist.specialties.map((specialty, index) => (
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
                          R$ {selectedNutritionist.consultation_price.toFixed(2)}
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
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : Object.keys(slotsByDate).length === 0 ? (
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
                              disabled={!slot.available}
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
      )}
    </div>
  )
}