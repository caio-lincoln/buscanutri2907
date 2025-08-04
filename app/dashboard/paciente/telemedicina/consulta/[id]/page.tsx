"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ConsultationRoom } from "@/components/telemedicine/consultation-room"
import { getCurrentUser, getUserProfile, signOut } from "@/lib/auth"
import { getConsultationById, canStartConsultation, updateConsultationStatus } from "@/lib/consultation-service"
import type { Consultation } from "@/lib/consultation-service"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { getMenuItems } from "@/components/dashboard-sidebar"
import { useDashboardStats } from "@/hooks/use-dashboard-stats"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, Video, User, Calendar, AlertCircle, CheckCircle } from "lucide-react"

export default function PatientConsultationPage() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [consultation, setConsultation] = useState<Consultation | null>(null)
  const [loading, setLoading] = useState(true)
  const [canStart, setCanStart] = useState(false)
  const [inRoom, setInRoom] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const consultationId = params.id as string

  // Dashboard stats
  const { stats, loading: statsLoading } = useDashboardStats({
    userType: "paciente",
    userId: user?.id || "",
    enabled: !!user?.id
  })
  const menuItems = getMenuItems("paciente", stats)

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  useEffect(() => {
    loadConsultationData()
  }, [consultationId])

  const loadConsultationData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Verificar usuário atual
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push("/login")
        return
      }

      setUser(currentUser)

      // Buscar perfil do usuário
      const { data: profile } = await getUserProfile(currentUser.id, "paciente")
      setUserProfile(profile)

      // Buscar dados da consulta
      const consultationData = await getConsultationById(consultationId)
      if (!consultationData) {
        setError("Consulta não encontrada")
        return
      }

      // Verificar se o usuário tem permissão para acessar esta consulta (deve ser o paciente)
      if (consultationData.patient_id !== currentUser.id) {
        setError("Você não tem permissão para acessar esta consulta")
        return
      }

      setConsultation(consultationData)

      // Verificar se pode iniciar a consulta
      const canStartNow = await canStartConsultation(consultationId)
      setCanStart(canStartNow)
    } catch (error) {
      console.error("Error loading consultation:", error)
      setError("Erro ao carregar dados da consulta")
    } finally {
      setLoading(false)
    }
  }

  const handleStartConsultation = async () => {
    if (!consultation || !user) return

    try {
      // Atualizar status da consulta para "in-progress"
      await updateConsultationStatus(consultationId, "in-progress")
      setInRoom(true)
    } catch (error) {
      console.error("Error starting consultation:", error)
      setError("Erro ao iniciar consulta")
    }
  }

  const handleLeaveRoom = async () => {
    try {
      // Atualizar status da consulta para "completed" se ambos saírem
      // Por enquanto, apenas sair da sala
      setInRoom(false)
      router.push("/dashboard/paciente/telemedicina")
    } catch (error) {
      console.error("Error leaving room:", error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTimeUntilConsultation = () => {
    if (!consultation) return ""

    const scheduledTime = new Date(consultation.scheduled_time)
    const now = new Date()
    const timeDiff = scheduledTime.getTime() - now.getTime()
    const minutesDiff = Math.floor(timeDiff / (1000 * 60))

    if (minutesDiff > 0) {
      if (minutesDiff > 60) {
        const hours = Math.floor(minutesDiff / 60)
        const minutes = minutesDiff % 60
        return `${hours}h ${minutes}min`
      }
      return `${minutesDiff} minutos`
    } else if (minutesDiff > -60) {
      return "Agora"
    } else {
      return "Atrasada"
    }
  }

  // Garantir que specialtiesList exista no escopo de render
  const specialtiesList = consultation?.nutritionist_profiles?.specialties
    ? Array.isArray(consultation.nutritionist_profiles.specialties)
      ? consultation.nutritionist_profiles.specialties
      : typeof consultation.nutritionist_profiles.specialties === "string"
        ? consultation.nutritionist_profiles.specialties
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : []
    : []

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-500 mx-auto"></div>
          <p className="text-gray-600">Carregando consulta...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push("/dashboard/paciente/telemedicina")} variant="outline">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!consultation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Consulta não encontrada</h2>
            <p className="text-gray-600 mb-4">A consulta solicitada não foi encontrada.</p>
            <Button onClick={() => router.push("/dashboard/paciente/telemedicina")} variant="outline">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Se já está na sala de consulta
  if (inRoom) {
    return (
      <ConsultationRoom
        consultationId={consultationId}
        consultation={consultation}
        userType="paciente"
        user={user}
        userProfile={userProfile}
        onLeaveRoom={handleLeaveRoom}
      />
    )
  }

  // Tela de espera/preparação
  return (
    <DashboardSidebar
      userType="paciente"
      userName={userProfile?.full_name || "Paciente"}
      menuItems={menuItems}
      activeItem="telemedicina"
      onItemClick={(item) => router.push(item.href)}
      onSignOut={handleSignOut}
    >
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Consulta de Telemedicina</h1>
          <p className="text-gray-600">Prepare-se para sua consulta online</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informações da Consulta */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Detalhes da Consulta</h2>
                  <p className="text-sm text-gray-600">Informações do agendamento</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Data e Hora</span>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatDate(consultation.scheduled_time)}</p>
                    <p className="text-sm text-gray-600">Em {getTimeUntilConsultation()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Duração</span>
                  <span className="font-semibold text-gray-900">{consultation.duration} minutos</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Tipo</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Video className="h-3 w-3 mr-1" />
                    {consultation.consultation_type === "video" ? "Videochamada" : "Áudio"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Status</span>
                  <Badge
                    variant="outline"
                    className={
                      consultation.status === "scheduled"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : consultation.status === "in-progress"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-50 text-gray-700 border-gray-200"
                    }
                  >
                    {consultation.status === "scheduled" && "Agendada"}
                    {consultation.status === "in-progress" && "Em andamento"}
                    {consultation.status === "completed" && "Concluída"}
                    {consultation.status === "cancelled" && "Cancelada"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Nutricionista */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Seu Nutricionista</h2>
                  <p className="text-sm text-gray-600">Informações do profissional</p>
                </div>
              </div>

              <div className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-4">
                  <AvatarImage src={consultation.nutritionist_profiles?.profile_image_url || undefined} />
                  <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    {consultation.nutritionist_profiles?.full_name?.charAt(0) || "N"}
                  </AvatarFallback>
                </Avatar>

                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {consultation.nutritionist_profiles?.full_name || "Nutricionista"}
                </h3>

                {consultation.nutritionist_profiles && (
                  <>
                    <p className="text-sm text-gray-600 mb-2">CRN: {consultation.nutritionist_profiles.crn}</p>
                    {specialtiesList.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-center mb-4">
                        {specialtiesList.slice(0, 2).map((specialty, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                      <span>⭐</span>
                      <span>{consultation.nutritionist_profiles.rating || "5.0"}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações */}
        <div className="mt-8 text-center">
          {canStart ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Consulta disponível para iniciar</span>
              </div>
              <Button
                onClick={handleStartConsultation}
                size="lg"
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-8"
              >
                <Video className="h-5 w-5 mr-2" />
                Entrar na Consulta
              </Button>
              <p className="text-sm text-gray-600">
                Você pode entrar na consulta. O nutricionista será notificado quando você entrar.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-orange-600 mb-4">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Aguardando horário da consulta</span>
              </div>
              <p className="text-gray-600 mb-4">A consulta estará disponível 15 minutos antes do horário agendado.</p>
              <Button variant="outline" onClick={() => router.push("/dashboard/paciente/telemedicina")}>
                Voltar para Telemedicina
              </Button>
            </div>
          )}
        </div>
        </div>
      </div>
    </DashboardSidebar>
  )
}
