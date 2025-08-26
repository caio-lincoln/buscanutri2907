// app/api/stripe/connect/onboard-link/route.ts
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe'; // Stripe com STRIPE_SECRET_KEY
import { createClient } from '../../../../lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const origin = process.env[ 'APP_BASE_URL' ] || new URL(req.url).origin;

    const { accountId: fromBody } = (await req.json().catch(() => ({}))) || {};
    let accountId = fromBody as string | undefined;

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    const { data: np, error } = await supabase
      .from('nutritionist_profiles')
      .select('id, user_id, full_name, stripe_account_id')
      .eq('user_id', user.id)
      .single();

    if (error || !np) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    if (np.stripe_account_id) {
      accountId = np.stripe_account_id;
    } else {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'BR',
        email: user.email as string,
        business_type: 'individual',
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
        metadata: {
          nutritionist_profile_id: np.id,
          user_id: np.user_id,
        },
        business_profile: {
          product_description: 'Atendimentos de nutrição',
        },
      });

      accountId = account.id;

      await supabase
        .from('nutritionist_profiles')
        .update({ stripe_account_id: account.id })
        .eq('id', np.id);
    }

    const link = await stripe.accountLinks.create({
      account: accountId!,
      refresh_url: `${origin}/dashboard/nutricionistas/pagamentos?refresh=1`,
      return_url: `${origin}/dashboard/nutricionistas/pagamentos?return=1`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: link.url });
  } catch (err) {
    console.log("🚀 ~ POST ~ err:", err)
    console.error('onboard-link error:', err);
    return NextResponse.json({ error: 'Erro ao criar link de onboarding' }, { status: 500 });
  }
}
