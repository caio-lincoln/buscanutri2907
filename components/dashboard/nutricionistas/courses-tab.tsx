"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Star, Clock, ArrowRight } from "lucide-react"
import Image from "next/image"

export function CoursesTab() {
  const courses = [
    {
      id: "1",
      title: "Nutrição Clínica Avançada",
      description: "Aprofunde seus conhecimentos em patologias complexas e planos alimentares específicos.",
      image: "/placeholder.svg?height=200&width=300",
      instructor: "Dra. Ana Paula Mendonça",
      duration: "40h",
      rating: 4.9,
      category: "Clínica",
    },
    {
      id: "2",
      title: "Marketing Digital para Nutricionistas",
      description: "Aprenda a construir sua marca pessoal e atrair mais pacientes online.",
      image: "/placeholder.svg?height=200&width=300",
      instructor: "Prof. Carlos Eduardo",
      duration: "25h",
      rating: 4.7,
      category: "Gestão",
    },
    {
      id: "3",
      title: "Nutrição Esportiva: Da Base ao Alto Rendimento",
      description: "Domine estratégias nutricionais para atletas de diferentes modalidades.",
      image: "/placeholder.svg?height=200&width=300",
      instructor: "Dr. Fernando Oliveira",
      duration: "50h",
      rating: 4.8,
      category: "Esportiva",
    },
    {
      id: "4",
      title: "Inteligência Artificial na Nutrição",
      description: "Explore ferramentas de IA para otimizar diagnósticos e planos alimentares.",
      image: "/placeholder.svg?height=200&width=300",
      instructor: "Equipe Busca Nutri",
      duration: "15h",
      rating: 4.5,
      category: "Tecnologia",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">Cursos e Educação Continuada</h1>
          <p className="text-gray-600">Amplie suas qualificações e mantenha-se atualizado com as últimas tendências.</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300">
          <BookOpen className="h-4 w-4 mr-2" />
          Explorar Todos os Cursos
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="p-0 relative">
              <Image
                src={course.image || "/placeholder.svg"}
                alt={course.title}
                width={300}
                height={200}
                className="rounded-t-lg object-cover w-full h-40"
              />
              <Badge
                variant="secondary"
                className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm text-xs font-semibold"
              >
                {course.category}
              </Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold text-[#1E1D40] text-lg">{course.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
              <div className="flex items-center text-sm text-gray-500 gap-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>{course.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{course.duration}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button variant="ghost" className="w-full text-blue-600 hover:bg-blue-50">
                Ver Detalhes <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
