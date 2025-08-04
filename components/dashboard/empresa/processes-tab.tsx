"use client"

import { useState, useEffect } from "react"
import { getCompanyProcesses, type ProcessData } from "@/lib/company-data-service"
import { useUser } from "@/hooks/use-user"
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
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Plus,
  Target,
  FileText,
  TrendingUp,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NewProcessModal } from "./new-process-modal"

interface Process {
  id: string
  title: string
  jobTitle: string
  candidate: string
  status: "triagem" | "entrevista" | "teste_tecnico" | "aprovado" | "rejeitado"
  stage: "triagem" | "entrevista" | "teste_tecnico" | "aprovado" | "rejeitado"
  nextStep: string
  scheduledDate?: string
  notes?: string
  createdAt: string
}

export function ProcessesTab() {
  const { user } = useUser()
  const [processes, setProcesses] = useState<Process[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isNewProcessModalOpen, setIsNewProcessModalOpen] = useState(false)

  useEffect(() => {
    loadProcesses()
  }, [user])

  const loadProcesses = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const data = await getCompanyProcesses(user.id)
      
      // Transform the data to match our interface
      const transformedProcesses: Process[] = data.map((item: ProcessData) => ({
        id: item.id,
        title: item.title || '',
        jobTitle: item.job_title,
        candidate: item.candidate_name,
        status: item.status as "triagem" | "entrevista" | "teste_tecnico" | "aprovado" | "rejeitado",
        stage: item.current_stage as "triagem" | "entrevista" | "teste_tecnico" | "aprovado" | "rejeitado",
        nextStep: item.next_step,
        scheduledDate: item.deadline,
        notes: item.notes,
        createdAt: item.created_at,
      }))
      
      setProcesses(transformedProcesses)
    } catch (error) {
      console.error("Error fetching company processes:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleProcessCreated = () => {
    loadProcesses()
    setIsNewProcessModalOpen(false)
  }

  const filteredProcesses = processes.filter((process) => {
    const matchesSearch =
      process.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.candidate.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || process.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "triagem":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "entrevista":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "teste_tecnico":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "aprovado":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejeitado":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "triagem":
        return "Triagem"
      case "entrevista":
        return "Entrevista"
      case "teste_tecnico":
        return "Teste Técnico"
      case "aprovado":
        return "Aprovado"
      case "rejeitado":
        return "Rejeitado"
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "triagem":
        return <Clock className="h-4 w-4" />
      case "entrevista":
        return <Users className="h-4 w-4" />
      case "teste_tecnico":
        return <AlertCircle className="h-4 w-4" />
      case "aprovado":
        return <CheckCircle className="h-4 w-4" />
      case "rejeitado":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const statusStats = {
    triagem: processes.filter((p) => p.status === "triagem").length,
    entrevista: processes.filter((p) => p.status === "entrevista").length,
    teste_tecnico: processes.filter((p) => p.status === "teste_tecnico").length,
    aprovado: processes.filter((p) => p.status === "aprovado").length,
    rejeitado: processes.filter((p) => p.status === "rejeitado").length,
    total: processes.length,
    successRate: processes.length > 0 
      ? Math.round((processes.filter((p) => p.status === "aprovado").length / processes.length) * 100)
      : 0,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1E1D40]">Processos Seletivos</h1>
          <p className="text-gray-600">Acompanhe o andamento dos seus processos de recrutamento</p>
        </div>
        <Button 
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover-lift"
          onClick={() => setIsNewProcessModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Processo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Em Triagem</p>
                <p className="text-3xl font-bold text-blue-700">{statusStats.triagem}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Em Entrevista</p>
                <p className="text-3xl font-bold text-yellow-700">{statusStats.entrevista}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Aprovados</p>
                <p className="text-3xl font-bold text-green-700">{statusStats.aprovado}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
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
                <p className="text-3xl font-bold text-purple-700">{statusStats.successRate}%</p>
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
                <SelectItem value="triagem">Triagem</SelectItem>
                <SelectItem value="entrevista">Entrevista</SelectItem>
                <SelectItem value="teste_tecnico">Teste Técnico</SelectItem>
                <SelectItem value="aprovado">Aprovados</SelectItem>
                <SelectItem value="rejeitado">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Processes List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando processos...</p>
          </div>
        </div>
      ) : filteredProcesses.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum processo encontrado</h3>
          <p className="text-gray-600">Não há processos seletivos que correspondam aos filtros aplicados.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredProcesses.map((process) => (
            <Card key={process.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover-lift">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-[#1E1D40]">{process.jobTitle}</h3>
                        <Badge className={getStatusColor(process.status)}>
                          {getStatusIcon(process.status)}
                          <span className="ml-1">{getStatusLabel(process.status)}</span>
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3">Candidato: {process.candidate}</p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Criado em {new Date(process.createdAt).toLocaleDateString("pt-BR")}</span>
                        </div>
                        {process.scheduledDate && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>Agendado para {new Date(process.scheduledDate).toLocaleDateString("pt-BR")}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          <span>Próximo passo: {process.nextStep}</span>
                        </div>
                      </div>

                      {process.notes && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <p className="text-sm text-gray-700">
                            <strong>Observações:</strong> {process.notes}
                          </p>
                        </div>
                      )}
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Cancelar Processo
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center justify-end pt-4">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <FileText className="h-4 w-4 mr-2" />
                        Relatório
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <NewProcessModal
        isOpen={isNewProcessModalOpen}
        onClose={() => setIsNewProcessModalOpen(false)}
        onSuccess={handleProcessCreated}
      />
    </div>
  )
}
