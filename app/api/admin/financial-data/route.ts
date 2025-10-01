import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const supabaseAdmin = createAdminClient()

export async function GET(req: NextRequest) {
  try {
    // Buscar pagamentos de teleconsultas
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('payments')
      .select(`
        id,
        amount_brl,
        currency,
        status,
        created_at,
        patient_id,
        nutritionist_id,
        stripe_session_id,
        stripe_payment_intent_id
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (paymentsError) {
      console.error('Erro ao buscar payments:', paymentsError)
      return NextResponse.json({ error: 'Erro ao buscar pagamentos' }, { status: 500 })
    }

    // Buscar assinaturas
    const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
      .from('user_subscriptions')
      .select(`
        user_id,
        stripe_customer_id,
        stripe_subscription_id,
        status,
        current_period_end,
        cancel_at_period_end,
        updated_at
      `)
      .order('updated_at', { ascending: false })
      .limit(50)

    if (subscriptionsError) {
      console.error('Erro ao buscar subscriptions:', subscriptionsError)
      return NextResponse.json({ error: 'Erro ao buscar assinaturas' }, { status: 500 })
    }

    // Buscar informações dos usuários para enriquecer os dados
    const userIds = [
      ...new Set([
        ...payments.map(p => p.patient_id).filter(Boolean),
        ...payments.map(p => p.nutritionist_id).filter(Boolean),
        ...subscriptions.map(s => s.user_id).filter(Boolean)
      ])
    ]

    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, user_type')
      .in('id', userIds)

    if (usersError) {
      console.error('Erro ao buscar users:', usersError)
    }

    // Buscar perfis de pacientes e nutricionistas
    const { data: patientProfiles } = await supabaseAdmin
      .from('patient_profiles')
      .select('user_id, full_name')
      .in('user_id', userIds)

    const { data: nutritionistProfiles } = await supabaseAdmin
      .from('nutritionist_profiles')
      .select('user_id, full_name')
      .in('user_id', userIds)

    // Criar mapa de usuários para facilitar lookup
    const userMap = new Map()
    users?.forEach(user => userMap.set(user.id, user))
    patientProfiles?.forEach(profile => {
      const existing = userMap.get(profile.user_id) || {}
      userMap.set(profile.user_id, { ...existing, full_name: profile.full_name })
    })
    nutritionistProfiles?.forEach(profile => {
      const existing = userMap.get(profile.user_id) || {}
      userMap.set(profile.user_id, { ...existing, full_name: profile.full_name })
    })

    // Transformar dados de pagamentos para o formato esperado pelo frontend
    const transformedPayments = payments.map(payment => ({
      id: payment.id,
      type: 'pagamento' as const,
      description: 'Pagamento Teleconsulta',
      amount: Number(payment.amount_brl),
      status: payment.status === 'succeeded' ? 'concluído' as const : 
              payment.status === 'pending' ? 'pendente' as const : 'falhou' as const,
      date: new Date(payment.created_at).toISOString().split('T')[0],
      user: userMap.get(payment.patient_id)?.full_name || 
            userMap.get(payment.patient_id)?.email || 
            'Usuário não encontrado',
      stripe_session_id: payment.stripe_session_id,
      stripe_payment_intent_id: payment.stripe_payment_intent_id
    }))

    // Transformar dados de assinaturas para o formato esperado pelo frontend
    const transformedSubscriptions = subscriptions
      .filter(sub => sub.stripe_subscription_id) // Apenas assinaturas ativas
      .map(subscription => ({
        id: subscription.stripe_subscription_id,
        type: 'assinatura' as const,
        description: 'Assinatura Mensal Nutricionista',
        amount: 99.90, // Valor padrão - poderia ser buscado do Stripe
        status: subscription.status === 'active' ? 'concluído' as const :
                subscription.status === 'incomplete' ? 'pendente' as const : 'falhou' as const,
        date: new Date(subscription.updated_at).toISOString().split('T')[0],
        user: userMap.get(subscription.user_id)?.full_name || 
              userMap.get(subscription.user_id)?.email || 
              'Usuário não encontrado',
        stripe_customer_id: subscription.stripe_customer_id,
        cancel_at_period_end: subscription.cancel_at_period_end
      }))

    // Combinar e ordenar por data
    const allTransactions = [...transformedPayments, ...transformedSubscriptions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Calcular estatísticas
    const totalRevenue = transformedPayments
      .filter(p => p.status === 'concluído')
      .reduce((sum, p) => sum + p.amount, 0)

    const activeSubscriptions = transformedSubscriptions
      .filter(s => s.status === 'concluído').length

    const monthlyRevenue = transformedPayments
      .filter(p => {
        const paymentDate = new Date(p.date)
        const currentMonth = new Date()
        return paymentDate.getMonth() === currentMonth.getMonth() && 
               paymentDate.getFullYear() === currentMonth.getFullYear() &&
               p.status === 'concluído'
      })
      .reduce((sum, p) => sum + p.amount, 0)

    return NextResponse.json({
      transactions: allTransactions,
      stats: {
        totalRevenue,
        activeSubscriptions,
        monthlyRevenue,
        totalTransactions: allTransactions.length
      }
    })

  } catch (error) {
    console.error('Erro na API financial-data:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}