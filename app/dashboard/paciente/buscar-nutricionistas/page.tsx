'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Search,
  MapPin,
  Star,
  Video,
  Users,
  Grid3X3,
  List,
  Briefcase,
  Menu,
  X,
  Loader2,
  Award,
  ArrowLeft,
  Calendar,
} from 'lucide-react'
import {
  formatNutritionistData,
} from '@/lib/nutritionist-service'
import type { NutritionistProfile, Specialty } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'



const states = [
  'Todas',
  'SP',
  'RJ',
  'MG',
  'RS',
  'PR',
  'SC',
  'BA',
  'GO',
  'PE',
  'CE',
  'PA',
  'DF',
  'ES',
  'PB',
  'RN',
  'MT',
  'MS',
  'AL',
  'PI',
  'SE',
  'RO',
  'AC',
  'AM',
  'RR',
  'AP',
  'TO',
  'MA',
]

const priceRanges = [
  { label: 'Todos', min: 0, max: 1000 },
  { label: 'Até R$ 100', min: 0, max: 100 },
  { label: 'R$ 100 - R$ 150', min: 100, max: 150 },
  { label: 'R$ 150 - R$ 200', min: 150, max: 200 },
  { label: 'Acima de R$ 200', min: 200, max: 1000 },
]

export default function BuscarNutricionistasPage() {
  const [nutritionists, setNutritionists] = useState<NutritionistProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('Todas')
  const [selectedState, setSelectedState] = useState('Todas')
  const [selectedPriceRange, setSelectedPriceRange] = useState(priceRanges[0])
  const [onlineOnly, setOnlineOnly] = useState(true) // Padrão para teleconsultas
  const [sortBy, setSortBy] = useState('rating')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [ specialties, setSpecialties ] = useState<Specialty[]>([])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    loadNutritionists()
  }, [user, authLoading, searchTerm, selectedSpecialty, selectedState, selectedPriceRange, onlineOnly, sortBy])

  const loadNutritionists = async () => {
    try {
      setLoading(true)
      
      // Construir parâmetros de busca
      const params = new URLSearchParams({
        search: searchTerm,
        specialty: selectedSpecialty,
        state: selectedState,
        minPrice: selectedPriceRange.min.toString(),
        maxPrice: selectedPriceRange.max.toString(),
        onlineOnly: onlineOnly.toString(),
        sortBy: sortBy,
        limit: '50'
      })
      
      const response = await fetch(`/api/nutritionists?${params}`)
      if (!response.ok) {
        throw new Error('Erro ao buscar nutricionistas')
      }
      
      const data = await response.json()
      setNutritionists(data.nutritionists || [])
    } catch (error) {
      console.error('Erro ao carregar nutricionistas:', error)
      setNutritionists([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadSpecialties = async () => {
      try {
        setLoading(true)

        const response = await fetch('/api/specialties')
        if (!response.ok) {
          throw new Error('Erro ao carregar especialidades')
        }

        const data = await response.json()
        setSpecialties(data.specialties || [])
      } catch (err) {
        // Silent error handling - error loading specialties
      } finally {
        setLoading(false)
      }
    }

    loadSpecialties()
  }, [])

  // Os nutricionistas já vêm filtrados e ordenados da API
  const displayNutritionists = nutritionists

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#4AB0D9]" />
          <p className="text-gray-600">Carregando nutricionistas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Buscar Nutricionistas
                </h1>
                <p className="text-gray-600">
                  Encontre o profissional ideal para sua teleconsulta
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar de Filtros */}
          <div className="lg:w-80">
            <Card className="sticky top-24">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Filtros</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  >
                    {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className={`space-y-6 ${mobileMenuOpen ? 'block' : 'hidden lg:block'}`}>
                {/* Busca */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Nome, especialidade ou cidade..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Especialidade */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Especialidade
                  </label>
                  <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map(specialty => (
                        <SelectItem key={specialty.id} value={specialty.id}>
                          {specialty.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Estado */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Estado
                  </label>
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map(state => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Faixa de Preço */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Faixa de Preço
                  </label>
                  <Select
                    value={selectedPriceRange.label}
                    onValueChange={value => {
                      const range = priceRanges.find(r => r.label === value)
                      if (range) setSelectedPriceRange(range)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priceRanges.map(range => (
                        <SelectItem key={range.label} value={range.label}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtros Adicionais */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">
                    Opções
                  </label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="online"
                      checked={onlineOnly}
                      onCheckedChange={setOnlineOnly}
                    />
                    <label htmlFor="online" className="text-sm text-gray-600">
                      Apenas teleconsultas
                    </label>
                  </div>
                </div>

                {/* Ordenação */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Ordenar por
                  </label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">Melhor avaliação</SelectItem>
                      <SelectItem value="price_low">Menor preço</SelectItem>
                      <SelectItem value="price_high">Maior preço</SelectItem>
                      <SelectItem value="experience">Mais experiência</SelectItem>
                      <SelectItem value="name">Nome A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Nutricionistas */}
          <div className="flex-1">
            {/* Header da Lista */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                  {displayNutritionists.length} nutricionista(s) encontrado(s)
                </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="p-2"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="p-2"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Nutricionistas */}
            {displayNutritionists.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Nenhum nutricionista encontrado
                  </h3>
                  <p className="text-gray-600">
                    Tente ajustar os filtros para encontrar mais profissionais
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid md:grid-cols-2 gap-6'
                    : 'space-y-4'
                }
              >
                {displayNutritionists.map(nutritionist => {
                  const formatted = formatNutritionistData(nutritionist)

                  return (
                    <Card
                      key={nutritionist.id}
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="relative">
                            <Image
                              src={
                                nutritionist.profile_image_url ||
                                '/placeholder.svg?height=80&width=80'
                              }
                              alt={nutritionist.full_name || 'Nutricionista'}
                              width={80}
                              height={80}
                              className="rounded-full object-cover"
                            />
                            {nutritionist.offers_online_consultation && (
                              <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1">
                                <Video className="h-3 w-3" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900 truncate">
                                  {nutritionist.full_name}
                                </h3>
                                <div className="flex items-center gap-1 mb-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm font-medium">
                                    {(nutritionist.rating || 0).toFixed(1)}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    ({nutritionist.total_reviews || 0} avaliações)
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-[#4AB0D9]">
                                  R$ {nutritionist.consultation_price?.toFixed(2) || '0,00'}
                                </div>
                                <div className="text-sm text-gray-500">por consulta</div>
                              </div>
                            </div>

                            {nutritionist.city && nutritionist.state && (
                              <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                                <MapPin className="h-4 w-4" />
                                {nutritionist.city}, {nutritionist.state}
                              </div>
                            )}

                            <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                              <Briefcase className="h-4 w-4" />
                              {nutritionist.experience_years || 0} anos de experiência
                            </div>

                            {nutritionist.specialties && nutritionist.specialties.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-4">
                                {nutritionist.specialties.slice(0, 3).map((specialty, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {specialty}
                                  </Badge>
                                ))}
                                {nutritionist.specialties.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{nutritionist.specialties.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Link
                                href={`/dashboard/paciente/agendar-teleconsulta/${nutritionist.id}`}
                                className="flex-1"
                              >
                                <Button className="w-full bg-[#4AB0D9] hover:bg-[#4AB0D9]/90">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Agendar Teleconsulta
                                </Button>
                              </Link>
                              <Link href={`/nutricionistas/${nutritionist.id}`}>
                                <Button variant="outline">
                                  Ver Perfil
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}