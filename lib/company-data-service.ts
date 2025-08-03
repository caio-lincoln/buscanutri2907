import { createSupabaseClient } from "./supabase"

const supabase = createSupabaseClient()

// Tipos para dados de empresa
export interface JobData {
  id: string
  title: string
  company: string
  location: string
  type: "CLT" | "PJ" | "Estágio" | "Freelance"
  salary: string
  description: string
  requirements: string[]
  benefits: string[]
  status: "ativo" | "pausado" | "finalizado"
  applicationsCount: number
  createdAt: string
  expiresAt: string
}

export interface CandidateData {
  id: string
  name: string
  email: string
  position: string
  experience: string
  status: "novo" | "em_analise" | "aprovado" | "rejeitado"
  appliedAt: string
  resumeUrl?: string
  skills: string[]
  location: string
}

export interface ProcessData {
  id: string
  jobTitle: string
  candidate: string
  stage: "triagem" | "entrevista" | "teste_tecnico" | "aprovado" | "rejeitado"
  nextStep: string
  scheduledDate?: string
  notes?: string
  createdAt: string
}

export interface CompanyTransaction {
  id: string
  type: "receita" | "despesa"
  amount: number
  description: string
  date: string
  status: "concluída" | "pendente" | "cancelada"
  category: string
}

/**
 * Buscar vagas da empresa
 */
export async function getCompanyJobs(companyId: string): Promise<JobData[]> {
  try {
    const { data: jobs, error } = await supabase
      .from('job_postings')
      .select(`
        id,
        title,
        location,
        employment_type,
        salary_range,
        description,
        requirements,
        benefits,
        status,
        created_at,
        expires_at,
        company_profiles(company_name),
        job_applications(count)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching company jobs:', error)
      return []
    }

    return jobs.map(job => ({
      id: job.id,
      title: job.title,
      company: job.company_profiles?.company_name || 'Empresa',
      location: job.location || 'Remoto',
      type: job.employment_type as "CLT" | "PJ" | "Estágio" | "Freelance",
      salary: job.salary_range || 'A combinar',
      description: job.description || '',
      requirements: Array.isArray(job.requirements) ? job.requirements : [],
      benefits: Array.isArray(job.benefits) ? job.benefits : [],
      status: job.status === 'active' ? 'ativo' : job.status === 'paused' ? 'pausado' : 'finalizado',
      applicationsCount: job.job_applications?.length || 0,
      createdAt: job.created_at,
      expiresAt: job.expires_at
    }))
  } catch (error) {
    console.error('Error in getCompanyJobs:', error)
    return []
  }
}

/**
 * Buscar candidatos da empresa
 */
export async function getCompanyCandidates(companyId: string): Promise<CandidateData[]> {
  try {
    const { data: applications, error } = await supabase
      .from('job_applications')
      .select(`
        id,
        status,
        applied_at,
        resume_url,
        cover_letter,
        nutritionist_profiles(
          full_name,
          email,
          specialties,
          location,
          experience_years
        ),
        job_postings(
          title,
          company_id
        )
      `)
      .eq('job_postings.company_id', companyId)
      .order('applied_at', { ascending: false })

    if (error) {
      console.error('Error fetching company candidates:', error)
      return []
    }

    return applications.map(app => ({
      id: app.id,
      name: app.nutritionist_profiles?.full_name || 'Candidato',
      email: app.nutritionist_profiles?.email || '',
      position: app.job_postings?.title || 'Posição',
      experience: `${app.nutritionist_profiles?.experience_years || 0} anos`,
      status: app.status as "novo" | "em_analise" | "aprovado" | "rejeitado",
      appliedAt: app.applied_at,
      resumeUrl: app.resume_url,
      skills: Array.isArray(app.nutritionist_profiles?.specialties) ? 
              app.nutritionist_profiles.specialties : [],
      location: app.nutritionist_profiles?.location || 'Não informado'
    }))
  } catch (error) {
    console.error('Error in getCompanyCandidates:', error)
    return []
  }
}

/**
 * Buscar processos seletivos da empresa
 */
export async function getCompanyProcesses(companyId: string): Promise<ProcessData[]> {
  try {
    const { data: processes, error } = await supabase
      .from('selection_processes')
      .select(`
        id,
        stage,
        notes,
        scheduled_date,
        created_at,
        job_applications(
          nutritionist_profiles(full_name),
          job_postings(title)
        )
      `)
      .eq('job_applications.job_postings.company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching company processes:', error)
      return []
    }

    return processes.map(process => ({
      id: process.id,
      jobTitle: process.job_applications?.job_postings?.title || 'Vaga',
      candidate: process.job_applications?.nutritionist_profiles?.full_name || 'Candidato',
      stage: process.stage as "triagem" | "entrevista" | "teste_tecnico" | "aprovado" | "rejeitado",
      nextStep: getNextStep(process.stage),
      scheduledDate: process.scheduled_date,
      notes: process.notes,
      createdAt: process.created_at
    }))
  } catch (error) {
    console.error('Error in getCompanyProcesses:', error)
    return []
  }
}

/**
 * Buscar transações financeiras da empresa
 */
export async function getCompanyTransactions(companyId: string): Promise<CompanyTransaction[]> {
  try {
    // Por enquanto, retornar array vazio já que não temos tabela de transações ainda
    // Quando implementar, buscar da tabela de transações da empresa
    return []
  } catch (error) {
    console.error('Error in getCompanyTransactions:', error)
    return []
  }
}

/**
 * Determinar próximo passo baseado no estágio atual
 */
function getNextStep(stage: string): string {
  switch (stage) {
    case 'triagem':
      return 'Agendar entrevista'
    case 'entrevista':
      return 'Aplicar teste técnico'
    case 'teste_tecnico':
      return 'Decisão final'
    case 'aprovado':
      return 'Contratação'
    case 'rejeitado':
      return 'Processo finalizado'
    default:
      return 'Definir próximo passo'
  }
}