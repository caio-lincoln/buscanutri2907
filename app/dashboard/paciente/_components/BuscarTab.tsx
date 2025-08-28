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

const statesOptions = [
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

export default function BuscarTab() {
  const [ searchNutritionistTerm, setSearchNutritionistTerm ] = useState('')
  const [ selectedNutritionistSpecialty, setSelectedNutritionistSpecialty ] =
    useState('Todas')
  const [ selectedNutritionistState, setSelectedNutritionistState ] =
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
    priceRange: selectedNutritionistPriceRange && selectedNutritionistPriceRange.label === 'Todos'
      ? undefined
      : { min: selectedNutritionistPriceRange?.min as number, max: selectedNutritionistPriceRange?.max as number },
    onlineOnly: onlineOnlyNutritionist || undefined,
    verifiedOnly: showVerifiedOnlyNutritionist || undefined,
    sortBy: sortByNutritionist,
  })

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
        console.log("🚀 ~ loadSpecialties ~ err:", err)
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
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">
            Encontrar Nutricionista
          </h1>
          <p className="text-gray-600">
            Descubra profissionais qualificados próximos a você
          </p>
        </div>
        <Button
          variant="outline"
          className="hover-lift bg-white/80 backdrop-blur-sm border-gray-200"
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
          <Filter className="h-4 w-4 mr-2" />
          Limpar Filtros
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-lg backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome ou especialidade..."
                value={searchNutritionistTerm}
                onChange={e => setSearchNutritionistTerm(e.target.value)}
                className="pl-10 h-12 border-0 bg-gray-50/50 focus:bg-white transition-colors"
              />
            </div>

            <Select
              value={selectedNutritionistSpecialty}
              onValueChange={setSelectedNutritionistSpecialty}
            >
              <SelectTrigger className="h-12 border-0 bg-gray-50/50 focus:bg-white">
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
              onValueChange={setSelectedNutritionistState}
            >
              <SelectTrigger className="h-12 border-0 bg-gray-50/50 focus:bg-white">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                {statesOptions.map(state => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedNutritionistPriceRange?.label as string}
              onValueChange={value => {
                const range = priceRanges.find(r => r.label === value)
                if (range) setSelectedNutritionistPriceRange(range)
              }}
            >
              <SelectTrigger className="h-12 border-0 bg-gray-50/50 focus:bg-white">
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
          <div className="flex flex-wrap items-center justify-between mt-6 pt-6 border-t">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="online-only-nutritionist"
                  checked={onlineOnlyNutritionist}
                  onCheckedChange={setOnlineOnlyNutritionist}
                />
                <label
                  htmlFor="online-only-nutritionist"
                  className="text-sm font-medium"
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
                  className="text-sm font-medium"
                >
                  Apenas profissionais verificados
                </label>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-[#1E1D40]/70">
                {nutritionists.length} profissional
                {nutritionists.length !== 1 ? 's' : ''} encontrado
                {nutritionists.length !== 1 ? 's' : ''}
              </span>

              <div className="flex items-center gap-2">
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
                viewModeNutritionist === 'grid'
                  ? 'grid grid-cols-1 lg:grid-cols-2 gap-6'
                  : 'space-y-4'
              }
            >
              {nutritionists.map(nutritionist => {
                const formatted = formatNutritionistData(nutritionist)

                return (
                  <Card
                    key={nutritionist.id}
                    className={`group hover-lift transition-all duration-300 border-0 shadow-lg hover:shadow-xl backdrop-blur-sm ${viewModeNutritionist === 'list' ? 'flex' : ''
                      }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16 ring-2 ring-gray-200 shadow-lg group-hover:scale-105 transition-transform duration-300">
                          <AvatarImage
                            src={
                              nutritionist?.profile_image_url ||
                              `/placeholder.svg?height=48&width=48&query=${nutritionist?.full_name || 'nutritionist profile'}`
                            }
                            className="rounded-full object-cover"
                          />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xl font-bold">
                            {nutritionist.full_name?.charAt(0) || 'N'}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between ">
                            <div>
                              <h3 className="font-bold text-[#1E1D40] text-lg">
                                {nutritionist.full_name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                CRN: {nutritionist.crn}
                              </p>
                            </div>
                            {nutritionist.is_verified && (
                              <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-sm">
                                <Shield className="h-3 w-3 mr-1" />
                                Verificado
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-semibold">
                                {nutritionist.rating?.toFixed(1) || '5.0'}
                              </span>
                              <span className="text-sm text-gray-600">
                                ({nutritionist.total_reviews || 0}{' '}
                                avaliações)
                              </span>
                            </div>

                            {nutritionist.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                  {nutritionist.location}
                                </span>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2">
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
                                    className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                  >
                                    {specialty}
                                  </Badge>
                                ))}
                            </div>

                            {nutritionist.bio && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {nutritionist.bio}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-4">
                              {getMinPrice(
                                nutritionist.nutritionist_services
                              ) !== null && (
                                  <div className="flex items-center gap-1 text-sm">
                                    <span className="text-gray-600">
                                      A partir de
                                    </span>
                                    <span className="font-bold text-[#1E1D40] text-lg">
                                      R${' '}
                                      {getMinPrice(
                                        nutritionist.nutritionist_services
                                      )}
                                    </span>
                                  </div>
                                )}
                              {hasOnlineConsultation(
                                nutritionist.nutritionist_services
                              ) && (
                                  <div className="flex items-center gap-1 text-sm text-green-600">
                                    <Video className="h-4 w-4" />
                                    <span>Online</span>
                                  </div>
                                )}
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Link
                              href={`/nutricionistas/${nutritionist.id}`}
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 hover-lift bg-white/80 backdrop-blur-sm hover:bg-gray-50"
                              >
                                <User className="h-4 w-4 mr-2" />
                                Ver Perfil
                              </Button>
                            </Link>

                            <Button
                              size="sm"
                              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-300"
                              onClick={() =>
                                handleScheduleConsultation(
                                  nutritionist.id
                                )
                              }
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              Agendar
                            </Button>
                            {/* <Button
                                    size="sm"
                                    variant="outline"
                                    className={`hover-lift bg-white/80 backdrop-blur-sm transition-all duration-300 ${favoritedNutritionists.has(
                                      nutritionist.id
                                    )
                                      ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                      : 'hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                                      }`}
                                    onClick={() =>
                                      handleToggleFavorite(nutritionist.id)
                                    }
                                  >
                                    <Heart
                                      className={`h-4 w-4 ${favoritedNutritionists.has(
                                        nutritionist.id
                                      )
                                        ? 'fill-current'
                                        : ''
                                        }`}
                                    />
                                  </Button> */}
                            <Button
                              size="sm"
                              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
                              onClick={() => handleStartChat(nutritionist.id)}
                              disabled={startingChatFor === nutritionist.id}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              {startingChatFor === nutritionist.id ? 'Abrindo...' : 'Iniciar chat'}
                            </Button>
                          </div>
                        </div>
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