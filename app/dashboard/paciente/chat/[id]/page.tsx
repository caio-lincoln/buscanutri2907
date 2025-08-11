'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Send,
  Paperclip,
  ImageIcon,
  Phone,
  Video,
  MoreVertical,
} from 'lucide-react'
import { getUserProfile } from '@/lib/auth'
import { useAuth } from '@/contexts/auth-context'
import {
  getChatMessages,
  sendChatMessage,
  type ChatMessage,
  type ChatConversation,
} from '@/lib/chat-forum-service'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { DashboardSidebar, getMenuItems } from '@/components/dashboard-sidebar'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'

export default function PatientChatPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [conversation, setConversation] = useState<ChatConversation | null>(
    null
  )
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const params = useParams()
  const conversationId = params.id as string

  // Dashboard stats
  const { stats, loading: statsLoading } = useDashboardStats({
    userType: 'paciente',
    userId: user?.id || '',
    enabled: !!user?.id,
  })
  const menuItems = getMenuItems('paciente', stats)

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      // Silent error handling for sign out
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      loadChatData()
    }
  }, [conversationId, user, authLoading])

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
      if (!user) {
        router.push('/login')
        return
      }

      const profile = await getUserProfile(user.id)
      setUserProfile(profile)

      // Get conversation details
      const { data: conversationData, error: conversationError } =
        await supabase
          .from('chat_conversations')
          .select('*')
          .eq('id', conversationId)
          .eq('patient_id', user.id)
          .single()

      if (conversationError) {
        // Silent error handling for conversation fetching
        toast({
          title: 'Erro',
          description: 'Conversa não encontrada ou acesso negado.',
          variant: 'destructive',
        })
        router.push('/dashboard/paciente')
        return
      }

      // Buscar perfil do nutricionista separadamente
      const { data: nutritionistProfile } = await supabase
        .from('nutritionist_profiles')
        .select('full_name, profile_image_url, crn, is_verified')
        .eq('user_id', conversationData.nutritionist_id)
        .single()

      // Enriquecer dados da conversa com perfil do nutricionista
      const enrichedConversation = {
        ...conversationData,
        nutritionist_profiles: nutritionistProfile,
      }

      setConversation(enrichedConversation)

      // Load messages
      const chatMessages = await getChatMessages(
        conversationId,
        user.id,
        'patient'
      )
      setMessages(chatMessages)
    } catch (error) {
      // Silent error handling for chat data loading
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do chat.',
        variant: 'destructive',
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
          filter: `conversation_id=eq.${conversationId}`,
        },
        payload => {
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !conversation || sending) return

    try {
      setSending(true)
      const message = await sendChatMessage(
        conversationId,
        user.id,
        'patient',
        newMessage.trim()
      )
      setMessages(prev => [...prev, message])
      setNewMessage('')
    } catch (error) {
      // Silent error handling for message sending
      toast({
        title: 'Erro',
        description: 'Erro ao enviar mensagem.',
        variant: 'destructive',
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

  if (authLoading || loading) {
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
          <Link href="/dashboard/paciente">
            <Button>Voltar ao Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const nutritionist = conversation.nutritionist_profiles

  return (
    <DashboardSidebar
      userType="paciente"
      userName={userProfile?.full_name || 'Paciente'}
      menuItems={menuItems}
      activeItem="chat"
      onItemClick={item => router.push(item.href)}
      onSignOut={handleSignOut}
    >
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link href="/dashboard/paciente">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                </Link>

                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={nutritionist?.profile_image_url || ''} className="rounded-full object-cover" />
                    <AvatarFallback>
                      {nutritionist?.full_name?.charAt(0) || 'N'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="font-semibold text-gray-900">
                      {nutritionist?.full_name || 'Nutricionista'}
                    </h1>
                    <div className="flex items-center gap-2">
                      {nutritionist?.is_verified && (
                        <Badge variant="secondary" className="text-xs">
                          Verificado
                        </Badge>
                      )}
                      {nutritionist?.crn && (
                        <span className="text-xs text-gray-500">
                          CRN: {nutritionist.crn}
                        </span>
                      )}
                    </div>
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
                  {messages.map(message => {
                    const isFromPatient = message.sender_type === 'patient'
                    const senderName = isFromPatient
                      ? userProfile?.full_name || 'Você'
                      : nutritionist?.full_name || 'Nutricionista'

                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${isFromPatient ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isFromPatient && (
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarImage
                              src={nutritionist?.profile_image_url || ''}
                              className="rounded-full object-cover"
                            />
                            <AvatarFallback className="text-xs">
                              {nutritionist?.full_name?.charAt(0) || 'N'}
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div
                          className={`max-w-[70%] ${isFromPatient ? 'order-first' : ''}`}
                        >
                          <div
                            className={`rounded-lg px-4 py-2 ${
                              isFromPatient
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">
                              {message.message_text}
                            </p>
                          </div>
                          <p
                            className={`text-xs text-gray-500 mt-1 ${
                              isFromPatient ? 'text-right' : 'text-left'
                            }`}
                          >
                            {format(new Date(message.created_at), 'HH:mm', {
                              locale: ptBR,
                            })}
                          </p>
                        </div>

                        {isFromPatient && (
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarImage
                              src={userProfile?.profile_image_url || ''}
                            />
                            <AvatarFallback className="text-xs">
                              {userProfile?.full_name?.charAt(0) || 'P'}
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
                    onChange={e => setNewMessage(e.target.value)}
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
    </DashboardSidebar>
  )
}
