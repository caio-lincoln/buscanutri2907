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
import { useEffect, useMemo, useState } from 'react'
import { useUser } from '@/hooks/use-user'
import {
  getContentEngagementStats,
  type ContentEngagementStats,
} from '@/lib/content-engagement-service'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '../../../contexts/auth-context'
import { createSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'
import { BlogPostsService } from '@/lib/blog-posts-service'
import { getBlogPostsByAuthor } from '@/lib/blog-data'

export function ReportsTab() {
  // const { user } = useUser()
  const { user, nutritionistProfile } = useAuth()
  const [engagementStats, setEngagementStats] =
    useState<ContentEngagementStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [consultationsThisMonth, setConsultationsThisMonth] = useState<number>(0)
  const [estimatedRevenueBRL, setEstimatedRevenueBRL] = useState<number>(0)
  const [newPatientsThisMonth, setNewPatientsThisMonth] = useState<number>(0)
  const supabase = useMemo(() => createSupabaseClient(), [])

  useEffect(() => {
    const loadEngagementData = async () => {
      const authorId = (nutritionistProfile as any)?.user_id || user?.id
      if (!authorId) return

      try {
        setLoading(true)
        const stats = await getContentEngagementStats(authorId)

        // Fallback: se não houver dados, carregar todos os posts e computar métricas básicas
        const needsFallback = (stats.totalBlogPosts ?? 0) === 0 || !stats.allBlogPosts || stats.allBlogPosts.length === 0
        if (needsFallback) {
          // Tentar via serviço genérico
          const { data: myPosts } = await BlogPostsService.getMyPosts({}, 1, 200, 'created_at', 'desc')
          let all = (myPosts || []).map(p => ({
            id: (p as any).id,
            title: (p as any).title,
            views: Number((p as any).views || 0),
            created_at: (p as any).created_at,
            tags: (p as any).tags || [],
            slug: (p as any).slug,
          }))

          // Fallback definitivo: buscar por autor explicitamente
          if (!all.length) {
            const authorPosts = await getBlogPostsByAuthor(authorId)
            all = (authorPosts || []).map(p => ({
              id: (p as any).id,
              title: (p as any).title,
              views: Number((p as any).views || 0),
              created_at: (p as any).date || (p as any).created_at,
              tags: (p as any).tags || [],
              slug: (p as any).slug,
            }))
          }
          const totalViews = all.reduce((sum, x) => sum + (Number(x.views) || 0), 0)
          const top = all.slice().sort((a, b) => b.views - a.views).slice(0, 5)
          setEngagementStats({
            ...stats,
            totalBlogPosts: all.length,
            totalBlogViews: totalViews,
            topBlogPosts: top,
            allBlogPosts: all,
          })
        } else {
          setEngagementStats(stats)
        }
      } catch (error) {
        // Silent error handling: Error loading engagement data
      } finally {
        setLoading(false)
      }
    }

    loadEngagementData()
  }, [user?.id, (nutritionistProfile as any)?.user_id])

  useEffect(() => {
    const loadConsultationsAndRevenue = async () => {
      if (!nutritionistProfile?.id || !user?.id) return

      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

      const { data: monthSessions } = await supabase
        .from('teleconsulta_sessions')
        .select('id, patient_id, scheduled_at, price, status')
        .eq('nutritionist_id', nutritionistProfile.id)
        .gte('scheduled_at', start.toISOString())
        .lte('scheduled_at', end.toISOString())

      const monthCount = monthSessions?.length || 0
      setConsultationsThisMonth(monthCount)

      let revenueBRL = 0
      const { data: payments } = await supabase
        .from('payments')
        .select('amount_brl, status, created_at')
        .eq('nutritionist_id', user.id)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())

      if (payments && payments.length > 0) {
        revenueBRL = payments
          .filter(p => (p as any).status === 'succeeded')
          .reduce((sum, p) => sum + Number((p as any).amount_brl || 0), 0)
      } else if (monthSessions && monthSessions.length > 0) {
        revenueBRL = monthSessions
          .filter(s => (s as any).status === 'completed' || (s as any).status === 'scheduled')
          .reduce((sum, s) => sum + Number((s as any).price || 0), 0)
      }

      setEstimatedRevenueBRL(revenueBRL)

      const { data: allSessions } = await supabase
        .from('teleconsulta_sessions')
        .select('patient_id, scheduled_at')
        .eq('nutritionist_id', nutritionistProfile.id)
        .order('scheduled_at', { ascending: true })

      const earliestByPatient = new Map<string, Date>()
      ;(allSessions || []).forEach(s => {
        const pid = (s as any).patient_id as string
        const d = new Date((s as any).scheduled_at)
        const existing = earliestByPatient.get(pid)
        if (!existing || d < existing) earliestByPatient.set(pid, d)
      })

      const newPatients = Array.from(earliestByPatient.values()).filter(d => {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      }).length

      setNewPatientsThisMonth(newPatients)
    }

    loadConsultationsAndRevenue()
  }, [supabase, nutritionistProfile?.id, user?.id])
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
            <div className="flex items-center justify-center">
              <div className="text-center">
                <p className="text-4xl font-bold text-[#1E1D40]">{consultationsThisMonth}</p>
                <p className="text-sm text-gray-600">consultas neste mês</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              {`Total de ${consultationsThisMonth} consultas neste mês.`}
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
            <p className="text-sm text-gray-600 mt-4">
              {`Estimativa de ${estimatedRevenueBRL.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} neste mês.`}
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
            <p className="text-sm text-gray-600 mt-4">
              {`${newPatientsThisMonth} novos pacientes neste mês.`}
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
                          <Button variant="outline" size="sm" asChild>
                            <Link href={post.slug ? `/blog/${post.slug}` : `/dashboard/nutricionistas/posts/${post.id}`} target={post.slug ? '_blank' : undefined}>
                              Ver Detalhes
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Todos os Posts do Blog */}
              {engagementStats?.allBlogPosts && engagementStats.allBlogPosts.length > 0 && (
                <div className="mt-8">
                  <h4 className="font-semibold text-[#1E1D40] mb-3">
                    Todos os Posts do Blog
                  </h4>
                  <div className="space-y-2">
                    {engagementStats.allBlogPosts.map(post => (
                      <div key={post.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                        <div className="flex-1">
                          <p className="font-medium text-[#1E1D40]">{post.title}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {post.views}
                            </span>
                            {post.tags && post.tags.length > 0 && (
                              <span className="truncate max-w-[300px]">
                                {post.tags.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={post.slug ? `/blog/${post.slug}` : `/dashboard/nutricionistas/posts/${post.id}`} target={post.slug ? '_blank' : undefined}>
                            Ver
                          </Link>
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
