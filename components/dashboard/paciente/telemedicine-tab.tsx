"use client"

import { useState, useEffect, useRef } from "react"
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
  Edit,
  Trash2,
  Loader2,
  MapPin,
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
  getPatientConsultations,
  getPatientStats,
  cancelConsultation,
  rescheduleConsultation,
  type Consultation,
  type PatientStats,
} from "@/lib/consultation-service"
import { format, parseISO, addMinutes, isBefore, isAfter } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface PatientTelemedicineTabProps {
  userId: string
  onScheduleNewConsultation: () => void
}

export function PatientTelemedicineTab({ userId, onScheduleNewConsultation }: PatientTelemedicineTabProps) {
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [stats, setStats] = useState<PatientStats>({
    totalConsultations: 0,
    scheduledConsultations: 0,
    completedConsultations: 0,
    favoriteNutritionists: 0,
    averageRating: 0,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "scheduled" | "completed" | "in-progress" | "cancelled">(
    "all",
  )
  const [loading, setLoading] = useState(true)
  const [advancingConsultation, setAdvancingConsultation] = useState<string | null>(null)
  const [creatingTestConsultation, setCreatingTestConsultation] = useState(false)
  const router = useRouter()

  // Estados para cancelamento/reagendamento
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
  const [newRescheduleDate, setNewRescheduleDate] = useState<Date | undefined>(undefined)
  const [newRescheduleTime, setNewRescheduleTime] = useState<string>("")
  const [editingConsultation, setEditingConsultation] = useState<Consultation | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Verificar se está em modo de desenvolvimento
  const isDevelopment =
    process.env.NODE_ENV === "development" ||
    (typeof window !== "undefined" && window.location.hostname === "localhost")

  // Realtime service removed - functionality moved to individual components

  useEffect(() => {
    if (userId) {
      loadTelemedicineData(userId)
      // Opcional: Inscrever-se em notificações gerais aqui se necessário
      // realtimeServiceRef.current.subscribeToNotifications();
    }
    return () => {
      // Opcional: Limpar o serviço de tempo real ao desmontar
      // realtimeServiceRef.current.cleanup();
    }
  }, [userId])

  const loadTelemedicineData = async (currentUserId: string) => {
    try {
      setLoading(true)
      const [consultationsData, statsData] = await Promise.all([
        getPatientConsultations(currentUserId),
        getPatientStats(currentUserId),
      ])

      setConsultations(consultationsData)
      setStats(statsData)
    } catch (err) {
      console.error("❌ Erro ao carregar dados da telemedicina:", err)
      toast({
        title: "Erro ao carregar telemedicina",
        description: "Não foi possível carregar suas consultas de telemedicina",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createTestConsultation = async () => {
    if (!userId) return

    try {
      setCreatingTestConsultation(true)

      // Criar horário para 30 segundos no futuro
      const testTime = new Date()
      testTime.setSeconds(testTime.getSeconds() + 30)

      console.log("🧪 Criando consulta de teste para:", testTime.toISOString())

      // Buscar um nutricionista para o teste
      const { data: nutritionists } = await supabase.from("nutritionist_profiles").select("user_id, full_name").limit(1)

      if (!nutritionists?.length) {
        toast({
          title: "❌ Erro no teste",
          description: "Não há nutricionistas cadastrados para criar consulta de teste",
          variant: "destructive",
        })
        return
      }

      // Criar consulta de teste
      const { data: newConsultation, error } = await supabase
        .from("consultations")
        .insert({
          patient_id: userId,
          nutritionist_id: nutritionists[0].user_id,
          start_time: testTime.toISOString(),
          end_time: addMinutes(testTime, 30).toISOString(), // Duração de 30 minutos
          status: "scheduled",
          consultation_type: "online",
          price: 0, // Consulta de teste gratuita
          notes: "🧪 CONSULTA DE TESTE - Criada automaticamente para testar o sistema",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_blocked_slot: false,
          payment_status: "paid", // Para teste, considerar paga
        })
        .select()
        .single()

      if (error) throw error

      console.log("✅ Consulta de teste criada:", newConsultation)

      toast({
        title: "🧪 Consulta de teste criada!",
        description: "Aguarde 30 segundos e você poderá entrar na consulta",
      })

      // Recarregar consultas
      await loadTelemedicineData(userId)

      // Aguardar 30 segundos e redirecionar automaticamente
      setTimeout(() => {
        toast({
          title: "🚀 Entrando na consulta de teste...",
          description: "Redirecionando para a sala de telemedicina",
        })

        // Redirecionar para a consulta
        router.push(`/dashboard/paciente/telemedicina/consulta/${newConsultation.id}`)
      }, 30000) // 30 segundos

      // Mostrar countdown
      let countdown = 30
      const countdownInterval = setInterval(() => {
        countdown--
        if (countdown > 0) {
          toast({
            title: `⏱️ Teste iniciando em ${countdown}s`,
            description: "A consulta será aberta automaticamente",
          })
        } else {
          clearInterval(countdownInterval)
        }
      }, 1000)
    } catch (error) {
      console.error("❌ Erro ao criar consulta de teste:", error)
      toast({
        title: "Erro ao criar teste",
        description: "Não foi possível criar a consulta de teste",
        variant: "destructive",
      })
    } finally {
      setCreatingTestConsultation(false)
    }
  }

  const handleAdvanceConsultation = async (consultationId: string) => {
    try {
      setAdvancingConsultation(consultationId)

      // Atualizar o horário da consulta para agora
      const now = new Date()
      const consultationToAdvance = consultations.find((c) => c.id === consultationId)
      if (!consultationToAdvance) {
        toast({ title: "Erro", description: "Consulta não encontrada.", variant: "destructive" })
        return
      }

      const newEndTime = addMinutes(
        now,
        consultationToAdvance.end_time.diff(consultationToAdvance.start_time, "minutes"),
      )

      await rescheduleConsultation(
        consultationId,
        now,
        newEndTime,
        userId, // Quem está reagendando
        "Adiantamento de consulta pelo paciente",
      )

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

  const openCancelModal = (consultation: Consultation) => {
    setEditingConsultation(consultation)
    setIsCancelModalOpen(true)
  }

  const handleCancelConsultation = async () => {
    if (!editingConsultation) return

    setActionLoading(true)
    try {
      await cancelConsultation(editingConsultation.id, userId, cancelReason)
      toast({
        title: "✅ Consulta cancelada!",
        description: "Sua consulta foi cancelada com sucesso.",
      })
      setIsCancelModalOpen(false)
      setCancelReason("")
      setEditingConsultation(null)
      await loadTelemedicineData(userId)
    } catch (error) {
      console.error("❌ Erro ao cancelar consulta:", error)
      toast({
        title: "Erro ao cancelar consulta",
        description: "Não foi possível cancelar a consulta. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const openRescheduleModal = (consultation: Consultation) => {
    setEditingConsultation(consultation)
    setNewRescheduleDate(consultation.start_time ? parseISO(consultation.start_time) : new Date())
      setNewRescheduleTime(consultation.start_time ? format(parseISO(consultation.start_time), "HH:mm") : "00:00")
    setIsRescheduleModalOpen(true)
  }

  const handleRescheduleConsultation = async () => {
    if (!editingConsultation || !newRescheduleDate || !newRescheduleTime) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a nova data e horário para reagendar.",
        variant: "destructive",
      })
      return
    }

    setActionLoading(true)
    try {
      const newStart = new Date(newRescheduleDate)
      const timeParts = (newRescheduleTime || "00:00").split(":")
      newStart.setHours(
        Number.parseInt(timeParts[0] || "0"),
        Number.parseInt(timeParts[1] || "0"),
        0,
        0,
      )
      const originalStartTime = editingConsultation.start_time ? parseISO(editingConsultation.start_time) : new Date()
      const originalEndTime = editingConsultation.end_time ? parseISO(editingConsultation.end_time) : new Date()
      const duration = originalEndTime.getTime() - originalStartTime.getTime() // em milissegundos
      const newEnd = new Date(newStart.getTime() + duration)

      await rescheduleConsultation(
        editingConsultation.id,
        newStart,
        newEnd,
        userId, // Quem está reagendando
        "Reagendamento pelo paciente",
      )
      toast({
        title: "✅ Consulta reagendada!",
        description: "Sua consulta foi reagendada com sucesso.",
      })
      setIsRescheduleModalOpen(false)
      setNewRescheduleDate(undefined)
      setNewRescheduleTime("")
      setEditingConsultation(null)
      await loadTelemedicineData(userId)
    } catch (error) {
      console.error("❌ Erro ao reagendar consulta:", error)
      toast({
        title: "Erro ao reagendar consulta",
        description: "Não foi possível reagendar a consulta. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const filteredConsultations = consultations.filter((consultation) => {
    const matchesSearch =
      (consultation.patient_profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        consultation.nutritionist_profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        consultation.notes?.toLowerCase().includes(searchTerm.toLowerCase())) ?? // Usar notes como "service_name" temporariamente
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
      case "rescheduled":
        return "bg-purple-50 text-purple-700 border-purple-200"
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
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
      case "rescheduled":
        return <FastForward className="h-3 w-3 mr-1" />
      case "pending":
        return <AlertTriangle className="h-3 w-3 mr-1" />
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
      case "rescheduled":
        return "Reagendada"
      case "pending":
        return "Pendente"
      default:
        return "Desconhecido"
    }
  }

  const handleJoinConsultation = async (consultationId: string) => {
    try {
      // Verificar se a consulta pode ser iniciada (horário próximo)
      const consultation = consultations.find((c) => c.id === consultationId)
      if (!consultation) return

      const startTime = parseISO(consultation.start_time)
      const endTime = parseISO(consultation.end_time)
      const now = new Date()

      // Permitir entrar 15 minutos antes do horário agendado e até 60 minutos depois do horário de término
      const canJoinBefore = isBefore(now, startTime) && addMinutes(now, 15) >= startTime
      const canJoinAfter = isAfter(now, startTime) && isBefore(now, addMinutes(endTime, 60))

      if (!canJoinBefore && !canJoinAfter && consultation.status === "scheduled") {
        toast({
          title: "Consulta ainda não disponível",
          description: `A consulta só estará disponível 15 minutos antes do horário agendado (${format(startTime, "HH:mm", { locale: ptBR })}) e até 60 minutos após o término.`,
          variant: "destructive",
        })
        return
      }

      if (consultation.status === "cancelled" || consultation.status === "completed") {
        toast({
          title: "Consulta indisponível",
          description: `Esta consulta está ${getStatusText(consultation.status).toLowerCase()}.`,
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
      router.push(`/dashboard/paciente/telemedicina/consulta/${consultationId}`)
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
                        onClick={createTestConsultation}
                        disabled={creatingTestConsultation}
                        className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                      >
                        {creatingTestConsultation ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Criando Teste...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Iniciar Teste
                          </>
                        )}
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
                Agendar Consulta
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
                    {consultations.reduce(
                      (acc, c) =>
                        acc +
                        (c.start_time && c.end_time
          ? (parseISO(c.end_time).getTime() - parseISO(c.start_time).getTime()) / (1000 * 60)
          : 0),
                      0,
                    )}
                    min
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
                  placeholder="Buscar por nutricionista ou serviço..."
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
                <Button
                  variant={filterStatus === "cancelled" ? "default" : "outline"}
                  onClick={() => setFilterStatus("cancelled")}
                >
                  Canceladas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consultations List */}
        <div className="space-y-6">
          {filteredConsultations.map((consultation) => {
          const startTime = consultation.start_time ? parseISO(consultation.start_time) : new Date()
          const endTime = consultation.end_time ? parseISO(consultation.end_time) : new Date()
            const now = new Date()
            const minutesUntilStart = Math.floor((startTime.getTime() - now.getTime()) / (1000 * 60))
            const minutesAfterEnd = Math.floor((now.getTime() - endTime.getTime()) / (1000 * 60))

            const canJoin =
              minutesUntilStart <= 15 &&
              minutesUntilStart >= -60 && // 15 min antes até 60 min depois do início
              consultation.status === "scheduled"

            const canAdvance = consultation.status === "scheduled" && minutesUntilStart > 15
            const canCancel = consultation.status === "scheduled" && minutesUntilStart > 24 * 60 // 24h antes
            const canReschedule = consultation.status === "scheduled" && minutesUntilStart > 24 * 60 // 24h antes

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
                            {consultation.nutritionist_profiles?.full_name || "Nutricionista"}
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
                          {consultation.consultation_type === "online" && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <Video className="h-3 w-3 mr-1" />
                              Online
                            </Badge>
                          )}
                          {consultation.consultation_type === "presential" && (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                              <MapPin className="h-3 w-3 mr-1" />
                              Presencial
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(startTime, "dd/MM/yyyy", { locale: ptBR })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              {format(startTime, "HH:mm", { locale: ptBR })} -{" "}
                              {format(endTime, "HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{(endTime.getTime() - startTime.getTime()) / (1000 * 60)} min</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-medium text-[#1E1D40]">
                            {consultation.notes || "Consulta Nutricional"}
                          </span>
                          <span
                            className={`font-semibold ${isTestConsultation ? "text-purple-600" : "text-green-600"}`}
                          >
                            {isTestConsultation ? "GRATUITO" : `R$ ${consultation.price ?? 0}`}
                          </span>
                        </div>

                        {consultation.cancel_reason && (
                          <p className="text-sm mt-2 text-red-600 font-medium">
                            Cancelado: {consultation.cancel_reason}
                          </p>
                        )}
                        {consultation.reschedule_reason && (
                          <p className="text-sm mt-2 text-purple-600 font-medium">
                            Reagendado: {consultation.reschedule_reason}
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
                                    {consultation.nutritionist_profiles?.full_name || "Nutricionista"}
                                  </p>
                                  <p className="text-sm text-blue-600">
                                    Horário atual: {format(startTime, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                  </p>
                                  <p className="text-sm text-blue-600">Novo horário: Agora</p>
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={() => handleAdvanceConsultation(consultation.id)}
                                disabled={advancingConsultation === consultation.id || actionLoading}
                                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                              >
                                {advancingConsultation === consultation.id || actionLoading ? (
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
                          disabled={!canJoin || actionLoading}
                          className={
                            canJoin
                              ? "bg-orange-500 hover:bg-orange-600"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          {canJoin ? "Em Desenvolvimento" : `Aguardar (${Math.abs(minutesUntilStart)}min)`}
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
                          disabled={actionLoading}
                          className="bg-orange-500 hover:bg-orange-600"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Em Desenvolvimento
                        </Button>
                      )}

                      {consultation.status === "completed" && (
                        <>
                          {consultation.recording_url && (
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

                      {/* Botões de Ação para Agendadas */}
                      {consultation.status === "scheduled" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRescheduleModal(consultation)}
                            disabled={!canReschedule || actionLoading}
                            className="border-purple-200 text-purple-600 hover:bg-purple-50 bg-transparent"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Reagendar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openCancelModal(consultation)}
                            disabled={!canCancel || actionLoading}
                            className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Cancelar
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

      {/* Modal de Cancelamento */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Consulta</DialogTitle>
            <DialogDescription>
              Você está prestes a cancelar a consulta com{" "}
              <span className="font-semibold">{editingConsultation?.nutritionist_profiles?.full_name}</span> agendada
              para{" "}
              <span className="font-semibold">
                {editingConsultation?.start_time
                  ? format(new Date(editingConsultation.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                  : ""}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="cancel-reason">Motivo do Cancelamento (Opcional)</Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ex: Imprevisto pessoal, conflito de agenda..."
            />
            <p className="text-sm text-gray-500">O nutricionista será notificado sobre o cancelamento.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelModalOpen(false)} disabled={actionLoading}>
              Manter Consulta
            </Button>
            <Button variant="destructive" onClick={handleCancelConsultation} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cancelando...
                </>
              ) : (
                "Confirmar Cancelamento"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Reagendamento */}
      <Dialog open={isRescheduleModalOpen} onOpenChange={setIsRescheduleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reagendar Consulta</DialogTitle>
            <DialogDescription>
              Reagendando consulta com{" "}
              <span className="font-semibold">{editingConsultation?.nutritionist_profiles?.full_name}</span> agendada
              para{" "}
              <span className="font-semibold">
                {editingConsultation?.start_time
                  ? format(new Date(editingConsultation.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                  : ""}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-reschedule-date" className="text-right">
                Nova Data
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="col-span-3 justify-start text-left font-normal"
                    disabled={actionLoading}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {newRescheduleDate ? (
                      format(newRescheduleDate, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newRescheduleDate}
                    onSelect={setNewRescheduleDate}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-reschedule-time" className="text-right">
                Novo Horário
              </Label>
              <Input
                id="new-reschedule-time"
                type="time"
                value={newRescheduleTime}
                onChange={(e) => setNewRescheduleTime(e.target.value)}
                className="col-span-3"
                disabled={actionLoading}
              />
            </div>
            <p className="text-sm text-gray-500">O nutricionista será notificado sobre o reagendamento.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRescheduleModalOpen(false)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button onClick={handleRescheduleConsultation} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reagendando...
                </>
              ) : (
                "Confirmar Reagendamento"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
