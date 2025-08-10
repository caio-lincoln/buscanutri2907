'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Filter,
  Mail,
  MapPin,
  Calendar,
  Download,
  MessageSquare,
  UserCheck,
  UserX,
  Clock,
  Users,
  Eye,
  Briefcase,
  Loader2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  getCompanyCandidates,
  type CandidateData,
} from '@/lib/company-data-service'
import { useUser } from '@/hooks/use-user'

interface Candidate {
  id: string
  name: string
  email: string
  phone: string
  location: string
  avatar?: string
  status: 'new' | 'reviewing' | 'interview' | 'approved' | 'rejected'
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
    id: '1',
    name: 'Dr. Ana Silva',
    email: 'ana.silva@email.com',
    phone: '(11) 99999-9999',
    location: 'São Paulo, SP',
    status: 'new',
    score: 95,
    appliedDate: '2024-01-20',
    experience: '5 anos',
    education: 'Nutrição - USP',
    specializations: ['Nutrição Clínica', 'Diabetes', 'Obesidade'],
    crn: 'CRN-3 12345',
    jobTitle: 'Nutricionista Clínico Sênior',
    lastActivity: '2 horas atrás',
  },
  {
    id: '2',
    name: 'Dra. Maria Santos',
    email: 'maria.santos@email.com',
    phone: '(11) 88888-8888',
    location: 'São Paulo, SP',
    status: 'reviewing',
    score: 88,
    appliedDate: '2024-01-18',
    experience: '3 anos',
    education: 'Nutrição - UNIFESP',
    specializations: ['Nutrição Esportiva', 'Suplementação'],
    crn: 'CRN-3 23456',
    jobTitle: 'Nutricionista Esportivo',
    lastActivity: '1 dia atrás',
  },
  {
    id: '3',
    name: 'Dr. João Oliveira',
    email: 'joao.oliveira@email.com',
    phone: '(11) 77777-7777',
    location: 'São Paulo, SP',
    status: 'interview',
    score: 92,
    appliedDate: '2024-01-15',
    experience: '7 anos',
    education: 'Nutrição - PUC-SP',
    specializations: ['Nutrição Clínica', 'Geriatria', 'Cardiologia'],
    crn: 'CRN-3 34567',
    jobTitle: 'Coordenador de Nutrição',
    lastActivity: '3 dias atrás',
  },
  {
    id: '4',
    name: 'Dra. Carla Ferreira',
    email: 'carla.ferreira@email.com',
    phone: '(11) 66666-6666',
    location: 'São Paulo, SP',
    status: 'approved',
    score: 97,
    appliedDate: '2024-01-12',
    experience: '8 anos',
    education: 'Nutrição - UNESP',
    specializations: ['Nutrição Clínica', 'Oncologia', 'Terapia Nutricional'],
    crn: 'CRN-3 45678',
    jobTitle: 'Nutricionista Clínico Sênior',
    lastActivity: '1 semana atrás',
  },
  {
    id: '5',
    name: 'Dr. Pedro Costa',
    email: 'pedro.costa@email.com',
    phone: '(11) 55555-5555',
    location: 'São Paulo, SP',
    status: 'rejected',
    score: 65,
    appliedDate: '2024-01-10',
    experience: '2 anos',
    education: 'Nutrição - Anhembi Morumbi',
    specializations: ['Nutrição Clínica'],
    crn: 'CRN-3 56789',
    jobTitle: 'Nutricionista Esportivo',
    lastActivity: '2 semanas atrás',
  },
]

export function CandidatesTab() {
  const { user } = useUser()
  const [candidates, setCandidates] = useState<CandidateData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    async function loadCandidates() {
      if (!user?.companyProfile?.id) return

      try {
        setLoading(true)
        const candidatesData = await getCompanyCandidates(
          user.companyProfile.id
        )
        setCandidates(candidatesData)
      } catch (error) {
        // Silent error handling: Error loading candidates
      } finally {
        setLoading(false)
      }
    }

    loadCandidates()
  }, [user?.companyProfile?.id])

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch =
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.position.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' || candidate.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'novo':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'em_analise':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'entrevista':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'aprovado':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejeitado':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'novo':
        return 'Novo'
      case 'em_analise':
        return 'Em Análise'
      case 'entrevista':
        return 'Entrevista'
      case 'aprovado':
        return 'Aprovado'
      case 'rejeitado':
        return 'Rejeitado'
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    )

    if (diffInMinutes < 1) return 'Agora'
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h atrás`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7)
      return `${diffInDays} dia${diffInDays > 1 ? 's' : ''} atrás`

    return date.toLocaleDateString('pt-BR')
  }

  const statusStats = {
    novo: candidates.filter(c => c.status === 'novo').length,
    em_analise: candidates.filter(c => c.status === 'em_analise').length,
    entrevista: candidates.filter(c => c.status === 'entrevista').length,
    aprovado: candidates.filter(c => c.status === 'aprovado').length,
    rejeitado: candidates.filter(c => c.status === 'rejeitado').length,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[#1E1D40]">Candidatos</h1>
        <Card className="border-0 shadow-lg">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando candidatos...
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
          <h1 className="text-3xl font-bold text-[#1E1D40]">Candidatos</h1>
          <p className="text-gray-600">Gerencie os candidatos às suas vagas</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Novos</p>
                <p className="text-2xl font-bold text-blue-700">
                  {statusStats.novo}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">
                  Em Análise
                </p>
                <p className="text-2xl font-bold text-yellow-700">
                  {statusStats.em_analise}
                </p>
              </div>
              <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                <Eye className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">
                  Entrevista
                </p>
                <p className="text-2xl font-bold text-purple-700">
                  {statusStats.entrevista}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Aprovados</p>
                <p className="text-2xl font-bold text-green-700">
                  {statusStats.aprovado}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Rejeitados</p>
                <p className="text-2xl font-bold text-red-700">
                  {statusStats.rejeitado}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <UserX className="h-5 w-5 text-white" />
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
                  onChange={e => setSearchTerm(e.target.value)}
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
                <SelectItem value="novo">Novos</SelectItem>
                <SelectItem value="em_analise">Em Análise</SelectItem>
                <SelectItem value="entrevista">Entrevista</SelectItem>
                <SelectItem value="aprovado">Aprovados</SelectItem>
                <SelectItem value="rejeitado">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Candidates List */}
      <div className="grid gap-6">
        {filteredCandidates.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {candidates.length === 0
                  ? 'Nenhum candidato encontrado'
                  : 'Nenhum candidato corresponde aos filtros'}
              </h3>
              <p className="text-gray-500">
                {candidates.length === 0
                  ? 'Aguarde candidaturas às suas vagas publicadas.'
                  : 'Tente ajustar os filtros para encontrar os candidatos desejados.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCandidates.map(candidate => (
            <Card
              key={candidate.id}
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover-lift"
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={candidate.avatar}
                        alt={candidate.name}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-lg font-semibold">
                        {candidate.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-3">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                        <div>
                          <h3 className="text-xl font-bold text-[#1E1D40]">
                            {candidate.name}
                          </h3>
                          <p className="text-gray-600 font-medium">
                            {candidate.position}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(candidate.status)}>
                            {getStatusLabel(candidate.status)}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{candidate.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{candidate.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Candidatou-se em: {formatDate(candidate.appliedAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          <span>{candidate.experience}</span>
                        </div>
                      </div>

                      {candidate.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {candidate.skills.map((skill, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            Candidatou-se: {formatTime(candidate.appliedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 w-full lg:w-auto">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full lg:w-auto">
                          Ações
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Perfil Completo
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Baixar Currículo
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Enviar Mensagem
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-green-600">
                          <UserCheck className="h-4 w-4 mr-2" />
                          Aprovar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <UserX className="h-4 w-4 mr-2" />
                          Rejeitar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Mail className="h-4 w-4 mr-2" />
                        Contatar
                      </Button>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
