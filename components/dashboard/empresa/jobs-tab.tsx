"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Users,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  Briefcase,
  Building,
  Star,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { JobCandidatesModal } from "./job-candidates-modal"

interface Job {
  id: string
  title: string
  department: string
  location: string
  type: "full-time" | "part-time" | "contract" | "internship"
  salary: string
  description: string
  requirements: string[]
  benefits: string[]
  status: "active" | "paused" | "closed"
  applications: number
  views: number
  postedDate: string
  deadline: string
  priority: "high" | "medium" | "low"
}

const mockJobs: Job[] = [
  {
    id: "1",
    title: "Nutricionista Clínico Sênior",
    department: "Saúde",
    location: "São Paulo, SP",
    type: "full-time",
    salary: "R$ 8.000 - R$ 12.000",
    description: "Buscamos nutricionista experiente para atendimento clínico em nossa unidade de São Paulo.",
    requirements: ["CRN ativo", "Experiência mínima de 5 anos", "Especialização em nutrição clínica"],
    benefits: ["Vale alimentação", "Plano de saúde", "Vale transporte"],
    status: "active",
    applications: 23,
    views: 156,
    postedDate: "2024-01-15",
    deadline: "2024-02-15",
    priority: "high",
  },
  {
    id: "2",
    title: "Nutricionista Esportivo",
    department: "Esportes",
    location: "Rio de Janeiro, RJ",
    type: "full-time",
    salary: "R$ 6.000 - R$ 9.000",
    description: "Oportunidade para trabalhar com atletas de alto rendimento em nossa academia.",
    requirements: ["CRN ativo", "Experiência com nutrição esportiva", "Conhecimento em suplementação"],
    benefits: ["Vale alimentação", "Plano de saúde", "Academia gratuita"],
    status: "active",
    applications: 15,
    views: 89,
    postedDate: "2024-01-20",
    deadline: "2024-02-20",
    priority: "medium",
  },
  {
    id: "3",
    title: "Coordenador de Nutrição",
    department: "Gestão",
    location: "Belo Horizonte, MG",
    type: "full-time",
    salary: "R$ 10.000 - R$ 15.000",
    description: "Liderar equipe de nutricionistas e desenvolver protocolos nutricionais.",
    requirements: ["CRN ativo", "Experiência em gestão", "Pós-graduação"],
    benefits: ["Vale alimentação", "Plano de saúde", "Participação nos lucros"],
    status: "paused",
    applications: 8,
    views: 67,
    postedDate: "2024-01-10",
    deadline: "2024-02-10",
    priority: "high",
  },
]

export function JobsTab() {
  const [jobs, setJobs] = useState<Job[]>(mockJobs)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isCandidatesModalOpen, setIsCandidatesModalOpen] = useState(false)

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.department.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || job.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "paused":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "closed":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
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

  const handleViewJob = (job: Job) => {
    setSelectedJob(job)
    setIsViewModalOpen(true)
  }

  const handleViewCandidates = (job: Job) => {
    setSelectedJob(job)
    setIsCandidatesModalOpen(true)
  }

  const handleDeleteJob = (jobId: string) => {
    setJobs(jobs.filter((job) => job.id !== jobId))
  }

  const handleToggleStatus = (jobId: string) => {
    setJobs(
      jobs.map((job) =>
        job.id === jobId ? { ...job, status: job.status === "active" ? "paused" : ("active" as any) } : job,
      ),
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1E1D40]">Gerenciar Vagas</h1>
          <p className="text-gray-600">Publique e gerencie suas oportunidades de emprego</p>
        </div>

        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover-lift">
              <Plus className="h-4 w-4 mr-2" />
              Nova Vaga
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Vaga</DialogTitle>
            </DialogHeader>
            <CreateJobForm onClose={() => setIsCreateModalOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Vagas Ativas</p>
                <p className="text-3xl font-bold text-blue-700">
                  {jobs.filter((job) => job.status === "active").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total de Candidaturas</p>
                <p className="text-3xl font-bold text-green-700">
                  {jobs.reduce((sum, job) => sum + job.applications, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Visualizações</p>
                <p className="text-3xl font-bold text-purple-700">{jobs.reduce((sum, job) => sum + job.views, 0)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Eye className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Taxa de Conversão</p>
                <p className="text-3xl font-bold text-orange-700">12%</p>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <Star className="h-6 w-6 text-white" />
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
                  placeholder="Buscar vagas..."
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
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="paused">Pausadas</SelectItem>
                <SelectItem value="closed">Fechadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <div className="grid gap-6">
        {filteredJobs.map((job) => (
          <Card key={job.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover-lift">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-[#1E1D40] mb-2">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          <span>{job.department}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>{job.salary}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span className="capitalize">{job.type.replace("-", " ")}</span>
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewJob(job)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(job.id)}>
                          <Clock className="h-4 w-4 mr-2" />
                          {job.status === "active" ? "Pausar" : "Ativar"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteJob(job.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className={getStatusColor(job.status)}>
                      {job.status === "active" ? "Ativa" : job.status === "paused" ? "Pausada" : "Fechada"}
                    </Badge>
                    <Badge className={getPriorityColor(job.priority)}>
                      Prioridade {job.priority === "high" ? "Alta" : job.priority === "medium" ? "Média" : "Baixa"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{job.applications} candidaturas</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{job.views} visualizações</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Prazo: {new Date(job.deadline).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleViewJob(job)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleViewCandidates(job)}>
                    <Users className="h-4 w-4 mr-2" />
                    Ver Candidatos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Job Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedJob && (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedJob.title}</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Departamento</Label>
                    <p className="text-[#1E1D40] font-semibold">{selectedJob.department}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Localização</Label>
                    <p className="text-[#1E1D40] font-semibold">{selectedJob.location}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Tipo</Label>
                    <p className="text-[#1E1D40] font-semibold capitalize">{selectedJob.type.replace("-", " ")}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Salário</Label>
                    <p className="text-[#1E1D40] font-semibold">{selectedJob.salary}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <Badge className={getStatusColor(selectedJob.status)}>
                      {selectedJob.status === "active"
                        ? "Ativa"
                        : selectedJob.status === "paused"
                          ? "Pausada"
                          : "Fechada"}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Candidaturas</Label>
                    <p className="text-[#1E1D40] font-semibold">{selectedJob.applications}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Visualizações</Label>
                    <p className="text-[#1E1D40] font-semibold">{selectedJob.views}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Prazo</Label>
                    <p className="text-[#1E1D40] font-semibold">
                      {new Date(selectedJob.deadline).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Descrição</Label>
                <p className="text-[#1E1D40] mt-2">{selectedJob.description}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Requisitos</Label>
                <ul className="list-disc list-inside text-[#1E1D40] mt-2 space-y-1">
                  {selectedJob.requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Benefícios</Label>
                <ul className="list-disc list-inside text-[#1E1D40] mt-2 space-y-1">
                  {selectedJob.benefits.map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Job Candidates Modal */}
      <JobCandidatesModal open={isCandidatesModalOpen} onOpenChange={setIsCandidatesModalOpen} job={selectedJob} />
    </div>
  )
}

function CreateJobForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    location: "",
    type: "full-time",
    salary: "",
    description: "",
    requirements: "",
    benefits: "",
    deadline: "",
    priority: "medium",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aqui você implementaria a lógica para salvar a vaga
    console.log("Nova vaga:", formData)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Título da Vaga *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ex: Nutricionista Clínico"
            required
          />
        </div>
        <div>
          <Label htmlFor="department">Departamento *</Label>
          <Input
            id="department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            placeholder="Ex: Saúde"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="location">Localização *</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Ex: São Paulo, SP"
            required
          />
        </div>
        <div>
          <Label htmlFor="type">Tipo de Contrato *</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full-time">Tempo Integral</SelectItem>
              <SelectItem value="part-time">Meio Período</SelectItem>
              <SelectItem value="contract">Contrato</SelectItem>
              <SelectItem value="internship">Estágio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="salary">Faixa Salarial</Label>
          <Input
            id="salary"
            value={formData.salary}
            onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
            placeholder="Ex: R$ 5.000 - R$ 8.000"
          />
        </div>
        <div>
          <Label htmlFor="deadline">Prazo para Candidatura *</Label>
          <Input
            id="deadline"
            type="date"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descrição da Vaga *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descreva as responsabilidades e o que a empresa oferece..."
          rows={4}
          required
        />
      </div>

      <div>
        <Label htmlFor="requirements">Requisitos (um por linha)</Label>
        <Textarea
          id="requirements"
          value={formData.requirements}
          onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
          placeholder="CRN ativo&#10;Experiência mínima de 2 anos&#10;Conhecimento em nutrição clínica"
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="benefits">Benefícios (um por linha)</Label>
        <Textarea
          id="benefits"
          value={formData.benefits}
          onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
          placeholder="Vale alimentação&#10;Plano de saúde&#10;Vale transporte"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="priority">Prioridade</Label>
        <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          Publicar Vaga
        </Button>
      </div>
    </form>
  )
}
