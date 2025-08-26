import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '../../../../lib/supabase/server'

const stripe = new Stripe(process.env[ 'STRIPE_SECRET_KEY' ], {
  apiVersion: '2025-07-30.basil',
})

const supabaseAdmin = createAdminClient()

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature') || ''
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env[ 'STRIPE_WEBHOOK_SECRET' ]
    )
  } catch (err: any) {
    console.error('Webhook signature verify failed:', err.message)
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const metadata = session.metadata || {}
      const patient_id = session.client_reference_id || metadata.patient_id
      const nutritionist_id = metadata.nutritionist_id
      const teleconsulta_session_id = metadata.teleconsulta_session_id
      const scheduled_for = metadata.scheduled_for
      const duration_minutes = Number(metadata.duration_minutes || 60)
      const price_brl = Number(metadata.price_brl || 0)
      const stripe_payment_intent_id = String(session.payment_intent || '')

      // (Opcional) Idempotência: não duplique
      // verifique se já existe um registro com esse payment_intent_id

      const { error } = await supabaseAdmin
        .from('teleconsulta_sessions')
        .update({
          scheduled_at: scheduled_for,
          duration_minutes,
          status: 'scheduled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', teleconsulta_session_id)
        .eq('patient_id', patient_id)
        .eq('nutritionist_id', nutritionist_id)

      if (error) {
        console.error('Erro ao criar teleconsulta após pagamento:', error)
      }

      await supabaseAdmin.from('payments').insert({
        patient_id,
        nutritionist_id,
        amount_brl: price_brl,
        currency: 'brl',
        status: 'succeeded',
        stripe_session_id: session.id,
        stripe_payment_intent_id,
        raw: session as any,
      })
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Erro no webhook:', err)
    return new NextResponse('Webhook handler failed', { status: 500 })
  }
}
