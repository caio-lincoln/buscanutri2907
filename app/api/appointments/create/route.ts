
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // DOMAIN RULE: BLOCK LEGACY TABLE USAGE
    // appointments table is deprecated. All new sessions must go through the payment flow -> teleconsulta_sessions.
    return NextResponse.json(
      { error: 'This endpoint is deprecated. Please use the payment flow to schedule a consultation.' },
      { status: 410 } // Gone
    )

    /* LEGACY CODE BLOCKED
    const body = await request.json()
    const { nutritionist_id, scheduled_at, price } = body


    if (!nutritionist_id || !scheduled_at || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Basic validation: Check if slot is in the future
    if (new Date(scheduled_at) < new Date()) {
      return NextResponse.json(
        { error: 'Cannot schedule in the past' },
        { status: 400 }
      )
    }

    // Fetch Patient Profile
    const { data: patientProfile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('id, full_name, phone')
      .eq('user_id', user.id)
      .single()

    if (profileError || !patientProfile) {
      console.error('[CreateAppointment] Error fetching patient profile:', {
        userId: user.id,
        error: profileError,
        metadata: user.user_metadata
      })

      // Check if user is a nutritionist
      const isNutritionist = user.user_metadata?.user_type === 'nutricionista' || 
                            user.app_metadata?.user_type === 'nutricionista';
                            
      if (isNutritionist) {
        return NextResponse.json(
          { error: 'Nutritionists cannot book appointments. Please use a patient account.' },
          { status: 403 }
        )
      }

      return NextResponse.json(
        { error: 'Patient profile not found. Please complete your profile first.' },
        { status: 404 }
      )
    }

    // Extract Date and Time from scheduled_at (ISO string)
    // scheduled_at is like "2023-10-27T14:00:00.000Z"
    // We need to store local date/time or UTC?
    // The schema says 'date' and 'time without time zone'.
    // Usually these are intended for local time or just the date part.
    // Let's assume UTC for consistency with scheduled_at, or extract based on a default timezone if needed.
    // However, since we have scheduled_at (timestamptz), these fields might be legacy redundant fields.
    // But they are NOT NULL, so we MUST fill them.
    
    const scheduledDate = new Date(scheduled_at)
    // Format as YYYY-MM-DD
    const appointment_date = scheduledDate.toISOString().split('T')[0]
    // Format as HH:mm:ss
    const appointment_time = scheduledDate.toISOString().split('T')[1].substring(0, 8)

    // Check for existing appointment in the same slot to avoid unique constraint violation
    const { data: existingAppointment } = await supabase
      .from('appointments')
      .select('id, status, payment_status, patient_id')
      .eq('nutritionist_id', nutritionist_id)
      .eq('appointment_date', appointment_date)
      .eq('appointment_time', appointment_time)
      .maybeSingle()

    if (existingAppointment) {
      // If it's the SAME patient trying to re-book/pay the same slot
      if (existingAppointment.patient_id === patientProfile.id) {
         // If status is agendado or pending payment, we reuse it
         if (['agendado', 'pendente'].includes(existingAppointment.status)) {
             return NextResponse.json({ appointment_id: existingAppointment.id })
         }
         // If status is cancelled, we might need to update/delete it first to allow new insert, 
         // but unique constraint prevents insert anyway.
         // Let's UPDATE it to 'agendado' instead of insert.
         if (existingAppointment.status === 'cancelado') {
             const { error: updateError } = await supabase
                .from('appointments')
                .update({ 
                    status: 'agendado', 
                    payment_status: 'pendente',
                    price, // update price if changed
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingAppointment.id)
             
             if (updateError) {
                 return NextResponse.json({ error: 'Failed to reactivate appointment' }, { status: 500 })
             }
             return NextResponse.json({ appointment_id: existingAppointment.id })
         }
      }

      // If slot is taken by another patient (or confirmed/completed), block it
      if (['agendado', 'confirmado', 'concluido'].includes(existingAppointment.status)) {
          return NextResponse.json(
           { error: 'Horário já reservado.' },
           { status: 409 }
         )
      }
      
      // If we are here, existing appointment is likely 'cancelado' but by ANOTHER patient?
      // Or some other edge case. The unique constraint will still block INSERT.
      // If it's cancelled, we should probably DELETE it to free up the slot for the new patient.
      if (existingAppointment.status === 'cancelado') {
          await supabase.from('appointments').delete().eq('id', existingAppointment.id)
          // Proceed to insert new one below
      }
    }

    // Insert appointment
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: patientProfile.id, // Use profile ID, not auth ID
        nutritionist_id,
        scheduled_at,
        price,
        status: 'agendado', // Changed from 'pending_payment' to match DB constraint
        payment_status: 'pendente', // Default payment status
        // Required legacy/redundant fields
        appointment_date,
        appointment_time,
        patient_name: patientProfile.full_name,
        patient_email: user.email,
        patient_phone: patientProfile.phone,
        is_online: true, // Default to online for this flow
        type: 'online',   // Default type
        duration_minutes: 60, // Default duration, or fetch from service?
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating appointment:', error)
      return NextResponse.json(
        { error: 'Failed to create appointment', details: error.message, code: error.code, hint: error.hint },
        { status: 500 }
      )
    }

    return NextResponse.json({ appointment_id: data.id })
    */
  } catch (error) {
    console.error('Internal error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
