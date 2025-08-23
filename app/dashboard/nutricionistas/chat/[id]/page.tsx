'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowLeft, Send, Paperclip, ImageIcon, Phone, Video, MoreVertical } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import {
  getChatMessages,
  sendChatMessage,
  type ChatMessage,
  type ChatConversation,
} from '@/lib/chat-forum-service'
import { createSupabaseClient } from '@/lib/supabase'
import { toast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { DashboardSidebar, getMenuItems } from '@/components/dashboard-sidebar'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'

export default function NutritionistChatPage() {
  const { user, loading: authLoading, signOut, nutritionistProfile: nutritionistProfile } = useAuth()
  // const [ nutritionistProfile, setNutritionistProfile ] = useState<any>(authNutriProfile ?? null)
  const [ conversation, setConversation ] = useState<ChatConversation | null>(null)
  const [ messages, setMessages ] = useState<ChatMessage[]>([])
  const [ newMessage, setNewMessage ] = useState('')
  const [ loading, setLoading ] = useState(true)
  const [ sending, setSending ] = useState(false)

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const params = useParams()
  const router = useRouter()
  const conversationId = params?.id as string

  const supabase = useMemo(() => createSupabaseClient(), [])
  const seenIdsRef = useRef<Set<string>>(new Set())

  // Dashboard
  const { stats } = useDashboardStats({
    userType: 'nutricionista',
    userId: user?.id || '',
    enabled: !!user?.id,
  })
  const menuItems = getMenuItems('nutricionista', stats)

  useEffect(() => {
    if (!authLoading && user) {
      loadChatData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ conversationId, user, authLoading ])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ messages ])

  useEffect(() => {
    if (!conversation) return
    const cleanup = setupRealtimeSubscription()
    return cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ conversation ])

  const loadChatData = async () => {
    try {
      setLoading(true)
      if (!user) {
        router.push('/login')
        return
      }

      // 1) garantir perfil do nutricionista (precisamos do ID do perfil)
      if (!nutritionistProfile) {
        throw new Error('Perfil de nutricionista não encontrado.')
      }

      const npId = (nutritionistProfile ?? {}).id as string
        ?? (() => { throw new Error('Perfil de nutricionista inválido') })()

      // 2) conversa (você pode deixar só .eq('id', conversationId) pois a RLS já filtra)
      const { data: conversationData, error: conversationError } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('nutritionist_id', npId)            // <- usa ID do perfil
        .maybeSingle()

      if (conversationError || !conversationData) {
        toast({
          title: 'Erro',
          description: 'Conversa não encontrada ou acesso negado.',
          variant: 'destructive',
        })
        router.push('/dashboard/nutricionistas')
        return
      }

      // 3) perfil do paciente para header
      const { data: patientProfile } = await supabase
        .from('patient_profiles')
        .select('full_name, profile_image_url')
        .eq('id', conversationData.patient_id)
        .maybeSingle()

      setConversation({
        ...conversationData,
        patient_profiles: patientProfile ?? null,
      } as any)

      // 4) mensagens
      const chatMessages = await getChatMessages(conversationId, user.id, 'nutritionist')
      setMessages(chatMessages)
      seenIdsRef.current = new Set(chatMessages.map(m => m.id))
    } catch (err) {
      console.log("🚀 ~ loadChatData ~ err:", err)
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
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const msg = payload.new as ChatMessage
          if (seenIdsRef.current.has(msg.id)) return
          seenIdsRef.current.add(msg.id)
          setMessages(prev => [ ...prev, msg ])
        }
      )
      .subscribe()

    return () => channel.unsubscribe()
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !conversation || sending) return
    try {
      setSending(true)
      const message = await sendChatMessage(conversationId, user.id, 'nutritionist', newMessage.trim())
      setNewMessage('')
      // não faça setMessages aqui — o Realtime vai adicionar
    } catch (e) {
      toast({ title: 'Erro', description: 'Erro ao enviar mensagem.', variant: 'destructive' })
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

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch { }
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
          <Link href="/dashboard/nutricionistas">
            <Button>Voltar ao Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const patient = (conversation as any).patient_profiles

  return (
    // <DashboardSidebar
    //   userType="nutricionista"
    //   userName={nutritionistProfile?.full_name || 'Nutricionista'}
    //   userAvatar={nutritionistProfile?.profile_image_url || '/placeholder.svg'}
    //   menuItems={menuItems}
    //   activeItem="chat"
    //   onItemClick={() => { }}
    //   onSignOut={handleSignOut}
    // >
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 rounded-lg shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/dashboard/nutricionistas">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                </Link>

                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={patient?.profile_image_url || ''} />
                    <AvatarFallback>{patient?.full_name?.charAt(0) || 'P'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="font-semibold text-gray-900">{patient?.full_name || 'Paciente'}</h1>
                    <span className="text-sm text-gray-500">Paciente</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm"><Phone className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm"><Video className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat */}
        <Card className="h-[calc(100vh-200px)] flex flex-col">
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map(message => {
                  const isFromNutritionist = message.sender_type === 'nutritionist'
                  return (
                    <div key={message.id} className={`flex gap-3 ${isFromNutritionist ? 'justify-end' : 'justify-start'}`}>
                      {!isFromNutritionist && (
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarImage src={patient?.profile_image_url || ''} />
                          <AvatarFallback className="text-xs">{patient?.full_name?.charAt(0) || 'P'}</AvatarFallback>
                        </Avatar>
                      )}

                      <div className={`max-w-[70%] ${isFromNutritionist ? 'order-first' : ''}`}>
                        <div className={`rounded-lg px-4 py-2 ${isFromNutritionist ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                          <p className="text-sm whitespace-pre-wrap">{message.message_text}</p>
                        </div>
                        <p className={`text-xs text-gray-500 mt-1 ${isFromNutritionist ? 'text-right' : 'text-left'}`}>
                          {format(new Date(message.created_at), 'HH:mm', { locale: ptBR })}
                        </p>
                      </div>

                      {isFromNutritionist && (
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarImage src={nutritionistProfile?.profile_image_url || ''} />
                          <AvatarFallback className="text-xs">
                            {nutritionistProfile?.full_name?.charAt(0) || 'N'}
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

          <div className="border-t border-gray-200 p-4">
            <div className="flex items-end gap-2">
              <Button variant="outline" size="sm" className="mb-2"><Paperclip className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" className="mb-2"><ImageIcon className="h-4 w-4" /></Button>
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
              <Button onClick={handleSendMessage} disabled={!newMessage.trim() || sending} className="mb-2">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    // </DashboardSidebar>
  )
}
