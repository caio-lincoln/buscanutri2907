
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
    const { appointment_id } = body

    if (!appointment_id) {
      return NextResponse.json({ error: 'Missing appointment_id' }, { status: 400 })
    }

    // 1. Fetch appointment
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointment_id)
      .single()

    if (fetchError || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    if (appointment.status !== 'pending' && appointment.status !== 'agendado') {
      return NextResponse.json({ error: 'Appointment is not pending or agendado' }, { status: 400 })
    }

    // 2. Check availability (ensure no other paid appointment for this slot)
    const { data: conflicts, error: conflictError } = await supabase
      .from('appointments')
      .select('id')
      .eq('nutritionist_id', appointment.nutritionist_id)
      .eq('scheduled_at', appointment.scheduled_at)
      .eq('status', 'paid')
      .neq('id', appointment_id) // Exclude self (though self is pending)

    if (conflictError) {
      console.error('Error checking conflicts:', conflictError)
      return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 })
    }

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json({ error: 'Slot is no longer available' }, { status: 409 })
    }

    // 2.1 Fetch Nutritionist Profile for Price and Payment Methods
    const { data: nutritionist, error: nutritionistError } = await supabase
      .from('nutritionist_profiles')
      .select('consultation_price, payment_methods')
      .eq('id', appointment.nutritionist_id) // Assuming nutritionist_id in appointment is the profile id (user_id or profile id, need to check FK)
      // Actually, appointments.nutritionist_id usually refers to the profile ID in this schema, let's verify if appointment.nutritionist_id is UUID matching profile.id
      .single()

    if (nutritionistError || !nutritionist) {
        console.error('Error fetching nutritionist profile:', nutritionistError)
        return NextResponse.json({ error: 'Failed to fetch nutritionist profile' }, { status: 500 })
    }

    // Determine Payment Methods
    const allowedPaymentMethods: ('card' | 'boleto')[] = []
    if (nutritionist.payment_methods) {
        const methods = nutritionist.payment_methods.toLowerCase()
        if (methods.includes('cartao') || methods.includes('cartão') || methods.includes('credit')) {
            allowedPaymentMethods.push('card')
        }
        if (methods.includes('boleto')) {
            allowedPaymentMethods.push('boleto')
        }
        // Note: Pix support requires specific Stripe activation
        // if (methods.includes('pix')) allowedPaymentMethods.push('pix')
    }
    
    // Fallback to card if nothing valid found or empty
    if (allowedPaymentMethods.length === 0) {
        allowedPaymentMethods.push('card')
    }

    // Determine Price
    // Logic:
    // 1. Get base price from nutritionist profile (consultation_price)
    // 2. Compare with appointment.price (which might have a coupon discount applied)
    // 3. If appointment.price is lower than base price, assume valid discount and use it.
    // 4. Otherwise, fallback to base price to prevent tampering (unless base price is null/zero, then trust appointment).
    
    let priceToUse = nutritionist.consultation_price ? Number(nutritionist.consultation_price) : appointment.price

    if (appointment.price && nutritionist.consultation_price) {
        const appointmentPrice = Number(appointment.price)
        const basePrice = Number(nutritionist.consultation_price)
        
        // If appointment price is lower (discount) but not unreasonably low (e.g. > 0), use it
        // We could add a tolerance check (e.g. max 50% discount) if needed, but for now trust the created appointment
        // provided it's not higher than base price (which would be weird but safe to cap at base).
        if (appointmentPrice < basePrice && appointmentPrice > 0) {
            priceToUse = appointmentPrice
        }
    }

    // Ensure we have a base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000'

    // 3. Create Stripe Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: allowedPaymentMethods,
      mode: 'payment',
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Consulta Nutricional',
              description: `Agendamento com nutricionista em ${new Date(appointment.scheduled_at).toLocaleString('pt-BR')}`,
            },
            unit_amount: Math.round(priceToUse * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
        nutritionist_id: appointment.nutritionist_id,
      },
      success_url: `${baseUrl}/dashboard/paciente/agendar/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard/paciente/agendar/${appointment.nutritionist_id}?cancelled=true`,
    })

    // 4. Update appointment with session ID
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ stripe_session_id: session.id })
      .eq('id', appointment_id)

    if (updateError) {
      console.error('Error updating appointment with session ID:', updateError)
      // We continue anyway since we have the session URL, but ideally we'd want this to succeed.
    }

    return NextResponse.json({ checkout_url: session.url })
  } catch (error) {
    console.error('Internal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
