import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { stripe } from '../../../../lib/stripe'

const supabaseAdmin = createAdminClient()

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') || ''
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env[ 'STRIPE_WEBHOOK_SECRET' ] as string
    )
  } catch (e1: any) {
    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env[ 'STRIPE_CONNECT_WEBHOOK_SECRET' ] as string
      )
    } catch (e2: any) {
      console.error('Webhook signature verify failed:', e1?.message, e2?.message)
      return new NextResponse(`Webhook Error: signature`, { status: 400 })
    }
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const metadata = session.metadata || {}

        if (metadata[ 'type' ] === 'teleconsulta') {
          const patient_id = session.client_reference_id || metadata.patient_id
          const nutritionist_id = metadata.nutritionist_id
          const teleconsulta_session_id = metadata.teleconsulta_session_id
          const scheduled_for = metadata.scheduled_for
          const duration_minutes = Number(metadata.duration_minutes || 60)
          const price_brl = Number(metadata.price_brl || 0)
          const stripe_payment_intent_id = String(session.payment_intent || '')

          // Atualiza a sessão/consulta
          const { error: upErr } = await supabaseAdmin
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

          if (upErr) console.error('Erro ao atualizar teleconsulta:', upErr)

          // Registra pagamento
          const { error: payErr } = await supabaseAdmin.from('payments').insert({
            patient_id,
            nutritionist_id,
            amount_brl: price_brl,
            currency: 'brl',
            status: 'succeeded',
            stripe_session_id: session.id,
            stripe_payment_intent_id,
            raw: session as any,
          })
          if (payErr) console.error('Erro ao inserir payment:', payErr)
        }

        break
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account

        const onboardingComplete =
          !!account.details_submitted &&
          !!account.charges_enabled &&
          !!account.payouts_enabled

        const { error } = await supabaseAdmin
          .from('nutritionist_profiles')
          .update({
            stripe_onboarding_complete: onboardingComplete,

            updated_at: new Date().toISOString(),
          })
          .eq('stripe_account_id', account.id)

        if (error) {
          console.error('Erro ao marcar onboarding como completo:', error)
        } else {
          console.log(
            `Connect account ${account.id} => onboarding_complete=${onboardingComplete}`
          )
        }

        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;

        const customerId =
          typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
        const subscriptionId = sub.id;
        const status = sub.status; 
        const currentPeriodEndIso = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null;
        const cancelAtPeriodEnd = !!sub.cancel_at_period_end;

        let userId = await findUserIdByStripeCustomerId(customerId);
        if (!userId) {
          try {
            const cust = await stripe.customers.retrieve(customerId);
            if (typeof cust !== 'string' && cust.metadata?.user_id) {
              userId = cust.metadata.user_id as string;
            }
          } catch { }
        }
        if (!userId) {
          console.error('Sem user_id resolvido para customer', customerId);
          break;
        }

        const { error: upErr } = await supabaseAdmin
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            status,
            current_period_end: currentPeriodEndIso, // ✅ pode ser null
            cancel_at_period_end: cancelAtPeriodEnd,
            updated_at: new Date().toISOString(),
          });

        if (upErr) console.error('Erro ao upsert user_subscriptions:', upErr);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.billing_reason !== 'subscription_cycle') break
        const customerId =
          typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id

        if (!customerId) break

        const userId = await findUserIdByStripeCustomerId(customerId)
        if (!userId) break

        const { error } = await supabaseAdmin
          .from('user_subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('stripe_customer_id', customerId)

        if (error) console.error('Erro ao marcar past_due:', error)
        break
      }

      case 'account.application.deauthorized': {
        const data = event.data.object as { account: string }
        const accountId = data.account

        const { error } = await supabaseAdmin
          .from('nutritionist_profiles')
          .update({
            stripe_onboarding_complete: false,
            // você pode optar por manter o account_id ou limpar:
            // stripe_account_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_account_id', accountId)

        if (error) console.error('Erro ao tratar deauthorized:', error)
        break
      }

      // (Opcional) você também pode observar:
      // - 'account.external_account.created/updated/deleted'
      // - 'capability.updated'
      // para refletir status mais granular da conta conectada
      default:
        // Outros eventos não tratados
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Erro no webhook:', err)
    return new NextResponse('Webhook handler failed', { status: 500 })
  }
}

async function findUserIdByStripeCustomerId(customerId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (error) return null
  return (data?.user_id as string) ?? null
}