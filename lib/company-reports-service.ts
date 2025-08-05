import { createSupabaseClient } from "./supabase"

const supabase = createSupabaseClient()

// Tipos para dados de relatórios
export interface MonthlyData {
  month: string
  applications: number
  hires: number
  interviews: number
}

export interface JobPerformanceData {
  job: string
  applications: number
  views: number
  conversion: number
}

export interface JobPerformanceDetail {
  id: string;
  title: string;
  applications: number;
  interviews: number;
  hires: number;
  conversionRate: number;
  status: string;
  createdAt: string;
}

export interface SourceData {
  name: string
  value: number
  color: string
}

export interface TimeToHireData {
  stage: string
  days: number
}

export interface CompanyKPIs {
  totalApplications: number
  totalHires: number
  totalInterviews: number
  conversionRate: number
  avgHiringTime: number
  applicationsTrend: number
  hiresTrend: number
}

export interface CompanyReportsData {
  monthlyData: MonthlyData[]
  jobPerformance: JobPerformanceData[]
  sourceData: SourceData[]
  timeToHireData: TimeToHireData[]
}

/**
 * Buscar KPIs da empresa
 */
export async function getCompanyKPIs(companyId: string): Promise<CompanyKPIs> {
  try {
    const { data, error } = await supabase.rpc('get_company_kpis', {
      company_uuid: companyId
    })

    if (error) {
      console.error('Error fetching company KPIs:', error)
      return getDefaultKPIs()
    }

    return data || getDefaultKPIs()
  } catch (error) {
    console.error('Error in getCompanyKPIs:', error)
    return getDefaultKPIs()
  }
}

/**
 * Buscar dados de relatórios da empresa
 */
export async function getCompanyReportsData(companyId: string): Promise<CompanyReportsData> {
  try {
    const { data, error } = await supabase.rpc('get_company_reports_data', {
      company_uuid: companyId
    })

    if (error) {
      console.error('Error fetching company reports data:', error)
      return getDefaultReportsData()
    }

    return data || getDefaultReportsData()
  } catch (error) {
    console.error('Error in getCompanyReportsData:', error)
    return getDefaultReportsData()
  }
}

/**
 * Buscar dados detalhados de performance por vaga
 */
export async function getJobPerformanceDetails(companyId: string): Promise<JobPerformanceDetail[]> {
  try {
    const { data, error } = await supabase.rpc('get_job_performance_details', {
      company_uuid: companyId
    });

    if (error) {
      console.error('Error fetching job performance details:', error);
      throw error;
    }

    return data?.map((item: any) => ({
      id: item.id,
      title: item.title,
      applications: item.applications || 0,
      interviews: item.interviews || 0,
      hires: item.hires || 0,
      conversionRate: item.conversion_rate || 0,
      status: item.status || 'ativa',
      createdAt: item.created_at
    })) || [];
  } catch (error) {
    console.error('Error fetching job performance details:', error);
    return [];
  }
}

/**
 * Buscar dados mensais de candidaturas
 */
export async function getMonthlyApplicationsData(companyId: string): Promise<MonthlyData[]> {
  try {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data, error } = await supabase
      .from('job_applications')
      .select('applied_at, status, job_id')
      .gte('applied_at', sixMonthsAgo.toISOString())

    if (error) {
      console.error('Error fetching monthly applications data:', error)
      return getDefaultMonthlyData()
    }

    // Agrupar por mês
    const monthlyMap = new Map<string, { applications: number, hires: number, interviews: number }>()
    
    data?.forEach(application => {
      const date = new Date(application.applied_at)
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' })
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { applications: 0, hires: 0, interviews: 0 })
      }
      
      const monthData = monthlyMap.get(monthKey)!
      monthData.applications++
      
      if (application.status === 'contratado') {
        monthData.hires++
      } else if (application.status === 'entrevista') {
        monthData.interviews++
      }
    })

    return Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      ...data
    }))
  } catch (error) {
    console.error('Error in getMonthlyApplicationsData:', error)
    return getDefaultMonthlyData()
  }
}

/**
 * Dados padrão para KPIs quando não há dados
 */
function getDefaultKPIs(): CompanyKPIs {
  return {
    totalApplications: 0,
    totalHires: 0,
    totalInterviews: 0,
    conversionRate: 0,
    avgHiringTime: 18,
    applicationsTrend: 0,
    hiresTrend: 0
  }
}

/**
 * Dados padrão para relatórios quando não há dados
 */
function getDefaultReportsData(): CompanyReportsData {
  return {
    monthlyData: getDefaultMonthlyData(),
    jobPerformance: [],
    sourceData: getDefaultSourceData(),
    timeToHireData: getDefaultTimeToHireData()
  }
}

/**
 * Dados mensais padrão
 */
function getDefaultMonthlyData(): MonthlyData[] {
  return [
    { month: "Jan", applications: 0, hires: 0, interviews: 0 },
    { month: "Fev", applications: 0, hires: 0, interviews: 0 },
    { month: "Mar", applications: 0, hires: 0, interviews: 0 },
    { month: "Abr", applications: 0, hires: 0, interviews: 0 },
    { month: "Mai", applications: 0, hires: 0, interviews: 0 },
    { month: "Jun", applications: 0, hires: 0, interviews: 0 },
  ]
}

/**
 * Dados de origem padrão
 */
function getDefaultSourceData(): SourceData[] {
  return [
    { name: "Busca Nutri", value: 45, color: "#3B82F6" },
    { name: "LinkedIn", value: 25, color: "#10B981" },
    { name: "Indeed", value: 15, color: "#F59E0B" },
    { name: "Indicação", value: 10, color: "#8B5CF6" },
    { name: "Outros", value: 5, color: "#6B7280" },
  ]
}

/**
 * Dados de tempo de contratação padrão
 */
function getDefaultTimeToHireData(): TimeToHireData[] {
  return [
    { stage: "Candidatura", days: 1 },
    { stage: "Triagem", days: 3 },
    { stage: "Entrevista", days: 7 },
    { stage: "Decisão", days: 5 },
    { stage: "Proposta", days: 2 },
  ]
}