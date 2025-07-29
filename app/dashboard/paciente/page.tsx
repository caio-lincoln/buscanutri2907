"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MapPin, Star, Calendar, Filter, Settings, User, Video, Shield, Heart, Activity, Users, ArrowRight, Zap, Target, Grid3X3, List, BookOpen } from 'lucide-react'
import { getCurrentUser, getUserProfile, signOut } from "@/lib/auth"
import type { PatientProfile } from "@/lib/supabase"
import { NotificationsPanel, type Notification } from "@/components/notifications-panel"
import { DashboardSidebar, getMenuItems as getDashboardMenuItems } from "@/components/dashboard-sidebar"
import { IrisChat } from "@/components/iris-chat"
import { StatsCard } from "@/components/stats-card"
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
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { PatientForumTab } from "@/components/patient-forum-tab"
import { PatientTelemedicineTab } from "@/components/dashboard/paciente/telemedicine-tab" // Importar a nova aba de telemedicina
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
    image: nutritionist.profile_image_url,
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
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState("overview")
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const router = useRouter()

  // Estados para a aba "Buscar Nutricionistas"
  const [searchNutritionistTerm, setSearchNutritionistTerm] = useState("")
  const [selectedNutritionistSpecialty, setSelectedNutritionistSpecialty] = useState("Todas")
  const [selectedNutritionistState, setSelectedNutritionistState] = useState("Todas")
  const [selectedNutritionistPriceRange, setSelectedNutritionistPriceRange] = useState(priceRanges[0])
  const [onlineOnlyNutritionist, setOnlineOnlyNutritionist] = useState(false)
  const [showVerifiedOnlyNutritionist, setShowVerifiedOnlyNutritionist] = useState(false)
  const [sortByNutritionist, setSortByNutritionist] = useState("rating")
  const [viewModeNutritionist, setViewModeNutritionist] = useState<"grid" | "list">("grid")
  const [nutritionists, setNutritionists] = useState<NutritionistProfile[]>([])
  const [loadingNutritionists, setLoadingNutritionists] = useState(false)
  const [availableSpecialties, setAvailableSpecialties] = useState<Specialty[]>([])
  const [availableLocations, setAvailableLocations] = useState<string[]>([])
  const [favoritedNutritionists, setFavoritedNutritionists] = useState<Set<string>>(new Set())

  const upcomingConsultations = consultations
    .filter((c) => c.status === "scheduled" && c.start_time && parseISO(c.start_time) > new Date())
    .slice(0, 3)

  const menuItems = getDashboardMenuItems(
    "paciente",
    consultations.filter((c) => c.status === "scheduled" && c.start_time && parseISO(c.start_time) > new Date()),
  )

  useEffect(() => {
    loadProfile()
    loadNotifications()
  }, [])

  useEffect(() => {
    if (activeTab === "buscar") {
      loadNutritionists()
      loadAvailableSpecialties()
      loadAvailableLocations()
    }
  }, [
    activeTab,
    searchNutritionistTerm,
    selectedNutritionistSpecialty,
    selectedNutritionistState,
    selectedNutritionistPriceRange,
    onlineOnlyNutritionist,
    showVerifiedOnlyNutritionist,
    sortByNutritionist,
  ])

  const loadProfile = async () => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push("/login")
        return
      }

      const { data: profileData } = await getUserProfile(user.id, "paciente")
      setProfile(profileData)

      // Carregar dados de telemedicina aqui para o overview e para passar para a aba de telemedicina
      await loadTelemedicineData(user.id)
    } catch (error) {
      console.error("Error loading profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadTelemedicineData = async (userId: string) => {
    try {
      console.log("Carregando dados reais do paciente:", userId)
      
      const [consultationsData, favoritesData, statsData, chatData, forumData, patientForumData] = await Promise.all([
        getPatientConsultations(userId),
        getPatientFavoriteNutritionists(userId),
        getPatientStats(userId),
        getPatientChatConversations(userId),
        getForumQuestions(),
        getPatientForumQuestions(userId),
      ])

      console.log("Dados carregados:", {
        consultations: consultationsData.length,
        favorites: favoritesData.length,
        stats: statsData,
        chats: chatData.length,
        forum: forumData.length,
        patientForum: patientForumData.length
      })

      setConsultations(consultationsData)
      setFavoriteNutritionists(favoritesData)
      // Atualizar o conjunto de nutricionistas favoritados
      const favoriteIds = new Set(favoritesData.map(fav => fav.nutritionist_id))
      setFavoritedNutritionists(favoriteIds)
      setStats({
        totalConsultations: statsData.totalConsultations || 0,
        scheduledConsultations: statsData.scheduledConsultations || 0,
        completedConsultations: statsData.completedConsultations || 0,
        favoriteNutritionists: statsData.favoriteNutritionists || 0,
        averageRating: Number(statsData.averageRating) || 0,
      })
      setChatConversations(chatData)
      setForumQuestions(forumData)
      setPatientForumQuestions(patientForumData)
    } catch (err) {
      console.error("Erro ao carregar dados de telemedicina:", err)
      // Fallback para dados padrão em caso de erro
      setStats({
        totalConsultations: 0,
        scheduledConsultations: 0,
        completedConsultations: 0,
        favoriteNutritionists: 0,
        averageRating: 0,
      })
    }
  }

  // Funções para a aba "Buscar Nutricionistas"
  const loadNutritionists = async () => {
    try {
      setLoadingNutritionists(true)

      let query = supabase.from("nutritionist_profiles").select(`
        id,
        user_id,
        full_name,
        bio,
        location,
        profile_image_url,
        crn,
        rating,
        total_reviews,
        experience_years,
        is_verified,
        nutritionist_services (*),
        nutritionist_specialties (
          specialties (
            id,
            name
          )
        )
      `)

      if (searchNutritionistTerm) {
        query = query.or(`full_name.ilike.%${searchNutritionistTerm}%,bio.ilike.%${searchNutritionistTerm}%`)
      }

      if (selectedNutritionistState !== "Todas") {
        query = query.ilike("location", `%${selectedNutritionistState}%`)
      }

      if (onlineOnlyNutritionist) {
        // Assumindo que nutritionist_services tem online_available
        query = query.in(
          "id",
          supabase.from("nutritionist_services").select("nutritionist_id").eq("online_available", true),
        )
      }

      if (showVerifiedOnlyNutritionist) {
        query = query.eq("is_verified", true)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error loading nutritionists:", error)
        throw error
      }

      let filteredData: NutritionistProfile[] = data || []

      // Filtrar nutricionistas com IDs válidos
      filteredData = filteredData.filter((nutritionist) => {
        if (!nutritionist.id || nutritionist.id === 'null' || nutritionist.id === 'undefined') {
          console.warn('Nutricionista com ID inválido encontrado:', nutritionist)
          return false
        }
        return true
      })

      if (selectedNutritionistSpecialty !== "Todas") {
        filteredData = filteredData.filter((nutritionist) =>
          nutritionist.nutritionist_specialties?.some(
            (spec) => spec.specialties?.name === selectedNutritionistSpecialty,
          ),
        )
      }

      // Filtrar por preço
      filteredData = filteredData.filter((nutritionist) => {
        const minPrice = getMinPrice(nutritionist.nutritionist_services)
        if (minPrice === null) return false // Se não tiver serviços, não mostra
        return minPrice >= selectedNutritionistPriceRange.min && minPrice <= selectedNutritionistPriceRange.max
      })

      // Ordenar
      filteredData.sort((a, b) => {
        switch (sortByNutritionist) {
          case "rating":
            return (b.rating || 0) - (a.rating || 0)
          case "price-low":
            return (getMinPrice(a.nutritionist_services) || 0) - (getMinPrice(b.nutritionist_services) || 0)
          case "price-high":
            return (getMinPrice(b.nutritionist_services) || 0) - (getMinPrice(a.nutritionist_services) || 0)
          case "name":
            return a.full_name.localeCompare(b.full_name)
          case "experience":
            return (b.experience_years || 0) - (a.experience_years || 0)
          default:
            return 0
        }
      })

      setNutritionists(filteredData)
    } catch (error) {
      console.error("Error loading nutritionists:", error)
    } finally {
      setLoadingNutritionists(false)
    }
  }

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
  const loadNotifications = async () => {
    const mockNotifications: Notification[] = [
      {
        id: "1",
        type: "appointment",
        title: "Lembrete de consulta",
        description: "Sua consulta com Dra. Maria Silva está agendada para amanhã às 14:00.",
        time: "12 horas atrás",
        read: false,
        actionUrl: "/consultas",
        sender: {
          name: "Dra. Maria Silva",
          role: "Nutricionista",
        },
        priority: "high",
      },
      {
        id: "2",
        type: "message",
        title: "Nova mensagem recebida",
        description: "Você recebeu uma nova mensagem no chat.",
        time: "3 horas atrás",
        read: false,
        actionUrl: "/chat",
        sender: {
          name: "Dra. Maria Silva",
          role: "Nutricionista",
        },
        priority: "medium",
      },
    ]

    setNotifications(mockNotifications)
  }

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: !notification.read } : notification,
      ),
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  const handleClearAll = () => {
    setNotifications([])
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
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

  if (loading) {
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
                        Olá, {profile?.full_name ? (profile.full_name.split(" ")[0] || "Paciente") : "Paciente"}! 👋
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
                value={stats.averageRating.toFixed(1)}
                icon={Star}
                color="yellow"
                trend={{ value: 15, isPositive: true }}
                description="Suas avaliações"
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

                <Card
                  className="group hover-lift cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-xl bg-gradient-to-br from-green-50 to-green-100/50 backdrop-blur-sm"
                  onClick={() => setActiveTab("telemedicina")} // Redireciona para a aba de telemedicina
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Calendar className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-[#1E1D40] mb-2 text-lg">Minhas Consultas</h3>
                    <p className="text-sm text-gray-600 mb-4">Gerencie seus agendamentos online</p>
                    <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                      Ver Consultas <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="group hover-lift cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-xl bg-gradient-to-br from-purple-50 to-purple-100/50 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Zap className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-[#1E1D40] mb-2 text-lg">Chat com Iris</h3>
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
                              nutritionist.nutritionist_profiles.profile_image_url ||
                              `/placeholder.svg?height=48&width=48&query=${nutritionist.nutritionist_profiles.full_name || "nutritionist profile"}`
                            }
                          />
                          <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold">
                            {nutritionist.nutritionist_profiles.full_name
                              ? (nutritionist.nutritionist_profiles.full_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("") || "N")
                              : "N"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#1E1D40]">{nutritionist.nutritionist_profiles.full_name}</p>
                          <p className="text-sm text-gray-600">
                            {nutritionist.nutritionist_profiles.specialties.join(", ")}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">{nutritionist.nutritionist_profiles.rating}</span>
                            <span className="text-sm text-gray-500">
                              ({nutritionist.nutritionist_profiles.total_reviews} avaliações)
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

            {/* Results */}
            {!loadingNutritionists && (
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
                                    nutritionist.profile_image_url ||
                                    `/placeholder.svg?height=48&width=48&query=${nutritionist.full_name || "nutritionist profile"}`
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
                                    {((getSpecialtiesText(nutritionist) || "Nutrição Geral")
                                      .split(", ") || ["Nutrição Geral"])
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
                    <div className="text-6xl mb-4">🔍</div>
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

        {/* Telemedicina (nova aba dedicada) */}
        {activeTab === "telemedicina" && (
          <div className="space-y-8">
            <div className="text-center space-y-6 py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                <Settings className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-[#1E1D40] mb-2">Minhas Consultas</h2>
                <p className="text-gray-600 text-lg">Esta funcionalidade está em desenvolvimento e no momento não está disponível.</p>
                <p className="text-gray-500 text-sm mt-2">Em breve você poderá agendar e gerenciar suas consultas aqui.</p>
              </div>
              <Button
                variant="outline"
                className="hover-lift bg-white/80 backdrop-blur-sm border-gray-200"
                onClick={() => setActiveTab("buscar")}
              >
                Buscar Nutricionistas
              </Button>
            </div>
          </div>
        )}

        {/* Iris Chat */}
        {activeTab === "iris" && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                <Zap className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">Chat com Iris</h1>
                <p className="text-gray-600 text-lg">Sua assistente virtual de nutrição inteligente</p>
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
            <NotificationsPanel
              notifications={notifications}
              userType="paciente"
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onDelete={handleDelete}
              onClearAll={handleClearAll}
            />
          </div>
        )}

        {/* Perfil */}
        {activeTab === "perfil" && (
          <div className="space-y-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">Meu Perfil</h1>
                <p className="text-gray-600">Gerencie suas informações pessoais e preferências</p>
              </div>
              <Button
                variant="outline"
                className="hover-lift bg-white/80 backdrop-blur-sm border-gray-200"
                onClick={() => setIsProfileModalOpen(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Editar Perfil
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nome Completo</label>
                    <p className="text-[#1E1D40] font-semibold text-lg">{profile?.full_name || "Não informado"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Data de Nascimento</label>
                    <p className="text-[#1E1D40] font-semibold">{profile?.birth_date || "Não informado"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Telefone</label>
                    <p className="text-[#1E1D40] font-semibold">{profile?.phone || "Não informado"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">CPF</label>
                    <p className="text-[#1E1D40] font-semibold">{profile?.cpf || "Não informado"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">RG</label>
                    <p className="text-[#1E1D40] font-semibold">{profile?.rg || "Não informado"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                      <Heart className="h-4 w-4 text-white" />
                    </div>
                    <span>Informações de Saúde</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Condições de Saúde</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Array.isArray(profile?.health_conditions) && profile.health_conditions.length > 0 ? (
                        profile.health_conditions.map((condition, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                            {condition}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">Nenhuma informada</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Alergias</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Array.isArray(profile?.allergies) && profile.allergies.length > 0 ? (
                        profile.allergies.map((allergy, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                          >
                            {allergy}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">Nenhuma informoada</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Preferências Alimentares</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Array.isArray(profile?.dietary_preferences) && profile.dietary_preferences.length > 0 ? (
                        profile.dietary_preferences.map((preference, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {preference}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">Nenhuma informada</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                      <Settings className="h-4 w-4 text-white" />
                    </div>
                    <span>Preferências</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Notificações por E-mail</label>
                    <div className="flex items-center space-x-2 mt-2">
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
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Notificações no Aplicativo</label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Checkbox
                        id="in-app-notifications"
                        checked={profile?.in_app_notifications_enabled ?? true}
                        onCheckedChange={(checked) =>
                          setProfile((prev) => (prev ? { ...prev, in_app_notifications_enabled: checked } : null))
                        }
                      />
                      <label htmlFor="in-app-notifications" className="text-sm text-gray-700">
                        Receber notificações dentro do aplicativo
                      </label>
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
          "telemedicina", // Agora é a aba principal de consultas
          "iris",
          "notificacoes",
          "perfil",
          "chat",
          "duvidas",
          "configuracoes",
        ].includes(activeTab) && (
          <div className="space-y-8">
            <div className="text-center space-y-6 py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                <Settings className="h-10 w-10 text-white" />
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
          initialProfileData={profile}
          onProfileUpdate={loadProfile}
          userId={profile.user_id}
        />
      )}
    </DashboardSidebar>
  )
}
