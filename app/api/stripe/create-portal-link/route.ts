import { stripe } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';

export async function POST(_req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const { data: subRow, error } = await supabase
    .from('user_subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  if (error || !subRow?.stripe_customer_id) {
    return NextResponse.json({ error: 'no_customer' }, { status: 400 });
  }

  const origin = process.env[ 'APP_BASE_URL' ] || new URL(_req.url).origin;
  const return_url = `${origin}/dashboard/nutricionistas?activeTab=assinatura`;
  const portal = await stripe.billingPortal.sessions.create({
    customer: subRow.stripe_customer_id,
    return_url,
  });
  console.log("🚀 ~ POST ~ portal:", portal)

  return NextResponse.json({ url: portal.url });
}
