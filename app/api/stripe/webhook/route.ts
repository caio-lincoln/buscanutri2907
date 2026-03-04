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
    console.error('Stripe not configured')
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const body = await req.text()
  const signature = (await headers()).get('stripe-signature') as string

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

  // Global Try/Catch to prevent 500 errors from crashing the webhook response
  try {
    console.log(`Processing event: ${event.type} [${event.id}]`)

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object)
        break

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.created': // Added created just in case, though usually handled via checkout
        await handleSubscriptionUpdated(event.data.object, event.type)
        break

      case 'account.updated':
        await handleAccountUpdated(event.data.object)
        break

      case 'payment_intent.succeeded':
        console.log(`Payment intent succeeded: ${event.data.object.id}`)
        // We generally handle fulfillment in checkout.session.completed, but logging here is good
        break

      case 'invoice.payment_failed':
        console.log(`Invoice payment failed: ${event.data.object.id}`)
        // Could implement logic to notify user or update subscription status if needed
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error(`Error processing webhook event ${event.type}:`, error)
    // IMPORTANT: Return 200 even on error to prevent Stripe from retrying indefinitely
    // unless it's a transient error we actually want to retry (which is rare for logic errors)
    return NextResponse.json({ received: true, error: error.message }, { status: 200 })
  }
}

// HANDLERS

async function handleCheckoutSessionCompleted(session: any) {
  const metadata = session.metadata

  // HANDLE SUBSCRIPTION CHECKOUT
  if (session.mode === 'subscription') {
    const subscriptionId = session.subscription as string
    const customerId = session.customer as string
    
    console.log(`Processing subscription checkout for session ${session.id}`)

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    // Handle potential missing current_period_end (API version diffs)
    const currentPeriodEnd = subscription.current_period_end 
       || subscription.items?.data?.[0]?.current_period_end 
       || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

    // Update user_subscriptions
    // Priority for user_id:
    // 1. Session metadata
    // 2. Subscription metadata
    // 3. Existing record in user_subscriptions (via customer_id)
    
    let userId = metadata?.user_id || subscription.metadata?.user_id
    
    if (!userId) {
       // Try to find by stripe_customer_id
       const { data: sub } = await supabaseAdmin
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()
       
       if (sub) {
          userId = sub.user_id
       } else {
          console.error('User not found for subscription checkout', session.id)
          // We return here, but the main loop catches it and returns 200
          return
       }
    }

    const { error: updateError } = await supabaseAdmin
       .from('user_subscriptions')
       .upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: subscription.status,
          current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString()
       })
    
    if (updateError) {
       console.error('Error updating user_subscriptions:', updateError)
       throw new Error('Database update failed')
    }

    console.log(`User subscription updated for user ${userId}`)
    return
  }

  // HANDLE TELECONSULTA CHECKOUT (existing logic)
  if (!metadata || !metadata.nutritionist_id || !metadata.patient_id || !metadata.scheduled_at) {
    console.warn('Missing required metadata for teleconsulta', metadata)
    return // Not a teleconsulta session or malformed
  }

  // 1. Idempotency Check
  const paymentIntentId = session.payment_intent as string

  if (paymentIntentId) {
    const { data: existingSession } = await supabaseAdmin
      .from('teleconsulta_sessions')
      .select('id')
      .eq('payment_intent_id', paymentIntentId)
      .maybeSingle()

    if (existingSession) {
      console.log(`Session already created for payment intent ${paymentIntentId}`)
      return
    }
  } else {
      console.warn('Missing payment_intent_id in session', session.id)
  }

  // 2. Concurrency/Conflict Check
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
      
      // We don't throw here to avoid retrying a conflict that won't resolve
      return 
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
    payment_intent_id: paymentIntentId,
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
    throw new Error('Failed to create session')
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
      teleconsulta_session_id: newSession.id,
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (paymentError) {
      console.error('Error recording payment:', paymentError)
  } else {
      // 6. Update session with payment_id if needed
      await supabaseAdmin
          .from('teleconsulta_sessions')
          .update({ payment_id: newPayment.id })
          .eq('id', newSession.id)
  }

  console.log(`Teleconsulta session created successfully: ${newSession.id}`)
}

async function handleSubscriptionUpdated(subscription: any, eventType: string) {
  const customerId = subscription.customer as string

  console.log(`Processing subscription update ${subscription.id} (${eventType})`)

  const currentPeriodEnd = subscription.current_period_end 
     || subscription.items?.data?.[0]?.current_period_end 
     || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

  const { error: updateError } = await supabaseAdmin
      .from('user_subscriptions')
      .update({
          status: subscription.status,
          current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)

  if (updateError) {
      // Fallback: try by customer_id
      console.warn('Could not update by subscription_id, trying customer_id', updateError)
      await supabaseAdmin
          .from('user_subscriptions')
          .update({
              status: subscription.status,
              current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              stripe_subscription_id: subscription.id,
              updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', customerId)
  }
}

async function handleAccountUpdated(account: any) {
  // O payload mostra contas Stripe Connect com metadata:
  // metadata: { user_id, nutritionist_profile_id }
  
  const userId = account.metadata?.user_id
  const profileId = account.metadata?.nutritionist_profile_id

  if (!profileId) {
    console.log("Account updated sem metadata necessária (nutritionist_profile_id)")
    // Try to find by stripe_account_id if metadata is missing (sometimes happens)
    if (account.id) {
       console.log(`Trying to find profile by stripe_account_id: ${account.id}`)
       const { error } = await supabaseAdmin
        .from("nutritionist_profiles")
        .update({
          stripe_account_status: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
          stripe_onboarding_complete: account.details_submitted && account.charges_enabled, // Derived field
          updated_at: new Date().toISOString()
        })
        .eq("stripe_account_id", account.id)
        
       if (error) console.error("Error updating profile by account_id:", error)
    }
    return
  }

  console.log(`Updating Stripe Connect status for profile ${profileId}`)

  const { error } = await supabaseAdmin
  .from("nutritionist_profiles")
  .update({
    stripe_account_status: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    details_submitted: account.details_submitted,
    stripe_onboarding_complete: account.details_submitted && account.charges_enabled,
    updated_at: new Date().toISOString()
  })
  .eq("id", profileId)

  if (error) {
    console.error("Error updating nutritionist_profiles for account.updated:", error)
    throw error
  }
}
