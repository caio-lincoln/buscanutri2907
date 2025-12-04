'use client'

import type React from 'react'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Eye,
  TrendingUp,
  BarChart,
  Download,
  CalendarIcon,
  UserPlus,
  BarChart3,
  Activity,
} from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
// Removed unused helpers after UI simplification

interface AnalyticsData {
  metrics: {
    siteVisits: number
    siteVisitsChange: string
    newRegistrations: number
    newRegistrationsChange: string
  }
  usersByType: {
    patients: number
    nutritionists: number
    companies: number
    admins: number
  }
  totalUsers: number
  totalConsultations: number
  consultations30Days: number
  consultationsChange: string
  totalSubscriptions: number
  totalPosts: number
  posts30Days: number
  totalLikes: number
  totalComments: number
  likes30Days: number
  comments30Days: number
  trafficData: Array<{ date: string; visitors: number; newUsers: number }>
}

interface MetricCardProps {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative'
  icon: React.ReactNode
}

type DateFilter = 'today' | 'week' | 'month' | 'custom'

const MetricCard = ({
  title,
  value,
  change,
  changeType,
  icon,
}: MetricCardProps) => (
  <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-sm font-medium text-gray-600">{title}</p>
        </div>
        <Badge variant={changeType === 'positive' ? 'default' : 'destructive'}>
          {change}
        </Badge>
      </div>
      <div className="mt-2">
        <h3 className="text-2xl font-bold text-[#1E1D40]">{value}</h3>
      </div>
    </CardContent>
  </Card>
)

export default function AnalyticsTab() {
  const [dateFilter, setDateFilter] = useState<DateFilter>('month')
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Função para definir o range de datas baseado no filtro selecionado
  const setDateFilterRange = (filter: DateFilter) => {
    const now = new Date()
    let from: Date
    let to: Date

    switch (filter) {
      case 'today':
        from = startOfDay(now)
        to = endOfDay(now)
        break
      case 'week':
        from = startOfWeek(now, { weekStartsOn: 1 }) // Segunda-feira
        to = endOfWeek(now, { weekStartsOn: 1 }) // Domingo
        break
      case 'month':
        from = startOfMonth(now)
        to = endOfMonth(now)
        break
      default:
        return // Para 'custom', não altera o range
    }

    setDateRange({ from, to })
    setDateFilter(filter)
  }

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Construir parâmetros de query com as datas
      const params = new URLSearchParams()
      if (dateRange?.from) {
        params.append('startDate', dateRange.from.toISOString())
      }
      if (dateRange?.to) {
        params.append('endDate', dateRange.to.toISOString())
      }
      // Em desenvolvimento, habilitar bypass de admin para facilitar testes locais
      if (process.env.NODE_ENV !== 'production') {
        params.append('dev_bypass', '1')
      }
      
      const response = await fetch(`/api/admin/analytics-data?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Falha ao carregar dados de analytics')
      }
      
      const data = await response.json()
      setAnalyticsData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  // Recarregar dados quando o range de datas mudar
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      fetchAnalyticsData()
    }
  }, [dateRange])

  // Carregar dados iniciais
  useEffect(() => {
    setDateFilterRange('month') // Definir filtro padrão
  }, [])

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num)
  }

  // Removed currency formatter since financial data was dropped

  const formatDateRange = () => {
    if (!dateRange?.from || !dateRange?.to) return 'Selecione um período'
    
    if (dateFilter === 'today') return 'Hoje'
    if (dateFilter === 'week') return 'Esta semana'
    if (dateFilter === 'month') return 'Este mês'
    
    return `${format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} - ${format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Analytics da Plataforma</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Analytics da Plataforma</h2>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchAnalyticsData} variant="outline">
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analyticsData) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics da Plataforma</h2>
          <p className="text-gray-600 mt-1">Período: {formatDateRange()}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Filtros de período pré-definidos */}
          <div className="flex gap-2">
            <Button
              variant={dateFilter === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateFilterRange('today')}
            >
              Hoje
            </Button>
            <Button
              variant={dateFilter === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateFilterRange('week')}
            >
              Semana
            </Button>
            <Button
              variant={dateFilter === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateFilterRange('month')}
            >
              Mês
            </Button>
          </div>

          {/* Seletor de data personalizado */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={dateFilter === 'custom' ? 'default' : 'outline'}
                size="sm"
                className="w-[280px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilter === 'custom' && dateRange?.from && dateRange?.to
                  ? `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`
                  : 'Período personalizado'
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange(range)
                    setDateFilter('custom')
                  }
                }}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar Dados
          </Button>
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Visitas ao Site"
          value={formatNumber(analyticsData.metrics.siteVisits)}
          change={analyticsData.metrics.siteVisitsChange}
          changeType={analyticsData.metrics.siteVisitsChange.startsWith('+') ? 'positive' : 'negative'}
          icon={<Eye className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Novos Cadastros"
          value={formatNumber(analyticsData.metrics.newRegistrations)}
          change={analyticsData.metrics.newRegistrationsChange}
          changeType={analyticsData.metrics.newRegistrationsChange.startsWith('+') ? 'positive' : 'negative'}
          icon={<UserPlus className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Cadastros por Tipo de Usuário */}
      <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Cadastros por Tipo de Usuário</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{formatNumber(analyticsData.usersByType.patients)}</p>
              <p className="text-sm text-gray-600">Pacientes</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{formatNumber(analyticsData.usersByType.nutritionists)}</p>
              <p className="text-sm text-gray-600">Nutricionistas</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{formatNumber(analyticsData.usersByType.companies)}</p>
              <p className="text-sm text-gray-600">Empresas</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Users className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600">{formatNumber(analyticsData.usersByType.admins)}</p>
              <p className="text-sm text-gray-600">Admins</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Gerais */}
      <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Estatísticas Gerais</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Relatório Geral
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <BarChart3 className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-600">{formatNumber(analyticsData.totalUsers)}</p>
              <p className="text-sm text-gray-600">Total de Usuários</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Activity className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{formatNumber(analyticsData.totalConsultations)}</p>
              <p className="text-sm text-gray-600">Total de Consultas</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{formatNumber(analyticsData.consultations30Days)}</p>
              <p className="text-sm text-gray-600">Consultas (30 dias)</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{formatNumber(analyticsData.totalSubscriptions)}</p>
              <p className="text-sm text-gray-600">Total de Assinaturas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados Financeiros */}

      {/* Engajamento de Conteúdo */}
      <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Engajamento de Conteúdo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{formatNumber(analyticsData.totalPosts)}</p>
              <p className="text-sm text-gray-600">Total de Posts</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{formatNumber(analyticsData.posts30Days)}</p>
              <p className="text-sm text-gray-600">Posts (30 dias)</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">{formatNumber(analyticsData.totalLikes)}</p>
              <p className="text-sm text-gray-600">Total de Likes</p>
              <p className="text-xs text-red-700 mt-1">30 dias: {formatNumber(analyticsData.likes30Days || 0)}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <BarChart className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{formatNumber(analyticsData.totalComments)}</p>
              <p className="text-sm text-gray-600">Total de Comentários</p>
              <p className="text-xs text-purple-700 mt-1">30 dias: {formatNumber(analyticsData.comments30Days || 0)}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
