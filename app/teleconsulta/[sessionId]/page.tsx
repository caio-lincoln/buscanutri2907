'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, MessageSquare, Maximize, Minimize, Clock, Camera, User,
  Router
} from 'lucide-react'

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  useRoomContext,
  VideoTrack,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { Track, RoomEvent } from 'livekit-client'

import { useAuth } from '@/contexts/auth-context'
import { useCallTimer } from '../../../hooks/use-call-timer'

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
  nutritionist: { id: string; user_id?: string; full_name: string; profile_image_url: string | null }
  patient: { id: string; user_id?: string; full_name: string; profile_image_url: string | null }
}

interface ChatMessage {
  id: string
  sender_id: string
  sender_name: string
  message: string
  timestamp: string
}

const statusLabels = {
  scheduled: 'Agendada',
  in_progress: 'Em andamento',
  completed: 'Concluída',
  cancelled: 'Cancelada',
} as const
const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
} as const

const ALLOW_JOIN_MINUTES_BEFORE = 5;

function useSecondCountdown(targetMs: number | null) {
  const [ secondsLeft, setSecondsLeft ] = useState<number | null>(null);

  useEffect(() => {
    if (targetMs === null) { setSecondsLeft(null); return; }

    const update = () => {
      const s = Math.max(0, Math.ceil((targetMs - Date.now()) / 1000));
      setSecondsLeft(s);
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [ targetMs ]);

  return secondsLeft; // null => já liberado; 0 => chegou na hora
}

export default function TeleconsultaRoom() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const sessionToken = params.sessionId as string

  const routePath =
    user?.user_metadata?.user_type === 'nutricionista'
      ? '/dashboard/nutricionistas'
      : '/dashboard/paciente';

  const [ loading, setLoading ] = useState(true)
  const [ session, setSession ] = useState<TeleconsultaSession | null>(null)
  const [ token, setToken ] = useState<string>()
  const [ roomName, setRoomName ] = useState<string>()

  // chat local (mantive como estava)
  const [ chatMessages, setChatMessages ] = useState<ChatMessage[]>([])
  const [ newMessage, setNewMessage ] = useState('')
  const [ isChatOpen, setIsChatOpen ] = useState(false)

  const [ isFullscreen, setIsFullscreen ] = useState(false)
  const [ msToOpen, setMsToOpen ] = useState<number | null>(null);

  const secondsLeft = useSecondCountdown(msToOpen);

  useEffect(() => {
    (async () => {
      try {
        // 1) token da sala
        const r1 = await fetch(`/api/teleconsulta/livekit-token?sessionId=${sessionToken}`);
        const d1 = await r1.json();
        if (!r1.ok) {
          //  router.push(routePath);
          throw new Error(d1?.error || 'falha no token');

        }
        setToken(d1.token);
        setRoomName(d1.roomName);

        // 2) dados da sessão
        const r2 = await fetch(`/api/teleconsulta/sessions/${sessionToken}`);
        const d2 = await r2.json();
        if (!r2.ok) throw new Error(d2?.error || 'sessão não encontrada');

        const sess = d2.session as TeleconsultaSession;
        setSession(sess);

        // janela de liberação
        const scheduled = new Date(sess.scheduled_at).getTime();
        const canEnterAt = scheduled - ALLOW_JOIN_MINUTES_BEFORE * 60_000;
        const now = Date.now();

        if (now >= canEnterAt) {
          if (sess.status === 'scheduled') {
            await fetch(`/api/teleconsulta/sessions/${sess.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'in_progress' }),
            });
          }
          setMsToOpen(null);
        } else {
          setMsToOpen(canEnterAt);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [ sessionToken ]);

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

  if (!token || !roomName || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Não foi possível iniciar a sala</h1>
          <Button onClick={() => router.push('/')}>Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }

  // Se a sessão já foi concluída/cancelada, trate aqui se quiser
  if (session.status === 'completed' || session.status === 'cancelled') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-2">
            {session.status === 'completed' ? 'Consulta finalizada' : 'Consulta cancelada'}
          </h1>
          <Button onClick={() => router.push('/')}>Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }

  // se ainda não liberou, mostra UI de espera em SEGUNDOS
  if (secondsLeft !== null && secondsLeft > 0) {
    const humanStart = new Date(session!.scheduled_at).toLocaleString('pt-BR');

    const hh = String(Math.floor(secondsLeft / 3600)).padStart(2, '0');
    const mm = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0');
    const ss = String(secondsLeft % 60).padStart(2, '0');

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Aguarde para entrar na consulta</h1>
          <p className="text-gray-300 mb-6">
            Sua consulta está agendada para <strong>{humanStart}</strong>.
            Você poderá entrar {ALLOW_JOIN_MINUTES_BEFORE} min antes do horário.
          </p>

          <div className="text-5xl font-mono font-semibold mb-6">{hh}:{mm}:{ss}</div>

          <Button variant="secondary" onClick={() => router.push(routePath)}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const myId = user?.id ?? ''
  const otherParticipant =
    myId === (session.nutritionist.user_id ?? session.nutritionist.id)
      ? session.patient
      : session.nutritionist

  return (
    <LiveKitRoom
      serverUrl={process.env[ 'NEXT_PUBLIC_LIVEKIT_URL' ]}
      token={token}
      connect
      video
      audio
      data-lk-theme="default"
    >
      <RoomAudioRenderer />

      <TeleconsultaInner
        session={session}
        otherParticipant={otherParticipant}
        isFullscreen={isFullscreen}
        setIsFullscreen={setIsFullscreen}
        chatMessages={chatMessages}
        setChatMessages={setChatMessages}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
      />
    </LiveKitRoom>
  )
}

function TeleconsultaInner(props: {
  session: TeleconsultaSession
  otherParticipant: { full_name: string; profile_image_url: string | null }
  isFullscreen: boolean
  setIsFullscreen: (b: boolean) => void
  chatMessages: ChatMessage[]
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  newMessage: string
  setNewMessage: (s: string) => void
  isChatOpen: boolean
  setIsChatOpen: (b: boolean) => void
}) {
  const {
    session,
    otherParticipant,
    isFullscreen, setIsFullscreen,
    chatMessages, setChatMessages,
    newMessage, setNewMessage,
    isChatOpen, setIsChatOpen,
  } = props

  const room = useRoomContext()
  const { user } = useAuth()

  const [ isConnected, setIsConnected ] = useState(room.state === 'connected')
  const [ isAudioEnabled, setIsAudioEnabled ] = useState(true)
  const [ isVideoEnabled, setIsVideoEnabled ] = useState(true)

  const { label } = useCallTimer(session?.started_at ?? null)
  const [ endingSoon, setEndingSoon ] = useState(false)

  const router = useRouter()

  // helper: milissegundos até o fim da consulta
  function getMsUntilEnd(s: TeleconsultaSession) {
    const endAt =
      new Date(s.scheduled_at).getTime() + s.duration_minutes * 60_000
    return endAt - Date.now()
  }

  useEffect(() => {
    if (!session) return

    const msToEnd = getMsUntilEnd(session)
    const msToWarn = msToEnd - 10 * 60_000

    let warnTO: number | undefined

    const warn = () => {
      setEndingSoon(true)
      try {
        const msg = { type: 'ending_soon', at: Date.now() }
        room.localParticipant.publishData(
          new TextEncoder().encode(JSON.stringify(msg)),
          0,
        )
      } catch { }
    }

    const finish = async () => {
      setEndingSoon(false)
      try {
        await fetch(`/api/teleconsulta/sessions/${session.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' }),
        })
      } catch (e) {
        console.error('Falha ao completar sessão:', e)
      }
      try { await room.disconnect() } catch { }
    }

    if (msToEnd <= 0) {
      finish()
      return
    }

    if (msToWarn <= 0 && msToEnd > 0) {
      warn()
    } else if (msToWarn > 0) {
      warnTO = window.setTimeout(warn, msToWarn)
    }

    const endTO = window.setTimeout(finish, msToEnd)

    return () => {
      if (warnTO) clearTimeout(warnTO)
      if (endTO) clearTimeout(endTO)
    }
  }, [ room, session?.id, session?.scheduled_at, session?.duration_minutes ])

  useEffect(() => {
    const onConn = (state: any) => setIsConnected(state === 'connected')
    room.on(RoomEvent.ConnectionStateChanged, onConn)
    room.on(RoomEvent.DataReceived, (payload) => {
      const m = JSON.parse(new TextDecoder().decode(payload))
      setChatMessages(prev => prev.some(me => me.id === m.id) ? prev : [ ...prev, m ])
    })
    setIsAudioEnabled(!room.localParticipant.isMicrophoneEnabled)
    setIsVideoEnabled(!room.localParticipant.isCameraEnabled)
    return () => { room.off(RoomEvent.ConnectionStateChanged, onConn) }
  }, [ room ])

  const cams = useTracks([ Track.Source.Camera ])
  const remoteCam = useMemo(
    () => cams.find(t => !t.participant.isLocal),
    [ cams ]
  )
  const localCam = useMemo(
    () => cams.find(t => t.participant.isLocal),
    [ cams ]
  )

  const toggleAudio = async () => {
    const next = !room.localParticipant.isMicrophoneEnabled
    await room.localParticipant.setMicrophoneEnabled(next)
    setIsAudioEnabled(next)
  }
  const toggleVideo = async () => {
    const next = !room.localParticipant.isCameraEnabled
    await room.localParticipant.setCameraEnabled(next)
    setIsVideoEnabled(next)
  }
  const handleEndCall = async () => {
    try {
      await room.disconnect();
      const dashboardUrl = user?.user_metadata.user_type === 'paciente' ?
        '/dashboard/paciente?activeTab=teleconsultas' :
        '/dashboard/nutricionistas?activeTab=teleconsultas'
      router.push(dashboardUrl)
    } catch { }

    // await fetch(`/api/teleconsulta/sessions/${session.session_token}`, { method: 'PATCH', ... })
  }

  const sendChatMessage = () => {
    if (!newMessage.trim()) return
    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender_id: room.localParticipant.identity,
      sender_name: room.localParticipant.name ?? 'Você',
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
    }
    room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(msg)), 0);
    props.setChatMessages(prev => [ ...prev, msg ])
    setNewMessage('')
  }

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
                    <span>{label}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsChatOpen(v => !v)} className="flex text-gray-900 items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Chat
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); setIsFullscreen(true) }
                else { document.exitFullscreen(); setIsFullscreen(false) }
              }}
              className="flex items-center gap-2 text-gray-900"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Área principal de vídeo */}
        <div className="flex-1 relative">
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            {remoteCam ? (
              <div className="w-full h-full">
                {/* vídeo remoto (preenche) */}
                <VideoTrack trackRef={remoteCam} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="text-center">
                <User className="h-24 w-24 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Desconectado</p>
              </div>
            )}
          </div>

          {/* PIP local */}
          <div className="absolute top-4 right-4 w-64 h-48 bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-600">
            {localCam ? (
              <VideoTrack trackRef={localCam} className="w-full h-full object-cover" muted />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="h-8 w-8 text-gray-500" />
              </div>
            )}
          </div>

          {endingSoon && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-600 text-white px-4 py-2 rounded-full shadow">
              Faltam menos de 10 minutos para o fim da consulta.
            </div>
          )}

          {/* Controles */}
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

          {/* Status de conexão */}
          <div className="absolute top-4 left-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${isConnected ? 'bg-green-600' : 'bg-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-300' : 'bg-red-300'}`} />
              {isConnected ? 'Conectado' : 'Desconectado'}
            </div>
          </div>
        </div>

        {/* Chat (mantido) */}
        {isChatOpen && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold flex items-center gap-2"><MessageSquare className="h-5 w-5" />Chat da Consulta</h3>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {chatMessages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_id === room.localParticipant.identity ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-3 py-2 rounded-lg ${m.sender_id === room.localParticipant.identity ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-100'}`}>
                      <p className="text-sm">{m.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => props.setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Button onClick={sendChatMessage} size="sm">Enviar</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
