'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Bell,
  Calendar,
  MessageSquare,
  CheckCircle,
  Trash2,
  MoreHorizontal,
  Clock,
  AlertCircle,
  Loader2,
  Info,
  AlertTriangle,
  XCircle,
  Users,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications'
import type { NotificationData } from '@/lib/notifications-service'

interface NotificationsPanelProps {
  userType: 'paciente' | 'nutricionista' | 'empresa' | 'admin'
}

// Mapeamento de ícones por tipo original
const notificationIcons = {
  message: MessageSquare,
  appointment: Calendar,
  forum: Users,
  reminder: Clock,
  system: AlertCircle,
}

// Mapeamento de cores por tipo
const typeColors = {
  info: 'bg-blue-100 text-blue-600',
  success: 'bg-green-100 text-green-600',
  warning: 'bg-yellow-100 text-yellow-600',
  error: 'bg-red-100 text-red-600',
}

// Mapeamento de cores por tipo original
const originalTypeColors = {
  message: 'bg-blue-100 text-blue-600',
  appointment: 'bg-green-100 text-green-600',
  forum: 'bg-purple-100 text-purple-600',
  reminder: 'bg-yellow-100 text-yellow-600',
  system: 'bg-red-100 text-red-600',
}

export function NotificationsPanel({ userType }: NotificationsPanelProps) {
  const [ filter, setFilter ] = useState<'all' | 'unread'>('all')
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useRealtimeNotifications()

  const filteredNotifications = notifications.filter(
    notification => filter === 'all' || !notification.read
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">
            Notificações
          </h1>
          <p className="text-gray-600">
            {unreadCount > 0
              ? `${unreadCount} não lidas`
              : 'Todas as notificações foram lidas'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todas ({notifications.length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Não lidas ({unreadCount})
          </Button>
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Marcar todas como lidas
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {filter === 'unread'
                  ? 'Nenhuma notificação não lida'
                  : 'Nenhuma notificação'}
              </h3>
              <p className="text-gray-500">
                {filter === 'unread'
                  ? 'Todas as suas notificações foram lidas'
                  : 'Você não tem notificações no momento'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map(notification => {
            const originalType = notification.originalType || 'system'
            const IconComponent = notificationIcons[ originalType ] || AlertCircle

            // Função para formatar a data
            const formatTime = (dateString: string) => {
              const date = new Date(dateString)
              const now = new Date()
              const diffInMinutes = Math.floor(
                (now.getTime() - date.getTime()) / (1000 * 60)
              )

              if (diffInMinutes < 1) return 'Agora'
              if (diffInMinutes < 60) return `${diffInMinutes} min atrás`

              const diffInHours = Math.floor(diffInMinutes / 60)
              if (diffInHours < 24) return `${diffInHours}h atrás`

              const diffInDays = Math.floor(diffInHours / 24)
              if (diffInDays < 7)
                return `${diffInDays} dia${diffInDays > 1 ? 's' : ''} atrás`

              return date.toLocaleDateString('pt-BR')
            }

            return (
              <Card
                key={notification.id}
                className={`border-0 shadow-lg transition-all duration-300 hover:shadow-xl ${!notification.read ? 'bg-blue-50/50' : ''
                  }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[#1E1D40]">
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${originalTypeColors[ originalType ] || typeColors[ notification.type ]}`}
                          >
                            {notification.type === 'error' && (
                              <AlertCircle className="h-3 w-3 mr-1" />
                            )}
                            {originalType}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => markAsRead(notification.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {notification.read
                                  ? 'Marcar como não lida'
                                  : 'Marcar como lida'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  deleteNotification(notification.id)
                                }
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-3">
                        {notification.message}
                      </p>

                      {notification.metadata?.sender_name && (
                        <p className="text-sm text-gray-500 mb-3">
                          De: {notification.metadata.sender_name}
                          {notification.metadata.sender_role &&
                            ` (${notification.metadata.sender_role})`}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(notification.createdAt)}</span>
                        </div>
                        {notification.actionUrl && (
                          <Button size="sm" variant="outline" onClick={() => {
                            window.open(notification.actionUrl)
                          }}>
                            Ver detalhes
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
