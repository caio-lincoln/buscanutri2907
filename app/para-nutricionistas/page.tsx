'use client'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Calendar,
  TrendingUp,
  Shield,
  Zap,
  Award,
  ArrowRight,
  CheckCircle,
  Briefcase,
} from 'lucide-react'
import { formatNumber, formatRating, getPlatformStats, PlatformStats } from '../../lib/stats'
import { useCallback, useEffect, useState } from 'react'

const benefits = [
  {
    icon: Users,
    title: 'Mais Pacientes',
    description:
      'Conecte-se com milhares de pessoas que buscam acompanhamento nutricional qualificado.',
    stats: '+300% pacientes',
  },
  {
    icon: Calendar,
    title: 'Gestão Inteligente',
    description:
      'Sistema completo de agendamento, prontuários digitais e acompanhamento de pacientes.',
    stats: '100% digital',
  },
  {
    icon: TrendingUp,
    title: 'Crescimento Profissional',
    description:
      'Acesso a cursos, eventos e networking com outros profissionais da área.',
    stats: '+50 cursos',
  },
  {
    icon: Shield,
    title: 'Credibilidade',
    description:
      'Perfil verificado que transmite confiança e profissionalismo aos seus pacientes.',
    stats: 'Selo verificado',
  },
  {
    icon: Zap,
    title: 'Tecnologia Avançada',
    description:
      'Ferramentas modernas para consultas online, chat com pacientes e relatórios detalhados.',
    stats: 'IA integrada',
  },
  {
    icon: Award,
    title: 'Reconhecimento',
    description:
      'Sistema de avaliações e badges que destacam sua expertise e qualidade de atendimento.',
    stats: 'Top rated',
  },
  {
    icon: Briefcase,
    title: 'Oportunidades em UAN',
    description:
      'Desenvolva sua carreira em UAN e encontre oportunidades de consultoria, treinamento e assessoria em nutrição para empresas e organizações.',
    stats: 'Empresas parceiras',
  },
]

const plans = [
  {
    name: 'Básico',
    price: 'Gratuito',
    description: 'Ideal para começar',
    features: [
      'Perfil profissional',
      'Até 10 pacientes',
      'Agendamento básico',
      'Chat com pacientes',
      'Suporte por email',
    ],
    popular: false,
  },
  {
    name: 'Profissional',
    price: 'R$ 24,90/mês',
    priceOptions: 'R$ 137,90/semestre • R$ 264,90/ano',
    description: 'Para nutricionistas ativos',
    features: [
      'Perfil profissional',
      'Pacientes ilimitados',
      'Consultas por vídeo',
      'Relatórios avançados',
      'Prontuário digital',
      'Suporte prioritário',
      'Selo de verificação',
      'Gerenciamento de agenda',
      'Visibilidade e marketing',
      'Acesso a vagas de emprego',
      'Compartilhamento de conhecimento',
      'Oportunidades de consultoria',
      'Comunidade de nutricionistas',
      'Gerenciamento de consultas',
    ],
    popular: true,
  },
  {
    name: 'Clínica',
    price: 'R$ 99/mês',
    description: 'Para clínicas e equipes',
    features: [
      'Múltiplos profissionais',
      'Dashboard gerencial',
      'API personalizada',
      'White label',
      'Suporte dedicado',
      'Treinamento incluído',
    ],
    popular: false,
  },
]

const stats = [
  { number: '1000+', label: 'Nutricionistas' },
  { number: '5000+', label: 'Pacientes' },
  { number: '100', label: 'Cidades' },
  { number: '10', label: 'Anos de experiência' },
]

export default function ParaNutricionistasPage() {
  const [ stats, setStats ] = useState<PlatformStats | null>(null)
  console.log("🚀 ~ ParaNutricionistasPage ~ stats:", stats)

  const loadStats = useCallback(async () => {
    try {
      const platformStats = await getPlatformStats()
      console.log("🚀 ~ ParaNutricionistasPage ~ platformStats:", platformStats)
      setStats(platformStats)
    } catch (error) {
      // Error loading stats - handled silently
      // setError('Erro ao carregar estatísticas')
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [ loadStats ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
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
              <Button
                variant="ghost"
                className="hidden md:flex text-[#1E1D40] hover:text-[#4AB0D9]"
              >
                Entrar
              </Button>
            </Link>
            <Link href="/cadastro?tipo=nutricionista">
              <Button className="bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white">
                Cadastrar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-br from-[#4AB0D9]/10 via-white to-blue-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="space-y-8">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#4AB0D9]/10 text-[#4AB0D9] rounded-full text-sm font-medium">
                    <Zap className="h-4 w-4" />
                    Para Nutricionistas
                  </div>
                  <h1 className="text-4xl md:text-6xl font-bold text-[#1E1D40] leading-tight">
                    Expanda sua prática e{' '}
                    <span className="text-[#4AB0D9]">transforme vidas</span>
                  </h1>
                  <p className="text-xl text-[#1E1D40]/70 leading-relaxed">
                    Conecte-se com mais clientes, gerencie sua agenda de forma
                    inteligente e cresça profissionalmente na maior rede de
                    nutricionistas do Brasil. Seja você um nutricionista
                    clínico, consultor de UAN ou profissional em busca de novas
                    oportunidades, nossa plataforma é o lugar certo para você se
                    conectar e compartilhar sua expertise.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/cadastro?tipo=nutricionista">
                    <Button
                      size="lg"
                      className="bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white"
                    >
                      Começar Gratuitamente
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-[#4AB0D9] text-[#4AB0D9] bg-transparent"
                  >
                    Ver Demonstração
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
                  <div className="flex items-center justify-center sm:justify-start gap-4 sm:gap-6 md:gap-8 pt-2 md:pt-4">
                    <div className="text-center">
                      <div className="text-xl md:text-2xl font-bold text-[#1E1D40]">
                        {stats ? formatNumber(stats.totalNutricionistas) : '0'}
                      </div>
                      <div className="text-xs md:text-sm text-[#1E1D40]/60">
                        Nutricionistas
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl md:text-2xl font-bold text-[#1E1D40]">
                        {stats ? formatNumber(stats.totalPacientes) : '0'}
                      </div>
                      <div className="text-xs md:text-sm text-[#1E1D40]/60">
                        Clientes
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl md:text-2xl font-bold text-[#1E1D40]">
                        {stats ? formatRating(stats.averageRating) : '4'}
                      </div>
                      <div className="text-xs md:text-sm text-[#1E1D40]/60">
                        Satisfação
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-[#4AB0D9]/20 rounded-3xl transform rotate-6"></div>
                <Card className="relative border-0 shadow-2xl">
                  <CardContent className="p-0">
                    <img
                      src="/mulheratendente.png"
                      alt="Dashboard profissional para nutricionistas"
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
                Por que escolher a{' '}
                <span className="text-[#4AB0D9]">Busca Nutri</span>?
              </h2>
              <p className="text-xl text-[#1E1D40]/70 max-w-3xl mx-auto">
                A plataforma completa para nutricionistas que querem crescer e
                se destacar no mercado
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <Card
                  key={index}
                  className="border border-blue-100 hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-8 text-center">
                    <div className="w-12 h-12 bg-[#4AB0D9] rounded-xl flex items-center justify-center mx-auto mb-4">
                      <benefit.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-[#1E1D40] mb-3">
                      {benefit.title}
                    </h3>
                    <p className="text-[#1E1D40]/70 mb-4">
                      {benefit.description}
                    </p>
                    <Badge
                      variant="secondary"
                      className="bg-[#4AB0D9]/10 text-[#4AB0D9]"
                    >
                      {benefit.stats}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 bg-white">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1E1D40] mb-6">
                Planos que Crescem com Você
              </h2>
              <p className="text-lg text-[#1E1D40]/70">
                Escolha o plano ideal para o seu momento profissional
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <Card
                  key={index}
                  className={`relative ${plan.popular
                    ? 'border-2 border-[#4AB0D9] shadow-lg scale-105'
                    : 'border border-gray-200'
                    }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-[#4AB0D9] text-white px-4 py-1">
                        Mais Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl text-[#1E1D40]">
                      {plan.name}
                    </CardTitle>
                    <div className="text-3xl font-bold text-[#4AB0D9] mb-2">
                      {plan.price}
                    </div>
                    {plan.priceOptions && (
                      <div className="text-sm text-[#1E1D40]/60 mb-2">
                        {plan.priceOptions}
                      </div>
                    )}
                    <p className="text-[#1E1D40]/70">{plan.description}</p>
                    {plan.name === 'Profissional' && (
                      <p className="text-xs text-[#1E1D40]/50 mt-2">
                        *Os valores podem sofrer alteração
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className="flex items-center gap-3"
                        >
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-[#1E1D40]/80">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${plan.popular
                        ? 'bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-[#1E1D40]'
                        }`}
                    >
                      {plan.price === 'Gratuito'
                        ? 'Começar Grátis'
                        : 'Escolher Plano'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-[#4AB0D9] to-[#2563EB] text-white">
          <div className="container px-4 md:px-6 text-center">
            <div className="max-w-3xl mx-auto space-y-8">
              <h2 className="text-3xl md:text-5xl font-bold">
                Pronto para <span className="text-blue-200">expandir</span> sua
                prática?
              </h2>
              <p className="text-xl text-white/90">
                Junte-se a centenas de nutricionistas que já transformaram suas
                carreiras com a Busca Nutri
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/cadastro?tipo=nutricionista">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="bg-white text-[#4AB0D9] hover:bg-gray-100"
                  >
                    Começar Gratuitamente
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-[#4AB0D9] bg-transparent"
                >
                  Agendar Demonstração
                  <Calendar className="ml-2 h-5 w-5" />
                </Button>
              </div>
              <p className="text-sm text-white/70">
                Sem compromisso • Cancele quando quiser • Suporte especializado
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
