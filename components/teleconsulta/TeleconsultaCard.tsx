'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, Clock, Video, User, Copy, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

export interface TeleconsultaSession {
  id: string
  nutritionist_id: string
  patient_id: string
  scheduled_at: string
  duration_minutes: number
  price: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  join_url: string
  session_token: string
  nutritionist?: {
    id: string
    name: string
    avatar_url?: string
    crn: string
  }
  patient?: {
    id: string
    name: string
    avatar_url?: string
  }
}

export interface TeleconsultaCardProps {
  session: TeleconsultaSession
  userRole: 'nutricionista' | 'paciente'
  onJoin?: (sessionId: string) => void
  onCancel?: (sessionId: string) => void
  onReschedule?: (sessionId: string) => void
  className?: string
}

const statusConfig = {
  scheduled: {
    label: 'Agendada',
    color: 'bg-blue-100 text-blue-800',
    icon: Calendar
  },
  in_progress: {
    label: 'Em andamento',
    color: 'bg-green-100 text-green-800',
    icon: Video
  },
  completed: {
    label: 'Concluída',
    color: 'bg-gray-100 text-gray-800',
    icon: Clock
  },
  cancelled: {
    label: 'Cancelada',
    color: 'bg-red-100 text-red-800',
    icon: Clock
  },
  pending_payment: {
    label: 'Pendente pagamento',
    color: 'bg-blue-100 text-blue-800',
    icon: Calendar
  }
}

export function TeleconsultaCard({
  session,
  userRole,
  onJoin,
  onCancel,
  onReschedule,
  className
}: TeleconsultaCardProps) {
 
  const scheduledDate = new Date(session.scheduled_at)


  const now = new Date()
  const isToday = format(scheduledDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
  const canJoin = session.status === 'scheduled' && 
    Math.abs(scheduledDate.getTime() - now.getTime()) <= 15 * 60 * 1000 
  
  const otherUser = userRole === 'nutricionista' ? session.patient : session.nutritionist
  const statusInfo = statusConfig[session.status]
  const StatusIcon = statusInfo?.icon

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(session.join_url)
      toast.success('Link copiado para a área de transferência!')
    } catch (error) {
      toast.error('Erro ao copiar link')
    }
  }

  const handleJoin = () => {
    if (onJoin) {
      onJoin(session.id)
    } else {
      window.open(session.join_url, '_blank')
    }
  }

  return (
    <Card className={`transition-all hover:shadow-md ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser?.profile_image_url} />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">
                {userRole === 'nutricionista' ? 'Consulta com' : 'Consulta com'} {otherUser?.full_name}
              </CardTitle>
              {userRole === 'paciente' && session.nutritionist?.crn && (
                <p className="text-sm text-muted-foreground">
                  CRN: {session.nutritionist.crn}
                </p>
              )}
            </div>
          </div>
          <Badge className={statusInfo.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(scheduledDate, "dd 'de' MMMM", { locale: ptBR })}
              {isToday && <Badge variant="outline" className="ml-2">Hoje</Badge>}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {scheduledDate.toISOString().substring(11, 16)} ({session.duration_minutes}min)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-lg font-semibold">
            R$ {session.price.toFixed(2)}
          </div>
          
          <div className="flex space-x-2">
            {session.status === 'scheduled' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="flex items-center space-x-1"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copiar Link</span>
                </Button>
                
                {canJoin && (
                  <Button
                    onClick={handleJoin}
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Video className="h-4 w-4" />
                    <span>Entrar</span>
                  </Button>
                )}
                
                {!canJoin && onReschedule && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReschedule(session.id)}
                  >
                    Reagendar
                  </Button>
                )}
                
                {onCancel && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onCancel(session.id)}
                  >
                    Cancelar
                  </Button>
                )}
              </>
            )}
            
            {session.status === 'in_progress' && (
              <Button
                onClick={handleJoin}
                size="sm"
                className="flex items-center space-x-1"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Entrar na Sala</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default TeleconsultaCard