'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  DollarSign,
  Users,
  Activity,
  Eye,
  Heart,
  MessageCircle,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/use-user'
import {
  getContentEngagementStats,
  type ContentEngagementStats,
} from '@/lib/content-engagement-service'
import { Skeleton } from '@/components/ui/skeleton'

export function ReportsTab() {
  const { user } = useUser()
  const [engagementStats, setEngagementStats] =
    useState<ContentEngagementStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadEngagementData = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        const stats = await getContentEngagementStats(user.id)
        setEngagementStats(stats)
      } catch (error) {
        // Silent error handling: Error loading engagement data
      } finally {
        setLoading(false)
      }
    }

    loadEngagementData()
  }, [user?.id])
  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">
            Relatórios e Análises
          </h1>
          <p className="text-gray-600">
            Acompanhe a performance da sua prática e o progresso dos pacientes.
          </p>
        </div>
        <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300">
          Gerar Relatório Personalizado
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <BarChart className="h-5 w-5 text-blue-600" />
              <span>Consultas por Mês</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center text-gray-500">
              {/* Placeholder for a chart */}
              Gráfico de Barras Aqui
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Total de 45 consultas no último mês.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span>Renda Mensal Estimada</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center text-gray-500">
              {/* Placeholder for a chart */}
              Gráfico de Linha Aqui
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Estimativa de R$ 7.500,00 no último mês.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <Users className="h-5 w-5 text-purple-600" />
              <span>Novos Pacientes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center text-gray-500">
              {/* Placeholder for a chart */}
              Gráfico de Linha Aqui
            </div>
            <p className="text-sm text-gray-600 mt-4">
              10 novos pacientes este mês.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-orange-600" />
            <span>Engajamento com Conteúdo</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Estatísticas Gerais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-blue-50">
                  <div className="flex items-center justify-center mb-2">
                    <BarChart className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {engagementStats?.totalBlogPosts || 0}
                  </p>
                  <p className="text-sm text-gray-600">Posts do Blog</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-50">
                  <div className="flex items-center justify-center mb-2">
                    <Eye className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {engagementStats?.totalBlogViews || 0}
                  </p>
                  <p className="text-sm text-gray-600">Visualizações</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-purple-50">
                  <div className="flex items-center justify-center mb-2">
                    <MessageCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {engagementStats?.totalForumAnswers || 0}
                  </p>
                  <p className="text-sm text-gray-600">Respostas no Fórum</p>
                </div>
              </div>

              {/* Top Posts do Blog */}
              {engagementStats?.topBlogPosts &&
                engagementStats.topBlogPosts.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-[#1E1D40] mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Top Posts do Blog
                    </h4>
                    <div className="space-y-3">
                      {engagementStats.topBlogPosts.map(post => (
                        <div
                          key={post.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors duration-200"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-[#1E1D40] mb-1">
                              {post.title}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {post.views} visualizações
                              </span>
                              <div className="flex gap-1">
                                {post.tags.slice(0, 2).map((tag, index) => (
                                  <span
                                    key={index}
                                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {post.tags.length > 2 && (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    +{post.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Ver Detalhes
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Top Perguntas do Fórum Respondidas */}
              {engagementStats?.topForumQuestions &&
                engagementStats.topForumQuestions.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-[#1E1D40] mb-3 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Perguntas do Fórum Respondidas
                    </h4>
                    <div className="space-y-3">
                      {engagementStats.topForumQuestions.map(question => (
                        <div
                          key={question.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors duration-200"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-[#1E1D40] mb-1">
                              {question.title}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {question.views}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />
                                {question.answers_count} respostas
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {question.likes_count}
                              </span>
                              {question.is_answered && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                  Respondida
                                </span>
                              )}
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Ver Detalhes
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Mensagem quando não há dados */}
              {(!engagementStats?.topBlogPosts ||
                engagementStats.topBlogPosts.length === 0) &&
                (!engagementStats?.topForumQuestions ||
                  engagementStats.topForumQuestions.length === 0) && (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      Nenhum conteúdo encontrado
                    </p>
                    <p className="text-sm text-gray-500">
                      Comece criando posts no blog ou respondendo perguntas no
                      fórum para ver suas estatísticas de engajamento.
                    </p>
                  </div>
                )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
