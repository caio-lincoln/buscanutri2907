'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  Users,
  Briefcase,
  UserCheck,
  MessageCircle,
  Phone,
  Mail,
  ChevronRight,
  HelpCircle,
  FileText,
  Settings,
  Shield,
  CreditCard,
  Calendar,
  Video,
  Star,
  MapPin,
  BookOpen,
  Award,
  TrendingUp,
  Heart,
  Zap,
  Building,
  CheckCircle,
  ChevronDown,
  Menu,
  X,
  LayoutDashboard,
  LogOut,
  Globe,
  Instagram,
} from 'lucide-react'

const helpCategories = [
  {
    icon: Users,
    title: 'Para Pacientes',
    description: 'Como encontrar nutricionistas, agendar consultas e usar a plataforma',
    color: 'bg-[#D90D32]',
    hoverColor: 'hover:bg-[#D90D32]/90',
    topics: [
      'Como criar uma conta de paciente',
      'Como encontrar o nutricionista ideal',
      'Como agendar consultas presenciais e online',
      'Como usar o chat para acompanhamento',
      'Como avaliar nutricionistas',
      'Formas de pagamento disponíveis',
      'Política de cancelamento e reembolso',
      'Suporte técnico para consultas online',
    ],
  },
  {
    icon: UserCheck,
    title: 'Para Nutricionistas',
    description: 'Gestão de perfil, consultas, pacientes e crescimento profissional',
    color: 'bg-[#4AB0D9]',
    hoverColor: 'hover:bg-[#4AB0D9]/90',
    topics: [
      'Como criar e otimizar seu perfil profissional',
      'Configuração de agenda e disponibilidade',
      'Gestão de consultas e pacientes',
      'Como definir preços e especialidades',
      'Ferramentas de avaliação nutricional',
      'Sistema de prontuários eletrônicos',
      'Recebimento de pagamentos',
      'Marketing digital para nutricionistas',
      'Certificações e validações',
    ],
  },
  {
    icon: Building,
    title: 'Para Empresas',
    description: 'Soluções corporativas, contratação e programas de bem-estar',
    color: 'bg-[#2A2951]',
    hoverColor: 'hover:bg-[#2A2951]/90',
    topics: [
      'Programas de bem-estar corporativo',
      'Contratação de nutricionistas especializados',
      'Consultoria em Unidades de Alimentação',
      'Palestras e workshops educativos',
      'Relatórios de saúde corporativa',
      'Planos empresariais flexíveis',
      'Integração com RH e benefícios',
      'Acompanhamento de resultados',
    ],
  },
]

const quickActions = [
  {
    icon: Calendar,
    title: 'Agendar Consulta',
    description: 'Encontre e agende com nutricionistas',
    href: '/nutricionistas',
    color: 'text-[#4AB0D9]',
  },
  {
    icon: Video,
    title: 'Consulta Online',
    description: 'Atendimento por videochamada',
    href: '/consulta-online',
    color: 'text-[#D90D32]',
  },
  {
    icon: FileText,
    title: 'Meus Prontuários',
    description: 'Acesse seu histórico médico',
    href: '/dashboard',
    color: 'text-[#2A2951]',
  },
  {
    icon: Star,
    title: 'Avaliar Atendimento',
    description: 'Compartilhe sua experiência',
    href: '/avaliacoes',
    color: 'text-[#4AB0D9]',
  },
]

const faqItems = [
  {
    question: 'Como funciona a plataforma Busca Nutri?',
    answer:
      'A Busca Nutri é uma plataforma que conecta pacientes a nutricionistas qualificados. Você pode buscar profissionais por localização, especialidade e tipo de atendimento, agendar consultas online ou presenciais, e acompanhar seu progresso através de ferramentas integradas.',
  },
  {
    question: 'Quais tipos de consulta estão disponíveis?',
    answer:
      'Oferecemos três modalidades: Consultas Presenciais (no consultório do nutricionista), Consultas Online (por vídeo chamada) e Acompanhamento via Chat (para dúvidas rápidas e ajustes no plano). Todas incluem avaliação nutricional personalizada e plano alimentar individualizado.',
  },
  {
    question: 'Como funciona o agendamento e cancelamento?',
    answer:
      'O agendamento é feito online através do perfil do nutricionista. Você pode cancelar ou reagendar consultas através da sua área pessoal, respeitando as políticas de cada profissional (geralmente 24h de antecedência). Cancelamentos dentro do prazo têm reembolso automático.',
  },
  {
    question: 'Quais formas de pagamento são aceitas?',
    answer:
      'Aceitamos cartões de crédito, débito, PIX e boleto bancário. Os pagamentos são processados de forma segura e o valor é liberado ao profissional após a realização da consulta. Para empresas, oferecemos faturamento personalizado.',
  },
  {
    question: 'Como funciona o sistema de avaliações?',
    answer:
      'Após cada consulta, pacientes podem avaliar o atendimento com notas de 1 a 5 estrelas e deixar comentários. Isso ajuda outros usuários na escolha e incentiva a qualidade do atendimento. Avaliações são verificadas para garantir autenticidade.',
  },
  {
    question: 'Existe suporte para consultas online?',
    answer:
      'Sim! Oferecemos suporte técnico completo para consultas online, incluindo teste de conexão, tutorial de uso da plataforma e suporte em tempo real durante as consultas. Nossa tecnologia garante qualidade de vídeo e áudio profissional.',
  },
  {
    question: 'Como funciona o programa para empresas?',
    answer:
      'Oferecemos soluções completas para empresas: programas de bem-estar corporativo, contratação de nutricionistas especializados, consultoria em UAN, palestras educativas e relatórios de saúde corporativa. Temos planos flexíveis para empresas de todos os tamanhos.',
  },
]

export default function CentralAjudaPage() {
  const { user, loading, signOut } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const currentDashboardUrl = user?.user_metadata?.user_type
    ? `/dashboard/${user.user_metadata.user_type === 'nutricionista' ? 'nutricionistas' : user.user_metadata.user_type}`
    : '/dashboard'

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-gray-100">
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

          <nav className="hidden lg:flex items-center gap-8">
            {/* Para Pacientes Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-[#1E1D40]/70 hover:text-[#4AB0D9] transition-all duration-300 relative group">
                Para Pacientes
                <ChevronDown className="h-4 w-4" />
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#4AB0D9] transition-all duration-300 group-hover:w-full"></span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/para-pacientes" className="w-full">
                    Encontrar Nutricionista
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/nutricionistas" className="w-full">
                    Ver Profissionais
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/cadastro?tipo=paciente" className="w-full">
                    Cadastrar-se
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Para Nutricionistas Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-[#1E1D40]/70 hover:text-[#4AB0D9] transition-all duration-300 relative group">
                Para Nutricionistas
                <ChevronDown className="h-4 w-4" />
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#4AB0D9] transition-all duration-300 group-hover:w-full"></span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/para-nutricionistas" className="w-full">
                    Expandir Prática
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/vagas" className="w-full">
                    Oportunidades
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/cadastro?tipo=nutricionista" className="w-full">
                    Cadastrar-se
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Para Empresas Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-[#1E1D40]/70 hover:text-[#4AB0D9] transition-all duration-300 relative group">
                Para Empresas
                <ChevronDown className="h-4 w-4" />
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#4AB0D9] transition-all duration-300 group-hover:w-full"></span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/para-empresas" className="w-full">
                    Soluções Corporativas
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/nutricionistas?tipo=consultoria"
                    className="w-full"
                  >
                    Encontrar Consultoria
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/vagas" className="w-full">
                    Publicar Vagas
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/cadastro?tipo=empresa" className="w-full">
                    Cadastrar Empresa
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Links diretos */}
            <Link
              href="/duvidas-pacientes"
              className="text-sm font-medium text-[#1E1D40]/70 hover:text-[#4AB0D9] transition-all duration-300 relative group"
            >
              Dúvidas dos Pacientes
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#4AB0D9] transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link
              href="/vagas"
              className="text-sm font-medium text-[#1E1D40]/70 hover:text-[#4AB0D9] transition-all duration-300 relative group"
            >
              Vagas
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#4AB0D9] transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link
              href="/blog"
              className="text-sm font-medium text-[#1E1D40]/70 hover:text-[#4AB0D9] transition-all duration-300 relative group"
            >
              Blog
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#4AB0D9] transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-20 h-9 bg-gray-200 animate-pulse rounded" />
            ) : user && user.user_metadata['user_type'] ? (
              // User is logged in - show dashboard and logout buttons
              <>
                <Link href={currentDashboardUrl}>
                  <Button
                    variant="ghost"
                    className="hidden md:flex items-center gap-2 text-[#1E1D40] hover:text-[#4AB0D9] hover:bg-[#4AB0D9]/5"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="hidden md:flex items-center gap-2 text-[#1E1D40] hover:text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button>
              </>
            ) : (
              // User is not logged in - show login and register buttons
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="hidden md:flex text-[#1E1D40] hover:text-[#4AB0D9] hover:bg-[#4AB0D9]/5"
                  >
                    Entrar
                  </Button>
                </Link>
                <Link href="/cadastro">
                  <Button className="bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white shadow-sm hover:shadow-md transition-all duration-300">
                    Cadastrar
                  </Button>
                </Link>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-[#4AB0D9]/10 p-2"
              onClick={toggleMobileMenu}
            >
              <Menu className="h-6 w-6 text-[#1E1D40]" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Menu Sidebar */}
      <div
        className={cn(
          'fixed top-0 right-0 w-full max-w-sm h-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-[70] lg:hidden overflow-hidden',
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header do Menu Mobile */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
          <Image
            src="/logo-busca-nutri.png"
            alt="Busca Nutri"
            width={120}
            height={24}
            className="h-6 w-auto"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={closeMobileMenu}
            className="hover:bg-gray-100 p-2"
          >
            <X className="h-5 w-5 text-[#1E1D40]" />
          </Button>
        </div>

        {/* Menu Content */}
        <div className="flex flex-col h-full overflow-y-auto">
          <div className="flex-1 p-4 space-y-6">
            {/* Navigation Links */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#1E1D40] uppercase tracking-wider">
                  Para Pacientes
                </h3>
                <div className="space-y-1 pl-3">
                  <Link
                    href="/para-pacientes"
                    className="block py-2 text-sm text-gray-600 hover:text-[#4AB0D9] transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Encontrar Nutricionista
                  </Link>
                  <Link
                    href="/nutricionistas"
                    className="block py-2 text-sm text-gray-600 hover:text-[#4AB0D9] transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Ver Profissionais
                  </Link>
                  <Link
                    href="/cadastro?tipo=paciente"
                    className="block py-2 text-sm text-gray-600 hover:text-[#4AB0D9] transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Cadastrar-se
                  </Link>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#1E1D40] uppercase tracking-wider">
                  Para Nutricionistas
                </h3>
                <div className="space-y-1 pl-3">
                  <Link
                    href="/para-nutricionistas"
                    className="block py-2 text-sm text-gray-600 hover:text-[#4AB0D9] transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Expandir Prática
                  </Link>
                  <Link
                    href="/vagas"
                    className="block py-2 text-sm text-gray-600 hover:text-[#4AB0D9] transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Oportunidades
                  </Link>
                  <Link
                    href="/cadastro?tipo=nutricionista"
                    className="block py-2 text-sm text-gray-600 hover:text-[#4AB0D9] transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Cadastrar-se
                  </Link>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#1E1D40] uppercase tracking-wider">
                  Para Empresas
                </h3>
                <div className="space-y-1 pl-3">
                  <Link
                    href="/para-empresas"
                    className="block py-2 text-sm text-gray-600 hover:text-[#4AB0D9] transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Soluções Corporativas
                  </Link>
                  <Link
                    href="/nutricionistas?tipo=consultoria"
                    className="block py-2 text-sm text-gray-600 hover:text-[#4AB0D9] transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Encontrar Consultoria
                  </Link>
                  <Link
                    href="/vagas"
                    className="block py-2 text-sm text-gray-600 hover:text-[#4AB0D9] transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Publicar Vagas
                  </Link>
                  <Link
                    href="/cadastro?tipo=empresa"
                    className="block py-2 text-sm text-gray-600 hover:text-[#4AB0D9] transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Cadastrar Empresa
                  </Link>
                </div>
              </div>

              <div className="border-t pt-4 space-y-1">
                <Link
                  href="/duvidas-pacientes"
                  className="block py-2 text-sm text-gray-600 hover:text-[#4AB0D9] transition-colors"
                  onClick={closeMobileMenu}
                >
                  Dúvidas dos Pacientes
                </Link>
                <Link
                  href="/vagas"
                  className="block py-2 text-sm text-gray-600 hover:text-[#4AB0D9] transition-colors"
                  onClick={closeMobileMenu}
                >
                  Vagas
                </Link>
                <Link
                  href="/blog"
                  className="block py-2 text-sm text-gray-600 hover:text-[#4AB0D9] transition-colors"
                  onClick={closeMobileMenu}
                >
                  Blog
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile Menu Footer */}
          <div className="p-4 border-t bg-gray-50">
            {loading ? (
              <div className="space-y-2">
                <div className="w-full h-10 bg-gray-200 animate-pulse rounded" />
                <div className="w-full h-10 bg-gray-200 animate-pulse rounded" />
              </div>
            ) : user && user.user_metadata['user_type'] ? (
              <div className="space-y-2">
                <Link href={currentDashboardUrl} onClick={closeMobileMenu}>
                  <Button className="w-full bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleLogout()
                    closeMobileMenu()
                  }}
                  className="w-full border-red-200 text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link href="/login" onClick={closeMobileMenu}>
                  <Button
                    variant="outline"
                    className="w-full border-[#4AB0D9] text-[#4AB0D9] hover:bg-[#4AB0D9]/5"
                  >
                    Entrar
                  </Button>
                </Link>
                <Link href="/cadastro" onClick={closeMobileMenu}>
                  <Button className="w-full bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white">
                    Cadastrar
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="container mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#4AB0D9]/10 text-[#4AB0D9] rounded-full text-sm font-medium mb-6">
              <HelpCircle className="h-4 w-4" />
              Central de Ajuda
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#1E1D40] mb-6">
              Como podemos <span className="text-[#4AB0D9]">ajudar você?</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Encontre respostas rápidas para suas dúvidas ou entre em contato
              conosco para suporte personalizado
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Digite sua dúvida aqui..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-32 py-4 text-lg bg-white border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-[#4AB0D9] focus:border-transparent"
                />
                <Button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white px-6 py-2 rounded-lg">
                  Buscar
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-[#1E1D40] mb-8 text-center">
              Ações Rápidas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <Link key={index} href={action.href}>
                  <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-gray-200 hover:border-[#4AB0D9]/30">
                    <CardContent className="p-6 text-center">
                      <action.icon
                        className={`h-12 w-12 mx-auto mb-4 ${action.color} group-hover:scale-110 transition-transform duration-300`}
                      />
                      <h3 className="font-semibold text-[#1E1D40] mb-2">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {action.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Help Categories */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-[#1E1D40] mb-8 text-center">
              Categorias de Ajuda
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {helpCategories.map((category, index) => (
                <Card
                  key={index}
                  className="group hover:shadow-xl transition-all duration-300 border-gray-200 hover:border-[#4AB0D9]/30"
                >
                  <CardHeader className="pb-4">
                    <div
                      className={`w-16 h-16 ${category.color} ${category.hoverColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <category.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl text-[#1E1D40]">
                      {category.title}
                    </CardTitle>
                    <p className="text-gray-600">{category.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {category.topics.slice(0, 5).map((topic, topicIndex) => (
                        <li
                          key={topicIndex}
                          className="flex items-center gap-3 text-sm text-gray-600 hover:text-[#4AB0D9] transition-colors cursor-pointer"
                        >
                          <CheckCircle className="h-4 w-4 text-[#4AB0D9] flex-shrink-0" />
                          {topic}
                        </li>
                      ))}
                      {category.topics.length > 5 && (
                        <li className="flex items-center gap-3 text-sm text-[#4AB0D9] font-medium cursor-pointer hover:underline">
                          <ChevronRight className="h-4 w-4" />
                          Ver mais {category.topics.length - 5} tópicos
                        </li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-[#1E1D40] mb-8 text-center">
              Perguntas Frequentes
            </h2>
            <div className="max-w-4xl mx-auto space-y-4">
              {faqItems.map((item, index) => (
                <Card
                  key={index}
                  className="border-gray-200 hover:border-[#4AB0D9]/30 transition-colors"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-[#1E1D40] flex items-center gap-3">
                      <HelpCircle className="h-5 w-5 text-[#4AB0D9]" />
                      {item.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Contact Section */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#1E1D40] mb-8">
              Ainda precisa de ajuda?
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Nossa equipe está sempre pronta para ajudar. Entre em contato
              conosco através dos canais abaixo.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="border-gray-200 hover:border-[#4AB0D9]/30 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <MessageCircle className="h-12 w-12 text-[#4AB0D9] mx-auto mb-4" />
                  <h3 className="font-semibold text-[#1E1D40] mb-2">
                    Chat Online
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Atendimento em tempo real
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Segunda a Sexta: 8h às 18h
                  </p>
                  <Button className="bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white">
                    Iniciar Chat
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-gray-200 hover:border-[#4AB0D9]/30 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <Mail className="h-12 w-12 text-[#4AB0D9] mx-auto mb-4" />
                  <h3 className="font-semibold text-[#1E1D40] mb-2">E-mail</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Resposta em até 24h
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    buscanutri@gmail.com
                  </p>
                  <Button
                    variant="outline"
                    className="border-[#4AB0D9] text-[#4AB0D9] hover:bg-[#4AB0D9]/5"
                  >
                    Enviar E-mail
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-gray-200 hover:border-[#4AB0D9]/30 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <Phone className="h-12 w-12 text-[#4AB0D9] mx-auto mb-4" />
                  <h3 className="font-semibold text-[#1E1D40] mb-2">Telefone</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Suporte por telefone
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    (79) 9 9813-4938
                  </p>
                  <Button
                    variant="outline"
                    className="border-[#4AB0D9] text-[#4AB0D9] hover:bg-[#4AB0D9]/5"
                  >
                    Ligar Agora
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#2A2951] text-white">
        <div className="container mx-auto px-6 lg:px-8">
          {/* Main Footer Content */}
          <div className="py-16 grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            {/* Brand Info */}
            <div className="space-y-6">
              <Image
                src="/logo-busca-nutri.png"
                alt="Busca Nutri"
                width={160}
                height={32}
                className="h-6 md:h-7 w-auto brightness-0 invert mx-auto sm:mx-0"
              />
              <p className="text-white/70 text-sm leading-relaxed">
                Conectando nutricionistas e transformando vidas através da
                tecnologia e colaboração. A plataforma que revoluciona o cuidado
                nutricional.
              </p>
            </div>

            {/* Plataforma */}
            <div className="space-y-6">
              <h3 className="font-semibold text-lg">Plataforma</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="/nutricionistas"
                    className="text-white/70 hover:text-[#4AB0D9] transition-colors"
                  >
                    Nutricionistas
                  </Link>
                </li>
                <li>
                  <Link
                    href="/vagas"
                    className="text-white/70 hover:text-[#4AB0D9] transition-colors"
                  >
                    Vagas
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cadastro"
                    className="text-white/70 hover:text-[#4AB0D9] transition-colors"
                  >
                    Cadastro
                  </Link>
                </li>
              </ul>
            </div>

            {/* Suporte */}
            <div className="space-y-6">
              <h3 className="font-semibold text-lg">Suporte</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="/central-ajuda"
                    className="text-white/70 hover:text-[#4AB0D9] transition-colors"
                  >
                    Central de Ajuda
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="text-white/70 hover:text-[#4AB0D9] transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <h3 className="font-semibold text-lg">Contato</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-white/70">
                  <Mail className="h-4 w-4 text-[#4AB0D9]" />
                  <span>buscanutri@gmail.com</span>
                </div>
                <div className="flex items-center gap-3 text-white/70">
                  <Phone className="h-4 w-4 text-[#4AB0D9]" />
                  <span>(79) 9 9813-4938</span>
                </div>
                <div className="flex items-center gap-3 text-white/70">
                  <Globe className="h-4 w-4 text-[#4AB0D9]" />
                  <span>www.buscanutri.com.br</span>
                </div>
                <div className="flex items-center gap-3 text-white/70">
                  <Instagram className="h-4 w-4 text-[#4AB0D9]" />
                  <span>@buscanutri</span>
                </div>
                <div className="flex items-center gap-3 text-white/70">
                  <MapPin className="h-4 w-4 text-[#4AB0D9]" />
                  <span>Aracaju, SE - Brasil</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-white/20 py-6 md:py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
              <div className="text-center md:text-left">
                <div className="text-white/70 text-xs md:text-sm">
                  © 2024 Busca Nutri. Todos os direitos reservados.
                </div>
                <div className="text-white/50 text-xs mt-1">
                  CNPJ: 57.370.073/0001-92
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-xs md:text-sm">
                <Link
                  href="/termos"
                  className="text-white/70 hover:text-[#4AB0D9] transition-colors"
                >
                  Termos de Uso
                </Link>
                <Link
                  href="/privacidade"
                  className="text-white/70 hover:text-[#4AB0D9] transition-colors"
                >
                  Política de Privacidade
                </Link>
                <Link
                  href="/cookies"
                  className="text-white/70 hover:text-[#4AB0D9] transition-colors"
                >
                  Cookies
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
