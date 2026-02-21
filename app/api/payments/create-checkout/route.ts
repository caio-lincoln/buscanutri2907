// app/api/teleconsulta/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { formatDateBR } from '@/lib/utils/format-date'
import { stripe } from '@/lib/stripe'
import { createAdminClient, createClient } from '@/lib/supabase/server'

type ConsultPaymentMethod = 'card' | 'boleto'

interface CreateConsultPaymentParams {
  amountBrl: number
  patientId: string
  patientEmail?: string | null
  nutritionistId: string
  nutritionistName?: string | null
  teleconsultaSessionId: string
  scheduledFor: string
  durationMinutes?: number
  paymentMethod?: ConsultPaymentMethod
  couponCode?: string | null
  connectedAccountId: string
  successUrl: string
  cancelUrl: string
}

interface ConsultPaymentResult {
  client_secret: string | null
  payment_intent_id: string | null
  session_id: string
  available_methods: ConsultPaymentMethod[]
  amount_original: number
  amount_final: number
  discount_applied: boolean
  discount_value: number
}

function getAvailablePaymentMethodsForCurrency(currency: string): ConsultPaymentMethod[] {
  const normalized = currency.toLowerCase()

  if (normalized === 'brl') {
    return [ 'card', 'boleto' ]
  }

  return [ 'card' ]
}

async function validatePromotionCode(
  couponCode: string,
  amountInCents: number,
  currency: string,
): Promise<{
  promotionCode: Stripe.PromotionCode
  coupon: Stripe.Coupon
  discountAmountInCents: number
  finalAmountInCents: number
}> {
  if (!stripe) {
    throw new Error('Stripe não inicializado')
  }

  const list = await stripe.promotionCodes.list({
    code: couponCode,
    active: true,
    limit: 1,
    expand: [ 'data.coupon' ],
  })

  const promotionCode = list.data[ 0 ]
  if (!promotionCode) {
    throw new Error('Cupom inválido ou expirado')
  }

  const coupon = promotionCode.coupon as Stripe.Coupon

  if (coupon.valid === false) {
    throw new Error('Cupom inválido ou expirado')
  }

  let discountAmountInCents = 0

  if (coupon.percent_off) {
    discountAmountInCents = Math.round(amountInCents * (coupon.percent_off / 100))
  } else if (coupon.amount_off && coupon.currency?.toLowerCase() === currency.toLowerCase()) {
    discountAmountInCents = coupon.amount_off
  }

  const finalAmountInCents = Math.max(amountInCents - discountAmountInCents, 0)

  return {
    promotionCode,
    coupon,
    discountAmountInCents,
    finalAmountInCents,
  }
}

async function createConsultPayment(params: CreateConsultPaymentParams): Promise<ConsultPaymentResult> {
  if (!stripe) {
    throw new Error('Stripe não inicializado')
  }

  const {
    amountBrl,
    patientId,
    patientEmail,
    nutritionistId,
    nutritionistName,
    teleconsultaSessionId,
    scheduledFor,
    durationMinutes,
    paymentMethod,
    couponCode,
    connectedAccountId,
    successUrl,
    cancelUrl,
  } = params

  const amount = Math.round(Number(amountBrl) * 100)
  const appFee = Math.round(amount * 0.20)
  const currency = 'brl'

  const availableMethods = getAvailablePaymentMethodsForCurrency(currency)
  const normalizedSelected = paymentMethod && availableMethods.includes(paymentMethod) ? paymentMethod : null

  const paymentMethodTypes = normalizedSelected ? [ normalizedSelected ] : availableMethods

  let promotionCodeId: string | undefined
  let discountAmountInCents = 0
  let finalAmountInCents = amount

  if (couponCode && couponCode.trim()) {
    const validation = await validatePromotionCode(couponCode.trim(), amount, currency)
    promotionCodeId = validation.promotionCode.id
    discountAmountInCents = validation.discountAmountInCents
    finalAmountInCents = validation.finalAmountInCents
  }

  const metadata = {
    teleconsulta_session_id: teleconsultaSessionId,
    patient_id: patientId,
    nutritionist_id: nutritionistId,
    scheduled_for: scheduledFor,
    duration_minutes: String(durationMinutes || 60),
    type: 'teleconsulta',
    price_brl: String(amountBrl),
    coupon_code: couponCode?.trim() || '',
    discount_value_cents: String(discountAmountInCents),
    amount_original_cents: String(amount),
    amount_final_cents: String(finalAmountInCents),
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: paymentMethodTypes,
    customer_email: patientEmail || undefined,
    client_reference_id: patientId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: amount,
          product_data: {
            name: `Teleconsulta com ${nutritionistName || 'nutricionista'}`,
            description: `Data/Hora: ${formatDateBR(scheduledFor)} · Duração: ${durationMinutes || 60} min`,
          },
        },
      },
    ],
    payment_intent_data: {
      application_fee_amount: appFee,
      transfer_data: { destination: connectedAccountId },
      on_behalf_of: connectedAccountId,
      metadata,
    },
    metadata,
    discounts: promotionCodeId ? [ { promotion_code: promotionCodeId } ] : undefined,
    success_url: successUrl,
    cancel_url: cancelUrl,
    billing_address_collection: 'auto',
    expand: [ 'payment_intent' ],
  })

  const paymentIntent = session.payment_intent && typeof session.payment_intent !== 'string'
    ? session.payment_intent as Stripe.PaymentIntent
    : null

  const paymentIntentId = paymentIntent?.id || (typeof session.payment_intent === 'string' ? session.payment_intent : null)
  const clientSecret = paymentIntent?.client_secret ?? null

  return {
    client_secret: clientSecret,
    payment_intent_id: paymentIntentId,
    session_id: session.id,
    available_methods: availableMethods,
    amount_original: amount / 100,
    amount_final: finalAmountInCents / 100,
    discount_applied: discountAmountInCents > 0,
    discount_value: discountAmountInCents / 100,
  }
}

function buildErrorResponse(requestId: string, code: string, message: string, status: number, details?: Record<string, unknown>) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
        details: {
          requestId,
          ...details,
        },
      },
    },
    { status },
  )
}

function buildSuccessResponse(requestId: string, data: Record<string, unknown>, status: number = 200) {
  return NextResponse.json(
    {
      ok: true,
      data,
      requestId,
    },
    { status },
  )
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    const origin = process.env[ 'APP_BASE_URL' ] || new URL(req.url).origin

    const {
      patient_id,
      patient_email,
      nutritionist_id,
      nutritionist_name,
      scheduled_for,
      duration_minutes,
      price_brl,
      teleconsulta_session_id,
      payment_method,
      coupon_code,
    } = await req.json()

    if (!patient_id || !nutritionist_id || !scheduled_for || !price_brl || !teleconsulta_session_id) {
      console.error('payments/create-checkout POST invalid payload', {
        requestId,
        patient_id,
        nutritionist_id,
        scheduled_for,
        price_brl,
        teleconsulta_session_id,
      })
      return buildErrorResponse(requestId, 'INVALID_DATETIME', 'Dados incompletos para iniciar o pagamento', 400)
    }

    if (!stripe) {
      console.error('payments/create-checkout POST stripe not initialized', { requestId })
      return buildErrorResponse(
        requestId,
        'ENV_MISCONFIG',
        'Pagamento indisponível no momento.',
        500,
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user?.id) {
      console.error('payments/create-checkout POST auth error', { requestId, authError })
      return buildErrorResponse(requestId, 'AUTH_REQUIRED', 'Usuário não autenticado', 401)
    }

    const userId = user.id

    const { data: patientProfile, error: patientError } = await supabase
      .from('patient_profiles')
      .select('id, user_id')
      .eq('id', patient_id)
      .eq('user_id', userId)
      .single()

    if (patientError || !patientProfile) {
      console.error('payments/create-checkout POST patient profile mismatch', {
        requestId,
        userId,
        patient_id,
        patientError,
      })
      return buildErrorResponse(
        requestId,
        'RLS_DENIED',
        'Permissão insuficiente. Faça login novamente.',
        403,
      )
    }

    const supabaseAdmin = createAdminClient()

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('teleconsulta_sessions')
      .select('id, patient_id, status, price')
      .eq('id', teleconsulta_session_id)
      .single()

    if (sessionError || !session || session.patient_id !== patientProfile.id) {
      console.error('payments/create-checkout POST session not found or not owned by patient', {
        requestId,
        teleconsulta_session_id,
        patient_id,
        sessionError,
      })
      return buildErrorResponse(
        requestId,
        'SESSION_NOT_FOUND',
        'Sessão de teleconsulta não encontrada.',
        404,
      )
    }

    if (session.status !== 'pending_payment') {
      console.error('payments/create-checkout POST invalid session state', {
        requestId,
        teleconsulta_session_id,
        status: session.status,
      })
      return buildErrorResponse(
        requestId,
        'INVALID_SESSION_STATE',
        'Esta sessão não está disponível para pagamento.',
        409,
      )
    }

    const { data: np, error } = await supabaseAdmin
      .from('nutritionist_profiles')
      .select('stripe_account_id, stripe_onboarding_complete, full_name')
      .eq('id', nutritionist_id)
      .single()

    if (error || !np?.stripe_account_id) {
      console.error('payments/create-checkout POST missing stripe account', {
        requestId,
        nutritionist_id,
        error,
      })
      return buildErrorResponse(
        requestId,
        'ENV_MISCONFIG',
        'Pagamento indisponível no momento.',
        500,
      )
    }
    if (!np.stripe_onboarding_complete) {
      console.error('payments/create-checkout POST onboarding incomplete', {
        requestId,
        nutritionist_id,
      })
      return buildErrorResponse(
        requestId,
        'ENV_MISCONFIG',
        'Pagamento indisponível no momento.',
        500,
      )
    }

    const connectedAccountId = np.stripe_account_id

    const result = await createConsultPayment({
      amountBrl: Number(price_brl),
      patientId: patient_id,
      patientEmail: patient_email,
      nutritionistId: nutritionist_id,
      nutritionistName: nutritionist_name || np.full_name,
      teleconsultaSessionId: teleconsulta_session_id,
      scheduledFor: scheduled_for,
      durationMinutes: duration_minutes,
      paymentMethod: payment_method as ConsultPaymentMethod | undefined,
      couponCode: coupon_code as string | undefined,
      connectedAccountId,
      successUrl: `${origin}/dashboard/paciente?activeTab=teleconsultas&sucesso=true`,
      cancelUrl: `${origin}/pagamento/cancelado`,
    })

    const data = {
      sessionId: result.session_id,
      client_secret: result.client_secret,
      payment_intent_id: result.payment_intent_id,
      available_methods: result.available_methods,
      amount_original: result.amount_original,
      amount_final: result.amount_final,
      discount_applied: result.discount_applied,
      discount_value: result.discount_value,
    }

    return buildSuccessResponse(requestId, data, 200)
  } catch (err: any) {
    console.error('payments/create-checkout POST unexpected error', { requestId, error: err })

    if (err instanceof Error && err.message && err.message.toLowerCase().includes('stripe')) {
      return buildErrorResponse(
        requestId,
        'STRIPE_ERROR',
        'Erro ao processar pagamento.',
        502,
      )
    }

    return buildErrorResponse(
      requestId,
      'DB_ERROR',
      'Erro interno ao iniciar pagamento.',
      500,
    )
  }
}
