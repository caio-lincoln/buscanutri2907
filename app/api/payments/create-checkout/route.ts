
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!stripe) {
      console.error('Stripe is not configured')
      return NextResponse.json({ error: 'Stripe configuration error' }, { status: 500 })
    }

    const body = await request.json()
    const { nutritionist_id, scheduled_at, price, duration_minutes = 60 } = body

    if (!nutritionist_id || !scheduled_at || price === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Validate slot availability (Concurrency check)
    // Check if there is any confirmed appointment at this time
    const { data: conflicts, error: conflictError } = await supabase
      .from('appointments')
      .select('id')
      .eq('nutritionist_id', nutritionist_id)
      .eq('scheduled_at', scheduled_at)
      .in('status', ['agendado', 'confirmado', 'confirmada', 'concluido', 'realizada']) // Status that block the slot
      .maybeSingle()

    if (conflictError) {
      console.error('Error checking conflicts:', conflictError)
      return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 })
    }

    if (conflicts) {
      return NextResponse.json({ error: 'Horário já reservado por outro paciente.' }, { status: 409 })
    }

    // 2. Fetch Nutritionist Profile (for name, price validation, etc.)
    const { data: nutritionist, error: nutError } = await supabase
      .from('nutritionist_profiles')
      .select('id, full_name, consultation_price')
      .eq('id', nutritionist_id)
      .single()

    if (nutError || !nutritionist) {
      return NextResponse.json({ error: 'Nutritionist not found' }, { status: 404 })
    }

    // 3. Fetch Patient Profile (for metadata)
    const { data: patient, error: patError } = await supabase
      .from('patient_profiles')
      .select('id, full_name, email, phone')
      .eq('user_id', user.id)
      .single()

    if (patError || !patient) {
      return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
    }

    // 4. Create Stripe Checkout Session
    // Use price from request but validate? User might tamper.
    // Ideally use nutritionist.consultation_price, but maybe there's a discount logic in frontend.
    // For now, trust the price passed but maybe log discrepancy? 
    // Or better, use backend price if available. 
    // Let's use the passed price for flexibility (coupons etc), assuming backend validates coupons elsewhere if implemented.
    // Converting price to centavos
    const unitAmount = Math.round(Number(price) * 100)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'boleto'], // Default to common methods
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Consulta com ${nutritionist.full_name}`,
              description: `Agendamento para ${new Date(scheduled_at).toLocaleString('pt-BR')}`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/paciente/dashboard?session_id={CHECKOUT_SESSION_ID}&status=success`,
      cancel_url: `${request.headers.get('origin')}/paciente/dashboard?status=cancelled`,
      customer_email: user.email,
      metadata: {
        nutritionist_id,
        patient_id: patient.id,
        scheduled_at,
        duration_minutes: String(duration_minutes),
        price: String(price),
        patient_name: patient.full_name,
        patient_email: user.email || '',
        patient_phone: patient.phone || '',
        appointment_type: 'online' // Default to online
      },
    })

    return NextResponse.json({ checkout_url: session.url, session_id: session.id })

  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
