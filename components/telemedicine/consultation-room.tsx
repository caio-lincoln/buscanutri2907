"use client"

import { useState, useEffect } from "react"
// VideoCall removido - funcionalidade em desenvolvimento
import { ConsultationChat } from "./consultation-chat"
import { ConsultationNotes } from "./consultation-notes"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Video, MessageSquare, FileText, Users, Clock, Phone, AlertTriangle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { updateConsultationStatus } from "@/lib/consultation-service"
import type { Consultation } from "@/lib/consultation-service"

interface ConsultationRoomProps {
  consultationId: string
  consultation: Consultation
  userType: "paciente" | "nutricionista"
  user: any
  userProfile: any
  onLeaveRoom: () => void
}

export function ConsultationRoom({
  consultationId,
  consultation,
  userType,
  user,
  userProfile,
  onLeaveRoom,
}: ConsultationRoomProps) {
  const [activeTab, setActiveTab] = useState("chat")
  const [consultationStartTime] = useState(new Date())
  const [elapsedTime, setElapsedTime] = useState(0)

  const isPatient = userType === "paciente"
  const otherParticipant = isPatient ? consultation.nutritionist_profiles : consultation.patient_profiles

  const otherParticipantName = isPatient
    ? consultation.nutritionist_profiles?.full_name || "Nutricionista"
    : consultation.patient_profiles?.full_name || "Paciente"

  // Timer para tempo decorrido
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const elapsed = Math.floor((now.getTime() - consultationStartTime.getTime()) / 1000)
      setElapsedTime(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [consultationStartTime])

  // handleToggleChat removido - funcionalidade de vídeo em desenvolvimento

  const handleLeaveRoom = async () => {
    try {
      // Atualizar status da consulta para completed
      await updateConsultationStatus(consultationId, "completed")

      toast({
        title: "📞 Consulta finalizada",
        description: "Você saiu da consulta com sucesso",
      })

      onLeaveRoom()
    } catch (error) {
      console.error("Error ending consultation:", error)
      toast({
        title: "Erro",
        description: "Erro ao finalizar consulta",
        variant: "destructive",
      })
      onLeaveRoom()
    }
  }

  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  const formatScheduledTime = () => {
    return new Date(consultation.scheduled_time).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Video className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Consulta de Telemedicina</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>
                      {userProfile?.full_name || (isPatient ? "Paciente" : "Nutricionista")} • {otherParticipantName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Agendada: {formatScheduledTime()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Duração: {formatElapsedTime(elapsedTime)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Consulta Ativa
              </Badge>

              {/* Avatar do outro participante */}
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={
                      isPatient
                        ? consultation.nutritionist_profiles?.profile_image_url || undefined
                        : `/placeholder.svg?height=32&width=32&query=${otherParticipantName}`
                    }
                  />
                  <AvatarFallback className="text-sm bg-gradient-to-br from-gray-500 to-gray-600 text-white">
                    {otherParticipantName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-700">{otherParticipantName}</span>
              </div>

              <Button
                variant="outline"
                onClick={handleLeaveRoom}
                className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
              >
                <Phone className="h-4 w-4 mr-2" />
                Finalizar Consulta
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Call Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg border p-8 h-96 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Videochamada em Desenvolvimento</h3>
              <p className="text-gray-600 text-center mb-4">
                A funcionalidade de videochamada está sendo desenvolvida e estará disponível em breve.
              </p>
              <p className="text-sm text-gray-500 text-center">
                Por enquanto, você pode usar o chat e as notas para se comunicar durante a consulta.
              </p>
            </div>
          </div>

          {/* Side Panel */}
          <div className="lg:col-span-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="notes" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="mt-4">
                <ConsultationChat
                  consultationId={consultationId}
                  consultation={consultation}
                  userType={userType}
                  user={user}
                  userProfile={userProfile}
                  isVisible={activeTab === "chat"}
                />
              </TabsContent>

              <TabsContent value="notes" className="mt-4">
                <ConsultationNotes
                  consultationId={consultationId}
                  consultation={consultation}
                  userType={userType}
                  user={user}
                  userProfile={userProfile}
                  isVisible={activeTab === "notes"}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
