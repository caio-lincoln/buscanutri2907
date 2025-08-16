import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TeleconsultaStatusBadge } from './TeleconsultaStatusBadge'
import { Calendar, Clock, User, Video, Phone } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type TeleconsultaStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

interface TeleconsultaSession {
  id: string
  scheduled_at: string
  duration: number
  status: TeleconsultaStatus
  price: number
  notes?: string
  patient_profiles?: {
    full_name: string
    phone?: string
    email?: string
  }
  nutritionist_profiles?: {
    full_name: string
    phone?: string
    email?: string
    specialties?: string[]
  }
}

interface TeleconsultaCardProps {
  session: TeleconsultaSession
  userType: 'patient' | 'nutritionist'
  onJoin?: (sessionId: string) => void
  onCancel?: (sessionId: string) => void
  onStart?: (sessionId: string) => void
  className?: string
}

export function TeleconsultaCard({
  session,
  userType,
  onJoin,
  onCancel,
  onStart,
  className = '',
}: TeleconsultaCardProps) {
  const scheduledDate = parseISO(session.scheduled_at)
  const now = new Date()
  const timeDiff = scheduledDate.getTime() - now.getTime()
  const minutesDiff = Math.floor(timeDiff / (1000 * 60))

  const canJoin = session.status === 'scheduled' && minutesDiff <= 15
  const canStart = session.status === 'scheduled' && userType === 'nutritionist'
  const canCancel = session.status === 'scheduled'

  const otherUser = userType === 'patient' 
    ? session.nutritionist_profiles 
    : session.patient_profiles

  return (
    <Card className={`${className} hover:shadow-md transition-shadow`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            {otherUser?.full_name || 'Usuário não encontrado'}
          </CardTitle>
          <TeleconsultaStatusBadge status={session.status} />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(scheduledDate, "dd 'de' MMMM", { locale: ptBR })}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(scheduledDate, 'HH:mm')} ({session.duration}min)
            </span>
          </div>
          
          {otherUser?.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{otherUser.phone}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Valor:</span>
            <span className="font-medium">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(session.price)}
            </span>
          </div>
        </div>

        {session.notes && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Observações:</p>
            <p className="text-sm">{session.notes}</p>
          </div>
        )}

        {userType === 'patient' && session.nutritionist_profiles?.specialties && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Especialidades:</p>
            <div className="flex flex-wrap gap-1">
              {session.nutritionist_profiles.specialties.map((specialty, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                >
                  {specialty}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {/* Botão para entrar na teleconsulta (paciente) */}
          {userType === 'patient' && canJoin && onJoin && (
            <Button
              onClick={() => onJoin(session.id)}
              className="flex-1"
              size="sm"
            >
              <Video className="h-4 w-4 mr-2" />
              Entrar na Consulta
            </Button>
          )}

          {/* Botão para iniciar teleconsulta (nutricionista) */}
          {userType === 'nutritionist' && canStart && onStart && (
            <Button
              onClick={() => onStart(session.id)}
              className="flex-1"
              size="sm"
            >
              <Video className="h-4 w-4 mr-2" />
              Iniciar Consulta
            </Button>
          )}

          {/* Botão para cancelar */}
          {canCancel && onCancel && (
            <Button
              onClick={() => onCancel(session.id)}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Cancelar
            </Button>
          )}

          {/* Mostrar tempo restante para entrar */}
          {session.status === 'scheduled' && minutesDiff > 15 && (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              Disponível em {Math.ceil(minutesDiff - 15)} minutos
            </div>
          )}

          {/* Mostrar se a consulta já passou */}
          {session.status === 'scheduled' && minutesDiff < -session.duration && (
            <div className="flex-1 flex items-center justify-center text-sm text-red-600">
              Consulta expirada
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}