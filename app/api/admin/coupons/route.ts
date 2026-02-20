import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { requireAdmin } from '@/lib/auth-utils'
import { requireProductionAuth, logProductionOperation, ProductionAuthorizationError } from '@/lib/production-auth'
import { z } from 'zod'

const createCouponSchema = z.object({
  code: z.string().min(3).max(64),
  name: z.string().min(1).max(120),
  type: z.enum([ 'percent', 'amount' ]),
  percent_off: z.number().min(1).max(100).optional(),
  amount_off_brl: z.number().min(1).optional(),
  max_redemptions: z.number().int().min(1).optional(),
  expires_at: z.string().datetime().optional(),
})

export async function GET() {
  try {
    await requireAdmin()

    const promotionCodes = await stripe.promotionCodes.list({
      limit: 50,
      expand: [ 'data.coupon' ],
    })

    const items = promotionCodes.data.map(pc => {
      const coupon = pc.coupon as any

      return {
        id: pc.id,
        code: pc.code,
        active: pc.active,
        created: pc.created ? pc.created * 1000 : null,
        expires_at: pc.expires_at ? pc.expires_at * 1000 : null,
        max_redemptions: pc.max_redemptions ?? null,
        times_redeemed: pc.times_redeemed ?? 0,
        coupon_id: coupon?.id ?? null,
        name: coupon?.name ?? null,
        percent_off: coupon?.percent_off ?? null,
        amount_off: coupon?.amount_off ? coupon.amount_off / 100 : null,
        currency: coupon?.currency ?? 'brl',
      }
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error in GET /api/admin/coupons:', error)
    return NextResponse.json({ error: 'Erro ao listar cupons' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    const body = await request.json()

    requireProductionAuth(request, body, 'criação de cupom Stripe')

    const parsed = createCouponSchema.parse(body)

    const currency = 'brl'
    let amountOffInCents: number | undefined

    if (parsed.type === 'percent') {
      if (!parsed.percent_off) {
        return NextResponse.json({ error: 'percent_off é obrigatório para cupons percentuais' }, { status: 400 })
      }
    } else {
      if (!parsed.amount_off_brl) {
        return NextResponse.json({ error: 'amount_off_brl é obrigatório para cupons de valor fixo' }, { status: 400 })
      }
      amountOffInCents = Math.round(parsed.amount_off_brl * 100)
    }

    const coupon = await stripe.coupons.create({
      name: parsed.name,
      percent_off: parsed.type === 'percent' ? parsed.percent_off : undefined,
      amount_off: parsed.type === 'amount' ? amountOffInCents : undefined,
      currency: parsed.type === 'amount' ? currency : undefined,
      max_redemptions: parsed.max_redemptions,
      redeem_by: parsed.expires_at ? Math.floor(new Date(parsed.expires_at).getTime() / 1000) : undefined,
      duration: 'once',
    })

    const promo = await stripe.promotionCodes.create({
      code: parsed.code,
      coupon: coupon.id,
      max_redemptions: parsed.max_redemptions,
      expires_at: parsed.expires_at ? Math.floor(new Date(parsed.expires_at).getTime() / 1000) : undefined,
      active: true,
    })

    logProductionOperation('CREATE_STRIPE_COUPON', promo.id, admin.id)

    return NextResponse.json({
      id: promo.id,
      code: promo.code,
      active: promo.active,
      created: promo.created ? promo.created * 1000 : null,
      expires_at: promo.expires_at ? promo.expires_at * 1000 : null,
      max_redemptions: promo.max_redemptions ?? null,
      times_redeemed: promo.times_redeemed ?? 0,
      coupon_id: coupon.id,
      name: coupon.name,
      percent_off: coupon.percent_off ?? null,
      amount_off: coupon.amount_off ? coupon.amount_off / 100 : null,
      currency: coupon.currency ?? currency,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    if (error instanceof ProductionAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error in POST /api/admin/coupons:', error)
    return NextResponse.json({ error: 'Erro ao criar cupom' }, { status: 500 })
  }
}

