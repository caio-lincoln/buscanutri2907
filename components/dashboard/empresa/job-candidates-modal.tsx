"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Download,
  MessageSquare,
  UserCheck,
  UserX,
  Clock,
  Star,
  TrendingUp,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  GraduationCap,
  Award,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Candidate {
  id: string
  name: string
  email: string
  phone: string
  location: string
  avatar?: string
  status: "new" | "reviewing" | "interview" | "approved" | "rejected"
  score: number
  appliedDate: string
  experience: string
  education: string
  specializations: string[]
  crn: string
  resumeUrl?: string
  coverLetter?: string
  lastActivity: string
}

interface Job {
  id: string
  title: string
  department: string
  location: string
  applications: number
}

interface JobCandidatesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  job: Job | null
}

const mockCandidates: Candidate[] = [
  {
    id: "1",
    name: "Dr. Ana Silva",
    email: "ana.silva@email.com",
    phone: "(11) 99999-9999",
    location: "São Paulo, SP",
    status: "new",
    score: 95,
    appliedDate: "2024-01-20",
    experience: "5 anos",
    education: "Nutrição - USP",
    specializations: ["Nutrição Clínica", "Diabetes", "Obesidade"],
    crn: "CRN-3 12345",
    lastActivity: "2 horas atrás",
    coverLetter:
      "Tenho grande interesse na vaga e acredito que minha experiência em nutrição clínica pode contribuir significativamente para a equipe.",
  },
  {
    id: "2",
    name: "Dra. Maria Santos",
    email: "maria.santos@email.com",
    phone: "(11) 88888-8888",
    location: "São Paulo, SP",
    status: "reviewing",
    score: 88,
    appliedDate: "2024-01-18",
    experience: "3 anos",
    education: "Nutrição - UNIFESP",
    specializations: ["Nutrição Esportiva", "Suplementação"],
    crn: "CRN-3 23456",
    lastActivity: "1 dia atrás",
    coverLetter: "Sou apaixonada por nutrição esportiva e gostaria de fazer parte da equipe.",
  },
  {
    id: "3",
    name: "Dr. João Oliveira",
    email: "joao.oliveira@email.com",
    phone: "(11) 77777-7777",
    location: "São Paulo, SP",
    status: "interview",
    score: 92,
    appliedDate: "2024-01-15",
    experience: "7 anos",
    education: "Nutrição - PUC-SP",
    specializations: ["Nutrição Clínica", "Geriatria", "Cardiologia"],
    crn: "CRN-3 34567",
    lastActivity: "3 dias atrás",
    coverLetter: "Com minha experiência em nutrição geriátrica, acredito poder agregar muito valor à equipe.",
  },
  {
    id: "4",
    name: "Dra. Carla Ferreira",
    email: "carla.ferreira@email.com",
    phone: "(11) 66666-6666",
    location: "São Paulo, SP",
    status: "approved",
    score: 97,
    appliedDate: "2024-01-12",
    experience: "8 anos",
    education: "Nutrição - UNESP",
    specializations: ["Nutrição Clínica", "Oncologia", "Terapia Nutricional"],
    crn: "CRN-3 45678",
    lastActivity: "1 semana atrás",
    coverLetter:
      "Minha especialização em nutrição oncológica me permite oferecer um cuidado diferenciado aos pacientes.",
  },
  {
    id: "5",
    name: "Dr. Pedro Costa",
    email: "pedro.costa@email.com",
    phone: "(11) 55555-5555",
    location: "São Paulo, SP",
    status: "rejected",
    score: 65,
    appliedDate: "2024-01-10",
    experience: "2 anos",
    education: "Nutrição - Anhembi Morumbi",
    specializations: ["Nutrição Clínica"],
    crn: "CRN-3 56789",
    lastActivity: "2 semanas atrás",
    coverLetter: "Estou em busca de uma oportunidade para crescer profissionalmente na área clínica.",
  },
]

export function JobCandidatesModal({ open, onOpenChange, job }: JobCandidatesModalProps) {
  const [candidates] = useState<Candidate[]>(mockCandidates)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch =
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || candidate.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "reviewing":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "interview":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "new":
        return "Novo"
      case "reviewing":
        return "Em Análise"
      case "interview":
        return "Entrevista"
      case "approved":
        return "Aprovado"
      case "rejected":
        return "Rejeitado"
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <AlertCircle className="h-4 w-4" />
      case "reviewing":
        return <Clock className="h-4 w-4" />
      case "interview":
        return <Calendar className="h-4 w-4" />
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "rejected":
        return <XCircle className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const handleStatusChange = (candidateId: string, newStatus: string) => {
    console.log(`Alterando status do candidato ${candidateId} para ${newStatus}`)
  }

  const handleSelectCandidate = (candidateId: string) => {
    setSelectedCandidates((prev) =>
      prev.includes(candidateId) ? prev.filter((id) => id !== candidateId) : [...prev, candidateId],
    )
  }

  const handleSelectAll = () => {
    if (selectedCandidates.length === filteredCandidates.length) {
      setSelectedCandidates([])
    } else {
      setSelectedCandidates(filteredCandidates.map((c) => c.id))
    }
  }

  const handleViewProfile = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setIsProfileModalOpen(true)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-yellow-600"
    if (score >= 70) return "text-orange-600"
    return "text-red-600"
  }

  const statusStats = {
    new: candidates.filter((c) => c.status === "new").length,
    reviewing: candidates.filter((c) => c.status === "reviewing").length,
    interview: candidates.filter((c) => c.status === "interview").length,
    approved: candidates.filter((c) => c.status === "approved").length,
    rejected: candidates.filter((c) => c.status === "rejected").length,
  }

  if (!job) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl">Candidatos - {job.title}</DialogTitle>
            <p className="text-gray-600">
              {job.applications} candidaturas • {job.department} • {job.location}
            </p>
          </DialogHeader>

          <Tabs defaultValue="candidates" className="flex-1 overflow-hidden">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="candidates">Candidatos</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="actions">Ações em Massa</TabsTrigger>
            </TabsList>

            <TabsContent value="candidates" className="space-y-4 overflow-hidden">
              {/* Stats Cards */}
              <div className="grid grid-cols-5 gap-4">
                <Card className="border-0 shadow-sm bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">Novos</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">{statusStats.new}</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-yellow-50">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-600">Em Análise</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-700">{statusStats.reviewing}</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-purple-50">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-600">Entrevista</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-700">{statusStats.interview}</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-green-50">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Aprovados</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">{statusStats.approved}</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-red-50">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-600">Rejeitados</span>
                    </div>
                    <p className="text-2xl font-bold text-red-700">{statusStats.rejected}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar candidatos..."
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
                    <SelectItem value="new">Novos</SelectItem>
                    <SelectItem value="reviewing">Em Análise</SelectItem>
                    <SelectItem value="interview">Entrevista</SelectItem>
                    <SelectItem value="approved">Aprovados</SelectItem>
                    <SelectItem value="rejected">Rejeitados</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedCandidates.length === filteredCandidates.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-gray-600">
                    {selectedCandidates.length > 0 && `${selectedCandidates.length} selecionados`}
                  </span>
                </div>
              </div>

              {/* Candidates List */}
              <div className="space-y-4 overflow-y-auto max-h-96">
                {filteredCandidates.map((candidate) => (
                  <Card key={candidate.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <Checkbox
                            checked={selectedCandidates.includes(candidate.id)}
                            onCheckedChange={() => handleSelectCandidate(candidate.id)}
                          />
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={candidate.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                              {candidate.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-[#1E1D40] text-lg">{candidate.name}</h3>
                              <Badge className={getStatusColor(candidate.status)}>
                                {getStatusIcon(candidate.status)}
                                <span className="ml-1">{getStatusLabel(candidate.status)}</span>
                              </Badge>
                              <div className="flex items-center gap-1">
                                <Star className={`h-4 w-4 ${getScoreColor(candidate.score)}`} />
                                <span className={`font-semibold ${getScoreColor(candidate.score)}`}>
                                  {candidate.score}%
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                <span>{candidate.email}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                <span>{candidate.phone}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <span>{candidate.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Aplicou em {new Date(candidate.appliedDate).toLocaleDateString("pt-BR")}</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {candidate.specializations.map((spec, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewProfile(candidate)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Perfil
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                Ações
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleStatusChange(candidate.id, "reviewing")}>
                                <Clock className="h-4 w-4 mr-2" />
                                Mover para Análise
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(candidate.id, "interview")}>
                                <Calendar className="h-4 w-4 mr-2" />
                                Agendar Entrevista
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(candidate.id, "approved")}>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Aprovar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Enviar Mensagem
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Baixar Currículo
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(candidate.id, "rejected")}
                                className="text-red-600 hover:text-red-700"
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Rejeitar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Funil de Conversão
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Candidaturas</span>
                        <span className="font-bold">{candidates.length}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: "100%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Em Análise</span>
                        <span className="font-bold">{statusStats.reviewing}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-600 h-2 rounded-full"
                          style={{ width: `${(statusStats.reviewing / candidates.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Entrevistas</span>
                        <span className="font-bold">{statusStats.interview}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${(statusStats.interview / candidates.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Aprovados</span>
                        <span className="font-bold">{statusStats.approved}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${(statusStats.approved / candidates.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Top Candidatos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {candidates
                      .sort((a, b) => b.score - a.score)
                      .slice(0, 5)
                      .map((candidate, index) => (
                        <div key={candidate.id} className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={candidate.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-semibold">
                              {candidate.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{candidate.name}</p>
                            <p className="text-xs text-gray-600">{candidate.experience} de experiência</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className={`h-4 w-4 ${getScoreColor(candidate.score)}`} />
                            <span className={`font-semibold text-sm ${getScoreColor(candidate.score)}`}>
                              {candidate.score}%
                            </span>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="actions" className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Ações em Massa
                  </CardTitle>
                  <p className="text-sm text-gray-600">{selectedCandidates.length} candidatos selecionados</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Alterar Status</h3>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full justify-start bg-transparent"
                          disabled={selectedCandidates.length === 0}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Mover para Análise
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start bg-transparent"
                          disabled={selectedCandidates.length === 0}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Agendar Entrevistas
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start bg-transparent"
                          disabled={selectedCandidates.length === 0}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Aprovar Candidatos
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-red-600 hover:text-red-700 bg-transparent"
                          disabled={selectedCandidates.length === 0}
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Rejeitar Candidatos
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold">Enviar Email em Massa</h3>
                      <div className="space-y-3">
                        <Input placeholder="Assunto do email" />
                        <Textarea placeholder="Mensagem..." rows={4} />
                        <Button className="w-full" disabled={selectedCandidates.length === 0}>
                          <Mail className="h-4 w-4 mr-2" />
                          Enviar para {selectedCandidates.length} candidatos
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Candidate Profile Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedCandidate && (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedCandidate.name}</DialogTitle>
                <div className="flex items-center gap-4">
                  <Badge className={getStatusColor(selectedCandidate.status)}>
                    {getStatusIcon(selectedCandidate.status)}
                    <span className="ml-1">{getStatusLabel(selectedCandidate.status)}</span>
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Star className={`h-4 w-4 ${getScoreColor(selectedCandidate.score)}`} />
                    <span className={`font-semibold ${getScoreColor(selectedCandidate.score)}`}>
                      {selectedCandidate.score}% de compatibilidade
                    </span>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Informações Pessoais
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Email</label>
                          <p className="text-[#1E1D40] font-semibold">{selectedCandidate.email}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Telefone</label>
                          <p className="text-[#1E1D40] font-semibold">{selectedCandidate.phone}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Localização</label>
                          <p className="text-[#1E1D40] font-semibold">{selectedCandidate.location}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">CRN</label>
                          <p className="text-[#1E1D40] font-semibold">{selectedCandidate.crn}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Formação e Experiência
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Formação</label>
                        <p className="text-[#1E1D40] font-semibold">{selectedCandidate.education}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Experiência</label>
                        <p className="text-[#1E1D40] font-semibold">{selectedCandidate.experience}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Especializações
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.specializations.map((spec, index) => (
                          <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {selectedCandidate.coverLetter && (
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          Carta de Apresentação
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-[#1E1D40]">{selectedCandidate.coverLetter}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="space-y-6">
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle>Ações</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full bg-transparent" variant="outline">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Enviar Mensagem
                      </Button>
                      <Button className="w-full bg-transparent" variant="outline">
                        <Calendar className="h-4 w-4 mr-2" />
                        Agendar Entrevista
                      </Button>
                      <Button className="w-full bg-transparent" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Baixar Currículo
                      </Button>
                      <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                        <UserCheck className="h-4 w-4 mr-2" />
                        Aprovar Candidato
                      </Button>
                      <Button
                        className="w-full bg-transparent"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Rejeitar Candidato
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle>Histórico</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm">
                        <p className="font-medium">Candidatura enviada</p>
                        <p className="text-gray-600">
                          {new Date(selectedCandidate.appliedDate).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="text-sm">
                        <p className="font-medium">Última atividade</p>
                        <p className="text-gray-600">{selectedCandidate.lastActivity}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
