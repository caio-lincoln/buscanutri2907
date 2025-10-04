'use client'
import { useEffect, useState } from 'react'

import {
  Search,
  MapPin,
  Star,
  Calendar,
  Filter,
  User,
  Video,
  Shield,
  Grid3X3,
  List,
  MessageSquare,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

import { useRealtimeNutritionists } from '../../../../hooks/use-realtime-nutritionists'
import { useDebouncedValue } from '../../../../hooks/use-debounce'
import { NutritionistService, Specialty } from '../../../../lib/supabase'
import { getCurrentUser, NutritionistProfile } from '../../../../lib/auth-utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { openConversationWithNutritionist } from '../../../../lib/chat-forum-service'
import { toast } from 'sonner'
import { addFavoriteNutritionist, FavoriteNutritionist, getPatientFavoriteNutritionists, removeFavoriteNutritionist } from '../../../../lib/consultation-service'
import { useAuth } from '../../../../contexts/auth-context'
import { BRState, BRCity, getStates, getCitiesByUF } from '../../../../lib/geo'

const getSpecialtiesText = (nutritionist: NutritionistProfile) => {
  return (
    nutritionist.nutritionist_specialties
      ?.map(spec => spec.specialties?.name)
      .filter(Boolean)
      .join(', ') || 'Nutrição Geral'
  )
}

const getMinPrice = (services: NutritionistService[]) => {
  if (!services || services.length === 0) return null
  return Math.min(...services.map(service => service.price))
}

const hasOnlineConsultation = (services: NutritionistService[]) => {
  return services?.some(service => service.online_available) || false
}

const formatNutritionistData = (nutritionist: NutritionistProfile) => {
  const specialties =
    nutritionist.nutritionist_specialties
      ?.map(s => s.specialties?.name)
      .filter(Boolean) || []
  const services = nutritionist.nutritionist_services || []

  return {
    id: nutritionist.id,
    name: nutritionist.full_name,
    bio: nutritionist.bio,
    location: nutritionist.location,
    image: nutritionist?.profile_image_url || '/placeholder.svg',
    crn: nutritionist.crn,
    rating: nutritionist.rating || 0,
    reviews: nutritionist.total_reviews || 0,
    specialty: specialties.join(', ') || 'Nutrição Geral',
    specializations: specialties,
    experience: nutritionist.experience_years || 0,
    price: services.length > 0 ? Math.min(...services.map(s => s.price)) : 0,
    services: services,
    onlineConsultation: services.some(s => s.online_available),
    is_verified: nutritionist.is_verified,
  }
}

const priceRanges = [
  { label: 'Todos', min: 0, max: 1000 },
  { label: 'Até R$ 100', min: 0, max: 100 },
  { label: 'R$ 100 - R$ 150', min: 100, max: 150 },
  { label: 'R$ 150 - R$ 200', min: 150, max: 200 },
  { label: 'Acima de R$ 200', min: 200, max: 1000 },
]

export default function BuscarTab() {
  const [ searchNutritionistTerm, setSearchNutritionistTerm ] = useState('')
  const [ selectedNutritionistSpecialty, setSelectedNutritionistSpecialty ] =
    useState('Todas')
  const [ selectedNutritionistState, setSelectedNutritionistState ] =
    useState('Todas')
  const [ selectedNutritionistCity, setSelectedNutritionistCity ] =
    useState('Todas')
  const [ selectedNutritionistRegion, setSelectedNutritionistRegion ] =
    useState('Todas')
  const [ selectedNutritionistPriceRange, setSelectedNutritionistPriceRange ] =
    useState(priceRanges[ 0 ])
  const [ onlineOnlyNutritionist, setOnlineOnlyNutritionist ] = useState(false)
  const [ showVerifiedOnlyNutritionist, setShowVerifiedOnlyNutritionist ] =
    useState(false)
  const [ sortByNutritionist, setSortByNutritionist ] = useState('rating')

  const debouncedSearch = useDebouncedValue(searchNutritionistTerm, 600);
  const [ specialties, setSpecialties ] = useState<Specialty[]>([])
  const [ viewModeNutritionist, setViewModeNutritionist ] = useState<
    'grid' | 'list'
  >('grid')
  const [ isMobile, setIsMobile ] = useState(false)
  const [ isVeryLargeScreen, setIsVeryLargeScreen ] = useState(false)

  // Check screen size and set mobile/very large screen states
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      setIsMobile(width < 1024) // lg breakpoint
      setIsVeryLargeScreen(width >= 1536) // 2xl breakpoint
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])
  const { patientProfile } = useAuth()

  const [ , setLoading ] = useState(true)
  const [ startingChatFor, setStartingChatFor ] = useState<string | null>(null)
  const [ favoriteNutritionists, setFavoriteNutritionists ] = useState<
    FavoriteNutritionist[]
  >([])

  const [ favoritedNutritionists, setFavoritedNutritionists ] = useState<
    Set<string>
  >(new Set())

  const router = useRouter()

  const handleScheduleConsultation = (nutritionistId: string) => {
    router.push(`/dashboard/paciente/agendar?nutritionistId=${nutritionistId}`)
  }

  const {
    nutritionists,
    loading: loadingNutritionists,
    error: nutritionistsError,
    refreshNutritionists,
  } = useRealtimeNutritionists({
    searchTerm: debouncedSearch,
    specialty: selectedNutritionistSpecialty === 'Todas' ? undefined : selectedNutritionistSpecialty,
    state: selectedNutritionistState === 'Todas' ? undefined : selectedNutritionistState,
    city: selectedNutritionistCity === 'Todas' ? undefined : selectedNutritionistCity,
    region: selectedNutritionistRegion === 'Todas' ? undefined : selectedNutritionistRegion,
    priceRange: selectedNutritionistPriceRange && selectedNutritionistPriceRange.label === 'Todos'
      ? undefined
      : { min: selectedNutritionistPriceRange?.min as number, max: selectedNutritionistPriceRange?.max as number },
    onlineOnly: onlineOnlyNutritionist || undefined,
    verifiedOnly: showVerifiedOnlyNutritionist || undefined,
    sortBy: sortByNutritionist,
  })

  const [ statesOptions, setStatesOptions ] = useState<BRState[]>([])
  const [ citiesOptions, setCitiesOptions ] = useState<BRCity[]>([])

  useEffect(() => {
    (async () => {
      const geoStates = await getStates()
      setStatesOptions([ { ibge_id: Number.POSITIVE_INFINITY, name: 'Todas', uf: 'Todas', region: '' }, ...geoStates ])
    })()
  }, [])

  useEffect(() => {
    (async () => {
      if (!selectedNutritionistState || selectedNutritionistState === 'Todas') {
        setCitiesOptions([])
        setSelectedNutritionistCity('Todas')
        return
      }
      try {
        const cities = await getCitiesByUF(selectedNutritionistState)
        setCitiesOptions([ { ibge_id: Number.POSITIVE_INFINITY, name: 'Todas' }, ...cities ])
      } catch (e) {
        setCitiesOptions([ { ibge_id: Number.POSITIVE_INFINITY, name: 'Todas' } ])
      }
    })()
  }, [ selectedNutritionistState ])

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

  async function handleStartChat(nutritionistId: string) {
    try {
      setStartingChatFor(nutritionistId)
      const conversationId = await openConversationWithNutritionist(nutritionistId)
      router.push(`/dashboard/paciente/chat/${conversationId}`)
    } catch (e: any) {
      toast.error(e?.message ?? 'Não foi possível iniciar o chat')
    } finally {
      setStartingChatFor(null)
    }
  }

  // const handleToggleFavorite = async (nutritionistId: string) => {
  //   try {
  //     const user = await getCurrentUser()
  //     if (!user) return

  //     const isFavorited = favoritedNutritionists.has(nutritionistId)

  //     if (isFavorited) {
  //       const success = await removeFavoriteNutritionist(
  //         patientProfile?.id as string,
  //         nutritionistId
  //       )
  //       if (success) {
  //         setFavoritedNutritionists(prev => {
  //           const newSet = new Set(prev)
  //           newSet.delete(nutritionistId)
  //           return newSet
  //         })
  //         // Recarregar favoritos para atualizar a lista
  //         const updatedFavorites = await getPatientFavoriteNutritionists(
  //           patientProfile?.id as string
  //         )
  //         setFavoriteNutritionists(updatedFavorites)
  //       }
  //     } else {
  //       const success = await addFavoriteNutritionist(patientProfile?.id as string, nutritionistId)
  //       if (success) {
  //         setFavoritedNutritionists(prev => new Set([ ...prev, nutritionistId ]))
  //         // Recarregar favoritos para atualizar a lista
  //         const updatedFavorites = await getPatientFavoriteNutritionists(
  //           patientProfile?.id as string
  //         )
  //         setFavoriteNutritionists(updatedFavorites)
  //       }
  //     }
  //   } catch (error) {
  //     console.log("🚀 ~ handleToggleFavorite ~ error:", error)
  //     // Silent error handling for favorite toggle
  //   }
  // }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">
            Encontrar Nutricionista
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Descubra profissionais qualificados próximos a você
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="hover-lift bg-white/80 backdrop-blur-sm border-gray-200 w-full lg:w-auto"
          onClick={() => {
            setSearchNutritionistTerm('')
            setSelectedNutritionistSpecialty('Todas')
            setSelectedNutritionistState('Todas')
            setSelectedNutritionistCity('Todas')
            setSelectedNutritionistRegion('Todas')
            setSelectedNutritionistPriceRange(priceRanges[ 0 ])
            setOnlineOnlyNutritionist(false)
            setShowVerifiedOnlyNutritionist(false)
            setSortByNutritionist('rating')
          }}
        >
          <Filter className="h-4 w-4 mr-2" />
          Limpar Filtros
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-lg backdrop-blur-sm">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome..."
                value={searchNutritionistTerm}
                onChange={e => setSearchNutritionistTerm(e.target.value)}
                className="pl-10 h-11 md:h-12 border-0 bg-gray-50/50 focus:bg-white transition-colors text-sm md:text-base"
              />
            </div>

            <Select
              value={selectedNutritionistSpecialty}
              onValueChange={setSelectedNutritionistSpecialty}
            >
              <SelectTrigger className="h-11 md:h-12 border-0 bg-gray-50/50 focus:bg-white text-sm md:text-base">
                <SelectValue placeholder="Especialidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={"Todas"}>
                  Todas
                </SelectItem>
                {specialties?.map(specialty => (
                  <SelectItem key={specialty.id} value={specialty.id}>
                    {specialty.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedNutritionistState}
              onValueChange={(val) => {
                setSelectedNutritionistRegion('Todas')
                setSelectedNutritionistState(val)
              }}
            >
              <SelectTrigger className="h-11 md:h-12 border-0 bg-gray-50/50 focus:bg-white text-sm md:text-base">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                {statesOptions.map(state => (
                  <SelectItem key={state.ibge_id} value={state.uf}>
                    {state.uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedNutritionistCity}
              onValueChange={setSelectedNutritionistCity}
            >
              <SelectTrigger className="h-11 md:h-12 border-0 bg-gray-50/50 focus:bg-white text-sm md:text-base">
                <SelectValue placeholder="Cidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={"Todas"}>Todas</SelectItem>
                {citiesOptions.map(city => (
                  <SelectItem key={city.ibge_id} value={city.name}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedNutritionistRegion}
              onValueChange={setSelectedNutritionistRegion}
            >
              <SelectTrigger className="h-11 md:h-12 border-0 bg-gray-50/50 focus:bg-white text-sm md:text-base">
                <SelectValue placeholder="Região" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={"Todas"}>Todas</SelectItem>
                <SelectItem value={"Norte"}>Norte</SelectItem>
                <SelectItem value={"Nordeste"}>Nordeste</SelectItem>
                <SelectItem value={"Centro-Oeste"}>Centro-Oeste</SelectItem>
                <SelectItem value={"Sudeste"}>Sudeste</SelectItem>
                <SelectItem value={"Sul"}>Sul</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedNutritionistPriceRange?.label as string}
              onValueChange={value => {
                const range = priceRanges.find(r => r.label === value)
                if (range) setSelectedNutritionistPriceRange(range)
              }}
            >
              <SelectTrigger className="h-11 md:h-12 border-0 bg-gray-50/50 focus:bg-white text-sm md:text-base">
                <SelectValue placeholder="Faixa de Preço" />
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

          {/* Filtros adicionais */}
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mt-4 md:mt-6 pt-4 md:pt-6 border-t">
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="online-only-nutritionist"
                  checked={onlineOnlyNutritionist}
                  onCheckedChange={setOnlineOnlyNutritionist}
                />
                <label
                  htmlFor="online-only-nutritionist"
                  className="text-xs md:text-sm font-medium"
                >
                  Apenas consultas online
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="verified-only-nutritionist"
                  checked={showVerifiedOnlyNutritionist}
                  onCheckedChange={setShowVerifiedOnlyNutritionist}
                />
                <label
                  htmlFor="verified-only-nutritionist"
                  className="text-xs md:text-sm font-medium"
                >
                  Apenas profissionais verificados
                </label>
              </div>
            </div>

            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-4">
              <span className="text-xs md:text-sm text-[#1E1D40]/70 text-center sm:text-left">
                {nutritionists.length} profissional
                {nutritionists.length !== 1 ? 's' : ''} encontrado
                {nutritionists.length !== 1 ? 's' : ''}
              </span>

              {/* View mode toggle - hidden on mobile/tablet and very large screens, auto-switches to list */}
              <div className="hidden lg:flex xl:hidden items-center justify-center gap-2">
                <Button
                  variant={
                    viewModeNutritionist === 'grid'
                      ? 'default'
                      : 'outline'
                  }
                  size="sm"
                  onClick={() => setViewModeNutritionist('grid')}
                  className="p-2"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={
                    viewModeNutritionist === 'list'
                      ? 'default'
                      : 'outline'
                  }
                  size="sm"
                  onClick={() => setViewModeNutritionist('list')}
                  className="p-2"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loadingNutritionists && nutritionists.length === 0 && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-200 border-t-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Buscando nutricionistas...</p>
        </div>
      )}

      {/* Error State */}
      {nutritionistsError && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">!</div>
          <h3 className="text-xl font-semibold text-red-600 mb-2">
            Erro ao carregar nutricionistas
          </h3>
          <p className="text-gray-600 mb-6">
            Ocorreu um problema ao buscar os nutricionistas. Tente
            novamente.
          </p>
          <Button
            onClick={() => refreshNutritionists()}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Results */}
      {!loadingNutritionists && !nutritionistsError && (
        <>
          {nutritionists.length > 0 ? (
            <div
              className={
                // Force list view on mobile/tablet and very large screens, allow grid on medium-large screens
                isMobile || isVeryLargeScreen || viewModeNutritionist === 'list'
                  ? 'space-y-4'
                  : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6'
              }
            >
              {nutritionists.map(nutritionist => {
                const formatted = formatNutritionistData(nutritionist)
                // Determine effective view mode based on screen size
                const effectiveViewMode = (isMobile || isVeryLargeScreen) ? 'list' : viewModeNutritionist

                return (
                  <Card
                    key={nutritionist.id}
                    className={`group hover-lift transition-all duration-300 border-0 shadow-lg hover:shadow-xl backdrop-blur-sm ${
                      effectiveViewMode === 'list' 
                        ? 'flex' 
                        : 'h-full flex flex-col'
                    }`}
                  >
                    <CardContent className={`p-4 md:p-6 ${effectiveViewMode === 'grid' ? 'flex flex-col h-full' : ''}`}>
                      <div className={`flex items-start gap-3 md:gap-4 ${
                        effectiveViewMode === 'list' 
                          ? 'flex-row' 
                          : 'flex-col sm:flex-row'
                      } ${effectiveViewMode === 'grid' ? 'flex-1' : ''}`}>
                        
                        {/* Avatar Section */}
                        <div className="flex-shrink-0">
                          <Avatar className="h-14 w-14 md:h-16 md:w-16 lg:h-18 lg:w-18 ring-2 ring-gray-200 shadow-lg group-hover:scale-105 transition-transform duration-300">
                            <AvatarImage
                              src={
                                nutritionist?.profile_image_url ||
                                `/placeholder.svg?height=64&width=64&query=${nutritionist?.full_name || 'nutritionist profile'}`
                              }
                              className="rounded-full object-cover"
                            />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-lg md:text-xl font-bold">
                              {nutritionist.full_name?.charAt(0) || 'N'}
                            </AvatarFallback>
                          </Avatar>
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 space-y-3 min-w-0">
                          {/* Header with name and verification */}
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-[#1E1D40] text-base md:text-lg lg:text-xl truncate">
                                {nutritionist.full_name}
                              </h3>
                              <p className="text-xs md:text-sm text-gray-600 font-medium">
                                CRN: {nutritionist.crn}
                              </p>
                            </div>
                            {nutritionist.is_verified && (
                              <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-sm text-xs flex-shrink-0">
                                <Shield className="h-3 w-3 mr-1" />
                                Verificado
                              </Badge>
                            )}
                          </div>

                          {/* Rating and Location */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-yellow-500 fill-current flex-shrink-0" />
                              <span className="text-sm font-semibold">
                                {nutritionist.rating?.toFixed(1) || '5.0'}
                              </span>
                              <span className="text-sm text-gray-600 truncate">
                                ({nutritionist.total_reviews || 0} avaliações)
                              </span>
                            </div>

                            {nutritionist.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                <span className="text-sm text-gray-600 truncate">
                                  {nutritionist.location}
                                </span>
                              </div>
                            )}

                            {/* Specialties */}
                            <div className="flex flex-wrap gap-1 md:gap-2">
                              {(typeof (
                                getSpecialtiesText(nutritionist) ||
                                'Nutrição Geral'
                              ) === 'string'
                                ? (
                                  getSpecialtiesText(nutritionist) ||
                                  'Nutrição Geral'
                                ).split(', ')
                                : [ 'Nutrição Geral' ]
                              )
                                .slice(0, 2)
                                .map((specialty, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs bg-blue-50 text-blue-700 border-blue-200 px-2 py-1"
                                  >
                                    {specialty}
                                  </Badge>
                                ))}
                            </div>

                            {/* Bio */}
                            {nutritionist.bio && (
                              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                {nutritionist.bio}
                              </p>
                            )}
                          </div>

                          {/* Price and Online indicator */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-gray-100">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                              {getMinPrice(
                                nutritionist.nutritionist_services
                              ) !== null && (
                                <div className="flex items-center gap-1">
                                  <span className="text-sm text-gray-600">
                                    A partir de
                                  </span>
                                  <span className="font-bold text-[#1E1D40] text-lg">
                                    R$ {getMinPrice(nutritionist.nutritionist_services)}
                                  </span>
                                </div>
                              )}
                              {hasOnlineConsultation(
                                nutritionist.nutritionist_services
                              ) && (
                                <div className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                  <Video className="h-4 w-4 flex-shrink-0" />
                                  <span className="font-medium">Online</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons - Always at bottom for grid view */}
                      <div className={`flex gap-2 pt-4 mt-auto ${
                        effectiveViewMode === 'grid' ? 'border-t border-gray-100' : ''
                      }`}>
                        <Link
                          href={`/nutricionistas/${nutritionist.id}`}
                          className="flex-1"
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full h-10 hover-lift bg-white/80 backdrop-blur-sm hover:bg-gray-50 text-sm font-medium border-gray-200 hover:border-gray-300 transition-all duration-200"
                          >
                            <User className="h-4 w-4 mr-2" />
                            Ver Perfil
                          </Button>
                        </Link>

                        <Button
                          size="sm"
                          className="flex-1 h-10 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-medium"
                          onClick={() =>
                            handleScheduleConsultation(
                              nutritionist.id
                            )
                          }
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Agendar
                        </Button>

                        <Button
                          size="sm"
                          className="flex-1 h-10 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-medium"
                          onClick={() => handleStartChat(nutritionist.id)}
                          disabled={startingChatFor === nutritionist.id}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          {startingChatFor === nutritionist.id ? 'Abrindo...' : 'Chat'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">?</div>
              <h3 className="text-xl font-semibold text-[#1E1D40] mb-2">
                Nenhum nutricionista encontrado
              </h3>
              <p className="text-gray-600 mb-6">
                Tente ajustar os filtros ou fazer uma nova busca
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchNutritionistTerm('')
                  setSelectedNutritionistSpecialty('Todas')
                  setSelectedNutritionistState('Todas')
                  setSelectedNutritionistPriceRange(priceRanges[ 0 ])
                  setOnlineOnlyNutritionist(false)
                  setShowVerifiedOnlyNutritionist(false)
                  setSortByNutritionist('rating')
                }}
              >
                Limpar filtros e buscar novamente
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}