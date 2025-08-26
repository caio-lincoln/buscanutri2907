import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server' 

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(req.url)
    const nutritionistUserId = searchParams.get('nutritionistUserId')

    if (!nutritionistUserId) {
      return NextResponse.json({ error: 'nutritionistUserId requerido' }, { status: 400 })
    }

    const { data: np, error } = await supabase
      .from('nutritionist_profiles')
      .select('id, stripe_account_id, stripe_onboarding_complete')
      .eq('user_id', nutritionistUserId)
      .maybeSingle()

    if (error || !np) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    // Ainda não tem conta conectada
    if (!np.stripe_account_id) {
      return NextResponse.json({
        connected: false,
        onboarded: false,
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false,
        needsOnboarding: true,
        db_flag: np.stripe_onboarding_complete,
      })
    }

    // Consulta status real na Stripe
    const acct = await stripe.accounts.retrieve(np.stripe_account_id)

    const { charges_enabled, payouts_enabled, details_submitted, requirements } = acct
    const onboarded = Boolean(details_submitted && (charges_enabled || payouts_enabled))

    return NextResponse.json({
      connected: true,
      accountId: acct.id,
      onboarded,
      charges_enabled,
      payouts_enabled,
      details_submitted,
      requirements, // útil p/ debug (itens faltando)
      db_flag: np.stripe_onboarding_complete,
    })
  } catch (e: any) {
    console.error('account-status error', e)
    return NextResponse.json({ error: e.message || 'Erro interno' }, { status: 500 })
  }
}
