
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

// We need a Service Role client to update DB without user context
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const body = await req.text()
  const signature = headers().get('stripe-signature') as string

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any
    const appointmentId = session.metadata?.appointment_id

    if (!appointmentId) {
      console.error('Missing appointment_id in metadata')
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    // 1. Check idempotency: if payment already exists
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('stripe_payment_intent_id', session.payment_intent)
      .single()

    if (existingPayment) {
      return NextResponse.json({ received: true })
    }

    // 2. Check conflict: if another appointment is already PAID for same slot?
    // First fetch the appointment to get details
    const { data: appointment } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single()

    if (appointment) {
      // Check for other PAID appointments in same slot
      const { data: conflicts } = await supabaseAdmin
        .from('appointments')
        .select('id')
        .eq('nutritionist_id', appointment.nutritionist_id)
        .eq('scheduled_at', appointment.scheduled_at)
        .eq('status', 'confirmado')
        .neq('id', appointmentId)

      if (conflicts && conflicts.length > 0) {
        // CONFLICT DETECTED!
        // Refund the payment and mark as cancelled
        console.error('Conflict detected! Issuing refund.')
        
        try {
          if (session.payment_intent) {
            await stripe.refunds.create({
              payment_intent: session.payment_intent as string,
              reason: 'duplicate',
            })
          }
        } catch (refundError) {
          console.error('Error issuing refund:', refundError)
        }

        await supabaseAdmin
          .from('appointments')
          .update({ status: 'cancelado', cancellation_reason: 'Double booking conflict - Refunded' })
          .eq('id', appointmentId)

        return NextResponse.json({ error: 'Conflict detected - Refunded' }, { status: 409 })
      }
    }

    // 3. Mark appointment as PAID
    const { error: updateError } = await supabaseAdmin
      .from('appointments')
      .update({ status: 'confirmado', payment_status: 'pago' })
      .eq('id', appointmentId)

    if (updateError) {
      console.error('Error updating appointment status:', updateError)
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
    }

    // 4. Create Payment record
    const { error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        appointment_id: appointmentId,
        stripe_payment_intent_id: session.payment_intent,
        amount: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency || 'brl',
        status: 'paid',
      })

    if (paymentError) {
      console.error('Error creating payment record:', paymentError)
    }
  }

  return NextResponse.json({ received: true })
}
