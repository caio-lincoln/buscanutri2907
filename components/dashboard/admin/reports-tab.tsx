"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
} from "lucide-react"
import type { DateRange } from "react-day-picker"
import { format, subDays } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface ReportMetric {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  description: string
}

const mockMetrics: ReportMetric[] = [
  {
    title: "Novos Usuários",
    value: "320",
    icon: Users,
    color: "blue",
    description: "Últimos 30 dias",
  },
  {
    title: "Vagas Aprovadas",
    value: "45",
    icon: Briefcase,
    color: "green",
    description: "Últimos 30 dias",
  },
  {
    title: "Receita Gerada",
    value: "R$ 12.5k",
    icon: DollarSign,
    color: "purple",
    description: "Últimos 30 dias",
  },
  {
    title: "Taxa de Engajamento",
    value: "68%",
    icon: TrendingUp,
    color: "orange",
    description: "Média da plataforma",
  },
]

export function ReportsTab() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  const handleDownloadReport = (type: string) => {
    console.log(`Downloading ${type} report for date range:`, dateRange)
    alert(`Baixando relatório de ${type} para o período selecionado.`)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-[#1E1D40]">Relatórios e Analytics</h2>

      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-[#1E1D40]">Visão Geral dos Relatórios</CardTitle>
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
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground",
                    )}
                  >
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
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
            {mockMetrics.map((metric, i) => {
              const IconComponent = metric.icon
              return (
                <Card key={i} className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br from-${metric.color}-500 to-${metric.color}-600`}
                    >
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                      <h3 className="text-2xl font-bold text-[#1E1D40]">{metric.value}</h3>
                      <p className="text-xs text-gray-500">{metric.description}</p>
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
                  <BarChart className="h-5 w-5 text-gray-600" /> Crescimento de Usuários
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
                  onClick={() => handleDownloadReport("users-growth")}
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
                  onClick={() => handleDownloadReport("monthly-revenue")}
                >
                  <Download className="h-4 w-4 mr-2" /> Baixar Dados
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-[#1E1D40] flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-gray-600" /> Distribuição de Usuários por Tipo
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
                  onClick={() => handleDownloadReport("user-distribution")}
                >
                  <Download className="h-4 w-4 mr-2" /> Baixar Dados
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-[#1E1D40] flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-gray-600" /> Tendências de Vagas
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
                  onClick={() => handleDownloadReport("job-trends")}
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
