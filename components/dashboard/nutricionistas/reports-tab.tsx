"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, DollarSign, Users, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ReportsTab() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">Relatórios e Análises</h1>
          <p className="text-gray-600">Acompanhe a performance da sua prática e o progresso dos pacientes.</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300">
          Gerar Relatório Personalizado
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <BarChart className="h-5 w-5 text-blue-600" />
              <span>Consultas por Mês</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center text-gray-500">
              {/* Placeholder for a chart */}
              Gráfico de Barras Aqui
            </div>
            <p className="text-sm text-gray-600 mt-4">Total de 45 consultas no último mês.</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span>Renda Mensal Estimada</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center text-gray-500">
              {/* Placeholder for a chart */}
              Gráfico de Linha Aqui
            </div>
            <p className="text-sm text-gray-600 mt-4">Estimativa de R$ 7.500,00 no último mês.</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <Users className="h-5 w-5 text-purple-600" />
              <span>Novos Pacientes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center text-gray-500">
              {/* Placeholder for a chart */}
              Gráfico de Linha Aqui
            </div>
            <p className="text-sm text-gray-600 mt-4">10 novos pacientes este mês.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-orange-600" />
            <span>Engajamento com Conteúdo</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors duration-200">
              <div>
                <p className="font-semibold text-[#1E1D40]">Artigo: "Benefícios da Dieta Mediterrânea"</p>
                <p className="text-sm text-gray-600">Visualizações: 1.200 | Curtidas: 150 | Comentários: 25</p>
              </div>
              <Button variant="outline" size="sm">
                Ver Detalhes
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors duration-200">
              <div>
                <p className="font-semibold text-[#1E1D40]">Webinar: "Nutrição Esportiva para Atletas Amadores"</p>
                <p className="text-sm text-gray-600">Participantes: 350 | Avaliação: 4.8/5</p>
              </div>
              <Button variant="outline" size="sm">
                Ver Detalhes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
