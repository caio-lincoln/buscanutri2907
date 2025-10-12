import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

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
        stripe_payment_intent_id,
        raw
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

    // Enriquecer pagamentos com informações de desconto/cupom
    const paymentsWithDetails = await Promise.all(
      (payments || []).map(async (payment) => {
        const raw = (payment as any)?.raw || null
        let amountFromSession = raw && typeof raw.amount_total === 'number' ? raw.amount_total / 100 : null
        let discountBrl = raw?.total_details?.amount_discount ? raw.total_details.amount_discount / 100 : 0
        let hadCoupon = !!(
          (raw?.total_details?.amount_discount && raw.total_details.amount_discount > 0) ||
          (Array.isArray(raw?.discounts) && raw.discounts.length > 0)
        )
        let couponCode: string | null = null

        // Fallback para casos onde o valor total foi zerado por desconto (100%), mas não há breakdown explícito
        if (raw && typeof raw.amount_total === 'number' && typeof raw.amount_subtotal === 'number') {
          if (raw.amount_total === 0 && raw.amount_subtotal > 0) {
            hadCoupon = true
            if (!discountBrl || discountBrl === 0) {
              discountBrl = raw.amount_subtotal / 100
            }
          }
        }

        // Consultar a sessão do Stripe sempre que possível para obter dados mais precisos
        if (payment.stripe_session_id) {
          try {
            const liveSession = await stripe.checkout.sessions.retrieve(payment.stripe_session_id as string, {
              expand: ['total_details.breakdown']
            })
            amountFromSession = typeof liveSession.amount_total === 'number' ? liveSession.amount_total / 100 : amountFromSession
            const liveDiscount = liveSession.total_details?.amount_discount ? liveSession.total_details.amount_discount : 0
            discountBrl = typeof liveDiscount === 'number' ? liveDiscount / 100 : discountBrl

            // Recalcular presença de cupom com base na sessão ao vivo
            hadCoupon = !!(
              (typeof liveDiscount === 'number' && liveDiscount > 0) ||
              (Array.isArray(liveSession.discounts) && liveSession.discounts.length > 0)
            )

            // Fallback adicional: total zerado com subtotal positivo indica desconto de 100%
            const liveSubtotal = typeof liveSession.amount_subtotal === 'number' ? liveSession.amount_subtotal : null
            if (typeof liveSession.amount_total === 'number' && liveSession.amount_total === 0 && liveSubtotal && liveSubtotal > 0) {
              hadCoupon = true
              if (!discountBrl || discountBrl === 0) {
                discountBrl = liveSubtotal / 100
              }
            }

            const firstDiscount = Array.isArray(liveSession.discounts) && liveSession.discounts.length > 0
              ? liveSession.discounts[0]
              : null
            const promoCodeId = firstDiscount && typeof firstDiscount.promotion_code === 'string'
              ? firstDiscount.promotion_code
              : null
            if (promoCodeId) {
              try {
                const promo = await stripe.promotionCodes.retrieve(promoCodeId)
                couponCode = promo.code || null
              } catch (e) {
                console.error('Erro ao buscar promotion code:', e)
              }
            } else if (firstDiscount && typeof firstDiscount.coupon !== 'string' && firstDiscount.coupon?.name) {
              couponCode = firstDiscount.coupon.name
            }
          } catch (e) {
            console.error('Erro ao consultar sessão do Stripe:', e)
          }
        }

        return { payment, amount: amountFromSession ?? Number(payment.amount_brl), hadCoupon, discountBrl, couponCode }
      })
    )

    // Transformar dados de pagamentos para o formato esperado pelo frontend
    const transformedPayments = paymentsWithDetails.map(({ payment, amount, hadCoupon, discountBrl, couponCode }) => ({
      id: payment.id,
      type: 'pagamento' as const,
      description: 'Pagamento Teleconsulta',
      amount,
      status: payment.status === 'succeeded' ? 'concluído' as const : 
              payment.status === 'pending' ? 'pendente' as const : 'falhou' as const,
      date: new Date(payment.created_at).toISOString().split('T')[0],
      user: userMap.get(payment.patient_id)?.full_name || 
            userMap.get(payment.patient_id)?.email || 
            'Usuário não encontrado',
      stripe_session_id: payment.stripe_session_id,
      stripe_payment_intent_id: payment.stripe_payment_intent_id,
      had_coupon: hadCoupon,
      discount_brl: discountBrl,
      coupon_code: couponCode || undefined,
    }))

    // Transformar dados de assinaturas para o formato esperado pelo frontend
    // Consultar Stripe para obter valores reais das assinaturas
    const subscriptionsWithAmounts = await Promise.all(
      (subscriptions || [])
        .filter(sub => sub.stripe_subscription_id)
        .map(async (subscription) => {
          try {
            const stripeSub = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id, { expand: ['latest_invoice'] })
            const unitAmount = stripeSub.items?.data?.[0]?.price?.unit_amount || 0
            const latestInvoiceTotal = typeof stripeSub.latest_invoice !== 'string' && stripeSub.latest_invoice
              ? (stripeSub.latest_invoice.total || 0)
              : null
            const amountBrl = ((latestInvoiceTotal ?? unitAmount) || 0) / 100
            const hadCoupon = !!stripeSub.discount
            let couponCode: string | null = null
            if (stripeSub.discount) {
              const promoId = typeof stripeSub.discount.promotion_code === 'string'
                ? stripeSub.discount.promotion_code
                : (stripeSub.discount.promotion_code as any)?.id || null
              if (promoId) {
                try {
                  const promo = await stripe.promotionCodes.retrieve(promoId)
                  couponCode = promo.code || null
                } catch (e) {
                  console.error('Erro ao buscar promotion code (sub):', e)
                }
              } else if (typeof stripeSub.discount.coupon !== 'string' && stripeSub.discount.coupon?.name) {
                couponCode = stripeSub.discount.coupon.name
              }
            }
            const discountBrl = latestInvoiceTotal && unitAmount ? Math.max(0, (unitAmount - latestInvoiceTotal) / 100) : 0
            return { subscription, amountBrl, hadCoupon, couponCode, discountBrl }
          } catch (e) {
            console.error('Erro ao buscar assinatura no Stripe:', e)
            return { subscription, amountBrl: 0, hadCoupon: false, couponCode: null, discountBrl: 0 }
          }
        })
    )

    const transformedSubscriptions = subscriptionsWithAmounts.map(({ subscription, amountBrl, hadCoupon, couponCode, discountBrl }) => ({
      id: subscription.stripe_subscription_id,
      type: 'assinatura' as const,
      description: 'Assinatura Mensal Nutricionista',
      amount: amountBrl,
      status: subscription.status === 'active' ? 'concluído' as const :
              subscription.status === 'incomplete' ? 'pendente' as const : 'falhou' as const,
      date: new Date(subscription.updated_at).toISOString().split('T')[0],
      user: userMap.get(subscription.user_id)?.full_name || 
            userMap.get(subscription.user_id)?.email || 
            'Usuário não encontrado',
      stripe_customer_id: subscription.stripe_customer_id,
      cancel_at_period_end: subscription.cancel_at_period_end,
      had_coupon: hadCoupon,
      discount_brl: discountBrl,
      coupon_code: couponCode || undefined,
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