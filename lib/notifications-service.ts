import { createSupabaseClient } from "./supabase"

const supabase = createSupabaseClient()

export interface NotificationData {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  originalType?: "message" | "appointment" | "forum" | "reminder" | "system"
  read: boolean
  createdAt: string
  userId: string
  actionUrl?: string
  metadata?: Record<string, any>
}

// Função para mapear tipos do banco para tipos da interface
function mapNotificationType(dbType: string): "info" | "success" | "warning" | "error" {
  switch (dbType) {
    case "appointment":
      return "success"
    case "message":
      return "info"
    case "forum":
      return "info"
    case "reminder":
      return "warning"
    case "system":
      return "error"
    default:
      return "info"
  }
}

/**
 * Buscar notificações do usuário
 */
export async function getUserNotifications(userId: string, limit = 50): Promise<NotificationData[]> {
  try {
    const { data: notifications, error } = await supabase
      .from("realtime_notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching notifications:", error)
      return []
    }

    return notifications.map(notification => ({
      id: notification.id,
      title: notification.title || "Notificação",
      message: notification.message || "",
      type: mapNotificationType(notification.notification_type || "info"),
      originalType: notification.notification_type as "message" | "appointment" | "forum" | "reminder" | "system",
      read: notification.read || false,
      createdAt: notification.created_at,
      userId: notification.user_id,
      actionUrl: notification.action_url,
      metadata: notification.data
    }))
  } catch (error) {
    console.error("Error in getUserNotifications:", error)
    return []
  }
}

/**
 * Marcar notificação como lida
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("realtime_notifications")
      .update({ read: true })
      .eq("id", notificationId)

    if (error) {
      console.error("Error marking notification as read:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in markNotificationAsRead:", error)
    return false
  }
}

/**
 * Marcar todas as notificações como lidas
 */
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("realtime_notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false)

    if (error) {
      console.error("Error marking all notifications as read:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in markAllNotificationsAsRead:", error)
    return false
  }
}

/**
 * Criar nova notificação
 */
export async function createNotification(notification: Omit<NotificationData, "id" | "createdAt" | "read">): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("realtime_notifications")
      .insert({
        title: notification.title,
        message: notification.message,
        notification_type: notification.type,
        user_id: notification.userId,
        action_url: notification.actionUrl,
        data: notification.metadata,
        read: false,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error("Error creating notification:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in createNotification:", error)
    return false
  }
}

/**
 * Buscar contagem de notificações não lidas
 */
export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("realtime_notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false)

    if (error) {
      console.error("Error fetching unread notifications count:", error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error("Error in getUnreadNotificationsCount:", error)
    return 0
  }
}

/**
 * Deletar notificação
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("realtime_notifications")
      .delete()
      .eq("id", notificationId)

    if (error) {
      console.error("Error deleting notification:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteNotification:", error)
    return false
  }
}

/**
 * Deletar todas as notificações do usuário
 */
export async function deleteAllNotifications(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("realtime_notifications")
      .delete()
      .eq("user_id", userId)

    if (error) {
      console.error("Error deleting all notifications:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteAllNotifications:", error)
    return false
  }
}
