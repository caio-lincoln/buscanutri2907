import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'

// cookies() não é necessário após adaptação em createClient
import { withErrorHandling, validateAuth, ValidationError, NotFoundError } from '@/src/lib/middleware/error-handler'
import { idParamSchema } from '@/src/lib/validations/teleconsulta'
import { createClient } from '../../../../lib/supabase/server'

// POST /api/teleconsulta/webrtc - Inicializar conexão WebRTC
export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new ValidationError('Não autenticado')
  const authUserId = user.id

  const { session_id, type, ...payload } = await request.json()
  if (!session_id) throw new ValidationError('session_id é obrigatório')
  if (!type) throw new ValidationError('type é obrigatório')

  // const { data: ok, error: permErr } = await supabase
  //   .rpc('is_session_member', { sid: session_id }) 
  // if (permErr || !ok) throw new NotFoundError('Sessão não encontrada ou sem permissão')
  //   console.log("🚀 ~ permErr:", permErr)

  const channelName = `teleconsulta_${session_id}`

  const channel = supabase.channel(channelName, { config: { broadcast: { self: false } } })
  await new Promise<void>((resolve, reject) => {
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') resolve()
    })
  })

  // Envie o evento com ack
  const sent = await channel.send({
    type: 'broadcast',
    event: "webrtc",              // 'offer' | 'answer' | 'ice-candidate'
    payload: { from: authUserId, type, ...payload }
  }) // timeout opcional

  await channel.unsubscribe()

  return NextResponse.json({ ok: sent, channel: channelName })
})

// PUT /api/teleconsulta/webrtc - Responder à oferta WebRTC
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const supabase = await createClient()

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
