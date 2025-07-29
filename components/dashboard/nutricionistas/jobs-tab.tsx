"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Briefcase, MapPin, DollarSign, Clock, ArrowRight } from "lucide-react"

export function JobsTab() {
  const jobListings = [
    {
      id: "1",
      title: "Nutricionista para Clínica Estética",
      company: "Clínica Bem-Estar Total",
      location: "São Paulo, SP",
      salary: "R$ 4.000 - R$ 6.000",
      type: "Tempo Integral",
      description: "Atuar com foco em nutrição para procedimentos estéticos e reeducação alimentar.",
      posted: "2 dias atrás",
    },
    {
      id: "2",
      title: "Consultor(a) Nutricional Online",
      company: "Health Connect EAD",
      location: "Remoto",
      salary: "A combinar",
      type: "Freelancer",
      description: "Oferecer consultas e acompanhamento online para pacientes de todo o Brasil.",
      posted: "1 semana atrás",
    },
    {
      id: "3",
      title: "Nutricionista Hospitalar - Urgência e Emergência",
      company: "Hospital Santa Clara",
      location: "Rio de Janeiro, RJ",
      salary: "R$ 5.500 - R$ 7.500",
      type: "Tempo Integral",
      description: "Experiência em ambiente hospitalar, atuando em UTIs e emergência.",
      posted: "3 dias atrás",
    },
    {
      id: "4",
      title: "Nutricionista Esportiva para Academia",
      company: "Academia Performance Máxima",
      location: "Belo Horizonte, MG",
      salary: "R$ 3.500 - R$ 5.000",
      type: "Meio Período",
      description: "Desenvolver planos para atletas e frequentadores de academia.",
      posted: "5 dias atrás",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">Vagas e Oportunidades</h1>
          <p className="text-gray-600">Encontre as melhores oportunidades de trabalho para nutricionistas.</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300">
          <Briefcase className="h-4 w-4 mr-2" />
          Publicar Vaga
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {jobListings.map((job) => (
          <Card key={job.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl font-bold text-[#1E1D40]">{job.title}</CardTitle>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {job.type}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700 font-medium">{job.company}</p>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>{job.salary}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {job.posted}
                </span>
                <Button variant="ghost" className="text-blue-600 hover:bg-blue-50">
                  Ver Detalhes <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
