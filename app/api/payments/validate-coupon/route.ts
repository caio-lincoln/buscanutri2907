import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'

async function validatePromotionCode(
  couponCode: string,
  amountInCents: number,
  currency: string,
): Promise<{
  promotionCode: Stripe.PromotionCode
  coupon: Stripe.Coupon
  discountAmountInCents: number
  finalAmountInCents: number
}> {
  if (!stripe) {
    throw new Error('Stripe não inicializado')
  }

  const list = await stripe.promotionCodes.list({
    code: couponCode,
    active: true,
    limit: 1,
    expand: [ 'data.coupon' ],
  })

  const promotionCode = list.data[ 0 ]
  if (!promotionCode) {
    throw new Error('Cupom inválido ou expirado')
  }

  const coupon = promotionCode.coupon as Stripe.Coupon

  if (coupon.valid === false) {
    throw new Error('Cupom inválido ou expirado')
  }

  let discountAmountInCents = 0

  if (coupon.percent_off) {
    discountAmountInCents = Math.round(amountInCents * (coupon.percent_off / 100))
  } else if (coupon.amount_off && coupon.currency?.toLowerCase() === currency.toLowerCase()) {
    discountAmountInCents = coupon.amount_off
  }

  const finalAmountInCents = Math.max(amountInCents - discountAmountInCents, 0)

  return {
    promotionCode,
    coupon,
    discountAmountInCents,
    finalAmountInCents,
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ message: 'Stripe não configurado' }, { status: 500 })
    }

    const { coupon_code, base_amount_brl, currency = 'brl' } = await req.json()

    if (!coupon_code || typeof coupon_code !== 'string') {
      return NextResponse.json({ message: 'Cupom não informado' }, { status: 400 })
    }

    const amountBrl = Number(base_amount_brl)
    if (!amountBrl || amountBrl <= 0) {
      return NextResponse.json({ message: 'Valor base inválido' }, { status: 400 })
    }

    const amountInCents = Math.round(amountBrl * 100)

    const validation = await validatePromotionCode(coupon_code.trim(), amountInCents, currency)

    return NextResponse.json({
      valid: true,
      coupon_code: coupon_code.trim(),
      amount_original: amountBrl,
      amount_final: validation.finalAmountInCents / 100,
      discount_value: validation.discountAmountInCents / 100,
      percent_off: validation.coupon.percent_off ?? null,
      amount_off: validation.coupon.amount_off ? validation.coupon.amount_off / 100 : null,
    })
  } catch (err: any) {
    console.error('Erro ao validar cupom:', err)
    return NextResponse.json(
      { message: err.message || 'Cupom inválido ou expirado', valid: false },
      { status: 400 },
    )
  }
}

