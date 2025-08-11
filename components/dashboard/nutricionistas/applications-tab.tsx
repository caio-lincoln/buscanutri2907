'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  ArrowRight,
  Building,
  Calendar,
  Eye,
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface JobApplication {
  id: string
  status: string
  applied_at: string
  cover_letter?: string
  job_postings: {
    id: string
    title: string
    description: string
    location: string
    job_type: string
    salary_min?: number
    salary_max?: number
    created_at: string
    company_profiles: {
      company_name: string
      logo_url?: string
    } | null
  } | null
}

// Tipo para os dados retornados pelo Supabase
interface SupabaseJobApplication {
  id: any
  status: any
  applied_at: any
  cover_letter: any
  job_postings: {
    id: any
    title: any
    description: any
    location: any
    job_type: any
    salary_min: any
    salary_max: any
    created_at: any
    company_profiles: {
      company_name: any
      logo_url: any
    }[]
  }[]
}

export function ApplicationsTab() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      loadApplications()
    }
  }, [user])

  const loadApplications = async () => {
    try {
      setLoading(true)
      const supabase = createSupabaseClient()

      // Primeiro, buscar o perfil do nutricionista
      const { data: nutritionistProfile, error: profileError } = await supabase
        .from('nutritionist_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      if (profileError) {
        // Silent error handling - error fetching nutritionist profile
        toast.error('Erro ao carregar perfil do nutricionista')
        return
      }

      if (!nutritionistProfile) {
        toast.error('Perfil de nutricionista não encontrado')
        return
      }

      // Buscar candidaturas do nutricionista
      const { data: applicationsData, error: applicationsError } =
        await supabase
          .from('job_applications')
          .select(
            `
          id,
          status,
          applied_at,
          cover_letter,
          job_postings (
            id,
            title,
            description,
            location,
            job_type,
            salary_min,
            salary_max,
            created_at,
            company_profiles (
              company_name,
              logo_url
            )
          )
        `
          )
          .eq('candidate_id', nutritionistProfile.id)
          .order('applied_at', { ascending: false })

      if (applicationsError) {
        // Silent error handling - error fetching applications
        toast.error('Erro ao carregar candidaturas')
        return
      }

      // Transformar os dados do Supabase para o formato correto
      const transformedApplications: JobApplication[] = (
        applicationsData || []
      ).map((app: any) => ({
        id: app.id,
        status: app.status,
        applied_at: app.applied_at,
        cover_letter: app.cover_letter,
        job_postings: app.job_postings
          ? {
              id: app.job_postings.id,
              title: app.job_postings.title,
              description: app.job_postings.description,
              location: app.job_postings.location,
              job_type: app.job_postings.job_type,
              salary_min: app.job_postings.salary_min,
              salary_max: app.job_postings.salary_max,
              created_at: app.job_postings.created_at,
              company_profiles: app.job_postings.company_profiles
                ? {
                    company_name:
                      app.job_postings.company_profiles.company_name,
                    logo_url: app.job_postings.company_profiles.logo_url,
                  }
                : null,
            }
          : null,
      }))

      setApplications(transformedApplications)
    } catch (error) {
      // Silent error handling - error loading applications
      toast.error('Erro ao carregar candidaturas')
    } finally {
      setLoading(false)
    }
  }

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'A combinar'
    if (min && max)
      return `R$ ${min.toLocaleString()} - R$ ${max.toLocaleString()}`
    if (min) return `A partir de R$ ${min.toLocaleString()}`
    if (max) return `Até R$ ${max.toLocaleString()}`
    return 'A combinar'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Pendente
          </Badge>
        )
      case 'em_analise':
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Em Análise
          </Badge>
        )
      case 'aprovado':
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Aprovado
          </Badge>
        )
      case 'rejeitado':
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Rejeitado
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'Sua candidatura foi enviada e está aguardando análise.'
      case 'em_analise':
        return 'Sua candidatura está sendo analisada pela empresa.'
      case 'aprovado':
        return 'Parabéns! Sua candidatura foi aprovada.'
      case 'rejeitado':
        return 'Infelizmente sua candidatura não foi selecionada desta vez.'
      default:
        return 'Status da candidatura.'
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">
              Minhas Candidaturas
            </h1>
            <p className="text-gray-600">
              Acompanhe o status das suas candidaturas às vagas.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">
            Minhas Candidaturas
          </h1>
          <p className="text-gray-600">
            Acompanhe o status das suas candidaturas às vagas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {applications.length} candidatura
            {applications.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-[#1E1D40]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="h-8 w-8 text-[#1E1D40]" />
          </div>
          <h3 className="text-lg font-semibold text-[#1E1D40] mb-2">
            Nenhuma candidatura encontrada
          </h3>
          <p className="text-[#1E1D40]/70 mb-6">
            Você ainda não se candidatou a nenhuma vaga. Explore as
            oportunidades disponíveis!
          </p>
          <Button
            className="bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white"
            onClick={() => router.push('/vagas')}
          >
            <Briefcase className="h-4 w-4 mr-2" />
            Ver Vagas Disponíveis
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map(application => {
            const jobPosting = application.job_postings
            const companyProfile = jobPosting?.company_profiles

            if (!jobPosting) return null

            return (
              <Card
                key={application.id}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <CardHeader className="flex flex-row items-start justify-between pb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-[#1E1D40] rounded-lg flex items-center justify-center flex-shrink-0">
                      {companyProfile?.logo_url ? (
                        <Image
                          src={companyProfile.logo_url}
                          alt={companyProfile.company_name || 'Logo da empresa'}
                          width={48}
                          height={48}
                          className="rounded-lg object-cover"
                          unoptimized
                        />
                      ) : (
                        <Building className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl font-bold text-[#1E1D40] mb-1">
                        {jobPosting.title}
                      </CardTitle>
                      <p className="text-gray-700 font-medium mb-2">
                        {companyProfile?.company_name || 'Empresa confidencial'}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{jobPosting.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>
                            {formatSalary(
                              jobPosting.salary_min,
                              jobPosting.salary_max
                            )}
                          </span>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-700"
                        >
                          {jobPosting.job_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(application.status)}
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(application.applied_at)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Status da candidatura:
                    </p>
                    <p className="text-sm text-gray-800">
                      {getStatusDescription(application.status)}
                    </p>
                  </div>

                  {application.cover_letter && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-blue-900 mb-2">
                        Carta de apresentação:
                      </p>
                      <p className="text-sm text-blue-800 line-clamp-3">
                        {application.cover_letter}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Candidatura enviada em{' '}
                      {formatDate(application.applied_at)}
                    </span>
                    <Button
                      variant="ghost"
                      className="text-blue-600 hover:bg-blue-50"
                      onClick={() => router.push(`/vagas/${jobPosting.id}`)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver Vaga
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
