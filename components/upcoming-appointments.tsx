"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Phone,
  MoreVertical,
  CheckCircle,
  XCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Appointment {
  id: string
  patientName?: string
  nutritionistName?: string
  date: Date
  duration: number // em minutos
  type: "presencial" | "online" | "telefone"
  status: "agendado" | "confirmado" | "cancelado" | "concluido"
  location?: string
  notes?: string
  avatar?: string
}

interface UpcomingAppointmentsProps {
  userType?: "paciente" | "nutricionista" | "empresa" | "admin"
  className?: string
}

const getTypeIcon = (type: Appointment["type"]) => {
  switch (type) {
    case "online":
      return Video
    case "telefone":
      return Phone
    case "presencial":
      return MapPin
    default:
      return Calendar
  }
}

const getTypeColor = (type: Appointment["type"]) => {
  switch (type) {
    case "online":
      return "text-blue-600 bg-blue-50 border-blue-200"
    case "telefone":
      return "text-green-600 bg-green-50 border-green-200"
    case "presencial":
      return "text-purple-600 bg-purple-50 border-purple-200"
    default:
      return "text-gray-600 bg-gray-50 border-gray-200"
  }
}

const getStatusBadge = (status: Appointment["status"]) => {
  switch (status) {
    case "agendado":
      return <Badge variant="outline" className="text-yellow-700 bg-yellow-50 border-yellow-200">Agendado</Badge>
    case "confirmado":
      return <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200">Confirmado</Badge>
    case "cancelado":
      return <Badge variant="outline" className="text-red-700 bg-red-50 border-red-200">Cancelado</Badge>
    case "concluido":
      return <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200">Concluído</Badge>
    default:
      return null
  }
}

// Mock data para diferentes tipos de usuário
// Usando datas fixas para evitar diferenças entre servidor e cliente
const getFixedDate = (daysFromNow: number, hoursFromNow: number = 0) => {
  const baseDate = new Date('2024-01-15T10:00:00.000Z') // Data fixa como base
  return new Date(baseDate.getTime() + (daysFromNow * 24 * 60 * 60 * 1000) + (hoursFromNow * 60 * 60 * 1000))
}

const mockAppointments = {
  paciente: [
    {
      id: "1",
      nutritionistName: "Dra. Maria Silva",
      date: getFixedDate(1), // amanhã
      duration: 60,
      type: "online" as const,
      status: "confirmado" as const,
      notes: "Consulta de acompanhamento nutricional"
    },
    {
      id: "2",
      nutritionistName: "Dr. João Santos",
      date: getFixedDate(3), // em 3 dias
      duration: 45,
      type: "presencial" as const,
      status: "agendado" as const,
      location: "Clínica NutriVida - Sala 201",
      notes: "Primeira consulta - avaliação completa"
    },
    {
      id: "3",
      nutritionistName: "Dra. Ana Costa",
      date: getFixedDate(7), // em 1 semana
      duration: 30,
      type: "telefone" as const,
      status: "agendado" as const,
      notes: "Consulta de retorno"
    }
  ],
  nutricionista: [
    {
      id: "1",
      patientName: "Carlos Silva",
      date: getFixedDate(0, 2), // em 2 horas
      duration: 60,
      type: "online" as const,
      status: "confirmado" as const,
      notes: "Acompanhamento mensal - revisão do plano alimentar"
    },
    {
      id: "2",
      patientName: "Maria Santos",
      date: getFixedDate(1), // amanhã
      duration: 45,
      type: "presencial" as const,
      status: "agendado" as const,
      location: "Consultório - Sala 1",
      notes: "Primeira consulta - anamnese completa"
    },
    {
      id: "3",
      patientName: "Pedro Oliveira",
      date: getFixedDate(2), // em 2 dias
      duration: 30,
      type: "telefone" as const,
      status: "confirmado" as const,
      notes: "Consulta de retorno - ajustes no plano"
    }
  ],
  empresa: [],
  admin: []
}

export function UpcomingAppointments({ userType = "paciente", className }: UpcomingAppointmentsProps) {
  const appointments = mockAppointments[userType] || []

  const formatDate = (date: Date) => {
    // Usando data fixa para evitar problemas de hidratação
    const today = new Date('2024-01-15T10:00:00.000Z')
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return "Hoje"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Amanhã"
    } else {
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit',
        year: 'numeric'
      })
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit'
    })
  }

  return (
    <Card className={cn("shadow-lg border-0", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-[#1E1D40] flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Próximas Consultas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma consulta agendada</p>
              <Button variant="outline" className="mt-4" size="sm">
                {userType === "paciente" ? "Agendar Consulta" : "Ver Agenda"}
              </Button>
            </div>
          ) : (
            appointments.map((appointment) => {
              const TypeIcon = getTypeIcon(appointment.type)
              const typeColor = getTypeColor(appointment.type)
              const displayName = userType === "paciente" 
                ? appointment.nutritionistName 
                : appointment.patientName
              
              return (
                <div key={appointment.id} className="border rounded-lg p-4 hover:shadow-md transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={appointment.avatar} />
                        <AvatarFallback className="text-sm">
                          {displayName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <p className="font-medium text-[#1E1D40]">{displayName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={cn("text-xs", typeColor)}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {appointment.type === "presencial" ? "Presencial" : 
                             appointment.type === "online" ? "Online" : "Telefone"}
                          </Badge>
                          {getStatusBadge(appointment.status)}
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(appointment.date)} às {formatTime(appointment.date)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{appointment.duration} minutos</span>
                    </div>
                    
                    {appointment.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{appointment.location}</span>
                      </div>
                    )}
                    
                    {appointment.notes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                        {appointment.notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    {appointment.status === "agendado" && (
                      <>
                        <Button size="sm" variant="outline" className="flex-1">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Confirmar
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 text-red-600 hover:text-red-700">
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      </>
                    )}
                    
                    {appointment.status === "confirmado" && appointment.type === "online" && (
                      <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                        <Video className="h-4 w-4 mr-1" />
                        Entrar na Consulta
                      </Button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}