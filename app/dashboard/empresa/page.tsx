'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Calendar,
  Users,
  Briefcase,
  Building,
  User,
  Settings,
  Plus,
  ArrowRight,
  Activity,
  Target,
  Bot,
  TrendingUp,
  FileText,
} from 'lucide-react'
import { getUserProfile } from '@/lib/auth'
import type { CompanyProfile } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { NotificationsPanel } from '@/components/notifications-panel'
import { DashboardSidebar, getMenuItems } from '@/components/dashboard-sidebar'
import { IrisChat } from '@/components/iris-chat'
import { StatsCard } from '@/components/stats-card'
import { UserProfileModal } from '@/components/user-profile-modal'
// Importar o hook de estatísticas do dashboard
import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import { JobsTab } from '@/components/dashboard/empresa/jobs-tab'
import { CandidatesTab } from '@/components/dashboard/empresa/candidates-tab'
import { ProcessesTab } from '@/components/dashboard/empresa/processes-tab'
import { ReportsTab } from '@/components/dashboard/empresa/reports-tab'
import {
  getCompanyOverviewData,
  type CompanyOverviewStats,
} from '@/lib/company-data-service'
import { PermissionWrapper, usePermissions } from '@/components/ui/permission-wrapper'

export default function CompanyDashboard() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [overviewData, setOverviewData] = useState<CompanyOverviewStats | null>(
    null
  )
  const [overviewLoading, setOverviewLoading] = useState(false)
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const { hasPermission } = usePermissions()

  // Funções definidas antes dos useEffect
  const loadProfile = async () => {
    try {
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await getUserProfile(user.id, 'empresa')
      setProfile(profileData)
      setLoading(false)
    } catch {
      // Error loading profile - handled silently
      setLoading(false)
    }
  }

  const loadOverviewData = useCallback(async () => {
    if (!profile?.id) return

    setOverviewLoading(true)
    try {
      const data = await getCompanyOverviewData(profile.id)
      setOverviewData(data)
      setOverviewLoading(false)
    } catch {
      // Error loading overview data - handled silently
      setOverviewLoading(false)
    }
  }, [profile?.id])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch {
      // Error signing out - handled silently
    }
  }

  // useEffect hooks
  useEffect(() => {
    if (!authLoading) {
      loadProfile()
    }
  }, [user, authLoading])

  useEffect(() => {
    if (profile?.id && activeTab === 'overview') {
      loadOverviewData()
    }
  }, [profile?.id, activeTab, loadOverviewData])

  // Hook para estatísticas dinâmicas do dashboard - só executa após profile ser carregado
  const { stats: dashboardStats } = useDashboardStats({
    userType: 'empresa',
    userId: profile?.user_id || '',
    enabled: !!profile?.user_id && !loading,
  })

  const menuItems = getMenuItems('empresa', dashboardStats)

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

  return (
    <DashboardSidebar
      userType="empresa"
      userName={profile?.company_name || 'Empresa'}
      userAvatar={profile?.logo_url}
      menuItems={menuItems}
      activeItem={activeTab}
      onItemClick={setActiveTab}
      onSignOut={handleSignOut}
    >
      <div className="space-y-8">
        {/* Overview Dashboard */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 rounded-3xl p-8 text-white shadow-2xl">
              <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=800')] opacity-10"></div>
              <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <Building className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-bold">
                        Olá, {profile?.company_name || 'Empresa'}! 👋
                      </h1>
                      <p className="text-purple-100 text-lg mt-1">
                        Como está o recrutamento hoje?
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                      <p className="text-sm text-purple-100">Vagas ativas</p>
                      <p className="font-semibold">
                        {overviewLoading
                          ? '...'
                          : `${overviewData?.activeJobs || 0} abertas`}
                      </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                      <p className="text-sm text-purple-100">Candidaturas</p>
                      <p className="font-semibold">
                        {overviewLoading
                          ? '...'
                          : `${overviewData?.newApplications || 0} novas`}
                      </p>
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
                title="Vagas Publicadas"
                value={
                  overviewLoading
                    ? '...'
                    : overviewData?.totalJobs?.toString() || '0'
                }
                icon={Briefcase}
                color="blue"
                description="Total"
              />
              <StatsCard
                title="Candidaturas Recebidas"
                value={
                  overviewLoading
                    ? '...'
                    : overviewData?.totalApplications?.toString() || '0'
                }
                icon={Users}
                color="green"
                description="Total"
              />
              <StatsCard
                title="Entrevistas Agendadas"
                value={
                  overviewLoading
                    ? '...'
                    : overviewData?.scheduledInterviews?.toString() || '0'
                }
                icon={Calendar}
                color="orange"
                description="Agendadas"
              />
              <StatsCard
                title="Taxa de Conversão"
                value={
                  overviewLoading
                    ? '...'
                    : `${overviewData?.conversionRate || 0}%`
                }
                icon={TrendingUp}
                color="purple"
                description="Candidatura → Contratação"
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
                >
                  Ver todas <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <PermissionWrapper permission="manage_jobs">
                  <Card
                    className="group hover-lift cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-xl bg-gradient-to-br from-blue-50 to-blue-100/50 backdrop-blur-sm"
                    onClick={() => setActiveTab('vagas')}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Plus className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="font-semibold text-[#1E1D40] mb-2 text-lg">
                        Publicar Vaga
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Crie uma nova oportunidade
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        Criar vaga <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                </PermissionWrapper>

                <PermissionWrapper permission="manage_candidates">
                  <Card
                    className="group hover-lift cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-xl bg-gradient-to-br from-green-50 to-green-100/50 backdrop-blur-sm"
                    onClick={() => setActiveTab('candidatos')}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Users className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="font-semibold text-[#1E1D40] mb-2 text-lg">
                        Candidatos
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Gerencie candidaturas
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        Ver candidatos <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                </PermissionWrapper>

                <PermissionWrapper permission="manage_interviews">
                  <Card
                    className="group hover-lift cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-xl bg-gradient-to-br from-purple-50 to-purple-100/50 backdrop-blur-sm"
                    onClick={() => setActiveTab('processos')}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Calendar className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="font-semibold text-[#1E1D40] mb-2 text-lg">
                        Entrevistas
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Agende e gerencie entrevistas
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      >
                        Ver agenda <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                </PermissionWrapper>

                <PermissionWrapper permission="view_reports">
                  <Card
                    className="group hover-lift cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-xl bg-gradient-to-br from-orange-50 to-orange-100/50 backdrop-blur-sm"
                    onClick={() => setActiveTab('relatorios')}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <FileText className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="font-semibold text-[#1E1D40] mb-2 text-lg">
                        Relatórios
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Analise métricas de RH
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      >
                        Ver relatórios <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                </PermissionWrapper>
              </div>
            </div>

            {/* Active Jobs & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-0 shadow-lg backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Briefcase className="h-4 w-4 text-white" />
                    </div>
                    <span>Vagas Ativas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {overviewLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div
                          key={i}
                          className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/50 animate-pulse"
                        >
                          <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                          <div className="w-16 h-6 bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : overviewData?.recentJobs &&
                    overviewData.recentJobs.length > 0 ? (
                    overviewData.recentJobs.map((job, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50/50 to-blue-100/30 hover:shadow-md transition-all duration-300 group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-105 transition-transform duration-300">
                            {job.applications}
                          </div>
                          <div>
                            <p className="font-semibold text-[#1E1D40]">
                              {job.title}
                            </p>
                            <p className="text-sm text-gray-600">
                              Publicado há {job.posted}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              job.status === 'ativa'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            }
                          >
                            {job.status === 'ativa' ? 'Ativa' : 'Pausada'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhuma vaga encontrada</p>
                      <p className="text-sm">
                        Publique sua primeira vaga para começar
                      </p>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    className="w-full mt-4 text-gray-600 hover:text-gray-800"
                    onClick={() => setActiveTab('vagas')}
                  >
                    Ver todas as vagas <ArrowRight className="h-4 w-4 ml-1" />
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
                  {overviewLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/50 animate-pulse"
                        >
                          <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                          </div>
                          <div className="w-8 h-3 bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : overviewData?.recentActivity &&
                    overviewData.recentActivity.length > 0 ? (
                    overviewData.recentActivity.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors duration-200 group"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
                          <Activity className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#1E1D40] text-sm">
                            {item.title}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {item.description}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                          {item.time}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhuma atividade recente</p>
                      <p className="text-sm">
                        As atividades aparecerão aqui conforme você usar o
                        sistema
                      </p>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    className="w-full mt-4 text-gray-600 hover:text-gray-800"
                  >
                    Ver todas as atividades{' '}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

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
                  Sua assistente virtual para recrutamento
                </p>
              </div>
            </div>

            <Card className="border-0 shadow-2xl backdrop-blur-sm">
              <IrisChat userType="empresa" />
            </Card>
          </div>
        )}

        {/* Notificações */}
        {activeTab === 'notificacoes' && (
          <div className="space-y-8">
            <NotificationsPanel userType="empresa" />
          </div>
        )}

        {/* Perfil */}
        {activeTab === 'perfil' && (
          <div className="space-y-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">
                  Perfil da Empresa
                </h1>
                <p className="text-gray-600">
                  Gerencie as informações da sua empresa
                </p>
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
                      <Building className="h-4 w-4 text-white" />
                    </div>
                    <span>Informações da Empresa</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center">
                    <Avatar className="h-20 w-20 mb-4">
                      <AvatarImage
                        src={
                          profile?.logo_url ||
                          `/placeholder.svg?height=80&width=80&query=${profile?.company_name || '/placeholder.svg'} logo`
                        }
                      />
                      <AvatarFallback className="bg-gray-200 text-gray-600 text-xl font-semibold">
                        {profile?.company_name?.charAt(0).toUpperCase() || 'E'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Nome da Empresa
                    </label>
                    <p className="text-[#1E1D40] font-semibold text-lg">
                      {profile?.company_name || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      CNPJ
                    </label>
                    <p className="text-[#1E1D40] font-semibold">
                      {profile?.cnpj || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Setor
                    </label>
                    <p className="text-[#1E1D40] font-semibold">
                      {profile?.industry || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Tamanho da Empresa
                    </label>
                    <p className="text-[#1E1D40] font-semibold">
                      {profile?.company_size || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Telefone
                    </label>
                    <p className="text-[#1E1D40] font-semibold">
                      {profile?.phone || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Website
                    </label>
                    <p className="text-[#1E1D40] font-semibold text-sm mt-1">
                      {profile?.website ? (
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {profile.website}
                        </a>
                      ) : (
                        'Não informado'
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <span>Descrição</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Sobre a Empresa
                    </label>
                    <p className="text-[#1E1D40] font-semibold text-sm mt-1">
                      {profile?.description || 'Nenhuma descrição informada'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span>Responsável</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Nome do Responsável
                    </label>
                    <p className="text-[#1E1D40] font-semibold">
                      {profile?.responsible_name || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Cargo
                    </label>
                    <p className="text-[#1E1D40] font-semibold">
                      {profile?.responsible_position || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      CPF do Responsável
                    </label>
                    <p className="text-[#1E1D40] font-semibold">
                      {profile?.responsible_cpf || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Endereço
                    </label>
                    <p className="text-[#1E1D40] font-semibold">
                      {profile?.address || 'Não informado'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Vagas */}
        {activeTab === 'vagas' && (
          <div className="space-y-8">
            <JobsTab />
          </div>
        )}

        {/* Candidatos */}
        {activeTab === 'candidatos' && (
          <div className="space-y-8">
            <CandidatesTab />
          </div>
        )}

        {/* Processos */}
        {activeTab === 'processos' && (
          <div className="space-y-8">
            <ProcessesTab />
          </div>
        )}

        {/* Relatórios */}
        {activeTab === 'relatorios' && (
          <div className="space-y-8">
            <ReportsTab />
          </div>
        )}

        {/* Conteúdo padrão para outras abas */}
        {![
          'overview',
          'iris',
          'notificacoes',
          'perfil',
          'vagas',
          'candidatos',
          'processos',
          'relatorios',
        ].includes(activeTab) && (
          <div className="space-y-8">
            <div className="text-center space-y-6 py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                <Settings className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-[#1E1D40] mb-2 capitalize">
                  {activeTab}
                </h2>
                <p className="text-gray-600 text-lg">
                  Esta funcionalidade será implementada em breve.
                </p>
              </div>
              <Button
                variant="outline"
                className="hover-lift bg-white/80 backdrop-blur-sm border-gray-200"
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
          userType="empresa"
          initialData={profile}
          onProfileUpdate={loadProfile}
          userId={profile.user_id}
        />
      )}
    </DashboardSidebar>
  )
}
