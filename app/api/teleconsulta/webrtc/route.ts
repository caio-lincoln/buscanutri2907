import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { withErrorHandling, validateAuth, ValidationError, NotFoundError } from '@/src/lib/middleware/error-handler'
import { idParamSchema } from '@/src/lib/validations/teleconsulta'

// POST /api/teleconsulta/webrtc - Inicializar conexão WebRTC
export const POST = withErrorHandling(async (request: NextRequest) => {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const userId = validateAuth(authError ? null : user?.id || null)

  const { session_id, offer, ice_candidates } = await request.json()

  if (!session_id) {
    throw new ValidationError('session_id é obrigatório')
  }

  // Validar ID da sessão
  const validatedSessionId = idParamSchema.parse({ id: session_id }).id

  // Verificar se a sessão existe e o usuário tem permissão
  const { data: session, error: sessionError } = await supabase
    .from('teleconsulta_sessions')
    .select('*')
    .eq('id', validatedSessionId)
    .or(`patient_id.eq.${userId},nutritionist_id.eq.${userId}`)
    .single()

  if (sessionError || !session) {
    throw new NotFoundError('Sessão não encontrada ou sem permissão')
  }

  // Configurar canal de comunicação em tempo real
  const channel = supabase.channel(`teleconsulta_${validatedSessionId}`)
  
  // Enviar dados WebRTC para outros participantes
  if (offer) {
    await channel.send({
      type: 'broadcast',
      event: 'webrtc_offer',
      payload: {
        from: userId,
        offer,
        ice_candidates
      }
    })
  }

  return NextResponse.json({ 
    success: true,
    channel_name: `teleconsulta_${validatedSessionId}`
  })
})

// PUT /api/teleconsulta/webrtc - Responder à oferta WebRTC
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const userId = validateAuth(authError ? null : user?.id || null)

  const { session_id, answer, ice_candidates } = await request.json()

  if (!session_id || !answer) {
    throw new ValidationError('session_id e answer são obrigatórios')
  }

  // Validar ID da sessão
  const validatedSessionId = idParamSchema.parse({ id: session_id }).id

  // Verificar se a sessão existe e o usuário tem permissão
  const { data: session, error: sessionError } = await supabase
    .from('teleconsulta_sessions')
    .select('*')
    .eq('id', validatedSessionId)
    .or(`patient_id.eq.${userId},nutritionist_id.eq.${userId}`)
    .single()

  if (sessionError || !session) {
    throw new NotFoundError('Sessão não encontrada ou sem permissão')
  }

  // Configurar canal de comunicação em tempo real
  const channel = supabase.channel(`teleconsulta_${validatedSessionId}`)
  
  // Enviar resposta WebRTC para outros participantes
  await channel.send({
    type: 'broadcast',
    event: 'webrtc_answer',
    payload: {
      from: userId,
      answer,
      ice_candidates
    }
  })

  return NextResponse.json({ success: true })
})