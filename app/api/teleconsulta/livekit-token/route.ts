// app/api/teleconsulta/livekit-token/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server' // seu helper
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const sessionId = url.searchParams.get('sessionId')
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
  // Confere no banco se o usuário é participante
  const { data: session, error: sessionError } = await supabase
    .from('teleconsulta_sessions')
    .select(`
      id, session_token, scheduled_at, started_at, ended_at,
      duration_minutes, price, status, join_url,
  
      nutritionist:nutritionist_profiles!teleconsulta_sessions_nutritionist_id_fkey (
        id, user_id, full_name, profile_image_url
      ),
  
      patient:patient_profiles!teleconsulta_sessions_patient_id_fkey (
        id, user_id, full_name, phone, profile_image_url
      )
    `)
    .eq('session_token', sessionId)
    .maybeSingle()

  if (!session) return NextResponse.json({ error: 'session not found' }, { status: 404 })

  const isParticipant = [ session.nutritionist?.user_id, session.patient?.user_id ].includes(user.id)
  if (!isParticipant) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const roomName = `teleconsulta_${session.id}_${session.session_token}`
  // (Opcional) Garanta que a sala existe e limite para 2 participantes
  const roomSvc = new RoomServiceClient(process.env[ "NEXT_PUBLIC_LIVEKIT_URL" ] as string, process.env[ "NEXT_PUBLIC_LIVEKIT_API_KEY" ], process.env[ "NEXT_PUBLIC_LIVEKIT_API_SECRET" ])
  try {
    await roomSvc.createRoom({ name: roomName, maxParticipants: 2, emptyTimeout: 60 * 5 })
  } catch { /* se já existe, ignora */ }

  const at = new AccessToken(process.env[ "NEXT_PUBLIC_LIVEKIT_API_KEY" ], process.env[ "NEXT_PUBLIC_LIVEKIT_API_SECRET" ], {
    identity: user.id,                        
    ttl: '1h',                                
    metadata: JSON.stringify({ name: user.email }), 
  })

  await supabase.from('teleconsulta_session').update('')
  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    // roomCreate: true, // se preferir auto-criar sem RoomService
  })

  const token = await at.toJwt()
  return NextResponse.json({ token, roomName })
}
