"use client"

import { useState, useEffect, useCallback } from "react"
import { createSupabaseClient } from "@/lib/supabase"
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getUnreadNotificationsCount,
  deleteNotification as deleteNotificationService,
  type NotificationData 
} from "@/lib/notifications-service"
import { useUser } from "@/hooks/use-user"
import { RealtimeChannel } from "@supabase/supabase-js"

export interface RealtimeNotification {
  id: string
  user_id: string
  notification_type: string
  title: string
  message: string
  data?: any
  read: boolean
  created_at: string
}

export function useRealtimeNotifications() {
  const { user } = useUser()
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const supabase = createSupabaseClient()

  // Converter notificação do banco para o formato da interface
  const convertNotification = useCallback((dbNotification: RealtimeNotification): NotificationData => ({
    id: dbNotification.id,
    title: dbNotification.title,
    message: dbNotification.message || '',
    type: (dbNotification.notification_type as NotificationData['type']) || 'info',
    read: dbNotification.read,
    createdAt: dbNotification.created_at,
    userId: dbNotification.user_id,
    actionUrl: undefined,
    metadata: dbNotification.data
  }), [])

  // Carregar notificações iniciais
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const [notificationsData, unreadCountData] = await Promise.all([
        getUserNotifications(user.id, 50),
        getUnreadNotificationsCount(user.id)
      ])
      
      setNotifications(notificationsData)
      setUnreadCount(unreadCountData)
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Marcar notificação como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const success = await markNotificationAsRead(notificationId)
      if (success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
    }
  }, [])

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return

    try {
      const success = await markAllNotificationsAsRead(user.id)
      if (success) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error)
    }
  }, [user?.id])

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const success = await deleteNotificationService(notificationId)
      if (success) {
        setNotifications(prev => 
          prev.filter(notification => notification.id !== notificationId)
        )
      }
    } catch (error) {
      console.error('Erro ao deletar notificação:', error)
    }
  }, [])

  // Configurar realtime
  useEffect(() => {
    if (!user?.id) return

    // Carregar notificações iniciais
    loadNotifications()

    // Configurar canal realtime
    const realtimeChannel = supabase
      .channel('realtime_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'realtime_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Nova notificação recebida:', payload)
          const newNotification = convertNotification(payload.new as RealtimeNotification)
          
          setNotifications(prev => [newNotification, ...prev])
          setUnreadCount(prev => prev + 1)
          
          // Mostrar notificação do navegador se permitido
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/favicon.ico',
              tag: newNotification.id
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'realtime_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Notificação atualizada:', payload)
          const updatedNotification = convertNotification(payload.new as RealtimeNotification)
          
          setNotifications(prev => 
            prev.map(notification => 
              notification.id === updatedNotification.id 
                ? updatedNotification 
                : notification
            )
          )
          
          // Atualizar contador se mudou o status de lida
          if (payload.old && payload.new) {
            const oldRead = (payload.old as RealtimeNotification).read
            const newRead = (payload.new as RealtimeNotification).read
            
            if (!oldRead && newRead) {
              setUnreadCount(prev => Math.max(0, prev - 1))
            } else if (oldRead && !newRead) {
              setUnreadCount(prev => prev + 1)
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'realtime_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Notificação deletada:', payload)
          const deletedId = (payload.old as RealtimeNotification).id
          const wasUnread = !(payload.old as RealtimeNotification).read
          
          setNotifications(prev => prev.filter(notification => notification.id !== deletedId))
          
          if (wasUnread) {
            setUnreadCount(prev => Math.max(0, prev - 1))
          }
        }
      )
      .subscribe()

    setChannel(realtimeChannel)

    // Solicitar permissão para notificações do navegador
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
      }
    }
  }, [user?.id, loadNotifications, convertNotification])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [channel, supabase])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: loadNotifications
  }
}