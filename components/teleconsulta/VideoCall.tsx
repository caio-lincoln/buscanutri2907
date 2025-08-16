'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Monitor,
  Camera,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface VideoCallProps {
  localStream?: MediaStream
  remoteStream?: MediaStream
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  isConnected: boolean
  participantName?: string
  participantAvatar?: string
  onToggleVideo: () => void
  onToggleAudio: () => void
  onEndCall: () => void
  onSwitchCamera?: () => void
  onStartScreenShare?: () => void
  className?: string
}

export function VideoCall({
  localStream,
  remoteStream,
  isVideoEnabled,
  isAudioEnabled,
  isConnected,
  participantName = 'Participante',
  participantAvatar,
  onToggleVideo,
  onToggleAudio,
  onEndCall,
  onSwitchCamera,
  onStartScreenShare,
  className
}: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)

  // Configurar stream local
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  // Configurar stream remoto
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout
    
    const resetTimeout = () => {
      clearTimeout(timeout)
      setShowControls(true)
      timeout = setTimeout(() => setShowControls(false), 3000)
    }

    resetTimeout()
    
    return () => clearTimeout(timeout)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <div className={cn('relative w-full h-full bg-gray-900 rounded-lg overflow-hidden', className)}>
      {/* Video Principal (Remoto) */}
      <div className="relative w-full h-full">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-800">
            <div className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage src={participantAvatar} />
                <AvatarFallback className="text-2xl">
                  {participantName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="text-white text-lg font-medium">{participantName}</p>
              <Badge 
                variant={isConnected ? 'default' : 'destructive'} 
                className="mt-2"
              >
                {isConnected ? 'Conectado' : 'Aguardando conexão...'}
              </Badge>
            </div>
          </div>
        )}

        {/* Video Local (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg">
          {localStream && isVideoEnabled ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <VideoOff className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>

        {/* Status de Conexão */}
        <div className="absolute top-4 left-4">
          <Badge 
            variant={isConnected ? 'default' : 'destructive'}
            className="bg-black/50 text-white border-0"
          >
            {isConnected ? 'Conectado' : 'Conectando...'}
          </Badge>
        </div>

        {/* Controles de Vídeo */}
        <div 
          className={cn(
            'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 transition-opacity duration-300',
            showControls ? 'opacity-100' : 'opacity-0'
          )}
          onMouseEnter={() => setShowControls(true)}
        >
          <div className="flex items-center justify-center space-x-4">
            {/* Toggle Audio */}
            <Button
              size="lg"
              variant={isAudioEnabled ? 'default' : 'destructive'}
              className="rounded-full w-12 h-12 p-0"
              onClick={onToggleAudio}
            >
              {isAudioEnabled ? (
                <Mic className="w-5 h-5" />
              ) : (
                <MicOff className="w-5 h-5" />
              )}
            </Button>

            {/* Toggle Video */}
            <Button
              size="lg"
              variant={isVideoEnabled ? 'default' : 'destructive'}
              className="rounded-full w-12 h-12 p-0"
              onClick={onToggleVideo}
            >
              {isVideoEnabled ? (
                <Video className="w-5 h-5" />
              ) : (
                <VideoOff className="w-5 h-5" />
              )}
            </Button>

            {/* Switch Camera */}
            {onSwitchCamera && (
              <Button
                size="lg"
                variant="outline"
                className="rounded-full w-12 h-12 p-0 bg-black/50 border-white/20 text-white hover:bg-white/20"
                onClick={onSwitchCamera}
              >
                <Camera className="w-5 h-5" />
              </Button>
            )}

            {/* Screen Share */}
            {onStartScreenShare && (
              <Button
                size="lg"
                variant="outline"
                className="rounded-full w-12 h-12 p-0 bg-black/50 border-white/20 text-white hover:bg-white/20"
                onClick={onStartScreenShare}
              >
                <Monitor className="w-5 h-5" />
              </Button>
            )}

            {/* Fullscreen */}
            <Button
              size="lg"
              variant="outline"
              className="rounded-full w-12 h-12 p-0 bg-black/50 border-white/20 text-white hover:bg-white/20"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </Button>

            {/* End Call */}
            <Button
              size="lg"
              variant="destructive"
              className="rounded-full w-12 h-12 p-0"
              onClick={onEndCall}
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}