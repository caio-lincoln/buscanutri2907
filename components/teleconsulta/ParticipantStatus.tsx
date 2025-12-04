'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Wifi,
  WifiOff,
  Crown,
  User,
  MoreVertical
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface Participant {
  id: string
  name: string
  email?: string
  avatar?: string
  role: 'paciente' | 'nutricionista' | 'admin'
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  isScreenSharing: boolean
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'poor'
  joinedAt: Date
  isHost?: boolean
}

interface ParticipantStatusProps {
  participants: Participant[]
  currentUserId: string
  onMuteParticipant?: (participantId: string) => void
  onRemoveParticipant?: (participantId: string) => void
  onPromoteToHost?: (participantId: string) => void
  showActions?: boolean
  layout?: 'list' | 'grid' | 'compact'
  className?: string
}

export function ParticipantStatus({
  participants,
  currentUserId,
  onMuteParticipant,
  onRemoveParticipant,
  onPromoteToHost,
  showActions = false,
  layout = 'list',
  className
}: ParticipantStatusProps) {
  const getConnectionColor = (status: Participant['connectionStatus']) => {
    switch (status) {
      case 'connected':
        return 'text-green-500'
      case 'connecting':
        return 'text-yellow-500'
      case 'poor':
        return 'text-orange-500'
      case 'disconnected':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getConnectionIcon = (status: Participant['connectionStatus']) => {
    switch (status) {
      case 'connected':
      case 'poor':
        return <Wifi className="w-3 h-3" />
      case 'connecting':
        return <Wifi className="w-3 h-3 animate-pulse" />
      case 'disconnected':
        return <WifiOff className="w-3 h-3" />
      default:
        return <WifiOff className="w-3 h-3" />
    }
  }

  const getRoleBadgeColor = (role: Participant['role']) => {
    switch (role) {
      case 'nutricionista':
        return 'bg-blue-100 text-blue-800'
      case 'paciente':
        return 'bg-green-100 text-green-800'
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatJoinTime = (date: Date) => {
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60)
    
    if (diff < 1) return 'Agora'
    if (diff === 1) return '1 min'
    if (diff < 60) return `${diff} min`
    
    const hours = Math.floor(diff / 60)
    if (hours === 1) return '1h'
    return `${hours}h`
  }

  if (layout === 'compact') {
    return (
      <div className={cn('flex items-center gap-2 p-2 bg-white/90 backdrop-blur-sm rounded-lg', className)}>
        <div className="flex items-center gap-1">
          <User className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium">{participants.length}</span>
        </div>
        <div className="flex -space-x-2">
          {participants.slice(0, 3).map((participant) => (
            <Avatar key={participant.id} className="w-6 h-6 border-2 border-white">
              <AvatarImage src={participant.avatar} />
              <AvatarFallback className="text-xs">
                {participant.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
          {participants.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">
                +{participants.length - 3}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (layout === 'grid') {
    return (
      <div className={cn('grid grid-cols-2 gap-3', className)}>
        {participants.map((participant) => (
          <Card key={participant.id} className="p-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={participant.avatar} />
                  <AvatarFallback>
                    {participant.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {participant.isHost && (
                  <Crown className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {participant.id === currentUserId ? 'Você' : participant.name}
                  </span>
                  <div className={cn('flex items-center', getConnectionColor(participant.connectionStatus))}>
                    {getConnectionIcon(participant.connectionStatus)}
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {participant.isAudioEnabled ? (
                    <Mic className="w-3 h-3 text-green-500" />
                  ) : (
                    <MicOff className="w-3 h-3 text-red-500" />
                  )}
                  {participant.isVideoEnabled ? (
                    <Video className="w-3 h-3 text-green-500" />
                  ) : (
                    <VideoOff className="w-3 h-3 text-red-500" />
                  )}
                  {participant.isScreenSharing && (
                    <Monitor className="w-3 h-3 text-blue-500" />
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Participantes ({participants.length})</h3>
        </div>
        
        <div className="space-y-3">
          {participants.map((participant) => (
            <div key={participant.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={participant.avatar} />
                  <AvatarFallback>
                    {participant.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {participant.isHost && (
                  <Crown className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {participant.id === currentUserId ? 'Você' : participant.name}
                  </span>
                  <Badge variant="secondary" className={cn('text-xs', getRoleBadgeColor(participant.role))}>
                    {participant.role}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  {/* Media Status */}
                  <div className="flex items-center gap-1">
                    {participant.isAudioEnabled ? (
                      <Mic className="w-3 h-3 text-green-500" />
                    ) : (
                      <MicOff className="w-3 h-3 text-red-500" />
                    )}
                    {participant.isVideoEnabled ? (
                      <Video className="w-3 h-3 text-green-500" />
                    ) : (
                      <VideoOff className="w-3 h-3 text-red-500" />
                    )}
                    {participant.isScreenSharing && (
                      <Monitor className="w-3 h-3 text-blue-500" />
                    )}
                  </div>
                  
                  {/* Connection Status */}
                  <div className={cn('flex items-center gap-1', getConnectionColor(participant.connectionStatus))}>
                    {getConnectionIcon(participant.connectionStatus)}
                    <span className="text-xs">
                      {participant.connectionStatus === 'connected' && 'Conectado'}
                      {participant.connectionStatus === 'connecting' && 'Conectando'}
                      {participant.connectionStatus === 'poor' && 'Conexão ruim'}
                      {participant.connectionStatus === 'disconnected' && 'Desconectado'}
                    </span>
                  </div>
                  
                  {/* Join Time */}
                  <span className="text-xs text-gray-500">
                    {formatJoinTime(participant.joinedAt)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {showActions && participant.id !== currentUserId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onMuteParticipant && (
                      <DropdownMenuItem onClick={() => onMuteParticipant(participant.id)}>
                        {participant.isAudioEnabled ? 'Silenciar' : 'Reativar áudio'}
                      </DropdownMenuItem>
                    )}
                    {onPromoteToHost && !participant.isHost && (
                      <DropdownMenuItem onClick={() => onPromoteToHost(participant.id)}>
                        Promover a host
                      </DropdownMenuItem>
                    )}
                    {onRemoveParticipant && (
                      <DropdownMenuItem 
                        onClick={() => onRemoveParticipant(participant.id)}
                        className="text-red-600"
                      >
                        Remover da sessão
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
