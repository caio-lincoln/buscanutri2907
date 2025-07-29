"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  Search,
  Filter,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Pause,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Plus,
  Target,
  TrendingUp,
  Activity,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Process {
  id: string
  title: string
  jobTitle: string
  status: "active" | "paused" | "completed" | "cancelled"
  startDate: string
  endDate?: string
  totalCandidates: number
  currentStage: string
  stages: {
    name: string
    candidates: number
    completed: boolean
  }[]
  progress: number
  responsible: string
  priority: "high" | "medium" | "low"
}

const mockProcesses: Process[] = [
  {
    id: "1",
    title: "Processo Seletivo - Nutricionista Clínico",
    jobTitle: "Nutricionista Clínico Sênior",
    status: "active",
    startDate: "2024-01-15",
    totalCandidates: 23,
    currentStage: "Entrevistas",
    stages: [
      { name: "Triagem", candidates: 23, completed: true },
      { name: "Análise de Currículo", candidates: 15, completed: true },
      { name: "Entrevistas", candidates: 8, completed: false },
      { name: "Teste Prático", candidates: 0, completed: false },
      { name: "Aprovação Final", candidates: 0, completed: false },
    ],
    progress: 60,
    responsible: "Ana Silva",
    priority: "high",
  },
  {
    id: "2",
    title: "Processo Seletivo - Nutricionista Esportivo",
    jobTitle: "Nutricionista Esportivo",
    status: "active",
    startDate: "2024-01-20",
    totalCandidates: 15,
    currentStage: "Análise de Currículo",
    stages: [
      { name: "Triagem", candidates: 15, completed: true },
      { name: "Análise de Currículo", candidates: 12, completed: false },
      { name: "Entrevistas", candidates: 0, completed: false },
      { name: "Teste Prático", candidates: 0, completed: false },
      { name: "Aprovação Final", candidates: 0, completed: false },
    ],
    progress: 30,
    responsible: "Carlos Santos",
    priority: "medium",
  },
  {
    id: "3",
    title: "Processo Seletivo - Coordenador",
    jobTitle: "Coordenador de Nutrição",
    status: "completed",
    startDate: "2024-01-05",
    endDate: "2024-01-25",
    totalCandidates: 8,
    currentStage: "Finalizado",
    stages: [
      { name: "Triagem", candidates: 8, completed: true },
      { name: "Análise de Currículo", candidates: 6, completed: true },
      { name: "Entrevistas", candidates: 4, completed: true },
      { name: "Teste Prático", candidates: 2, completed: true },
      { name: "Aprovação Final", candidates: 1, completed: true },
    ],
    progress: 100,
    responsible: "Maria Oliveira",
    priority: "high",
  },
  {
    id: "4",
    title: "Processo Seletivo - Estagiário",
    jobTitle: "Estagiário em Nutrição",
    status: "paused",
    startDate: "2024-01-10",
    totalCandidates: 12,
    currentStage: "Pausado",
    stages: [
      { name: "Triagem", candidates: 12, completed: true },
      { name: "Análise de Currículo", candidates: 8, completed: false },
      { name: "Entrevistas", candidates: 0, completed: false },
      { name: "Aprovação Final", candidates: 0, completed: false },
    ],
    progress: 25,
    responsible: "Pedro Costa",
    priority: "low",
  },
]

export function ProcessesTab() {
  const [processes] = useState<Process[]>(mockProcesses)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredProcesses = processes.filter((process) => {
    const matchesSearch =
      process.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || process.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "paused":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Ativo"
      case "paused":
        return "Pausado"
      case "completed":
        return "Concluído"
      case "cancelled":
        return "Cancelado"
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Play className="h-4 w-4" />
      case "paused":
        return <Pause className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const statusStats = {
    active: processes.filter((p) => p.status === "active").length,
    paused: processes.filter((p) => p.status === "paused").length,
    completed: processes.filter((p) => p.status === "completed").length,
    cancelled: processes.filter((p) => p.status === "cancelled").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1E1D40]">Processos Seletivos</h1>
          <p className="text-gray-600">Acompanhe o andamento dos seus processos de recrutamento</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover-lift">
          <Plus className="h-4 w-4 mr-2" />
          Novo Processo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Processos Ativos</p>
                <p className="text-3xl font-bold text-green-700">{statusStats.active}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Pausados</p>
                <p className="text-3xl font-bold text-yellow-700">{statusStats.paused}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                <Pause className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Concluídos</p>
                <p className="text-3xl font-bold text-blue-700">{statusStats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Taxa de Sucesso</p>
                <p className="text-3xl font-bold text-purple-700">85%</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar processos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="paused">Pausados</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Processes List */}
      <div className="grid gap-6">
        {filteredProcesses.map((process) => (
          <Card key={process.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover-lift">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-[#1E1D40]">{process.title}</h3>
                      <Badge className={getStatusColor(process.status)}>
                        {getStatusIcon(process.status)}
                        <span className="ml-1">{getStatusLabel(process.status)}</span>
                      </Badge>
                      <Badge className={getPriorityColor(process.priority)}>
                        Prioridade{" "}
                        {process.priority === "high" ? "Alta" : process.priority === "medium" ? "Média" : "Baixa"}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-3">{process.jobTitle}</p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Iniciado em {new Date(process.startDate).toLocaleDateString("pt-BR")}</span>
                      </div>
                      {process.endDate && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          <span>Finalizado em {new Date(process.endDate).toLocaleDateString("pt-BR")}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{process.totalCandidates} candidatos</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Etapa atual: {process.currentStage}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">Progresso do Processo</span>
                        <span className="font-semibold text-[#1E1D40]">{process.progress}%</span>
                      </div>
                      <Progress value={process.progress} className="h-2" />
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Processo
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        {process.status === "active" ? (
                          <>
                            <Pause className="h-4 w-4 mr-2" />
                            Pausar Processo
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Retomar Processo
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Cancelar Processo
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Process Stages */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-[#1E1D40] mb-3">Etapas do Processo</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {process.stages.map((stage, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                          stage.completed
                            ? "bg-green-50 border-green-200"
                            : stage.name === process.currentStage
                              ? "bg-blue-50 border-blue-200"
                              : "bg-white border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                          {stage.completed ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : stage.name === process.currentStage ? (
                            <Clock className="h-4 w-4 text-blue-600" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600">{stage.candidates} candidatos</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Responsável:</span> {process.responsible}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Candidatos
                    </Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Ver Relatório
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
