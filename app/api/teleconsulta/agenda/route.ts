import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandling, validateAuth, ValidationError, ForbiddenError } from '@/src/lib/middleware/error-handler'
import { availabilitySlotSchema } from '@/src/lib/validations/teleconsulta'
import { createClient } from '../../../../lib/supabase/server'

// GET /api/teleconsulta/agenda - Listar agenda do nutricionista
export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = await createClient()
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const userId = validateAuth(authError ? null : user?.id || null)

  const { searchParams } = new URL(request.url)
  const nutritionistUserId = searchParams.get('nutritionistId') || userId

  // Buscar perfil do nutricionista
  const { data: nutritionist, error: nutritionistError } = await supabase
    .from('nutritionist_profiles')
    .select('id')
    .eq('user_id', nutritionistUserId)
    .single()

  if (nutritionistError || !nutritionist) {
    throw new ValidationError('Perfil de nutricionista não encontrado')
  }

  // Buscar horários de disponibilidade
  const { data: availability, error } = await supabase
    .from('agenda_availability')
    .select('*')
    .eq('nutritionist_id', nutritionist.id)
    .order('day_of_week')
    .order('start_time')

  if (error) {
    throw new ValidationError('Erro ao buscar agenda')
  }

  return NextResponse.json({ availability })
})

// POST /api/teleconsulta/agenda - Adicionar horário de disponibilidade
export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = await createClient()
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const userId = validateAuth(authError ? null : user?.id || null)

  // Buscar perfil do nutricionista
  const { data: nutritionist, error: nutritionistError } = await supabase
    .from('nutritionist_profiles')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (nutritionistError || !nutritionist) {
    throw new ValidationError('Perfil de nutricionista não encontrado')
  }

  const body = await request.json()
  const { day_of_week, start_time, end_time, is_available } = availabilitySlotSchema.parse(body)

  // Verificar se já existe um horário conflitante
  const { data: existingSlot } = await supabase
    .from('agenda_availability')
    .select('*')
    .eq('nutritionist_id', nutritionist.id)
    .eq('day_of_week', day_of_week)
    .or(`start_time.lte.${start_time}.and.end_time.gt.${start_time},start_time.lt.${end_time}.and.end_time.gte.${end_time}`)

  if (existingSlot && existingSlot.length > 0) {
    throw new ValidationError('Já existe um horário conflitante neste período')
  }

  // Criar novo horário
  const { data: newSlot, error } = await supabase
    .from('agenda_availability')
    .insert({
      nutritionist_id: nutritionist.id,
      day_of_week,
      start_time,
      end_time,
      is_available: is_available ?? true
    })
    .select()
    .single()
  
  if (error) {
    throw new ValidationError('Erro ao criar horário')
  }

  return NextResponse.json({ slot: newSlot })
})

// PUT - Atualizar disponibilidade em lote
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const supabase = await createClient()
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const userId = validateAuth(authError ? null : user?.id || null)

  // Buscar perfil do nutricionista
  const { data: nutritionist, error: nutritionistError } = await supabase
    .from('nutritionist_profiles')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (nutritionistError || !nutritionist) {
    throw new ValidationError('Perfil de nutricionista não encontrado')
  }

  const body = await request.json()
  const { availability } = body
  
  if (!Array.isArray(availability)) {
    throw new ValidationError('availability deve ser um array')
  }

  // Validar cada slot
  const validatedSlots = availability.map(slot => 
    availabilitySlotSchema.parse(slot)
  )

  // Remover todas as disponibilidades existentes do nutricionista
  const { error: deleteError } = await supabase
    .from('agenda_availability')
    .delete()
    .eq('nutritionist_id', nutritionist.id)

  if (deleteError) {
    throw new ValidationError('Erro ao atualizar disponibilidades')
  }

  // Inserir novas disponibilidades
  if (validatedSlots.length > 0) {
    const slotsToInsert = validatedSlots.map(slot => ({
      nutritionist_id: nutritionist.id,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_available: slot.is_available
    }))

    const { data: newAvailability, error: insertError } = await supabase
      .from('agenda_availability')
      .insert(slotsToInsert)
      .select()

    if (insertError) {
      throw new ValidationError('Erro ao criar novas disponibilidades')
    }

    return NextResponse.json({ availability: newAvailability })
  }

  return NextResponse.json({ availability: [] })
})
