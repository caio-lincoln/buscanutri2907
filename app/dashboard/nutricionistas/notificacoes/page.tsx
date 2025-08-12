'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Bell,
  ArrowLeft,
  Search,
  Clock,
  User,
  Calendar,
  MessageSquare,
  Star,
  Briefcase,
  Check,
  X,
  Eye,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { DashboardSidebar, getMenuItems } from '@/components/dashboard-sidebar'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'

// Tipo para notificações
interface Notification {
  id: string
  type: 'appointment' | 'message' | 'review' | 'job' | 'system'
  title: string
  message: string
  timestamp: string
  isRead: boolean
  priority: 'low' | 'medium' | 'high'
  actionUrl?: string
  metadata?: {
    patientName?: string
    appointmentTime?: string
    rating?: number
    jobTitle?: string
  }
}

export default function NotificacoesPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterRead, setFilterRead] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

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
      loadNotifications()
    }
  }, [user, authLoading, profile?.user_id])

  const loadNotifications = async () => {
    if (!profile?.user_id) return

    try {
      setLoading(true)
      // Simulação de dados - substituir pela chamada real da API
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'appointment',
          title: 'Nova consulta agendada',
          message: 'Maria Silva agendou uma consulta para amanhã às 10:00',
          timestamp: '2024-01-15T10:30:00Z',
          isRead: false,
          priority: 'high',
          actionUrl: '/dashboard/nutricionistas/consultas',
          metadata: {
            patientName: 'Maria Silva',
            appointmentTime: '10:00',
          },
        },
        {
          id: '2',
          type: 'message',
          title: 'Nova mensagem',
          message: 'João Santos enviou uma mensagem sobre a dieta',
          timestamp: '2024-01-15T09:15:00Z',
          isRead: false,
          priority: 'medium',
          actionUrl: '/dashboard/nutricionistas/conversas',
          metadata: {
            patientName: 'João Santos',
          },
        },
        {
          id: '3',
          type: 'review',
          title: 'Nova avaliação recebida',
          message: 'Ana Costa avaliou sua consulta com 5 estrelas',
          timestamp: '2024-01-14T16:45:00Z',
          isRead: true,
          priority: 'medium',
          metadata: {
            patientName: 'Ana Costa',
            rating: 5,
          },
        },
        {
          id: '4',
          type: 'job',
          title: 'Nova oportunidade de trabalho',
          message: 'Uma nova vaga de nutricionista foi publicada',
          timestamp: '2024-01-14T14:20:00Z',
          isRead: true,
          priority: 'low',
          actionUrl: '/dashboard/nutricionistas/vagas',
          metadata: {
            jobTitle: 'Nutricionista Clínico',
          },
        },
        {
          id: '5',
          type: 'system',
          title: 'Atualização do sistema',
          message: 'Nova funcionalidade de relatórios disponível',
          timestamp: '2024-01-13T11:30:00Z',
          isRead: true,
          priority: 'low',
        },
        {
          id: '6',
          type: 'appointment',
          title: 'Consulta cancelada',
          message: 'Carlos Lima cancelou a consulta de hoje às 15:30',
          timestamp: '2024-01-13T08:00:00Z',
          isRead: false,
          priority: 'high',
          metadata: {
            patientName: 'Carlos Lima',
            appointmentTime: '15:30',
          },
        },
      ]
      setNotifications(mockNotifications)
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
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

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true }))
    )
  }

  const deleteNotification = (notificationId: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== notificationId)
    )
  }

  // Filtrar notificações
  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || notification.type === filterType
    const matchesRead =
      filterRead === 'all' ||
      (filterRead === 'read' && notification.isRead) ||
      (filterRead === 'unread' && !notification.isRead)
    return matchesSearch && matchesType && matchesRead
  })

  // Paginação
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedNotifications = filteredNotifications.slice(
    startIndex,
    startIndex + itemsPerPage
  )

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return Calendar
      case 'message':
        return MessageSquare
      case 'review':
        return Star
      case 'job':
        return Briefcase
      case 'system':
        return Bell
      default:
        return Bell
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'message':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'review':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'job':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'system':
        return 'bg-gray-50 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'Consulta'
      case 'message':
        return 'Mensagem'
      case 'review':
        return 'Avaliação'
      case 'job':
        return 'Vaga'
      case 'system':
        return 'Sistema'
      default:
        return type
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 border-red-300'
      case 'medium':
        return 'bg-yellow-100 border-yellow-300'
      case 'low':
        return 'bg-green-100 border-green-300'
      default:
        return 'bg-gray-100 border-gray-300'
    }
  }

  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      return 'Agora'
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d atrás`
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-500 mx-auto"></div>
          <p className="text-[#1E1D40]/70 font-medium">
            Carregando notificações...
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
      activeItem="notificacoes"
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
                Todas as Notificações
              </h1>
              <p className="text-gray-600 mt-1">
                {unreadCount > 0 && (
                  <span className="text-red-600 font-medium">
                    {unreadCount} não lidas •{' '}
                  </span>
                )}
                Gerencie suas notificações
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <Check className="h-4 w-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {/* Filtros e Busca */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar notificações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                >
                  Todas
                </Button>
                <Button
                  variant={filterType === 'appointment' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('appointment')}
                >
                  Consultas
                </Button>
                <Button
                  variant={filterType === 'message' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('message')}
                >
                  Mensagens
                </Button>
                <Button
                  variant={filterType === 'review' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('review')}
                >
                  Avaliações
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterRead === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterRead('all')}
                >
                  Todas
                </Button>
                <Button
                  variant={filterRead === 'unread' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterRead('unread')}
                >
                  Não lidas
                </Button>
                <Button
                  variant={filterRead === 'read' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterRead('read')}
                >
                  Lidas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Notificações */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações ({filteredNotifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {paginatedNotifications.length > 0 ? (
              <div className="space-y-4">
                {paginatedNotifications.map((notification) => {
                  const TypeIcon = getTypeIcon(notification.type)
                  return (
                    <div
                      key={notification.id}
                      className={`flex items-start justify-between p-6 rounded-xl transition-all duration-300 group gap-4 ${
                        notification.isRead
                          ? 'bg-gray-50/50 hover:bg-gray-100/50'
                          : 'bg-gradient-to-r from-blue-50/50 to-blue-100/30 hover:shadow-md border-l-4 border-blue-500'
                      } ${getPriorityColor(notification.priority)}`}
                    >
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 flex-shrink-0 ${
                            notification.isRead
                              ? 'bg-gray-200 text-gray-600'
                              : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                          }`}
                        >
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p
                              className={`font-semibold truncate ${
                                notification.isRead ? 'text-gray-700' : 'text-[#1E1D40]'
                              }`}
                            >
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          <p
                            className={`text-sm mb-2 ${
                              notification.isRead ? 'text-gray-500' : 'text-gray-600'
                            }`}
                          >
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="outline"
                              className={getTypeColor(notification.type)}
                            >
                              {getTypeText(notification.type)}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {formatTime(notification.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="hover:bg-blue-100"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {notification.actionUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(notification.actionUrl!)}
                            className="hover:bg-blue-100"
                          >
                            Ver
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="hover:bg-red-100 text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">
                  {searchTerm || filterType !== 'all' || filterRead !== 'all'
                    ? 'Nenhuma notificação encontrada'
                    : 'Nenhuma notificação'}
                </p>
                <p className="text-gray-400 text-sm">
                  {searchTerm || filterType !== 'all' || filterRead !== 'all'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Suas notificações aparecerão aqui'}
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