'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Calendar,
  Users,
  MessageSquare,
  Briefcase,
  BookOpen,
  User,
  Settings,
  ArrowRight,
  Star,
  MapPin,
  Target,
  Heart,

  Bot,
  Activity,
  ExternalLink,
} from 'lucide-react'

import { useAuth } from '@/contexts/auth-context'
import { NotificationsPanel } from '@/components/notifications-panel'
import { DashboardSidebar, getMenuItems } from '@/components/dashboard-sidebar'
import { IrisChat } from '@/components/iris-chat'
import { StatsCard } from '@/components/stats-card'
import { UserProfileModal } from '@/components/user-profile-modal'
import { RatingDisplay } from '@/components/ui/rating-display'
// Importar os novos componentes das abas
import { ReportsTab } from '@/components/dashboard/nutricionistas/reports-tab'
import { CoursesTab } from '@/components/dashboard/nutricionistas/courses-tab'
import { JobsTab } from '@/components/dashboard/nutricionistas/jobs-tab'
import { ForumTab } from '@/components/dashboard/nutricionistas/forum-tab'
import { BlogTab } from '@/components/dashboard/nutricionistas/blog-tab'
import { ApplicationsTab } from '@/components/dashboard/nutricionistas/applications-tab'

import { AppointmentsTab } from '@/components/dashboard/nutricionistas/appointments-tab' // Importar a nova aba de agenda
import NutritionistRecentChatsList from '@/components/nutritionist-recent-chats-list'
// Importar o serviço de dados do nutricionista
import {
  getNutritionistStats,
  getUpcomingAppointments,
  type NutritionistStats,
  type ScheduledAppointment,
} from '@/lib/nutritionist-data-service'
// Importar o hook de estatísticas do dashboard
import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import { useRealtimeProfileViews } from '@/hooks/use-realtime-profile-views'
import { RealtimeViewsTest } from '@/components/realtime-views-test'
import NutricionistaTeleconsultasPage from './teleconsultas/page'
import { ConnectStripeCard } from '../../../components/ConnectStripeCard'
import SubscriptionCard from '../../../components/SubscriptionCard'
import { useSearchParams } from 'next/navigation'

export default function NutritionistDashboard() {
  const [ loading, setLoading ] = useState(true)
  const [ activeTab, setActiveTab ] = useState('overview')
  const [ isProfileModalOpen, setIsProfileModalOpen ] = useState(false)

  const [ stats, setStats ] = useState<NutritionistStats>({
    activePatients: 0,
    scheduledAppointments: 0,
    unreadMessages: 0,
    totalConsultations: 0,
  })
  const [ upcomingAppointments, setUpcomingAppointments ] = useState<
    ScheduledAppointment[]
  >([])
  const router = useRouter()
  const { user, nutritionistProfile, patientProfile, loading: authLoading, signOut, refreshUser } = useAuth()

  // Hook para estatísticas dinâmicas do dashboard
  const { stats: dashboardStats } = useDashboardStats({
    userType: 'nutricionista',
    userId: nutritionistProfile?.user_id || '',
    enabled: !!nutritionistProfile?.user_id,
  })

  // Hook para visualizações em tempo real
  const { viewStats } = useRealtimeProfileViews(nutritionistProfile?.id || '', {
    totalViews: nutritionistProfile?.totalViews || 0,
    uniqueViews: nutritionistProfile?.uniqueViews || 0,
    lastViewAt: nutritionistProfile?.lastViewAt || null,
  })

  const menuItems = getMenuItems('nutricionista', dashboardStats)

  // const searchParams = useSearchParams()
  // const activeTabParam = searchParams.get('activeTab')

  // useEffect(() => {
  //   if (activeTabParam) {
  //     setActiveTab(activeTabParam)
  //   }
  // }, [ activeTabParam ])

  useEffect(() => {
    if ((!authLoading && !user) || user?.user_metadata[ 'user_type' ] !== 'nutricionista') {
      router.push('/login')
      return
    }

    if (nutritionistProfile?.user_id) {
      loadDashboardData()
      setLoading(false)
    }
  }, [ user, authLoading, nutritionistProfile?.user_id ])

  // Remover a função loadProfile pois agora usamos o perfil do contexto

  const loadDashboardData = async () => {
    if (!nutritionistProfile?.user_id) return

    try {
      // Carregar estatísticas
      const statsData = await getNutritionistStats(nutritionistProfile.user_id)
      setStats(statsData)

      // Carregar próximas consultas
      const appointmentsData = await getUpcomingAppointments(nutritionistProfile.user_id, 5)
      setUpcomingAppointments(appointmentsData)
    } catch (error) {
      // Error loading dashboard data - handled silently
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      // Error signing out - handled silently
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-500 mx-auto"></div>
          <p className="text-[#1E1D40]/70 font-medium">
            Carregando seu dashboard...
          </p>
        </div>
      </div>
    )
  }

  const handleItemClick = (itemId: string) => {
    if (itemId === 'perfil' && nutritionistProfile?.id) {
      router.push(`/dashboard/nutricionistas/${nutritionistProfile.id}`)
    } else {
      setActiveTab(itemId)
    }
  }

  return (
    <DashboardSidebar
      userType="nutricionista"
      userName={nutritionistProfile?.full_name || 'Nutricionista'}
      userAvatar={nutritionistProfile?.profile_image_url || '/placeholder.svg'}
      menuItems={menuItems}
      activeItem={activeTab}
      onItemClick={handleItemClick}
      onSignOut={handleSignOut}
    >
      <div className="space-y-8">
        {/* Overview Dashboard */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 rounded-3xl p-8 text-white shadow-2xl">
              <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=800')] opacity-10"></div>
              <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <Heart className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-bold">
                        Olá, Dr(a).{' '}
                        {nutritionistProfile?.full_name?.split(' ')[ 0 ] || 'Nutricionista'}!
                        👋
                      </h1>
                      <p className="text-blue-100 text-lg mt-1">
                        Como está sua prática hoje?
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                      <p className="text-sm text-blue-100">
                        Consultas agendadas
                      </p>
                      <p className="font-semibold">
                        {stats.scheduledAppointments} próximas
                      </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                      <p className="text-sm text-blue-100">Avaliação média</p>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {nutritionistProfile?.rating?.toFixed(1) || '5.0'}
                        </span>
                        <RatingDisplay
                          rating={nutritionistProfile?.rating || 5.0}
                          totalReviews={nutritionistProfile?.total_reviews || 0}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <StatsCard
                title="Pacientes Ativos"
                value={stats.activePatients.toString()}
                icon={Users}
                color="blue"
                description="Pacientes com conversas ativas"
              />
              <StatsCard
                title="Consultas Agendadas"
                value={stats.scheduledAppointments.toString()}
                icon={Calendar}
                color="green"
                description="Próximas consultas"
              />
              <StatsCard
                title="Mensagens Não Lidas"
                value={stats.unreadMessages.toString()}
                icon={MessageSquare}
                color="orange"
                description="Aguardando resposta"
              />
              <StatsCard
                title="Total de Consultas"
                value={stats.totalConsultations.toString()}
                icon={Star}
                color="yellow"
                description="Consultas realizadas"
              />
            </div>

            {/* Quick Actions */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#1E1D40]">
                  Ações Rápidas
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => router.push('/dashboard/nutricionistas/notificacoes')}
                >
                  Ver todas <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <Card
                  className="group hover-lift cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-xl bg-gradient-to-br from-blue-50 to-blue-100/50 backdrop-blur-sm h-full"
                  onClick={() => setActiveTab('agenda')}
                >
                  <CardContent className="p-6 text-center flex flex-col h-full">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Calendar className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-[#1E1D40] mb-2 text-lg">
                      Gerenciar Agenda
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 flex-grow">
                      Visualize e organize seus horários
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 mt-auto"
                    >
                      Abrir agenda <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>

                <Card
                  className="group hover-lift cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-xl bg-gradient-to-br from-green-50 to-green-100/50 backdrop-blur-sm h-full"
                  onClick={() => setActiveTab('agenda')}
                >
                  <CardContent className="p-6 text-center flex flex-col h-full">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Users className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-[#1E1D40] mb-2 text-lg">
                      Meus Pacientes
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 flex-grow">
                      Acompanhe o progresso dos pacientes
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 mt-auto"
                    >
                      Ver pacientes <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>

                <Card
                  className="group hover-lift cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-xl bg-gradient-to-br from-purple-50 to-purple-100/50 backdrop-blur-sm h-full"
                  onClick={() => setActiveTab('vagas')}
                >
                  <CardContent className="p-6 text-center flex flex-col h-full">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Briefcase className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-[#1E1D40] mb-2 text-lg">
                      Oportunidades
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 flex-grow">
                      Explore vagas disponíveis
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 mt-auto"
                    >
                      Ver vagas <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>

                <Card
                  className="group hover-lift cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-xl bg-gradient-to-br from-orange-50 to-orange-100/50 backdrop-blur-sm h-full"
                  onClick={() => setActiveTab('cursos')}
                >
                  <CardContent className="p-6 text-center flex flex-col h-full">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <BookOpen className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-[#1E1D40] mb-2 text-lg">
                      Cursos & Educação
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 flex-grow">
                      Continue sua formação
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 mt-auto"
                    >
                      Explorar <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Recent Chats & Próximas Consultas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
              {/* Recent Chats */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#1E1D40]">
                    Conversas Recentes
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => router.push('/dashboard/nutricionistas/conversas')}
                  >
                    Ver todas <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                <Card className="border-0 shadow-lg backdrop-blur-sm">
                  <CardContent className="p-6">
                    {nutritionistProfile?.user_id && (
                      <NutritionistRecentChatsList userId={nutritionistProfile.user_id} />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Próximas Consultas */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#1E1D40]">
                    Próximas Consultas
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => router.push('/dashboard/nutricionistas/consultas')}
                  >
                    Ver agenda completa <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                <Card className="border-0 shadow-lg backdrop-blur-sm">
                  <CardContent className="p-6">
                    {upcomingAppointments.length > 0 ? (
                      <div className="space-y-4">
                        {upcomingAppointments.map((appointment, i) => (
                          <div
                            key={i}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50/50 to-blue-100/30 hover:shadow-md transition-all duration-300 group gap-4"
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
                                {appointment.time}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-[#1E1D40] truncate">
                                  {appointment.patientName}
                                </p>
                                <p className="text-sm text-gray-600 truncate">
                                  {appointment.type}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {appointment.date}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge
                                variant="outline"
                                className={
                                  appointment.status === 'confirmed'
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                }
                              >
                                {appointment.status === 'confirmed'
                                  ? 'Confirmado'
                                  : 'Agendado'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg font-medium">
                          Nenhuma consulta agendada
                        </p>
                        <p className="text-gray-400 text-sm mb-4">
                          Suas próximas consultas aparecerão aqui
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => setActiveTab('agenda')}
                          className="hover-lift"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Ver agenda
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Today's Schedule & Recent Activity (Removido para a aba de Agenda) */}
            {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-0 shadow-lg backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <span>Agenda de Hoje</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { patient: "Maria Silva", time: "09:00", type: "Primeira consulta", status: "confirmed" },
                    { patient: "João Santos", time: "10:30", type: "Retorno", status: "confirmed" },
                    { patient: "Ana Costa", time: "14:00", type: "Online", status: "pending" },
                    { patient: "Carlos Lima", time: "15:30", type: "Retorno", status: "confirmed" },
                  ].map((appointment, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50/50 to-blue-100/30 hover:shadow-md transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-105 transition-transform duration-300">
                          {appointment.time}
                        </div>
                        <div>
                          <p className="font-semibold text-[#1E1D40]">{appointment.patient}</p>
                          <p className="text-sm text-gray-600">{appointment.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            appointment.status === "confirmed"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-yellow-50 text-yellow-700 border-yellow-200"
                          }
                        >
                          {appointment.status === "confirmed" ? "Confirmado" : "Pendente"}
                        </Badge>
                        <Button variant="ghost" size="sm" className="hover:bg-blue-100">
                          <Video className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button variant="ghost" className="w-full mt-4 text-gray-600 hover:text-gray-800">
                    Ver agenda completa <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <Activity className="h-4 w-4 text-white" />
                    </div>
                    <span>Atividade Recente</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      icon: Users,
                      title: "Novo paciente",
                      desc: "Maria Silva se cadastrou",
                      time: "2h",
                      color: "green",
                    },
                    {
                      icon: Star,
                      title: "Nova avaliação",
                      desc: "João Santos avaliou com 5 estrelas",
                      time: "4h",
                      color: "yellow",
                    },
                    {
                      icon: MessageSquare,
                      title: "Mensagem recebida",
                      desc: "Ana Costa enviou uma pergunta",
                      time: "6h",
                      color: "blue",
                    },
                    {
                      icon: Calendar,
                      title: "Consulta reagendada",
                      desc: "Carlos Lima alterou horário",
                      time: "1d",
                      color: "orange",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors duration-200 group"
                    >
                      <div
                        className={`w-10 h-10 bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200`}
                      >
                        <item.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#1E1D40] text-sm">{item.title}</p>
                        <p className="text-sm text-gray-600 truncate">{item.desc}</p>
                      </div>
                      <span className="text-xs text-gray-500 font-medium">{item.time}</span>
                    </div>
                  ))}

                  <Button variant="ghost" className="w-full mt-4 text-gray-600 hover:text-gray-800">
                    Ver todas as atividades <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </div> */}
          </div>
        )}

        {/* Agenda (Nova aba dedicada) */}
        {activeTab === 'agenda' && nutritionistProfile?.user_id && (
          <AppointmentsTab userId={nutritionistProfile.user_id} />
        )}

        {/* Relatórios */}
        {activeTab === 'relatorios' && <ReportsTab />}

        {/* Cursos */}
        {activeTab === 'cursos' && <CoursesTab />}

        {/* Vagas */}
        {activeTab === 'vagas' && <JobsTab />}

        {/* Candidaturas */}
        {activeTab === 'candidaturas' && <ApplicationsTab />}

        {/* Blog */}
        {activeTab === 'blog' && <BlogTab />}

        {/* Fórum */}
        {activeTab === 'forum' && <ForumTab />}

        {/* Iris Chat */}
        {activeTab === 'iris' && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                <Bot className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">
                  Chat com IrisBot
                </h1>
                <p className="text-gray-600 text-lg">
                  Sua assistente virtual para nutricionistas
                </p>
              </div>
            </div>

            <Card className="border-0 shadow-2xl backdrop-blur-sm">
              <IrisChat userType="nutricionista" />
            </Card>
          </div>
        )}

        {/* Notificações */}
        {activeTab === 'notificacoes' && (
          <div className="space-y-8">
            <NotificationsPanel userType="nutricionista" />
          </div>
        )}
        {activeTab === 'assinatura' && (
          <SubscriptionCard />
        )}

        {/* Perfil */}
        {activeTab === 'perfil' && (
          <div className="space-y-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">
                  Meu Perfil
                </h1>
                <p className="text-gray-600">
                  Gerencie suas informações profissionais
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Botão "Ver meu perfil público" - só aparece se o ID existir */}
                {nutritionistProfile?.id ? (
                  <Button
                    variant="outline"
                    className="hover-lift bg-white/80 backdrop-blur-sm border-gray-200"
                    onClick={() => {
                      const profileUrl = `/nutricionistas/${nutritionistProfile.id}`
                      window.open(profileUrl, '_blank')
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver meu perfil público
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="hover-lift bg-white/80 backdrop-blur-sm border-gray-200 opacity-50 cursor-not-allowed"
                    disabled
                    title="Complete seu perfil para visualizar a página pública"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Perfil não disponível
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="hover-lift bg-white/80 backdrop-blur-sm border-gray-200"
                  onClick={() => setIsProfileModalOpen(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Editar Perfil
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              <Card className="border-0 shadow-lg backdrop-blur-sm h-fit">
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
                          nutritionistProfile?.profile_image_url ||
                          `/placeholder.svg?height=80&width=80&query=${nutritionistProfile?.full_name || '/placeholder.svg'}`
                        }
                      />
                      <AvatarFallback className="bg-gray-200 text-gray-600 text-xl font-semibold">
                        {nutritionistProfile?.full_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Nome Completo
                    </label>
                    <p className="text-[#1E1D40] font-semibold text-lg">
                      {nutritionistProfile?.full_name || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      CRN
                    </label>
                    <p className="text-[#1E1D40] font-semibold">
                      {nutritionistProfile?.crn || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Telefone
                    </label>
                    <p className="text-[#1E1D40] font-semibold">
                      {nutritionistProfile?.phone || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      CPF
                    </label>
                    <p className="text-[#1E1D40] font-semibold">
                      Não informado
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      RG
                    </label>
                    <p className="text-[#1E1D40] font-semibold">
                      Não informado
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Gênero
                    </label>
                    <p className="text-[#1E1D40] font-semibold">
                      Não informado
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Data de Nascimento
                    </label>
                    <p className="text-[#1E1D40] font-semibold">
                      Não informado
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Biografia
                    </label>
                    <p className="text-[#1E1D40] font-semibold text-sm mt-1">
                      {nutritionistProfile?.bio || 'Não informado'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Informações Profissionais */}
              <Card className="border-0 shadow-lg backdrop-blur-sm h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <Star className="h-4 w-4 text-white" />
                    </div>
                    <span>Informações Profissionais</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Formação Acadêmica
                    </label>
                    <p className="text-[#1E1D40] font-semibold text-sm mt-1">
                      Não informado
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Experiência Profissional
                    </label>
                    <p className="text-[#1E1D40] font-semibold text-sm mt-1">
                      Não informado
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Anos de Experiência
                    </label>
                    <p className="text-[#1E1D40] font-semibold">
                      {nutritionistProfile?.experience_years || 0} anos
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Especialidades
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2 min-h-[2rem]">
                      {(() => {
                        if (!nutritionistProfile?.specialties) {
                          return (
                            <p className="text-sm text-gray-500">
                              Nenhuma informada
                            </p>
                          )
                        }

                        const processSpecialties = (data: any): string[] => {
                          if (!data) return []

                          // Se já é um array, retorna diretamente
                          if (Array.isArray(data)) {
                            return data
                              .map(item => String(item).trim())
                              .filter(item => item)
                          }

                          // Se é string, processa
                          if (typeof data === 'string') {
                            let cleanString = data.trim()

                            // Remove múltiplos escapes e caracteres problemáticos
                            cleanString = cleanString
                              .replace(/\+"/g, '"') // Remove escapes múltiplos
                              .replace(/^\[+/, '') // Remove [ do início
                              .replace(/]+$/, '') // Remove ] do final
                              .replace(/^"+/, '') // Remove " do início
                              .replace(/"+$/, '') // Remove " do final

                            // Se ainda parece JSON, tenta fazer parse
                            if (
                              cleanString.startsWith('[') ||
                              cleanString.startsWith('{')
                            ) {
                              try {
                                const parsed = JSON.parse(cleanString)
                                if (Array.isArray(parsed)) {
                                  return processSpecialties(parsed) // Recursão para processar o array
                                } else if (typeof parsed === 'string') {
                                  return processSpecialties(parsed) // Recursão para processar a string
                                }
                              } catch {
                                // Se falhar, continua com processamento como string
                              }
                            }

                            // Trata como string separada por vírgulas
                            return cleanString
                              .split(',')
                              .map(s => s.trim())
                              .filter(s => s && s !== '""' && s !== "''")
                          }

                          return []
                        }

                        const specialtiesArray = processSpecialties(
                          nutritionistProfile.specialties
                        )

                        if (specialtiesArray.length === 0) {
                          return (
                            <p className="text-sm text-gray-500">
                              Nenhuma informada
                            </p>
                          )
                        }

                        return specialtiesArray.map((specialty, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {specialty}
                          </Badge>
                        ))
                      })()}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Certificações
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2 min-h-[2rem]">
                      <p className="text-sm text-gray-500">
                        Nenhuma informada
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Conquistas
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2 min-h-[2rem]">
                      <p className="text-sm text-gray-500">
                        Nenhuma informada
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Status de Verificação
                    </label>
                    <Badge
                      variant="outline"
                      className={
                        nutritionistProfile?.is_verified
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }
                    >
                      {nutritionistProfile?.is_verified ? 'Verificado' : 'Pendente'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Serviços e Atendimento */}
              <Card className="border-0 shadow-lg backdrop-blur-sm h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-white" />
                    </div>
                    <span>Serviços e Atendimento</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Preço da Consulta
                    </label>
                    <p className="text-[#1E1D40] font-semibold">
                      {nutritionistProfile?.consultation_price
                        ? `R$ ${nutritionistProfile.consultation_price.toFixed(2)}`
                        : 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Preço de Retorno
                    </label>
                    <p className="text-[#1E1D40] font-semibold">
                      {nutritionistProfile?.service_followup_price
                        ? `R$ ${nutritionistProfile.service_followup_price.toFixed(2)}`
                        : 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Preço do Plano Alimentar
                    </label>
                    <p className="text-[#1E1D40] font-semibold">
                      {nutritionistProfile?.service_meal_plan_price
                        ? `R$ ${nutritionistProfile.service_meal_plan_price.toFixed(2)}`
                        : 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Duração da Consulta
                    </label>
                    <p className="text-[#1E1D40] font-semibold">
                      {nutritionistProfile?.default_consultation_duration
                        ? `${nutritionistProfile.default_consultation_duration} minutos`
                        : 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Tempo Mínimo entre Consultas
                    </label>
                    <p className="text-[#1E1D40] font-semibold">
                      {nutritionistProfile?.min_time_between_appointments
                        ? `${nutritionistProfile.min_time_between_appointments} minutos`
                        : 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Atendimento Online
                    </label>
                    <Badge
                      variant="outline"
                      className={
                        nutritionistProfile?.service_online_available
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }
                    >
                      {nutritionistProfile?.service_online_available
                        ? 'Disponível'
                        : 'Não Disponível'}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Somente Online
                    </label>
                    <Badge
                      variant="outline"
                      className="bg-gray-50 text-gray-700 border-gray-200"
                    >
                      Não Disponível
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Visita Domiciliar
                    </label>
                    <Badge
                      variant="outline"
                      className="bg-gray-50 text-gray-700 border-gray-200"
                    >
                      Não Disponível
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Consulta em Grupo
                    </label>
                    <Badge
                      variant="outline"
                      className={
                        nutritionistProfile?.service_group_consultation
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }
                    >
                      {nutritionistProfile?.service_group_consultation
                        ? 'Disponível'
                        : 'Não Disponível'}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Aceita Convênio
                    </label>
                    <Badge
                      variant="outline"
                      className={
                        nutritionistProfile?.accepts_insurance
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }
                    >
                      {nutritionistProfile?.accepts_insurance ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Consulta de Emergência
                    </label>
                    <Badge
                      variant="outline"
                      className={
                        nutritionistProfile?.emergency_consultation
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }
                    >
                      {nutritionistProfile?.emergency_consultation
                        ? 'Disponível'
                        : 'Não Disponível'}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Aceita Cupons de Desconto
                    </label>
                    <Badge
                      variant="outline"
                      className={
                        nutritionistProfile?.aceita_cupons
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                      }
                    >
                      {nutritionistProfile?.aceita_cupons ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Localização e Contato */}
              <Card className="border-0 shadow-lg backdrop-blur-sm h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-white" />
                    </div>
                    <span>Localização e Contato</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Endereço do Consultório
                    </label>
                    <p className="text-[#1E1D40] font-semibold break-words">
                      {nutritionistProfile?.address || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Localização
                    </label>
                    <p className="text-[#1E1D40] font-semibold">
                      {nutritionistProfile?.location || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Website
                    </label>
                    <p className="text-[#1E1D40] font-semibold text-sm mt-1">
                      {nutritionistProfile?.website_url ? (
                        <a
                          href={nutritionistProfile.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {nutritionistProfile.website_url}
                        </a>
                      ) : (
                        'Não informado'
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Idiomas de Atendimento
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2 min-h-[2rem]">
                      {nutritionistProfile?.consultation_languages ? (
                        typeof nutritionistProfile.consultation_languages === 'string' ? (
                          nutritionistProfile.consultation_languages
                            .split(', ')
                            .map((lang: string, i: number) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-xs bg-gray-50 text-gray-700 border-gray-200"
                              >
                                {lang.trim()}
                              </Badge>
                            ))
                        ) : (
                          <p className="text-sm text-gray-500">
                            Nenhum informado
                          </p>
                        )
                      ) : (
                        <p className="text-sm text-gray-500">
                          Nenhum informado
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Métodos de Pagamento
                    </label>
                    <p className="text-[#1E1D40] font-semibold text-sm mt-1">
                      {nutritionistProfile?.payment_methods || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Política de Cancelamento
                    </label>
                    <p className="text-[#1E1D40] font-semibold text-sm mt-1">
                      {nutritionistProfile?.cancellation_policy || 'Não informado'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Redes Sociais */}
              <Card className="border-0 shadow-lg backdrop-blur-sm h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-white" />
                    </div>
                    <span>Redes Sociais</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Instagram
                    </label>
                    <p className="text-[#1E1D40] font-semibold text-sm mt-1">
                      {nutritionistProfile?.instagram_username ? (
                        <a
                          href={`https://instagram.com/${nutritionistProfile.instagram_username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-600 hover:underline"
                        >
                          @{nutritionistProfile.instagram_username}
                        </a>
                      ) : (
                        'Não informado'
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      LinkedIn
                    </label>
                    <p className="text-[#1E1D40] font-semibold text-sm mt-1">
                      {nutritionistProfile?.linkedin_username ? (
                        <a
                          href={`https://linkedin.com/in/${nutritionistProfile.linkedin_username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 hover:underline"
                        >
                          {nutritionistProfile.linkedin_username}
                        </a>
                      ) : (
                        'Não informado'
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Facebook
                    </label>
                    <p className="text-[#1E1D40] font-semibold text-sm mt-1">
                      {nutritionistProfile?.facebook_username ? (
                        <a
                          href={`https://facebook.com/${nutritionistProfile.facebook_username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {nutritionistProfile.facebook_username}
                        </a>
                      ) : (
                        'Não informado'
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      YouTube
                    </label>
                    <p className="text-[#1E1D40] font-semibold text-sm mt-1">
                      {nutritionistProfile?.youtube_channel ? (
                        <a
                          href={nutritionistProfile.youtube_channel}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-600 hover:underline"
                        >
                          {nutritionistProfile.youtube_channel}
                        </a>
                      ) : (
                        'Não informado'
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      TikTok
                    </label>
                    <p className="text-[#1E1D40] font-semibold text-sm mt-1">
                      {nutritionistProfile?.tiktok_username ? (
                        <a
                          href={`https://tiktok.com/@${nutritionistProfile.tiktok_username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-black hover:underline"
                        >
                          @{nutritionistProfile.tiktok_username}
                        </a>
                      ) : (
                        'Não informado'
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Horários de Funcionamento */}
              <Card className="border-0 shadow-lg backdrop-blur-sm h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <span>Horários de Funcionamento</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">
                        Segunda:
                      </span>
                      <p className="text-[#1E1D40]">
                        {nutritionistProfile?.monday_hours || 'Não informado'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Terça:</span>
                      <p className="text-[#1E1D40]">
                        {nutritionistProfile?.tuesday_hours || 'Não informado'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Quarta:</span>
                      <p className="text-[#1E1D40]">
                        {nutritionistProfile?.wednesday_hours || 'Não informado'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Quinta:</span>
                      <p className="text-[#1E1D40]">
                        {nutritionistProfile?.thursday_hours || 'Não informado'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Sexta:</span>
                      <p className="text-[#1E1D40]">
                        {nutritionistProfile?.friday_hours || 'Não informado'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Sábado:</span>
                      <p className="text-[#1E1D40]">
                        {nutritionistProfile?.saturday_hours || 'Não informado'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-gray-600">
                        Domingo:
                      </span>
                      <p className="text-[#1E1D40]">
                        {nutritionistProfile?.sunday_hours || 'Não informado'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-gray-600">
                        Horário de Almoço:
                      </span>
                      <p className="text-[#1E1D40]">
                        {nutritionistProfile?.break_time || 'Não informado'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Máximo de Pacientes por Dia
                    </label>
                    <p className="text-[#1E1D40] font-semibold">
                      {nutritionistProfile?.max_patients_per_day || 'Não definido'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Estatísticas */}
              <Card className="border-0 shadow-lg backdrop-blur-sm h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <Activity className="h-4 w-4 text-white" />
                    </div>
                    <span>Estatísticas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Avaliação
                    </label>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-[#1E1D40] font-semibold">
                        {nutritionistProfile?.rating ? nutritionistProfile.rating.toFixed(1) : '0.0'}
                      </span>
                      <span className="text-gray-500 text-sm">
                        ({nutritionistProfile?.total_reviews || 0} avaliações)
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Visualizações do Perfil
                    </label>
                    <p className="text-[#1E1D40] font-semibold">
                      {viewStats.totalViews} visualizações
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Visualizações Únicas
                    </label>
                    <p className="text-[#1E1D40] font-semibold">
                      {viewStats.uniqueViews} visitantes únicos
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Última Visualização
                    </label>
                    <p className="text-[#1E1D40] font-semibold text-sm">
                      {viewStats.lastViewAt
                        ? new Date(viewStats.lastViewAt).toLocaleDateString(
                          'pt-BR'
                        )
                        : 'Nunca'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Selo de Confiança
                    </label>
                    <Badge
                      variant="outline"
                      className="bg-gray-50 text-gray-700 border-gray-200"
                    >
                      Não Disponível
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Teste de Visualizações em Tempo Real */}
              {nutritionistProfile?.id && (
                <div className="lg:col-span-3">
                  <div className="flex justify-center">
                    <RealtimeViewsTest
                      nutritionistId={nutritionistProfile.id}
                      initialStats={{
                        totalViews: viewStats.totalViews,
                        uniqueViews: viewStats.uniqueViews,
                        lastViewAt: viewStats.lastViewAt,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Conteúdo padrão para outras abas que não foram detalhadas acima */}
        {activeTab === 'teleconsultas' && (
          <div className="space-y-8">
            <NutricionistaTeleconsultasPage />
          </div>
        )}
      </div>

      {nutritionistProfile && (
        <UserProfileModal
          open={isProfileModalOpen}
          onOpenChange={setIsProfileModalOpen}
          userType="nutricionista"
          initialData={nutritionistProfile}

          userId={nutritionistProfile.id}
        />
      )}
    </DashboardSidebar>
  )
}
