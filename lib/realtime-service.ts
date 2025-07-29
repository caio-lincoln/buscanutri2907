import { supabase } from "./supabase"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface RealtimeMessage {
  id: string
  consultation_id: string
  sender_id: string
  message: string
  message_type: "text" | "file" | "image" | "system"
  file_url?: string
  file_name?: string
  file_size?: number
  delivered_at: string
  read_at?: string
  created_at: string
}

export interface RealtimeNote {
  id: string
  consultation_id: string
  author_id: string
  title: string
  content: string
  category: "symptoms" | "diagnosis" | "treatment" | "followup" | "general" | "prescription"
  is_private: boolean
  created_at: string
  updated_at: string
}

export interface RealtimeNotification {
  id: string
  user_id: string
  consultation_id?: string
  notification_type: string
  title: string
  message: string
  data?: any
  read: boolean
  created_at: string
}

export class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map()
  private userId: string

  // Callbacks
  public onMessageReceived?: (message: RealtimeMessage) => void
  public onNoteAdded?: (note: RealtimeNote) => void
  public onNotificationReceived?: (notification: RealtimeNotification) => void
  public onParticipantStatusChanged?: (userId: string, status: "joined" | "left") => void
  public onTypingStatusChanged?: (userId: string, isTyping: boolean) => void

  constructor(userId: string) {
    this.userId = userId
  }

  async subscribeToConsultation(consultationId: string): Promise<void> {
    try {
      console.log(`🔔 Inscrevendo-se na consulta: ${consultationId}`)

      const channelName = `consultation_${consultationId}`
      const channel = supabase.channel(channelName)

      // Escutar mensagens - usar tabela real, não view
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "telemedicine_consultation_messages",
          filter: `consultation_id=eq.${consultationId}`,
        },
        (payload) => {
          const message = payload.new as RealtimeMessage
          if (message.sender_id !== this.userId) {
            this.onMessageReceived?.(message)
          }
        },
      )

      // Escutar notas - usar tabela real, não view
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "telemedicine_consultation_notes",
          filter: `consultation_id=eq.${consultationId}`,
        },
        (payload) => {
          const note = payload.new as RealtimeNote
          if (note.author_id !== this.userId) {
            this.onNoteAdded?.(note)
          }
        },
      )

      // Escutar atualizações de notas
      channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "consultation_notes",
          filter: `consultation_id=eq.${consultationId}`,
        },
        (payload) => {
          const note = payload.new as RealtimeNote
          if (note.author_id !== this.userId) {
            this.onNoteAdded?.(note)
          }
        },
      )

      // Escutar presença (quem está online)
      channel.on("presence", { event: "sync" }, () => {
        const state = channel.presenceState()
        console.log("👥 Presença sincronizada:", state)
      })

      channel.on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("👋 Usuário entrou:", key, newPresences)
        this.onParticipantStatusChanged?.(key, "joined")
      })

      channel.on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("👋 Usuário saiu:", key, leftPresences)
        this.onParticipantStatusChanged?.(key, "left")
      })

      // Escutar eventos de digitação
      channel.on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.userId !== this.userId) {
          this.onTypingStatusChanged?.(payload.userId, payload.isTyping)
        }
      })

      await channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Registrar presença
          await channel.track({
            user_id: this.userId,
            online_at: new Date().toISOString(),
          })
          console.log(`✅ Inscrito na consulta: ${consultationId}`)
        }
      })

      this.channels.set(consultationId, channel)
    } catch (error) {
      console.error("❌ Erro ao inscrever-se na consulta:", error)
      throw error
    }
  }

  async subscribeToNotifications(): Promise<void> {
    try {
      console.log("🔔 Inscrevendo-se em notificações")

      const channel = supabase.channel(`notifications_${this.userId}`)

      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "realtime_notifications",
          filter: `user_id=eq.${this.userId}`,
        },
        (payload) => {
          const notification = payload.new as RealtimeNotification
          this.onNotificationReceived?.(notification)
        },
      )

      await channel.subscribe()
      this.channels.set("notifications", channel)

      console.log("✅ Inscrito em notificações")
    } catch (error) {
      console.error("❌ Erro ao inscrever-se em notificações:", error)
      throw error
    }
  }

  async sendMessage(
    consultationId: string,
    message: string,
    messageType: RealtimeMessage["message_type"] = "text",
    fileUrl?: string,
    fileName?: string,
    fileSize?: number,
  ): Promise<RealtimeMessage | null> {
    try {
      const { data, error } = await supabase
        .from("telemedicine_consultation_messages")
        .insert({
          consultation_id: consultationId,
          sender_id: this.userId,
          message,
          message_type: messageType,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
        })
        .select()
        .single()

      if (error) throw error

      console.log("✅ Mensagem enviada")
      return data as RealtimeMessage
    } catch (error) {
      console.error("❌ Erro ao enviar mensagem:", error)
      throw error
    }
  }

  async addNote(
    consultationId: string,
    title: string,
    content: string,
    category: RealtimeNote["category"] = "general",
    isPrivate = false,
  ): Promise<RealtimeNote | null> {
    try {
      const { data, error } = await supabase
        .from("telemedicine_consultation_notes")
        .insert({
          consultation_id: consultationId,
          author_id: this.userId,
          title,
          content,
          category,
          is_private: isPrivate,
        })
        .select()
        .single()

      if (error) throw error

      console.log("✅ Nota adicionada")
      return data as RealtimeNote
    } catch (error) {
      console.error("❌ Erro ao adicionar nota:", error)
      throw error
    }
  }

  async updateNote(noteId: string, title: string, content: string): Promise<RealtimeNote | null> {
    try {
      const { data, error } = await supabase
        .from("telemedicine_consultation_notes")
        .update({
          title,
          content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", noteId)
        .eq("author_id", this.userId)
        .select()
        .single()

      if (error) throw error

      console.log("✅ Nota atualizada")
      return data as RealtimeNote
    } catch (error) {
      console.error("❌ Erro ao atualizar nota:", error)
      throw error
    }
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("telemedicine_consultation_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("id", messageId)

      if (error) throw error
    } catch (error) {
      console.error("❌ Erro ao marcar mensagem como lida:", error)
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("realtime_notifications")
        .update({ read: true })
        .eq("id", notificationId)
        .eq("user_id", this.userId)

      if (error) throw error
    } catch (error) {
      console.error("❌ Erro ao marcar notificação como lida:", error)
    }
  }

  async sendTypingStatus(consultationId: string, isTyping: boolean): Promise<void> {
    try {
      const channel = this.channels.get(consultationId)
      if (channel) {
        await channel.send({
          type: "broadcast",
          event: "typing",
          payload: {
            userId: this.userId,
            isTyping,
          },
        })
      }
    } catch (error) {
      console.error("❌ Erro ao enviar status de digitação:", error)
    }
  }

  async loadMessages(consultationId: string): Promise<RealtimeMessage[]> {
    try {
      const { data, error } = await supabase
        .from("telemedicine_consultation_messages")
        .select("*")
        .eq("consultation_id", consultationId)
        .order("created_at", { ascending: true })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error("❌ Erro ao carregar mensagens:", error)
      return []
    }
  }

  async loadNotes(consultationId: string): Promise<RealtimeNote[]> {
    try {
      const { data, error } = await supabase
        .from("telemedicine_consultation_notes")
        .select("*")
        .eq("consultation_id", consultationId)
        .order("created_at", { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error("❌ Erro ao carregar notas:", error)
      return []
    }
  }

  async loadNotifications(): Promise<RealtimeNotification[]> {
    try {
      const { data, error } = await supabase
        .from("realtime_notifications")
        .select("*")
        .eq("user_id", this.userId)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error("❌ Erro ao carregar notificações:", error)
      return []
    }
  }

  async unsubscribeFromConsultation(consultationId: string): Promise<void> {
    try {
      const channel = this.channels.get(consultationId)
      if (channel) {
        await channel.unsubscribe()
        this.channels.delete(consultationId)
        console.log(`✅ Desinscrito da consulta: ${consultationId}`)
      }
    } catch (error) {
      console.error("❌ Erro ao desinscrever-se da consulta:", error)
    }
  }

  async unsubscribeFromNotifications(): Promise<void> {
    try {
      const channel = this.channels.get("notifications")
      if (channel) {
        await channel.unsubscribe()
        this.channels.delete("notifications")
        console.log("✅ Desinscrito das notificações")
      }
    } catch (error) {
      console.error("❌ Erro ao desinscrever-se das notificações:", error)
    }
  }

  async cleanup(): Promise<void> {
    try {
      console.log("🧹 Limpando RealtimeService...")

      for (const [key, channel] of this.channels) {
        await channel.unsubscribe()
        console.log(`✅ Canal ${key} desinscrito`)
      }

      this.channels.clear()
      console.log("✅ RealtimeService limpo")
    } catch (error) {
      console.error("❌ Erro ao limpar RealtimeService:", error)
    }
  }

  // Nova função para enviar notificações genéricas
  async sendNotification(
    userId: string,
    consultationId: string | undefined,
    title: string,
    message: string,
    notificationType: string,
    data?: any,
  ): Promise<RealtimeNotification | null> {
    try {
      const { data: notification, error } = await supabase
        .from("realtime_notifications")
        .insert({
          user_id: userId,
          consultation_id: consultationId,
          title,
          message,
          notification_type: notificationType,
          data: data || {},
          read: false,
        })
        .select()
        .single()

      if (error) throw error

      console.log("✅ Notificação enviada:", notification)
      return notification as RealtimeNotification
    } catch (error) {
      console.error("❌ Erro ao enviar notificação:", error)
      return null
    }
  }
}
