'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  MessageSquare,
  ArrowLeft,
  Search,
  Clock,
  User,
  Send,
  Eye,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { DashboardSidebar, getMenuItems } from '@/components/dashboard-sidebar'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'

// Tipo para conversas
interface ChatConversation {
  id: string
  patientName: string
  patientAvatar?: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  status: 'active' | 'archived' | 'pending'
  patientId: string
}

export default function ConversasPage() {
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  const router = useRouter()
  const { user, nutritionistProfile, loading: authLoading, signOut } = useAuth()
  const profile = nutritionistProfile

  // Hook para estatísticas dinâmicas do dashboard
  const { stats: dashboardStats } = useDashboardStats({
    userType: 'nutricionista',
    userId: profile?.user_id || '',
    enabled: !!profile?.user_id,
  })

  const menuItems = getMenuItems('nutricionista', dashboardStats)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (profile?.user_id) {
      loadConversations()
    }
  }, [user, authLoading, profile?.user_id])

  const loadConversations = async () => {
    if (!profile?.user_id) return

    try {
      setLoading(true)
      // Simulação de dados - substituir pela chamada real da API
      const mockConversations: ChatConversation[] = [
        {
          id: '1',
          patientName: 'Maria Silva',
          patientAvatar: '/placeholder.svg',
          lastMessage: 'Obrigada pelas orientações! Vou seguir a dieta.',
          lastMessageTime: '2024-01-15T10:30:00Z',
          unreadCount: 0,
          status: 'active',
          patientId: 'patient-1',
        },
        {
          id: '2',
          patientName: 'João Santos',
          lastMessage: 'Posso substituir o frango por peixe?',
          lastMessageTime: '2024-01-15T09:15:00Z',
          unreadCount: 2,
          status: 'active',
          patientId: 'patient-2',
        },
        {
          id: '3',
          patientName: 'Ana Costa',
          lastMessage: 'Boa tarde! Tenho uma dúvida sobre os suplementos.',
          lastMessageTime: '2024-01-14T16:45:00Z',
          unreadCount: 1,
          status: 'pending',
          patientId: 'patient-3',
        },
        {
          id: '4',
          patientName: 'Carlos Lima',
          lastMessage: 'Muito obrigado pela consulta!',
          lastMessageTime: '2024-01-14T14:20:00Z',
          unreadCount: 0,
          status: 'archived',
          patientId: 'patient-4',
        },
        {
          id: '5',
          patientName: 'Fernanda Oliveira',
          lastMessage: 'Consegui perder 2kg seguindo suas orientações!',
          lastMessageTime: '2024-01-13T11:30:00Z',
          unreadCount: 0,
          status: 'active',
          patientId: 'patient-5',
        },
      ]
      setConversations(mockConversations)
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const handleOpenChat = (conversation: ChatConversation) => {
    router.push(`/dashboard/nutricionistas/chat/${conversation.id}`)
  }

  // Filtrar conversas baseado na busca e filtro de status
  const filteredConversations = conversations.filter((conversation) => {
    const matchesSearch = conversation.patientName
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || conversation.status === filterStatus
    return matchesSearch && matchesStatus
  })

  // Paginação
  const totalPages = Math.ceil(filteredConversations.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedConversations = filteredConversations.slice(
    startIndex,
    startIndex + itemsPerPage
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'archived':
        return 'bg-gray-50 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativa'
      case 'pending':
        return 'Pendente'
      case 'archived':
        return 'Arquivada'
      default:
        return status
    }
  }

  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      return 'Agora'
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d atrás`
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-500 mx-auto"></div>
          <p className="text-[#1E1D40]/70 font-medium">
            Carregando conversas...
          </p>
        </div>
      </div>
    )
  }

  return (
    <DashboardSidebar
      userType="nutricionista"
      userName={profile?.full_name || 'Nutricionista'}
      userAvatar={profile?.profile_image_url || '/placeholder.svg'}
      menuItems={menuItems}
      activeItem="conversas"
      onItemClick={(itemId) => {
        if (itemId === 'overview') {
          router.push('/dashboard/nutricionistas')
        } else if (itemId === 'perfil' && profile?.id) {
          router.push(`/dashboard/nutricionistas/${profile.id}`)
        }
      }}
      onSignOut={handleSignOut}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/nutricionistas')}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-[#1E1D40]">
                Todas as Conversas
              </h1>
              <p className="text-gray-600 mt-1">
                Gerencie suas conversas com pacientes
              </p>
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome do paciente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                >
                  Todas
                </Button>
                <Button
                  variant={filterStatus === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('active')}
                >
                  Ativas
                </Button>
                <Button
                  variant={filterStatus === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('pending')}
                >
                  Pendentes
                </Button>
                <Button
                  variant={filterStatus === 'archived' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('archived')}
                >
                  Arquivadas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Conversas */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversas ({filteredConversations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {paginatedConversations.length > 0 ? (
              <div className="space-y-4">
                {paginatedConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleOpenChat(conversation)}
                    className="flex items-center justify-between p-6 rounded-xl bg-gradient-to-r from-blue-50/50 to-blue-100/30 hover:shadow-md transition-all duration-300 group cursor-pointer gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Avatar className="h-12 w-12 border-2 border-white shadow-md group-hover:scale-105 transition-transform duration-300">
                        <AvatarImage
                          src={conversation.patientAvatar}
                          alt={conversation.patientName}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                          {conversation.patientName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-[#1E1D40] truncate">
                            {conversation.patientName}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <Badge className="bg-red-500 text-white text-xs px-2 py-1">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate mb-1">
                          {conversation.lastMessage}
                        </p>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <p className="text-xs text-gray-500">
                            {formatTime(conversation.lastMessageTime)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge
                        variant="outline"
                        className={getStatusColor(conversation.status)}
                      >
                        {getStatusText(conversation.status)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-blue-100"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenChat(conversation)
                        }}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">
                  {searchTerm || filterStatus !== 'all'
                    ? 'Nenhuma conversa encontrada'
                    : 'Nenhuma conversa iniciada'}
                </p>
                <p className="text-gray-400 text-sm">
                  {searchTerm || filterStatus !== 'all'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Suas conversas com pacientes aparecerão aqui'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>
    </DashboardSidebar>
  )
}