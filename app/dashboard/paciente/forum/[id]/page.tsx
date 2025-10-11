'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
  Trash2,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/components/ui/use-toast'
import { createSupabaseClient } from '@/lib/supabase'

import {
  type ForumQuestion,
  getForumQuestionById,
  createForumAnswer,
  likeForumItem,
} from '@/lib/forum-data'
import { getCurrentUser } from '@/lib/auth'

// Função para formatar datas de forma segura
const formatQuestionDate = (timestamp: string): string => {
  try {
    // Se o timestamp for undefined ou null
    if (!timestamp) {
      return 'Data não disponível'
    }
    
    // Se o timestamp já está formatado (contém espaços ou barras), retorna como está
    if (timestamp.includes('/') || timestamp.includes(' ')) {
      return timestamp
    }
    
    // Caso contrário, tenta converter de ISO string
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) {
      return 'Data inválida'
    }
    
    return date.toLocaleDateString('pt-BR')
  } catch (error) {
    return 'Data inválida'
  }
}

import React from 'react'
export default function PatientForumQuestionPage(props: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id: questionId } = React.use(props.params)

  const [question, setQuestion] = useState<ForumQuestion | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentPatientProfile, setCurrentPatientProfile] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState<'recent' | 'likes' | 'best'>('recent')
  const [replyContent, setReplyContent] = useState('')
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)

  const filteredAndSortedReplies = useMemo(() => {
    const base = question?.replies || []
    const normalizedTerm = searchTerm.trim().toLowerCase()

    let filtered = normalizedTerm
      ? base.filter(r =>
          (r.content || '').toLowerCase().includes(normalizedTerm) ||
          ((r.author?.name || '').toLowerCase().includes(normalizedTerm))
        )
      : base

    if (sortOrder === 'likes') {
      filtered = [...filtered].sort((a, b) => (b.likes || 0) - (a.likes || 0))
    } else if (sortOrder === 'best') {
      filtered = [...filtered].sort((a, b) => Number(b.isBestAnswer) - Number(a.isBestAnswer))
    } else {
      // recent
      filtered = [...filtered].sort((a, b) => {
        const ta = new Date(a.timestamp || 0).getTime()
        const tb = new Date(b.timestamp || 0).getTime()
        return tb - ta
      })
    }

    return filtered
  }, [question?.replies, searchTerm, sortOrder])

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await getCurrentUser()
        setCurrentUser(user)
        
        // Buscar o perfil do paciente atual
        if (user) {
          const supabaseClient = createSupabaseClient()
          const { data: patientProfile } = await supabaseClient
            .from('patient_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()
          
          setCurrentPatientProfile(patientProfile)
          console.log('Current user:', user)
          console.log('Current patient profile:', patientProfile)
        }

        const questionData = await getForumQuestionById(questionId)

        // Enriquecer com estados de curtida reais para o usuário atual
        if (user && questionData) {
          const supabaseClient = createSupabaseClient()
          // Curtida da pergunta
          let hasLikedQuestion = false
          try {
            const { data: qLike } = await supabaseClient
              .from('forum_question_likes')
              .select('id')
              .eq('question_id', questionId)
              .eq('user_id', user.id)
              .single()
            hasLikedQuestion = !!qLike
          } catch (_) {
            hasLikedQuestion = false
          }

          // Curtidas nas respostas
          const replyIds = (questionData.replies || []).map(r => r.id)
          let likedRepliesSet = new Set<string>()
          if (replyIds.length > 0) {
            try {
              const { data: replyLikes } = await supabaseClient
                .from('forum_answer_likes')
                .select('answer_id')
                .eq('user_id', user.id)
                .in('answer_id', replyIds)
              likedRepliesSet = new Set(
                (replyLikes || []).map((rl: any) => rl.answer_id)
              )
            } catch (_) {
              likedRepliesSet = new Set<string>()
            }
          }

          const enrichedReplies = (questionData.replies || []).map(r => ({
            ...r,
            hasLiked: likedRepliesSet.has(r.id),
          }))

          setQuestion({
            ...questionData,
            hasLiked: hasLikedQuestion,
            replies: enrichedReplies,
          })
        } else {
          setQuestion(questionData)
        }
        console.log('Question data:', questionData)
        console.log('Question author:', questionData?.author)
        
        if (user && questionData) {
          console.log('User ID (auth):', user.id)
          console.log('Question author ID (profile):', questionData.author?.id)
          console.log('Patient profile ID:', currentPatientProfile?.id)
          console.log('Can delete?', currentPatientProfile?.id === questionData.author?.id)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
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

        // Recalcular estados de curtida reais para o usuário
        if (updatedQuestion) {
          const supabaseClient = createSupabaseClient()

          // Pergunta
          let hasLikedQuestion = false
          try {
            const { data: qLike } = await supabaseClient
              .from('forum_question_likes')
              .select('id')
              .eq('question_id', questionId)
              .eq('user_id', currentUser.id)
              .single()
            hasLikedQuestion = !!qLike
          } catch (_) {
            hasLikedQuestion = false
          }

          // Respostas
          const replyIds = (updatedQuestion.replies || []).map(r => r.id)
          let likedRepliesSet = new Set<string>()
          if (replyIds.length > 0) {
            try {
              const { data: replyLikes } = await supabaseClient
                .from('forum_answer_likes')
                .select('answer_id')
                .eq('user_id', currentUser.id)
                .in('answer_id', replyIds)
              likedRepliesSet = new Set(
                (replyLikes || []).map((rl: any) => rl.answer_id)
              )
            } catch (_) {
              likedRepliesSet = new Set<string>()
            }
          }

          const enrichedReplies = (updatedQuestion.replies || []).map(r => ({
            ...r,
            hasLiked: likedRepliesSet.has(r.id),
          }))

          setQuestion({
            ...updatedQuestion,
            hasLiked: hasLikedQuestion,
            replies: enrichedReplies,
          })
        } else {
          setQuestion(updatedQuestion)
        }
      }
    } catch (error) {
      // Error liking item - handled silently
    }
  }

  const handleDeleteQuestion = async () => {
    if (!currentUser || !currentPatientProfile || currentPatientProfile.id !== question?.author?.id) {
      toast({
        title: 'Erro',
        description: 'Você não tem permissão para deletar esta pergunta.',
        variant: 'destructive',
      })
      return
    }

    try {
      const supabaseClient = createSupabaseClient()
      
      // Delete the question (replies will be deleted by cascade)
      const { error } = await supabaseClient
        .from('forum_questions')
        .delete()
        .eq('id', questionId)
        .eq('author_id', currentUser.id) // Extra security check

      if (error) {
        throw error
      }

      toast({
        title: 'Pergunta deletada',
        description: 'Sua pergunta foi removida com sucesso.',
      })

      // Redirect back to forum
       router.push('/dashboard/paciente?activeTab=forum')
    } catch (error) {
      console.error('Error deleting question:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível deletar a pergunta. Tente novamente.',
        variant: 'destructive',
      })
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
                    {formatQuestionDate(question.timestamp)}
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
                  className={`flex items-center gap-1 ${question.hasLiked ? 'text-[#D90D32]' : ''}`}
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
              
              {/* Delete button - only visible to question author */}
              {currentPatientProfile && currentPatientProfile.id === question.author?.id && (
                <div className="flex items-center">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir pergunta</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir esta pergunta? Esta ação não pode ser desfeita e todas as respostas também serão removidas.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteQuestion}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
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
                          {formatQuestionDate(reply.timestamp)}
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
                      className={`flex items-center gap-1 ${reply.hasLiked ? 'text-[#D90D32]' : ''}`}
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
