
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

// DOMAIN RULE:
// teleconsulta_sessions is the ONLY valid table for online consultations.
// Legacy tables (appointments, etc.) should not be used for new teleconsultations.
// Any successful payment MUST create a record in teleconsulta_sessions.


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
    const metadata = session.metadata

    if (!metadata || !metadata.nutritionist_id || !metadata.patient_id || !metadata.scheduled_at) {
      console.error('Missing required metadata', metadata)
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    // 1. Idempotency Check: Check if session already created for this payment intent
    // We use payment_intent_id as the unique key for the transaction
    const paymentIntentId = session.payment_intent as string

    if (paymentIntentId) {
      const { data: existingSession } = await supabaseAdmin
        .from('teleconsulta_sessions')
        .select('id')
        .eq('payment_intent_id', paymentIntentId)
        .maybeSingle()

      if (existingSession) {
        console.log(`Session already created for payment intent ${paymentIntentId}`)
        return NextResponse.json({ received: true })
      }
    } else {
        // Fallback: check by stripe_session_id in payments table?
        // Or just proceed and risk duplicate if payment_intent is somehow missing (unlikely for payments)
        console.warn('Missing payment_intent_id in session', session.id)
    }

    // 2. Concurrency/Conflict Check
    // Since we don't have a unique constraint on (nutritionist_id, scheduled_at) in teleconsulta_sessions yet,
    // we must check manually. This is not perfect but better than nothing.
    // Ideally we should rely on a DB constraint.
    
    const { data: conflicts } = await supabaseAdmin
        .from('teleconsulta_sessions')
        .select('id')
        .eq('nutritionist_id', metadata.nutritionist_id)
        .eq('scheduled_at', metadata.scheduled_at)
        .in('status', ['scheduled', 'in_progress', 'completed'])
        .maybeSingle()

    if (conflicts) {
        console.warn('Slot conflict detected (Double Booking). Refunding...')
        
        // REFUND LOGIC
        try {
            if (session.payment_intent) {
                await stripe.refunds.create({
                    payment_intent: session.payment_intent as string,
                    reason: 'duplicate',
                    metadata: {
                        reason: 'Slot already taken by another patient'
                    }
                })
                console.log('Refund issued successfully.')
            }
        } catch (refundError) {
            console.error('Failed to refund:', refundError)
        }
        
        return NextResponse.json({ error: 'Slot conflict - Refunded' }, { status: 409 })
    }

    // 3. Prepare Data for teleconsulta_sessions
    const sessionData = {
      nutritionist_id: metadata.nutritionist_id,
      patient_id: metadata.patient_id,
      scheduled_at: metadata.scheduled_at,
      duration_minutes: Number(metadata.duration_minutes || 60),
      price: Number(metadata.price),
      status: 'scheduled',
      payment_status: 'paid',
      payment_intent_id: paymentIntentId, // Store payment intent for idempotency
      // stripe_session_id is not in schema, but we link via payments table
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // 4. Insert Session
    const { data: newSession, error: insertError } = await supabaseAdmin
      .from('teleconsulta_sessions')
      .insert(sessionData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating teleconsulta session:', insertError)
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    // 5. Record Payment in 'payments' table (Audit)
    const { data: newPayment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        patient_id: metadata.patient_id,
        nutritionist_id: metadata.nutritionist_id,
        amount_brl: Number(metadata.price),
        currency: 'brl',
        status: 'paid',
        stripe_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId,
        teleconsulta_session_id: newSession.id, // Link to the new session
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (paymentError) {
        console.error('Error recording payment:', paymentError)
        // We created the session but failed to record payment. 
        // We should probably log this critical error. 
        // The session exists and is paid, so the user gets their service.
    } else {
        // 6. Update session with payment_id if needed (bi-directional link)
        await supabaseAdmin
            .from('teleconsulta_sessions')
            .update({ payment_id: newPayment.id })
            .eq('id', newSession.id)
    }

    console.log(`Teleconsulta session created successfully: ${newSession.id}`)
    return NextResponse.json({ received: true, session_id: newSession.id })
  }

  return NextResponse.json({ received: true })
}
