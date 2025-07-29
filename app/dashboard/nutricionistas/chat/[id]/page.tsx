"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, Paperclip, ImageIcon, Phone, Video, MoreVertical } from "lucide-react"
import { getCurrentUser, getUserProfile } from "@/lib/auth"
import { getChatMessages, sendChatMessage, type ChatMessage, type ChatConversation } from "@/lib/chat-forum-service"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"

export default function NutritionistChatPage() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [conversation, setConversation] = useState<ChatConversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const params = useParams()
  const conversationId = params.id as string

  useEffect(() => {
    loadChatData()
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (conversation) {
      setupRealtimeSubscription()
    }
  }, [conversation])

  const loadChatData = async () => {
    try {
      setLoading(true)
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/login')
        return
      }

      const profile = await getUserProfile(currentUser.id)
      setUser(currentUser)
      setUserProfile(profile)

      // Get conversation details
      const { data: conversationData, error: conversationError } = await supabase
        .from('chat_conversations')
        .select(`
          *,
          nutritionist_profiles!chat_conversations_nutritionist_id_fkey (
            full_name,
            profile_image_url,
            crn,
            is_verified
          ),
          patient_profiles!chat_conversations_patient_id_fkey (
            full_name,
            profile_image_url
          )
        `)
        .eq('id', conversationId)
        .eq('nutritionist_id', currentUser.id)
        .single()

      if (conversationError) {
        console.error('Error fetching conversation:', conversationError)
        toast({
          title: "Erro",
          description: "Conversa não encontrada ou acesso negado.",
          variant: "destructive"
        })
        router.push('/dashboard/nutricionistas')
        return
      }

      setConversation(conversationData)

      // Load messages
      const chatMessages = await getChatMessages(conversationId, currentUser.id, 'nutritionist')
      setMessages(chatMessages)
    } catch (error) {
      console.error('Error loading chat data:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do chat.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`chat_messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage
          setMessages(prev => [...prev, newMessage])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !conversation || sending) return

    try {
      setSending(true)
      const message = await sendChatMessage(conversationId, user.id, 'nutritionist', newMessage.trim())
      setMessages(prev => [...prev, message])
      setNewMessage("")
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem.",
        variant: "destructive"
      })
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando chat...</p>
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Conversa não encontrada.</p>
          <Link href="/dashboard/nutricionistas">
            <Button>Voltar ao Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const patient = conversation.patient_profiles

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/nutricionistas">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={patient?.profile_image_url} />
                  <AvatarFallback>
                    {patient?.full_name?.charAt(0) || "P"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="font-semibold text-gray-900">
                    {patient?.full_name || "Paciente"}
                  </h1>
                  <span className="text-sm text-gray-500">
                    Paciente
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="h-[calc(100vh-200px)] flex flex-col">
          {/* Messages Area */}
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => {
                  const isFromNutritionist = message.sender_type === 'nutritionist'
                  const senderName = isFromNutritionist 
                    ? userProfile?.full_name || "Você"
                    : patient?.full_name || "Paciente"
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${isFromNutritionist ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isFromNutritionist && (
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarImage src={patient?.profile_image_url} />
                          <AvatarFallback className="text-xs">
                            {patient?.full_name?.charAt(0) || "P"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`max-w-[70%] ${isFromNutritionist ? 'order-first' : ''}`}>
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            isFromNutritionist
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.message_text}</p>
                        </div>
                        <p className={`text-xs text-gray-500 mt-1 ${
                          isFromNutritionist ? 'text-right' : 'text-left'
                        }`}>
                          {format(new Date(message.created_at), "HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      
                      {isFromNutritionist && (
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarImage src={userProfile?.profile_image_url} />
                          <AvatarFallback className="text-xs">
                            {userProfile?.full_name?.charAt(0) || "N"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>

          {/* Message Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-end gap-2">
              <Button variant="outline" size="sm" className="mb-2">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="mb-2">
                <ImageIcon className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  disabled={sending}
                  className="resize-none"
                />
              </div>
              <Button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                className="mb-2"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}