import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { formatDateBR } from '../../../../lib/utils/format-date'

const stripe = new Stripe(process.env['STRIPE_SECRET_KEY'], {
  apiVersion: '2025-07-30.basil',
})

export async function POST(req: NextRequest) {
  try {
    const origin = process.env['APP_BASE_URL'] || new URL(req.url).origin
    const {
      patient_id,
      patient_email,
      nutritionist_id,
      nutritionist_name,
      scheduled_for,
      duration_minutes,
      price_brl,
      teleconsulta_session_id,
    } = await req.json()

    if (!patient_id || !nutritionist_id || !scheduled_for || !price_brl || !teleconsulta_session_id) {
      return NextResponse.json({ message: 'Dados incompletos' }, { status: 400 })
    }

    const amount = Math.round(Number(price_brl) * 100)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: [ 'card' ],
      customer_email: patient_email || undefined,
      client_reference_id: patient_id, 
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'brl',
            unit_amount: amount,
            product_data: {
              name: `Teleconsulta com ${nutritionist_name || 'nutricionista'}`,
              description: `Data/Hora: ${formatDateBR(scheduled_for)} · Duração: ${duration_minutes || 60} min`,
            },
          },
        },
      ],
      metadata: {
        teleconsulta_session_id,
        patient_id,
        nutritionist_id,
        scheduled_for,
        duration_minutes: String(duration_minutes || 60),
        price_brl: String(price_brl),
      },
      success_url: `${origin}/pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pagamento/cancelado`,
      billing_address_collection: 'auto',
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ message: err.message || 'Erro' }, { status: 500 })
  }
}
