"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
  Loader2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { JobCandidatesModal } from "./job-candidates-modal"
import { getCompanyJobs, createCompanyJob, type JobData } from "@/lib/company-data-service"
import { useUser } from "@/hooks/use-user"

export function JobsTab() {
  const { user } = useUser()
  const [jobs, setJobs] = useState<JobData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobData | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isCandidatesModalOpen, setIsCandidatesModalOpen] = useState(false)

  useEffect(() => {
    async function loadJobs() {
      if (!user?.companyProfile?.id) return
      
      try {
        setLoading(true)
        const jobsData = await getCompanyJobs(user.companyProfile.id)
        setJobs(jobsData)
      } catch (error) {
        console.error("Erro ao carregar vagas:", error)
      } finally {
        setLoading(false)
      }
    }

    loadJobs()
  }, [user?.companyProfile?.id])

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || job.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativo":
        return "bg-green-100 text-green-800 border-green-200"
      case "pausado":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "finalizado":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleViewJob = (job: JobData) => {
    setSelectedJob(job)
    setIsViewModalOpen(true)
  }

  const handleViewCandidates = (job: JobData) => {
    setSelectedJob(job)
    setIsCandidatesModalOpen(true)
  }

  const handleDeleteJob = (jobId: string) => {
    setJobs(jobs.filter((job) => job.id !== jobId))
  }

  const handleToggleStatus = (jobId: string) => {
    setJobs(
      jobs.map((job) =>
        job.id === jobId ? { ...job, status: job.status === "ativo" ? "pausado" : "ativo" } : job,
      ),
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[#1E1D40]">Gerenciar Vagas</h1>
        <Card className="border-0 shadow-lg">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando vagas...
            </div>
          </CardContent>
        </Card>
      </div>
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
            <CreateJobForm 
              onClose={() => setIsCreateModalOpen(false)} 
              onJobCreated={async () => {
                if (user?.companyProfile?.id) {
                  const jobsData = await getCompanyJobs(user.companyProfile.id)
                  setJobs(jobsData)
                }
              }}
            />
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
                  {jobs.filter((job) => job.status === "ativo").length}
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
                  {jobs.reduce((sum, job) => sum + job.applicationsCount, 0)}
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
                <p className="text-sm font-medium text-purple-600">Total de Vagas</p>
                <p className="text-3xl font-bold text-purple-700">{jobs.length}</p>
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
                <p className="text-3xl font-bold text-orange-700">
                  {jobs.length > 0 ? Math.round((jobs.reduce((sum, job) => sum + job.applicationsCount, 0) / jobs.length) * 100) / 100 : 0}%
                </p>
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
                <SelectItem value="ativo">Ativas</SelectItem>
                <SelectItem value="pausado">Pausadas</SelectItem>
                <SelectItem value="finalizado">Finalizadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <div className="grid gap-6">
        {filteredJobs.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {jobs.length === 0 ? "Nenhuma vaga cadastrada" : "Nenhuma vaga encontrada"}
              </h3>
              <p className="text-gray-500 mb-4">
                {jobs.length === 0 
                  ? "Comece criando sua primeira vaga de emprego."
                  : "Tente ajustar os filtros para encontrar as vagas desejadas."
                }
              </p>
              {jobs.length === 0 && (
                <Button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Vaga
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredJobs.map((job) => (
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
                            <span>{job.company}</span>
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
                            <span className="capitalize">{job.type}</span>
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
                            {job.status === "ativo" ? "Pausar" : "Ativar"}
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
                        {job.status === "ativo" ? "Ativa" : job.status === "pausado" ? "Pausada" : "Finalizada"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{job.applicationsCount} candidaturas</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Criada em: {formatDate(job.createdAt)}</span>
                      </div>
                      {job.expiresAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Expira em: {formatDate(job.expiresAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewJob(job)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleViewCandidates(job)}>
                      <Users className="h-4 w-4 mr-2" />
                      Ver Candidatos ({job.applicationsCount})
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Job Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Vaga</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-[#1E1D40] mb-2">{selectedJob.title}</h3>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    <span>{selectedJob.company}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedJob.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span>{selectedJob.salary}</span>
                  </div>
                </div>
                <Badge className={getStatusColor(selectedJob.status)}>
                  {selectedJob.status === "ativo" ? "Ativa" : selectedJob.status === "pausado" ? "Pausada" : "Finalizada"}
                </Badge>
              </div>

              <div>
                <h4 className="font-semibold text-[#1E1D40] mb-2">Descrição</h4>
                <p className="text-gray-600">{selectedJob.description}</p>
              </div>

              {selectedJob.requirements.length > 0 && (
                <div>
                  <h4 className="font-semibold text-[#1E1D40] mb-2">Requisitos</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {selectedJob.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedJob.benefits.length > 0 && (
                <div>
                  <h4 className="font-semibold text-[#1E1D40] mb-2">Benefícios</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {selectedJob.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Candidaturas:</span> {selectedJob.applicationsCount}
                </div>
                <div>
                  <span className="font-medium">Criada em:</span> {formatDate(selectedJob.createdAt)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Candidates Modal */}
      {selectedJob && (
        <JobCandidatesModal
          isOpen={isCandidatesModalOpen}
          onClose={() => setIsCandidatesModalOpen(false)}
          job={selectedJob}
        />
      )}
    </div>
  )
}

function CreateJobForm({ onClose, onJobCreated }: { onClose: () => void; onJobCreated: () => void }) {
  const { user } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    description: '',
    jobType: 'CLT',
    level: 'Pleno',
    salaryMin: '',
    salaryMax: '',
    requirements: '',
    benefits: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.companyProfile?.id) {
      alert('Erro: Perfil da empresa não encontrado')
      return
    }

    if (!formData.title || !formData.location || !formData.description) {
      alert('Por favor, preencha todos os campos obrigatórios')
      return
    }

    setIsSubmitting(true)

    try {
      const jobData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        jobType: formData.jobType,
        level: formData.level,
        salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : undefined,
        salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : undefined,
        requirements: formData.requirements ? formData.requirements.split('\n').filter(req => req.trim()) : [],
        benefits: formData.benefits ? formData.benefits.split('\n').filter(benefit => benefit.trim()) : []
      }

      const result = await createCompanyJob(user.companyProfile.id, jobData)

      if (result.success) {
        alert('Vaga criada com sucesso!')
        onJobCreated()
        onClose()
      } else {
        alert(`Erro ao criar vaga: ${result.error}`)
      }
    } catch (error) {
      console.error('Error creating job:', error)
      alert('Erro interno. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Título da Vaga *</Label>
        <Input 
          id="title" 
          placeholder="Ex: Nutricionista Clínico" 
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="location">Localização *</Label>
          <Input 
            id="location" 
            placeholder="Ex: São Paulo, SP" 
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="jobType">Tipo de Contrato</Label>
          <Select value={formData.jobType} onValueChange={(value) => setFormData(prev => ({ ...prev, jobType: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CLT">CLT</SelectItem>
              <SelectItem value="PJ">PJ</SelectItem>
              <SelectItem value="Estágio">Estágio</SelectItem>
              <SelectItem value="Freelance">Freelance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="level">Nível</Label>
          <Select value={formData.level} onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Júnior">Júnior</SelectItem>
              <SelectItem value="Pleno">Pleno</SelectItem>
              <SelectItem value="Sênior">Sênior</SelectItem>
              <SelectItem value="Especialista">Especialista</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Salário (opcional)</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input 
              placeholder="Mín" 
              type="number"
              value={formData.salaryMin}
              onChange={(e) => setFormData(prev => ({ ...prev, salaryMin: e.target.value }))}
            />
            <Input 
              placeholder="Máx" 
              type="number"
              value={formData.salaryMax}
              onChange={(e) => setFormData(prev => ({ ...prev, salaryMax: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descrição *</Label>
        <Textarea 
          id="description" 
          placeholder="Descreva a vaga, responsabilidades e o que a empresa oferece..." 
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={4}
          required
        />
      </div>

      <div>
        <Label htmlFor="requirements">Requisitos (um por linha)</Label>
        <Textarea 
          id="requirements" 
          placeholder="Ex:&#10;Graduação em Nutrição&#10;CRN ativo&#10;Experiência em atendimento clínico" 
          value={formData.requirements}
          onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="benefits">Benefícios (um por linha)</Label>
        <Textarea 
          id="benefits" 
          placeholder="Ex:&#10;Vale alimentação&#10;Plano de saúde&#10;Horário flexível" 
          value={formData.benefits}
          onChange={(e) => setFormData(prev => ({ ...prev, benefits: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Criando...
            </>
          ) : (
            'Criar Vaga'
          )}
        </Button>
      </div>
    </form>
  )
}
