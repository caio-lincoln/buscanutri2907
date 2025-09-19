import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { nutritionistUserId } = await req.json()
    if (!nutritionistUserId) {
      return NextResponse.json({ error: 'nutritionistUserId requerido' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: np, error } = await supabase
      .from('nutritionist_profiles')
      .select('stripe_account_id')
      .eq('user_id', nutritionistUserId)
      .maybeSingle()

    if (error || !np) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    if (!np.stripe_account_id) return NextResponse.json({ error: 'Conta Stripe não conectada' }, { status: 400 })

    const link = await stripe.accounts.createLoginLink(np.stripe_account_id)
    return NextResponse.json({ url: link.url })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erro' }, { status: 500 })
  }
}
