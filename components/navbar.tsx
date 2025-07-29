"use client"

import Link from "next/link"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
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
                <Link href="/telemedicina/agendar" className="w-full">
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
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/login" className="text-gray-600 hover:text-[#1E1D40] transition duration-300">
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="bg-[#4AB0D9] text-white py-2 px-4 rounded-md hover:bg-[#3989ac] transition duration-300"
          >
            Cadastrar
          </Link>
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
            "fixed top-0 right-0 w-64 h-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50",
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
                  href="/telemedicina/agendar"
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
          <div className="p-4 mt-auto flex flex-col space-y-3">
            <Link
              href="/login"
              onClick={closeMobileMenu}
              className="text-gray-600 hover:text-[#1E1D40] transition duration-300 block py-2"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              onClick={closeMobileMenu}
              className="bg-[#4AB0D9] text-white py-2 px-4 rounded-md hover:bg-[#3989ac] transition duration-300 block text-center"
            >
              Cadastrar
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
