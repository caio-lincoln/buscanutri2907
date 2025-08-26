import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET() {
  const prices = await stripe.prices.list({
    active: true,
    expand: [ 'data.product' ],
    limit: 100,
  })

  const offers = prices.data
    .filter(p => typeof p.unit_amount === 'number' && p.recurring)
    .map(p => {
      const product = p.product as Stripe.Product
      return {
        priceId: p.id,
        productId: product.id,
        name: product.name,
        description: product.description ?? '',
        label: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: p.currency.toUpperCase() })
          .format((p.unit_amount ?? 0) / 100) + `/${p.recurring?.interval}`,
      }
    })

  return NextResponse.json({ offers })
}
