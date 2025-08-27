// app/dashboard/nutricionistas/_components/NutritionistRecentChatsList.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MessageSquare, Clock, ArrowRight, Calendar } from 'lucide-react'
import {
  getNutritionistChatConversations,
  type ChatConversation,
} from '@/lib/chat-forum-service'
import { useAuth } from '../../../../contexts/auth-context'

interface Props {
  userId: string
}

export default function NutritionistRecentChatsList({ userId }: Props) {
  const [ recentConversations, setRecentConversations ] = useState<ChatConversation[]>([])
  const [ loading, setLoading ] = useState(true)
  const { nutritionistProfile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchRecent = async () => {
      setLoading(true)
      try {
        if (!nutritionistProfile?.id) return
        const list = await getNutritionistChatConversations(nutritionistProfile.id)
        setRecentConversations(list.slice(0, 5))
      } finally {
        setLoading(false)
      }
    }
    if (userId) fetchRecent()
  }, [ userId, nutritionistProfile?.id ])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Ontem'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('pt-BR', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 flex flex-col items-center justify-center min-h-[100vh]">
        <div className=" animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-500 mx-auto mb-4" />
        <p className="text-gray-600">Carregando seus chats...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">
            Meus Chats
          </h1>
          <p className="text-gray-600">
            Converse com seus pacientes e acompanhe as conversas recentes
          </p>
        </div>
      </div>

      <Card className="border-0 shadow-lg backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <span>Conversas Recentes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentConversations.length > 0 ? (
            recentConversations.map(conversation => (
              <div
                key={conversation.id}
                className="flex items-center justify-between p-4 border rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors duration-200 cursor-pointer group"
                onClick={() => router.push(`/dashboard/nutricionistas/chat/${conversation.id}`)}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 ring-2 ring-gray-200 shadow-md group-hover:scale-105 transition-transform duration-200">
                    <AvatarImage
                      src={
                        conversation.patient_profiles?.profile_image_url ||
                        '/placeholder.svg'
                      }
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                      {conversation.patient_profiles?.full_name?.charAt(0) || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1E1D40]">
                      {conversation.patient_profiles?.full_name || 'Paciente'}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.last_message?.message_text || 'Nenhuma mensagem ainda'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>
                    {formatDate(conversation.last_message_at || conversation.created_at)}
                  </span>
                  <ArrowRight className="h-4 w-4 ml-2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum chat recente
              </h3>
              <p className="text-gray-600 mb-4">
                Suas conversas com pacientes aparecerão aqui.
              </p>
              <Button onClick={() => router.push('/dashboard/nutricionistas?activeTab=teleconsultas')}>
                <Calendar className="h-4 w-4 mr-2" />
                Abrir Teleconsultas
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
