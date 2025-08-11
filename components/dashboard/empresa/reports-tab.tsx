'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  Target,
  Download,
  Filter,
  Eye,
  Clock,
  CheckCircle,
  Star,
  Loader2,
} from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import {
  getCompanyKPIs,
  getCompanyReportsData,
  getJobPerformanceDetails,
  type CompanyKPIs,
  type CompanyReportsData,
  type JobPerformanceData,
} from '@/lib/company-reports-service'

interface ReportsTabProps {
  companyId?: string
}

export function ReportsTab({ companyId }: ReportsTabProps) {
  const { user } = useUser()
  const [timeRange, setTimeRange] = useState('6months')
  const [selectedMetric, setSelectedMetric] = useState('applications')
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState<CompanyKPIs | null>(null)
  const [reportsData, setReportsData] = useState<CompanyReportsData | null>(
    null
  )
  const [jobPerformanceData, setJobPerformanceData] = useState<
    JobPerformanceData[]
  >([])

  const currentCompanyId = companyId || user?.id

  // Função para exportar dados para CSV
  const exportToCSV = () => {
    if (!kpis || !reportsData || !jobPerformanceData) {
      alert('Não há dados para exportar')
      return
    }

    try {
      // Criar dados para exportação
      const exportData = {
        kpis: {
          'Total de Candidaturas': kpis.totalApplications,
          'Total de Contratações': kpis.totalHires,
          'Total de Entrevistas': kpis.totalInterviews,
          'Taxa de Conversão (%)': kpis.conversionRate,
          'Tempo Médio de Contratação (dias)': kpis.avgHiringTime,
          'Tendência de Candidaturas (%)': kpis.applicationsTrend,
          'Tendência de Contratações (%)': kpis.hiresTrend,
        },
        monthlyStats: reportsData.monthlyStats || [],
        sourceData: reportsData.sourceData || [],
        timeToHire: reportsData.timeToHire || [],
        jobPerformance: jobPerformanceData || [],
      }

      // Criar conteúdo CSV
      let csvContent = 'data:text/csv;charset=utf-8,'

      // Seção KPIs
      csvContent += '=== INDICADORES PRINCIPAIS ===\n'
      csvContent += 'Métrica,Valor\n'
      Object.entries(exportData.kpis).forEach(([key, value]) => {
        csvContent += `"${key}","${value}"\n`
      })
      csvContent += '\n'

      // Seção Estatísticas Mensais
      if (exportData.monthlyStats.length > 0) {
        csvContent += '=== ESTATÍSTICAS MENSAIS ===\n'
        csvContent += 'Mês,Candidaturas,Entrevistas,Contratações\n'
        exportData.monthlyStats.forEach(stat => {
          csvContent += `"${stat.month}","${stat.applications || 0}","${stat.interviews || 0}","${stat.hires || 0}"\n`
        })
        csvContent += '\n'
      }

      // Seção Origem dos Candidatos
      if (exportData.sourceData.length > 0) {
        csvContent += '=== ORIGEM DOS CANDIDATOS ===\n'
        csvContent += 'Fonte,Percentual (%)\n'
        exportData.sourceData.forEach(source => {
          csvContent += `"${source.name}","${source.value}"\n`
        })
        csvContent += '\n'
      }

      // Seção Tempo por Etapa
      if (exportData.timeToHire.length > 0) {
        csvContent += '=== TEMPO POR ETAPA ===\n'
        csvContent += 'Etapa,Dias\n'
        exportData.timeToHire.forEach(stage => {
          csvContent += `"${stage.stage}","${stage.days}"\n`
        })
        csvContent += '\n'
      }

      // Seção Performance por Vaga
      if (exportData.jobPerformance.length > 0) {
        csvContent += '=== PERFORMANCE POR VAGA ===\n'
        csvContent +=
          'Vaga,Candidaturas,Entrevistas,Contratações,Taxa de Conversão (%),Status\n'
        exportData.jobPerformance.forEach(job => {
          csvContent += `"${job.title}","${job.applications}","${job.interviews || 0}","${job.hires || 0}","${job.conversionRate.toFixed(1)}","${job.status}"\n`
        })
      }

      // Criar e baixar arquivo
      // Verificação segura para SSR
      if (typeof document === 'undefined' || !document.createElement || !document.body) {
        alert('Funcionalidade de download não disponível no servidor.')
        return
      }
      
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)

      // Nome do arquivo com data atual
      const currentDate = new Date().toISOString().split('T')[0]
      link.setAttribute('download', `relatorio_empresa_${currentDate}.csv`)

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Feedback para o usuário
      alert('Relatório exportado com sucesso!')
    } catch (error) {
      // Silent error handling: Error exporting report
      alert('Erro ao exportar relatório. Tente novamente.')
    }
  }

  useEffect(() => {
    const loadReportsData = async () => {
      if (!currentCompanyId) return

      try {
        setLoading(true)

        // Carregar dados em paralelo
        const [kpisData, reportsDataResult, jobPerformanceResult] =
          await Promise.all([
            getCompanyKPIs(currentCompanyId),
            getCompanyReportsData(currentCompanyId),
            getJobPerformanceDetails(currentCompanyId),
          ])

        setKpis(kpisData)
        setReportsData(reportsDataResult)
        setJobPerformanceData(jobPerformanceResult)
      } catch (error) {
        // Silent error handling: Error loading reports data
      } finally {
        setLoading(false)
      }
    }

    loadReportsData()
  }, [currentCompanyId, timeRange])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Carregando relatórios...</span>
      </div>
    )
  }

  if (!kpis || !reportsData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">
          Não foi possível carregar os dados de relatórios.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1E1D40]">
            Relatórios e Analytics
          </h1>
          <p className="text-gray-600">
            Analise o desempenho dos seus processos de recrutamento
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Último mês</SelectItem>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="1year">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="hover-lift bg-transparent"
            onClick={exportToCSV}
            disabled={loading || !kpis || !reportsData}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">
                  Total de Candidaturas
                </p>
                <p className="text-3xl font-bold text-blue-700">
                  {kpis.totalApplications}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {kpis.applicationsTrend >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span
                    className={`text-sm font-medium ${kpis.applicationsTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {kpis.applicationsTrend >= 0 ? '+' : ''}
                    {kpis.applicationsTrend}% vs mês anterior
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">
                  Contratações
                </p>
                <p className="text-3xl font-bold text-green-700">
                  {kpis.totalHires}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {kpis.hiresTrend >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span
                    className={`text-sm font-medium ${kpis.hiresTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {kpis.hiresTrend >= 0 ? '+' : ''}
                    {kpis.hiresTrend}% vs mês anterior
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">
                  Taxa de Conversão
                </p>
                <p className="text-3xl font-bold text-purple-700">
                  {kpis.conversionRate}%
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {kpis.conversionRate >= 10 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span
                    className={`text-sm font-medium ${kpis.conversionRate >= 10 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {kpis.conversionRate >= 10 ? 'Boa' : 'Baixa'} conversão
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">
                  Tempo Médio de Contratação
                </p>
                <p className="text-3xl font-bold text-orange-700">
                  {kpis.avgHiringTime} dias
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {kpis.avgHiringTime <= 20 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span
                    className={`text-sm font-medium ${kpis.avgHiringTime <= 20 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {kpis.avgHiringTime <= 20 ? 'Rápido' : 'Lento'} processo
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendência de Candidaturas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={reportsData.monthlyStats || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="applications"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="interviews"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="hires"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Origem dos Candidatos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportsData.sourceData || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(reportsData.sourceData || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {(reportsData.sourceData || []).map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600">
                    {item.name}: {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Performance por Vaga
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={jobPerformanceData || []} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="job" type="category" width={120} />
                <Tooltip />
                <Bar
                  dataKey="applications"
                  fill="#3B82F6"
                  name="Candidaturas"
                />
                <Bar dataKey="views" fill="#10B981" name="Visualizações" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Tempo por Etapa (dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportsData.timeToHire || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="days" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Job Performance Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Star className="h-5 w-5 text-indigo-600" />
            Performance Detalhada por Vaga
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Vaga
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Candidaturas
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Entrevistas
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Contratações
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Taxa de Conversão
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {(jobPerformanceData || []).map((job, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {job.title}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {job.applications}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {job.interviews || 0}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {job.hires || 0}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          job.conversionRate > 10
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {job.conversionRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          job.status === 'ativa'
                            ? 'bg-green-100 text-green-800'
                            : job.status === 'pausada'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
