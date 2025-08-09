import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Search,
  MapPin,
  Calendar,
  CheckCircle,
  Star,
  Shield,
  Heart,
  Users,
  ArrowRight,
  Video,
  MessageSquare,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Para Pacientes - Busca Nutri",
  description:
    "Encontre o nutricionista ideal para você. Consultas presenciais e online com profissionais verificados.",
}

const benefits = [
  {
    icon: CheckCircle,
    title: "Profissionais Verificados",
    description: "Todos os nutricionistas passam por rigoroso processo de verificação de credenciais e experiência.",
  },
  {
    icon: MapPin,
    title: "Encontre Próximo a Você",
    description: "Localize nutricionistas na sua região ou opte por consultas online de qualquer lugar.",
  },
  {
    icon: Calendar,
    title: "Agendamento Fácil",
    description: "Agende suas consultas online de forma rápida e prática, com confirmação automática.",
  },
  {
    icon: Shield,
    title: "Segurança e Privacidade",
    description: "Seus dados pessoais e de saúde são protegidos com os mais altos padrões de segurança.",
  },
  {
    icon: Star,
    title: "Avaliações Reais",
    description: "Veja avaliações e comentários de outros pacientes para escolher o melhor profissional.",
  },
  {
    icon: Heart,
    title: "Cuidado Personalizado",
    description: "Receba atendimento personalizado focado nas suas necessidades e objetivos específicos.",
  },
]

const consultationTypes = [
  {
    icon: Users,
    title: "Consulta Presencial",
    description: "Atendimento no consultório do nutricionista",
    features: [
      "Avaliação nutricional personalizada",
      "Plano alimentar individualizado", 
      "Avaliação física com diagnóstico nutricional",
      "Orientações nutricionais",
      "Acompanhamento e monitoramento"
    ],
  },
  {
    icon: Video,
    title: "Consulta Online",
    description: "Atendimento por vídeo chamada",
    features: [
      "Flexibilidade de horários",
      "Sem deslocamento", 
      "Avaliação nutricional personalizada",
      "Plano alimentar individualizado",
      "Orientações nutricionais",
      "Acompanhamento e monitoramento"
    ],
  },
  {
    icon: MessageSquare,
    title: "Acompanhamento",
    description: "Suporte contínuo via chat",
    features: ["Dúvidas rápidas", "Ajustes no plano", "Motivação diária"],
  },
]

export default function ParaPacientesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo-busca-nutri.png"
              alt="Busca Nutri"
              width={140}
              height={28}
              className="h-6 w-auto transition-transform duration-300 hover:scale-105"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/nutricionistas"
              className="text-sm font-medium text-[#1E1D40]/70 hover:text-[#4AB0D9] transition-all duration-300"
            >
              Nutricionistas
            </Link>
            <Link
              href="/vagas"
              className="text-sm font-medium text-[#1E1D40]/70 hover:text-[#4AB0D9] transition-all duration-300"
            >
              Vagas
            </Link>
            <Link
              href="/blog"
              className="text-sm font-medium text-[#1E1D40]/70 hover:text-[#4AB0D9] transition-all duration-300"
            >
              Blog
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="hidden md:flex text-[#1E1D40] hover:text-[#4AB0D9]">
                Entrar
              </Button>
            </Link>
            <Link href="/cadastro?tipo=paciente">
              <Button className="bg-[#D90D32] hover:bg-[#D90D32]/90 text-white">Cadastrar</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-br from-[#D90D32]/10 via-white to-pink-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="space-y-8">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#D90D32]/10 text-[#D90D32] rounded-full text-sm font-medium">
                    <Heart className="h-4 w-4" />
                    Para Pacientes
                  </div>
                  <h1 className="text-4xl md:text-6xl font-bold text-[#1E1D40] leading-tight">
                    Encontre o <span className="text-[#D90D32]">nutricionista ideal</span> para transformar sua saúde
                  </h1>
                  <p className="text-xl text-[#1E1D40]/70 leading-relaxed">
                    Conecte-se com profissionais verificados, agende consultas presenciais ou online e inicie sua
                    jornada rumo a uma vida mais saudável.
                  </p>
                </div>

                {/* CTAs Centralizados */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-start">
                  <Link href="/nutricionistas">
                    <Button size="lg" className="bg-[#D90D32] hover:bg-[#D90D32]/90 text-white px-8 py-4 text-lg">
                      Ver Nutricionistas
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/cadastro?tipo=paciente">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-2 border-[#D90D32] text-[#D90D32] bg-transparent px-8 py-4 text-lg hover:bg-[#D90D32] hover:text-white"
                    >
                      Criar Conta Gratuita
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-[#D90D32]/20 rounded-3xl transform rotate-6"></div>
                <Card className="relative border-0 shadow-2xl">
                  <CardContent className="p-0">
                    <img
                      src="/placeholder.svg?height=500&width=600&text=Paciente+Feliz+com+Nutricionista"
                      alt="Paciente satisfeita após consulta com nutricionista"
                      className="w-full h-auto rounded-3xl"
                      width={600}
                      height={500}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-white">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-[#1E1D40] mb-6">
                Por que escolher a <span className="text-[#D90D32]">Busca Nutri</span>?
              </h2>
              <p className="text-xl text-[#1E1D40]/70 max-w-3xl mx-auto">
                Oferecemos a melhor experiência para conectar você com nutricionistas qualificados
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index} className="border border-red-100 hover:shadow-lg transition-shadow">
                  <CardContent className="p-8 text-center">
                    <div className="w-12 h-12 bg-[#D90D32] rounded-xl flex items-center justify-center mx-auto mb-4">
                      <benefit.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-[#1E1D40] mb-3">{benefit.title}</h3>
                    <p className="text-[#1E1D40]/70">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Consultation Types */}
        <section className="py-20 bg-red-50/30">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1E1D40] mb-6">Tipos de Consulta</h2>
              <p className="text-lg text-[#1E1D40]/70">Escolha o formato que melhor se adapta à sua rotina</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {consultationTypes.map((type, index) => (
                <Card key={index} className="border-2 hover:border-[#D90D32] hover:shadow-lg transition-all">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-[#D90D32]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <type.icon className="h-8 w-8 text-[#D90D32]" />
                    </div>
                    <CardTitle className="text-xl text-[#1E1D40]">{type.title}</CardTitle>
                    <p className="text-[#1E1D40]/70">{type.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {type.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-[#1E1D40]/80">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-[#D90D32] to-[#B91C1C] text-white">
          <div className="container px-4 md:px-6 text-center">
            <div className="max-w-3xl mx-auto space-y-8">
              <h2 className="text-3xl md:text-5xl font-bold">
                Pronto para transformar sua <span className="text-pink-200">saúde</span>?
              </h2>
              <p className="text-xl text-white/90">
                Junte-se a milhares de pessoas que já encontraram o nutricionista ideal na Busca Nutri
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/nutricionistas">
                  <Button size="lg" variant="secondary" className="bg-white text-[#D90D32] hover:bg-gray-100">
                    Encontrar Nutricionista
                    <Search className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/cadastro?tipo=paciente">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white hover:text-[#D90D32] bg-transparent"
                  >
                    Criar Conta Gratuita
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

