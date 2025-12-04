'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import CalculadoraCorporativa from '@/components/calculadora-corporativa'
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
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const formData = new FormData(e.currentTarget)
    const nome = formData.get('nome') as string
    const email = formData.get('email') as string
    const empresa = formData.get('empresa') as string
    const funcionarios = formData.get('funcionarios') as string
    const interesse = formData.get('interesse') as string
    const mensagem = formData.get('mensagem') as string
    
    // Criar mensagem para WhatsApp
    const whatsappMessage = `🏢 *SOLICITAÇÃO DE PROPOSTA CORPORATIVA*

👤 *Responsável:* ${nome}
📧 *E-mail:* ${email}
🏢 *Empresa:* ${empresa}
👥 *Funcionários:* ${funcionarios}
🎯 *Interesse:* ${interesse}

💬 *Mensagem:*
${mensagem}

Aguardo retorno para mais informações sobre os planos corporativos!`
    
    const encodedMessage = encodeURIComponent(whatsappMessage)
    const whatsappUrl = `https://wa.me/5579998134938?text=${encodedMessage}`
    
    // Tentar abrir em nova aba
    const newWindow = window.open(whatsappUrl, '_blank')
    
    // Se não conseguir abrir (popup blocker), redirecionar na mesma aba
    if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
      window.location.href = whatsappUrl
    }
  }

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
                  <Link
                    href={
                      `https://wa.me/5579998134938?text=${encodeURIComponent('Olá! Sou uma empresa e gostaria de solicitar uma proposta corporativa de planos e serviços.')}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      size="lg"
                      className="bg-[#1E1D40] hover:bg-[#1E1D40]/90 text-white"
                    >
                      Solicitar Proposta
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link
                    href="https://wa.me/5579998134938?text=Olá! Sou uma empresa, e gostaria de agendar demonstração sobre nutrição corporativa"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-2 border-[#1E1D40] text-[#1E1D40] bg-transparent"
                    >
                      Agendar Demonstração
                    </Button>
                  </Link>
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
                    <Link
                      href={`https://wa.me/5579998134938?text=Olá! Gostaria de saber mais sobre ${solution.title.toLowerCase()} da plataforma Busca Nutri.`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button className="w-full mt-6 bg-[#1E1D40] hover:bg-[#1E1D40]/90">
                        Saiba Mais
                      </Button>
                    </Link>
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

        {/* Calculator Section */}
        <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50/30">
          <div className="container px-4 md:px-6">
            <CalculadoraCorporativa />
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
                  <form className="space-y-6" onSubmit={handleFormSubmit}>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1E1D40]">
                          Nome do Responsável
                        </label>
                        <Input name="nome" placeholder="Seu nome completo" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1E1D40]">
                          E-mail Corporativo
                        </label>
                        <Input name="email" type="email" placeholder="seu@empresa.com" required />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1E1D40]">
                          Nome da Empresa
                        </label>
                        <Input name="empresa" placeholder="Nome da sua empresa" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1E1D40]">
                          Número de Funcionários
                        </label>
                        <select name="funcionarios" className="w-full h-10 px-3 border border-gray-300 rounded-md" required>
                          <option value="">Selecione</option>
                          <option value="1-50">1-50</option>
                          <option value="51-200">51-200</option>
                          <option value="201-500">201-500</option>
                          <option value="500+">500+</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#1E1D40]">
                        Interesse
                      </label>
                      <select name="interesse" className="w-full h-10 px-3 border border-gray-300 rounded-md" required>
                        <option value="">Selecione o tipo de solução</option>
                        <option value="Bem-estar Corporativo">Bem-estar Corporativo</option>
                        <option value="Recrutamento de Nutricionistas">Recrutamento de Nutricionistas</option>
                        <option value="Consultoria Nutricional">Consultoria Nutricional</option>
                        <option value="Solução Personalizada">Solução Personalizada</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#1E1D40]">
                        Mensagem
                      </label>
                      <Textarea
                        name="mensagem"
                        placeholder="Conte-nos mais sobre suas necessidades..."
                        className="min-h-[120px]"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
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
                <Link
                  href={
                    `mailto:empresas@buscanutri.com.br?subject=${encodeURIComponent('Solicitação de proposta corporativa')}&body=${encodeURIComponent('Olá! Sou uma empresa e gostaria de solicitar uma proposta corporativa de planos e serviços. Podemos conversar?')}`
                  }
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white hover:text-[#1E1D40] bg-transparent"
                  >
                    Falar com Especialista
                    <Phone className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
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
