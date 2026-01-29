import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
// cookies() não é necessário após adaptação em createClient
import { withErrorHandling, validateAuth, ValidationError, NotFoundError, ForbiddenError } from '@/src/lib/middleware/error-handler'
import { idParamSchema } from '@/src/lib/validations/teleconsulta'

// GET /api/teleconsulta/participants/[participantId] - Buscar participante específico
export const GET = withErrorHandling(async (
  request: NextRequest,
  props: { params: Promise<{ participantId: string }> }
) => {
  const params = await props.params;
  const supabase = await createClient()
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const userId = validateAuth(authError ? null : user?.id || null)

  // Validar ID do participante
  const { id: participantId } = idParamSchema.parse({ id: params.participantId })

  // Buscar participante
  const { data: participant, error } = await supabase
    .from('teleconsulta_participants')
    .select(`
      *,
      session:teleconsulta_sessions(*),
      user:profiles(*)
    `)
    .eq('id', participantId)
    .single()

  if (error || !participant) {
    throw new NotFoundError('Participante não encontrado')
  }

  // Verificar se o usuário tem permissão para ver este participante
  if (participant.user_id !== userId && 
      participant.session.patient_id !== userId && 
      participant.session.nutritionist_id !== userId) {
    throw new ForbiddenError('Sem permissão para acessar este participante')
  }

  return NextResponse.json({ participant })
})

// PUT /api/teleconsulta/participants/[participantId] - Atualizar status do participante
export const PUT = withErrorHandling(async (
  request: NextRequest,
  props: { params: Promise<{ participantId: string }> }
) => {
  const params = await props.params;
  const supabase = await createClient()
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const userId = validateAuth(authError ? null : user?.id || null)

  // Validar ID do participante
  const { id: participantId } = idParamSchema.parse({ id: params.participantId })
  
  const { status, joined_at, left_at } = await request.json()

  if (!status) {
    throw new ValidationError('Status é obrigatório')
  }

  // Verificar se o participante existe e o usuário tem permissão
  const { data: participant, error: participantError } = await supabase
    .from('teleconsulta_participants')
    .select('*, session:teleconsulta_sessions(*)')
    .eq('id', participantId)
    .single()

  if (participantError || !participant) {
    throw new NotFoundError('Participante não encontrado')
  }

  // Verificar permissão
  if (participant.user_id !== userId) {
    throw new ForbiddenError('Sem permissão para atualizar este participante')
  }

  // Atualizar participante
  const updateData: any = { status }
  if (joined_at) updateData.joined_at = joined_at
  if (left_at) updateData.left_at = left_at

  const { data: updatedParticipant, error: updateError } = await supabase
    .from('teleconsulta_participants')
    .update(updateData)
    .eq('id', participantId)
    .select()
    .single()

  if (updateError) {
    throw new ValidationError('Erro ao atualizar participante')
  }

  return NextResponse.json({ participant: updatedParticipant })
})

// DELETE /api/teleconsulta/participants/[participantId] - Remover participante
export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { participantId: string } }
) => {
  const supabase = await createClient()
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const userId = validateAuth(authError ? null : user?.id || null)

  // Validar ID do participante
  const { id: participantId } = idParamSchema.parse({ id: params.participantId })

  // Verificar se o participante existe e o usuário tem permissão
  const { data: participant, error: participantError } = await supabase
    .from('teleconsulta_participants')
    .select('*, session:teleconsulta_sessions(*)')
    .eq('id', participantId)
    .single()

  if (participantError || !participant) {
    throw new NotFoundError('Participante não encontrado')
  }

  // Verificar permissão (apenas o próprio usuário ou o dono da sessão pode remover)
  if (participant.user_id !== userId && 
      participant.session.nutritionist_id !== userId) {
    throw new ForbiddenError('Sem permissão para remover este participante')
  }

  // Remover participante
  const { error: deleteError } = await supabase
    .from('teleconsulta_participants')
    .delete()
    .eq('id', participantId)

  if (deleteError) {
    throw new ValidationError('Erro ao remover participante')
  }

  return NextResponse.json({ message: 'Participante removido com sucesso' })
})
