import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const url = new URL(request.url)
    const searchParams = url.searchParams
    const devBypass = process.env.NODE_ENV !== 'production' && searchParams.get('dev_bypass') === '1'

    // Verificar se o usuário é admin (pular em desenvolvimento com dev_bypass=1)
    if (!devBypass) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
      }

      // Verificar se o usuário tem permissão de admin
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', user.id)
        .single()

      if (!profile || profile.user_type !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
      }
    }

    // Extrair parâmetros de data da query string
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Definir datas padrão (últimos 30 dias) se não fornecidas
    const now = new Date()
    const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const defaultEndDate = now

    const filterStartDate = startDate ? new Date(startDate) : defaultStartDate
    const filterEndDate = endDate ? new Date(endDate) : defaultEndDate

    // Ajustar endDate para incluir o dia completo
    const adjustedEndDate = new Date(filterEndDate)
    adjustedEndDate.setHours(23, 59, 59, 999)

    // Buscar dados de usuários filtrados por data (dados para agregações)
    const { data: usersData } = await supabase
      .from('user_profiles')
      .select(`
        id,
        created_at,
        user_type,
        city,
        state
      `)
      .gte('created_at', filterStartDate.toISOString())
      .lte('created_at', adjustedEndDate.toISOString())

    // Contagem exata de novos usuários no período (sem limite de 1000)
    const { count: newUsersExact } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', filterStartDate.toISOString())
      .lte('created_at', adjustedEndDate.toISOString())

    // Buscar dados de consultas filtradas por data
    const { data: consultationsData } = await supabase
      .from('consultations')
      .select(`
        id,
        created_at,
        status
      `)
      .gte('created_at', filterStartDate.toISOString())
      .lte('created_at', adjustedEndDate.toISOString())

    // Buscar dados de pagamentos filtrados por data
    const { data: paymentsData } = await supabase
      .from('payments')
      .select(`
        id,
        created_at,
        amount_brl,
        status
      `)
      .gte('created_at', filterStartDate.toISOString())
      .lte('created_at', adjustedEndDate.toISOString())

    // Buscar dados de assinaturas filtrados por data
    const { data: subscriptionsData } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        created_at,
        updated_at,
        status,
        stripe_subscription_id,
        stripe_customer_id,
        current_period_end,
        cancel_at_period_end
      `)
      .gte('created_at', filterStartDate.toISOString())
      .lte('created_at', adjustedEndDate.toISOString())

    // Buscar assinaturas ativas no período (simplificado)
    const { data: activeSubscriptionsInPeriod } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        created_at,
        updated_at,
        status,
        stripe_subscription_id,
        current_period_end
      `)
      .eq('status', 'active')

    // Buscar assinaturas canceladas no período (simplificado)
    const { data: canceledSubscriptionsInPeriod } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        updated_at,
        status
      `)
      .in('status', ['canceled', 'incomplete_expired', 'unpaid'])
      .gte('updated_at', filterStartDate.toISOString())
      .lte('updated_at', adjustedEndDate.toISOString())

    // Criar cliente administrativo para contornar RLS onde necessário (com fallback seguro)
    let supabaseAdmin: ReturnType<typeof createAdminClient> | null = null
    try {
      supabaseAdmin = createAdminClient()
    } catch (e) {
      // Em desenvolvimento/local, a chave de service role pode não estar configurada.
      // Usaremos o cliente padrão como fallback (RLS pode limitar resultados).
      supabaseAdmin = null
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Admin client indisponível. Usando cliente padrão como fallback.')
      }
    }

    // Buscar dados reais de blog. Preferimos posts publicados e cobrimos ambos esquemas:
    // - status = 'published' (novo esquema)
    // - published = true (esquema legado)
    // Selecionar apenas colunas que existem no schema atual
    let { data: allBlogPosts } = await (supabaseAdmin ?? supabase)
      .from('blog_posts')
      .select('id, created_at, published')
    allBlogPosts = allBlogPosts || []

    let { data: blogLikesAll } = await (supabaseAdmin ?? supabase)
      .from('blog_post_likes')
      .select('post_id, user_id, created_at')
    blogLikesAll = blogLikesAll || []

    let { data: blogCommentsAll } = await (supabaseAdmin ?? supabase)
      .from('blog_post_comments')
      .select('id, post_id, author_id, created_at')
    blogCommentsAll = blogCommentsAll || []

    // Buscar dados totais para comparação (sem filtro de data)
    const { data: allUsersData } = await supabase
      .from('user_profiles')
      .select('id, created_at, user_type')

    const { data: allConsultationsData } = await supabase
      .from('consultations')
      .select('id, created_at, status')

    const { data: allPaymentsData } = await supabase
      .from('payments')
      .select('id, created_at, amount_brl, status')

    const { data: allSubscriptionsData } = await supabase
      .from('user_subscriptions')
      .select('id, created_at, status, stripe_subscription_id')

    // Calcular período anterior para comparação
    const periodDuration = adjustedEndDate.getTime() - filterStartDate.getTime()
    const previousStartDate = new Date(filterStartDate.getTime() - periodDuration)
    const previousEndDate = new Date(filterStartDate.getTime() - 1)

    // Buscar dados do período anterior para comparação
    const { count: previousUsersExact } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', previousStartDate.toISOString())
      .lte('created_at', previousEndDate.toISOString())

    const { data: previousSubscriptionsData } = await supabase
      .from('user_subscriptions')
      .select('id, created_at, status')
      .gte('created_at', previousStartDate.toISOString())
      .lte('created_at', previousEndDate.toISOString())

    // Calcular métricas baseadas nos dados filtrados
    // Métricas de usuários no período selecionado
    const newUsersInPeriod = typeof newUsersExact === 'number' ? newUsersExact : (usersData?.length || 0)
    const previousUsersCount = typeof previousUsersExact === 'number' ? previousUsersExact : 0
    
    // Cadastros por Tipo de Usuário (totais reais no Supabase)
    const usersByType = {
      patients: allUsersData?.filter(user => user.user_type === 'paciente').length || 0,
      nutritionists: allUsersData?.filter(user => user.user_type === 'nutricionista').length || 0,
      companies: allUsersData?.filter(user => user.user_type === 'empresa').length || 0,
      admins: allUsersData?.filter(user => user.user_type === 'admin').length || 0
    }

    // Total de usuários (todos os tempos)
    const totalUsers = allUsersData?.length || 0

    // Métricas de assinaturas reais
    const newSubscriptionsInPeriod = subscriptionsData?.length || 0
    const activeSubscriptionsCount = activeSubscriptionsInPeriod?.length || 0
    const canceledSubscriptionsCount = canceledSubscriptionsInPeriod?.length || 0
    const previousSubscriptionsCount = previousSubscriptionsData?.length || 0
    
    // Taxa de retenção de assinaturas (assinaturas ativas vs canceladas no período)
    const subscriptionRetentionRate = activeSubscriptionsCount > 0 
      ? ((activeSubscriptionsCount - canceledSubscriptionsCount) / activeSubscriptionsCount * 100)
      : 0

    // Receita estimada de assinaturas (assumindo valor médio de R$ 99,90/mês)
    const avgSubscriptionValue = 99.90
    const subscriptionRevenue = activeSubscriptionsCount * avgSubscriptionValue

    // Métricas de consultas no período
    const consultationsInPeriod = consultationsData?.length || 0
    const totalConsultations = allConsultationsData?.length || 0
    // Consultas nos últimos 30 dias (independente do filtro escolhido)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const consultations30Days = (allConsultationsData || []).filter((c: any) => {
      const created = new Date(c.created_at)
      return created >= thirtyDaysAgo && created <= now
    }).length

    // Métricas de pagamentos no período
    const paymentsInPeriod = paymentsData?.length || 0
    const totalPayments = allPaymentsData?.length || 0
    
    const revenueInPeriod = paymentsData?.reduce((sum, payment) => 
      sum + (parseFloat(payment.amount_brl) || 0), 0
    ) || 0
    
    const totalRevenue = allPaymentsData?.reduce((sum, payment) => 
      sum + (parseFloat(payment.amount_brl) || 0), 0
    ) || 0

    // Métricas de assinaturas no período
    const subscriptionsInPeriod = subscriptionsData?.length || 0
    
    // Total real de assinaturas via Stripe (considera registros com stripe_subscription_id válido)
    const totalSubscriptions = (allSubscriptionsData || []).filter((sub: any) => !!sub.stripe_subscription_id).length || 0
    const activeSubscriptions = allSubscriptionsData?.filter(sub => 
      sub.status === 'active'
    ).length || 0

    // Métricas de posts do blog e engajamento (considerando apenas publicados)
    // Considerar publicados pelo campo booleano `published` (schema atual)
    const publishedPosts = (allBlogPosts || []).filter((p: any) => p.published === true)
    const totalPosts = publishedPosts.length
    // Posts publicados nos últimos 30 dias (usa published_at quando existir, senão created_at)
    const posts30Days = publishedPosts.filter((p: any) => {
      const d = new Date(p.created_at)
      return d >= thirtyDaysAgo && d <= now
    }).length

    // Total de likes e comentários (considerando apenas posts publicados)
    const publishedPostIds = new Set(publishedPosts.map((p: any) => p.id))
    const likesFiltered = (blogLikesAll || []).filter((like: any) => publishedPostIds.has(like.post_id))
    const commentsFiltered = (blogCommentsAll || []).filter((comment: any) => publishedPostIds.has(comment.post_id))

    const totalLikes = likesFiltered.length
    const totalComments = commentsFiltered.length

    // Likes e comentários publicados nos últimos 30 dias
    const likes30Days = likesFiltered.filter((l: any) => {
      const d = new Date(l.created_at)
      return d >= thirtyDaysAgo && d <= now
    }).length
    const comments30Days = commentsFiltered.filter((c: any) => {
      const d = new Date(c.created_at)
      return d >= thirtyDaysAgo && d <= now
    }).length

    // Função para calcular porcentagem de mudança
    const calculatePercentageChange = (current: number, previous: number): string => {
      if (previous === 0) {
        return current > 0 ? '+100.0%' : '0.0%'
      }
      const change = ((current - previous) / previous) * 100
      return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
    }

    // Calcular mudanças percentuais
    const newUsersChange = calculatePercentageChange(newUsersInPeriod, previousUsersCount)
    const subscriptionsChange = calculatePercentageChange(newSubscriptionsInPeriod, previousSubscriptionsCount)

    // Visitas ao site reais no período usando web_visits (usar admin quando disponível)
    const supabaseForVisits = supabaseAdmin || supabase
    // Contagem exata de visitas ao site no período (sem limite de 1000)
    const { count: siteVisitsRealCount } = await supabaseForVisits
      .from('web_visits')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', filterStartDate.toISOString())
      .lte('created_at', adjustedEndDate.toISOString())

    const siteVisitsReal = siteVisitsRealCount || 0

    // Taxa de conversão real: cadastros / visitas
    const conversionRate = siteVisitsReal > 0 ? (newUsersInPeriod / siteVisitsReal * 100) : 0

    // Calcular tempo médio no site baseado em sessões reais para o período filtrado
    const { data: sessionsData } = await supabase
      .from('user_sessions')
      .select('duration_seconds')
      .not('duration_seconds', 'is', null)
      .gte('created_at', filterStartDate.toISOString())
      .lte('created_at', adjustedEndDate.toISOString())

    let avgTimeOnSite = 300 // 5 minutos como fallback
    let avgTimeOnSiteChange = '0.0%'

    if (sessionsData && sessionsData.length > 0) {
      // Calcular média do período selecionado
      const totalDuration = sessionsData.reduce((sum, session) => 
        sum + (session.duration_seconds || 0), 0
      )
      avgTimeOnSite = Math.round(totalDuration / sessionsData.length)

      // Calcular média do período anterior para comparação
      const { data: previousSessionsData } = await supabase
        .from('user_sessions')
        .select('duration_seconds')
        .not('duration_seconds', 'is', null)
        .gte('created_at', previousStartDate.toISOString())
        .lte('created_at', previousEndDate.toISOString())

      if (previousSessionsData && previousSessionsData.length > 0) {
        const previousTotalDuration = previousSessionsData.reduce((sum, session) => 
          sum + (session.duration_seconds || 0), 0
        )
        const previousAvgTime = Math.round(previousTotalDuration / previousSessionsData.length)
        avgTimeOnSiteChange = calculatePercentageChange(avgTimeOnSite, previousAvgTime)
      }
    }

    // Dados por localização (top 10 estados) - usando dados filtrados
    const locationData = usersData?.reduce((acc: any, user) => {
      if (user.state) {
        acc[user.state] = (acc[user.state] || 0) + 1
      }
      return acc
    }, {}) || {}

    const topLocations = Object.entries(locationData)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([state, count]) => ({ state, count }))

    // Dados de tráfego por dia para o período selecionado
    const trafficData = []
    const daysDiff = Math.ceil((adjustedEndDate.getTime() - filterStartDate.getTime()) / (1000 * 60 * 60 * 24))
    
    for (let i = 0; i < daysDiff; i++) {
      const date = new Date(filterStartDate.getTime() + i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      
      // Contagem exata de novos usuários no dia
      const dayStart = new Date(dateStr + 'T00:00:00.000Z')
      const dayEnd = new Date(dateStr + 'T23:59:59.999Z')

      const { count: dayUsersCount } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString())

      // Contagem exata de visitas reais no dia
      const { count: dayVisitsCount } = await supabaseForVisits
        .from('web_visits')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString())
      
      trafficData.push({
        date: dateStr,
        visitors: dayVisitsCount || 0,
        newUsers: dayUsersCount || 0
      })
    }

    // Conversão do período anterior com base em visitas reais
    const { count: previousVisitorsCountExact } = await supabaseForVisits
      .from('web_visits')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', previousStartDate.toISOString())
      .lte('created_at', previousEndDate.toISOString())

    const previousVisitorsCount = previousVisitorsCountExact || 0
    const previousConversionRate = previousVisitorsCount > 0 ? (previousUsersCount / previousVisitorsCount * 100) : 0

    const analyticsData = {
      metrics: {
        siteVisits: siteVisitsReal,
        siteVisitsChange: calculatePercentageChange(siteVisitsReal, previousVisitorsCount),
        newRegistrations: newUsersInPeriod,
        newRegistrationsChange: newUsersChange,
        conversionRate: conversionRate.toFixed(1),
        conversionRateChange: calculatePercentageChange(conversionRate, previousConversionRate),
        avgTimeOnSite: Math.floor(avgTimeOnSite / 60) + ':' + String(avgTimeOnSite % 60).padStart(2, '0'),
        avgTimeOnSiteChange: avgTimeOnSiteChange
      },
      usersByType,
      totalUsers,
      totalConsultations,
      consultationsInPeriod,
      consultations30Days,
      consultationsChange: '0.0%', // Pode ser implementado se necessário
      totalPayments,
      paymentsInPeriod,
      totalRevenue,
      revenueInPeriod,
      revenueChange: '0.0%', // Pode ser implementado se necessário
      totalSubscriptions,
      activeSubscriptions: activeSubscriptionsCount,
      subscriptionsInPeriod: newSubscriptionsInPeriod,
      subscriptionsChange,
      subscriptionRetentionRate: subscriptionRetentionRate.toFixed(1) + '%',
      subscriptionRevenue: subscriptionRevenue.toFixed(2),
      totalPosts,
      posts30Days,
      totalLikes,
      totalComments,
      likes30Days,
      comments30Days,
      topLocations,
      trafficData,
      // Informações do período para referência
      periodInfo: {
        startDate: filterStartDate.toISOString().split('T')[0],
        endDate: filterEndDate.toISOString().split('T')[0],
        dayCount: daysDiff
      }
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    // Incluir detalhes do erro em desenvolvimento quando dev_bypass estiver ativo
    try {
      const url = new URL(request.url)
      const devBypass = process.env.NODE_ENV !== 'production' && url.searchParams.get('dev_bypass') === '1'
      if (devBypass) {
        console.error('Erro ao buscar dados de analytics (dev):', error)
        return NextResponse.json(
          { error: 'Erro interno do servidor', detail: (error as any)?.message ?? String(error) },
          { status: 500 }
        )
      }
    } catch {}

    console.error('Erro ao buscar dados de analytics:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
