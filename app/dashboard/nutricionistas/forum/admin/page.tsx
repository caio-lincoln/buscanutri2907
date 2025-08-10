'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Trash2,
  Search,
  ArrowLeft,
  Database,
  AlertTriangle,
  CheckCircle,
  Users,
  MessageSquare,
  Heart,
} from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { ForumCleanupModal } from '@/components/forum-cleanup-modal'

interface ForumStats {
  totalQuestions: number
  totalAnswers: number
  totalLikes: number
  orphanQuestions: number
  orphanAnswers: number
  orphanLikes: number
}

export default function ForumAdminPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ForumStats | null>(null)
  const [cleanupModalOpen, setCleanupModalOpen] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        const user = await getCurrentUser()
        setCurrentUser(user)

        if (!user || user.user_type !== 'nutricionista') {
          router.push('/dashboard/nutricionistas/forum')
          return
        }

        await loadStats()
      } catch (error) {
        // Error loading data - handled silently
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const loadStats = async () => {
    try {
      // Get total counts
      const [questionsResult, answersResult, likesResult] = await Promise.all([
        supabase.from('forum_questions').select('id', { count: 'exact' }),
        supabase.from('forum_answers').select('id', { count: 'exact' }),
        supabase.from('forum_question_likes').select('id', { count: 'exact' }),
      ])

      // Get orphan questions (without valid author)
      const { data: orphanQuestions } = await supabase
        .from('forum_questions')
        .select('id')
        .is('patient_id', null)
        .is('nutritionist_id', null)

      // Get orphan answers (without valid question or author)
      const { data: orphanAnswers } = await supabase
        .from('forum_answers')
        .select('id, question_id, author_id')

      let orphanAnswersCount = 0
      if (orphanAnswers) {
        for (const answer of orphanAnswers) {
          // Check if question exists
          const { data: question } = await supabase
            .from('forum_questions')
            .select('id')
            .eq('id', answer.question_id)
            .single()

          // Check if author exists
          const { data: author } = await supabase
            .from('users')
            .select('id')
            .eq('id', answer.author_id)
            .single()

          if (!question || !author) {
            orphanAnswersCount++
          }
        }
      }

      // Get orphan likes
      const { data: questionLikes } = await supabase
        .from('forum_question_likes')
        .select('question_id, user_id')

      const { data: answerLikes } = await supabase
        .from('forum_answer_likes')
        .select('answer_id, user_id')

      let orphanLikesCount = 0

      if (questionLikes) {
        for (const like of questionLikes) {
          const { data: question } = await supabase
            .from('forum_questions')
            .select('id')
            .eq('id', like.question_id)
            .single()

          const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('id', like.user_id)
            .single()

          if (!question || !user) {
            orphanLikesCount++
          }
        }
      }

      if (answerLikes) {
        for (const like of answerLikes) {
          const { data: answer } = await supabase
            .from('forum_answers')
            .select('id')
            .eq('id', like.answer_id)
            .single()

          const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('id', like.user_id)
            .single()

          if (!answer || !user) {
            orphanLikesCount++
          }
        }
      }

      setStats({
        totalQuestions: questionsResult.count || 0,
        totalAnswers: answersResult.count || 0,
        totalLikes: (questionsResult.count || 0) + (answersResult.count || 0),
        orphanQuestions: orphanQuestions?.length || 0,
        orphanAnswers: orphanAnswersCount,
        orphanLikes: orphanLikesCount,
      })
    } catch (error) {
      // Error loading statistics - handled silently
    }
  }

  const handleCleanupSuccess = () => {
    loadStats() // Reload stats after cleanup
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando administração...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!currentUser || currentUser.user_type !== 'nutricionista') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-600 mb-4">
              Acesso negado. Apenas nutricionistas podem acessar esta página.
            </p>
            <Button
              onClick={() => router.push('/dashboard/nutricionistas/forum')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Fórum
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
                Administração do Fórum
              </h1>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Perguntas
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.totalQuestions || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Perguntas no fórum
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Respostas
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.totalAnswers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Respostas de nutricionistas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Curtidas
                </CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.totalLikes || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Curtidas em perguntas e respostas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Orphan Data Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Dados Órfãos Detectados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        Perguntas Órfãs
                      </p>
                      <p className="text-xs text-red-600">Sem autor válido</p>
                    </div>
                    <div className="text-2xl font-bold text-red-700">
                      {stats?.orphanQuestions || 0}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-orange-800">
                        Respostas Órfãs
                      </p>
                      <p className="text-xs text-orange-600">
                        Sem pergunta ou autor válido
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-orange-700">
                      {stats?.orphanAnswers || 0}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Curtidas Órfãs
                      </p>
                      <p className="text-xs text-yellow-600">
                        Sem item ou usuário válido
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-yellow-700">
                      {stats?.orphanLikes || 0}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    {(stats?.orphanQuestions || 0) +
                      (stats?.orphanAnswers || 0) +
                      (stats?.orphanLikes || 0) ===
                    0 ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-green-700 font-medium">
                          Nenhum dado órfão encontrado! O banco está limpo.
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <span className="text-orange-700 font-medium">
                          {(stats?.orphanQuestions || 0) +
                            (stats?.orphanAnswers || 0) +
                            (stats?.orphanLikes || 0)}{' '}
                          itens órfãos encontrados
                        </span>
                      </>
                    )}
                  </div>

                  <Button
                    onClick={() => setCleanupModalOpen(true)}
                    disabled={
                      (stats?.orphanQuestions || 0) +
                        (stats?.orphanAnswers || 0) +
                        (stats?.orphanLikes || 0) ===
                      0
                    }
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Executar Limpeza
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Instruções de Uso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  <strong>Dados Órfãos:</strong> São registros no banco de dados
                  que perderam suas referências válidas, como perguntas sem
                  autor, respostas sem pergunta associada, ou curtidas de itens
                  que não existem mais.
                </p>
                <p>
                  <strong>Limpeza Automática:</strong> A função de limpeza
                  remove apenas dados órfãos, preservando todas as informações
                  válidas. Esta operação é segura e não afeta o funcionamento
                  normal do fórum.
                </p>
                <p>
                  <strong>Edição e Exclusão:</strong> Nutricionistas podem
                  editar e excluir suas próprias postagens diretamente nas
                  páginas do fórum usando os menus de ações (⋮) ao lado de cada
                  postagem.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cleanup Modal */}
      <ForumCleanupModal
        isOpen={cleanupModalOpen}
        onClose={() => setCleanupModalOpen(false)}
        onSuccess={handleCleanupSuccess}
      />
    </div>
  )
}
