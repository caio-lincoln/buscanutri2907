"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { Clock, Video, Phone, MapPin, Star, Shield, CheckCircle, ArrowLeft, CreditCard, Award, AlertTriangle } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { Navbar } from "@/components/navbar"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Nutritionist {
  id: string
  name: string
  crn: string
  specialties: string[]
  rating: number
  reviews: number
  price: number
  avatar: string
  city: string
  state: string
  availableSlots: string[]
  badges?: { name: string; icon?: string }[]
}

export default function ScheduleConsultationPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [selectedNutritionist, setSelectedNutritionist] = useState<Nutritionist | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState("")
  const [consultationType, setConsultationType] = useState<"video" | "audio">("video")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const router = useRouter()

  // Mock nutritionists data
  const nutritionists: Nutritionist[] = [
    {
      id: "1",
      name: "Dra. Ana Costa",
      crn: "CRN3 12345",
      specialties: ["Nutrição Clínica", "Emagrecimento"],
      rating: 4.9,
      reviews: 127,
      price: 150,
      avatar: "/placeholder.svg?height=64&width=64",
      city: "São Paulo",
      state: "SP",
      availableSlots: ["09:00", "10:30", "14:00", "15:30", "16:00"],
      badges: [
        { name: "Especialista em Diabetes" },
        { name: "Nutrição Funcional" },
        { name: "Pós-graduada USP" }
      ],
    },
    {
      id: "2",
      name: "Dr. Carlos Silva",
      crn: "CRN3 67890",
      specialties: ["Nutrição Esportiva", "Suplementação"],
      rating: 4.8,
      reviews: 89,
      price: 180,
      avatar: "/placeholder.svg?height=64&width=64",
      city: "Rio de Janeiro",
      state: "RJ",
      availableSlots: ["08:00", "09:30", "11:00", "13:30", "17:00"],
      badges: [
        { name: "Nutrição Esportiva" },
        { name: "Atletas de Alto Rendimento" }
      ],
    },
  ]

  const loadUserData = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push("/login")
        return
      }
      setUser(currentUser)
    } catch (error) {
      console.error("Error loading user:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadUserData()
  }, [loadUserData])

  const handleSelectNutritionist = (nutritionist: Nutritionist) => {
    setSelectedNutritionist(nutritionist)
    setStep(2)
  }

  const handleScheduleConsultation = async () => {
    if (!selectedNutritionist || !selectedDate || !selectedTime) return

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // In real app, would make API call to schedule consultation
    console.log("Scheduling consultation:", {
      nutritionistId: selectedNutritionist.id,
      date: selectedDate,
      time: selectedTime,
      type: consultationType,
      notes,
    })

    setStep(4) // Success step
    setIsSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-500 mx-auto"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => (step > 1 ? setStep(step - 1) : router.push("/telemedicina"))}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">Agendar Consulta de Telemedicina</h1>
          <p className="text-gray-600">
            {step === 1 && "Escolha um nutricionista para sua consulta online"}
            {step === 2 && "Selecione data e horário para sua consulta"}
            {step === 3 && "Confirme os detalhes da sua consulta"}
            {step === 4 && "Consulta agendada com sucesso!"}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                    step >= stepNumber ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600",
                  )}
                >
                  {step > stepNumber ? <CheckCircle className="h-4 w-4" /> : stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div className={cn("w-16 h-1 mx-2", step > stepNumber ? "bg-blue-500" : "bg-gray-200")} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Select Nutritionist */}
        {step === 1 && (
          <div className="space-y-6">
            {nutritionists.map((nutritionist) => (
              <Card
                key={nutritionist.id}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => handleSelectNutritionist(nutritionist)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 ring-2 ring-gray-200 shadow-lg">
                      <AvatarImage src={nutritionist.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xl font-bold">
                        {nutritionist.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-[#1E1D40] text-lg">{nutritionist.name}</h3>
                          <p className="text-sm text-gray-600">{nutritionist.crn}</p>
                        </div>
                        <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-sm">
                          <Shield className="h-3 w-3 mr-1" />
                          Verificado
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-semibold">{nutritionist.rating}</span>
                          <span className="text-sm text-gray-600">({nutritionist.reviews} avaliações)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {nutritionist.city}, {nutritionist.state}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {nutritionist.specialties.map((specialty, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {specialty}
                            </Badge>
                          ))}
                        </div>

                        {/* Author Badges */}
                        {nutritionist.badges && nutritionist.badges.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-600">Especialista:</span>
                            <div className="flex items-center gap-1">
                              {nutritionist.badges.slice(0, 2).map((badge, index) => (
                                <div key={index} className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full text-xs">
                                  {badge.icon ? (
                                    <img src={badge.icon} alt={badge.name} className="w-3 h-3" />
                                  ) : (
                                    <Award className="w-3 h-3" />
                                  )}
                                  <span>{badge.name}</span>
                                </div>
                              ))}
                              {nutritionist.badges.length > 2 && (
                                <span className="text-xs text-gray-500">+{nutritionist.badges.length - 2}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <p className="text-sm text-gray-600">Consulta online</p>
                          <p className="font-bold text-[#1E1D40] text-xl">R$ {nutritionist.price}</p>
                        </div>
                        <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                          Selecionar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Step 2: Select Date and Time */}
        {step === 2 && selectedNutritionist && (
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedNutritionist.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {selectedNutritionist.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span>{selectedNutritionist.name}</span>
                    <p className="text-sm text-gray-600 font-normal">R$ {selectedNutritionist.price} - 45 minutos</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Calendar */}
                  <div>
                    <Label className="text-base font-semibold mb-4 block">Selecione a Data</Label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date() || date.getDay() === 0}
                      className="rounded-md border shadow-sm"
                      locale={ptBR}
                    />
                  </div>

                  {/* Time Slots */}
                  <div>
                    <Label className="text-base font-semibold mb-4 block">Horários Disponíveis</Label>
                    {selectedDate ? (
                      <div className="grid grid-cols-2 gap-3">
                        {selectedNutritionist.availableSlots.map((time) => (
                          <Button
                            key={time}
                            variant={selectedTime === time ? "default" : "outline"}
                            onClick={() => setSelectedTime(time)}
                            className="h-12"
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            {time}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        Selecione uma data para ver os horários disponíveis
                      </p>
                    )}
                  </div>
                </div>

                {/* Consultation Type */}
                <div>
                  <Label className="text-base font-semibold mb-4 block">Tipo de Consulta</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Funcionalidade em Desenvolvimento",
                          description: "A videochamada está sendo desenvolvida. Use o chat e notas por enquanto.",
                          variant: "default"
                        })
                      }}
                      className="h-16 flex-col bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                    >
                      <AlertTriangle className="h-6 w-6 mb-2" />
                      <span>Videochamada (Em Desenvolvimento)</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Funcionalidade em Desenvolvimento",
                          description: "A chamada de áudio está sendo desenvolvida. Use o chat e notas por enquanto.",
                          variant: "default"
                        })
                      }}
                      className="h-16 flex-col bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                    >
                      <AlertTriangle className="h-6 w-6 mb-2" />
                      <span>Apenas Áudio (Em Desenvolvimento)</span>
                    </Button>
                  </div>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-blue-800">Funcionalidades Disponíveis:</p>
                        <p className="text-sm text-blue-700 mt-1">
                          • Chat em tempo real durante a consulta<br/>
                          • Sistema de notas compartilhadas<br/>
                          • Histórico completo da consulta
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes" className="text-base font-semibold mb-2 block">
                    Observações (Opcional)
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Descreva brevemente o motivo da consulta ou informações importantes..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!selectedDate || !selectedTime}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    Continuar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && selectedNutritionist && selectedDate && (
          <div className="max-w-2xl mx-auto">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Confirmar Agendamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Consultation Summary */}
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-900 mb-4">Resumo da Consulta</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Nutricionista:</span>
                      <span className="font-medium">{selectedNutritionist.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Data:</span>
                      <span className="font-medium">
                        {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Horário:</span>
                      <span className="font-medium">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Tipo:</span>
                      <span className="font-medium">
                        {consultationType === "video" ? "Videochamada" : "Apenas Áudio"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Duração:</span>
                      <span className="font-medium">45 minutos</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-blue-700">Total:</span>
                      <span>R$ {selectedNutritionist.price}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <Label className="text-base font-semibold mb-4 block">Forma de Pagamento</Label>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-gray-600" />
                      <span>Cartão de Crédito •••• 1234</span>
                      <Badge variant="outline">Padrão</Badge>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" />
                    <div className="text-sm text-gray-700">
                      <p>
                        Ao confirmar, você concorda com nossos{" "}
                        <a href="/termos" className="text-blue-600 hover:underline">
                          Termos de Uso
                        </a>{" "}
                        e{" "}
                        <a href="/privacidade" className="text-blue-600 hover:underline">
                          Política de Privacidade
                        </a>
                        . O pagamento será processado no momento da consulta.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    Voltar
                  </Button>
                  <Button
                    onClick={handleScheduleConsultation}
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    {isSubmitting ? "Agendando..." : "Confirmar Agendamento"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && selectedNutritionist && selectedDate && (
          <div className="max-w-2xl mx-auto text-center">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>

                <h2 className="text-2xl font-bold text-[#1E1D40] mb-4">Consulta Agendada com Sucesso!</h2>

                <p className="text-gray-600 mb-8">
                  Sua consulta com {selectedNutritionist.name} foi agendada para{" "}
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })} às {selectedTime}.
                </p>

                <div className="bg-blue-50 rounded-lg p-6 mb-8">
                  <h3 className="font-semibold text-blue-900 mb-4">Próximos Passos</h3>
                  <div className="space-y-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        1
                      </div>
                      <span className="text-blue-800">Você receberá um e-mail de confirmação</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        2
                      </div>
                      <span className="text-blue-800">15 minutos antes, você receberá o link da consulta</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        3
                      </div>
                      <span className="text-blue-800">Teste sua câmera e microfone antes da consulta</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => router.push("/telemedicina")} className="flex-1">
                    Ver Minhas Consultas
                  </Button>
                  <Button
                    onClick={() => router.push("/")}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    Voltar ao Início
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
