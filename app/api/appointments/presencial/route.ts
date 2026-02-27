
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const presencialAppointmentSchema = z.object({
  patient_id: z.string().uuid(),
  professional_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  appointment_type: z.literal('presencial'),
  address_id: z.string().uuid()
})

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

    const body = await request.json()
    
    // 1. Validate Payload
    const result = presencialAppointmentSchema.safeParse(body)
    if (!result.success) {
      console.warn(`[Security] Invalid payload in presencial appointment attempt by user ${user.id}:`, JSON.stringify(result.error.format()))
      return NextResponse.json(
        { error: 'Invalid payload', details: result.error.format() },
        { status: 400 }
      )
    }

    const { patient_id, professional_id, date, time, appointment_type, address_id } = result.data

    // Ensure the authenticated user matches the patient_id (security check)
    // Assuming patient_id is the profile ID, we need to check if it belongs to the user.
    // Or we can just use the user.id to find the profile and override patient_id.
    // For now, let's verify the patient profile exists for this user.
    const { data: patientProfile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('id, full_name, phone, user_id') // Added user_id to verify ownership
      .eq('id', patient_id)
      .single()

    if (profileError || !patientProfile) {
      return NextResponse.json(
        { error: 'Patient profile not found' },
        { status: 404 }
      )
    }

    if (patientProfile.user_id !== user.id) {
         return NextResponse.json(
        { error: 'Unauthorized: Patient ID does not match authenticated user' },
        { status: 403 }
      )
    }

    // 2. Validate Professional
    const { data: nutritionist, error: nutError } = await supabase
      .from('nutritionist_profiles')
      .select('id, atendimento_presencial, user_id')
      .eq('id', professional_id)
      .single()

    if (nutError || !nutritionist) {
      return NextResponse.json(
        { error: 'Professional not found' },
        { status: 404 }
      )
    }

    if (!nutritionist.atendimento_presencial) {
      console.warn(`[Security] User ${user.id} attempted to book non-presencial nutritionist ${professional_id}.`)
      return NextResponse.json(
        { error: 'This professional does not offer in-person appointments' },
        { status: 400 }
      )
    }

    // 3. Validate Address
    const { data: address, error: addressError } = await supabase
      .from('nutritionist_addresses')
      .select('id, nutritionist_id')
      .eq('id', address_id)
      .single()

    if (addressError || !address) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      )
    }

    if (address.nutritionist_id !== professional_id) {
      return NextResponse.json(
        { error: 'Address does not belong to the selected professional' },
        { status: 400 }
      )
    }

    // 4. Validate Schedule Conflict (Presencial)
    // Check 'appointments' table
    const { data: existingPresencial } = await supabase
      .from('appointments')
      .select('id')
      .eq('nutritionist_id', professional_id)
      .eq('appointment_date', date)
      .eq('appointment_time', time)
      .in('status', ['agendado', 'confirmed', 'paid']) // Check relevant statuses
      .not('status', 'eq', 'cancelled') // Explicitly exclude cancelled
      .maybeSingle()

    if (existingPresencial) {
      return NextResponse.json(
        { error: 'Time slot already booked (presencial)' },
        { status: 409 }
      )
    }

    // 5. Validate Schedule Conflict (Online - Teleconsulta)
    // Check 'teleconsulta_sessions' table to avoid double booking
    // Construct timestamp from date and time for comparison
    // Note: Teleconsulta uses 'scheduled_at' (timestamptz). We need to be careful with timezones.
    // Assuming 'date' and 'time' are in 'America/Sao_Paulo' or local time.
    // Ideally, we should convert date+time to UTC or compatible format.
    // However, existing teleconsulta logic stores timestamps.
    // Let's try to match by overlapping time or exact match if possible.
    // For simplicity, we'll check if there's a session starting at the same time.
    
    // Convert YYYY-MM-DD + HH:mm to ISO string with offset -03:00 (Sao Paulo)
    // This matches the project's timezone strategy memory.
    const scheduledAtISO = `${date}T${time}:00-03:00`;
    
    const { data: existingOnline } = await supabase
      .from('teleconsulta_sessions')
      .select('id')
      .eq('nutritionist_id', professional_id)
      .eq('scheduled_at', scheduledAtISO)
      .in('status', ['paid', 'scheduled', 'in_progress'])
      .maybeSingle()

    if (existingOnline) {
       return NextResponse.json(
        { error: 'Time slot already booked (online)' },
        { status: 409 }
      )
    }

    // 6. Create Appointment
    const { data: newAppointment, error: insertError } = await supabase
      .from('appointments')
      .insert({
        patient_id: patient_id,
        nutritionist_id: professional_id,
        appointment_date: date,
        appointment_time: time,
        type: 'presencial', // Fixed type
        status: 'agendado', // Initial status matching DB constraint
        address_id: address_id,
        patient_name: patientProfile.full_name,
        patient_phone: patientProfile.phone,
        is_online: false, // Explicitly false
        price: 0, // Or fetch price? User didn't specify price handling, defaulting to 0 or null.
        // scheduled_at is useful for sorting/filtering unified lists
        scheduled_at: scheduledAtISO
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Error creating presencial appointment:', insertError)
      return NextResponse.json(
        { error: 'Failed to create appointment', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      appointment_id: newAppointment.id,
      message: 'Consulta presencial agendada com sucesso.'
    })

  } catch (error) {
    console.error('Internal error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
