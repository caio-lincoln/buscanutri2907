'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Calendar,
  ArrowLeft,
  Search,
  Filter,
  Clock,
  User,
  Video,
  Phone,
  MapPin,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { DashboardSidebar, getMenuItems } from '@/components/dashboard-sidebar'
import {
  getUpcomingAppointments,
  type ScheduledAppointment,
} from '@/lib/nutritionist-data-service'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'

export default function ConsultasPage() {
  const [appointments, setAppointments] = useState<ScheduledAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const router = useRouter()
  const { user, nutritionistProfile, loading: authLoading, signOut } = useAuth()
  const profile = nutritionistProfile

  // Hook para estatísticas dinâmicas do dashboard
  const { stats: dashboardStats } = useDashboardStats({
    userType: 'nutricionista',
    userId: profile?.user_id || '',
    enabled: !!profile?.user_id,
  })

  const menuItems = getMenuItems('nutricionista', dashboardStats)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (profile?.user_id) {
      loadAppointments()
    }
  }, [user, authLoading, profile?.user_id])

  const loadAppointments = async () => {
    if (!profile?.user_id) return

    try {
      setLoading(true)
      // Carregar todas as consultas (não apenas as próximas 5)
      const appointmentsData = await getUpcomingAppointments(profile.user_id, 100)
      setAppointments(appointmentsData)
    } catch (error) {
      console.error('Erro ao carregar consultas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  // Filtrar consultas baseado na busca e filtro de status
  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch = appointment.patientName
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus
    return matchesSearch && matchesStatus
  })

  // Paginação
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedAppointments = filteredAppointments.slice(
    startIndex,
    startIndex + itemsPerPage
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'paid':
      case 'scheduled':
      case 'in_progress':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'pending':
      case 'pending_payment':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'completed':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'paid':
      case 'scheduled':
        return 'Confirmado'
      case 'in_progress':
        return 'Em Andamento'
      case 'pending':
      case 'pending_payment':
        return 'Pendente'
      case 'cancelled':
        return 'Cancelado'
      case 'completed':
        return 'Concluído'
      default:
        return status
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-500 mx-auto"></div>
          <p className="text-[#1E1D40]/70 font-medium">
            Carregando consultas...
          </p>
        </div>
      </div>
    )
  }

  return (
    <DashboardSidebar
      userType="nutricionista"
      userName={profile?.full_name || 'Nutricionista'}
      userAvatar={profile?.profile_image_url || '/placeholder.svg'}
      menuItems={menuItems}
      activeItem="agenda"
      onItemClick={(itemId) => {
        if (itemId === 'overview') {
          router.push('/dashboard/nutricionistas')
        } else if (itemId === 'perfil' && profile?.id) {
          router.push(`/dashboard/nutricionistas/${profile.id}`)
        }
      }}
      onSignOut={handleSignOut}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/nutricionistas')}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-[#1E1D40]">
                Todas as Consultas
              </h1>
              <p className="text-gray-600 mt-1">
                Gerencie sua agenda completa
              </p>
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome do paciente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                >
                  Todas
                </Button>
                <Button
                  variant={filterStatus === 'confirmed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('confirmed')}
                >
                  Confirmadas
                </Button>
                <Button
                  variant={filterStatus === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('pending')}
                >
                  Pendentes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Consultas */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Consultas ({filteredAppointments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {paginatedAppointments.length > 0 ? (
              <div className="space-y-4">
                {paginatedAppointments.map((appointment, index) => (
                  <div
                    key={index}
                    className="flex flex-col lg:flex-row lg:items-center justify-between p-6 rounded-xl bg-gradient-to-r from-blue-50/50 to-blue-100/30 hover:shadow-md transition-all duration-300 group gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex flex-col items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
                        <span className="text-xs">{appointment.time}</span>
                        <span className="text-xs opacity-80">
                          {new Date(appointment.date).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-gray-500" />
                          <p className="font-semibold text-[#1E1D40] truncate">
                            {appointment.patientName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <p className="text-sm text-gray-600 truncate">
                            {appointment.type}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(appointment.date).toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge
                        variant="outline"
                        className={getStatusColor(appointment.status)}
                      >
                        {getStatusText(appointment.status)}
                      </Badge>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="hover:bg-blue-100">
                          <Video className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:bg-blue-100">
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">
                  {searchTerm || filterStatus !== 'all'
                    ? 'Nenhuma consulta encontrada'
                    : 'Nenhuma consulta agendada'}
                </p>
                <p className="text-gray-400 text-sm">
                  {searchTerm || filterStatus !== 'all'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Suas consultas aparecerão aqui quando forem agendadas'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>
    </DashboardSidebar>
  )
}
