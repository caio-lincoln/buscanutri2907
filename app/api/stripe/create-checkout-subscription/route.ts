import { stripe } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }

  const data = await req.json()

  const { data: subRow } = await supabase
  .from('user_subscriptions')
  .select('stripe_customer_id')
  .eq('user_id', user.id)
  .single();
  
  const customer =
    subRow?.stripe_customer_id ??
    (
      await stripe.customers.create({
        email: user.email as string ?? undefined,
        metadata: { user_id: user.id },
      })
    ).id;
    try {
      if (!subRow?.stripe_customer_id) {
        await supabase
          .from('user_subscriptions')
          .insert({
            user_id: user.id,
            stripe_customer_id: customer,
            status: 'incomplete',
          });
      }
      
    } catch (error) {
      console.log("🚀 ~ POST ~ error:", error)
      
    }
  // Se não tinha customer, já persiste

  const origin = process.env[ 'APP_BASE_URL' ] || new URL(req.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer,
    line_items: [ { price: data.priceId, quantity: 1 } ],
    success_url: `${origin}/pagamento/sucesso?from=stripe&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard/nutricionistas?activeTab=assinatura&canceled=1`,
    // Para permitir trials se o Price tiver trial configurado
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
  });

  return NextResponse.json({ url: session.url });
}
