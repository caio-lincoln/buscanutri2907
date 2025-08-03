"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications"
import type { NotificationData } from "@/lib/notifications-service"

interface NotificationsDropdownProps {
  userType: "paciente" | "nutricionista" | "empresa" | "admin"
}

export function NotificationsDropdown({ userType }: NotificationsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead 
  } = useRealtimeNotifications()

  const getNotificationIcon = (type: NotificationData["type"]) => {
    const iconClass = "h-4 w-4"
    switch (type) {
      case "info":
        return <div className={`${iconClass} text-blue-500`}>ℹ️</div>
      case "success":
        return <div className={`${iconClass} text-green-500`}>✅</div>
      case "warning":
        return <div className={`${iconClass} text-yellow-500`}>⚠️</div>
      case "error":
        return <div className={`${iconClass} text-red-500`}>❌</div>
      default:
        return <div className={`${iconClass} text-gray-500`}>🔔</div>
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Agora"
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h atrás`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} dia${diffInDays > 1 ? 's' : ''} atrás`
    
    return date.toLocaleDateString('pt-BR')
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#1E1D40]">Notificações</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
          </div>
          {unreadCount > 0 && <p className="text-sm text-[#1E1D40]/70">{unreadCount} não lidas</p>}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-[#1E1D40]/70">Carregando notificações...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-[#1E1D40]/70">Nenhuma notificação</p>
            </div>
          ) : (
            notifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer ${
                  !notification.read ? "bg-blue-50/50" : ""
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm font-medium truncate ${
                          !notification.read ? "text-[#1E1D40]" : "text-[#1E1D40]/80"
                        }`}
                      >
                        {notification.title}
                      </p>
                      {!notification.read && <div className="w-2 h-2 bg-[#4AB0D9] rounded-full flex-shrink-0"></div>}
                    </div>
                    <p className="text-xs text-[#1E1D40]/70 truncate">{notification.message}</p>
                    <p className="text-xs text-[#1E1D40]/60 mt-1">{formatTime(notification.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {notifications.length > 5 && (
          <div className="p-3 border-t">
            <Button variant="ghost" className="w-full text-sm">
              Ver todas as notificações
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
