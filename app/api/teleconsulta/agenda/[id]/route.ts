import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { withErrorHandling } from '@/lib/api-middleware'
import { requireAuth } from '@/lib/auth-utils'
import { ValidationError, AuthorizationError, ConflictError } from '@/lib/errors'
import { z } from 'zod'

// Schemas de validação
const availabilitySlotSchema = z.object({
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido'),
  is_available: z.boolean()
})

const idParamSchema = z.object({
  id: z.string().uuid('ID inválido')
})

// DELETE /api/teleconsulta/agenda/[id] - Deletar horário de disponibilidade
export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const userId = validateAuth(authError ? null : user?.id || null)

  // Validar parâmetros
  const { id: availabilityId } = idParamSchema.parse(params)

  // Verificar se a disponibilidade existe e pertence ao usuário
  const { data: availability, error: availabilityError } = await supabase
    .from('agenda_availability')
    .select('*')
    .eq('id', availabilityId)
    .eq('nutritionist_id', userId)
    .single()

  const validAvailability = validateResourceExists(
    availabilityError ? null : availability, 
    'Horário de disponibilidade não encontrado'
  )

  // Verificar se há teleconsultas agendadas neste horário
  const { data: sessions, error: sessionsError } = await supabase
    .from('teleconsulta_sessions')
    .select('id')
    .eq('nutritionist_id', userId)
    .eq('current_status', 'scheduled')
    .gte('scheduled_for', validAvailability.start_time)
    .lt('scheduled_for', validAvailability.end_time)

  if (sessionsError) {
    throw new Error('Erro ao verificar agendamentos')
  }

  if (sessions && sessions.length > 0) {
    throw new ConflictError('Não é possível deletar horário com teleconsultas agendadas')
  }

  // Deletar disponibilidade
  const { error: deleteError } = await supabase
    .from('agenda_availability')
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
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const userId = validateAuth(authError ? null : user?.id || null)

  // Validar parâmetros
  const { id: availabilityId } = idParamSchema.parse(params)
  
  // Validar dados do corpo da requisição
  const body = await request.json()
  const { day_of_week, start_time, end_time } = availabilitySlotSchema.parse(body)

  // Verificar se a disponibilidade existe e pertence ao usuário
  const { data: availability, error: availabilityError } = await supabase
    .from('agenda_availability')
    .select('*')
    .eq('id', availabilityId)
    .eq('nutritionist_id', userId)
    .single()

  const validAvailability = validateResourceExists(
    availabilityError ? null : availability,
    'Horário de disponibilidade não encontrado'
  )

  // Verificar conflitos com outros horários do mesmo nutricionista
  const { data: conflicts, error: conflictError } = await supabase
    .from('agenda_availability')
    .select('id')
    .eq('nutritionist_id', userId)
    .eq('day_of_week', day_of_week)
    .neq('id', availabilityId)
    .or(`start_time.lte.${start_time},start_time.lt.${end_time}`)
    .or(`end_time.gt.${start_time},end_time.gte.${end_time}`)

  if (conflictError) {
    throw new Error('Erro ao verificar conflitos')
  }

  if (conflicts && conflicts.length > 0) {
    throw new ConflictError('Conflito com outro horário já cadastrado')
  }

  // Atualizar disponibilidade
  const { data: updatedAvailability, error: updateError } = await supabase
    .from('agenda_availability')
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