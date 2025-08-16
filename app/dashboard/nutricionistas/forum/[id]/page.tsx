'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ThumbsUp,
  MessageCircle,
  Search,
  Send,
  ArrowLeft,
  Shield,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
} from 'lucide-react'
import { EditForumModal } from '@/components/edit-forum-modal'
import { DeleteForumModal } from '@/components/delete-forum-modal'
import { ForumCleanupModal } from '@/components/forum-cleanup-modal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../../../../../contexts/auth-context'
import { User } from '@supabase/supabase-js'

interface Author {
  id: string
  name: string
  avatar?: string
  userType: 'nutricionista' | 'paciente'
  crn?: string
}

interface ForumQuestion {
  id: string
  title: string
  content: string
  category?: string
  author: Author
  timestamp: string
  likes: number
  views: number
  hasLiked: boolean
  replies: number
}

interface ForumReply {
  id: string
  content: string
  author: Author
  timestamp: string
  likes: number
  hasLiked: boolean
  isBestAnswer: boolean
}

export default function NutritionistForumQuestionPage() {
  const params = useParams()
  const router = useRouter()
  const questionId = params[ 'id' ] as string
  const { user } = useAuth()
  
  const [ currentUser, setCurrentUser ] = useState<User | null>(null)

  useEffect(() => {
    if (user) {
      setCurrentUser(user)
    }
  }, [user])

  // User and auth states

  // Filter and search states for replies
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'likes' | 'best'>('recent')

  // Data states
  const [question, setQuestion] = useState<ForumQuestion | null>(null)
  const [replies, setReplies] = useState<ForumReply[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Reply form states
  const [replyContent, setReplyContent] = useState('')
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [cleanupModalOpen, setCleanupModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<{
    type: 'question' | 'answer'
    id: string
    data: any
  } | null>(null)

  // Load user and question data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        // Fetch question from Supabase
        const { data: questionData, error: questionError } = await supabase
        .from('forum_questions')
        .select('*')
        .eq('id', questionId)
        .single()
        
        if (questionError) {
          throw questionError
        }

        if (questionData) {
          // Buscar perfil do autor separadamente
          let profile = null
          let isPatient = false

          if (questionData.patient_id) {
            const { data: patientProfile } = await supabase
              .from('patient_profiles')
              .select('id, full_name, profile_image_url, user_id')
              .eq('id', questionData.patient_id)
              .single()
            
            profile = patientProfile
            isPatient = true
          } else if (questionData.nutritionist_id) {
            const { data: nutritionistProfile } = await supabase
            .from('nutritionist_profiles')
            .select('id, full_name, profile_image_url, crn, user_id')
            .eq('id', questionData.nutritionist_id)
            .single()
            profile = nutritionistProfile
            isPatient = false
          }
          console.log("🚀 ~ loadData ~ profile:", profile)

          // Check if current user has liked this question
          let hasLikedQuestion = false
          if (currentUser) {
            const { data: questionLike } = await supabase
              .from('forum_question_likes')
              .select('id')
              .eq('question_id', questionData.id)
              .eq('user_id', currentUser.id)
              .single()
            hasLikedQuestion = !!questionLike
          }

          // Transform data to match interface
          const transformedQuestion: ForumQuestion = {
            id: questionData.id,
            title: questionData.title,
            content: questionData.content,
            category: questionData.category,
            author: {
              id: profile?.user_id || '',
              name: profile?.full_name || 'Usuário',
              avatar: profile?.profile_image_url || '/placeholder.svg',
              userType: isPatient ? 'paciente' : 'nutricionista',
              crn: !isPatient ? profile?.crn : undefined,
            },
            timestamp: questionData.created_at,
            likes: questionData.likes_count || 0,
            views: questionData.views_count || 0,
            hasLiked: hasLikedQuestion,
            replies: questionData.answers_count || 0,
          }

          setQuestion(transformedQuestion)

          // Increment view count
          const newViewCount = (questionData.views_count || 0) + 1
          await supabase
            .from('forum_questions')
            .update({ views_count: newViewCount })
            .eq('id', questionId)

          // Update local state with new view count
          setQuestion(prev =>
            prev
              ? {
                  ...prev,
                  views: newViewCount,
                }
              : null
          )

          // Load replies
          await loadReplies(currentUser)
        }
      } catch (err) {
        console.log("🚀 ~ loadData ~ err:", err)
        // Silent error handling for data loading
        setError('Erro ao carregar a pergunta')
      } finally {
        setLoading(false)
      }
    }

    if (questionId) {
      loadData()
    }
  }, [questionId])

  // Function to load replies
  const loadReplies = async (user: any = currentUser) => {
    try {
      const { data: repliesData, error: repliesError } = await supabase
        .from('forum_answers')
        .select(
          `
          *
        `
        )
        .eq('question_id', questionId)
        .order('created_at', { ascending: false })

      if (!repliesError && repliesData) {
        // Fetch nutritionist profiles and likes separately for each reply
        const repliesWithProfiles = await Promise.all(
          repliesData.map(async reply => {
            const { data: nutritionistProfile } = await supabase
              .from('nutritionist_profiles')
              .select('id, full_name, profile_image_url, crn, user_id')
              .eq('user_id', reply.author_id)
              .single()

            // Check if current user has liked this reply
            let hasLikedReply = false
            if (user) {
              const { data: replyLike } = await supabase
                .from('forum_answer_likes')
                .select('id')
                .eq('answer_id', reply.id)
                .eq('user_id', user.id)
                .single()
              hasLikedReply = !!replyLike
            }

            return {
              ...reply,
              nutritionist_profile: nutritionistProfile,
              hasLiked: hasLikedReply,
            }
          })
        )

        const transformedReplies: ForumReply[] = repliesWithProfiles.map(
          reply => {
            return {
              id: reply.id,
              content: reply.content,
              author: {
                id: reply.nutritionist_profile?.user_id || '',
                name: reply.nutritionist_profile?.full_name || 'Nutricionista',
                avatar:
                  reply.nutritionist_profile?.profile_image_url ||
                  '/placeholder.svg',
                userType: 'nutricionista',
                crn: reply.nutritionist_profile?.crn,
              },
              timestamp: reply.created_at,
              likes: reply.likes_count || 0,
              hasLiked: reply.hasLiked,
              isBestAnswer: reply.is_best_answer || false,
            }
          }
        )

        setReplies(transformedReplies)
      }
    } catch (error) {
      // Silent error handling for replies loading
    }
  }

  // Real-time subscriptions
  useEffect(() => {
    if (!questionId) return

    // Silent realtime subscription setup

    // Subscribe to forum_questions changes (likes and views)
    const questionSubscription = supabase
      .channel(`forum_question_${questionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'forum_questions',
          filter: `id=eq.${questionId}`,
        },
        payload => {
          // Silent realtime question update
          setQuestion(prev =>
            prev
              ? {
                  ...prev,
                  likes: payload.new.likes_count || 0,
                  views: payload.new.views_count || 0,
                  replies: payload.new.answers_count || 0,
                }
              : null
          )
        }
      )
      .subscribe(status => {
        // Silent subscription status
      })

    // Subscribe to forum_answers changes (new replies)
    const answersSubscription = supabase
      .channel(`forum_answers_${questionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'forum_answers',
          filter: `question_id=eq.${questionId}`,
        },
        payload => {
          // Silent realtime new answer
          loadReplies() // Reload replies when new answer is added
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'forum_answers',
          filter: `question_id=eq.${questionId}`,
        },
        payload => {
          // Silent realtime answer update
          setReplies(prev =>
            prev.map(reply =>
              reply.id === payload.new.id
                ? {
                    ...reply,
                    likes: payload.new.likes_count || 0,
                    isBestAnswer: payload.new.is_best_answer || false,
                  }
                : reply
            )
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'forum_answers',
          filter: `question_id=eq.${questionId}`,
        },
        payload => {
          // Silent realtime answer deletion
          setReplies(prev => prev.filter(reply => reply.id !== payload.old.id))
        }
      )
      .subscribe(status => {
        // Realtime answers subscription status
      })

    // Subscribe to forum_question_likes changes
    const questionLikesSubscription = supabase
      .channel(`forum_question_likes_${questionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'forum_question_likes',
          filter: `question_id=eq.${questionId}`,
        },
        payload => {
          // Question liked in real-time
          // Check if current user liked it
          if (currentUser && payload.new.user_id === currentUser.id) {
            setQuestion(prev =>
              prev
                ? {
                    ...prev,
                    hasLiked: true,
                  }
                : null
            )
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'forum_question_likes',
          filter: `question_id=eq.${questionId}`,
        },
        payload => {
          // Question like removed in real-time
          // Check if current user unliked it
          if (currentUser && payload.old.user_id === currentUser.id) {
            setQuestion(prev =>
              prev
                ? {
                    ...prev,
                    hasLiked: false,
                  }
                : null
            )
          }
        }
      )
      .subscribe(status => {
        // Question likes subscription status
      })

    // Subscribe to forum_answer_likes changes
    const answerLikesSubscription = supabase
      .channel(`forum_answer_likes_${questionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'forum_answer_likes',
        },
        payload => {
          // Answer liked in real-time
          // Check if current user liked it
          if (currentUser && payload.new.user_id === currentUser.id) {
            setReplies(prev =>
              prev.map(reply =>
                reply.id === payload.new.answer_id
                  ? { ...reply, hasLiked: true }
                  : reply
              )
            )
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'forum_answer_likes',
        },
        payload => {
          // Answer like removed in real-time
          // Check if current user unliked it
          if (currentUser && payload.old.user_id === currentUser.id) {
            setReplies(prev =>
              prev.map(reply =>
                reply.id === payload.old.answer_id
                  ? { ...reply, hasLiked: false }
                  : reply
              )
            )
          }
        }
      )
      .subscribe(status => {
        // Answer likes subscription status
      })

    // Cleanup subscriptions
    return () => {
      // Cleaning up realtime subscriptions
      questionSubscription.unsubscribe()
      answersSubscription.unsubscribe()
      questionLikesSubscription.unsubscribe()
      answerLikesSubscription.unsubscribe()
    }
  }, [questionId, currentUser])

  // Filter and sort replies
  const filteredAndSortedReplies = replies
    .filter(
      reply =>
        reply.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reply.author.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'likes':
          return b.likes - a.likes
        case 'best':
          if (a.isBestAnswer && !b.isBestAnswer) return -1
          if (!a.isBestAnswer && b.isBestAnswer) return 1
          return b.likes - a.likes
        case 'recent':
        default:
          return (
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
      }
    })

  // Handle like question
  const handleLikeQuestion = async () => {
    if (!currentUser || !question) return

    try {
      // Check if user already liked this question
      const { data: existingLike } = await supabase
        .from('forum_question_likes')
        .select('id')
        .eq('question_id', question.id)
        .eq('user_id', currentUser.id)
        .single()

      if (existingLike) {
        // Unlike: remove the like
        await supabase
          .from('forum_question_likes')
          .delete()
          .eq('id', existingLike.id)

        // Update question likes count
        const newLikesCount = Math.max(0, question.likes - 1)
        await supabase
          .from('forum_questions')
          .update({ likes_count: newLikesCount })
          .eq('id', question.id)
      } else {
        // Like: add the like
        await supabase.from('forum_question_likes').insert({
          question_id: question.id,
          user_id: currentUser.id,
        })

        // Update question likes count
        const newLikesCount = question.likes + 1
        await supabase
          .from('forum_questions')
          .update({ likes_count: newLikesCount })
          .eq('id', question.id)
      }
    } catch (error) {
      // Error liking question
    }
  }

  // Handle like reply
  const handleLikeReply = async (replyId: string) => {
    if (!currentUser) return

    try {
      // Check if user already liked this reply
      const { data: existingLike } = await supabase
        .from('forum_answer_likes')
        .select('id')
        .eq('answer_id', replyId)
        .eq('user_id', currentUser.id)
        .single()

      if (existingLike) {
        // Unlike: remove the like
        await supabase
          .from('forum_answer_likes')
          .delete()
          .eq('id', existingLike.id)

        // Update likes count in reply
        const currentReply = replies.find(r => r.id === replyId)
        if (currentReply) {
          const newLikesCount = Math.max(0, currentReply.likes - 1)
          await supabase
            .from('forum_answers')
            .update({ likes_count: newLikesCount })
            .eq('id', replyId)
        }

        // Update local state immediately for better UX
        setReplies(prev =>
          prev.map(reply =>
            reply.id === replyId ? { ...reply, hasLiked: false } : reply
          )
        )
      } else {
        // Like: add the like
        await supabase.from('forum_answer_likes').insert({
          answer_id: replyId,
          user_id: currentUser.id,
        })

        // Update likes count in reply
        const currentReply = replies.find(r => r.id === replyId)
        if (currentReply) {
          const newLikesCount = currentReply.likes + 1
          await supabase
            .from('forum_answers')
            .update({ likes_count: newLikesCount })
            .eq('id', replyId)
        }

        // Update local state immediately for better UX
        setReplies(prev =>
          prev.map(reply =>
            reply.id === replyId ? { ...reply, hasLiked: true } : reply
          )
        )
      }
    } catch (error) {
      // Silent error handling - error liking reply
    }
  }

  // Handle mark as best answer
  const handleMarkAsBest = async (replyId: string) => {
    if (!currentUser || !question || currentUser.id !== question.author.id)
      return

    try {
      // Remove best answer from all replies
      await supabase
        .from('forum_answers')
        .update({ is_best_answer: false })
        .eq('question_id', question.id)

      // Mark selected reply as best
      const { error } = await supabase
        .from('forum_answers')
        .update({ is_best_answer: true })
        .eq('id', replyId)

      if (!error) {
        setReplies(prev =>
          prev.map(reply => ({
            ...reply,
            isBestAnswer: reply.id === replyId,
          }))
        )
      }
    } catch (error) {
      // Silent error handling - error marking as best answer
    }
  }

  // Handle edit question
  const handleEditQuestion = () => {
    if (!question || !currentUser) return

    setEditingItem({
      type: 'question',
      id: question.id,
      data: {
        title: question.title,
        content: question.content,
        category: question.category,
        tags: [], // Add tags if available in your data structure
      },
    })
    setEditModalOpen(true)
  }

  // Handle edit answer
  const handleEditAnswer = (reply: ForumReply) => {
    if (!currentUser) return

    setEditingItem({
      type: 'answer',
      id: reply.id,
      data: {
        content: reply.content,
      },
    })
    setEditModalOpen(true)
  }

  // Handle delete question
  const handleDeleteQuestion = () => {
    if (!question || !currentUser) return

    setEditingItem({
      type: 'question',
      id: question.id,
      data: { title: question.title },
    })
    setDeleteModalOpen(true)
  }

  // Handle delete answer
  const handleDeleteAnswer = (reply: ForumReply) => {
    if (!currentUser) return

    setEditingItem({
      type: 'answer',
      id: reply.id,
      data: { title: reply.content.substring(0, 100) + '...' },
    })
    setDeleteModalOpen(true)
  }

  // Handle modal success
  const handleModalSuccess = () => {
    // Reload data
    window.location.reload()
  }

  // Handle submit reply
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser || !question || !replyContent.trim()) {
      alert('Por favor, preencha o conteúdo da resposta.')
      return
    }

    if (currentUser.user_type !== 'nutricionista') {
      alert('Apenas nutricionistas podem responder no fórum.')
      return
    }

    try {
      setIsSubmittingReply(true)

      // Get current user's nutritionist profile
      const { data: nutritionistProfile, error: profileError } = await supabase
        .from('nutritionist_profiles')
        .select('id, user_id, full_name, profile_image_url, crn')
        .eq('user_id', currentUser.id)
        .single()

      if (profileError || !nutritionistProfile) {
        throw new Error(
          'Perfil de nutricionista não encontrado. Verifique se seu perfil está completo.'
        )
      }

      const { data: newReply, error } = await supabase
        .from('forum_answers')
        .insert({
          question_id: question.id,
          content: replyContent.trim(),
          author_id: currentUser.id,
          nutritionist_id: nutritionistProfile.id,
        })
        .select('*')
        .single()

      if (error) {
        throw new Error(`Erro ao salvar resposta: ${error.message}`)
      }

      if (newReply) {
        setReplyContent('')
        alert('Resposta enviada com sucesso!')

        // The real-time subscription will handle updating the UI
        // No need to manually update state here
      }
    } catch (error) {
      // Silent error handling - error sending reply
      alert('Erro ao enviar resposta: ' + (error as Error).message)
    } finally {
      setIsSubmittingReply(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando pergunta...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !question) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-600 mb-4">
              {error || 'Pergunta não encontrada'}
            </p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/nutricionistas/forum')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Fórum
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">
                Discussão do Fórum
              </h1>
            </div>

            {currentUser?.user_type === 'nutricionista' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCleanupModalOpen(true)}
                className="text-orange-600 border-orange-600 hover:bg-orange-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Dados Órfãos
              </Button>
            )}
          </div>

          {/* Question Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={question.author.avatar} />
                    <AvatarFallback>
                      {question.author.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{question.author.name}</h3>
                      <Badge
                        variant={
                          question.author.userType === 'nutricionista'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {question.author.userType === 'nutricionista'
                          ? 'Nutricionista'
                          : 'Paciente'}
                      </Badge>
                      {question.author.userType === 'nutricionista' &&
                        question.author.crn && (
                          <Badge variant="outline" className="text-xs">
                            CRN: {question.author.crn}
                          </Badge>
                        )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(question.timestamp).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {currentUser?.id === question.author.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleEditQuestion}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar Pergunta
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleDeleteQuestion}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir Pergunta
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              <CardTitle className="text-xl">{question.title}</CardTitle>

              {question.category && (
                <Badge variant="secondary" className="w-fit">
                  {question.category}
                </Badge>
              )}
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {question.content}
                </p>

                <div className="flex items-center gap-6 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLikeQuestion}
                    disabled={question.hasLiked}
                    className={question.hasLiked ? 'text-blue-600' : ''}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    {question.likes}
                  </Button>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MessageCircle className="h-4 w-4" />
                    {replies.length} respostas
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Eye className="h-4 w-4" />
                    {question.views} visualizações
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reply Form - Only for nutritionists */}
          {currentUser?.user_type === 'nutricionista' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sua Resposta</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitReply} className="space-y-4">
                  <Textarea
                    placeholder="Compartilhe seu conhecimento e ajude este paciente..."
                    value={replyContent}
                    onChange={e => setReplyContent(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={!replyContent.trim() || isSubmittingReply}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSubmittingReply ? 'Enviando...' : 'Responder'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Access restriction message for non-nutritionists */}
          {currentUser?.user_type !== 'nutricionista' && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-md border border-blue-200">
              <Shield className="h-4 w-4" />
              <span className="font-medium">
                Apenas nutricionistas podem responder no fórum
              </span>
            </div>
          )}

          {/* Replies Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Respostas ({replies.length})
              </h2>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar respostas..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="recent">Mais recentes</option>
                  <option value="likes">Mais curtidas</option>
                  <option value="best">Melhor resposta</option>
                </select>
              </div>
            </div>

            {filteredAndSortedReplies.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm
                      ? 'Nenhuma resposta encontrada'
                      : 'Ainda não há respostas para esta pergunta'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedReplies.map(reply => (
                  <Card
                    key={reply.id}
                    className={
                      reply.isBestAnswer ? 'border-green-200 bg-green-50' : ''
                    }
                  >
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={reply.author.avatar} />
                              <AvatarFallback>
                                {reply.author.name
                                  .split(' ')
                                  .map(n => n[0])
                                  .join('')
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">
                                  {reply.author.name}
                                </h4>
                                <Badge
                                  variant={
                                    reply.author.userType === 'nutricionista'
                                      ? 'default'
                                      : 'secondary'
                                  }
                                >
                                  {reply.author.userType === 'nutricionista'
                                    ? 'Nutricionista'
                                    : 'Paciente'}
                                </Badge>
                                {reply.author.userType === 'nutricionista' &&
                                  reply.author.crn && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      CRN: {reply.author.crn}
                                    </Badge>
                                  )}
                                {reply.isBestAnswer && (
                                  <Badge
                                    variant="default"
                                    className="bg-green-600"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Melhor Resposta
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">
                                {new Date(reply.timestamp).toLocaleDateString(
                                  'pt-BR'
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {currentUser?.id === question.author.id &&
                              !reply.isBestAnswer && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMarkAsBest(reply.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Marcar como melhor
                                </Button>
                              )}

                            {currentUser?.id === reply.author.id && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleEditAnswer(reply)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar Resposta
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteAnswer(reply)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir Resposta
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>

                        <p className="text-gray-700 whitespace-pre-wrap">
                          {reply.content}
                        </p>

                        <div className="flex items-center gap-4 pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLikeReply(reply.id)}
                            disabled={reply.hasLiked}
                            className={reply.hasLiked ? 'text-blue-600' : ''}
                          >
                            <ThumbsUp className="h-4 w-4 mr-2" />
                            {reply.likes}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {editingItem && (
        <EditForumModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false)
            setEditingItem(null)
          }}
          onSuccess={handleModalSuccess}
          type={editingItem.type}
          itemId={editingItem.id}
          userId={currentUser?.id || ''}
          initialData={editingItem.data}
        />
      )}

      {editingItem && (
        <DeleteForumModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false)
            setEditingItem(null)
          }}
          onSuccess={handleModalSuccess}
          type={editingItem.type}
          itemId={editingItem.id}
          userId={currentUser?.id || ''}
          itemTitle={editingItem.data.title}
        />
      )}

      <ForumCleanupModal
        isOpen={cleanupModalOpen}
        onClose={() => setCleanupModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}
