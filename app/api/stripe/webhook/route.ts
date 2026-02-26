
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
    const metadata = session.metadata

    if (!metadata || !metadata.nutritionist_id || !metadata.patient_id || !metadata.scheduled_at) {
      console.error('Missing required metadata', metadata)
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    // 1. Idempotency Check: Check if appointment already created for this session
    const { data: existingAppointment } = await supabaseAdmin
      .from('appointments')
      .select('id')
      .eq('stripe_session_id', session.id)
      .maybeSingle()

    if (existingAppointment) {
      console.log(`Appointment already created for session ${session.id}`)
      return NextResponse.json({ received: true })
    }

    // 2. Prepare Data
    const scheduledDate = new Date(metadata.scheduled_at)
    // Extract UTC date and time for unique constraint compliance
    const appointment_date = scheduledDate.toISOString().split('T')[0]
    const appointment_time = scheduledDate.toISOString().split('T')[1].substring(0, 8)

    const appointmentData = {
      nutritionist_id: metadata.nutritionist_id,
      patient_id: metadata.patient_id,
      scheduled_at: metadata.scheduled_at,
      appointment_date,
      appointment_time,
      price: Number(metadata.price),
      duration_minutes: Number(metadata.duration_minutes || 60),
      status: 'agendado', // Confirmed booking status
      payment_status: 'pago',
      stripe_session_id: session.id,
      patient_name: metadata.patient_name,
      patient_email: metadata.patient_email,
      patient_phone: metadata.patient_phone,
      is_online: metadata.appointment_type === 'online',
      type: metadata.appointment_type || 'online',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // 3. Insert Appointment (Handle Race Condition)
    const { data: newAppointment, error: insertError } = await supabaseAdmin
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating appointment:', insertError)

      // Check for Unique Violation (Code 23505) -> Slot already taken
      if (insertError.code === '23505') {
        console.warn('Slot conflict detected (Double Booking). refunding...')
        
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
        
        // Record failed payment attempt/log if possible (optional)
        return NextResponse.json({ error: 'Slot conflict - Refunded' }, { status: 409 })
      }

      return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 })
    }

    // 4. Record Payment in 'payments' table (Audit)
    await supabaseAdmin.from('payments').insert({
      patient_id: metadata.patient_id,
      nutritionist_id: metadata.nutritionist_id,
      amount_brl: Number(metadata.price),
      currency: 'brl',
      status: 'paid',
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent,
      appointment_id: newAppointment.id,
      created_at: new Date().toISOString()
    })

    console.log(`Appointment created successfully: ${newAppointment.id}`)
    return NextResponse.json({ received: true, appointment_id: newAppointment.id })
  }

  return NextResponse.json({ received: true })
}
