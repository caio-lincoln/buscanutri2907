// app/api/teleconsulta/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { formatDateBR } from '@/lib/utils/format-date'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'

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
    } = await req.json()

    if (!patient_id || !nutritionist_id || !scheduled_for || !price_brl || !teleconsulta_session_id) {
      return NextResponse.json({ message: 'Dados incompletos' }, { status: 400 })
    }

    // 1) Busca a conta conectada do nutricionista
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

    const amount = Math.round(Number(price_brl) * 100)
    const appFee = Math.round(amount * 0.20)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: [ 'card' ],
      customer_email: patient_email || undefined,
      client_reference_id: patient_id,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'brl',
            unit_amount: amount,
            product_data: {
              name: `Teleconsulta com ${nutritionist_name || np.full_name || 'nutricionista'}`,
              description: `Data/Hora: ${formatDateBR(scheduled_for)} · Duração: ${duration_minutes || 60} min`,
            },
          },
        },
      ],
      payment_intent_data: {
        application_fee_amount: appFee,
        transfer_data: { destination: connectedAccountId },
        on_behalf_of: connectedAccountId,
      },
      metadata: {
        teleconsulta_session_id,
        patient_id,
        nutritionist_id,
        scheduled_for,
        duration_minutes: String(duration_minutes || 60),
        type: "teleconsulta",
        price_brl: String(price_brl),
      },
      success_url: `${origin}/dashboard/paciente?activeTab=teleconsultas&sucesso=true`,
      cancel_url: `${origin}/pagamento/cancelado`,
      billing_address_collection: 'auto',
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ message: err.message || 'Erro' }, { status: 500 })
  }
}
