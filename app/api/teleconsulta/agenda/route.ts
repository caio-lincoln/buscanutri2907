import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandling, validateAuth, ValidationError, ForbiddenError } from '@/src/lib/middleware/error-handler'
import { availabilitySlotSchema } from '@/src/lib/validations/teleconsulta'
import { createClient } from '../../../../lib/supabase/server'


// GET /api/teleconsulta/agenda - Listar agenda do nutricionista
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const userId = validateAuth(authError ? null : user?.id || null)

  // Verificar se é nutricionista
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', userId)
    .single()

  if (!profile || profile.user_type !== 'nutritionist') {
    throw new ForbiddenError('Apenas nutricionistas podem acessar a agenda')
  }

  // Buscar horários de disponibilidade
  const { data: availability, error } = await supabase
    .from('nutritionist_availability')
    .select('*')
    .eq('nutritionist_id', userId)
    .order('day_of_week')
    .order('start_time')

  if (error) {
    throw new ValidationError('Erro ao buscar agenda')
  }

  return NextResponse.json({ availability })
})

// POST /api/teleconsulta/agenda - Adicionar horário de disponibilidade
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Verificar autenticação
const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const userId = validateAuth(authError ? null : user?.id || null)

  // Verificar se é nutricionista
  const profile = user?.user_metadata['user_type']

  if (!profile || profile !== 'nutricionista') {
    throw new ForbiddenError('Apenas nutricionistas podem gerenciar a agenda')
  }

  const body = await request.json()
  const { day_of_week, start_time, end_time } = availabilitySlotSchema.parse(body)

  // Verificar se já existe um horário conflitante
  const { data: existingSlot } = await supabase
    .from('nutritionist_availability')
    .select('*')
    .eq('nutritionist_id', userId)
    .eq('day_of_week', day_of_week)
    .or(`start_time.lte.${start_time}.and.end_time.gt.${start_time},start_time.lt.${end_time}.and.end_time.gte.${end_time}`)

  if (existingSlot && existingSlot.length > 0) {
    throw new ValidationError('Já existe um horário conflitante neste período')
  }

  const {data: nutritionistProfile} = await supabase.from('nutritionist_profiles').select("id").eq("user_id", userId).maybeSingle()
  console.log("🚀 ~ nutritionistProfile:", nutritionistProfile)

  // Criar novo horário
  const { data: newSlot, error } = await supabase
  .from('nutritionist_availability')
  .insert({
    nutritionist_id: nutritionistProfile.id,
    day_of_week,
    start_time,
    end_time
  })
  .select()
  .single()
  
  console.log("🚀 ~ error:", error)
  if (error) {
    throw new ValidationError('Erro ao criar horário')
  }

  return NextResponse.json({ slot: newSlot })
})

// PUT - Atualizar disponibilidade em lote
export const PUT = withErrorHandling(async (request: NextRequest) => {
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const userId = validateAuth(authError ? null : user?.id || null)

  // Verificar se é nutricionista
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', userId)
    .single()

  if (!profile || profile.user_type !== 'nutritionist') {
    throw new ForbiddenError('Apenas nutricionistas podem gerenciar a agenda')
  }

  const body = await request.json()
  const { availability_slots } = body
  
  if (!Array.isArray(availability_slots)) {
    throw new ValidationError('availability_slots deve ser um array')
  }

  // Validar cada slot
  const validatedSlots = availability_slots.map(slot => 
    availabilitySlotSchema.parse(slot)
  )

  // Remover todas as disponibilidades existentes do nutricionista
  const { error: deleteError } = await supabase
    .from('nutritionist_availability')
    .delete()
    .eq('nutritionist_id', userId)

  if (deleteError) {
    throw new ValidationError('Erro ao atualizar disponibilidades')
  }

  // Inserir novas disponibilidades
  if (validatedSlots.length > 0) {
    const slotsToInsert = validatedSlots.map(slot => ({
      nutritionist_id: userId,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time
    }))

    const { data: newAvailability, error: insertError } = await supabase
      .from('nutritionist_availability')
      .insert(slotsToInsert)
      .select()

    if (insertError) {
      throw new ValidationError('Erro ao criar novas disponibilidades')
    }

    return NextResponse.json({ availability: newAvailability })
  }

  return NextResponse.json({ availability: [] })
})