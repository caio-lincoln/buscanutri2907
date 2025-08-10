'use client'

import type React from 'react'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  Download,
  CalendarIcon,
  BarChart,
  LineChart,
  PieChart,
  Loader2,
} from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { format, subDays } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { getReportMetrics, type ReportMetric } from '@/lib/admin-data-service'

interface MetricDisplay {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  description: string
}

export function ReportsTab() {
  const [metrics, setMetrics] = useState<ReportMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  useEffect(() => {
    async function loadMetrics() {
      try {
        setLoading(true)
        const metricsData = await getReportMetrics()
        setMetrics(metricsData)
      } catch (error) {
        // Silent error handling: Error loading metrics
      } finally {
        setLoading(false)
      }
    }

    loadMetrics()
  }, [])

  const formatMetricValue = (metric: ReportMetric): string => {
    switch (metric.type) {
      case 'revenue':
        return `R$ ${(metric.value / 1000).toFixed(1)}k`
      case 'users':
      case 'consultations':
      case 'posts':
        return metric.value.toString()
      default:
        return metric.value.toString()
    }
  }

  const getMetricIcon = (
    type: string
  ): React.ComponentType<{ className?: string }> => {
    switch (type) {
      case 'users':
        return Users
      case 'revenue':
        return DollarSign
      case 'consultations':
        return Briefcase
      case 'posts':
        return TrendingUp
      default:
        return TrendingUp
    }
  }

  const getMetricColor = (type: string): string => {
    switch (type) {
      case 'users':
        return 'blue'
      case 'revenue':
        return 'green'
      case 'consultations':
        return 'purple'
      case 'posts':
        return 'orange'
      default:
        return 'gray'
    }
  }

  const displayMetrics: MetricDisplay[] = metrics.map(metric => ({
    title: metric.title,
    value: formatMetricValue(metric),
    icon: getMetricIcon(metric.type),
    color: getMetricColor(metric.type),
    description: `${metric.change > 0 ? '+' : ''}${metric.change}% ${metric.period}`,
  }))

  const handleDownloadReport = (type: string) => {
    // Download report logic would go here
    alert(`Baixando relatório de ${type} para o período selecionado.`)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-[#1E1D40]">
          Relatórios e Analytics
        </h2>
        <Card className="border-0 shadow-lg">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando métricas...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-[#1E1D40]">
        Relatórios e Analytics
      </h2>

      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-[#1E1D40]">
            Visão Geral dos Relatórios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-700">Período:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={'outline'}
                    className={cn(
                      'w-[240px] justify-start text-left font-normal',
                      !dateRange && 'text-muted-foreground'
                    )}
                  >
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'LLL dd, y')} -{' '}
                          {format(dateRange.to, 'LLL dd, y')}
                        </>
                      ) : (
                        format(dateRange.from, 'LLL dd, y')
                      )
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md">
              <Download className="h-4 w-4 mr-2" /> Baixar Relatório Completo
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayMetrics.map((metric, i) => {
              const IconComponent = metric.icon
              return (
                <Card
                  key={i}
                  className="border-0 shadow-md bg-white/80 backdrop-blur-sm"
                >
                  <CardContent className="p-6 flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br from-${metric.color}-500 to-${metric.color}-600`}
                    >
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {metric.title}
                      </p>
                      <h3 className="text-2xl font-bold text-[#1E1D40]">
                        {metric.value}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {metric.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-[#1E1D40] flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-gray-600" /> Crescimento de
                  Usuários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                  Gráfico de Barras (Placeholder)
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full bg-transparent"
                  onClick={() => handleDownloadReport('users-growth')}
                >
                  <Download className="h-4 w-4 mr-2" /> Baixar Dados
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-[#1E1D40] flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-gray-600" /> Receita Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                  Gráfico de Linha (Placeholder)
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full bg-transparent"
                  onClick={() => handleDownloadReport('monthly-revenue')}
                >
                  <Download className="h-4 w-4 mr-2" /> Baixar Dados
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-[#1E1D40] flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-gray-600" /> Distribuição de
                  Usuários por Tipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                  Gráfico de Pizza (Placeholder)
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full bg-transparent"
                  onClick={() => handleDownloadReport('user-distribution')}
                >
                  <Download className="h-4 w-4 mr-2" /> Baixar Dados
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-[#1E1D40] flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-gray-600" /> Tendências de
                  Consultas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                  Gráfico de Linha (Placeholder)
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full bg-transparent"
                  onClick={() => handleDownloadReport('consultation-trends')}
                >
                  <Download className="h-4 w-4 mr-2" /> Baixar Dados
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
