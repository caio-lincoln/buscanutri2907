"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { signOut } from "@/lib/auth"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { getMenuItems } from "@/lib/dashboard-stats"
import { useDashboardStats } from "@/hooks/use-dashboard-stats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  MessageSquare,
  FileText,
  Clock,
  User,
  Calendar,
  MapPin,
  ArrowLeft,
  Settings,
  Monitor,
  Camera,
  Volume2,
  VolumeX,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getConsultationById, updateConsultationStatus, type Consultation } from "@/lib/consultation-service"
import { useAuth } from "@/hooks/use-auth"

export default function NutritionistConsultationPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const consultationId = params.id as string
  const { stats, loading: statsLoading } = useDashboardStats()

  const [consultation, setConsultation] = useState<Consultation | null>(null)
  const [loading, setLoading] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true)
  const [isInCall, setIsInCall] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (consultationId) {
      loadConsultation()
    }
  }, [consultationId])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isInCall) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isInCall])

  const loadConsultation = async () => {
    try {
      setLoading(true)
      const data = await getConsultationById(consultationId)
      setConsultation(data)
    } catch (error) {
      console.error("Erro ao carregar consulta:", error)
      toast({
        title: "Erro ao carregar consulta",
        description: "Não foi possível carregar os dados da consulta",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStartConsultation = async () => {
    try {
      await updateConsultationStatus(consultationId, "in_progress")
      setIsInCall(true)
      setCallDuration(0)
      
      toast({
        title: "Consulta iniciada",
        description: "A consulta foi iniciada com sucesso",
      })
    } catch (error) {
      console.error("Erro ao iniciar consulta:", error)
      toast({
        title: "Erro ao iniciar consulta",
        description: "Não foi possível iniciar a consulta",
        variant: "destructive",
      })
    }
  }

  const handleEndConsultation = async () => {
    try {
      await updateConsultationStatus(consultationId, "completed")
      setIsInCall(false)
      
      toast({
        title: "Consulta finalizada",
        description: "A consulta foi finalizada com sucesso",
      })
      
      // Redirecionar para o dashboard após alguns segundos
      setTimeout(() => {
        router.push("/dashboard/nutricionistas")
      }, 2000)
    } catch (error) {
      console.error("Erro ao finalizar consulta:", error)
      toast({
        title: "Erro ao finalizar consulta",
        description: "Não foi possível finalizar a consulta",
        variant: "destructive",
      })
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const canStartConsultation = () => {
    if (!consultation) return false
    
    const now = new Date()
    const consultationTime = new Date(consultation.scheduled_time)
    const timeDiff = consultationTime.getTime() - now.getTime()
    const minutesDiff = timeDiff / (1000 * 60)
    
    // Pode iniciar 15 minutos antes ou depois do horário agendado
    return minutesDiff <= 15 && minutesDiff >= -30
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando consulta...</p>
        </div>
      </div>
    )
  }

  if (!consultation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Consulta não encontrada</h2>
            <p className="text-gray-600 mb-4">A consulta solicitada não foi encontrada.</p>
            <Button onClick={() => router.push("/dashboard/nutricionistas")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const menuItems = getMenuItems(user?.user_metadata?.user_type || 'nutritionist', stats)

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      toast({
        title: "Erro ao sair",
        description: "Não foi possível fazer logout",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex">
      <DashboardSidebar
        user={user}
        menuItems={menuItems}
        onSignOut={handleSignOut}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="flex-1 lg:ml-64">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard/nutricionistas")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Consulta de Telemedicina</h1>
                <p className="text-sm text-gray-600">
                  {format(new Date(consultation.scheduled_time), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
            
            {isInCall && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(callDuration)}</span>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Em andamento
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Area */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <CardContent className="p-0 h-full">
                <div className="relative h-full bg-gray-900 rounded-lg overflow-hidden">
                  {/* Video placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isVideoEnabled ? (
                      <div className="text-center text-white">
                        <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Câmera ativada</p>
                        <p className="text-sm opacity-75">Aguardando conexão...</p>
                      </div>
                    ) : (
                      <div className="text-center text-white">
                        <VideoOff className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Câmera desativada</p>
                      </div>
                    )}
                  </div>

                  {/* Patient video (small window) */}
                  {isInCall && (
                    <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg border-2 border-white shadow-lg">
                      <div className="h-full flex items-center justify-center text-white">
                        <div className="text-center">
                          <User className="h-8 w-8 mx-auto mb-2 opacity-75" />
                          <p className="text-xs">{consultation.patient_profiles?.full_name}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Controls */}
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                    <div className="flex items-center gap-4 bg-black/50 backdrop-blur-sm rounded-full px-6 py-3">
                      <Button
                        size="sm"
                        variant={isAudioEnabled ? "secondary" : "destructive"}
                        className="rounded-full w-12 h-12 p-0"
                        onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                      >
                        {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant={isVideoEnabled ? "secondary" : "destructive"}
                        className="rounded-full w-12 h-12 p-0"
                        onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                      >
                        {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant={isSpeakerEnabled ? "secondary" : "destructive"}
                        className="rounded-full w-12 h-12 p-0"
                        onClick={() => setIsSpeakerEnabled(!isSpeakerEnabled)}
                      >
                        {isSpeakerEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full w-12 h-12 p-0"
                        onClick={() => setShowSettings(!showSettings)}
                      >
                        <Settings className="h-5 w-5" />
                      </Button>
                      
                      {isInCall ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="rounded-full w-12 h-12 p-0"
                          onClick={handleEndConsultation}
                        >
                          <Phone className="h-5 w-5" />
                        </Button>
                      ) : (
                        canStartConsultation() && (
                          <Button
                            size="sm"
                            className="rounded-full w-12 h-12 p-0 bg-green-600 hover:bg-green-700"
                            onClick={handleStartConsultation}
                          >
                            <Video className="h-5 w-5" />
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Patient Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações do Paciente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={consultation.patient_profiles?.profile_image_url} />
                    <AvatarFallback>
                      {consultation.patient_profiles?.full_name?.charAt(0) || "P"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{consultation.patient_profiles?.full_name}</h3>
                    <p className="text-sm text-gray-600">Paciente</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{format(new Date(consultation.scheduled_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{consultation.duration || 45} minutos</span>
                  </div>
                  
                  {consultation.consultation_type === "online" && (
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-gray-500" />
                      <span>Consulta Online</span>
                    </div>
                  )}
                  
                  {consultation.consultation_type === "presential" && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>Consulta Presencial</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Consultation Notes */}
            {consultation.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Observações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{consultation.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Adicionar Anotações
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Enviar Mensagem
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Retorno
                </Button>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  {!isInCall && canStartConsultation() && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                        <Video className="h-5 w-5" />
                        <span className="font-medium">Pronto para iniciar</span>
                      </div>
                      <Button
                        onClick={handleStartConsultation}
                        size="lg"
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-8"
                      >
                        <Video className="h-5 w-5 mr-2" />
                        Iniciar Consulta
                      </Button>
                      <p className="text-sm text-gray-600">
                        Você pode iniciar a consulta. O paciente será notificado quando você entrar.
                      </p>
                    </div>
                  )}
                  
                  {!isInCall && !canStartConsultation() && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2 text-orange-600 mb-4">
                        <Clock className="h-5 w-5" />
                        <span className="font-medium">Aguardando horário da consulta</span>
                      </div>
                      <p className="text-gray-600 mb-4">A consulta estará disponível 15 minutos antes do horário agendado.</p>
                      <Button variant="outline" onClick={() => router.push("/dashboard/nutricionistas")}>
                        Voltar ao Dashboard
                      </Button>
                    </div>
                  )}
                  
                  {isInCall && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="font-medium">Consulta em andamento</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Duração: {formatDuration(callDuration)}
                      </p>
                      <Button
                        onClick={handleEndConsultation}
                        variant="destructive"
                        size="lg"
                        className="px-8"
                      >
                        <Phone className="h-5 w-5 mr-2" />
                        Finalizar Consulta
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}