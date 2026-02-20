import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { requireAdmin } from '@/lib/auth-utils'
import { requireProductionAuth, logProductionOperation, ProductionAuthorizationError } from '@/lib/production-auth'

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    const body = await request.json()
    const id = body?.id as string | undefined

    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
    }

    requireProductionAuth(request, body, 'desativação de cupom Stripe')

    const updated = await stripe.promotionCodes.update(id, {
      active: false,
    })

    logProductionOperation('DEACTIVATE_STRIPE_COUPON', id, admin.id)

    return NextResponse.json({
      id: updated.id,
      code: updated.code,
      active: updated.active,
    })
  } catch (error) {
    if (error instanceof ProductionAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error in POST /api/admin/coupons/deactivate:', error)
    return NextResponse.json({ error: 'Erro ao desativar cupom' }, { status: 500 })
  }
}

