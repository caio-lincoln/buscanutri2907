"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users,
  Briefcase,
  FileText,
  DollarSign,
  TrendingUp,
  Shield,
  Cog,
  ArrowRight,
  Activity,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Award,
} from "lucide-react"
import { getCurrentUser, signOut } from "@/lib/auth"
import { DashboardSidebar, getMenuItems } from "@/components/dashboard-sidebar"
import { StatsCard } from "@/components/stats-card"
// Importar o hook de estatísticas do dashboard
import { useDashboardStats } from "@/hooks/use-dashboard-stats"

// Importar os novos componentes das abas
import { UsersTab } from "@/components/dashboard/admin/users-tab"
import { JobsTab } from "@/components/dashboard/admin/jobs-tab"
import { ReportsTab } from "@/components/dashboard/admin/reports-tab"
import { FinancialTab } from "@/components/dashboard/admin/financial-tab"
import { AnalyticsTab } from "@/components/dashboard/admin/analytics-tab"
import { ModerationTab } from "@/components/dashboard/admin/moderation-tab"
import { SystemTab } from "@/components/dashboard/admin/system-tab"
import { SettingsTab } from "@/components/dashboard/admin/settings-tab"
import { BadgesTab } from "@/components/dashboard/admin/badges-tab" // Importar a nova aba de insígnias

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview") // Default to overview
  const router = useRouter()

  // Hook para estatísticas dinâmicas do dashboard
  const { stats: dashboardStats, loading: statsLoading } = useDashboardStats({
    userType: "admin",
    userId: "",
    enabled: false
  })

  // Adicionar "insignias" ao menu de itens do admin
  const menuItems = getMenuItems("admin", dashboardStats).map((item) => {
    if (item.id === "configuracoes") {
      return { ...item, id: "configuracoes" } // Keep settings
    }
    return item
  })
  menuItems.splice(
    menuItems.findIndex((item) => item.id === "configuracoes"),
    0,
    { id: "insignias", label: "Insígnias", icon: Award },
  )

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser()
      if (!user || user.user_type !== "admin") {
        router.push("/login")
        return
      }
    } catch (error) {
      console.error("Error checking auth:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-500 mx-auto"></div>
          <p className="text-[#1E1D40]/70 font-medium">Carregando painel administrativo...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardSidebar
      userType="admin"
      userName="Administrador"
      menuItems={menuItems}
      activeItem={activeTab}
      onItemClick={setActiveTab}
      onSignOut={handleSignOut}
    >
      <div className="space-y-8">
        {/* Renderiza o conteúdo da aba ativa */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 rounded-3xl p-8 text-white shadow-2xl">
              <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=800')] opacity-10"></div>
              <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-bold">Painel Administrativo 🛡️</h1>
                      <p className="text-emerald-100 text-lg mt-1">Gerencie toda a plataforma Busca Nutri</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                      <p className="text-sm text-emerald-100">Usuários ativos</p>
                      <p className="font-semibold">1,247 online</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                      <p className="text-sm text-emerald-100">Sistema</p>
                      <p className="font-semibold">100% operacional</p>
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
                title="Total de Usuários"
                value="2,847"
                icon={Users}
                color="blue"
                trend={{ value: 12, isPositive: true }}
                description="Este mês"
              />
              <StatsCard
                title="Vagas Ativas"
                value="156"
                icon={Briefcase}
                color="green"
                trend={{ value: 8, isPositive: true }}
                description="Publicadas"
              />
              <StatsCard
                title="Receita Mensal"
                value="R$ 45.2k"
                icon={DollarSign}
                color="purple"
                trend={{ value: 15, isPositive: true }}
                description="Assinaturas"
              />
              <StatsCard
                title="Taxa de Conversão"
                value="23.4%"
                icon={TrendingUp}
                color="orange"
                description="Visitantes → Usuários"
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
                <Card className="group hover-lift cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-xl bg-gradient-to-br from-blue-50 to-blue-100/50 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Users className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-[#1E1D40] mb-2 text-lg">Gerenciar Usuários</h3>
                    <p className="text-sm text-gray-600 mb-4">Visualizar e moderar usuários</p>
                    <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                      Acessar <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="group hover-lift cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-xl bg-gradient-to-br from-green-50 to-green-100/50 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Briefcase className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-[#1E1D40] mb-2 text-lg">Moderar Vagas</h3>
                    <p className="text-sm text-gray-600 mb-4">Aprovar e gerenciar vagas</p>
                    <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                      Moderar <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="group hover-lift cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-xl bg-gradient-to-br from-purple-50 to-purple-100/50 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <FileText className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-[#1E1D40] mb-2 text-lg">Relatórios</h3>
                    <p className="text-sm text-gray-600 mb-4">Analytics e métricas</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    >
                      Ver relatórios <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="group hover-lift cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-xl bg-gradient-to-br from-orange-50 to-orange-100/50 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Cog className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-[#1E1D40] mb-2 text-lg">Configurações</h3>
                    <p className="text-sm text-gray-600 mb-4">Configurar sistema</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    >
                      Configurar <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* System Status & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-0 shadow-lg backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <Activity className="h-4 w-4 text-white" />
                    </div>
                    <span>Status do Sistema</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { service: "API Principal", status: "online", uptime: "99.9%", color: "green" },
                    { service: "Base de Dados", status: "online", uptime: "99.8%", color: "green" },
                    { service: "Sistema de Pagamentos", status: "online", uptime: "99.7%", color: "green" },
                    { service: "Notificações", status: "warning", uptime: "98.2%", color: "yellow" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors duration-200 group"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200`}
                        >
                          {item.status === "online" ? (
                            <CheckCircle className="h-5 w-5 text-white" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-[#1E1D40] text-sm">{item.service}</p>
                          <p className="text-sm text-gray-600 capitalize">{item.status}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{item.uptime}</p>
                        <p className="text-xs text-gray-500">Uptime</p>
                      </div>
                    </div>
                  ))}

                  <Button variant="ghost" className="w-full mt-4 text-gray-600 hover:text-gray-800">
                    Ver status completo <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Clock className="h-4 w-4 text-white" />
                    </div>
                    <span>Atividade Recente</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      action: "Novo usuário registrado",
                      user: "Maria Silva",
                      time: "2 min",
                      type: "user",
                      color: "blue",
                    },
                    { action: "Vaga aprovada", user: "TechCorp", time: "15 min", type: "job", color: "green" },
                    {
                      action: "Pagamento processado",
                      user: "Dr. João Santos",
                      time: "1h",
                      type: "payment",
                      color: "purple",
                    },
                    { action: "Relatório de abuso", user: "Sistema", time: "2h", type: "report", color: "red" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors duration-200 group"
                    >
                      <div
                        className={`w-10 h-10 bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300`}
                      >
                        {item.type === "user" && <Users className="h-5 w-5 text-white" />}
                        {item.type === "job" && <Briefcase className="h-5 w-5 text-white" />}
                        {item.type === "payment" && <DollarSign className="h-5 w-5 text-white" />}
                        {item.type === "report" && <AlertTriangle className="h-5 w-5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#1E1D40] text-sm">{item.action}</p>
                        <p className="text-sm text-gray-600 truncate">{item.user}</p>
                      </div>
                      <span className="text-xs text-gray-500 font-medium">{item.time}</span>
                    </div>
                  ))}

                  <Button variant="ghost" className="w-full mt-4 text-gray-600 hover:text-gray-800">
                    Ver todas as atividades <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        {activeTab === "usuarios" && <UsersTab />}
        {activeTab === "vagas" && <JobsTab />}
        {activeTab === "relatorios" && <ReportsTab />}
        {activeTab === "financeiro" && <FinancialTab />}
        {activeTab === "analytics" && <AnalyticsTab />}
        {activeTab === "moderacao" && <ModerationTab />}
        {activeTab === "sistema" && <SystemTab />}
        {activeTab === "insignias" && <BadgesTab />} {/* Renderiza a nova aba de insígnias */}
        {activeTab === "configuracoes" && <SettingsTab />}
      </div>
    </DashboardSidebar>
  )
}
