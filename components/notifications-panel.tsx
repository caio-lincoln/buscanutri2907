"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Calendar, MessageSquare, CheckCircle, Trash2, MoreHorizontal, Clock, AlertCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export interface Notification {
  id: string
  type: "appointment" | "message" | "system" | "reminder"
  title: string
  description: string
  time: string
  read: boolean
  actionUrl?: string
  sender?: {
    name: string
    role: string
    avatar?: string
  }
  priority: "low" | "medium" | "high"
}

interface NotificationsPanelProps {
  notifications: Notification[]
  userType: "paciente" | "nutricionista" | "empresa" | "admin"
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onDelete: (id: string) => void
  onClearAll: () => void
}

const notificationIcons = {
  appointment: Calendar,
  message: MessageSquare,
  system: Bell,
  reminder: Clock,
}

const priorityColors = {
  low: "bg-gray-100 text-gray-700 border-gray-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  high: "bg-red-100 text-red-700 border-red-200",
}

export function NotificationsPanel({
  notifications,
  userType,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
}: NotificationsPanelProps) {
  const [filter, setFilter] = useState<"all" | "unread">("all")

  const filteredNotifications = notifications.filter((notification) => filter === "all" || !notification.read)

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">Notificações</h1>
          <p className="text-gray-600">
            {unreadCount > 0 ? `${unreadCount} não lidas` : "Todas as notificações foram lidas"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
            Todas ({notifications.length})
          </Button>
          <Button variant={filter === "unread" ? "default" : "outline"} size="sm" onClick={() => setFilter("unread")}>
            Não lidas ({unreadCount})
          </Button>
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onMarkAllAsRead}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Marcar todas como lidas
          </Button>
          <Button variant="outline" size="sm" onClick={onClearAll}>
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar todas
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {filter === "unread" ? "Nenhuma notificação não lida" : "Nenhuma notificação"}
              </h3>
              <p className="text-gray-500">
                {filter === "unread"
                  ? "Todas as suas notificações foram lidas"
                  : "Você não tem notificações no momento"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => {
            const IconComponent = notificationIcons[notification.type]

            return (
              <Card
                key={notification.id}
                className={`border-0 shadow-lg transition-all duration-300 hover:shadow-xl ${
                  !notification.read ? "bg-blue-50/50" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {notification.sender ? (
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={notification.sender.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{notification.sender.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[#1E1D40]">{notification.title}</h3>
                          {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs ${priorityColors[notification.priority]}`}>
                            {notification.priority === "high" && <AlertCircle className="h-3 w-3 mr-1" />}
                            {notification.priority}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onMarkAsRead(notification.id)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {notification.read ? "Marcar como não lida" : "Marcar como lida"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onDelete(notification.id)} className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-3">{notification.description}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>{notification.time}</span>
                          {notification.sender && (
                            <>
                              <span>•</span>
                              <span>{notification.sender.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {notification.sender.role}
                              </Badge>
                            </>
                          )}
                        </div>
                        {notification.actionUrl && (
                          <Button size="sm" variant="outline">
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
