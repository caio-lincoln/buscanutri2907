"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { signOut } from "@/lib/auth"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { getMenuItems } from "@/lib/dashboard-stats"
import { useDashboardStats } from "@/hooks/use-dashboard-stats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Clock,
  MapPin,
  Star,
  Video,
  CalendarIcon,
  CheckCircle,
  Loader2,
  AlertCircle,
  Shield,
  DollarSign,
} from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CustomCalendar } from "@/components/custom-calendar"

interface NutritionistService {
  id: string
  name: string
  description: string
  price: number
  duration: number
  online_available: boolean
  in_person_available: boolean
}

interface NutritionistProfile {
  id: string
  user_id: string
  full_name: string
  bio: string
  location: string
  profile_image_url: string | null
  crn: string
  rating: number
  total_reviews: number
  specialties: string[] | string
  nutritionist_services: NutritionistService[]
}

export default function ScheduleConsultationPage() {
  const router = useRouter()
  const params = useParams()
  const nutritionistId = params.nutritionistId as string

  const [nutritionist, setNutritionist] = useState<NutritionistProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [scheduling, setScheduling] = useState(false)
  const [selectedService, setSelectedService] = useState<NutritionistService | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [consultationType, setConsultationType] = useState<"video" | "in-person">("video")
  const [notes, setNotes] = useState("")
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const { stats, loading: statsLoading } = useDashboardStats(user?.id, "patient")

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push("/login")
        return
      }
      setUser(currentUser)
    }
    loadUser()
  }, [])

  useEffect(() => {
    if (nutritionistId && nutritionistId !== "null" && nutritionistId !== "undefined") {
      loadNutritionistData()
    } else {
      console.error("Invalid nutritionist ID:", nutritionistId)
      toast({
        title: "❌ Erro",
        description: "ID do nutricionista inválido",
        variant: "destructive",
      })
      router.push("/dashboard/paciente")
    }
  }, [nutritionistId])

  useEffect(() => {
    if (selectedDate) {
      loadAvailableTimes()
    }
  }, [selectedDate, selectedService])

  const loadNutritionistData = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("nutritionist_profiles")
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
          specialties,
          nutritionist_services (*)
        `)
        .eq("id", nutritionistId)
        .single()

      if (error) {
        console.error("Error loading nutritionist:", error)
        throw error
      }

      // Normalizar specialties para sempre ser um array
      let normalizedSpecialties: string[] = []
      if (Array.isArray(data.specialties)) {
        normalizedSpecialties = data.specialties
      } else if (typeof data.specialties === "string") {
        normalizedSpecialties = data.specialties
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      }

      setNutritionist({
        ...data,
        specialties: normalizedSpecialties,
      })
    } catch (error) {
      console.error("Error loading nutritionist data:", error)
      toast({
        title: "❌ Erro",
        description: "Não foi possível carregar os dados do nutricionista",
        variant: "destructive",
      })
      router.push("/dashboard/paciente")
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableTimes = async () => {
    if (!selectedDate || !selectedService) return

    // Simular horários disponíveis (em uma implementação real, isso viria do backend)
    const baseHours = [
      "08:00",
      "08:30",
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
      "14:00",
      "14:30",
      "15:00",
      "15:30",
      "16:00",
      "16:30",
      "17:00",
      "17:30",
      "18:00",
    ]

    // Filtrar horários já ocupados (simulação baseada na data)
    const dayOfWeek = selectedDate.getDay()
    const occupiedTimes =
      dayOfWeek === 1
        ? ["09:00", "14:30"]
        : dayOfWeek === 2
          ? ["10:00", "15:00", "16:00"]
          : dayOfWeek === 3
            ? ["08:30", "11:00", "17:00"]
            : dayOfWeek === 4
              ? ["09:30", "14:00", "16:30"]
              : dayOfWeek === 5
                ? ["10:30", "15:30"]
                : []

    const available = baseHours.filter((time) => !occupiedTimes.includes(time))
    setAvailableTimes(available)
  }

  const handleSchedule = async () => {
    try {
      if (!selectedService || !selectedDate || !selectedTime) {
        toast({
          title: "❌ Campos obrigatórios",
          description: "Por favor, preencha todos os campos obrigatórios",
          variant: "destructive",
        })
        return
      }

      setScheduling(true)

      const user = await getCurrentUser()
      if (!user) {
        router.push("/login")
        return
      }

      // Criar a data/hora da consulta
      const scheduledDateTime = new Date(selectedDate)
      const timeParts = selectedTime?.split(":") || ["0", "0"]
      const [hours, minutes] = timeParts.map(Number)
      scheduledDateTime.setHours(hours, minutes, 0, 0)

      // Inserir a consulta no banco
      const { error } = await supabase
        .from("consultations")
        .insert({
          patient_id: user.id,
          nutritionist_id: nutritionist?.user_id, // Usar o user_id do nutricionista
          scheduled_time: scheduledDateTime.toISOString(),
          duration: selectedService.duration || 30, // duração em minutos
          consultation_type: consultationType,
          status: "scheduled",
          notes: notes || null,
          price: selectedService.price,
        })
        .select()
        .single()

      if (error) {
        console.error("Error scheduling consultation:", error)
        throw error
      }

      toast({
        title: "✅ Consulta agendada!",
        description: `Sua consulta foi agendada para ${selectedDate.toLocaleDateString("pt-BR")} às ${selectedTime}`,
      })

      // Redirecionar para o dashboard
      router.push("/dashboard/paciente")
    } catch (error) {
      console.error("Error scheduling consultation:", error)
      toast({
        title: "❌ Erro ao agendar",
        description: "Não foi possível agendar a consulta. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setScheduling(false)
    }
  }

  const getSpecialtiesText = () => {
    if (!nutritionist?.specialties) return "Nutrição Geral"

    const specialtiesArray = Array.isArray(nutritionist.specialties) ? nutritionist.specialties : []

    return specialtiesArray.length > 0 ? specialtiesArray.join(", ") : "Nutrição Geral"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50/50 via-white to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-200 border-t-red-500 mx-auto"></div>
          <p className="text-[#1E1D40]/70 font-medium">Carregando informações...</p>
        </div>
      </div>
    )
  }

  if (!nutritionist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50/50 via-white to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-[#1E1D40]">Nutricionista não encontrado</h2>
          <p className="text-gray-600">Não foi possível carregar as informações do profissional.</p>
          <Button onClick={() => router.push("/dashboard/paciente")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const menuItems = user ? getMenuItems("patient", stats) : []

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "❌ Erro",
        description: "Erro ao fazer logout",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50/50 via-white to-white flex">
      <DashboardSidebar
        user={user}
        userType="patient"
        menuItems={menuItems}
        onSignOut={handleSignOut}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="flex-1 lg:ml-64">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.push("/dashboard/paciente")} className="hover:bg-red-50">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-[#1E1D40]">Agendar Consulta</h1>
            <p className="text-gray-600">Escolha o serviço e horário desejado</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informações do Nutricionista */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg sticky top-8">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <Avatar className="h-24 w-24 mx-auto ring-4 ring-red-100 shadow-lg">
                    <AvatarImage src={nutritionist.profile_image_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white text-2xl font-bold">
                      {nutritionist.full_name?.charAt(0) || "N"}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <h2 className="text-xl font-bold text-[#1E1D40] mb-1">{nutritionist.full_name}</h2>
                    <p className="text-sm text-gray-600 mb-2">CRN: {nutritionist.crn}</p>

                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-semibold">{nutritionist.rating?.toFixed(1) || "5.0"}</span>
                      </div>
                      <span className="text-sm text-gray-600">({nutritionist.total_reviews || 0} avaliações)</span>
                    </div>

                    <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 mb-3">
                      <Shield className="h-3 w-3 mr-1" />
                      Verificado
                    </Badge>
                  </div>

                  {nutritionist.location && (
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{nutritionist.location}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Especialidades:</p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {getSpecialtiesText()
                        .split(", ")
                        .map((specialty, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {specialty}
                          </Badge>
                        ))}
                    </div>
                  </div>

                  {nutritionist.bio && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-600 text-left">{nutritionist.bio}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulário de Agendamento */}
          <div className="lg:col-span-2 space-y-6">
            {/* Seleção de Serviço */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  <span>Escolha o Serviço</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {nutritionist.nutritionist_services && nutritionist.nutritionist_services.length > 0 ? (
                  <div className="grid gap-4">
                    {nutritionist.nutritionist_services.map((service) => (
                      <div
                        key={service.id}
                        className={cn(
                          "p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md",
                          selectedService?.id === service.id
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 hover:border-red-300",
                        )}
                        onClick={() => setSelectedService(service)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-[#1E1D40] mb-1">{service.name}</h3>
                            <p className="text-sm text-gray-600 mb-3">{service.description}</p>

                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span>{service.duration} min</span>
                              </div>

                              <div className="flex items-center gap-2">
                                {service.online_available && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-green-50 text-green-700 border-green-200"
                                  >
                                    <Video className="h-3 w-3 mr-1" />
                                    Online
                                  </Badge>
                                )}
                                {service.in_person_available && (
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    Presencial
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-2xl font-bold text-[#1E1D40]">R$ {service.price}</p>
                            {selectedService?.id === service.id && (
                              <CheckCircle className="h-5 w-5 text-green-500 mt-2 ml-auto" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum serviço disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tipo de Consulta */}
            {selectedService && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Video className="h-4 w-4 text-white" />
                    </div>
                    <span>Tipo de Consulta</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedService.online_available && (
                      <div
                        className={cn(
                          "p-4 border-2 rounded-xl cursor-pointer transition-all duration-300",
                          consultationType === "video"
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-purple-300",
                        )}
                        onClick={() => setConsultationType("video")}
                      >
                        <div className="text-center space-y-2">
                          <Video className="h-8 w-8 text-purple-500 mx-auto" />
                          <h3 className="font-semibold text-[#1E1D40]">Consulta Online</h3>
                          <p className="text-sm text-gray-600">Via videochamada</p>
                        </div>
                      </div>
                    )}

                    {selectedService.in_person_available && (
                      <div
                        className={cn(
                          "p-4 border-2 rounded-xl cursor-pointer transition-all duration-300",
                          consultationType === "in-person"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300",
                        )}
                        onClick={() => setConsultationType("in-person")}
                      >
                        <div className="text-center space-y-2">
                          <MapPin className="h-8 w-8 text-blue-500 mx-auto" />
                          <h3 className="font-semibold text-[#1E1D40]">Consulta Presencial</h3>
                          <p className="text-sm text-gray-600">No consultório</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Seleção de Data e Horário - Calendário Customizado */}
            {selectedService && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="h-4 w-4 text-white" />
                    </div>
                    <span>Data e Horário</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Calendário Customizado */}
                    <div className="space-y-4">
                      <Label className="text-sm font-medium text-gray-700">Escolha a data:</Label>
                      <CustomCalendar
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                        disableWeekends={true} // Exemplo: desabilitar fins de semana
                      />
                    </div>

                    {/* Horários */}
                    <div className="space-y-4">
                      <Label className="text-sm font-medium text-gray-700">Horários disponíveis:</Label>
                      {selectedDate ? (
                        <div className="space-y-4">
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-sm font-medium text-blue-800">
                              {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                            </p>
                            <p className="text-xs text-blue-600">{availableTimes.length} horários disponíveis</p>
                          </div>

                          <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                            {availableTimes.map((time) => (
                              <Button
                                key={time}
                                variant={selectedTime === time ? "default" : "outline"}
                                size="sm"
                                className={cn(
                                  "h-12 flex flex-col transition-all duration-200",
                                  selectedTime === time
                                    ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg scale-105"
                                    : "hover:bg-green-50 hover:text-green-700 hover:border-green-200 hover:scale-105",
                                )}
                                onClick={() => setSelectedTime(time)}
                              >
                                <Clock className="h-3 w-3 mb-1" />
                                <span className="text-xs font-semibold">{time}</span>
                              </Button>
                            ))}
                          </div>

                          {availableTimes.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Nenhum horário disponível para esta data</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Selecione uma data primeiro</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Observações */}
            {selectedService && selectedDate && selectedTime && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-white" />
                    </div>
                    <span>Observações (Opcional)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Descreva brevemente o motivo da consulta ou informações importantes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                </CardContent>
              </Card>
            )}

            {/* Resumo e Confirmação */}
            {selectedService && selectedDate && selectedTime && (
              <Card className="border-0 shadow-lg bg-gradient-to-r from-red-50 to-red-100/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <span>Resumo da Consulta</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Profissional:</p>
                      <p className="text-[#1E1D40] font-semibold">{nutritionist.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Serviço:</p>
                      <p className="text-[#1E1D40] font-semibold">{selectedService.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Data:</p>
                      <p className="text-[#1E1D40] font-semibold">
                        {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Horário:</p>
                      <p className="text-[#1E1D40] font-semibold">{selectedTime}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Duração:</p>
                      <p className="text-[#1E1D40] font-semibold">{selectedService.duration} minutos</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Valor:</p>
                      <p className="text-[#1E1D40] font-semibold text-xl">R$ {selectedService.price}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      onClick={handleSchedule}
                      disabled={scheduling}
                      className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {scheduling ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Agendando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-5 w-5" />
                          Confirmar Agendamento
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
