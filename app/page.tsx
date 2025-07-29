"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import {
  Users,
  Calendar,
  CheckCircle,
  MapPin,
  Lock,
  ArrowRight,
  Shield,
  Heart,
  Zap,
  Menu,
  Mail,
  Phone,
  MapPinIcon,
  Building,
  Briefcase,
  BarChart3,
  ChevronDown,
  Globe,
  Instagram,
  X,
  LogOut,
  LayoutDashboard,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getCurrentUser, signOut } from "@/lib/auth"
import type { UserType } from "@/lib/supabase"

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error("Error checking auth:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut()
      setUser(null)
      closeMobileMenu()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // Get dashboard URL based on user type
  const getDashboardUrl = (userType: UserType) => {
    switch (userType) {
      case "paciente":
        return "/dashboard/paciente"
      case "nutricionista":
        return "/dashboard/nutricionistas"
      case "empresa":
        return "/dashboard/empresa"
      case "admin":
        return "/dashboard/admin"
      default:
        return "/dashboard/paciente"
    }
  }

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
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
            ) : user && user.user_type ? (
              // User is logged in - show dashboard and logout buttons
              <>
                <Link href={getDashboardUrl(user.user_type)}>
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
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-[60] lg:hidden" onClick={closeMobileMenu} />}

      {/* Mobile Menu Sidebar */}
      <div
        className={cn(
          "fixed top-0 right-0 w-80 h-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-[70] lg:hidden overflow-hidden",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header do Menu Mobile */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
          <Image src="/logo-busca-nutri.png" alt="Busca Nutri" width={120} height={24} className="h-6 w-auto" />
          <Button variant="ghost" size="icon" onClick={closeMobileMenu} className="hover:bg-gray-100 p-2">
            <X className="h-5 w-5 text-[#1E1D40]" />
          </Button>
        </div>

        {/* Menu Content */}
        <div className="flex flex-col h-full">
          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto py-4">
            {/* Para Pacientes */}
            <div className="px-4 mb-6">
              <h3 className="text-[#1E1D40] font-semibold text-sm mb-3 px-3">Para Pacientes</h3>
              <div className="space-y-1">
                <Link
                  href="/para-pacientes"
                  onClick={closeMobileMenu}
                  className="flex items-center px-3 py-2.5 text-[#1E1D40]/70 hover:text-[#4AB0D9] hover:bg-[#4AB0D9]/5 rounded-lg transition-all duration-200 text-sm"
                >
                  Encontrar Nutricionista
                </Link>
                <Link
                  href="/nutricionistas"
                  onClick={closeMobileMenu}
                  className="flex items-center px-3 py-2.5 text-[#1E1D40]/70 hover:text-[#4AB0D9] hover:bg-[#4AB0D9]/5 rounded-lg transition-all duration-200 text-sm"
                >
                  Ver Profissionais
                </Link>
                <Link
                  href="/cadastro?tipo=paciente"
                  onClick={closeMobileMenu}
                  className="flex items-center px-3 py-2.5 text-[#1E1D40]/70 hover:text-[#4AB0D9] hover:bg-[#4AB0D9]/5 rounded-lg transition-all duration-200 text-sm"
                >
                  Cadastrar-se
                </Link>
              </div>
            </div>

            {/* Para Nutricionistas */}
            <div className="px-4 mb-6">
              <h3 className="text-[#1E1D40] font-semibold text-sm mb-3 px-3">Para Nutricionistas</h3>
              <div className="space-y-1">
                <Link
                  href="/para-nutricionistas"
                  onClick={closeMobileMenu}
                  className="flex items-center px-3 py-2.5 text-[#1E1D40]/70 hover:text-[#4AB0D9] hover:bg-[#4AB0D9]/5 rounded-lg transition-all duration-200 text-sm"
                >
                  Expandir Prática
                </Link>
                <Link
                  href="/vagas"
                  onClick={closeMobileMenu}
                  className="flex items-center px-3 py-2.5 text-[#1E1D40]/70 hover:text-[#4AB0D9] hover:bg-[#4AB0D9]/5 rounded-lg transition-all duration-200 text-sm"
                >
                  Oportunidades
                </Link>
                <Link
                  href="/cadastro?tipo=nutricionista"
                  onClick={closeMobileMenu}
                  className="flex items-center px-3 py-2.5 text-[#1E1D40]/70 hover:text-[#4AB0D9] hover:bg-[#4AB0D9]/5 rounded-lg transition-all duration-200 text-sm"
                >
                  Cadastrar-se
                </Link>
              </div>
            </div>

            {/* Para Empresas */}
            <div className="px-4 mb-6">
              <h3 className="text-[#1E1D40] font-semibold text-sm mb-3 px-3">Para Empresas</h3>
              <div className="space-y-1">
                <Link
                  href="/para-empresas"
                  onClick={closeMobileMenu}
                  className="flex items-center px-3 py-2.5 text-[#1E1D40]/70 hover:text-[#4AB0D9] hover:bg-[#4AB0D9]/5 rounded-lg transition-all duration-200 text-sm"
                >
                  Soluções Corporativas
                </Link>
                <Link
                  href="/vagas"
                  onClick={closeMobileMenu}
                  className="flex items-center px-3 py-2.5 text-[#1E1D40]/70 hover:text-[#4AB0D9] hover:bg-[#4AB0D9]/5 rounded-lg transition-all duration-200 text-sm"
                >
                  Publicar Vagas
                </Link>
                <Link
                  href="/cadastro?tipo=empresa"
                  onClick={closeMobileMenu}
                  className="flex items-center px-3 py-2.5 text-[#1E1D40]/70 hover:text-[#4AB0D9] hover:bg-[#4AB0D9]/5 rounded-lg transition-all duration-200 text-sm"
                >
                  Cadastrar Empresa
                </Link>
              </div>
            </div>

            {/* Links Diretos */}
            <div className="px-4 mb-6">
              <div className="space-y-1">
                <Link
                  href="/vagas"
                  onClick={closeMobileMenu}
                  className="flex items-center px-3 py-2.5 text-[#1E1D40]/70 hover:text-[#4AB0D9] hover:bg-[#4AB0D9]/5 rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  Vagas
                </Link>
                <Link
                  href="/blog"
                  onClick={closeMobileMenu}
                  className="flex items-center px-3 py-2.5 text-[#1E1D40]/70 hover:text-[#4AB0D9] hover:bg-[#4AB0D9]/5 rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  Blog
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-gray-100 bg-white">
            <div className="space-y-3">
              {loading ? (
                <div className="space-y-3">
                  <div className="w-full h-10 bg-gray-200 animate-pulse rounded" />
                  <div className="w-full h-10 bg-gray-200 animate-pulse rounded" />
                </div>
              ) : user && user.user_type ? (
                // User is logged in - show dashboard and logout buttons
                <>
                  <Link href={getDashboardUrl(user.user_type)} onClick={closeMobileMenu} className="block">
                    <Button
                      variant="outline"
                      className="w-full border-[#4AB0D9] text-[#4AB0D9] hover:bg-[#4AB0D9] hover:text-white bg-transparent flex items-center gap-2"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Button 
                    onClick={() => { handleLogout(); closeMobileMenu(); }}
                    variant="outline"
                    className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 bg-transparent flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </Button>
                </>
              ) : (
                // User is not logged in - show login and register buttons
                <>
                  <Link href="/login" onClick={closeMobileMenu} className="block">
                    <Button
                      variant="outline"
                      className="w-full border-[#4AB0D9] text-[#4AB0D9] hover:bg-[#4AB0D9] hover:text-white bg-transparent"
                    >
                      Entrar
                    </Button>
                  </Link>
                  <Link href="/cadastro" onClick={closeMobileMenu} className="block">
                    <Button className="w-full bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white">Cadastrar</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-br from-[#F2E6D8] via-white to-[#F2E6D8]/50">
          <div className="container relative px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="space-y-8">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#4AB0D9]/10 text-[#4AB0D9] rounded-full text-sm font-medium">
                    <Zap className="h-4 w-4" />
                    Plataforma Inovadora
                  </div>
                  <h1 className="text-4xl md:text-6xl font-bold text-[#1E1D40] leading-tight">
                    Conectando <span className="text-[#4AB0D9]">Nutricionistas</span>, Transformando Vidas
                  </h1>
                  <p className="text-xl text-[#1E1D40]/70 leading-relaxed">
                    Uma plataforma feita por e para nutricionistas. Alcance mais pacientes, compartilhe conhecimento e
                    cresça com quem entende suas necessidades.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/cadastro">
                    <Button
                      size="lg"
                      className="bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white shadow-lg text-lg px-8 py-6"
                    >
                      Quero me cadastrar
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-[#1E1D40] text-[#1E1D40] hover:bg-[#1E1D40] hover:text-white text-lg px-8 py-6 bg-transparent"
                  >
                    Explorar funcionalidades
                  </Button>
                </div>
                <div className="flex items-center gap-8 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#1E1D40]">500+</div>
                    <div className="text-sm text-[#1E1D40]/60">Nutricionistas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#1E1D40]">2.5k+</div>
                    <div className="text-sm text-[#1E1D40]/60">Pacientes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#1E1D40]">98%</div>
                    <div className="text-sm text-[#1E1D40]/60">Satisfação</div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-[#4AB0D9] rounded-3xl transform rotate-6 opacity-20"></div>
                <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-[#F2E6D8]">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/nutricionista.jpg-y2F6mgG9bo8MuEtEswxmQ8RwNgDF8g.jpeg"
                    alt="Dashboard da Plataforma Busca Nutri"
                    className="w-full h-auto rounded-2xl"
                    width={600}
                    height={500}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="sobre" className="py-20 bg-white">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="space-y-6">
                <h2 className="text-3xl md:text-5xl font-bold text-[#1E1D40]">
                  Muito além de uma plataforma. <span className="text-[#4AB0D9]">Uma comunidade.</span>
                </h2>
                <p className="text-xl text-[#1E1D40]/70 leading-relaxed">
                  A <strong className="text-[#4AB0D9]">Busca Nutri</strong> é uma plataforma digital desenvolvida para
                  fortalecer a prática da nutrição por meio da colaboração. Aqui, profissionais trocam experiências,
                  acessam ferramentas exclusivas e expandem sua visibilidade.
                </p>
                <p className="text-lg text-[#1E1D40]/70">
                  Mais do que tecnologia, promovemos{" "}
                  <strong className="text-[#D90D32]">relacionamentos, aprendizado e transformação</strong>.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-8 mt-12">
                <Card className="border border-[#F2E6D8] shadow-lg hover:shadow-xl transition-shadow bg-[#F2E6D8]/30">
                  <CardContent className="p-8 text-center">
                    <div className="w-12 h-12 bg-[#4AB0D9] rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-[#1E1D40] mb-2">Comunidade Ativa</h3>
                    <p className="text-[#1E1D40]/70">
                      Conecte-se com profissionais e pacientes em uma rede colaborativa
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-[#F2E6D8] shadow-lg hover:shadow-xl transition-shadow bg-[#F2E6D8]/30">
                  <CardContent className="p-8 text-center">
                    <div className="w-12 h-12 bg-[#4AB0D9] rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-[#1E1D40] mb-2">Segurança Total</h3>
                    <p className="text-[#1E1D40]/70">
                      Plataforma segura com verificação de profissionais e proteção de dados
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-[#F2E6D8] shadow-lg hover:shadow-xl transition-shadow bg-[#F2E6D8]/30">
                  <CardContent className="p-8 text-center">
                    <div className="w-12 h-12 bg-[#4AB0D9] rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-[#1E1D40] mb-2">Tecnologia Avançada</h3>
                    <p className="text-[#1E1D40]/70">Ferramentas modernas para gestão, agendamento e comunicação</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* For Patients */}
        <section id="pacientes" className="py-20 bg-white">
          <div className="container px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="relative lg:order-first">
                <div className="absolute inset-0 bg-[#D90D32]/20 rounded-3xl transform rotate-6"></div>
                <Card className="relative border-0 shadow-2xl">
                  <CardContent className="p-0">
                    <img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/paciente.jpg-CwmrerfDsyZaJrmf0Gu4UMCPLRImMU.jpeg"
                      alt="Paciente usando aplicativo mobile para encontrar nutricionista"
                      className="w-full h-auto rounded-3xl"
                      width={600}
                      height={500}
                    />
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#D90D32]/10 text-[#D90D32] rounded-full text-sm font-medium">
                    <Heart className="h-4 w-4" />
                    Para Pacientes
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold text-[#1E1D40]">
                    Encontre o nutricionista ideal de forma{" "}
                    <span className="text-[#4AB0D9]">rápida, segura e acessível</span>
                  </h2>
                  <p className="text-xl text-[#1E1D40]/70 leading-relaxed">
                    Através da Busca Nutri, você conecta-se com profissionais verificados, agendando consultas
                    presenciais ou online com facilidade e confiança.
                  </p>
                </div>
                <div className="grid gap-4">
                  {[
                    { icon: CheckCircle, text: "Perfis verificados e avaliações reais" },
                    { icon: MapPin, text: "Nutricionistas próximos de você" },
                    { icon: Calendar, text: "Agendamento online sem complicações" },
                    { icon: Lock, text: "Privacidade e segurança garantidas" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-xl hover:bg-[#F2E6D8]/30 transition-colors"
                    >
                      <div className="w-10 h-10 bg-[#D90D32] rounded-lg flex items-center justify-center flex-shrink-0">
                        <item.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[#1E1D40] font-medium">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/para-pacientes">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-[#D90D32] text-[#D90D32] hover:bg-[#D90D32] hover:text-white bg-transparent"
                  >
                    Procurar nutricionista
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* For Companies */}
        <section id="empresas" className="py-20 bg-[#F2E6D8]/30">
          <div className="container px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1E1D40]/10 text-[#1E1D40] rounded-full text-sm font-medium">
                    <Building className="h-4 w-4" />
                    Para Empresas
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold text-[#1E1D40]">
                    Encontre os melhores profissionais de nutrição para sua{" "}
                    <span className="text-[#4AB0D9]">empresa</span>
                  </h2>
                  <p className="text-xl text-[#1E1D40]/70 leading-relaxed">
                    Conecte-se com nutricionistas qualificados para programas de bem-estar corporativo, consultorias e
                    contratações. Transforme a saúde da sua equipe.
                  </p>
                </div>
                <div className="grid gap-4">
                  {[
                    { icon: Users, text: "Acesso a profissionais verificados e especializados" },
                    { icon: Briefcase, text: "Publicação de vagas e processos seletivos" },
                    { icon: Shield, text: "Programas de bem-estar corporativo personalizados" },
                    { icon: BarChart3, text: "Relatórios e métricas de saúde organizacional" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-[#1E1D40] rounded-lg flex items-center justify-center flex-shrink-0">
                        <item.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[#1E1D40] font-medium">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/para-empresas">
                  <Button size="lg" className="bg-[#1E1D40] hover:bg-[#1E1D40]/90 text-white">
                    Contratar nutricionistas
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-[#1E1D40]/20 rounded-3xl transform -rotate-6"></div>
                <Card className="relative border-0 shadow-2xl">
                  <CardContent className="p-0">
                    <img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/empresa.jpg-KTvAsK2IUWPYz70x0PRBvZbnsSPKex.jpeg"
                      alt="Dashboard empresarial para gestão de nutricionistas e bem-estar corporativo"
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

        {/* Newsletter Section */}
        <section className="py-20 bg-gradient-to-br from-[#1E1D40] via-[#2D2B5F] to-[#3A3875] text-white">
          <div className="container px-4 md:px-6">
            <div className="max-w-2xl mx-auto">
              <div className="text-center space-y-6 mb-12">
                <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                  Comece agora a transformar sua prática com a <span className="text-[#4AB0D9]">Busca Nutri</span>
                </h2>
                <p className="text-lg text-white/80">
                  Cadastre-se gratuitamente e descubra como é fácil crescer em comunidade.
                </p>
              </div>
              <Card className="border-0 shadow-2xl bg-white">
                <CardContent className="p-8">
                  <form className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-[#1E1D40] font-medium text-sm">
                          Nome completo
                        </Label>
                        <Input
                          id="name"
                          placeholder="Seu nome completo"
                          className="h-12 border-gray-200 focus:border-[#4AB0D9] focus:ring-[#4AB0D9] rounded-lg"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-[#1E1D40] font-medium text-sm">
                          E-mail
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          className="h-12 border-gray-200 focus:border-[#4AB0D9] focus:ring-[#4AB0D9] rounded-lg"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[#1E1D40] font-medium text-sm">Qual é o seu perfil?</Label>
                      <RadioGroup defaultValue="nutricionista" className="grid grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:border-[#4AB0D9] transition-colors cursor-pointer">
                          <RadioGroupItem
                            value="nutricionista"
                            id="nutricionista"
                            className="border-[#4AB0D9] text-[#4AB0D9]"
                          />
                          <Label htmlFor="nutricionista" className="text-[#1E1D40] font-medium cursor-pointer text-sm">
                            Nutricionista
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:border-[#4AB0D9] transition-colors cursor-pointer">
                          <RadioGroupItem value="paciente" id="paciente" className="border-[#4AB0D9] text-[#4AB0D9]" />
                          <Label htmlFor="paciente" className="text-[#1E1D40] font-medium cursor-pointer text-sm">
                            Paciente
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:border-[#4AB0D9] transition-colors cursor-pointer">
                          <RadioGroupItem value="empresa" id="empresa" className="border-[#4AB0D9] text-[#4AB0D9]" />
                          <Label htmlFor="empresa" className="text-[#1E1D40] font-medium cursor-pointer text-sm">
                            Empresa
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white shadow-lg h-12 text-base font-medium rounded-lg"
                    >
                      Quero fazer parte
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#1E1D40] text-white">
        <div className="container px-4 md:px-6">
          {/* Main Footer Content */}
          <div className="py-16">
            <div className="grid gap-8 lg:grid-cols-4 md:grid-cols-2">
              {/* Company Info */}
              <div className="space-y-6">
                <Image
                  src="/logo-busca-nutri.png"
                  alt="Busca Nutri"
                  width={160}
                  height={32}
                  className="h-7 w-auto brightness-0 invert mx-auto md:mx-0"
                />
                <p className="text-white/70 text-sm leading-relaxed">
                  Conectando nutricionistas e transformando vidas através da tecnologia e colaboração. A plataforma que
                  revoluciona o cuidado nutricional.
                </p>
                <div className="flex gap-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-white/70 text-sm">4.9 (1.2k avaliações)</span>
                </div>
              </div>

              {/* Platform Links */}
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Plataforma</h3>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link href="/para-pacientes" className="text-white/70 hover:text-[#4AB0D9] transition-colors">
                      Para Pacientes
                    </Link>
                  </li>
                  <li>
                    <Link href="/para-nutricionistas" className="text-white/70 hover:text-[#4AB0D9] transition-colors">
                      Para Nutricionistas
                    </Link>
                  </li>
                  <li>
                    <Link href="/para-empresas" className="text-white/70 hover:text-[#4AB0D9] transition-colors">
                      Para Empresas
                    </Link>
                  </li>
                  <li>
                    <Link href="/vagas" className="text-white/70 hover:text-[#4AB0D9] transition-colors">
                      Vagas
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog" className="text-white/70 hover:text-[#4AB0D9] transition-colors">
                      Blog
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Support Links */}
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Suporte</h3>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link href="/ajuda" className="text-white/70 hover:text-[#4AB0D9] transition-colors">
                      Central de Ajuda
                    </Link>
                  </li>
                  <li>
                    <Link href="/contato" className="text-white/70 hover:text-[#4AB0D9] transition-colors">
                      Contato
                    </Link>
                  </li>
                  <li>
                    <Link href="/faq" className="text-white/70 hover:text-[#4AB0D9] transition-colors">
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
                    <span>(79) 99915-8274</span>
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
                    <MapPinIcon className="h-4 w-4 text-[#4AB0D9]" />
                    <span>Aracaju, SE - Brasil</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-white/20 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-white/70 text-sm">
                © {new Date().getFullYear()} Busca Nutri. Todos os direitos reservados.
              </div>
              <div className="flex gap-6 text-sm">
                <Link href="/termos" className="text-white/70 hover:text-[#4AB0D9] transition-colors">
                  Termos de Uso
                </Link>
                <Link href="/privacidade" className="text-white/70 hover:text-[#4AB0D9] transition-colors">
                  Política de Privacidade
                </Link>
                <Link href="/cookies" className="text-white/70 hover:text-[#4AB0D9] transition-colors">
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
