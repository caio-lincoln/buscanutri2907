'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Monitor,
  MonitorOff,
  Camera,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MediaControlsProps {
  // Audio controls
  isAudioEnabled: boolean
  onToggleAudio: () => void
  
  // Video controls
  isVideoEnabled: boolean
  onToggleVideo: () => void
  
  // Screen sharing
  isScreenSharing: boolean
  onToggleScreenShare: () => void
  
  // Camera switching
  onSwitchCamera?: () => void
  
  // Call controls
  onEndCall: () => void
  
  // Connection status
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'failed'
  
  // Settings
  onOpenSettings?: () => void
  
  // Layout
  orientation?: 'horizontal' | 'vertical'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function MediaControls({
  isAudioEnabled,
  onToggleAudio,
  isVideoEnabled,
  onToggleVideo,
  isScreenSharing,
  onToggleScreenShare,
  onSwitchCamera,
  onEndCall,
  connectionStatus,
  onOpenSettings,
  orientation = 'horizontal',
  size = 'md',
  className
}: MediaControlsProps) {
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500'
      case 'connecting':
        return 'bg-yellow-500'
      case 'disconnected':
      case 'failed':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Conectado'
      case 'connecting':
        return 'Conectando...'
      case 'disconnected':
        return 'Desconectado'
      case 'failed':
        return 'Falha na conexão'
      default:
        return 'Desconhecido'
    }
  }

  const buttonSizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const buttonSize = buttonSizes[size]
  const iconSize = iconSizes[size]

  return (
    <TooltipProvider>
      <div className={cn(
        'flex items-center gap-2 p-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border',
        orientation === 'vertical' && 'flex-col',
        className
      )}>
        {/* Connection Status */}
        <div className="flex items-center gap-2 px-2">
          <div className={cn('w-2 h-2 rounded-full', getConnectionStatusColor())} />
          <span className="text-xs font-medium text-gray-700">
            {getConnectionStatusText()}
          </span>
        </div>

        {orientation === 'horizontal' && <div className="w-px h-6 bg-gray-300" />}

        {/* Audio Control */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isAudioEnabled ? 'default' : 'destructive'}
              size="sm"
              className={cn(buttonSize, 'rounded-full')}
              onClick={onToggleAudio}
            >
              {isAudioEnabled ? (
                <Mic className={iconSize} />
              ) : (
                <MicOff className={iconSize} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isAudioEnabled ? 'Desativar microfone' : 'Ativar microfone'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Video Control */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isVideoEnabled ? 'default' : 'destructive'}
              size="sm"
              className={cn(buttonSize, 'rounded-full')}
              onClick={onToggleVideo}
            >
              {isVideoEnabled ? (
                <Video className={iconSize} />
              ) : (
                <VideoOff className={iconSize} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isVideoEnabled ? 'Desativar câmera' : 'Ativar câmera'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Camera Switch */}
        {onSwitchCamera && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(buttonSize, 'rounded-full')}
                onClick={onSwitchCamera}
                disabled={!isVideoEnabled}
              >
                <Camera className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Alternar câmera</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Screen Share */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isScreenSharing ? 'default' : 'outline'}
              size="sm"
              className={cn(buttonSize, 'rounded-full')}
              onClick={onToggleScreenShare}
            >
              {isScreenSharing ? (
                <MonitorOff className={iconSize} />
              ) : (
                <Monitor className={iconSize} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isScreenSharing ? 'Parar compartilhamento' : 'Compartilhar tela'}</p>
          </TooltipContent>
        </Tooltip>

        {orientation === 'horizontal' && <div className="w-px h-6 bg-gray-300" />}

        {/* Settings */}
        {onOpenSettings && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(buttonSize, 'rounded-full')}
                onClick={onOpenSettings}
              >
                <Settings className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Configurações</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* End Call */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              className={cn(buttonSize, 'rounded-full bg-red-600 hover:bg-red-700')}
              onClick={onEndCall}
            >
              <PhoneOff className={iconSize} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Encerrar chamada</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

// Componente simplificado para uso em mobile
export function MobileMediaControls({
  isAudioEnabled,
  onToggleAudio,
  isVideoEnabled,
  onToggleVideo,
  onEndCall,
  className
}: Pick<MediaControlsProps, 'isAudioEnabled' | 'onToggleAudio' | 'isVideoEnabled' | 'onToggleVideo' | 'onEndCall' | 'className'>) {
  return (
    <div className={cn(
      'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50',
      'flex items-center gap-4 p-3 bg-black/80 backdrop-blur-sm rounded-full',
      className
    )}>
      {/* Audio */}
      <Button
        variant={isAudioEnabled ? 'secondary' : 'destructive'}
        size="sm"
        className="h-12 w-12 rounded-full"
        onClick={onToggleAudio}
      >
        {isAudioEnabled ? (
          <Mic className="w-5 h-5" />
        ) : (
          <MicOff className="w-5 h-5" />
        )}
      </Button>

      {/* Video */}
      <Button
        variant={isVideoEnabled ? 'secondary' : 'destructive'}
        size="sm"
        className="h-12 w-12 rounded-full"
        onClick={onToggleVideo}
      >
        {isVideoEnabled ? (
          <Video className="w-5 h-5" />
        ) : (
          <VideoOff className="w-5 h-5" />
        )}
      </Button>

      {/* End Call */}
      <Button
        variant="destructive"
        size="sm"
        className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-700"
        onClick={onEndCall}
      >
        <PhoneOff className="w-5 h-5" />
      </Button>
    </div>
  )
}