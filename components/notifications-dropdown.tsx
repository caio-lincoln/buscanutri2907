"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Bell, CheckCheck } from "lucide-react"
import type { Notification } from "./notifications-panel"

interface NotificationsDropdownProps {
  userType: "paciente" | "nutricionista" | "empresa" | "admin"
}

export function NotificationsDropdown({ userType }: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    loadNotifications()
  }, [userType])

  const loadNotifications = async () => {
    // Simular carregamento de notificações baseado no tipo de usuário
    let mockNotifications: Notification[] = []

    if (userType === "nutricionista") {
      mockNotifications = [
        {
          id: "1",
          type: "appointment",
          title: "Nova consulta agendada",
          description: "João Pereira agendou uma consulta para amanhã às 14:00.",
          time: "5 min atrás",
          read: false,
          priority: "high",
        },
        {
          id: "2",
          type: "message",
          title: "Nova mensagem",
          description: "Você recebeu uma nova mensagem no chat.",
          time: "1h atrás",
          read: false,
        },
        {
          id: "3",
          type: "review",
          title: "Nova avaliação",
          description: "Um paciente deixou uma avaliação 5 estrelas.",
          time: "2h atrás",
          read: true,
        },
      ]
    } else if (userType === "paciente") {
      mockNotifications = [
        {
          id: "1",
          type: "reminder",
          title: "Lembrete de consulta",
          description: "Sua consulta com Dr. Silva é amanhã às 10:00.",
          time: "30 min atrás",
          read: false,
          priority: "high",
        },
        {
          id: "2",
          type: "plan",
          title: "Plano alimentar atualizado",
          description: "Seu nutricionista atualizou seu plano alimentar.",
          time: "2h atrás",
          read: false,
        },
        {
          id: "3",
          type: "message",
          title: "Nova mensagem",
          description: "Dr. Silva enviou uma mensagem para você.",
          time: "1 dia atrás",
          read: true,
        },
      ]
    } else if (userType === "empresa") {
      mockNotifications = [
        {
          id: "1",
          type: "job",
          title: "Nova candidatura",
          description: "Um nutricionista se candidatou à vaga de Nutricionista Clínico.",
          time: "15 min atrás",
          read: false,
          priority: "medium",
        },
        {
          id: "2",
          type: "payment",
          title: "Fatura vencendo",
          description: "Sua fatura mensal vence em 3 dias.",
          time: "1h atrás",
          read: false,
          priority: "high",
        },
        {
          id: "3",
          type: "system",
          title: "Relatório disponível",
          description: "Seu relatório mensal de candidaturas está pronto.",
          time: "1 dia atrás",
          read: true,
        },
      ]
    }

    setNotifications(mockNotifications)
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    const iconClass = "h-4 w-4"
    switch (type) {
      case "appointment":
        return <div className={`${iconClass} text-[#4AB0D9]`}>📅</div>
      case "message":
        return <div className={`${iconClass} text-green-500`}>💬</div>
      case "review":
        return <div className={`${iconClass} text-yellow-500`}>⭐</div>
      case "job":
        return <div className={`${iconClass} text-purple-500`}>💼</div>
      case "payment":
        return <div className={`${iconClass} text-green-600`}>💳</div>
      case "system":
        return <div className={`${iconClass} text-gray-500`}>⚙️</div>
      case "reminder":
        return <div className={`${iconClass} text-orange-500`}>🔔</div>
      case "plan":
        return <div className={`${iconClass} text-[#4AB0D9]`}>📋</div>
      case "exam":
        return <div className={`${iconClass} text-red-500`}>❤️</div>
      default:
        return <div className={`${iconClass} text-gray-500`}>🔔</div>
    }
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
              <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
          </div>
          {unreadCount > 0 && <p className="text-sm text-[#1E1D40]/70">{unreadCount} não lidas</p>}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.slice(0, 5).map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer ${
                !notification.read ? "bg-blue-50/50" : ""
              }`}
              onClick={() => handleMarkAsRead(notification.id)}
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
                  <p className="text-xs text-[#1E1D40]/70 truncate">{notification.description}</p>
                  <p className="text-xs text-[#1E1D40]/60 mt-1">{notification.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {notifications.length === 0 && (
          <div className="p-8 text-center">
            <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-[#1E1D40]/70">Nenhuma notificação</p>
          </div>
        )}

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
