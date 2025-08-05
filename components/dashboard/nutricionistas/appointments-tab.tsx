"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, startOfWeek, endOfWeek, addDays, isSameDay, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  CalendarIcon,
  Clock,
  Video,
  Plus,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ClipboardList,
  Loader2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
// Telemedicina temporariamente desabilitada
// import {
//   getConsultationsForNutritionist,
//   rescheduleConsultation,
//   cancelConsultation,
//   blockTimeSlot,
//   unblockTimeSlot,
//   type Consultation,
// } from "@/lib/telemedicine-service"

// Tipos temporários para substituir os tipos de telemedicina
interface Consultation {
  id: string
  start_time: string
  end_time: string
  status: "scheduled" | "completed" | "cancelled" | "pending" | "rescheduled"
  consultation_type: "online" | "presential"
  patient_name?: string
  patient_avatar?: string
  is_blocked_slot?: boolean
  block_reason?: string
  nutritionist_profiles?: {
    address?: string
  }
}

// Funções temporárias para substituir as funções de telemedicina
const getConsultationsForNutritionist = async (
  userId: string,
  startDate?: Date,
  endDate?: Date,
  filterStatus?: string,
  filterType?: string,
  filterPatientName?: string
): Promise<Consultation[]> => {
  // Funcionalidade de telemedicina temporariamente desabilitada
  return []
}

const rescheduleConsultation = async (consultationId: string, newStart: Date, newEnd: Date): Promise<void> => {
  // Funcionalidade de telemedicina temporariamente desabilitada
  throw new Error("Funcionalidade de reagendamento temporariamente indisponível")
}

const cancelConsultation = async (consultationId: string, reason?: string): Promise<void> => {
  // Funcionalidade de telemedicina temporariamente desabilitada
  throw new Error("Funcionalidade de cancelamento temporariamente indisponível")
}

const blockTimeSlot = async (userId: string, startTime: Date, endTime: Date, reason: string): Promise<void> => {
  // Funcionalidade de telemedicina temporariamente desabilitada
  throw new Error("Funcionalidade de bloqueio de horário temporariamente indisponível")
}

const unblockTimeSlot = async (consultationId: string): Promise<void> => {
  // Funcionalidade de telemedicina temporariamente desabilitada
  throw new Error("Funcionalidade de desbloqueio de horário temporariamente indisponível")
}
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CustomCalendar } from "@/components/custom-calendar"

type ViewMode = "month" | "week" | "day"

interface AppointmentsTabProps {
  // Adicione props se necessário, como o ID do nutricionista
  userId: string
}

export function AppointmentsTab({ userId }: AppointmentsTabProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>("week")
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State para o modal de bloqueio/edição
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false)
  const [blockReason, setBlockReason] = useState("")
  const [blockStartTime, setBlockStartTime] = useState<string>("")
  const [blockEndTime, setBlockEndTime] = useState<string>("")
  const [editingConsultation, setEditingConsultation] = useState<Consultation | null>(null)
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
  const [newRescheduleDate, setNewRescheduleDate] = useState<Date | undefined>(undefined)
  const [newRescheduleTime, setNewRescheduleTime] = useState<string>("")
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")

  // Filtros
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterPatientName, setFilterPatientName] = useState<string>("")

  const fetchConsultations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let startDate: Date | undefined
      let endDate: Date | undefined

      if (viewMode === "month") {
        startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
        endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
      } else if (viewMode === "week") {
        startDate = startOfWeek(selectedDate, { locale: ptBR })
        endDate = endOfWeek(selectedDate, { locale: ptBR })
      } else {
        // Day view
        startDate = selectedDate
        endDate = selectedDate
      }

      const fetchedConsultations = await getConsultationsForNutritionist(
        userId,
        startDate,
        endDate,
        filterStatus,
        filterType,
        filterPatientName,
      )
      setConsultations(fetchedConsultations)
    } catch (err: any) {
      setError(err.message || "Erro ao carregar consultas.")
      toast({
        title: "Erro",
        description: "Não foi possível carregar as consultas.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [userId, selectedDate, viewMode, filterStatus, filterType, filterPatientName])

  useEffect(() => {
    if (userId) {
      fetchConsultations()
    }
  }, [userId, fetchConsultations])

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
    }
  }

  const handlePrevNext = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate)
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
    } else {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1))
    }
    setSelectedDate(newDate)
  }

  const getVisibleDays = useMemo(() => {
    if (viewMode === "month") {
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
      const start = startOfWeek(startOfMonth, { locale: ptBR })
      const end = endOfWeek(endOfMonth, { locale: ptBR })
      const days = []
      let day = start
      while (day <= end) {
        days.push(day)
        day = addDays(day, 1)
      }
      return days
    } else if (viewMode === "week") {
      const start = startOfWeek(selectedDate, { locale: ptBR })
      const days = []
      for (let i = 0; i < 7; i++) {
        days.push(addDays(start, i))
      }
      return days
    } else {
      return [selectedDate]
    }
  }, [selectedDate, viewMode])

  const getConsultationsForDay = (day: Date) => {
    return consultations
      .filter((c) => isSameDay(parseISO(c.start_time), day))
      .sort((a, b) => {
        const timeA = new Date(a.start_time).getTime()
        const timeB = new Date(b.start_time).getTime()
        return timeA - timeB
      })
  }

  const handleBlockTime = async () => {
    if (!blockStartTime || !blockEndTime || !blockReason) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para bloquear o horário.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const startDateTime = new Date(selectedDate)
      const startTimeParts = blockStartTime?.split(":") || ["0", "0"]
      startDateTime.setHours(
        Number.parseInt(startTimeParts[0]),
        Number.parseInt(startTimeParts[1]),
        0,
        0,
      )
      const endDateTime = new Date(selectedDate)
      const endTimeParts = blockEndTime?.split(":") || ["0", "0"]
      endDateTime.setHours(
        Number.parseInt(endTimeParts[0]),
        Number.parseInt(endTimeParts[1]),
        0,
        0,
      )

      if (startDateTime >= endDateTime) {
        toast({
          title: "Erro de horário",
          description: "A hora de início deve ser anterior à hora de término.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      await blockTimeSlot(userId, startDateTime, endDateTime, blockReason)
      toast({
        title: "Horário bloqueado!",
        description: "O horário foi bloqueado com sucesso.",
      })
      setIsBlockModalOpen(false)
      setBlockReason("")
      setBlockStartTime("")
      setBlockEndTime("")
      fetchConsultations()
    } catch (err: any) {
      toast({
        title: "Erro ao bloquear horário",
        description: err.message || "Ocorreu um erro ao bloquear o horário.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUnblockTime = async (consultationId: string) => {
    if (!confirm("Tem certeza que deseja desbloquear este horário?")) return
    setLoading(true)
    try {
      await unblockTimeSlot(consultationId)
      toast({
        title: "Horário desbloqueado!",
        description: "O horário foi desbloqueado com sucesso.",
      })
      fetchConsultations()
    } catch (err: any) {
      toast({
        title: "Erro ao desbloquear horário",
        description: err.message || "Ocorreu um erro ao desbloquear o horário.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const openRescheduleModal = (consultation: Consultation) => {
    setEditingConsultation(consultation)
    setNewRescheduleDate(parseISO(consultation.start_time))
    setNewRescheduleTime(format(parseISO(consultation.start_time), "HH:mm"))
    setIsRescheduleModalOpen(true)
  }

  const handleReschedule = async () => {
    if (!editingConsultation || !newRescheduleDate || !newRescheduleTime) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para reagendar.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const newStart = new Date(newRescheduleDate)
      const rescheduleTimeParts = newRescheduleTime?.split(":") || ["0", "0"]
      newStart.setHours(
        Number.parseInt(rescheduleTimeParts[0]),
        Number.parseInt(rescheduleTimeParts[1]),
        0,
        0,
      )
      const newEnd = new Date(
        newStart.getTime() +
          (parseISO(editingConsultation.end_time).getTime() - parseISO(editingConsultation.start_time).getTime()),
      )

      await rescheduleConsultation(editingConsultation.id, newStart, newEnd)
      toast({
        title: "Consulta reagendada!",
        description: "A consulta foi reagendada com sucesso.",
      })
      setIsRescheduleModalOpen(false)
      setEditingConsultation(null)
      fetchConsultations()
    } catch (err: any) {
      toast({
        title: "Erro ao reagendar",
        description: err.message || "Ocorreu um erro ao reagendar a consulta.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const openCancelModal = (consultation: Consultation) => {
    setEditingConsultation(consultation)
    setIsCancelModalOpen(true)
  }

  const handleCancel = async () => {
    if (!editingConsultation) return

    setLoading(true)
    try {
      await cancelConsultation(editingConsultation.id, cancelReason)
      toast({
        title: "Consulta cancelada!",
        description: "A consulta foi cancelada com sucesso.",
      })
      setIsCancelModalOpen(false)
      setEditingConsultation(null)
      setCancelReason("")
      fetchConsultations()
    } catch (err: any) {
      toast({
        title: "Erro ao cancelar",
        description: err.message || "Ocorreu um erro ao cancelar a consulta.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: Consultation["status"]) => {
    switch (status) {
      case "scheduled":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-700 border-blue-200">
            Agendada
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
            Concluída
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
            Cancelada
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
            Pendente
          </Badge>
        )
      case "rescheduled":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
            Reagendada
          </Badge>
        )
      default:
        return <Badge variant="secondary">Desconhecido</Badge>
    }
  }

  const getConsultationTypeBadge = (type: Consultation["consultation_type"]) => {
    switch (type) {
      case "online":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Online
          </Badge>
        )
      case "presential":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            Presencial
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">Minha Agenda Profissional</h1>
          <p className="text-gray-600">Gerencie seus horários, consultas e bloqueios.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="hover-lift bg-white/80 backdrop-blur-sm border-gray-200"
            onClick={() => setIsBlockModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Bloquear Horário
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendário e Filtros */}
        <Card className="lg:col-span-1 border-0 shadow-lg backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              Navegar no Calendário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CustomCalendar
              selectedDate={selectedDate}
              onSelectDate={handleDateChange}
              initialMonth={selectedDate} // Garante que o calendário inicie no mês da data selecionada
              disableWeekends={false} // Permite fins de semana para nutricionistas
              showAvailabilityIndicator={false} // Não mostra indicador de disponibilidade genérico aqui
            />
            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => handlePrevNext("prev")} className="flex-1">
                <ChevronLeft className="h-4 w-4" /> Anterior
              </Button>
              <Button variant="outline" onClick={() => handlePrevNext("next")} className="flex-1">
                Próximo <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="view-mode">Visualização</Label>
              <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                <SelectTrigger id="view-mode">
                  <SelectValue placeholder="Selecionar visualização" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Dia</SelectItem>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="month">Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="filter-status">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="filter-status">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="scheduled">Agendada</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="rescheduled">Reagendada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="filter-type">Tipo de Atendimento</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger id="filter-type">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="presential">Presencial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="filter-patient">Nome do Paciente</Label>
              <Input
                id="filter-patient"
                placeholder="Buscar paciente..."
                value={filterPatientName}
                onChange={(e) => setFilterPatientName(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Visualização de Consultas */}
        <Card className="lg:col-span-3 border-0 shadow-lg backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-green-600" />
              {viewMode === "day"
                ? `Consultas em ${format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}`
                : viewMode === "week"
                  ? `Consultas da Semana (${format(startOfWeek(selectedDate, { locale: ptBR }), "dd/MM")} - ${format(endOfWeek(selectedDate, { locale: ptBR }), "dd/MM")})`
                  : `Consultas de ${format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-3 text-gray-600">Carregando agenda...</span>
              </div>
            ) : consultations.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                Nenhuma consulta ou horário bloqueado encontrado para o período e filtros selecionados.
              </div>
            ) : (
              <div className="space-y-6">
                {viewMode === "day" ? (
                  <DayView
                    consultations={getConsultationsForDay(selectedDate)}
                    onReschedule={openRescheduleModal}
                    onCancel={openCancelModal}
                    onUnblock={handleUnblockTime}
                  />
                ) : (
                  getVisibleDays.map((day) => {
                    const dailyConsultations = getConsultationsForDay(day)
                    if (dailyConsultations.length === 0) return null
                    return (
                      <div key={day.toISOString()} className="border-b pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
                        <h3 className="text-lg font-semibold text-[#1E1D40] mb-3 flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-gray-500" />
                          {format(day, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </h3>
                        <DayView
                          consultations={dailyConsultations}
                          onReschedule={openRescheduleModal}
                          onCancel={openCancelModal}
                          onUnblock={handleUnblockTime}
                        />
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Bloqueio de Horário */}
      <Dialog open={isBlockModalOpen} onOpenChange={setIsBlockModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear Horário</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="block-start-time" className="text-right">
                Início
              </Label>
              <Input
                id="block-start-time"
                type="time"
                value={blockStartTime}
                onChange={(e) => setBlockStartTime(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="block-end-time" className="text-right">
                Fim
              </Label>
              <Input
                id="block-end-time"
                type="time"
                value={blockEndTime}
                onChange={(e) => setBlockEndTime(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="block-reason" className="text-right">
                Motivo
              </Label>
              <Textarea
                id="block-reason"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Ex: Consulta pessoal, Férias, Evento"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBlockModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBlockTime} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Bloquear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Reagendamento */}
      <Dialog open={isRescheduleModalOpen} onOpenChange={setIsRescheduleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reagendar Consulta</DialogTitle>
          </DialogHeader>
          {editingConsultation && (
            <div className="grid gap-4 py-4">
              <p className="text-sm text-gray-700">
                Reagendando consulta com <span className="font-semibold">{editingConsultation.patient_name}</span> em{" "}
                <span className="font-semibold">
                  {format(parseISO(editingConsultation.start_time), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </span>
              </p>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-date" className="text-right">
                  Nova Data
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "col-span-3 justify-start text-left font-normal",
                        !newRescheduleDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newRescheduleDate ? (
                        format(newRescheduleDate, "PPP", { locale: ptBR })
                      ) : (
                        <span>Escolha uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CustomCalendar
                      selectedDate={newRescheduleDate}
                      onSelectDate={setNewRescheduleDate}
                      disableWeekends={false} // Permite fins de semana para reagendamento
                      showAvailabilityIndicator={false} // Não mostra indicador de disponibilidade genérico aqui
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-time" className="text-right">
                  Novo Horário
                </Label>
                <Input
                  id="new-time"
                  type="time"
                  value={newRescheduleTime}
                  onChange={(e) => setNewRescheduleTime(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRescheduleModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReschedule} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Reagendar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Cancelamento */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Consulta</DialogTitle>
          </DialogHeader>
          {editingConsultation && (
            <div className="grid gap-4 py-4">
              <p className="text-sm text-gray-700">
                Você está prestes a cancelar a consulta com{" "}
                <span className="font-semibold">{editingConsultation.patient_name}</span> em{" "}
                <span className="font-semibold">
                  {format(parseISO(editingConsultation.start_time), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </span>
                .
              </p>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cancel-reason" className="text-right">
                  Motivo
                </Label>
                <Textarea
                  id="cancel-reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Opcional: Informe o motivo do cancelamento."
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelModalOpen(false)}>
              Não Cancelar
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirmar Cancelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface DayViewProps {
  consultations: Consultation[]
  onReschedule: (consultation: Consultation) => void
  onCancel: (consultation: Consultation) => void
  onUnblock: (consultationId: string) => void
}

function DayView({ consultations, onReschedule, onCancel, onUnblock }: DayViewProps) {
  const getStatusBadge = (status: Consultation["status"]) => {
    switch (status) {
      case "scheduled":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-700 border-blue-200">
            Agendada
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
            Concluída
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
            Cancelada
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
            Pendente
          </Badge>
        )
      case "rescheduled":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
            Reagendada
          </Badge>
        )
      default:
        return <Badge variant="secondary">Desconhecido</Badge>
    }
  }

  const getConsultationTypeBadge = (type: Consultation["consultation_type"]) => {
    switch (type) {
      case "online":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Online
          </Badge>
        )
      case "presential":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            Presencial
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {consultations.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhum evento neste dia.</p>
      ) : (
        consultations.map((consultation) => (
          <Card
            key={consultation.id}
            className={cn(
              "border-0 shadow-md transition-all duration-200 hover:shadow-lg",
              consultation.is_blocked_slot ? "bg-gray-50 border-gray-200" : "bg-white border-blue-100",
            )}
          >
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex flex-col items-center justify-center text-center">
                  <Clock className="h-5 w-5 text-gray-600" />
                  <span className="font-semibold text-lg text-[#1E1D40]">
                    {format(parseISO(consultation.start_time), "HH:mm")}
                  </span>
                  <span className="text-xs text-gray-500">{format(parseISO(consultation.end_time), "HH:mm")}</span>
                </div>
                <div className="flex-1 min-w-0">
                  {consultation.is_blocked_slot ? (
                    <>
                      <h3 className="font-bold text-lg text-gray-800">Horário Bloqueado</h3>
                      <p className="text-sm text-gray-600 truncate">
                        Motivo: {consultation.block_reason || "Não informado"}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={consultation.patient_avatar || "/placeholder.svg"} />
                          <AvatarFallback>{consultation.patient_name?.charAt(0).toUpperCase() || "P"}</AvatarFallback>
                        </Avatar>
                        <h3 className="font-bold text-lg text-[#1E1D40] truncate">
                          Consulta com {consultation.patient_name}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {getStatusBadge(consultation.status)}
                        {getConsultationTypeBadge(consultation.consultation_type)}
                      </div>
                      {consultation.consultation_type === "presential" &&
                        consultation.nutritionist_profiles?.address && (
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {consultation.nutritionist_profiles.address}
                          </p>
                        )}
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {consultation.is_blocked_slot ? (
                  <Button variant="outline" size="sm" onClick={() => onUnblock(consultation.id)}>
                    <XCircle className="h-4 w-4 mr-1" /> Desbloquear
                  </Button>
                ) : (
                  <>
                    {consultation.consultation_type === "online" && (
                      <Button variant="outline" size="sm">
                        <Video className="h-4 w-4 mr-1" /> Entrar
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => onReschedule(consultation)}>
                      <Edit className="h-4 w-4 mr-1" /> Reagendar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => onCancel(consultation)}>
                      <Trash2 className="h-4 w-4 mr-1" /> Cancelar
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
