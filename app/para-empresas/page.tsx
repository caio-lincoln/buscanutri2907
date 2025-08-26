import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Building,
  Users,
  Shield,
  Briefcase,
  Award,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Heart,
  Phone,
  Mail,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Para Empresas - Busca Nutri',
  description:
    'Soluções corporativas em nutrição. Programas de bem-estar, contratação de profissionais e consultoria especializada para sua empresa.',
}

const solutions = [
  {
    icon: Users,
    title: 'Bem-estar Corporativo',
    description:
      'Programas de nutrição personalizados para melhorar a saúde e produtividade dos colaboradores',
    features: [
      'Consultas individuais',
      'Palestras educativas',
      'Cardápios corporativos',
      'Acompanhamento contínuo',
    ],
    color: 'bg-blue-500',
  },
  {
    icon: Briefcase,
    title: 'Recrutamento Especializado',
    description:
      'Encontre e contrate os melhores nutricionistas para sua equipe ou projetos específicos',
    features: [
      'Banco de talentos',
      'Processo seletivo',
      'Avaliação técnica',
      'Suporte na contratação',
    ],
    color: 'bg-green-500',
  },
  {
    icon: Shield,
    title: 'Consultoria Nutricional',
    description:
      'Assessoria especializada para restaurantes, hospitais, escolas e indústria alimentícia',
    features: [
      'Análise nutricional',
      'Desenvolvimento de produtos',
      'Compliance regulatório',
      'Treinamento de equipes',
    ],
    color: 'bg-purple-500',
  },
]

const benefits = [
  {
    icon: TrendingUp,
    title: 'Aumento da Produtividade',
    description: 'Colaboradores mais saudáveis são até 25% mais produtivos',
    stat: '+25%',
  },
  {
    icon: Heart,
    title: 'Redução do Absenteísmo',
    description: 'Programas de nutrição reduzem faltas por problemas de saúde',
    stat: '-40%',
  },
  {
    icon: Award,
    title: 'Melhoria do Clima',
    description: 'Investimento em saúde aumenta satisfação e engajamento',
    stat: '+60%',
  },
  {
    icon: Shield,
    title: 'Redução de Custos',
    description: 'Menor gasto com planos de saúde e afastamentos médicos',
    stat: '-30%',
  },
]

const plans = [
  {
    name: 'Startup',
    price: 'A partir de R$ 2.200/mês',
    priceDetails: 'R$ 44 por funcionário',
    description: 'Para empresas até 50 funcionários',
    subPlans: [
      {
        type: 'Plano Básico Mensal',
        price: 'R$ 2.200/mês',
        features: [
          'Até 50 colaboradores',
          'Orientações nutricionais mensais',
          'Palestras mensais',
          'Relatórios básicos',
          'Suporte por email',
        ],
      },
      {
        type: 'Plano Básico Avulso',
        price: 'R$ 2.500',
        features: [
          'Até 50 colaboradores',
          'Orientações nutricionais',
          '1 palestra',
          'Relatórios básicos',
          'Suporte por email',
        ],
      },
      {
        type: 'Plano Premium Mensal',
        price: 'R$ 4.400/mês',
        features: [
          'Até 50 colaboradores',
          'Consultas mensais',
          'Palestras bimestrais',
          'Relatórios básicos',
          'Suporte por email',
        ],
      },
      {
        type: 'Plano Premium Avulso',
        price: 'R$ 5.000',
        features: [
          'Até 50 colaboradores',
          'Consulta nutricional',
          '1 Palestra',
          'Relatórios básicos',
          'Suporte por email',
        ],
      },
    ],
    popular: false,
  },
  {
    name: 'Corporativo',
    price: 'A partir de R$ 7.800/mês',
    priceDetails: 'R$ 39-90 por funcionário',
    description: 'Para empresas de médio porte',
    subPlans: [
      {
        type: 'Plano Básico Mensal',
        price: 'R$ 7.800/mês',
        features: [
          'Até 200 colaboradores',
          'Orientações nutricionais',
          '1 palestra',
          'Relatórios básicos',
          'Suporte por email',
        ],
      },
      {
        type: 'Plano Básico Avulso',
        price: 'R$ 9.000',
        features: [
          'Até 200 colaboradores',
          'Orientações nutricionais',
          '1 palestra',
          'Relatórios básicos',
          'Suporte por email',
        ],
      },
      {
        type: 'Plano Premium Mensal',
        price: 'R$ 80 por funcionário',
        features: [
          'Até 200 colaboradores',
          'Consultas mensais',
          'Palestras bimestrais',
          'Relatórios básicos',
          'Suporte por email',
        ],
      },
      {
        type: 'Plano Premium Avulso',
        price: 'R$ 90 por funcionário',
        features: [
          'Até 200 colaboradores',
          'Consultas mensais',
          '1 palestra',
          'Relatórios básicos',
          'Suporte por email',
        ],
      },
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Sob consulta',
    description: 'Para grandes corporações',
    features: [
      'Colaboradores ilimitados',
      'Programa personalizado',
      'Equipe dedicada',
      'Relatórios customizados',
      'Suporte 24/7',
      'Consultoria estratégica',
    ],
    popular: false,
  },
]

export default function ParaEmpresasPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
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
            <Link href="/cadastro?tipo=empresa">
              <Button className="bg-[#1E1D40] hover:bg-[#1E1D40]/90 text-white">
                Cadastrar Empresa
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-br from-[#1E1D40]/10 via-white to-slate-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="space-y-8">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1E1D40]/10 text-[#1E1D40] rounded-full text-sm font-medium">
                    <Building className="h-4 w-4" />
                    Para Empresas
                  </div>
                  <h1 className="text-4xl md:text-6xl font-bold text-[#1E1D40] leading-tight">
                    Transforme a{' '}
                    <span className="text-[#4AB0D9]">saúde corporativa</span> da
                    sua empresa
                  </h1>
                  <p className="text-xl text-[#1E1D40]/70 leading-relaxed">
                    Soluções completas em nutrição para empresas: programas de
                    bem-estar, recrutamento de profissionais e consultoria
                    especializada.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/cadastro?tipo=empresa">
                    <Button
                      size="lg"
                      className="bg-[#1E1D40] hover:bg-[#1E1D40]/90 text-white"
                    >
                      Solicitar Proposta
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-[#1E1D40] text-[#1E1D40] bg-transparent"
                  >
                    Agendar Demonstração
                  </Button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#1E1D40]">
                      2
                    </div>
                    <div className="text-sm text-[#1E1D40]/60">
                      Empresas Atendidas
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#1E1D40]">
                      5
                    </div>
                    <div className="text-sm text-[#1E1D40]/60">
                      Colaboradores
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#1E1D40]">100%</div>
                    <div className="text-sm text-[#1E1D40]/60">Satisfação</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#1E1D40]">100%</div>
                    <div className="text-sm text-[#1E1D40]/60">
                      Redução Custos
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-[#1E1D40]/20 rounded-3xl transform rotate-6"></div>
                <Card className="relative border-0 shadow-2xl">
                  <CardContent className="p-0">
                    <img
                      src="/homemapertandoamao.png"
                      alt="Equipe corporativa participando de programa de bem-estar nutricional"
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

        {/* Solutions Section */}
        <section className="py-20 bg-white">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-[#1E1D40] mb-6">
                Soluções <span className="text-[#4AB0D9]">Corporativas</span>
              </h2>
              <p className="text-xl text-[#1E1D40]/70 max-w-3xl mx-auto">
                Programas personalizados para atender as necessidades
                específicas da sua empresa
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {solutions.map((solution, index) => (
                <Card
                  key={index}
                  className="border-2 hover:border-[#4AB0D9] hover:shadow-lg transition-all"
                >
                  <CardHeader>
                    <div
                      className={`w-12 h-12 ${solution.color} rounded-xl flex items-center justify-center mb-4`}
                    >
                      <solution.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl text-[#1E1D40]">
                      {solution.title}
                    </CardTitle>
                    <p className="text-[#1E1D40]/70">{solution.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {solution.features.map((feature, featureIndex) => (
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
                    <Button className="w-full mt-6 bg-[#1E1D40] hover:bg-[#1E1D40]/90">
                      Saiba Mais
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-slate-50/30">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1E1D40] mb-6">
                Benefícios Comprovados
              </h2>
              <p className="text-lg text-[#1E1D40]/70">
                Investir na saúde dos colaboradores gera resultados mensuráveis
                para sua empresa
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <Card
                  key={index}
                  className="text-center hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-8">
                    <div className="w-12 h-12 bg-[#1E1D40] rounded-xl flex items-center justify-center mx-auto mb-4">
                      <benefit.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-[#4AB0D9] mb-2">
                      {benefit.stat}
                    </div>
                    <h3 className="font-semibold text-[#1E1D40] mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-[#1E1D40]/70">
                      {benefit.description}
                    </p>
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
                Planos Corporativos
              </h2>
              <p className="text-lg text-[#1E1D40]/70">
                Soluções flexíveis que se adaptam ao tamanho da sua empresa
              </p>
              <p className="text-sm text-[#1E1D40]/60 mt-4 italic">
                * Os valores podem sofrer alterações
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {plans.map((plan, index) => (
                <Card
                  key={index}
                  className={`relative ${
                    plan.popular
                      ? 'border-2 border-[#1E1D40] shadow-lg scale-105'
                      : 'border border-gray-200'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-[#1E1D40] text-white px-4 py-1">
                        Mais Escolhido
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl text-[#1E1D40]">
                      {plan.name}
                    </CardTitle>
                    <div className="text-2xl font-bold text-[#4AB0D9] mb-1">
                      {plan.price}
                    </div>
                    {plan.priceDetails && (
                      <div className="text-sm text-[#1E1D40]/60 mb-2">
                        {plan.priceDetails}
                      </div>
                    )}
                    <p className="text-[#1E1D40]/70">{plan.description}</p>
                  </CardHeader>
                  <CardContent>
                    {plan.subPlans ? (
                      <div className="space-y-6">
                        {plan.subPlans.map((subPlan, subIndex) => (
                          <div
                            key={subIndex}
                            className="border-l-4 border-[#4AB0D9] pl-4"
                          >
                            <h4 className="font-semibold text-[#1E1D40] mb-2">
                              {subPlan.type}
                            </h4>
                            <div className="text-lg font-bold text-[#4AB0D9] mb-3">
                              {subPlan.price}
                            </div>
                            <ul className="space-y-2">
                              {subPlan.features.map((feature, featureIndex) => (
                                <li
                                  key={featureIndex}
                                  className="flex items-center gap-2"
                                >
                                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                  <span className="text-xs text-[#1E1D40]/80">
                                    {feature}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
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
                    )}
                    <Button
                      className={`w-full mt-6 ${
                        plan.popular
                          ? 'bg-[#1E1D40] hover:bg-[#1E1D40]/90 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-[#1E1D40]'
                      }`}
                    >
                      {plan.price === 'Sob consulta'
                        ? 'Falar com Consultor'
                        : 'Solicitar Proposta'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="py-20 bg-slate-50/30">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-[#1E1D40] mb-6">
                  Pronto para Transformar sua Empresa?
                </h2>
                <p className="text-lg text-[#1E1D40]/70">
                  Entre em contato conosco e receba uma proposta personalizada
                </p>
              </div>

              <Card className="shadow-lg border-0">
                <CardContent className="p-8">
                  <form className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1E1D40]">
                          Nome do Responsável
                        </label>
                        <Input placeholder="Seu nome completo" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1E1D40]">
                          E-mail Corporativo
                        </label>
                        <Input type="email" placeholder="seu@empresa.com" />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1E1D40]">
                          Nome da Empresa
                        </label>
                        <Input placeholder="Nome da sua empresa" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1E1D40]">
                          Número de Funcionários
                        </label>
                        <select className="w-full h-10 px-3 border border-gray-300 rounded-md">
                          <option>Selecione</option>
                          <option>1-50</option>
                          <option>51-200</option>
                          <option>201-500</option>
                          <option>500+</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#1E1D40]">
                        Interesse
                      </label>
                      <select className="w-full h-10 px-3 border border-gray-300 rounded-md">
                        <option>Selecione o tipo de solução</option>
                        <option>Bem-estar Corporativo</option>
                        <option>Recrutamento de Nutricionistas</option>
                        <option>Consultoria Nutricional</option>
                        <option>Solução Personalizada</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#1E1D40]">
                        Mensagem
                      </label>
                      <Textarea
                        placeholder="Conte-nos mais sobre suas necessidades..."
                        className="min-h-[120px]"
                      />
                    </div>
                    <Button
                      size="lg"
                      className="w-full bg-[#1E1D40] hover:bg-[#1E1D40]/90"
                    >
                      Solicitar Proposta
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-[#1E1D40] to-[#2A2859] text-white">
          <div className="container px-4 md:px-6 text-center">
            <div className="max-w-3xl mx-auto space-y-8">
              <h2 className="text-3xl md:text-5xl font-bold">
                Invista na <span className="text-blue-200">saúde</span> dos seus
                colaboradores
              </h2>
              <p className="text-xl text-white/90">
                Empresas que investem em bem-estar têm colaboradores mais
                produtivos, engajados e satisfeitos
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/cadastro?tipo=empresa">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="bg-white text-[#1E1D40] hover:bg-gray-100"
                  >
                    Começar Agora
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-[#1E1D40] bg-transparent"
                >
                  Falar com Especialista
                  <Phone className="ml-2 h-5 w-5" />
                </Button>
              </div>
              <div className="flex items-center justify-center gap-8 text-sm text-white/70">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>empresas@buscanutri.com.br</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>(79) 9 9813-4938</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
