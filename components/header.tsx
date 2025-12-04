'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  Menu,
  ChevronDown,
  X,
  LogOut,
  LayoutDashboard,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { UserType } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, loading, signOut } = useAuth()

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false)
  }, [])

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await signOut()
      closeMobileMenu()
    } catch (error) {
      // Error signing out - handled silently
    }
  }, [signOut, closeMobileMenu])

  // Get dashboard URL based on user type
  const getDashboardUrl = useCallback((userType: UserType) => {
    switch (userType) {
      case 'paciente':
        return '/dashboard/paciente'
      case 'nutricionista':
        return '/dashboard/nutricionistas'
      case 'empresa':
        return '/dashboard/empresa'
      case 'admin':
        return '/dashboard/admin'
      default:
        return '/dashboard/paciente'
    }
  }, [])

  // Memoize dashboard URL for current user
  const currentDashboardUrl = useMemo(() => {
    return getDashboardUrl(user?.user_metadata?.['user_type'])
  }, [user?.user_metadata, getDashboardUrl])

  // Toggle mobile menu
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev)
  }, [])

  // Prevent body scroll when menu is open
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
    <>
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
                  <Link href="/cadastro?tipo=empresa" className="w-full">
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
            <Link
              href="/contato"
              className="text-sm font-medium text-[#1E1D40]/70 hover:text-[#4AB0D9] transition-all duration-300 relative group"
            >
              Contato
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#4AB0D9] transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-20 h-9 bg-gray-200 animate-pulse rounded" />
            ) : user && user.user_metadata?.['user_type'] ? (
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
        <div className="flex flex-col h-full">
          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto py-4 pb-0">
            {/* Para Pacientes */}
            <div className="px-4 mb-6">
              <h3 className="text-[#1E1D40] font-semibold text-sm mb-3 px-3">
                Para Pacientes
              </h3>
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
              <h3 className="text-[#1E1D40] font-semibold text-sm mb-3 px-3">
                Para Nutricionistas
              </h3>
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
              <h3 className="text-[#1E1D40] font-semibold text-sm mb-3 px-3">
                Para Empresas
              </h3>
              <div className="space-y-1">
                <Link
                  href="/para-empresas"
                  onClick={closeMobileMenu}
                  className="flex items-center px-3 py-2.5 text-[#1E1D40]/70 hover:text-[#4AB0D9] hover:bg-[#4AB0D9]/5 rounded-lg transition-all duration-200 text-sm"
                >
                  Soluções Corporativas
                </Link>
                <Link
                  href="/nutricionistas?tipo=consultoria"
                  onClick={closeMobileMenu}
                  className="flex items-center px-3 py-2.5 text-[#1E1D40]/70 hover:text-[#4AB0D9] hover:bg-[#4AB0D9]/5 rounded-lg transition-all duration-200 text-sm"
                >
                  Encontrar Consultoria
                </Link>
                <Link
                  href="/cadastro?tipo=empresa"
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
                  href="/duvidas-pacientes"
                  onClick={closeMobileMenu}
                  className="flex items-center px-3 py-2.5 text-[#1E1D40]/70 hover:text-[#4AB0D9] hover:bg-[#4AB0D9]/5 rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  Dúvidas dos Pacientes
                </Link>
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
                <Link
                  href="/contato"
                  onClick={closeMobileMenu}
                  className="flex items-center px-3 py-2.5 text-[#1E1D40]/70 hover:text-[#4AB0D9] hover:bg-[#4AB0D9]/5 rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  Contato
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex-shrink-0 p-4 pt-6 border-t border-gray-100 bg-white">
            {loading ? (
              <div className="space-y-3">
                <div className="w-full h-12 bg-gray-200 animate-pulse rounded" />
                <div className="w-full h-12 bg-gray-200 animate-pulse rounded" />
              </div>
            ) : (
              <div className="space-y-3">
                {user && user.user_metadata?.['user_type'] ? (
                  // User is logged in - show dashboard and logout buttons
                  <>
                    <Link
                      href={currentDashboardUrl}
                      onClick={closeMobileMenu}
                      className="block"
                    >
                      <Button
                        variant="outline"
                        className="w-full justify-center gap-2 border-[#4AB0D9] text-[#4AB0D9] hover:bg-[#4AB0D9] hover:text-white"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="w-full justify-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
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
                        className="w-full justify-center border-[#4AB0D9] text-[#4AB0D9] hover:bg-[#4AB0D9] hover:text-white"
                      >
                        Entrar
                      </Button>
                    </Link>
                    <Link href="/cadastro" onClick={closeMobileMenu} className="block">
                      <Button className="w-full justify-center bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white">
                        Cadastrar
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
