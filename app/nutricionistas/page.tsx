"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, MapPin, Star, Video, Users, Grid3X3, List, Briefcase, Menu, X, Loader2, Award } from "lucide-react"
import { getAllNutritionists, formatNutritionistData } from "@/lib/nutritionist-service"
import type { NutritionistProfile } from "@/lib/supabase" // Importa a interface real

const specialties = [
  "Todas",
  "Nutrição Clínica",
  "Nutrição Esportiva",
  "Nutrição Infantil",
  "Emagrecimento",
  "Nutrição Vegana",
  "Distúrbios Alimentares",
  "Nutrição Geriátrica",
  "Nutrição Funcional",
]

const states = [
  "Todas",
  "SP",
  "RJ",
  "MG",
  "RS",
  "PR",
  "SC",
  "BA",
  "GO",
  "PE",
  "CE",
  "PA",
  "DF",
  "ES",
  "PB",
  "RN",
  "MT",
  "MS",
  "AL",
  "PI",
  "SE",
  "RO",
  "AC",
  "AM",
  "RR",
  "AP",
  "TO",
  "MA",
]

const priceRanges = [
  { label: "Todos", min: 0, max: 1000 },
  { label: "Até R$ 100", min: 0, max: 100 },
  { label: "R$ 100 - R$ 150", min: 100, max: 150 },
  { label: "R$ 150 - R$ 200", min: 150, max: 200 },
  { label: "Acima de R$ 200", min: 200, max: 1000 },
]

export default function NutricionistasPage() {
  const [nutritionists, setNutritionists] = useState<NutritionistProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSpecialty, setSelectedSpecialty] = useState("Todas")
  const [selectedState, setSelectedState] = useState("Todas")
  const [selectedPriceRange, setSelectedPriceRange] = useState(priceRanges[0])
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [sortBy, setSortBy] = useState("rating")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Carregar nutricionistas do banco de dados
  useEffect(() => {
    async function loadNutritionists() {
      try {
        setLoading(true)
        const data = await getAllNutritionists()
        setNutritionists(data)
      } catch (error) {
        console.error("Erro ao carregar nutricionistas:", error)
      } finally {
        setLoading(false)
      }
    }

    loadNutritionists()
  }, [])

  // Gerenciar overflow do body quando o menu mobile está aberto
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    // Cleanup function para restaurar o overflow quando o componente for desmontado
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [mobileMenuOpen])

  // Filtrar e ordenar nutricionistas
  const filteredNutritionists = useMemo(() => {
    const filtered = nutritionists.filter((nutritionist) => {
      const formattedData = formatNutritionistData(nutritionist)

      const matchesSearch =
        formattedData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formattedData.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (nutritionist.specialties || []).some((spec) => spec.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesSpecialty =
        selectedSpecialty === "Todas" || (nutritionist.specialties || []).includes(selectedSpecialty)

      // O filtro por estado agora verifica se a string do estado está contida no endereço
      const matchesState =
        selectedState === "Todas" || (nutritionist.address ?? "").toUpperCase().includes(selectedState.toUpperCase())

      const matchesPrice =
        nutritionist.consultation_price === undefined ||
        nutritionist.consultation_price === null ||
        (nutritionist.consultation_price >= selectedPriceRange.min &&
          nutritionist.consultation_price <= selectedPriceRange.max)

      const matchesOnline = !onlineOnly || nutritionist.online_consultation || false

      return matchesSearch && matchesSpecialty && matchesState && matchesPrice && matchesOnline
    })

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.rating || 0) - (a.rating || 0)
        case "price-low":
          return (a.consultation_price || 0) - (b.consultation_price || 0)
        case "price-high":
          return (b.consultation_price || 0) - (a.consultation_price || 0)
        case "name":
          return a.full_name.localeCompare(b.full_name)
        case "experience":
          return (b.experience_years || 0) - (a.experience_years || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [nutritionists, searchTerm, selectedSpecialty, selectedState, selectedPriceRange, onlineOnly, sortBy])

  // Structured Data para SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Nutricionistas - Busca Nutri",
    description: "Encontre os melhores nutricionistas verificados",
    numberOfItems: filteredNutritionists.length,
    itemListElement: filteredNutritionists.map((nutritionist, index) => {
      const formatted = formatNutritionistData(nutritionist)
      return {
        "@type": "Person",
        position: index + 1,
        name: formatted.name,
        jobTitle: "Nutricionista",
        description: formatted.bio,
        address: {
          "@type": "PostalAddress",
          addressLocality: formatted.location,
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: formatted.rating,
          reviewCount: formatted.reviews,
        },
        offers: formatted.services.map((service) => ({
          "@type": "Offer",
          name: service.name,
          price: service.price,
          priceCurrency: "BRL",
        })),
        knowsAbout: formatted.specializations,
        url: `/nutricionistas/${nutritionist.id}`,
      }
    }),
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#4AB0D9] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#1E1D40] mb-2">Carregando nutricionistas...</h2>
          <p className="text-[#1E1D40]/70">Buscando os melhores profissionais para você</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        {/* Header */}
        <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-gray-100">
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
                href="/para-pacientes"
                className="text-sm font-medium text-[#1E1D40]/70 hover:text-[#4AB0D9] transition-all duration-300"
              >
                Para Pacientes
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
                <Button className="bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white">Cadastrar</Button>
              </Link>

              {/* Mobile Menu Button */}
              <Button variant="ghost" size="sm" className="md:hidden p-2" onClick={() => setMobileMenuOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileMenuOpen(false)} />
        )}

        {/* Mobile Menu */}
        <div
          className={`fixed top-0 right-0 z-50 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden overflow-hidden ${
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Header do Menu Mobile */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
            <Image src="/logo-busca-nutri.png" alt="Busca Nutri" width={120} height={24} className="h-6 w-auto" />
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="hover:bg-gray-100 p-2">
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
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center px-3 py-2.5 text-[#1E1D40]/70 hover:text-[#4AB0D9] hover:bg-[#4AB0D9]/5 rounded-lg transition-all duration-200 text-sm"
                  >
                    Encontrar Nutricionista
                  </Link>
                  <Link
                    href="/nutricionistas"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center px-3 py-2.5 text-[#1E1D40]/70 hover:text-[#4AB0D9] hover:bg-[#4AB0D9]/5 rounded-lg transition-all duration-200 text-sm"
                  >
                    Ver Profissionais
                  </Link>
                  <Link
                    href="/cadastro?tipo=paciente"
                    onClick={() => setMobileMenuOpen(false)}
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
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center px-3 py-2.5 text-[#1E1D40]/70 hover:text-[#4AB0D9] hover:bg-[#4AB0D9]/5 rounded-lg transition-all duration-200 text-sm"
                  >
                    Expandir Prática
                  </Link>
                  <Link
                    href="/vagas"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center px-3 py-2.5 text-[#1E1D40]/70 hover:text-[#4AB0D9] hover:bg-[#4AB0D9]/5 rounded-lg transition-all duration-200 text-sm"
                  >
                    Oportunidades
                  </Link>
                  <Link
                    href="/cadastro?tipo=nutricionista"
                    onClick={() => setMobileMenuOpen(false)}
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
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center px-3 py-2.5 text-[#1E1D40]/70 hover:text-[#4AB0D9] hover:bg-[#4AB0D9]/5 rounded-lg transition-all duration-200 text-sm"
                  >
                    Soluções Corporativas
                  </Link>
                  <Link
                    href="/cadastro?tipo=empresa"
                    onClick={() => setMobileMenuOpen(false)}
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
                    href="/blog"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center px-3 py-2.5 text-[#1E1D40]/70 hover:text-[#4AB0D9] hover:bg-[#4AB0D9]/5 rounded-lg transition-all duration-200 text-sm font-medium"
                  >
                    Blog
                  </Link>
                  <Link
                    href="/central-ajuda"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center px-3 py-2.5 text-[#1E1D40]/70 hover:text-[#4AB0D9] hover:bg-[#4AB0D9]/5 rounded-lg transition-all duration-200 text-sm font-medium"
                  >
                    Central de Ajuda
                  </Link>
                  <Link
                    href="/faq"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center px-3 py-2.5 text-[#1E1D40]/70 hover:text-[#4AB0D9] hover:bg-[#4AB0D9]/5 rounded-lg transition-all duration-200 text-sm font-medium"
                  >
                    FAQ
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-gray-100 bg-white">
              <div className="space-y-3">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block">
                  <Button
                    variant="outline"
                    className="w-full border-[#4AB0D9] text-[#4AB0D9] hover:bg-[#4AB0D9] hover:text-white bg-transparent"
                  >
                    Entrar
                  </Button>
                </Link>
                <Link href="/cadastro" onClick={() => setMobileMenuOpen(false)} className="block">
                  <Button className="w-full bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white">Cadastrar</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <main className="container px-4 md:px-6 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-[#1E1D40] mb-6">
              Encontre o <span className="text-[#4AB0D9]">nutricionista ideal</span>
            </h1>
            <p className="text-xl text-[#1E1D40]/70 max-w-3xl mx-auto mb-8">
              Conecte-se com profissionais verificados e transforme sua saúde com acompanhamento especializado
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#4AB0D9]">{nutritionists.length}+</div>
                <div className="text-sm text-[#1E1D40]/70">Profissionais</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#4AB0D9]">
                  {nutritionists.length > 0
                    ? (nutritionists.reduce((acc, n) => acc + (n.rating || 0), 0) / nutritionists.length).toFixed(1)
                    : "4.8"}
                </div>
                <div className="text-sm text-[#1E1D40]/70">Avaliação Média</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#4AB0D9]">
                  {nutritionists.reduce((acc, n) => acc + (n.total_reviews || 0), 0)}+
                </div>
                <div className="text-sm text-[#1E1D40]/70">Avaliações</div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                {/* Busca */}
                <div className="relative xl:col-span-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome ou especialidade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>

                {/* Especialidade */}
                <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Especialidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Estado */}
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Preço */}
                <Select
                  value={selectedPriceRange.label}
                  onValueChange={(value) => {
                    const range = priceRanges.find((r) => r.label === value)
                    if (range) setSelectedPriceRange(range)
                  }}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Faixa de Preço" />
                  </SelectTrigger>
                  <SelectContent>
                    {priceRanges.map((range) => (
                      <SelectItem key={range.label} value={range.label}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Ordenação */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Melhor Avaliação</SelectItem>
                    <SelectItem value="price-low">Menor Preço</SelectItem>
                    <SelectItem value="price-high">Maior Preço</SelectItem>
                    <SelectItem value="name">Nome A-Z</SelectItem>
                    <SelectItem value="experience">Mais Experiência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtros adicionais */}
              <div className="flex flex-wrap items-center justify-between mt-6 pt-6 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox id="online-only" checked={onlineOnly} onCheckedChange={setOnlineOnly} />
                  <label htmlFor="online-only" className="text-sm font-medium">
                    Apenas consultas online
                  </label>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm text-[#1E1D40]/70">
                    {filteredNutritionists.length} profissionais encontrados
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="p-2"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="p-2"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Nutricionistas */}
          {filteredNutritionists.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-[#1E1D40] mb-2">Nenhum nutricionista encontrado</h3>
                <p className="text-[#1E1D40]/70">Tente ajustar os filtros para encontrar mais profissionais</p>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {filteredNutritionists.map((nutritionist) => {
                const formatted = formatNutritionistData(nutritionist)

                return (
                  <Card
                    key={nutritionist.id}
                    className={`group hover:shadow-xl transition-all duration-300 border-0 shadow-lg ${
                      viewMode === "list" ? "flex" : ""
                    }`}
                  >
                    <div className={viewMode === "list" ? "flex w-full" : ""}>
                      {/* Imagem */}
                      <div className={`relative ${viewMode === "list" ? "w-48 flex-shrink-0" : ""}`}>
                        <img
                          src={formatted.image || "/placeholder.svg"}
                          alt={formatted.name}
                          className={`w-full object-contain mx-auto ${
                            viewMode === "list" ? "h-full" : "h-48"
                          } rounded-t-lg ${viewMode === "list" ? "rounded-l-lg rounded-tr-none" : ""}`}
                        />
                        {formatted.onlineConsultation && (
                          <Badge className="absolute top-3 right-3 bg-green-500 text-white">
                            <Video className="h-3 w-3 mr-1" />
                            Online
                          </Badge>
                        )}
                      </div>

                      {/* Conteúdo */}
                      <div className={`p-6 ${viewMode === "list" ? "flex-1" : ""}`}>
                        <div className={viewMode === "list" ? "flex justify-between h-full" : ""}>
                          <div className={viewMode === "list" ? "flex-1" : ""}>
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="text-xl font-bold text-[#1E1D40] group-hover:text-[#4AB0D9] transition-colors">
                                  {formatted.name}
                                </h3>
                                <p className="text-[#4AB0D9] font-medium">{formatted.specialty}</p>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1 mb-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="font-semibold">{formatted.rating.toFixed(1)}</span>
                                </div>
                                <p className="text-xs text-[#1E1D40]/70">{formatted.reviews} avaliações</p>
                              </div>
                            </div>

                            <div className="space-y-2 mb-4">
                              <div className="flex items-center gap-2 text-sm text-[#1E1D40]/70">
                                <MapPin className="h-4 w-4" />
                                {formatted.location}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-[#1E1D40]/70">
                                <Briefcase className="h-4 w-4" />
                                {formatted.experience} anos de experiência
                              </div>
                              <div className="flex items-center gap-2 text-sm text-[#1E1D40]/70">
                                <Users className="h-4 w-4" />
                                CRN: {formatted.crn}
                              </div>
                            </div>

                            <p className="text-sm text-[#1E1D40]/80 mb-4 line-clamp-2">{formatted.bio}</p>

                            {/* Badges */}
                            {nutritionist.badges && nutritionist.badges.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-4">
                                {nutritionist.badges.slice(0, 2).map((badgeData, index) => {
                                  const badge = badgeData.badge
                                  if (!badge) return null
                                  return (
                                    <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-full border border-yellow-200">
                                      {badge.icon_url ? (
                                        <img src={badge.icon_url} alt={badge.name} className="w-3 h-3 object-contain" />
                                      ) : (
                                        <Award className="h-3 w-3 text-yellow-600" />
                                      )}
                                      <span className="text-xs font-medium text-yellow-700">{badge.name}</span>
                                    </div>
                                  )
                                })}
                                {nutritionist.badges.length > 2 && (
                                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
                                    <span className="text-xs font-medium text-gray-600">+{nutritionist.badges.length - 2}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className={`${viewMode === "list" ? "ml-6 flex flex-col justify-between" : ""}`}>
                            <div className={`${viewMode === "list" ? "text-right mb-4" : "mb-4"}`}>
                              <div className="text-2xl font-bold text-[#4AB0D9]">
                                {formatted.price > 0 ? `R$ ${formatted.price}` : "Consultar"}
                              </div>
                              <p className="text-xs text-[#1E1D40]/70">por consulta</p>
                            </div>

                            <div className={`flex gap-2 ${viewMode === "list" ? "flex-col" : ""}`}>
                              <Link href={`/nutricionistas/${nutritionist.id}`}>
                                <Button
                                  variant="outline"
                                  className="flex-1 border-[#4AB0D9] text-[#4AB0D9] hover:bg-[#4AB0D9] hover:text-white bg-transparent"
                                >
                                  Ver Perfil
                                </Button>
                              </Link>

                              <Link href={`/dashboard/paciente/agendar/${nutritionist.id}`}>
                                <Button className="flex-1 bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white">
                                  Agendar
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </>
  )
}
