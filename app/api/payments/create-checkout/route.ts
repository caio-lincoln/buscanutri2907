// app/api/teleconsulta/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { formatDateBR } from '@/lib/utils/format-date'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'

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
  connectedAccountId: string
  successUrl: string
  cancelUrl: string
}

interface ConsultPaymentResult {
  client_secret: string | null
  payment_intent_id: string | null
  session_id: string
  available_methods: ConsultPaymentMethod[]
}

function getAvailablePaymentMethodsForCurrency(currency: string): ConsultPaymentMethod[] {
  const normalized = currency.toLowerCase()

  if (normalized === 'brl') {
    return [ 'card', 'boleto' ]
  }

  return [ 'card' ]
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

  const metadata = {
    teleconsulta_session_id: teleconsultaSessionId,
    patient_id: patientId,
    nutritionist_id: nutritionistId,
    scheduled_for: scheduledFor,
    duration_minutes: String(durationMinutes || 60),
    type: 'teleconsulta',
    price_brl: String(amountBrl),
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
  }
}

export async function POST(req: NextRequest) {
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
    } = await req.json()

    if (!patient_id || !nutritionist_id || !scheduled_for || !price_brl || !teleconsulta_session_id) {
      return NextResponse.json({ message: 'Dados incompletos' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()
    const { data: np, error } = await supabaseAdmin
      .from('nutritionist_profiles')
      .select('stripe_account_id, stripe_onboarding_complete, full_name')
      .eq('id', nutritionist_id)
      .single()

    if (error || !np?.stripe_account_id) {
      return NextResponse.json({ message: 'Nutricionista sem conta Stripe conectada' }, { status: 400 })
    }
    if (!np.stripe_onboarding_complete) {
      return NextResponse.json({ message: 'Nutricionista não concluiu o onboarding do Stripe' }, { status: 400 })
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
      connectedAccountId,
      successUrl: `${origin}/dashboard/paciente?activeTab=teleconsultas&sucesso=true`,
      cancelUrl: `${origin}/pagamento/cancelado`,
    })

    return NextResponse.json({
      sessionId: result.session_id,
      client_secret: result.client_secret,
      payment_intent_id: result.payment_intent_id,
      available_methods: result.available_methods,
    })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ message: err.message || 'Erro' }, { status: 500 })
  }
}
