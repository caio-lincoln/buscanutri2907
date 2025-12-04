'use client'

import {
  Calendar,
  Users,
  MessageSquare,
  Briefcase,
  BookOpen,
  ArrowRight,
  Star,
  Target,
  Heart,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '../../../contexts/auth-context'
import { RatingDisplay } from '@/components/ui/rating-display'
import { StatsCard } from '@/components/stats-card'
import { useEffect, useMemo, useState } from 'react'

import {
  getNutritionistStats,
  getUpcomingAppointments,
  type NutritionistStats,
  type ScheduledAppointment,
} from '@/lib/nutritionist-data-service'
import { useRouter } from 'next/navigation'
import { useHasActiveSubscription } from '../../../hooks/use-has-active-subscription'
import { Tab } from '../../../app/dashboard/nutricionistas/_client'
import NutritionistRecentChatsList from '../../../app/dashboard/nutricionistas/_components/NutriotinistRecentChatsList'
import { createSupabaseClient } from '../../../lib/supabase'
import { PermissionWrapper, usePermissions } from '../../../components/ui/permission-wrapper'

export default function OverviewTab({ setActiveTab }: { setActiveTab: (tab: Tab) => void }) {
  const { nutritionistProfile } = useAuth()
  const { hasPermission } = usePermissions()
  const [ upcomingAppointments, setUpcomingAppointments ] = useState<
    ScheduledAppointment[]
  >([])
  const supabase = useMemo(() => createSupabaseClient(), [])

  const router = useRouter()
  const { hasActiveSubscription } = useHasActiveSubscription()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const [ stats, setStats ] = useState<NutritionistStats>({
    activePatients: 0,
    scheduledAppointments: 0,
    unreadMessages: 0,
    totalConsultations: 0,
  })

  async function fetchStats(nutritionistId: string) {
    const { data, error } = await supabase
      .rpc('get_nutritionist_stats', { p_nutritionist_id: nutritionistId })

    if (error) throw error

    const row = Array.isArray(data) ? data[ 0 ] : data
    return {
      activePatients: row?.active_patients ?? 0,
      scheduledAppointments: row?.scheduled_appointments ?? 0,
      unreadMessages: row?.unread_messages ?? 0,
      totalConsultations: row?.total_consultations ?? 0,
    }
  }

  useEffect(() => {
    (async () => {
      if (!nutritionistProfile?.id) return
      try {
        const s = await fetchStats(nutritionistProfile.id)
        setStats(s)
      } catch (e) {
        // opcional: log
      }
    })()
  }, [supabase, nutritionistProfile?.id])

  const loadDashboardData = async () => {
    if (!nutritionistProfile?.user_id) return

    try {
      const statsData = await getNutritionistStats(nutritionistProfile.user_id)
      setStats(statsData)

      // Carregar próximas consultas
      const appointmentsData = await getUpcomingAppointments(nutritionistProfile.user_id, 5)
      setUpcomingAppointments(appointmentsData)
    } catch (error) {
      console.log("🚀 ~ loadDashboardData ~ error:", error)
      // Error loading dashboard data - handled silently
    }
  }

  return (
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
      {hasActiveSubscription && (
        <>
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#1E1D40]">
                Ações Rápidas
              </h2>
              {/* <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
                onClick={() => router.push('/dashboard/nutricionistas/notificacoes')}
              >
                Ver todas <ArrowRight className="h-4 w-4 ml-1" />
              </Button> */}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {/* <Card
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
          </Card> */}

              {/* <Card
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
          </Card> */}

              <PermissionWrapper requiredPermissions={['manage_jobs']}>
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
              </PermissionWrapper>

              <PermissionWrapper requiredPermissions={['access_courses']}>
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
              </PermissionWrapper>
            </div>
          </div>
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
                  onClick={() => setActiveTab('teleconsultas')}
                >
                  Ver consultas <ArrowRight className="h-4 w-4 ml-1" />
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
                      {/* <Button
                        variant="outline"
                        onClick={() => setActiveTab('agenda')}
                        className="hover-lift"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Ver agenda
                      </Button> */}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )
      }

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
  );
}
