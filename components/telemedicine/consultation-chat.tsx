"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Paperclip, ImageIcon } from "lucide-react"
import { getConsultationMessages } from "@/lib/consultation-service"
import type { ConsultationMessage, Consultation } from "@/lib/consultation-service"
import { supabase } from "@/lib/supabase"

interface ConsultationChatProps {
  consultationId: string
  consultation: Consultation
  userType: "paciente" | "nutricionista"
  user: any
  userProfile: any
  isVisible: boolean
}

export function ConsultationChat({
  consultationId,
  consultation,
  userType,
  user,
  userProfile,
  isVisible,
}: ConsultationChatProps) {
  const [messages, setMessages] = useState<ConsultationMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isPatient = userType === "paciente"
  const otherParticipant = isPatient ? consultation.nutritionist_profiles : consultation.patient_profiles

  const otherParticipantName = isPatient
    ? consultation.nutritionist_profiles?.full_name || "Nutricionista"
    : consultation.patient_profiles?.full_name || "Paciente"

  useEffect(() => {
    if (isVisible) {
      loadMessages()
      setupRealtimeSubscription()
    }
  }, [isVisible, consultationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const messagesData = await getConsultationMessages(consultationId)
      setMessages(messagesData)
    } catch (error) {
      console.error("Error loading messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`consultation_messages_${consultationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "consultation_messages",
          filter: `consultation_id=eq.${consultationId}`,
        },
        (payload) => {
          const newMessage = payload.new as ConsultationMessage
          setMessages((prev) => [...prev, newMessage])
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)

      const { error } = await supabase.from("telemedicine_consultation_messages").insert({
        consultation_id: consultationId,
        sender_id: user.id,
        message: newMessage.trim(),
        message_type: "text",
      })

      if (error) throw error

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const isMyMessage = (message: ConsultationMessage) => {
    return message.sender_id === user.id
  }

  const getMessageSenderName = (message: ConsultationMessage) => {
    if (isMyMessage(message)) {
      return "Você"
    }
    return otherParticipantName
  }

  const getMessageSenderAvatar = (message: ConsultationMessage) => {
    if (isMyMessage(message)) {
      return userProfile?.profile_image_url || undefined
    }

    if (isPatient) {
      return consultation.nutritionist_profiles?.profile_image_url || undefined
    }

    return `/placeholder.svg?height=32&width=32&query=${otherParticipantName}`
  }

  const getMessageSenderInitial = (message: ConsultationMessage) => {
    if (isMyMessage(message)) {
      return userProfile?.full_name?.charAt(0) || (isPatient ? "P" : "N")
    }
    return otherParticipantName.charAt(0)
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Chat da Consulta</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Carregando mensagens...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
            <Send className="h-3 w-3 text-blue-600" />
          </div>
          Chat da Consulta
        </CardTitle>
        <p className="text-sm text-gray-600">Converse com {otherParticipantName} durante a consulta</p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-4 py-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Send className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-600 text-sm">Nenhuma mensagem ainda</p>
                <p className="text-gray-500 text-xs mt-1">Inicie a conversa enviando uma mensagem</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isMyMessage(message) ? "flex-row-reverse" : "flex-row"}`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={getMessageSenderAvatar(message) || "/placeholder.svg"} />
                    <AvatarFallback
                      className={`text-sm ${
                        isMyMessage(message)
                          ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                          : "bg-gradient-to-br from-gray-500 to-gray-600 text-white"
                      }`}
                    >
                      {getMessageSenderInitial(message)}
                    </AvatarFallback>
                  </Avatar>

                  <div className={`flex-1 max-w-[80%] ${isMyMessage(message) ? "text-right" : "text-left"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-700">{getMessageSenderName(message)}</span>
                      <span className="text-xs text-gray-500">{formatMessageTime(message.sent_at)}</span>
                    </div>

                    <div
                      className={`inline-block px-3 py-2 rounded-lg text-sm ${
                        isMyMessage(message)
                          ? "bg-blue-500 text-white rounded-br-sm"
                          : "bg-gray-100 text-gray-900 rounded-bl-sm"
                      }`}
                    >
                      {message.message_type === "text" ? (
                        <p className="whitespace-pre-wrap">{message.message}</p>
                      ) : (
                        <div className="flex items-center gap-2">
                          {message.message_type === "image" ? (
                            <ImageIcon className="h-4 w-4" />
                          ) : (
                            <Paperclip className="h-4 w-4" />
                          )}
                          <span>{message.file_name || "Arquivo"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t bg-gray-50/50 p-4">
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="flex-shrink-0 hover:bg-gray-200">
              <Paperclip className="h-4 w-4" />
            </Button>

            <div className="flex-1 flex gap-2">
              <Input
                placeholder={`Mensagem para ${otherParticipantName}...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={sending}
                className="border-0 bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
              />

              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                size="sm"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
