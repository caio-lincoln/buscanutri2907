"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Users,
  Eye,
  Briefcase,
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
  jobTitle: string
  lastActivity: string
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
    jobTitle: "Nutricionista Clínico Sênior",
    lastActivity: "2 horas atrás",
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
    jobTitle: "Nutricionista Esportivo",
    lastActivity: "1 dia atrás",
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
    jobTitle: "Coordenador de Nutrição",
    lastActivity: "3 dias atrás",
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
    jobTitle: "Nutricionista Clínico Sênior",
    lastActivity: "1 semana atrás",
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
    jobTitle: "Nutricionista Esportivo",
    lastActivity: "2 semanas atrás",
  },
]

export function CandidatesTab() {
  const [candidates] = useState<Candidate[]>(mockCandidates)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch =
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1E1D40]">Candidatos</h1>
          <p className="text-gray-600">Gerencie todos os candidatos das suas vagas</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Novos</p>
                <p className="text-3xl font-bold text-blue-700">{statusStats.new}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Em Análise</p>
                <p className="text-3xl font-bold text-yellow-700">{statusStats.reviewing}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Entrevistas</p>
                <p className="text-3xl font-bold text-purple-700">{statusStats.interview}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Aprovados</p>
                <p className="text-3xl font-bold text-green-700">{statusStats.approved}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Rejeitados</p>
                <p className="text-3xl font-bold text-red-700">{statusStats.rejected}</p>
              </div>
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                <UserX className="h-6 w-6 text-white" />
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
          </div>
        </CardContent>
      </Card>

      {/* Candidates List */}
      <div className="grid gap-6">
        {filteredCandidates.map((candidate) => (
          <Card
            key={candidate.id}
            className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover-lift"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={candidate.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-lg">
                      {candidate.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-[#1E1D40] text-xl">{candidate.name}</h3>
                      <Badge className={getStatusColor(candidate.status)}>{getStatusLabel(candidate.status)}</Badge>
                      <div className="flex items-center gap-1">
                        <Star className={`h-4 w-4 ${getScoreColor(candidate.score)}`} />
                        <span className={`font-semibold ${getScoreColor(candidate.score)}`}>{candidate.score}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700 font-medium">{candidate.jobTitle}</span>
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
                        <GraduationCap className="h-4 w-4" />
                        <span>{candidate.education}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        <span>{candidate.experience}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {candidate.specializations.map((spec, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {spec}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Aplicou em {new Date(candidate.appliedDate).toLocaleDateString("pt-BR")}</span>
                      <span>•</span>
                      <span>Última atividade: {candidate.lastActivity}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
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
                      <DropdownMenuItem>
                        <Clock className="h-4 w-4 mr-2" />
                        Mover para Análise
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Calendar className="h-4 w-4 mr-2" />
                        Agendar Entrevista
                      </DropdownMenuItem>
                      <DropdownMenuItem>
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
                      <DropdownMenuItem className="text-red-600 hover:text-red-700">
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
    </div>
  )
}
