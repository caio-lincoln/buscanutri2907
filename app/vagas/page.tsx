'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  MapPin,
  Filter,
  ArrowLeft,
  Building,
  Clock,
  DollarSign,
  Briefcase,
  Users,
  Plus,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { JobDetailsModal } from '@/components/job-details-modal'
import { useAuth } from '@/contexts/auth-context'
import { toast } from '@/components/ui/use-toast'

interface JobPosting {
  id: string
  title: string
  description: string
  requirements: string[]
  benefits: string[]
  salary_min?: number
  salary_max?: number
  location: string
  job_type: 'CLT' | 'PJ' | 'Estágio' | 'Freelancer'
  level: 'Estagiário' | 'Júnior' | 'Pleno' | 'Sênior' | 'Gerente'
  status: 'ativa' | 'pausada' | 'fechada'
  applications_count: number
  created_at: string
  company_id: string
  company_profiles?: {
    company_name: string
    logo_url?: string
  } | null
}

export default function VagasPage() {
  const { user, loading: authLoading } = useAuth()
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filterJobs = useCallback(() => {
    let filtered = jobs

    if (searchTerm) {
      filtered = filtered.filter(
        job =>
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (job.company_profiles?.company_name?.toLowerCase() ?? '').includes(
            searchTerm.toLowerCase()
          ) ||
          job.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (locationFilter) {
      filtered = filtered.filter(job =>
        job.location.toLowerCase().includes(locationFilter.toLowerCase())
      )
    }

    if (levelFilter) {
      filtered = filtered.filter(
        job => job.level.toLowerCase() === levelFilter.toLowerCase()
      )
    }

    setFilteredJobs(filtered)
  }, [jobs, searchTerm, locationFilter, levelFilter])

  useEffect(() => {
    loadJobs()
  }, [])

  useEffect(() => {
    filterJobs()
  }, [filterJobs])

  const loadJobs = async () => {
    try {
      // Buscar vagas ativas da tabela job_postings com join para company_profiles
      const { data, error } = await supabase
        .from('job_postings')
        .select(
          `
          id,
          title,
          description,
          requirements,
          benefits,
          salary_min,
          salary_max,
          location,
          job_type,
          level,
          status,
          created_at,
          company_id,
          company_profiles (
            company_name,
            logo_url
          )
        `
        )
        .eq('status', 'ativa')
        .order('created_at', { ascending: false })

      if (error) {
        // Error loading jobs - handled silently
        throw error
      }

      // Contar candidaturas para cada vaga
      const jobsWithApplicationCount = await Promise.all(
        (data || []).map(async job => {
          const { count } = await supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', job.id)

          return {
            ...job,
            applications_count: count || 0,
          }
        })
      )

      setJobs(jobsWithApplicationCount)
    } catch (error) {
      // Error loading jobs - handled silently
      // Em caso de erro, mostrar dados mock para demonstração
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setLocationFilter('')
    setLevelFilter('')
  }

  const handleApply = async (jobId: string) => {
    try {
      if (!user) {
        toast.error('Para se candidatar, você precisa estar logado.')
        return
      }

      // Verificar se o usuário é nutricionista
      if (user.user_type !== 'nutricionista') {
        toast.error('Apenas nutricionistas podem se candidatar às vagas.')
        return
      }

      // Verificar se já se candidatou
      const { data: existingApplication } = await supabase
        .from('job_applications')
        .select('id')
        .eq('job_id', jobId)
        .eq('candidate_id', user.id)
        .single()

      if (existingApplication) {
        toast.warning('Você já se candidatou a esta vaga!')
        return
      }

      // Criar candidatura na tabela job_applications
      const { error } = await supabase.from('job_applications').insert({
        job_id: jobId,
        candidate_id: user.id,
        status: 'pendente',
        applied_at: new Date().toISOString(),
      })

      if (error) throw error

      toast.success(
        'Candidatura enviada com sucesso. Você pode acompanhar na aba Candidaturas.',
        {
          action: {
            label: 'Ver Candidaturas',
            onClick: () => {
              // Redirecionar para a aba de candidaturas no dashboard
              window.location.href = '/dashboard/nutricionistas?tab=candidaturas'
            },
          },
          duration: 5000,
        }
      )
      loadJobs() // Recarregar para atualizar contador
    } catch (error) {
      // Error applying to job - handled silently
      toast.error('Erro ao enviar candidatura. Tente novamente.')
    }
  }

  const handleViewDetails = (job: JobPosting) => {
    setSelectedJob(job)
    setIsModalOpen(true)
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2E6D8]/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E1D40] mx-auto mb-4"></div>
          <p className="text-[#1E1D40]/70">Carregando vagas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F2E6D8]/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo-busca-nutri.png"
              alt="Busca Nutri"
              width={140}
              height={28}
              className="h-6 w-auto transition-transform duration-300 hover:scale-105"
              unoptimized
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/nutricionistas"
              className="text-sm font-medium text-[#1E1D40]/70 hover:text-[#4AB0D9] transition-all duration-300"
            >
              Nutricionistas
            </Link>
            <Link
              href="/vagas"
              className="text-sm font-medium text-[#1E1D40] relative"
            >
              Vagas
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#1E1D40]"></span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                className="hidden md:flex text-[#1E1D40] hover:text-[#4AB0D9]"
              >
                Entrar
              </Button>
            </Link>
            <Link href="/cadastro">
              <Button className="bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white">
                Cadastrar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container px-4 md:px-6 py-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#1E1D40]/70 hover:text-[#4AB0D9] transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao início
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1E1D40] mb-2">
            Oportunidades de Emprego
          </h1>
          <p className="text-lg text-[#1E1D40]/70 mb-2">
            Encontre a vaga ideal para sua carreira em nutrição
          </p>
          <div className="flex items-center gap-2 text-sm text-orange-600">
            <span>!</span>
            <span>Faça login para ver salários e nomes das empresas</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
          <div className="flex-1">
            <Input
              placeholder="Buscar por cargo ou palavra-chave..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-12"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="h-12 px-6"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button className="bg-[#1E1D40] hover:bg-[#1E1D40]/90 h-12 px-8">
            <Search className="h-5 w-5 mr-2" />
            Buscar
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="mb-8 max-w-4xl mx-auto">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#1E1D40] mb-2 block">
                    Região
                  </label>
                  <Input
                    placeholder="Cidade, Estado"
                    value={locationFilter}
                    onChange={e => setLocationFilter(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E1D40] mb-2 block">
                    Nível da Vaga
                  </label>
                  <select
                    value={levelFilter}
                    onChange={e => setLevelFilter(e.target.value)}
                    className="w-full h-10 px-3 border border-gray-300 rounded-md"
                  >
                    <option value="">Todos os níveis</option>
                    <option value="estagiário">Estagiário</option>
                    <option value="júnior">Júnior</option>
                    <option value="pleno">Pleno</option>
                    <option value="sênior">Sênior</option>
                    <option value="gerente">Gerente</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full bg-transparent"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        <div className="mb-6 text-center">
          <p className="text-[#1E1D40]/70">
            {filteredJobs.length} vaga(s) encontrada(s) • Página 1 de 1
          </p>
        </div>

        {/* Jobs Grid - Centralizado e Enquadrado 3x3 */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 place-items-center">
            {filteredJobs.map(job => (
              <Card
                key={job.id}
                className="w-full max-w-sm hover:shadow-lg transition-shadow flex flex-col h-[520px]"
              >
                {/* Header fixo */}
                <CardHeader className="pb-3 flex-shrink-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-[#1E1D40] rounded-lg flex items-center justify-center flex-shrink-0">
                      {job.company_profiles?.logo_url ? (
                        <Image
                          src={
                            job.company_profiles.logo_url || '/placeholder.svg'
                          }
                          alt={
                            job.company_profiles.company_name ??
                            'Logo da empresa'
                          }
                          width={40}
                          height={40}
                          className="rounded-lg object-cover"
                          unoptimized
                        />
                      ) : (
                        <Building className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs font-medium">
                      {job.level}
                    </Badge>
                  </div>

                  <div>
                    <CardTitle className="text-base text-[#1E1D40] mb-1 leading-tight h-12 flex items-center">
                      <span className="line-clamp-2">{job.title}</span>
                    </CardTitle>
                    <p className="text-sm text-orange-600 font-medium truncate">
                      {job.company_profiles?.company_name ??
                        'Empresa confidencial'}
                    </p>
                  </div>
                </CardHeader>

                {/* Conteúdo flexível */}
                <CardContent className="px-6 pb-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Informações principais */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#1E1D40]/70 flex-shrink-0" />
                        <span className="text-[#1E1D40]/70 truncate">
                          {job.location}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-[#1E1D40]/70 flex-shrink-0" />
                        <span className="text-orange-600 font-medium text-xs">
                          Faça login para ver
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-[#1E1D40]/70 flex-shrink-0" />
                        <span className="text-[#1E1D40]/70">
                          {job.job_type}
                        </span>
                      </div>
                    </div>

                    {/* Benefits */}
                    {job.benefits && job.benefits.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {job.benefits.slice(0, 2).map((benefit, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs px-2 py-1"
                          >
                            {truncateText(benefit, 12)}
                          </Badge>
                        ))}
                        {job.benefits.length > 2 && (
                          <Badge
                            variant="secondary"
                            className="text-xs px-2 py-1"
                          >
                            +{job.benefits.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Description */}
                    <div className="h-16 overflow-hidden">
                      <p className="text-sm text-[#1E1D40]/80 leading-relaxed line-clamp-3">
                        {job.description}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-[#1E1D40]/60 pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{job.applications_count} candidatos</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          Publicada em{' '}
                          {new Date(job.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - Sempre no final */}
                  <div className="space-y-2 pt-4 mt-auto">
                    <Button
                      variant="outline"
                      className="w-full text-sm h-9 bg-transparent border-[#1E1D40]/20 hover:bg-[#1E1D40]/5"
                      onClick={() => handleViewDetails(job)}
                    >
                      Ver Detalhes
                    </Button>
                    <Button
                      className="w-full bg-[#1E1D40] hover:bg-[#1E1D40]/90 text-white text-sm h-9"
                      onClick={() => handleApply(job.id)}
                    >
                      Entrar para Candidatar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#1E1D40]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-[#1E1D40]" />
            </div>
            <h3 className="text-lg font-semibold text-[#1E1D40] mb-2">
              Nenhuma vaga encontrada
            </h3>
            <p className="text-[#1E1D40]/70 mb-4">
              Tente ajustar os filtros ou buscar por outros termos
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </div>
        )}
      </main>

      {/* Modal de Detalhes */}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedJob(null)
          }}
        />
      )}
    </div>
  )
}
