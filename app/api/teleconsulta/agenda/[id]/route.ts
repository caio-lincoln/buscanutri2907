import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandling, validateAuth, validateResourceExists,  ConflictError } from '@/src/lib/middleware/error-handler'
import { availabilitySlotSchema, idParamSchema } from '@/src/lib/validations/teleconsulta'
import { createClient } from '../../../../../lib/supabase/server'

// DELETE /api/teleconsulta/agenda/[id] - Deletar horário de disponibilidade
export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const supabase = await createClient()

  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const userId = validateAuth(authError ? null : user?.id || null)

  // Validar parâmetros
  const { id: availabilityId } = idParamSchema.parse(await params)
  // const availabilityId = await params.id

  const { data: nutritionistProfile } = await supabase.from('nutritionist_profiles').select("id").eq("user_id", userId).maybeSingle()

  // Verificar se a disponibilidade existe e pertence ao usuário
  const { data: availability, error: availabilityError } = await supabase
    .from('nutritionist_availability')
    .select('*')
    .eq('id', availabilityId)
    .eq('nutritionist_id', nutritionistProfile?.id)
    .single()

  const validAvailability = validateResourceExists(
    availabilityError ? null : availability,
    'Horário de disponibilidade não encontrado'
  )

  // Verificar se há teleconsultas agendadas neste horário
  const { data: conflicts, error: sessionsError } = await supabase.rpc('teleconsulta_overlaps_by_time', {
    p_nutritionist_id: nutritionistProfile.id,
    p_isodow: validAvailability.day_of_week,
    p_start: validAvailability.start_time,
    p_end: validAvailability.end_time,
    p_tz: 'America/Sao_Paulo',
  })

  if (sessionsError) {
    throw new Error('Erro ao verificar agendamentos')
  }

  if (conflicts && conflicts.length > 0) {
    throw new ConflictError('Não é possível deletar horário com teleconsultas agendadas')
  }

  // Deletar disponibilidade
  const { error: deleteError } = await supabase
    .from('nutritionist_availability')
    .delete()
    .eq('id', availabilityId)

  if (deleteError) {
    throw new Error('Erro ao deletar horário')
  }

  return NextResponse.json({ message: 'Horário deletado com sucesso' })
})

// PUT /api/teleconsulta/agenda/[id] - Atualizar horário de disponibilidade
export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const supabase = await createClient()

  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const userId = validateAuth(authError ? null : user?.id || null)

  // Validar parâmetros
  const { id: availabilityId } = idParamSchema.parse(await params)

  const { data: nutritionistProfile } = await supabase.from('nutritionist_profiles').select("id").eq("user_id", userId).maybeSingle()
  const toHHmm = (t: string) => t.replace(/^(\d{1,2}):(\d{2}).*$/, '$1:$2')

  // Validar dados do corpo da requisição
  const body = await request.json()
  const { day_of_week, start_time, end_time } = availabilitySlotSchema.parse({...body, start_time: toHHmm(body.start_time), end_time: toHHmm(body.end_time)})
  // Verificar se a disponibilidade existe e pertence ao usuário
  const { data: availability, error: availabilityError } = await supabase
    .from('nutritionist_availability')
    .select('*')
    .eq('id', availabilityId)
    .eq('nutritionist_id', nutritionistProfile.id)
    .single()

  const validAvailability = validateResourceExists(
    availabilityError ? null : availability,
    'Horário de disponibilidade não encontrado'
  )

  // Verificar conflitos com outros horários do mesmo nutricionista
  const { data: conflicts, error: sessionsError } = await supabase.rpc('teleconsulta_overlaps_by_time', {
    p_nutritionist_id: nutritionistProfile.id,
    p_isodow: validAvailability.day_of_week,
    p_start: toHHmm(validAvailability.start_time),
    p_end: toHHmm(validAvailability.end_time),
    p_tz: 'America/Sao_Paulo',
  })

  if (sessionsError) {
    throw new Error('Erro ao verificar conflitos')
  }

  if (conflicts && conflicts.length > 0) {
    throw new ConflictError('Conflito com outro horário já cadastrado')
  }

  // Atualizar disponibilidade
  const { data: updatedAvailability, error: updateError } = await supabase
    .from('nutritionist_availability')
    .update({
      day_of_week,
      start_time,
      end_time,
      updated_at: new Date().toISOString()
    })
    .eq('id', availabilityId)
    .select()
    .single()

  if (updateError) {
    throw new Error('Erro ao atualizar horário')
  }

  return NextResponse.json({ availability: updatedAvailability })
})