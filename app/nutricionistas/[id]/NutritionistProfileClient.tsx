'use client'
import { notFound, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Star,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Award,
  Users,
  Video,
  MessageSquare,
  Heart,
  ArrowLeft,
  CheckCircle,
  Clock,
  User,
  GraduationCap,
  Shield,
  Globe,
  ThumbsUp,
  Target,
  BookOpen,
  Stethoscope,
  Menu,
  X,
  Eye,
  LayoutDashboard,
  LogOut,
} from 'lucide-react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import type { NutritionistProfile, UserType } from '@/lib/supabase' // Importa a interface real
import { useRealtimeProfileViews } from '@/hooks/use-realtime-profile-views'
import {
  generateImageVariants,
  selectBestCoverVariant,
  selectBestAvatarVariant,
  generateSrcSet,
  generateSizes,
} from '@/lib/image-variants'
import {
  normalizeLanguages,
  logNormalizationEvent,
} from '@/lib/structured-data-utils'
import { useAuth } from '../../../contexts/auth-context'
import { openConversationWithNutritionist } from '../../../lib/chat-forum-service'

// Garante que o valor retornado seja sempre um array
function toArray(value: unknown): string[] {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    try {
      // Tenta tratar string JSON ('["A","B"]')
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed
    } catch {
      /* não era JSON, continua */
    }
    // Fallback: separa por vírgulas
    return value
      .split(',')
      .map(v => v.trim())
      .filter(Boolean)
  }
  return []
}

// Função específica para processar idiomas com múltiplos escapes
function processLanguages(value: unknown): string[] {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const processedValue = value

    // Remove múltiplas camadas de escape e caracteres desnecessários
    // Procura por padrões como "Português" e "Inglês" na string
    const languageMatches = processedValue.match(
      /(?:Português|Inglês|Espanhol|Francês|Alemão|Italiano|Japonês|Chinês|Coreano|Árabe)/g
    )

    if (languageMatches && languageMatches.length > 0) {
      // Remove duplicatas e retorna apenas os idiomas encontrados
      return [ ...new Set(languageMatches) ]
    }

    // Se não encontrou padrões específicos, tenta o processamento normal
    try {
      // Remove escapes excessivos
      let cleaned = processedValue
      while (cleaned.includes('\\"') || cleaned.includes('\\')) {
        cleaned = cleaned.replace(/\\"/g, '"').replace(/\\/g, '\\')
      }

      // Tenta fazer parse do JSON limpo
      const parsed = JSON.parse(cleaned)
      if (Array.isArray(parsed)) return parsed
    } catch {
      // Se falhar, tenta separar por vírgulas
      return processedValue
        .split(',')
        .map(v => v.trim())
        .filter(Boolean)
        .filter(v => v.length > 0 && v.length < 50) // Remove strings muito longas ou vazias
    }
  }
  return []
}

interface NutritionistProfileClientProps {
  nutritionist: NutritionistProfile
}

export default function NutritionistProfilePageClient({
  nutritionist,
}: NutritionistProfileClientProps) {
  const [ mobileMenuOpen, setMobileMenuOpen ] = useState(false)
  const { viewStats, recordView } = useRealtimeProfileViews(nutritionist.id, {
    totalViews: nutritionist.total_views || 0,
    uniqueViews: nutritionist.unique_views || 0,
    lastViewAt: nutritionist.last_view_at || null,
  })
  const { user, signOut } = useAuth()

  if (!nutritionist) {
    notFound()
  }

  // Registra a visualização quando o componente é montado
  useEffect(() => {
    recordView()
  }, [ recordView ])

  // Formatações para exibição, usando dados reais ou placeholders
  const formattedName = nutritionist.full_name || 'Nutricionista Desconhecido'
  const formattedSpecialty = nutritionist.specialties?.[ 0 ] || 'Nutrição'
  const formattedLocation = nutritionist.location || 'Localização não informada'
  const formattedRating = nutritionist.rating?.toFixed(1) || '0.0'
  const formattedReviews = nutritionist.total_reviews || 0
  const formattedExperience = nutritionist.experience_years || 0
  const formattedPatients = 0 // Placeholder, pois não está diretamente na interface
  const formattedPrice = nutritionist.consultation_price || 0
  // Gerar variantes de imagem otimizadas
  const avatarVariants = generateImageVariants(
    nutritionist?.profile_image_url,
    'avatar',
    nutritionist?.updated_at
  )
  const coverVariants = generateImageVariants(
    nutritionist?.cover_image_url,
    'cover',
    nutritionist?.updated_at
  )

  // Use medium variants by default to avoid hydration mismatch
  // Client-side optimization can happen after hydration
  const formattedImage = avatarVariants.medium
  const formattedCoverImage = coverVariants.md
  const formattedBio = nutritionist.bio || 'Sem biografia disponível.'
  const formattedFullBio = nutritionist.bio || 'Sem biografia disponível.'
  const formattedEducation = nutritionist.academic_background || 'Formação não informada.'
  const formattedCrn = nutritionist.crn || 'CRN não informado.'
  const formattedPhone = nutritionist.phone || 'Telefone não informado.'
  const formattedEmail = nutritionist.email || 'Email não informado.' // Assumindo que email pode vir do perfil ou ser um placeholder
  const formattedWebsite = nutritionist.website || ''
  const formattedOnlineConsultation =
    nutritionist.service_online_available || false
  const formattedAddress = nutritionist.address || formattedLocation

  // Campos individuais para horários de trabalho
  const formattedWorkingHours = {
    monday: nutritionist.monday_hours || 'Fechado',
    tuesday: nutritionist.tuesday_hours || 'Fechado',
    wednesday: nutritionist.wednesday_hours || 'Fechado',
    thursday: nutritionist.thursday_hours || 'Fechado',
    friday: nutritionist.friday_hours || 'Fechado',
    saturday: nutritionist.saturday_hours || 'Fechado',
    sunday: nutritionist.sunday_hours || 'Fechado',
  }

  // Campos individuais para redes sociais
  const formattedSocialMedia = {
    instagram: nutritionist.instagram_username || '',
    linkedin: nutritionist.linkedin_username || '',
    facebook: nutritionist.facebook_username || '',
    youtube: nutritionist.youtube_channel || '',
    tiktok: nutritionist.tiktok_username || '',
    website: nutritionist.website_url || '',
  }

  // Campos individuais para serviços (usando os novos campos)
  const formattedServices = [
    ...(nutritionist.service_consultation_price
      ? [
        {
          name: 'Consulta Nutricional',
          price: nutritionist.service_consultation_price,
          description: 'Consulta completa com avaliação nutricional',
        },
      ]
      : []),
    ...(nutritionist.service_followup_price
      ? [
        {
          name: 'Consulta de Retorno',
          price: nutritionist.service_followup_price,
          description: 'Acompanhamento e ajustes no plano alimentar',
        },
      ]
      : []),
    ...(nutritionist.service_meal_plan_price
      ? [
        {
          name: 'Plano Alimentar',
          price: nutritionist.service_meal_plan_price,
          description: 'Elaboração de plano alimentar personalizado',
        },
      ]
      : []),
  ]

  const formattedSpecializations = toArray(nutritionist.specialties)
  const formattedAvailableTimes: string[] = Array.isArray(nutritionist.available_times)
    ? nutritionist.available_times
    : [];

  type DayIntervals = { day_of_week: number; intervals: { start: string; end: string }[]; is_available: boolean };
  const week: DayIntervals[] = Array.isArray(nutritionist.weekly_availability)
    ? nutritionist.weekly_availability
    : [];

  const days = [ 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo' ];
  const scheduleRows = days.map((label, idx) => {
    const d = week.find(w => w.day_of_week === (idx + 1)) || { intervals: [] };
    const text = d.intervals.length
      ? d.intervals.map(i => `${i.start} - ${i.end}`).join('  ·  ')
      : 'Fechado';
    return { label, text, closed: d.intervals.length === 0 };
  });

  const formattedLanguages = normalizeLanguages(nutritionist.languages) || []
  const formattedCertifications = toArray(nutritionist.certifications)
  const formattedAchievements = toArray(nutritionist.achievements)
  const router = useRouter()
  // Testimonials removidos - campo JSON não existe mais
  const formattedTestimonials: any[] = []

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

  const currentDashboardUrl = useMemo(() => {
    return getDashboardUrl(user?.user_metadata[ 'user_type' ])

  }, [ user?.user_type, getDashboardUrl ])

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-100">
          <div className="container flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-4">
              <Link
                href="/nutricionistas"
                className="flex items-center gap-2 text-[#1E1D40] hover:text-[#4AB0D9] transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="font-medium">Voltar</span>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <Link href="/" className="flex items-center">
                <Image
                  src="/logo-busca-nutri.png"
                  alt="Busca Nutri"
                  width={140}
                  height={28}
                  className="h-6 w-auto transition-transform duration-300 hover:scale-105"
                />
              </Link>
            </div>

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

              {
                user && user.user_metadata[ 'user_type' ] ? (
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
                      onClick={signOut}
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
                    <Link href="/cadastro?tipo=paciente">
                      <Button className="bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white shadow-sm hover:shadow-md transition-all duration-300">
                        Cadastrar
                      </Button>
                    </Link>
                  </>
                )
              }


              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden p-2"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-60 bg-black/50 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Menu */}
        <div
          className={`fixed top-0 right-0 z-[999] h-full w-80 bg-white transform transition-transform duration-300 md:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <Image
              src="/logo-busca-nutri.png"
              alt="Busca Nutri"
              width={120}
              height={24}
              className="h-5 w-auto"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-[#1E1D40] mb-3">
                    Navegação
                  </h3>
                  <div className="space-y-2 ml-4">
                    <Link
                      href="/nutricionistas"
                      className="block text-[#1E1D40]/70 hover:text-[#4AB0D9] transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      ← Voltar para Lista
                    </Link>
                    <Link
                      href="/para-pacientes"
                      className="block text-[#1E1D40]/70 hover:text-[#4AB0D9] transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Para Pacientes
                    </Link>
                    <Link
                      href="/blog"
                      className="block text-[#1E1D40]/70 hover:text-[#4AB0D9] transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Blog
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50">
              <div className="space-y-3">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full bg-transparent">
                    Entrar
                  </Button>
                </Link>
                <Link
                  href="/cadastro?tipo=paciente"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button className="w-full bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white">
                    Cadastrar
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <main className="container px-4 md:px-6 py-8">
          {/* Cover Image - Full Width with Responsive Aspect Ratios */}
          <div className="relative w-full overflow-hidden mb-8 shadow-xl">
            {/* Desktop: 16:5 aspect ratio, Mobile: 16:9 aspect ratio */}
            <div className="relative w-full h-64 md:h-80 lg:h-96">
              <Image
                src={formattedCoverImage}
                alt={`Capa do perfil de ${formattedName}`}
                fill
                className="object-cover object-center"
                sizes={generateSizes('cover')}
                priority
                quality={85}
              />
              {/* Overlay sutil para contraste */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

              {/* Informações sobrepostas */}
              <div className="absolute bottom-14 left-6 text-white z-10">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 drop-shadow-lg">
                  {formattedName}
                </h1>
                <p className="text-lg md:text-xl opacity-90 drop-shadow-md">
                  {formattedSpecialty}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Header */}
          <div className="relative -mt-20 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
              {/* Avatar com sobreposição e borda sutil */}
              <div className="relative mx-auto md:mx-0">
                <div className="relative w-32 h-32 md:w-40 md:h-40">
                  <Image
                    src={formattedImage}
                    alt={`Foto de perfil de ${formattedName}`}
                    fill
                    className="rounded-full object-cover shadow-xl border-4 border-white"
                    sizes={generateSizes('avatar')}
                    quality={90}
                  />
                  {/* Badge de verificação */}
                  <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-full shadow-lg border-2 border-white">
                    <Shield className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-xl font-bold">
                          {formattedRating}
                        </span>
                        <span className="text-[#1E1D40]/70">
                          ({formattedReviews} avaliações)
                        </span>
                      </div>
                      {nutritionist.is_verified && <Badge className="bg-green-100 text-green-800">
                        Verificado
                      </Badge>}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#1E1D40]/70">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {formattedLocation}
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        {formattedExperience ? `${formattedExperience} anos` : "Sem experiência"}
                      </div>
                      <div className="flex items-center gap-1">
                        {/* <Users className="h-4 w-4" /> */}
                        {/* {formattedPatients}+ pacientes */}
                      </div>
                      {formattedOnlineConsultation && (
                        <div className="flex items-center gap-1">
                          <Video className="h-4 w-4 text-green-500" />
                          <span>Online</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-bold text-[#4AB0D9] mb-1">
                      R$ {formattedPrice}
                    </div>
                    <p className="text-sm text-[#1E1D40]/70">a partir de</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-4 mb-8">
            <Link href={`/dashboard/paciente/agendar?nutritionistId=${nutritionist.id}`}>
              <Button
                size="lg"
                className="bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Agendar Consulta
              </Button>
            </Link>
            <Button
              onClick={async () => {
                try {
                  if (user) {
                    const conversationId = await openConversationWithNutritionist(nutritionist.id)
                    router.push(`/dashboard/paciente/chat/${conversationId}`)
                  } else {
                    router.push('/login')
                  }
                } catch (error) {
                  console.log("🚀 ~ error:", error)

                }
              }}
              variant="outline"
              size="lg"
              className="border-[#4AB0D9] text-[#4AB0D9] bg-transparent"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Enviar Mensagem
            </Button>
            {/* <Button variant="outline" size="lg">
              <Heart className="h-5 w-5 mr-2" />
              Favoritar
            </Button> */}
            {formattedWebsite && (
              <Button variant="outline" size="lg">
                <Globe className="h-5 w-5 mr-2" />
                Website
              </Button>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Conteúdo Principal */}
            <div className="lg:col-span-2 space-y-8">
              {/* Sobre */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <User className="h-6 w-6 text-[#4AB0D9]" />
                    Sobre o Profissional
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[#1E1D40]/80 leading-relaxed text-lg">
                    {formattedFullBio}
                  </p>
                </CardContent>
              </Card>

              {/* Insígnias */}
              {nutritionist.badges && nutritionist.badges.length > 0 && (
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Award className="h-6 w-6 text-[#4AB0D9]" />
                      Insígnias e Reconhecimentos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {nutritionist.badges.map((badgeData, index) => {
                        const badge = badgeData.badge
                        if (!badge) return null
                        return (
                          <div
                            key={index}
                            className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200"
                          >
                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                              {badge.icon_url ? (
                                <img
                                  src={badge.icon_url}
                                  alt={badge.name}
                                  className="w-8 h-8 object-contain"
                                />
                              ) : (
                                <Award className="h-6 w-6" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-[#1E1D40] text-lg">
                                {badge.name}
                              </h4>
                              <p className="text-[#1E1D40]/70 text-sm">
                                {badge.description}
                              </p>
                              <p className="text-xs text-[#1E1D40]/50 mt-1">
                                Conquistada em{' '}
                                {new Date(
                                  badgeData.awarded_at
                                ).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Especialidades */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Target className="h-6 w-6 text-[#4AB0D9]" />
                    Áreas de Especialização
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3">
                    {formattedSpecializations.length > 0 ? (
                      formattedSpecializations.map((spec, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg"
                        >
                          <CheckCircle className="h-5 w-5 text-[#4AB0D9] flex-shrink-0" />
                          <span className="font-medium text-[#1E1D40]">
                            {spec}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[#1E1D40]/70">
                        Nenhuma especialização informada.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Formação e Certificações */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <GraduationCap className="h-6 w-6 text-[#4AB0D9]" />
                    Formação e Certificações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-[#1E1D40] mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Formação Acadêmica
                    </h4>
                    <p className="text-[#1E1D40]/80 text-lg">
                      {formattedEducation}
                    </p>
                    <p className="text-sm text-[#1E1D40]/70 mt-1 font-medium">
                      {formattedCrn}
                    </p>
                  </div>

                  {formattedCertifications.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-[#1E1D40] mb-3 flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Certificações e Especializações
                      </h4>
                      <div className="space-y-2">
                        {formattedCertifications.map((cert, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 bg-green-50 rounded-lg"
                          >
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-[#1E1D40]/80">{cert.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Conquistas */}
              {formattedAchievements.length > 0 && (
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <ThumbsUp className="h-6 w-6 text-[#4AB0D9]" />
                      Principais Conquistas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {formattedAchievements.map((achievement, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg"
                        >
                          <Award className="h-6 w-6 text-yellow-500 flex-shrink-0" />
                          <span className="font-medium text-[#1E1D40]">
                            {achievement}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Serviços e Preços */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Stethoscope className="h-6 w-6 text-[#4AB0D9]" />
                    Serviços Oferecidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {formattedServices.length > 0 ? (
                      formattedServices.map((service, index) => (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h4 className="text-xl font-bold text-[#1E1D40]">
                                  {service.name}
                                </h4>
                                <Badge
                                  variant="outline"
                                  className="text-[#4AB0D9] border-[#4AB0D9]"
                                >
                                  <Clock className="h-3 w-3 mr-1" />
                                  {service.duration}
                                </Badge>
                              </div>
                              <p className="text-[#1E1D40]/80 mb-4">
                                {service.description || 'Sem descrição.'}
                              </p>

                              {service.includes &&
                                service.includes.length > 0 && (
                                  <div>
                                    <h5 className="font-semibold text-[#1E1D40] mb-2">
                                      Inclui:
                                    </h5>
                                    <ul className="space-y-1">
                                      {service.includes.map((item, idx) => (
                                        <li
                                          key={idx}
                                          className="flex items-center gap-2 text-sm text-[#1E1D40]/70"
                                        >
                                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                          {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                            </div>

                            <div className="text-center md:text-right mt-5">
                              <div className="text-3xl font-bold text-[#4AB0D9] mb-2">
                                R$ {service.price}
                              </div>
                              {/* <Link
                                href={`/dashboard/paciente/agendar?nutritionistId=${nutritionist.id}`}
                              >
                                <Button className="bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white">
                                  Agendar
                                </Button>
                              </Link> */}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[#1E1D40]/70">
                        Nenhum serviço informado.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Depoimentos */}
              {formattedTestimonials.length > 0 && (
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <MessageSquare className="h-6 w-6 text-[#4AB0D9]" />
                      Depoimentos dos Pacientes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {formattedTestimonials.map((testimonial, index) => (
                        <div key={index} className="bg-gray-50 rounded-xl p-6">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-[#4AB0D9] rounded-full flex items-center justify-center text-white font-bold">
                              {testimonial.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h5 className="font-semibold text-[#1E1D40]">
                                  {testimonial.name}
                                </h5>
                                <div className="flex items-center gap-1">
                                  {[ ...Array(testimonial.rating) ].map(
                                    (_, i) => (
                                      <Star
                                        key={i}
                                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                                      />
                                    )
                                  )}
                                </div>
                              </div>
                              <p className="text-[#1E1D40]/80 italic mb-2">
                                "{testimonial.comment}"
                              </p>
                              <p className="text-xs text-[#1E1D40]/60">
                                {new Date(testimonial.date).toLocaleDateString(
                                  'pt-BR'
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Estatísticas Rápidas */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-xl">Estatísticas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-[#4AB0D9]" />
                      <span className="text-sm font-medium">Experiência</span>
                    </div>
                    <span className="font-bold text-lg">
                      {formattedExperience} anos
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-[#4AB0D9]" />
                      <span className="text-sm font-medium">Pacientes</span>
                    </div>
                    <span className="font-bold text-lg">
                      {formattedPatients}+
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-[#4AB0D9]" />
                      <span className="text-sm font-medium">Avaliação</span>
                    </div>
                    <span className="font-bold text-lg">
                      {formattedRating}/5.0
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-[#4AB0D9]" />
                      <span className="text-sm font-medium">Avaliações</span>
                    </div>
                    <span className="font-bold text-lg">
                      {formattedReviews}
                    </span>
                  </div>

                  {/* Progress Bar para Rating */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Satisfação</span>
                      <span className="text-sm text-[#4AB0D9] font-bold">
                        {Math.round(Number.parseFloat(formattedRating) * 20)}%
                      </span>
                    </div>
                    <Progress
                      value={Number.parseFloat(formattedRating) * 20}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Estatísticas de Visualização */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Eye className="h-5 w-5 text-[#4AB0D9]" />
                    Visualizações do Perfil
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-[#4AB0D9]" />
                      <span className="text-sm font-medium">
                        Total de Visualizações
                      </span>
                    </div>
                    <span className="font-bold text-lg">
                      {viewStats.totalViews}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-[#4AB0D9]" />
                      <span className="text-sm font-medium">
                        Visitantes Únicos
                      </span>
                    </div>
                    <span className="font-bold text-lg">
                      {viewStats.uniqueViews}
                    </span>
                  </div>
                  {viewStats.lastViewAt && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm text-[#1E1D40]/70">
                        <Clock className="h-4 w-4" />
                        <span>Última visualização:</span>
                      </div>
                      <span className="text-sm font-medium">
                        {new Date(viewStats.lastViewAt).toLocaleDateString(
                          'pt-BR',
                          {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Informações de Contato */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-xl">
                    Informações de Contato
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-5 w-5 text-[#4AB0D9] flex-shrink-0" />
                    <span>{formattedPhone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-5 w-5 text-[#4AB0D9] flex-shrink-0" />
                    <span className="break-all">{formattedEmail}</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-5 w-5 text-[#4AB0D9] flex-shrink-0 mt-0.5" />
                    <span>{formattedAddress}</span>
                  </div>
                  {formattedWebsite && (
                    <div className="flex items-center gap-3 text-sm">
                      <Globe className="h-5 w-5 text-[#4AB0D9] flex-shrink-0" />
                      <a
                        href={`https://${formattedWebsite}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#4AB0D9] hover:underline"
                      >
                        {formattedWebsite}
                      </a>
                    </div>
                  )}
                  {formattedOnlineConsultation && (
                    <div className="flex items-center gap-3 text-sm">
                      <Video className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-green-600 font-medium">
                        Consultas online disponíveis
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Horários de Funcionamento */}
              {Object.keys(formattedWorkingHours).length > 0 && (
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="text-xl">Horários de Atendimento</CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-2">
                      {scheduleRows.map((row) => (
                        <div
                          key={row.label}
                          className="flex items-center justify-between py-1"
                        >
                          <span className="text-[#1E1D40] font-medium">{row.label}</span>
                          <span
                            className={row.closed ? 'text-red-500' : 'text-[#1E1D40]/80'}
                          >
                            {row.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Horários Disponíveis */}
              {formattedAvailableTimes.length > 0 && (
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="text-xl">Próximos Horários</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {formattedAvailableTimes.map((time, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="justify-center py-2 text-[#4AB0D9] border-[#4AB0D9]"
                        >
                          {time}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-[#1E1D40]/60 mt-3 text-center">
                      Horários para hoje. Mais opções no agendamento.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Idiomas */}
              {formattedLanguages.length > 0 && (
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="text-xl">Idiomas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {formattedLanguages.map((language, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-[#4AB0D9] border-[#4AB0D9]"
                        >
                          {language}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Redes Sociais */}
              {(formattedSocialMedia.instagram ||
                formattedSocialMedia.linkedin) && (
                  <Card className="shadow-lg border-0">
                    <CardHeader>
                      <CardTitle className="text-xl">Redes Sociais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {formattedSocialMedia.instagram && (
                        <a
                          href={`https://instagram.com/${formattedSocialMedia.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 text-sm hover:text-[#4AB0D9] transition-colors"
                        >
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              IG
                            </span>
                          </div>
                          <span>{formattedSocialMedia.instagram}</span>
                        </a>
                      )}
                      {formattedSocialMedia.linkedin && (
                        <a
                          href={`https://linkedin.com/in/${formattedSocialMedia.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 text-sm hover:text-[#4AB0D9] transition-colors"
                        >
                          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              in
                            </span>
                          </div>
                          <span>LinkedIn</span>
                        </a>
                      )}
                    </CardContent>
                  </Card>
                )}

              {/* CTA Final */}
              <Card className="bg-gradient-to-br from-[#4AB0D9]/10 to-[#4AB0D9]/5 border-[#4AB0D9]/20 shadow-lg">
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-bold text-[#1E1D40] mb-2">
                    Pronto para transformar sua saúde?
                  </h3>
                  <p className="text-[#1E1D40]/70 mb-6">
                    Agende sua consulta e inicie sua jornada rumo ao bem-estar
                  </p>
                  <div className="space-y-3">
                    <Link
                      href={`/dashboard/paciente/agendar?nutritionistId=${nutritionist.id}`}
                    >
                      <Button className="w-full bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white text-lg py-3">
                        <Calendar className="h-5 w-5 mr-2" />
                        Agendar Consulta
                      </Button>
                    </Link>
                    <Button
                      onClick={async () => {
                        try {
                          if (user) {
                            const conversationId = await openConversationWithNutritionist(nutritionist.id)
                            router.push(`/dashboard/paciente/chat/${conversationId}`)
                          } else {
                            router.push('/login')
                          }
                        } catch (error) {
                          console.log("🚀 ~ error:", error)

                        }
                      }}
                      variant="outline"
                      className="w-full border-[#4AB0D9] text-[#4AB0D9] bg-transparent"
                    >
                      <MessageSquare className="h-5 w-5 mr-2" />
                      Enviar Mensagem
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
