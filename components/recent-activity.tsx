"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Calendar, 
  MessageCircle, 
  Heart, 
  UserPlus, 
  FileText, 
  CheckCircle,
  Clock,
  Star
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Activity {
  id: string
  type: "consulta" | "mensagem" | "favorito" | "cadastro" | "avaliacao" | "documento"
  title: string
  description: string
  timestamp: Date
  user?: {
    name: string
    avatar?: string
    type: "paciente" | "nutricionista" | "empresa"
  }
  status?: "pendente" | "concluido" | "cancelado"
}

interface RecentActivityProps {
  userType?: "paciente" | "nutricionista" | "empresa" | "admin"
  className?: string
}

const getActivityIcon = (type: Activity["type"]) => {
  switch (type) {
    case "consulta":
      return Calendar
    case "mensagem":
      return MessageCircle
    case "favorito":
      return Heart
    case "cadastro":
      return UserPlus
    case "avaliacao":
      return Star
    case "documento":
      return FileText
    default:
      return CheckCircle
  }
}

const getActivityColor = (type: Activity["type"]) => {
  switch (type) {
    case "consulta":
      return "text-blue-600 bg-blue-50"
    case "mensagem":
      return "text-purple-600 bg-purple-50"
    case "favorito":
      return "text-red-600 bg-red-50"
    case "cadastro":
      return "text-green-600 bg-green-50"
    case "avaliacao":
      return "text-yellow-600 bg-yellow-50"
    case "documento":
      return "text-gray-600 bg-gray-50"
    default:
      return "text-gray-600 bg-gray-50"
  }
}

const getStatusBadge = (status?: Activity["status"]) => {
  if (!status) return null
  
  switch (status) {
    case "pendente":
      return <Badge variant="outline" className="text-yellow-700 bg-yellow-50 border-yellow-200">Pendente</Badge>
    case "concluido":
      return <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200">Concluído</Badge>
    case "cancelado":
      return <Badge variant="outline" className="text-red-700 bg-red-50 border-red-200">Cancelado</Badge>
    default:
      return null
  }
}

// Usando datas fixas para evitar diferenças entre servidor e cliente
const getFixedTimestamp = (hoursAgo: number) => {
  const baseDate = new Date('2024-01-15T14:00:00.000Z') // Data fixa como base
  return new Date(baseDate.getTime() - (hoursAgo * 60 * 60 * 1000))
}

// Mock data para diferentes tipos de usuário
const mockActivities = {
  paciente: [
    {
      id: "1",
      type: "consulta" as const,
      title: "Consulta agendada",
      description: "Consulta com Dra. Maria Silva agendada para amanhã às 14h",
      timestamp: getFixedTimestamp(2), // 2 horas atrás
      user: {
        name: "Dra. Maria Silva",
        type: "nutricionista" as const
      },
      status: "pendente" as const
    },
    {
      id: "2",
      type: "mensagem" as const,
      title: "Nova mensagem",
      description: "Você recebeu uma mensagem da IrisBot sobre dicas de alimentação",
      timestamp: getFixedTimestamp(4), // 4 horas atrás
      status: "concluido" as const
    },
    {
      id: "3",
      type: "favorito" as const,
      title: "Nutricionista favoritado",
      description: "Você adicionou Dr. João Santos aos seus favoritos",
      timestamp: getFixedTimestamp(24), // 1 dia atrás
      user: {
        name: "Dr. João Santos",
        type: "nutricionista" as const
      }
    }
  ],
  nutricionista: [
    {
      id: "1",
      type: "consulta" as const,
      title: "Nova consulta agendada",
      description: "Paciente Ana Costa agendou consulta para hoje às 16h",
      timestamp: getFixedTimestamp(1), // 1 hora atrás
      user: {
        name: "Ana Costa",
        type: "paciente" as const
      },
      status: "pendente" as const
    },
    {
      id: "2",
      type: "avaliacao" as const,
      title: "Nova avaliação recebida",
      description: "Paciente Carlos Silva deixou uma avaliação de 5 estrelas",
      timestamp: getFixedTimestamp(3), // 3 horas atrás
      user: {
        name: "Carlos Silva",
        type: "paciente" as const
      }
    },
    {
      id: "3",
      type: "documento" as const,
      title: "Plano alimentar enviado",
      description: "Plano alimentar personalizado enviado para Maria Santos",
      timestamp: getFixedTimestamp(6), // 6 horas atrás
      user: {
        name: "Maria Santos",
        type: "paciente" as const
      },
      status: "concluido" as const
    }
  ],
  empresa: [
    {
      id: "1",
      type: "cadastro" as const,
      title: "Novo nutricionista cadastrado",
      description: "Dr. Pedro Oliveira se cadastrou na plataforma",
      timestamp: getFixedTimestamp(2), // 2 horas atrás
      user: {
        name: "Dr. Pedro Oliveira",
        type: "nutricionista" as const
      }
    },
    {
      id: "2",
      type: "mensagem" as const,
      title: "Proposta de trabalho enviada",
      description: "Proposta enviada para Dra. Fernanda Lima",
      timestamp: getFixedTimestamp(5), // 5 horas atrás
      user: {
        name: "Dra. Fernanda Lima",
        type: "nutricionista" as const
      },
      status: "pendente" as const
    }
  ],
  admin: [
    {
      id: "1",
      type: "cadastro" as const,
      title: "Nova empresa cadastrada",
      description: "Empresa TechHealth se cadastrou na plataforma",
      timestamp: getFixedTimestamp(1), // 1 hora atrás
      user: {
        name: "TechHealth",
        type: "empresa" as const
      }
    },
    {
      id: "2",
      type: "documento" as const,
      title: "Relatório mensal gerado",
      description: "Relatório de atividades de dezembro foi gerado",
      timestamp: getFixedTimestamp(3), // 3 horas atrás
      status: "concluido" as const
    }
  ]
}

export function RecentActivity({ userType = "paciente", className }: RecentActivityProps) {
  const activities = mockActivities[userType] || mockActivities.paciente

  const formatTimeAgo = (timestamp: Date) => {
    // Usando data fixa para evitar problemas de hidratação
    const now = new Date('2024-01-15T14:00:00.000Z')
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}min atrás`
    } else if (diffInMinutes < 1440) { // 24 horas
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours}h atrás`
    } else {
      const days = Math.floor(diffInMinutes / 1440)
      return `${days}d atrás`
    }
  }

  return (
    <Card className={cn("shadow-lg border-0", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-[#1E1D40] flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma atividade recente</p>
            </div>
          ) : (
            activities.map((activity) => {
              const Icon = getActivityIcon(activity.type)
              const colorClass = getActivityColor(activity.type)
              
              return (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", colorClass)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-[#1E1D40] mb-1">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-600 mb-2">
                          {activity.description}
                        </p>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(activity.timestamp)}
                          </span>
                          {getStatusBadge(activity.status)}
                        </div>
                      </div>
                      
                      {activity.user && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={activity.user.avatar} />
                          <AvatarFallback className="text-xs">
                            {activity.user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
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