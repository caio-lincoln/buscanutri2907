"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Video,
  Calendar,
  Clock,
  Users,
  Plus,
  Play,
  MessageSquare,
  FileText,
  CheckCircle,
  XCircle,
  FastForward,
  AlertTriangle,
  TestTube,
  Zap,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  getNutritionistConsultations,
  getNutritionistStats,
  type Consultation,
  type NutritionistStats,
} from "@/lib/consultation-service"

interface NutritionistTelemedicineTabProps {
  userId: string
  onScheduleNewConsultation: () => void // Para redirecionar para o agendamento
}

export function NutritionistTelemedicineTab({ userId, onScheduleNewConsultation }: NutritionistTelemedicineTabProps) {
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [stats, setStats] = useState<NutritionistStats>({
    totalConsultations: 0,
    scheduledConsultations: 0,
    completedConsultations: 0,
    totalPatients: 0,
    averageRating: 0,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "scheduled" | "completed" | "in-progress">("all")
  const [loading, setLoading] = useState(true)
  const [advancingConsultation, setAdvancingConsultation] = useState<string | null>(null)
  const router = useRouter()

  // Verificar se está em modo de desenvolvimento
  const isDevelopment =
    process.env.NODE_ENV === "development" ||
    (typeof window !== "undefined" && window.location.hostname === "localhost")

  useEffect(() => {
    if (userId) {
      loadTelemedicineData(userId)
    }
  }, [userId])

  const loadTelemedicineData = async (currentUserId: string) => {
    try {
      setLoading(true)
      const [consultationsData, statsData] = await Promise.all([
        getNutritionistConsultations(currentUserId),
        getNutritionistStats(currentUserId),
      ])

      setConsultations(consultationsData)
      setStats(statsData)
    } catch (err) {
      console.error("❌ Erro ao carregar dados da telemedicina para nutricionista:", err)
      toast({
        title: "Erro ao carregar telemedicina",
        description: "Não foi possível carregar suas consultas de telemedicina",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAdvanceConsultation = async (consultationId: string) => {
    try {
      setAdvancingConsultation(consultationId)

      // Atualizar o horário da consulta para agora
      const now = new Date()
      const { error } = await supabase
        .from("consultations")
        .update({
          scheduled_time: now.toISOString(),
          status: "scheduled", // Manter como agendada, mas com horário atual
        })
        .eq("id", consultationId)

      if (error) throw error

      toast({
        title: "✅ Consulta adiantada!",
        description: "A consulta foi reagendada para agora. Você já pode entrar na sala.",
      })

      // Recarregar as consultas para mostrar a mudança
      await loadTelemedicineData(userId)
    } catch (error) {
      console.error("❌ Erro ao adiantar consulta:", error)
      toast({
        title: "Erro ao adiantar consulta",
        description: "Não foi possível adiantar a consulta. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setAdvancingConsultation(null)
    }
  }

  const filteredConsultations = consultations.filter((consultation) => {
    const matchesSearch =
      (consultation.patient_profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        consultation.nutritionist_profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        consultation.service_name?.toLowerCase().includes(searchTerm.toLowerCase())) ??
      false

    const matchesFilter = filterStatus === "all" || consultation.status === filterStatus

    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: Consultation["status"]) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "in-progress":
        return "bg-green-50 text-green-700 border-green-200"
      case "completed":
        return "bg-gray-50 text-gray-700 border-gray-200"
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const getStatusIcon = (status: Consultation["status"]) => {
    switch (status) {
      case "scheduled":
        return <Clock className="h-3 w-3 mr-1" />
      case "in-progress":
        return <Play className="h-3 w-3 mr-1" />
      case "completed":
        return <CheckCircle className="h-3 w-3 mr-1" />
      case "cancelled":
        return <XCircle className="h-3 w-3 mr-1" />
      default:
        return <Clock className="h-3 w-3 mr-1" />
    }
  }

  const getStatusText = (status: Consultation["status"]) => {
    switch (status) {
      case "scheduled":
        return "Agendada"
      case "in-progress":
        return "Em andamento"
      case "completed":
        return "Concluída"
      case "cancelled":
        return "Cancelada"
      default:
        return "Desconhecido"
    }
  }

  const handleJoinConsultation = async (consultationId: string) => {
    try {
      // Verificar se a consulta pode ser iniciada (horário próximo)
      const consultation = consultations.find((c) => c.id === consultationId)
      if (!consultation) return

      const scheduledTime = new Date(consultation.scheduled_time)
      const now = new Date()
      const timeDiff = scheduledTime.getTime() - now.getTime()
      const minutesDiff = Math.floor(timeDiff / (1000 * 60))

      // Permitir entrar 15 minutos antes ou depois do horário agendado
      if (minutesDiff > 15) {
        toast({
          title: "Consulta ainda não disponível",
          description: `A consulta só estará disponível 15 minutos antes do horário agendado (${scheduledTime.toLocaleTimeString()})`,
          variant: "destructive",
        })
        return
      }

      if (minutesDiff < -60) {
        toast({
          title: "Consulta expirada",
          description: "Esta consulta já passou do horário permitido",
          variant: "destructive",
        })
        return
      }

      // Atualizar status para "in-progress" se necessário
      if (consultation.status === "scheduled") {
        const { error } = await supabase
          .from("consultations")
          .update({ status: "in-progress" })
          .eq("id", consultationId)

        if (error) {
          console.error("❌ Erro ao atualizar status da consulta:", error)
        }
      }

      console.log("🎥 Entrando na consulta:", consultationId)
      router.push(`/dashboard/nutricionistas/telemedicina/consulta/${consultationId}`) // Redirecionar para a sala de consulta do nutricionista
    } catch (error) {
      console.error("❌ Erro ao entrar na consulta:", error)
      toast({
        title: "Erro ao entrar na consulta",
        description: "Não foi possível acessar a consulta",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-500 mx-auto"></div>
          <p className="text-gray-600">Carregando telemedicina...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">Telemedicina</h1>
              <p className="text-gray-600">Suas consultas nutricionais online</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Botão de Teste - Apenas em desenvolvimento */}
              {isDevelopment && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-purple-200 text-purple-600 hover:bg-purple-50 bg-transparent shadow-lg"
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Teste Rápido
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-purple-500" />
                        Teste do Sistema de Telemedicina
                      </DialogTitle>
                      <DialogDescription>
                        Este botão criará uma consulta de teste que iniciará em 30 segundos e abrirá automaticamente a
                        sala de telemedicina para você testar todas as funcionalidades.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="bg-purple-50 rounded-lg p-4 my-4">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-purple-800">O que acontecerá:</p>
                          <ul className="text-sm text-purple-700 mt-2 space-y-1">
                            <li>• Uma consulta de teste será criada</li>
                            <li>• Horário: 30 segundos no futuro</li>
                            <li>• Duração: 30 minutos</li>
                            <li>• Tipo: Videochamada</li>
                            <li>• Redirecionamento automático</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 my-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Aviso:</p>
                          <p className="text-sm text-yellow-700">
                            Esta é uma funcionalidade apenas para desenvolvimento e testes. Não use em produção.
                          </p>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        // onClick={createTestConsultation} // This would need to be implemented for nutritionist side
                        disabled={true} // Disable for now as it's patient-specific
                        className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                      >
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Iniciar Teste (Nutri)
                        </>
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              <Button
                onClick={onScheduleNewConsultation}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agendar Nova Consulta
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Consultas Agendadas</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.scheduledConsultations}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Em Andamento</p>
                  <p className="text-2xl font-bold text-green-900">
                    {consultations.filter((c) => c.status === "in-progress").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <Video className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Concluídas</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.completedConsultations}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Tempo Total</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {consultations.reduce((acc, c) => acc + (c.duration ?? 0), 0)}min
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="border-0 shadow-lg mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por paciente ou serviço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12 border-0 bg-gray-50/50 focus:bg-white transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <Button variant={filterStatus === "all" ? "default" : "outline"} onClick={() => setFilterStatus("all")}>
                  Todas
                </Button>
                <Button
                  variant={filterStatus === "scheduled" ? "default" : "outline"}
                  onClick={() => setFilterStatus("scheduled")}
                >
                  Agendadas
                </Button>
                <Button
                  variant={filterStatus === "in-progress" ? "default" : "outline"}
                  onClick={() => setFilterStatus("in-progress")}
                >
                  Em Andamento
                </Button>
                <Button
                  variant={filterStatus === "completed" ? "default" : "outline"}
                  onClick={() => setFilterStatus("completed")}
                >
                  Concluídas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consultations List */}
        <div className="space-y-6">
          {filteredConsultations.map((consultation) => {
            const scheduledTime = new Date(consultation.scheduled_time)
            const now = new Date()
            const timeDiff = scheduledTime.getTime() - now.getTime()
            const minutesDiff = Math.floor(timeDiff / (1000 * 60))
            const canJoin = minutesDiff <= 15 && minutesDiff >= -60 && consultation.status === "scheduled"
            const canAdvance = consultation.status === "scheduled" && minutesDiff > 15
            const isTestConsultation = consultation.notes?.includes("🧪 CONSULTA DE TESTE")

            return (
              <Card
                key={consultation.id}
                className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${isTestConsultation ? "ring-2 ring-purple-200 bg-purple-50/30" : ""}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`w-16 h-16 rounded-xl flex items-center justify-center text-white shadow-lg ${isTestConsultation ? "bg-gradient-to-br from-purple-500 to-purple-600" : "bg-gradient-to-br from-blue-500 to-blue-600"}`}
                      >
                        {isTestConsultation ? <TestTube className="h-8 w-8" /> : <Video className="h-8 w-8" />}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-[#1E1D40] text-lg">
                            {consultation.patient_profiles?.full_name || "Paciente"}
                          </h3>
                          {isTestConsultation && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              <TestTube className="h-3 w-3 mr-1" />
                              TESTE
                            </Badge>
                          )}
                          <Badge variant="outline" className={getStatusColor(consultation.status)}>
                            {getStatusIcon(consultation.status)}
                            {getStatusText(consultation.status)}
                          </Badge>
                          {consultation.consultation_type === "video" && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <Video className="h-3 w-3 mr-1" />
                              Vídeo
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{scheduledTime.toLocaleDateString("pt-BR")}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              {scheduledTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{consultation.duration} min</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-medium text-[#1E1D40]">
                            {consultation.service_name || "Consulta Nutricional"}
                          </span>
                          <span
                            className={`font-semibold ${isTestConsultation ? "text-purple-600" : "text-green-600"}`}
                          >
                            {isTestConsultation ? "GRATUITO" : `R$ ${consultation.price ?? 0}`}
                          </span>
                        </div>

                        {consultation.notes && (
                          <p
                            className={`text-sm mt-2 ${isTestConsultation ? "text-purple-600 font-medium" : "text-gray-600"}`}
                          >
                            {consultation.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Botão para adiantar consulta */}
                      {canAdvance && !isTestConsultation && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-orange-200 text-orange-600 hover:bg-orange-50 bg-transparent"
                            >
                              <FastForward className="h-4 w-4 mr-2" />
                              Adiantar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                                Adiantar Consulta
                              </DialogTitle>
                              <DialogDescription>
                                Você deseja adiantar esta consulta para agora? O horário será alterado para o momento
                                atual e você poderá entrar na sala imediatamente.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="bg-blue-50 rounded-lg p-4 my-4">
                              <div className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                <div>
                                  <p className="text-sm font-medium text-blue-800">Detalhes da consulta:</p>
                                  <p className="text-sm text-blue-700">
                                    {consultation.patient_profiles?.full_name || "Paciente"}
                                  </p>
                                  <p className="text-sm text-blue-600">
                                    Horário atual: {scheduledTime.toLocaleString("pt-BR")}
                                  </p>
                                  <p className="text-sm text-blue-600">Novo horário: Agora</p>
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={() => handleAdvanceConsultation(consultation.id)}
                                disabled={advancingConsultation === consultation.id}
                                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                              >
                                {advancingConsultation === consultation.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                    Adiantando...
                                  </>
                                ) : (
                                  <>
                                    <FastForward className="h-4 w-4 mr-2" />
                                    Confirmar
                                  </>
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}

                      {consultation.status === "scheduled" && (
                        <Button
                          onClick={() => {
                            toast({
                              title: "Funcionalidade em Desenvolvimento",
                              description: "A videochamada está sendo desenvolvida. Use o chat e notas por enquanto.",
                              variant: "default"
                            })
                          }}
                          disabled={!canJoin}
                          className={
                            canJoin
                              ? "bg-orange-500 hover:bg-orange-600"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          {canJoin ? "Em Desenvolvimento" : `Aguardar (${Math.abs(minutesDiff)}min)`}
                        </Button>
                      )}

                      {consultation.status === "in-progress" && (
                        <Button
                          onClick={() => {
                            toast({
                              title: "Funcionalidade em Desenvolvimento",
                              description: "A videochamada está sendo desenvolvida. Use o chat e notas por enquanto.",
                              variant: "default"
                            })
                          }}
                          className="bg-orange-500 hover:bg-orange-600"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Em Desenvolvimento
                        </Button>
                      )}

                      {consultation.status === "completed" && (
                        <>
                          {consultation.recording_available && (
                            <Button variant="outline" size="sm">
                              <Play className="h-4 w-4 mr-2" />
                              Gravação
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            Relatório
                          </Button>
                        </>
                      )}

                      <Button variant="ghost" size="sm">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {filteredConsultations.length === 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {searchTerm ? "Nenhuma consulta encontrada" : "Nenhuma consulta agendada"}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm
                    ? "Tente ajustar os filtros ou termo de busca"
                    : "Agende sua primeira consulta de telemedicina"}
                </p>
                {!searchTerm && (
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      onClick={onScheduleNewConsultation}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agendar Consulta
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
