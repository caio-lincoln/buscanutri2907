'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MessageSquare,
  ThumbsUp,
  MessageCircle,
  Eye,
  ArrowLeft,
  Award,
  CheckCircle,
  Send,
  Search,
  Filter,
  ArrowDownWideNarrow,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/components/ui/use-toast'

import {
  type ForumQuestion,
  getForumQuestionById,
  createForumAnswer,
  likeForumItem,
} from '@/lib/forum-data'
import { getCurrentUser } from '@/lib/auth'

export default function PatientForumQuestionPage() {
  const params = useParams()
  const router = useRouter()
  const questionId = params.id as string

  const [question, setQuestion] = useState<ForumQuestion | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState('recent')

  // Função para filtrar e ordenar respostas
  const applyFiltersAndSort = (
    replies: any[],
    searchTerm: string,
    sortOrder: string
  ) => {
    if (!replies) return []

    let filteredReplies = [...replies]

    // Aplicar busca
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filteredReplies = filteredReplies.filter(
        reply =>
          reply.content?.toLowerCase().includes(searchLower) ||
          reply.author?.name?.toLowerCase().includes(searchLower)
      )
    }

    // Aplicar ordenação
    switch (sortOrder) {
      case 'recent':
        filteredReplies.sort(
          (a, b) =>
            new Date(b.timestamp || 0).getTime() -
            new Date(a.timestamp || 0).getTime()
        )
        break
      case 'likes':
        filteredReplies.sort((a, b) => (b.likes || 0) - (a.likes || 0))
        break
      case 'best':
        filteredReplies.sort((a, b) => {
          if (a.isBestAnswer && !b.isBestAnswer) return -1
          if (!a.isBestAnswer && b.isBestAnswer) return 1
          return (b.likes || 0) - (a.likes || 0)
        })
        break
      default:
        break
    }

    return filteredReplies
  }

  // Memorizar respostas filtradas e ordenadas
  const filteredAndSortedReplies = useMemo(
    () => applyFiltersAndSort(question?.replies || [], searchTerm, sortOrder),
    [question?.replies, searchTerm, sortOrder]
  )

  useEffect(() => {
    const loadQuestion = async () => {
      try {
        const questionData = await getForumQuestionById(questionId)
        setQuestion(questionData)

        const user = await getCurrentUser()
        setCurrentUser(user)
      } catch (error) {
      // Error loading question - handled silently
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar a pergunta.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    if (questionId) {
      loadQuestion()
    }
  }, [questionId])

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !currentUser) return

    // Verificar se o usuário é nutricionista
    if (currentUser.user_type !== 'nutritionist') {
      toast({
        title: 'Erro',
        description: 'Apenas nutricionistas podem responder no fórum.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmittingReply(true)
    try {
      const newReply = await createForumAnswer(
        questionId,
        replyContent,
        currentUser.id
      )
      if (newReply) {
        // Reload question to show new reply
        const updatedQuestion = await getForumQuestionById(questionId)
        setQuestion(updatedQuestion)
        setReplyContent('')
        toast({
          title: 'Resposta enviada!',
          description: 'Sua resposta foi publicada com sucesso.',
        })
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível enviar sua resposta.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      // Error submitting reply - handled silently
      toast({
        title: 'Erro',
        description: 'Apenas nutricionistas podem responder no fórum.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const handleLike = async (itemId: string, type: 'question' | 'reply') => {
    if (!currentUser) return

    try {
      const success = await likeForumItem(itemId, type, currentUser.id)
      if (success) {
        // Reload question to reflect updated likes
        const updatedQuestion = await getForumQuestionById(questionId)
        setQuestion(updatedQuestion)
      }
    } catch (error) {
      // Error liking item - handled silently
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Pergunta não encontrada
          </h1>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Fórum
          </Button>
        </div>

        {/* Question Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={question.author?.avatar} />
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {(question.author?.name || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[#1E1D40]">
                      {question.author?.name || 'Usuário Anônimo'}
                    </p>
                    {question.author?.userType === 'nutricionista' &&
                      question.author?.isVerified && (
                        <Award className="h-4 w-4 text-yellow-500" />
                      )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(question.timestamp).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <Badge variant="outline">{question.category || 'Geral'}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <h1 className="text-2xl font-bold text-[#1E1D40]">
              {question.title}
            </h1>
            <p className="text-gray-700 whitespace-pre-wrap">
              {question.content}
            </p>

            {question.tags && question.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {question.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(question.id, 'question')}
                  className="flex items-center gap-1"
                >
                  <ThumbsUp className="h-4 w-4" />
                  {question.likes || 0} Curtir
                </Button>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {question.repliesCount || 0} Respostas
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {question.views || 0} Visualizações
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Replies Section */}
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-[#1E1D40]">
              Respostas ({question.repliesCount || 0})
            </h2>

            {question.replies && question.replies.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar nas respostas..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-full sm:w-48">
                    <ArrowDownWideNarrow className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Mais Recentes</SelectItem>
                    <SelectItem value="likes">Mais Curtidas</SelectItem>
                    <SelectItem value="best">Melhores Primeiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {filteredAndSortedReplies.length > 0 ? (
            filteredAndSortedReplies.map(reply => (
              <Card key={reply.id} className="ml-4">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={reply.author?.avatar} />
                        <AvatarFallback className="bg-green-100 text-green-700">
                          {(reply.author?.name || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-[#1E1D40]">
                            {reply.author?.name || 'Usuário Anônimo'}
                          </p>
                          {reply.author?.userType === 'nutricionista' &&
                            reply.author?.isVerified && (
                              <Award className="h-4 w-4 text-yellow-500" />
                            )}
                          {reply.isBestAnswer && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(reply.timestamp).toLocaleDateString(
                            'pt-BR'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap mb-4">
                    {reply.content}
                  </p>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(reply.id, 'reply')}
                      className="flex items-center gap-1"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      {reply.likes || 0} Curtir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : question.replies && question.replies.length > 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhuma resposta encontrada com os filtros aplicados.
            </p>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Ainda não há respostas para esta pergunta. Seja o primeiro a
              responder!
            </p>
          )}

          {/* Reply Form */}
          {currentUser && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-[#1E1D40]">
                  Sua Resposta
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder={
                    currentUser.user_type === 'nutritionist'
                      ? 'Digite sua resposta aqui...'
                      : 'Apenas nutricionistas podem responder no fórum. Esta funcionalidade está bloqueada para pacientes.'
                  }
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                  rows={4}
                  disabled={currentUser.user_type !== 'nutritionist'}
                />
                {currentUser.user_type !== 'nutritionist' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Informação:</strong> Apenas nutricionistas
                      verificados podem responder às perguntas do fórum. Esta
                      medida garante que as respostas sejam fornecidas por
                      profissionais qualificados.
                    </p>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitReply}
                    disabled={
                      !replyContent.trim() ||
                      isSubmittingReply ||
                      currentUser.user_type !== 'nutritionist'
                    }
                    className="bg-[#D90D32] hover:bg-[#D90D32]/90"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {currentUser.user_type !== 'nutritionist'
                      ? 'Bloqueado'
                      : isSubmittingReply
                        ? 'Enviando...'
                        : 'Enviar Resposta'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
