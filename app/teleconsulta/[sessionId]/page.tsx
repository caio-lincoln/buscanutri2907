'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, MessageSquare, Maximize, Minimize, Clock, Camera, User
} from 'lucide-react'
import { ScrollArea } from '../../../components/ui/scroll-area'
import { useAuth } from '../../../contexts/auth-context'
import { createSupabaseClient } from '../../../lib/supabase'
// se você usa date-fns/toast já importados em outro lugar, mantenha como está

interface TeleconsultaSession {
  id: string
  session_token: string
  nutritionist_id: string
  patient_id: string
  scheduled_at: string
  duration_minutes: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  join_url: string
  price: number
  nutritionist: { id: string; full_name: string; profile_image_url: string | null; specialty: string }
  patient: { id: string; full_name: string; profile_image_url: string | null }
}

interface Participant {
  id: string
  session_id: string
  user_id: string
  user_type: 'nutritionist' | 'patient'
  joined_at: string
  left_at: string | null
  audio_enabled: boolean
  video_enabled: boolean
  user: { id: string; full_name: string; profile_image_url: string | null }
}

interface ChatMessage {
  id: string
  sender_id: string
  sender_name: string
  message: string
  timestamp: string
}

interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate'
  data: any
  from_user_id: string
  to_user_id: string
}

const statusLabels = {
  scheduled: 'Agendada',
  in_progress: 'Em andamento',
  completed: 'Concluída',
  cancelled: 'Cancelada',
}
const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function TeleconsultaRoom() {
  const supabase = useMemo(() => createSupabaseClient(), [])
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()

  const sessionToken = params.sessionId as string

  // Session state
  const [ session, setSession ] = useState<TeleconsultaSession | null>(null)
  const [ participants, setParticipants ] = useState<Participant[]>([])
  const [ loading, setLoading ] = useState(true)
  const [ sessionStartTime, setSessionStartTime ] = useState<Date | null>(null)
  const [ sessionDuration, setSessionDuration ] = useState(0)

  // Media state
  const [ localStream, setLocalStream ] = useState<MediaStream | null>(null)
  const [ remoteStream, setRemoteStream ] = useState<MediaStream | null>(null)
  const [ isVideoEnabled, setIsVideoEnabled ] = useState(true)
  const [ isAudioEnabled, setIsAudioEnabled ] = useState(true)
  const [ isConnected, setIsConnected ] = useState(false)
  const [ isFullscreen, setIsFullscreen ] = useState(false)
  const [ audioBloqueado, setAudioBloqueado ] = useState(false)

  // Chat state
  const [ chatMessages, setChatMessages ] = useState<ChatMessage[]>([])
  const [ newMessage, setNewMessage ] = useState('')
  const [ isChatOpen, setIsChatOpen ] = useState(false)

  // WebRTC refs
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const hasSubscribedRef = useRef(false)
  const audioSenderRef = useRef<RTCRtpSender | null>(null)
  const videoSenderRef = useRef<RTCRtpSender | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  const remoteAudioStreamRef = useRef<MediaStream | null>(null)
  // glare handling
  const isPoliteRef = useRef(false)
  const makingOfferRef = useRef(false)
  const ignoreOfferRef = useRef(false)

  // Helpers: quem sou eu / quem é o outro
  const myId = user?.id ?? ''
 
  const otherId = session
    ? (myId === session.nutritionist.user_id ? session.patient.user_id : session.nutritionist.user_id)
    : ''


  const channelName = useMemo(
    () => (session ? `teleconsulta_${session.id}_${session.session_token}` : null),
    [ session ]
  )

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined
    if (sessionStartTime && session?.status === 'in_progress') {
      interval = setInterval(() => {
        const now = new Date()
        const diff = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000)
        setSessionDuration(diff)
      }, 1000)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [ sessionStartTime, session?.status ])

  // Load session data
  useEffect(() => { if (sessionToken) loadSessionData() }, [ sessionToken ])

  // Update video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream
  }, [ localStream ])
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream
  }, [ remoteStream ])

  // Start when session+user prontos
  useEffect(() => {
    if (session && myId && otherId) {
      (async () => {
    
        await initializeWebRTC()
        await ensureChannel()
        await makeOffer()
      })()
    }
  }, [ session, myId, otherId ])

  // Chat autoscroll
  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
  }, [ chatMessages ])

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
        hasSubscribedRef.current = false
      }
    }
  }, [])

  async function loadSessionData() {
    try {
      const res = await fetch(`/api/teleconsulta/sessions/${sessionToken}`)
      if (!res.ok) throw new Error('Sessão não encontrada')
      const data = await res.json()
      setSession(data.session)
      setParticipants(data.participants || [])
      if (data.session.status === 'in_progress') setSessionStartTime(new Date())
    } catch (e) {
      console.error('Erro ao carregar sessão:', e)
      // toast.error('Erro ao carregar dados da sessão')
       const routePath = user?.user_metadata['user_type'] === 'nutricionista' ? '/dashboard/nutricionistas' : '/dashboard/paciente'
      router.push(routePath)
    } finally {
      setLoading(false)
    }
  }

  async function tocarAudioRemoto() {
    if (!remoteAudioRef.current) return
    try {
      remoteAudioRef.current.muted = false
      remoteAudioRef.current.volume = 1
      await remoteAudioRef.current.play()
      setAudioBloqueado(false)
    } catch (e) {
      // NotAllowedError: precisa de gesto do usuário
      setAudioBloqueado(true)
      console.log('Autoplay bloqueado, peça clique do usuário.', e)
    }
  }
  async function ensureChannel() {
    if (!channelName || !myId) throw new Error('sem canal ou usuário')
    if (channelRef.current && hasSubscribedRef.current) return channelRef.current

    const ch = supabase.channel(channelName, {
      config: { presence: { key: myId }, broadcast: { self: false } }
    })

    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState()
      const peers = Object.keys(state)
      isPoliteRef.current = peers.length > 1
    })

    ch.on('broadcast', { event: 'webrtc' }, async ({ payload }) => {
      if (payload.from_user_id === myId) return
      if (payload.to_user_id && payload.to_user_id !== myId) return

      const pc = peerConnectionRef.current!
      try {
        if (payload.type === 'offer') {
          const offerCollision = makingOfferRef.current || pc.signalingState !== 'stable'
          ignoreOfferRef.current = !isPoliteRef.current && offerCollision
          if (ignoreOfferRef.current) return
          await pc.setRemoteDescription(payload.data)
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          await sendWebRTCSignal({
            type: 'answer',
            data: pc.localDescription,
            from_user_id: myId,
            to_user_id: otherId,
          })
        } else if (payload.type === 'answer') {
          await pc.setRemoteDescription(payload.data)
        } else if (payload.type === 'ice-candidate') {
          try { await pc.addIceCandidate(payload.data) } catch { }
        }
      } catch (err) {
        console.error('Erro manipulando sinal WebRTC:', err)
      }
    })

    await new Promise<void>((resolve) => {
      ch.subscribe((status) => status === 'SUBSCRIBED' && resolve())
    })
    await ch.track({ online: true })

    channelRef.current = ch
    hasSubscribedRef.current = true
    console.log('[RTC] canal SUBSCRIBED:', channelName)
    return ch
  }

  // async function subscribeChannel() {

  //   if (!session || !myId) return
  //   const ch = supabase.channel(`teleconsulta_${session.id}`, {
  //     config: { presence: { key: myId } }
  //   })

  //   ch.on('presence', { event: 'sync' }, () => {
  //     const state = ch.presenceState()
  //     const peers = Object.keys(state)
  //     isPoliteRef.current = peers.length > 1
  //   })



  //   await new Promise<void>((resolve, reject) => {
  //     ch.subscribe((status) => status === 'SUBSCRIBED' && resolve())
  //   })
  //   await ch.track({ online: true })
  //   channelRef.current = ch
  // }

  const initializeWebRTC = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setLocalStream(stream)
      if (localVideoRef.current) localVideoRef.current.srcObject = stream

      const configuration: RTCConfiguration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          // em produção, adicione TURN aqui
        ],
      }
      const pc = new RTCPeerConnection(configuration)
      peerConnectionRef.current = pc

      const audioTrack = stream.getAudioTracks()[ 0 ]
      const videoTrack = stream.getVideoTracks()[ 0 ]

      if (audioTrack) {
        audioSenderRef.current = pc.addTrack(audioTrack, stream)
      }
      if (videoTrack) {
        videoSenderRef.current = pc.addTrack(videoTrack, stream)
      }

      // stream.getTracks().forEach(track => pc.addTrack(track, stream))

      pc.ontrack = (event) => {
        const track = event.track
        
        if (track.kind === 'video') {
          const [ rs ] = event.streams
          setRemoteStream(rs as MediaStream)
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = rs ?? null
            remoteVideoRef.current.play?.()
          }
        } else if (track.kind === 'audio') {
          if (!remoteAudioStreamRef.current) remoteAudioStreamRef.current = new MediaStream()
          remoteAudioStreamRef.current.addTrack(track)
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteAudioStreamRef.current
            console.log("Caiu aqui")
            tocarAudioRemoto()
          }
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendWebRTCSignal({
            type: 'ice-candidate',
            data: event.candidate.toJSON(),
            from_user_id: myId,
            to_user_id: otherId,
          })
        }
      }

      pc.oniceconnectionstatechange = () => {
        console.log('[ICE]', pc.iceConnectionState)
      }
      pc.onconnectionstatechange = () => {
        console.log('[PC]', pc.connectionState)
        setIsConnected(pc.connectionState === 'connected')
      }

      pc.onconnectionstatechange = () => setIsConnected(pc.connectionState === 'connected')

      // 2) cria e envia a offer (o "polite peer" evita glare)
      await makeOffer()

    } catch (error) {
      console.error('Erro ao inicializar WebRTC:', error)
      // toast.error('Erro ao acessar câmera e microfone')
    }
  }

  async function makeOffer() {

    const pc = peerConnectionRef.current!
    try {
      makingOfferRef.current = true
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      await sendWebRTCSignal({
        type: 'offer',
        data: pc.localDescription,   // RTCSessionDescriptionInit
        from_user_id: myId,
        to_user_id: otherId,
      })
    } catch (e) {
      console.log(e)
    }
    finally {
      makingOfferRef.current = false
    }
  }

  const sendWebRTCSignal = async (signal: WebRTCSignal) => {
    try {
      const ch = await ensureChannel()
      const sent = await ch.send(
        { type: 'broadcast', event: 'webrtc', payload: signal }
      )
      if (!sent) console.log('[RTC] broadcast não confirmado')

    } catch (error) {
      console.log("🚀 ~ sendWebRTCSignal ~ error:", error)

    }
  }

  const toggleVideo = () => {
    if (!localStream) return
    const track = localStream.getVideoTracks()[ 0 ]
    if (!track) return
    track.enabled = !track.enabled
    setIsVideoEnabled(track.enabled)
  }

  const toggleAudio = async () => {
    const sender = audioSenderRef.current
    if (!sender) return

    if (sender.track) {
      // OFF: para de enviar e libera o microfone
      sender.track.stop()
      localStream?.removeTrack(sender.track)
      await sender.replaceTrack(null)
      setIsAudioEnabled(false)
    } else {
      // ON: captura nova track e volta a enviar
      const g = await navigator.mediaDevices.getUserMedia({ audio: true })
      const newTrack = g.getAudioTracks()[ 0 ]
      if (!localStream) setLocalStream(g); else localStream.addTrack(newTrack)
      await sender.replaceTrack(newTrack)
      setIsAudioEnabled(true)
    }
  }

  const handleEndCall = () => {
    // se você tiver endCall(), chame aqui
    updateSessionStatus('completed')
    const routePath = user?.user_metadata['user_type'] === 'nutricionista' ? '/dashboard/nutricionistas' : '/dashboard/paciente'
    setTimeout(() => router.push(routePath), 2000)
  }

  async function updateSessionStatus(status: string) {
    try {
      const res = await fetch(`/api/teleconsulta/sessions/${sessionToken}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar status da sessão')
      const data = await res.json()
      setSession(data.session)
      if (status === 'in_progress') setSessionStartTime(new Date())
    } catch (e) { console.error('Erro ao atualizar status:', e) }
  }

  const sendChatMessage = () => {
    if (!newMessage.trim() || !user) return
    const message: ChatMessage = {
      id: Date.now().toString(),
      sender_id: myId,
      sender_name: (user as any)?.full_name || 'Usuário',
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
    }
    setChatMessages(prev => [ ...prev, message ])
    setNewMessage('')
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto mb-4" />
          <p className="text-white text-lg">Conectando à teleconsulta...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Sessão não encontrada</h1>
          <Button onClick={() => router.push('/')}>Voltar ao Dashboard</Button>
        </div>
      </div>
    )
  }

  const otherParticipant = myId === session.nutritionist.user_id ? session.patient : session.nutritionist

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherParticipant.profile_image_url || ''} alt={otherParticipant.full_name} />
              <AvatarFallback>{otherParticipant.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-semibold">{otherParticipant.full_name}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Badge className={statusColors[ session.status ]}>{statusLabels[ session.status ]}</Badge>
                {session.status === 'in_progress' && (
                  <>
                    <span>•</span>
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(sessionDuration)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsChatOpen(v => !v)} className="flex text-gray-900 items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Chat
            </Button>
            <Button variant="outline" size="sm"  onClick={() => {
              if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); setIsFullscreen(true) }
              else { document.exitFullscreen(); setIsFullscreen(false) }
            }} className="flex items-center gap-2 text-gray-900">
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Video Area */}
        <div className="flex-1 relative">
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            {remoteStream ? (
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <User className="h-24 w-24 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Aguardando conexão...</p>
              </div>
            )}
          </div>
          <audio ref={remoteAudioRef} /> 
          {/* Local PIP */}
          <div className="absolute top-4 right-4 w-64 h-48 bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-600">
            {localStream ? (
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="h-8 w-8 text-gray-500" />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-4 bg-gray-800 bg-opacity-90 rounded-full px-6 py-3">
              <Button variant={isAudioEnabled ? 'default' : 'secondary'} size="lg" onClick={toggleAudio} className="rounded-full w-12 h-12">
                {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>
              <Button variant={isVideoEnabled ? 'default' : 'secondary'} size="lg" onClick={toggleVideo} className="rounded-full w-12 h-12">
                {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>
              <Button variant="destructive" size="lg" onClick={handleEndCall} className="rounded-full w-12 h-12">
                <PhoneOff className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Connection Status */}
          <div className="absolute top-4 left-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${isConnected ? 'bg-green-600' : 'bg-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-300' : 'bg-red-300'}`} />
              {isConnected ? 'Conectado' : 'Conectando...'}
            </div>
          </div>
        </div>

        {/* Chat */}
        {isChatOpen && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold flex items-center gap-2"><MessageSquare className="h-5 w-5" />Chat da Consulta</h3>
            </div>
            <ScrollArea className="flex-1 p-4" ref={chatScrollRef}>
              <div className="space-y-4">
                {chatMessages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_id === myId ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-3 py-2 rounded-lg ${m.sender_id === myId ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-100'}`}>
                      <p className="text-sm">{m.message}</p>
                      <p className="text-xs opacity-70 mt-1">{/* format(parseISO(m.timestamp), 'HH:mm') */}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Digite sua mensagem..." onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()} className="bg-gray-700 border-gray-600 text-white" />
                <Button onClick={sendChatMessage} size="sm">Enviar</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
