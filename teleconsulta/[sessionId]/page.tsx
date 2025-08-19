'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  MessageSquare,
  Settings,
  Monitor,
  Camera,
  Users,
  Clock,
  AlertCircle,
  Send,
  User,
  Minimize,
  Maximize
} from 'lucide-react'
import { useAuth } from '../../contexts/auth-context'

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
  nutritionist: {
    id: string
    full_name: string
    profile_image_url: string | null
    specialty: string
  }
  patient: {
    id: string
    full_name: string
    profile_image_url: string | null
  }
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
  user: {
    id: string
    full_name: string
    profile_image_url: string | null
  }
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

  // Chat state
  const [ chatMessages, setChatMessages ] = useState<ChatMessage[]>([])
  const [ newMessage, setNewMessage ] = useState('')
  const [ isChatOpen, setIsChatOpen ] = useState(false)

  // WebRTC refs
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (sessionStartTime && session?.status === 'in_progress') {
      interval = setInterval(() => {
        const now = new Date()
        const diff = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000)
        setSessionDuration(diff)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [ sessionStartTime, session?.status ])

  // Load session data
  useEffect(() => {
    if (sessionToken) {
      loadSessionData()
    }
  }, [ sessionToken ])

  // Initialize Socket.io server
  // useEffect(() => {
  //   const initializeSocket = async () => {
  //     try {
  //       await fetch('/api/socket')
  //     } catch (error) {
  //       console.error('Erro ao inicializar Socket.io:', error)
  //     }
  //   }

  //   initializeSocket()
  // }, [])

  // Update video refs when streams change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [ localStream ])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [ remoteStream ])

  // Auto-start call when session is ready
  useEffect(() => {
    if (session && user && session.status === 'scheduled') {
      console.log("Caiu aqui")
      initializeWebRTC()
      // joinSession()
    }
  }, [ session, user ])

  // Handle WebRTC errors
  useEffect(() => {
    if (webrtcError) {
      console.error('WebRTC Error:', webrtcError)
      // You can show a toast or error message here
    }
  }, [ webrtcError ])

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [ chatMessages ])

  const loadSessionData = async () => {
    try {
      const response = await fetch(`/api/teleconsulta/sessions/${sessionToken}`)

      if (!response.ok) {
        throw new Error('Sessão não encontrada')
      }

      const data = await response.json()
     
      console.log("🚀 ~ loadSessionData ~ data:", data)
      setSession(data.session)
      setParticipants(data.participants || [])

      if (data.session.status === 'in_progress') {
        setSessionStartTime(new Date())
      }
    } catch (error) {
      console.error('Erro ao carregar sessão:', error)
      toast.error('Erro ao carregar dados da sessão')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const initializeWebRTC = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      setLocalStream(stream)

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Create peer connection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      }

      const peerConnection = new RTCPeerConnection(configuration)
      peerConnectionRef.current = peerConnection

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream)
      })

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        const [ remoteStream ] = event.streams
        setRemoteStream(remoteStream as MediaStream)

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream ?? null
        }
      }

      console.log(getOtherParticipantId())
      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          sendWebRTCSignal({
            type: 'ice-candidate',
            data: event.candidate,
            from_user_id: user?.id as string,
            to_user_id: getOtherParticipantId(),
          })
        }
      }

      // Handle connection state
      peerConnection.onconnectionstatechange = () => {
        setIsConnected(peerConnection.connectionState === 'connected')
      }

    } catch (error) {
      console.error('Erro ao inicializar WebRTC:', error)
      toast.error('Erro ao acessar câmera e microfone')
    }
  }

  const joinSession = async () => {
    try {
      if (!user || !session) return

      const userType = user.id === session.nutritionist_id ? 'nutritionist' : 'patient'

      const response = await fetch('/api/teleconsulta/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: session.id,
          user_id: user.id,
          user_type: userType,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao entrar na sessão')
      }

      // Start session if it's scheduled
      if (session.status === 'scheduled') {
        await updateSessionStatus('in_progress')
      }

      toast.success('Conectado à teleconsulta!')
    } catch (error) {
      console.error('Erro ao entrar na sessão:', error)
      toast.error('Erro ao entrar na teleconsulta')
    }
  }

  const updateSessionStatus = async (status: string) => {
    try {
      const response = await fetch(`/api/teleconsulta/sessions/${sessionToken}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar status da sessão')
      }

      const data = await response.json()
      setSession(data.session)

      if (status === 'in_progress') {
        setSessionStartTime(new Date())
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const sendWebRTCSignal = async (signal: WebRTCSignal) => {
    try {
      await fetch('/api/teleconsulta/webrtc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: session?.id,
          ...signal,
        }),
      })
    } catch (error) {
      console.error('Erro ao enviar sinal WebRTC:', error)
    }
  }

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[ 0 ]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
      }
    }
  }

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[ 0 ]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioEnabled(audioTrack.enabled)
      }
    }
  }

  const handleEndCall = () => {
    endCall()
    updateSessionStatus('completed')

    // Redirect after a delay
    setTimeout(() => {
      router.push('/dashboard')
    }, 2000)
  }

  const sendChatMessage = () => {
    if (!newMessage.trim() || !user) return

    const message: ChatMessage = {
      id: Date.now().toString(),
      sender_id: user.id,
      sender_name: user.full_name || 'Usuário',
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
    }

    setChatMessages(prev => [ ...prev, message ])
    setNewMessage('')
  }

  const getOtherParticipantId = () => {
    if (!session || !user) return ''
    return user.id === session.nutritionist.user_id ? session.patient.id : session.nutritionist.id
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto mb-4"></div>
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
          <Button onClick={() => router.push('/')}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const otherParticipant = user?.id === session.nutritionist_id ? session.patient : session.nutritionist

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={otherParticipant.profile_image_url || ''}
                alt={otherParticipant.full_name}
              />
              <AvatarFallback>
                {otherParticipant.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-semibold">{otherParticipant.full_name}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Badge className={statusColors[ session.status ]}>
                  {statusLabels[ session.status ]}
                </Badge>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Chat
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="flex items-center gap-2"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Video Area */}
        <div className="flex-1 relative">
          {/* Remote Video */}
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center">
                <User className="h-24 w-24 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Aguardando conexão...</p>
              </div>
            )}
          </div>

          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute top-4 right-4 w-64 h-48 bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-600">
            {localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="h-8 w-8 text-gray-500" />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-4 bg-gray-800 bg-opacity-90 rounded-full px-6 py-3">
              <Button
                variant={isAudioEnabled ? "default" : "secondary"}
                size="lg"
                onClick={() => toggleAudio()}
                className="rounded-full w-12 h-12"
              >
                {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>
              <Button
                variant={isVideoEnabled ? "default" : "secondary"}
                size="lg"
                onClick={() => toggleVideo()}
                className="rounded-full w-12 h-12"
              >
                {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>
              <Button
                variant="destructive"
                size="lg"
                onClick={handleEndCall}
                className="rounded-full w-12 h-12"
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Connection Status */}
          <div className="absolute top-4 left-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${isConnected ? 'bg-green-600' : 'bg-red-600'
              }`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-300' : 'bg-red-300'
                }`} />
              {isConnected ? 'Conectado' : 'Conectando...'}
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {isChatOpen && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat da Consulta
              </h3>
            </div>

            <ScrollArea className="flex-1 p-4" ref={chatScrollRef}>
              <div className="space-y-4">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg ${message.sender_id === user?.id
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-100'
                        }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {format(parseISO(message.timestamp), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Button onClick={sendChatMessage} size="sm">
                  Enviar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}