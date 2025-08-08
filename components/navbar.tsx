"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from "next/navigation"
import { ChevronDown, User, LogOut, Settings } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, signOut } = useAuth()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
      closeMobileMenu()
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    }
  }

  const getDashboardLink = () => {
    if (!user) return "/login"
    
    switch (user.user_type) {
      case "nutricionista":
        return "/dashboard/nutricionistas"
      case "paciente":
        return "/dashboard/paciente"
      case "empresa":
        return "/dashboard/empresa"
      case "admin":
        return "/dashboard/admin"
      default:
        return "/dashboard/paciente"
    }
  }

  const getUserDisplayName = () => {
    if (!user) return ""
    return user.email?.split("@")[0] || "Usuário"
  }

  return (
    <nav className="bg-white py-4 shadow-md">
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-[#1E1D40]">
          BuscaNutri
        </Link>

        {/* Menu (Desktop) */}
        <div className="hidden md:flex items-center space-x-6">
          {/* Para Pacientes Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center text-gray-600 hover:text-[#1E1D40] transition duration-300 focus:outline-none">
              Para Pacientes
              <ChevronDown className="ml-1 h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/para-pacientes" className="w-full">
                  Visão Geral
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/nutricionistas" className="w-full">
                  Encontrar Nutricionistas
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/nutricionistas" className="w-full">
                  Agendar Consulta
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/paciente" className="w-full">
                  Minha Área
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Para Nutricionistas Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center text-gray-600 hover:text-[#1E1D40] transition duration-300 focus:outline-none">
              Para Nutricionistas
              <ChevronDown className="ml-1 h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/para-nutricionistas" className="w-full">
                  Visão Geral
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/nutricionistas" className="w-full">
                  Minha Área
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/vagas" className="w-full">
                  Oportunidades
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/central-ajuda" className="w-full">
                  Suporte
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Para Empresas Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center text-gray-600 hover:text-[#1E1D40] transition duration-300 focus:outline-none">
              Para Empresas
              <ChevronDown className="ml-1 h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/para-empresas" className="w-full">
                  Visão Geral
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/empresa" className="w-full">
                  Minha Área
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/vagas" className="w-full">
                  Publicar Vagas
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/contato" className="w-full">
                  Contato Comercial
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Vagas - Link direto */}
          <Link href="/vagas" className="text-gray-600 hover:text-[#1E1D40] transition duration-300">
            Vagas
          </Link>

          {/* Blog - Link direto */}
          <Link href="/blog" className="text-gray-600 hover:text-[#1E1D40] transition duration-300">
            Blog
          </Link>
        </div>

        {/* Botões (Desktop) */}
        <div className="hidden md:flex items-center space-x-3">
          {loading ? (
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : user ? (
            <div className="flex items-center space-x-3">
              <Link
                href={getDashboardLink()}
                className="flex items-center space-x-2 text-gray-600 hover:text-[#1E1D40] transition duration-300 px-3 py-2 rounded-md hover:bg-gray-50"
              >
                <User className="h-4 w-4" />
                <span className="font-medium">Dashboard</span>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 px-3 py-2 h-auto">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-[#4AB0D9] text-white text-sm font-semibold">
                        {getUserDisplayName().charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start min-w-0">
                      <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                        {getUserDisplayName()}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {user.user_type}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href={getDashboardLink()} className="flex items-center space-x-2 w-full">
                      <User className="h-4 w-4" />
                      <span>Meu Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center space-x-2 text-red-600 focus:text-red-600">
                    <LogOut className="h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-[#1E1D40] transition duration-300 px-3 py-2 rounded-md hover:bg-gray-50">
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="bg-[#4AB0D9] text-white py-2 px-4 rounded-md hover:bg-[#3989ac] transition duration-300 font-medium"
              >
                Cadastrar
              </Link>
            </>
          )}
        </div>

        {/* Menu Hamburguer (Mobile) */}
        <button onClick={toggleMobileMenu} className="md:hidden text-gray-600 hover:text-[#1E1D40] focus:outline-none">
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>

        {/* Menu Mobile (Overlay) */}
        <div
          className={cn(
            "fixed top-0 right-0 w-80 h-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto",
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          {/* Header do Menu Mobile */}
          <div className="p-4 flex items-center justify-between border-b">
            <Link href="/" className="text-2xl font-bold text-[#1E1D40]">
              BuscaNutri
            </Link>
            <button onClick={closeMobileMenu} className="text-gray-600 hover:text-[#1E1D40] focus:outline-none">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          {/* Links do Menu Mobile */}
          <div className="flex flex-col p-4 space-y-3">
            {/* Para Pacientes - Mobile */}
            <div className="space-y-2">
              <div className="text-gray-800 font-medium py-2">Para Pacientes</div>
              <div className="pl-4 space-y-2">
                <Link
                  href="/para-pacientes"
                  onClick={closeMobileMenu}
                  className="text-gray-600 hover:text-[#1E1D40] transition duration-300 block py-1"
                >
                  Visão Geral
                </Link>
                <Link
                  href="/nutricionistas"
                  onClick={closeMobileMenu}
                  className="text-gray-600 hover:text-[#1E1D40] transition duration-300 block py-1"
                >
                  Encontrar Nutricionistas
                </Link>
                <Link
                  href="/nutricionistas"
                  onClick={closeMobileMenu}
                  className="text-gray-600 hover:text-[#1E1D40] transition duration-300 block py-1"
                >
                  Agendar Consulta
                </Link>
                <Link
                  href="/dashboard/paciente"
                  onClick={closeMobileMenu}
                  className="text-gray-600 hover:text-[#1E1D40] transition duration-300 block py-1"
                >
                  Minha Área
                </Link>
              </div>
            </div>

            {/* Para Nutricionistas - Mobile */}
            <div className="space-y-2">
              <div className="text-gray-800 font-medium py-2">Para Nutricionistas</div>
              <div className="pl-4 space-y-2">
                <Link
                  href="/para-nutricionistas"
                  onClick={closeMobileMenu}
                  className="text-gray-600 hover:text-[#1E1D40] transition duration-300 block py-1"
                >
                  Visão Geral
                </Link>
                <Link
                  href="/dashboard/nutricionistas"
                  onClick={closeMobileMenu}
                  className="text-gray-600 hover:text-[#1E1D40] transition duration-300 block py-1"
                >
                  Minha Área
                </Link>
                <Link
                  href="/vagas"
                  onClick={closeMobileMenu}
                  className="text-gray-600 hover:text-[#1E1D40] transition duration-300 block py-1"
                >
                  Oportunidades
                </Link>
                <Link
                  href="/central-ajuda"
                  onClick={closeMobileMenu}
                  className="text-gray-600 hover:text-[#1E1D40] transition duration-300 block py-1"
                >
                  Suporte
                </Link>
              </div>
            </div>

            {/* Para Empresas - Mobile */}
            <div className="space-y-2">
              <div className="text-gray-800 font-medium py-2">Para Empresas</div>
              <div className="pl-4 space-y-2">
                <Link
                  href="/para-empresas"
                  onClick={closeMobileMenu}
                  className="text-gray-600 hover:text-[#1E1D40] transition duration-300 block py-1"
                >
                  Visão Geral
                </Link>
                <Link
                  href="/dashboard/empresa"
                  onClick={closeMobileMenu}
                  className="text-gray-600 hover:text-[#1E1D40] transition duration-300 block py-1"
                >
                  Minha Área
                </Link>
                <Link
                  href="/vagas"
                  onClick={closeMobileMenu}
                  className="text-gray-600 hover:text-[#1E1D40] transition duration-300 block py-1"
                >
                  Publicar Vagas
                </Link>
                <Link
                  href="/contato"
                  onClick={closeMobileMenu}
                  className="text-gray-600 hover:text-[#1E1D40] transition duration-300 block py-1"
                >
                  Contato Comercial
                </Link>
              </div>
            </div>

            {/* Links diretos - Mobile */}
            <Link
              href="/vagas"
              onClick={closeMobileMenu}
              className="text-gray-600 hover:text-[#1E1D40] transition duration-300 block py-2"
            >
              Vagas
            </Link>
            <Link
              href="/blog"
              onClick={closeMobileMenu}
              className="text-gray-600 hover:text-[#1E1D40] transition duration-300 block py-2"
            >
              Blog
            </Link>
          </div>

          {/* Botões Mobile */}
          <div className="p-4 mt-auto flex flex-col space-y-3 border-t bg-gray-50">
            {loading ? (
              <div className="space-y-3">
                <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : user ? (
              <>
                {/* Informações do usuário */}
                <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border shadow-sm">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-[#4AB0D9] text-white font-semibold">
                      {getUserDisplayName().charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {getUserDisplayName()}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">
                      {user.user_type}
                    </span>
                  </div>
                </div>
                
                {/* Botão Dashboard */}
                <Link
                  href={getDashboardLink()}
                  onClick={closeMobileMenu}
                  className="flex items-center justify-center space-x-2 bg-[#4AB0D9] text-white py-3 px-4 rounded-lg hover:bg-[#3989ac] transition duration-300 font-medium w-full min-h-[48px]"
                >
                  <User className="h-5 w-5" />
                  <span>Meu Dashboard</span>
                </Link>
                
                {/* Botão Sair */}
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50 py-3 px-4 rounded-lg transition duration-300 font-medium border border-red-200 w-full min-h-[48px]"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sair</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="text-gray-600 hover:text-[#1E1D40] transition duration-300 block py-3 px-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 font-medium w-full min-h-[48px] flex items-center justify-center"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  onClick={closeMobileMenu}
                  className="bg-[#4AB0D9] text-white py-3 px-4 rounded-lg hover:bg-[#3989ac] transition duration-300 block text-center font-medium w-full min-h-[48px] flex items-center justify-center"
                >
                  Cadastrar
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
