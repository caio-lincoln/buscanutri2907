"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MapPin, Star, Calendar, Filter, User, Video, Shield, Heart, Activity, Users, ArrowRight, Bot, Target, Grid3X3, List, BookOpen, CheckCircle, Clock, Scale, Ruler, Utensils, Pill, Dumbbell, Droplets, AlertTriangle, FileText, MessageSquare } from 'lucide-react'
import { getUserProfile, getCurrentUser } from "@/lib/auth"
import type { PatientProfile } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { NotificationsPanel } from "@/components/notifications-panel"
import { DashboardSidebar, getMenuItems } from "@/components/dashboard-sidebar"
import { IrisChat } from "@/components/iris-chat"
import { StatsCard } from "@/components/stats-card"
// Importar o hook de estatísticas do dashboard
import { useDashboardStats } from "@/hooks/use-dashboard-stats.ts"
import {
  getPatientConsultations,
  getPatientFavoriteNutritionists,
  getPatientStats,
  addFavoriteNutritionist,
  removeFavoriteNutritionist,
  type Consultation,
  type FavoriteNutritionist,
  type PatientStats,
} from "@/lib/consultation-service"
import {
  getPatientChatConversations,
  getForumQuestions,
  getPatientForumQuestions,
  type ChatConversation,
  type ForumQuestion,
} from "@/lib/chat-forum-service"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import RecentChatsList from "@/components/recent-chats-list"
import { UserProfileModal } from "@/components/user-profile-modal"
import { RatingCard, RatingDisplay } from "@/components/ui/rating-display"
import { RatingModal } from "@/components/ui/rating-modal"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { PatientForumTab } from "@/components/patient-forum-tab"
import { AnamneseNutricionalModal } from "@/components/anamnese-nutricional-modal"
import { useRealtimeNutritionists } from "@/hooks/use-realtime-nutritionists"

import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"


// Adicionar interfaces para nutricionistas (movidas de app/nutricionistas/page.tsx)
interface NutritionistService {
  id: string
  name: string
  price: number
  online_available: boolean
}

interface Specialty {
  id: string
  name: string
}

interface NutritionistProfile {
  id: string
  user_id: string
  full_name: string
  bio: string
  location: string
  profile_image_url: string | null
  crn: string
  rating: number
  total_reviews: number
  nutritionist_services: NutritionistService[]
  nutritionist_specialties: {
    specialties: Specialty
  }[]
  is_verified: boolean // Adicionado para o selo de verificação
  crn_document_url: string | null
  identity_document_url: string | null
  experience_years?: number | null
}

// Funções auxiliares para nutricionistas (movidas de lib/nutritionist-service.ts e app/nutricionistas/page.tsx)
const formatNutritionistData = (nutritionist: NutritionistProfile) => {
  const specialties = nutritionist.nutritionist_specialties?.map((s) => s.specialties?.name).filter(Boolean) || []
  const services = nutritionist.nutritionist_services || []

  return {
    id: nutritionist.id,
    name: nutritionist.full_name,
    bio: nutritionist.bio,
    location: nutritionist.location,
    image: nutritionist?.profile_image_url || "/placeholder.svg",
    crn: nutritionist.crn,
    rating: nutritionist.rating || 0,
    reviews: nutritionist.total_reviews || 0,
    specialty: specialties.join(", ") || "Nutrição Geral",
    specializations: specialties,
    experience: nutritionist.experience_years || 0, // Assumindo que experience_years existe ou será adicionado
    price: services.length > 0 ? Math.min(...services.map((s) => s.price)) : 0,
    services: services,
    onlineConsultation: services.some((s) => s.online_available),
    is_verified: nutritionist.is_verified,
  }
}

const specialtiesOptions = [
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

const statesOptions = [
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

export default function PatientDashboard() {
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [favoriteNutritionists, setFavoriteNutritionists] = useState<FavoriteNutritionist[]>([])
  const [stats, setStats] = useState<PatientStats>({
    totalConsultations: 0,
    scheduledConsultations: 0,
    completedConsultations: 0,
    favoriteNutritionists: 0,
    averageRating: 0,
  })
  const [chatConversations, setChatConversations] = useState<ChatConversation[]>([])
  const [forumQuestions, setForumQuestions] = useState<ForumQuestion[]>([])
  const [patientForumQuestions, setPatientForumQuestions] = useState<ForumQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isAnamneseModalOpen, setIsAnamneseModalOpen] = useState(false)
  const [anamneseData, setAnamneseData] = useState<any>(null)
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()

  // Estados para a aba "Buscar Nutricionistas"
  const [searchNutritionistTerm, setSearchNutritionistTerm] = useState("")
  const [selectedNutritionistSpecialty, setSelectedNutritionistSpecialty] = useState("Todas")
  const [selectedNutritionistState, setSelectedNutritionistState] = useState("Todas")
  const [selectedNutritionistPriceRange, setSelectedNutritionistPriceRange] = useState(priceRanges[0])
  const [onlineOnlyNutritionist, setOnlineOnlyNutritionist] = useState(false)
  const [showVerifiedOnlyNutritionist, setShowVerifiedOnlyNutritionist] = useState(false)
  const [sortByNutritionist, setSortByNutritionist] = useState("rating")
  const [viewModeNutritionist, setViewModeNutritionist] = useState<"grid" | "list">("grid")
  const [availableSpecialties, setAvailableSpecialties] = useState<Specialty[]>([])
  const [availableLocations, setAvailableLocations] = useState<string[]>([])
  const [favoritedNutritionists, setFavoritedNutritionists] = useState<Set<string>>(new Set())

  // Hook de realtime para nutricionistas
  const { 
    nutritionists, 
    loading: loadingNutritionists, 
    error: nutritionistsError,
    refreshNutritionists 
  } = useRealtimeNutritionists({
    searchTerm: searchNutritionistTerm,
    specialty: selectedNutritionistSpecialty,
    state: selectedNutritionistState,
    priceRange: selectedNutritionistPriceRange,
    onlineOnly: onlineOnlyNutritionist,
    verifiedOnly: showVerifiedOnlyNutritionist,
    sortBy: sortByNutritionist
  })

  // Estados para o modal de avaliação
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false)
  const [selectedConsultationForRating, setSelectedConsultationForRating] = useState<Consultation | null>(null)





  const upcomingConsultations = consultations
    .filter((c) => c.status === "scheduled" && c.start_time && parseISO(c.start_time) > new Date())
    .slice(0, 3)

  // Hook para estatísticas dinâmicas do dashboard
  const { stats: dashboardStats, loading: statsLoading } = useDashboardStats({
    userType: "paciente",
    userId: profile?.user_id || "",
    enabled: !!profile?.user_id
  })

  const menuItems = getMenuItems("paciente", dashboardStats)

  useEffect(() => {
    if (!authLoading) {
      loadProfile()
    }
  }, [user, authLoading])



  useEffect(() => {
    if (activeTab === "buscar") {
      loadAvailableSpecialties()
      loadAvailableLocations()
    }
  }, [activeTab])

  // Recarregar dados quando a aba perfil for ativada
  useEffect(() => {
    if (activeTab === "perfil" && profile?.user_id) {
      loadAnamneseData(profile.user_id)
    }
  }, [activeTab, profile?.user_id])

  const loadProfile = async () => {
    try {
      if (!user) {
        router.push("/login")
        return
      }

      const { data: profileData } = await getUserProfile(user.id, "paciente")
      setProfile(profileData)

      // Carregar dados da anamnese nutricional
      if (profileData?.user_id) {
        await loadAnamneseData(profileData.user_id)
      }

    } catch (error) {
      console.error("Error loading profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadAnamneseData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('anamnese_nutricional')
        .select('*')
        .eq('patient_id', userId)
        .single()

      if (data && !error) {
        setAnamneseData(data)
      }
    } catch (error) {
      console.log('Nenhuma anamnese encontrada')
    }
  }



  // Funções para a aba "Buscar Nutricionistas"

  const loadAvailableSpecialties = async () => {
    try {
      const { data, error } = await supabase.from("specialties").select("id, name").order("name")
      if (error) throw error
      setAvailableSpecialties(data || [])
    } catch (error) {
      console.error("Error loading specialties:", error)
    }
  }

  const loadAvailableLocations = async () => {
    try {
      const { data, error } = await supabase
        .from("nutritionist_profiles")
        .select("location")
        .not("location", "is", null)
      if (error) throw error
      const uniqueLocations = [...new Set(data?.map((item) => item.location).filter(Boolean))]
      setAvailableLocations(uniqueLocations)
    } catch (error) {
      console.error("Error loading locations:", error)
    }
  }

  const getMinPrice = (services: NutritionistService[]) => {
    if (!services || services.length === 0) return null
    return Math.min(...services.map((service) => service.price))
  }

  const hasOnlineConsultation = (services: NutritionistService[]) => {
    return services?.some((service) => service.online_available) || false
  }

  const getSpecialtiesText = (nutritionist: NutritionistProfile) => {
    return (
      nutritionist.nutritionist_specialties
        ?.map((spec) => spec.specialties?.name)
        .filter(Boolean)
        .join(", ") || "Nutrição Geral"
    )
  }

  const handleScheduleConsultation = (nutritionistId: string) => {
    router.push(`/dashboard/paciente/agendar/${nutritionistId}`)
  }

  // Funções gerais



  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // Funções para favoritar nutricionistas
  const handleToggleFavorite = async (nutritionistId: string) => {
    try {
      const user = await getCurrentUser()
      if (!user) return

      const isFavorited = favoritedNutritionists.has(nutritionistId)
      
      if (isFavorited) {
        const success = await removeFavoriteNutritionist(user.id, nutritionistId)
        if (success) {
          setFavoritedNutritionists(prev => {
            const newSet = new Set(prev)
            newSet.delete(nutritionistId)
            return newSet
          })
          // Recarregar favoritos para atualizar a lista
          const updatedFavorites = await getPatientFavoriteNutritionists(user.id)
          setFavoriteNutritionists(updatedFavorites)
        }
      } else {
        const success = await addFavoriteNutritionist(user.id, nutritionistId)
        if (success) {
          setFavoritedNutritionists(prev => new Set([...prev, nutritionistId]))
          // Recarregar favoritos para atualizar a lista
          const updatedFavorites = await getPatientFavoriteNutritionists(user.id)
          setFavoriteNutritionists(updatedFavorites)
        }
      }
    } catch (error) {
      console.error('Erro ao favoritar/desfavoritar nutricionista:', error)
    }
  }

  // Funções para o modal de avaliação
  const handleOpenRatingModal = (consultation: Consultation) => {
    setSelectedConsultationForRating(consultation)
    setIsRatingModalOpen(true)
  }

  const handleCloseRatingModal = () => {
    setIsRatingModalOpen(false)
    setSelectedConsultationForRating(null)
  }

  const handleRatingSubmit = async (rating: number, comment: string) => {
    if (!selectedConsultationForRating || !profile) return

    try {
      // Usar a tabela consultation_ratings conforme a migração
      const { error } = await supabase
        .from("consultation_ratings")
        .insert({
          consultation_id: selectedConsultationForRating.id,
          patient_id: profile.user_id,
          nutritionist_id: selectedConsultationForRating.nutritionist_id,
          rating,
          comment,
        })
      
      if (error) {
        console.error('Erro ao salvar avaliação:', error)
        return
      }
      
      // Fechar o modal após salvar
      handleCloseRatingModal()
      
      // Recarregar dados para refletir a nova avaliação
      const user = await getCurrentUser()
      if (user) {
        // Funcionalidade de telemedicina removida temporariamente
        console.log("Avaliação salva com sucesso")
      }
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error)
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString || dateString.trim() === '') return "Data não disponível"
    try {
      return format(parseISO(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR })
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Data inválida"
    }
  }

  const recentActivities = [
    ...consultations.slice(0, 3).filter(c => c.start_time).map((c) => ({
      id: c.id,
      type: "consultation",
      title: `Consulta com ${c.nutritionist_profiles?.full_name || "Nutricionista"}`,
      description: c.status === "completed" ? "Consulta concluída" : "Consulta agendada",
      time: formatDate(c.start_time),
      icon: Video,
    })),
    ...favoriteNutritionists.slice(0, 2).filter(f => f.created_at).map((f) => ({
      id: f.id,
      type: "favorite",
      title: `${f.nutritionist_profiles.full_name} adicionado aos favoritos`,
      description: f.nutritionist_profiles.specialties.join(", "),
      time: formatDate(f.created_at),
      icon: Heart,
    })),
  ]
    .filter(activity => activity.time !== "Data não disponível" && activity.time !== "Data inválida")
    .sort((a, b) => {
      try {
        if (!a.time || !b.time) return 0
        return parseISO(b.time).getTime() - parseISO(a.time).getTime()
      } catch (error) {
        return 0
      }
    })
    .slice(0, 5)

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50/50 via-white to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-200 border-t-red-500 mx-auto"></div>
          <p className="text-[#1E1D40]/70 font-medium">Carregando seu dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardSidebar
      userType="paciente"
      userName={profile?.full_name || "Paciente"}
      userAvatar={profile?.profile_image_url || "/placeholder.svg"}
      menuItems={menuItems}
      activeItem={activeTab}
      onItemClick={setActiveTab}
      onSignOut={handleSignOut}
    >
      <div className="space-y-8">
        {/* Overview Dashboard */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-red-500 via-red-600 to-red-700 rounded-3xl p-8 text-white shadow-2xl">
              <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=800')] opacity-10"></div>
              <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <Heart className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-bold">
                        Olá, {profile?.full_name ? (profile.full_name.split(" ")[0] || "Paciente") : "Paciente"}!
                      </h1>
                      <p className="text-red-100 text-lg mt-1">Como está sua jornada de saúde hoje?</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                      <p className="text-sm text-red-100">Próxima consulta</p>
                      <p className="font-semibold">
                        {upcomingConsultations.length > 0
                          ? formatDate(upcomingConsultations[0].start_time)
                          : "Nenhuma agendada"}
                      </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                      <p className="text-sm text-red-100">Consultas realizadas</p>
                      <p className="font-semibold">{stats.completedConsultations}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                      <p className="text-sm text-red-100">Sua avaliação</p>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{profile?.rating?.toFixed(1) || "5.0"}</span>
                        <RatingDisplay 
                          rating={profile?.rating || 5.0} 
                          totalReviews={profile?.total_reviews || 0}
                          size="sm"
                          showNumber={false}
                          showReviewCount={false}
                          className="text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hidden lg:block">
                  <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Target className="h-16 w-16 text-white/80" />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Consultas Agendadas"
                value={stats.scheduledConsultations}
                icon={Calendar}
                color="blue"
                trend={{ value: 12, isPositive: true }}
                description="Este mês"
              />
              <StatsCard
                title="Total de Consultas"
                value={stats.totalConsultations}
                icon={Activity}
                color="green"
                trend={{ value: 8, isPositive: true }}
                description="Histórico completo"
              />
              <StatsCard
                title="Avaliação Média"
                value={profile?.rating?.toFixed(1) || "5.0"}
                icon={Star}
                color="yellow"
                trend={{ value: 15, isPositive: true }}
                description={`Baseado em ${profile?.total_reviews || 0} avaliações`}
              />
              <StatsCard
                title="Nutricionistas Favoritos"
                value={stats.favoriteNutritionists}
                icon={Users}
                color="purple"
                description="Profissionais salvos"
              />
            </div>

            {/* Quick Actions */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#1E1D40]">Ações Rápidas</h2>
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                  Ver todas <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card
                  className="group hover-lift cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-xl bg-gradient-to-br from-green-50 to-green-100/50 backdrop-blur-sm"
                  onClick={() => setIsAnamneseModalOpen(true)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <FileText className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-[#1E1D40] mb-2 text-lg">Anamnese Nutricional</h3>
                    <p className="text-sm text-gray-600 mb-4">Complete seu histórico de saúde</p>
                    <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                      Iniciar <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>

                <Card
                  className="group hover-lift cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-xl bg-gradient-to-br from-blue-50 to-blue-100/50 backdrop-blur-sm"
                  onClick={() => setActiveTab("buscar")}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Search className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-[#1E1D40] mb-2 text-lg">Buscar Nutricionista</h3>
                    <p className="text-sm text-gray-600 mb-4">Encontre profissionais próximos a você</p>
                    <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                      Buscar agora <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>



                <Card className="group hover-lift cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-xl bg-gradient-to-br from-purple-50 to-purple-100/50 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Bot className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-[#1E1D40] mb-2 text-lg">Chat com IrisBot</h3>
                    <p className="text-sm text-gray-600 mb-4">Tire suas dúvidas com IA</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      onClick={() => setActiveTab("iris")}
                    >
                      Conversar <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>

                <Card
                  className="group hover-lift cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-xl bg-gradient-to-br from-orange-50 to-orange-100/50 backdrop-blur-sm"
                  onClick={() => router.push("/blog")}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <BookOpen className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-[#1E1D40] mb-2 text-lg">Dúvidas Públicas</h3>
                    <p className="text-sm text-gray-600 mb-4">Perguntas da comunidade</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    >
                      Explorar <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Recent Activity & Favorites */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-0 shadow-lg backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Activity className="h-4 w-4 text-white" />
                    </div>
                    <span>Atividade Recente</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors duration-200 group"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                          <item.icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#1E1D40] text-sm">{item.title}</p>
                          <p className="text-sm text-gray-600 truncate">{item.description}</p>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">{item.time}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Nenhuma atividade recente</p>
                    </div>
                  )}

                  <Button variant="ghost" className="w-full mt-4 text-gray-600 hover:text-gray-800">
                    Ver todas as atividades <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                      <Star className="h-4 w-4 text-white" />
                    </div>
                    <span>Nutricionistas Favoritos</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {favoriteNutritionists.length > 0 ? (
                    favoriteNutritionists.slice(0, 3).map((nutritionist, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors duration-200 group"
                      >
                        <Avatar className="h-12 w-12 ring-2 ring-gray-200 shadow-md group-hover:scale-105 transition-transform duration-300">
                          <AvatarImage
                            src={
                              nutritionist.nutritionist_profiles?.profile_image_url ||
                              `/placeholder.svg?height=48&width=48&query=${nutritionist.nutritionist_profiles?.full_name || "nutritionist profile"}`
                            }
                          />
                          <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold">
                            {nutritionist.nutritionist_profiles?.full_name
                              ? (nutritionist.nutritionist_profiles.full_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("") || "N")
                              : "N"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#1E1D40]">{nutritionist.nutritionist_profiles?.full_name}</p>
                          <p className="text-sm text-gray-600">
                            {nutritionist.nutritionist_profiles?.specialties?.join(", ")}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">{nutritionist.nutritionist_profiles?.rating}</span>
                            <span className="text-sm text-gray-500">
                              ({nutritionist.nutritionist_profiles?.total_reviews} avaliações)
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="hover:bg-green-50 hover:text-green-700 hover:border-green-200 bg-transparent"
                        >
                          Consultar
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Nenhum favorito ainda</p>
                    </div>
                  )}

                  <Button variant="ghost" className="w-full mt-4 text-gray-600 hover:text-gray-800">
                    Ver todos os favoritos <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Buscar Nutricionista */}
        {activeTab === "buscar" && (
          <div className="space-y-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">Encontrar Nutricionista</h1>
                <p className="text-gray-600">Descubra profissionais qualificados próximos a você</p>
              </div>
              <Button
                variant="outline"
                className="hover-lift bg-white/80 backdrop-blur-sm border-gray-200"
                onClick={() => {
                  setSearchNutritionistTerm("")
                  setSelectedNutritionistSpecialty("Todas")
                  setSelectedNutritionistState("Todas")
                  setSelectedNutritionistPriceRange(priceRanges[0])
                  setOnlineOnlyNutritionist(false)
                  setShowVerifiedOnlyNutritionist(false)
                  setSortByNutritionist("rating")
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
                      onChange={(e) => setSearchNutritionistTerm(e.target.value)}
                      className="pl-10 h-12 border-0 bg-gray-50/50 focus:bg-white transition-colors"
                    />
                  </div>

                  <Select value={selectedNutritionistSpecialty} onValueChange={setSelectedNutritionistSpecialty}>
                    <SelectTrigger className="h-12 border-0 bg-gray-50/50 focus:bg-white">
                      <SelectValue placeholder="Especialidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialtiesOptions.map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedNutritionistState} onValueChange={setSelectedNutritionistState}>
                    <SelectTrigger className="h-12 border-0 bg-gray-50/50 focus:bg-white">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {statesOptions.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedNutritionistPriceRange.label}
                    onValueChange={(value) => {
                      const range = priceRanges.find((r) => r.label === value)
                      if (range) setSelectedNutritionistPriceRange(range)
                    }}
                  >
                    <SelectTrigger className="h-12 border-0 bg-gray-50/50 focus:bg-white">
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
                      <label htmlFor="online-only-nutritionist" className="text-sm font-medium">
                        Apenas consultas online
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified-only-nutritionist"
                        checked={showVerifiedOnlyNutritionist}
                        onCheckedChange={setShowVerifiedOnlyNutritionist}
                      />
                      <label htmlFor="verified-only-nutritionist" className="text-sm font-medium">
                        Apenas profissionais verificados
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm text-[#1E1D40]/70">
                      {nutritionists.length} profissional{nutritionists.length !== 1 ? "s" : ""} encontrado
                      {nutritionists.length !== 1 ? "s" : ""}
                    </span>

                    <div className="flex items-center gap-2">
                      <Button
                        variant={viewModeNutritionist === "grid" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewModeNutritionist("grid")}
                        className="p-2"
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewModeNutritionist === "list" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewModeNutritionist("list")}
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
            {loadingNutritionists && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-200 border-t-red-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Buscando nutricionistas...</p>
              </div>
            )}

            {/* Error State */}
            {nutritionistsError && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">!</div>
                <h3 className="text-xl font-semibold text-red-600 mb-2">Erro ao carregar nutricionistas</h3>
                <p className="text-gray-600 mb-6">Ocorreu um problema ao buscar os nutricionistas. Tente novamente.</p>
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
                    className={viewModeNutritionist === "grid" ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "space-y-4"}
                  >
                    {nutritionists.map((nutritionist) => {
                      const formatted = formatNutritionistData(nutritionist)

                      return (
                        <Card
                          key={nutritionist.id}
                          className={`group hover-lift transition-all duration-300 border-0 shadow-lg hover:shadow-xl backdrop-blur-sm ${
                            viewModeNutritionist === "list" ? "flex" : ""
                          }`}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <Avatar className="h-16 w-16 ring-2 ring-gray-200 shadow-lg group-hover:scale-105 transition-transform duration-300">
                                <AvatarImage
                                  src={
                                    nutritionist?.profile_image_url ||
                                    `/placeholder.svg?height=48&width=48&query=${nutritionist?.full_name || "nutritionist profile"}`
                                  }
                                />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xl font-bold">
                                  {nutritionist.full_name?.charAt(0) || "N"}
                                </AvatarFallback>
                              </Avatar>

                              <div className="flex-1 space-y-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h3 className="font-bold text-[#1E1D40] text-lg">{nutritionist.full_name}</h3>
                                    <p className="text-sm text-gray-600">CRN: {nutritionist.crn}</p>
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
                                      {nutritionist.rating?.toFixed(1) || "5.0"}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                      ({nutritionist.total_reviews || 0} avaliações)
                                    </span>
                                  </div>

                                  {nutritionist.location && (
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4 text-gray-500" />
                                      <span className="text-sm text-gray-600">{nutritionist.location}</span>
                                    </div>
                                  )}

                                  <div className="flex flex-wrap gap-2">
                                    {(typeof (getSpecialtiesText(nutritionist) || "Nutrição Geral") === "string" 
                                      ? (getSpecialtiesText(nutritionist) || "Nutrição Geral").split(", ") 
                                      : ["Nutrição Geral"])
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
                                    <p className="text-sm text-gray-600 line-clamp-2">{nutritionist.bio}</p>
                                  )}
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                  <div className="flex items-center gap-4">
                                    {getMinPrice(nutritionist.nutritionist_services) !== null && (
                                      <div className="flex items-center gap-1 text-sm">
                                        <span className="text-gray-600">A partir de</span>
                                        <span className="font-bold text-[#1E1D40] text-lg">
                                          R$ {getMinPrice(nutritionist.nutritionist_services)}
                                        </span>
                                      </div>
                                    )}
                                    {hasOnlineConsultation(nutritionist.nutritionist_services) && (
                                      <div className="flex items-center gap-1 text-sm text-green-600">
                                        <Video className="h-4 w-4" />
                                        <span>Online</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                  <Link href={`/nutricionistas/${nutritionist.id}`}>
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
                                    onClick={() => handleScheduleConsultation(nutritionist.id)}
                                  >
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Agendar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className={`hover-lift bg-white/80 backdrop-blur-sm transition-all duration-300 ${
                                      favoritedNutritionists.has(nutritionist.id)
                                        ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                                        : "hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                    }`}
                                    onClick={() => handleToggleFavorite(nutritionist.id)}
                                  >
                                    <Heart className={`h-4 w-4 ${
                                      favoritedNutritionists.has(nutritionist.id) ? "fill-current" : ""
                                    }`} />
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
                    <h3 className="text-xl font-semibold text-[#1E1D40] mb-2">Nenhum nutricionista encontrado</h3>
                    <p className="text-gray-600 mb-6">Tente ajustar os filtros ou fazer uma nova busca</p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchNutritionistTerm("")
                        setSelectedNutritionistSpecialty("Todas")
                        setSelectedNutritionistState("Todas")
                        setSelectedNutritionistPriceRange(priceRanges[0])
                        setOnlineOnlyNutritionist(false)
                        setShowVerifiedOnlyNutritionist(false)
                        setSortByNutritionist("rating")
                      }}
                    >
                      Limpar filtros e buscar novamente
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}



        {/* Iris Chat */}
        {activeTab === "iris" && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                <Bot className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">Chat com IrisBot</h1>
                <p className="text-gray-600 text-lg">Sua assistente virtual para pacientes</p>
              </div>
            </div>

            <Card className="border-0 shadow-2xl backdrop-blur-sm">
              <IrisChat userType="paciente" />
            </Card>
          </div>
        )}

        {/* Chat */}
        {activeTab === "chat" && (
          <div className="space-y-8">
            {profile?.user_id && <RecentChatsList userId={profile.user_id} />}
            {!profile?.user_id && (
              <div className="text-center py-8">
                <p className="text-gray-600">Por favor, faça login para ver seus chats.</p>
              </div>
            )}
          </div>
        )}

        {/* Dúvidas (Fórum de Pacientes) */}
        {activeTab === "duvidas" && <PatientForumTab />}

        {/* Notificações */}
        {activeTab === "notificacoes" && (
          <div className="space-y-8">
            <NotificationsPanel userType="paciente" />
          </div>
        )}

        {/* Perfil */}
        {activeTab === "perfil" && (
          <div className="space-y-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">Meu Perfil</h1>
                <p className="text-gray-600">Visualize todas as suas informações pessoais e de saúde</p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="hover-lift bg-white/80 backdrop-blur-sm border-gray-200"
                  onClick={() => setIsProfileModalOpen(true)}
                >
                  <User className="h-4 w-4 mr-2" />
                  Editar Perfil
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Informações Pessoais */}
              <Card className="border-0 shadow-lg backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span>Informações Pessoais</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center">
                    <Avatar className="h-20 w-20 mb-4">
                      <AvatarImage
                        src={
                          profile?.profile_image_url ||
                          `/placeholder.svg?height=80&width=80&query=${profile?.full_name || "user profile"}`
                        }
                      />
                      <AvatarFallback className="bg-gray-200 text-gray-600 text-xl font-semibold">
                        {profile?.full_name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Nome Completo</label>
                      <p className="text-[#1E1D40] font-semibold">{profile?.full_name || anamneseData?.nome_completo || "Não informado"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Data de Nascimento</label>
                      <p className="text-[#1E1D40] font-semibold">{profile?.birth_date || anamneseData?.data_nascimento || "Não informado"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Telefone</label>
                      <p className="text-[#1E1D40] font-semibold">{profile?.phone || anamneseData?.telefone || "Não informado"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">E-mail</label>
                      <p className="text-[#1E1D40] font-semibold">{user?.email || profile?.email || anamneseData?.email || "Não informado"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">CPF</label>
                      <p className="text-[#1E1D40] font-semibold">{profile?.cpf || "Não informado"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">RG</label>
                      <p className="text-[#1E1D40] font-semibold">{profile?.rg || "Não informado"}</p>
                    </div>
                    {anamneseData?.genero && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Gênero</label>
                        <p className="text-[#1E1D40] font-semibold">{anamneseData.genero}</p>
                      </div>
                    )}
                    {anamneseData?.instagram && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Instagram</label>
                        <p className="text-[#1E1D40] font-semibold">{anamneseData.instagram}</p>
                      </div>
                    )}
                    {(anamneseData?.cidade || anamneseData?.estado) && (
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-600">Localização</label>
                        <p className="text-[#1E1D40] font-semibold">
                          {[anamneseData?.cidade, anamneseData?.estado].filter(Boolean).join(", ") || "Não informado"}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Informações de Saúde */}
              <Card className="border-0 shadow-lg backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                      <Heart className="h-4 w-4 text-white" />
                    </div>
                    <span>Informações de Saúde</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Dados Antropométricos */}
                  {anamneseData && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-[#1E1D40] border-b border-gray-200 pb-2">Dados Antropométricos</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Scale className="h-4 w-4" />
                            Peso Atual
                          </label>
                          <p className="text-[#1E1D40] font-semibold">{anamneseData.peso_atual ? `${anamneseData.peso_atual} kg` : "Não informado"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Ruler className="h-4 w-4" />
                            Altura
                          </label>
                          <p className="text-[#1E1D40] font-semibold">{anamneseData.altura ? `${anamneseData.altura} cm` : "Não informado"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">IMC</label>
                          <p className="text-[#1E1D40] font-semibold">{anamneseData.imc || "Não calculado"}</p>
                        </div>
                      </div>
                      {anamneseData.historico_peso && (
                        <div>
                          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Scale className="h-4 w-4" />
                            Histórico de Peso
                          </label>
                          <p className="text-[#1E1D40] font-semibold mt-1">{anamneseData.historico_peso}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Objetivos e Metas */}
                  {anamneseData && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-[#1E1D40] border-b border-gray-200 pb-2">Objetivos e Metas</h3>
                      <div>
                        <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Objetivos Nutricionais
                        </label>
                        {anamneseData.objetivos_nutricionais && anamneseData.objetivos_nutricionais.length > 0 ? (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {anamneseData.objetivos_nutricionais.map((objetivo: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                {objetivo === "definicao" ? "Definição" :
                                 objetivo === "disturbios_saude" ? "Distúrbios na saúde" :
                                 objetivo === "emagrecimento" ? "Emagrecimento" :
                                 objetivo === "ganho_massa_muscular" ? "Ganho de massa muscular" :
                                 objetivo === "intolerancia_alergia" ? "Intolerância/alergia alimentar" :
                                 objetivo === "performance_esportiva" ? "Performance esportiva" :
                                 objetivo === "reeducacao_alimentar" ? "Reeducação alimentar" :
                                 objetivo === "saude_geral" ? "Saúde geral" :
                                 objetivo === "saude_intestinal" ? "Saúde intestinal" :
                                 objetivo === "outro" ? "Outro" : objetivo}
                              </Badge>
                            ))}
                          </div>
                        ) : anamneseData.objetivo_nutricional ? (
                          <p className="text-[#1E1D40] font-semibold">{anamneseData.objetivo_nutricional}</p>
                        ) : (
                          <p className="text-[#1E1D40] font-semibold">Não informado</p>
                        )}
                        {anamneseData.objetivo_personalizado && (
                          <div className="mt-2">
                            <label className="text-sm font-medium text-gray-600">Objetivo Personalizado:</label>
                            <p className="text-[#1E1D40] font-semibold bg-gray-50 p-2 rounded-lg mt-1">{anamneseData.objetivo_personalizado}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Condições de Saúde */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[#1E1D40] border-b border-gray-200 pb-2">Condições de Saúde</h3>
                    
                    {/* Comorbidades */}
                    <div>
                      <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Comorbidades
                      </label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(() => {
                          const conditions = [
                            ...(Array.isArray(profile?.health_conditions) ? profile.health_conditions : []),
                            ...(Array.isArray(anamneseData?.comorbidades) ? anamneseData.comorbidades : [])
                          ];
                          return conditions.length > 0 ? (
                            conditions.map((condition, i) => {
                              // Mapear códigos para nomes legíveis
                              const nomeComorbidade = 
                                condition === "anemia" ? "Anemia" :
                                condition === "ansiedade" ? "Ansiedade" :
                                condition === "artrite_reumatoide" ? "Artrite reumatoide" :
                                condition === "colite_ulcerativa" ? "Colite ulcerativa" :
                                condition === "depressao" ? "Depressão" :
                                condition === "desnutricao" ? "Desnutrição" :
                                condition === "diabetes_mellitus_1" ? "Diabetes mellitus tipo 1" :
                                condition === "diabetes_mellitus_2" ? "Diabetes mellitus tipo 2" :
                                condition === "dislipidemia" ? "Dislipidemia" :
                                condition === "doenca_cardiaca" ? "Doença cardíaca" :
                                condition === "doenca_celiaca" ? "Doença celíaca" :
                                condition === "doenca_crohn" ? "Doença de Crohn" :
                                condition === "doenca_hashimoto" ? "Doença de Hashimoto" :
                                condition === "doenca_hepatica_cronica" ? "Doença hepática crônica" :
                                condition === "doenca_renal_cronica" ? "Doença renal crônica" :
                                condition === "doencas_neurodegenerativas" ? "Doenças neurodegenerativas" :
                                condition === "gastrite" ? "Gastrite" :
                                condition === "hipertensao_arterial" ? "Hipertensão arterial" :
                                condition === "hipertiroidismo" ? "Hipertiroidismo" :
                                condition === "hipotiroidismo" ? "Hipotiroidismo" :
                                condition === "intolerancia_alergia_lactose" ? "Intolerância à lactose" :
                                condition === "lupus" ? "Lúpus" :
                                condition === "neoplasia" ? "Neoplasia" :
                                condition === "obesidade" ? "Obesidade" :
                                condition === "osteoporose" ? "Osteoporose" :
                                condition === "refluxo_gastroesofagico" ? "Refluxo gastroesofágico" :
                                condition === "sindrome_intestino_irritavel" ? "Síndrome do intestino irritável" :
                                condition === "sindrome_metabolica" ? "Síndrome metabólica" :
                                condition === "transtorno_alimentar" ? "Transtorno alimentar" :
                                condition === "ulcera_peptica" ? "Úlcera péptica" :
                                condition;
                              
                              return (
                                <Badge key={i} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                  {nomeComorbidade}
                                </Badge>
                              );
                            })
                          ) : (
                            <p className="text-sm text-gray-500">Nenhuma informada</p>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Alergias e Intolerâncias */}
                    <div>
                      <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Alergias e Intolerâncias
                      </label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(() => {
                          const allergies = [
                            ...(Array.isArray(profile?.allergies) ? profile.allergies : []),
                            ...(Array.isArray(anamneseData?.alergias_alimentares) ? anamneseData.alergias_alimentares : []),
                            ...(Array.isArray(anamneseData?.alergias_intolerancias) ? anamneseData.alergias_intolerancias : [])
                          ];
                          return allergies.length > 0 ? (
                            allergies.map((allergy, i) => {
                              // Mapear códigos para nomes legíveis
                              const nomeAlergia = 
                                allergy === "amendoim" ? "Amendoim" :
                                allergy === "castanhas" ? "Castanhas" :
                                allergy === "corantes" ? "Corantes" :
                                allergy === "crustaceos" ? "Crustáceos" :
                                allergy === "frutos_mar" ? "Frutos do mar" :
                                allergy === "gluten" ? "Glúten" :
                                allergy === "lactose" ? "Lactose" :
                                allergy === "ovo" ? "Ovo" :
                                allergy === "peixes" ? "Peixes" :
                                allergy === "soja" ? "Soja" :
                                allergy === "sulfitos" ? "Sulfitos" :
                                allergy === "trigo" ? "Trigo" :
                                allergy;
                              
                              return (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                                >
                                  {nomeAlergia}
                                </Badge>
                              );
                            })
                          ) : (
                            <p className="text-sm text-gray-500">Nenhuma informada</p>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Medicamentos e Suplementos */}
                  {anamneseData && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-[#1E1D40] border-b border-gray-200 pb-2">Medicamentos e Suplementos</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Medicamentos */}
                        <div>
                          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Pill className="h-4 w-4" />
                            Medicamentos em Uso
                          </label>
                          {anamneseData.medicacoes_uso && Array.isArray(anamneseData.medicacoes_uso) && anamneseData.medicacoes_uso.length > 0 ? (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {anamneseData.medicacoes_uso.map((medicamento: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  {medicamento}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 mt-1">Não informado</p>
                          )}
                        </div>

                        {/* Suplementos */}
                        <div>
                          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Pill className="h-4 w-4" />
                            Suplementação
                          </label>
                          {anamneseData.suplementacao_atual && Array.isArray(anamneseData.suplementacao_atual) && anamneseData.suplementacao_atual.length > 0 ? (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {anamneseData.suplementacao_atual.map((suplemento: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                  {suplemento}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 mt-1">Não informado</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Exames e Avaliações */}
                  {anamneseData?.exames_laboratoriais && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-[#1E1D40] border-b border-gray-200 pb-2">Exames e Avaliações</h3>
                      <div>
                        <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Exames Laboratoriais Recentes
                        </label>
                        <p className="text-[#1E1D40] font-semibold mt-1">{anamneseData.exames_laboratoriais}</p>
                      </div>
                    </div>
                  )}

                  {/* Estilo de Vida */}
                  {anamneseData && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-[#1E1D40] border-b border-gray-200 pb-2">Estilo de Vida</h3>
                      
                      {/* Atividade Física */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Dumbbell className="h-4 w-4" />
                            Atividade Física
                          </label>
                          <p className="text-[#1E1D40] font-semibold">{anamneseData.atividade_fisica || "Não informado"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Frequência</label>
                          <p className="text-[#1E1D40] font-semibold">{anamneseData.frequencia_atividade_fisica || "Não informado"}</p>
                        </div>
                      </div>

                      {/* Consumo de Água */}
                      {anamneseData.consumo_agua && (
                        <div>
                          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Droplets className="h-4 w-4" />
                            Consumo de Água Diário
                          </label>
                          <p className="text-[#1E1D40] font-semibold">{anamneseData.consumo_agua}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Preferências e Restrições Alimentares */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[#1E1D40] border-b border-gray-200 pb-2">Preferências e Restrições Alimentares</h3>
                    
                    {/* Preferências Alimentares */}
                    <div>
                      <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Utensils className="h-4 w-4" />
                        Preferências Alimentares
                      </label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(() => {
                          const preferences = [
                            ...(Array.isArray(profile?.dietary_preferences) ? profile.dietary_preferences : []),
                            ...(Array.isArray(anamneseData?.preferencias_alimentares) ? anamneseData.preferencias_alimentares : [])
                          ];
                          return preferences.length > 0 ? (
                            preferences.map((preference, i) => {
                              // Mapear códigos para nomes legíveis
                              const nomePreferencia = 
                                preference === "cetogenica" ? "Cetogênica" :
                                preference === "dash" ? "DASH" :
                                preference === "flexitariana" ? "Flexitariana" :
                                preference === "low_carb" ? "Low Carb" :
                                preference === "mediterranea" ? "Mediterrânea" :
                                preference === "paleo" ? "Paleo" :
                                preference === "sem_gluten" ? "Sem glúten" :
                                preference === "sem_lactose" ? "Sem lactose" :
                                preference === "vegana" ? "Vegana" :
                                preference === "vegetariana" ? "Vegetariana" :
                                preference;
                              
                              return (
                                <Badge key={i} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  {nomePreferencia}
                                </Badge>
                              );
                            })
                          ) : (
                            <p className="text-sm text-gray-500">Nenhuma informada</p>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Restrições Alimentares */}
                    {anamneseData?.restricoes_alimentares && anamneseData.restricoes_alimentares.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Restrições Alimentares
                        </label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {anamneseData.restricoes_alimentares.map((restricao: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                              {restricao}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Observações Adicionais */}
                  {anamneseData?.observacoes_adicionais && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-[#1E1D40] border-b border-gray-200 pb-2">Observações Adicionais</h3>
                      <div>
                        <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Informações Complementares
                        </label>
                        <p className="text-[#1E1D40] font-semibold mt-1 bg-gray-50 p-3 rounded-lg">{anamneseData.observacoes_adicionais}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Configurações de Notificação */}
                  <div className="pt-4 border-t">
                    <label className="text-sm font-medium text-gray-600 mb-3 block">Configurações de Notificação</label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="email-notifications"
                          checked={profile?.email_notifications_enabled ?? true}
                          onCheckedChange={(checked) =>
                            setProfile((prev) => (prev ? { ...prev, email_notifications_enabled: checked } : null))
                          }
                        />
                        <label htmlFor="email-notifications" className="text-sm text-gray-700">
                          Receber notificações por e-mail
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="in-app-notifications"
                          checked={profile?.in_app_notifications_enabled ?? true}
                          onCheckedChange={(checked) =>
                            setProfile((prev) => (prev ? { ...prev, in_app_notifications_enabled: checked } : null))
                          }
                        />
                        <label htmlFor="in-app-notifications" className="text-sm text-gray-700">
                          Receber notificações no aplicativo
                        </label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>


            </div>
          </div>
        )}

        {/* Conteúdo padrão para outras abas */}
        {![
          "overview",
          "buscar",
          "iris",
          "notificacoes",
          "perfil",
          "chat",
          "duvidas",
        ].includes(activeTab) && (
          <div className="space-y-8">
            <div className="text-center space-y-6 py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                <Bot className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-[#1E1D40] mb-2 capitalize">{activeTab}</h2>
                <p className="text-gray-600 text-lg">Esta funcionalidade será implementada em breve.</p>
              </div>
              <Button
                variant="outline"
                className="hover-lift bg-white/80 backdrop-blur-sm border-gray-200"
                onClick={() => setActiveTab("overview")}
              >
                Voltar ao início
              </Button>
            </div>
          </div>
        )}
      </div>

      {profile && (
        <UserProfileModal
          open={isProfileModalOpen}
          onOpenChange={setIsProfileModalOpen}
          userType="paciente"
          initialData={profile}
          onProfileUpdate={loadProfile}
          userId={profile.user_id}
        />
      )}

      {/* Modal de Anamnese Nutricional */}
      {profile && (
        <AnamneseNutricionalModal
          open={isAnamneseModalOpen}
          onOpenChange={setIsAnamneseModalOpen}
          patientId={profile.user_id}
          onComplete={async (data) => {
            setIsAnamneseModalOpen(false)
            // Atualizar dados da anamnese imediatamente
            setAnamneseData(data)
            // Recarregar perfil para garantir sincronização
            await loadProfile()
          }}
        />
      )}

      {/* Modal de Avaliação */}
      {selectedConsultationForRating && (
        <RatingModal
          open={isRatingModalOpen}
          onOpenChange={setIsRatingModalOpen}
          consultationId={selectedConsultationForRating.id}
          nutritionistName={selectedConsultationForRating.nutritionist_profiles?.full_name || "Nutricionista"}
          onSubmit={handleRatingSubmit}
        />
      )}
    </DashboardSidebar>
  )
}

