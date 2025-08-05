"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Briefcase, MapPin, DollarSign, Clock, ArrowRight, Building } from "lucide-react"
import { getAllActiveJobs, JobPosting } from "@/lib/company-service"
import { JobDetailsModal } from "@/components/job-details-modal"
import Image from "next/image"

export function JobsTab() {
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      setLoading(true)
      const allJobs = await getAllActiveJobs()
      setJobs(allJobs)
    } catch (error) {
      console.error("Erro ao carregar vagas:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "A combinar"
    if (min && max) return `R$ ${min.toLocaleString()} - R$ ${max.toLocaleString()}`
    if (min) return `A partir de R$ ${min.toLocaleString()}`
    if (max) return `Até R$ ${max.toLocaleString()}`
    return "A combinar"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return "1 dia atrás"
    if (diffDays < 7) return `${diffDays} dias atrás`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} semana(s) atrás`
    return `${Math.ceil(diffDays / 30)} mês(es) atrás`
  }

  const handleViewDetails = (job: JobPosting) => {
    setSelectedJob(job)
    setIsModalOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">Vagas e Oportunidades</h1>
            <p className="text-gray-600">Encontre as melhores oportunidades de trabalho para nutricionistas.</p>
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
          <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">Vagas e Oportunidades</h1>
          <p className="text-gray-600">Encontre as melhores oportunidades de trabalho para nutricionistas.</p>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-[#1E1D40]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="h-8 w-8 text-[#1E1D40]" />
          </div>
          <h3 className="text-lg font-semibold text-[#1E1D40] mb-2">Nenhuma vaga disponível</h3>
          <p className="text-[#1E1D40]/70">Não há vagas ativas no momento. Volte em breve para conferir novas oportunidades!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <Card key={job.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#1E1D40] rounded-lg flex items-center justify-center flex-shrink-0">
                    {job.company_profiles?.logo_url ? (
                      <Image
                        src={job.company_profiles.logo_url}
                        alt={job.company_profiles.company_name || "Logo da empresa"}
                        width={40}
                        height={40}
                        className="rounded-lg object-cover"
                        unoptimized
                      />
                    ) : (
                      <Building className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <CardTitle className="text-xl font-bold text-[#1E1D40]">{job.title}</CardTitle>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {job.job_type}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-700 font-medium">{job.company_profiles?.company_name || "Empresa confidencial"}</p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span>{formatSalary(job.salary_min, job.salary_max)}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {formatDate(job.created_at)}
                  </span>
                  <Button 
                    variant="ghost" 
                    className="text-blue-600 hover:bg-blue-50"
                    onClick={() => handleViewDetails(job)}
                  >
                    Ver Detalhes <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
