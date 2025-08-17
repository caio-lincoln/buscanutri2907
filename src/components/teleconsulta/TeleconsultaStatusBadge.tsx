import { Badge } from '@/components/ui/badge'
import { Clock, Video, CheckCircle, XCircle } from 'lucide-react'

type TeleconsultaStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

interface TeleconsultaStatusBadgeProps {
  status: TeleconsultaStatus
  className?: string
}

const statusConfig = {
  scheduled: {
    label: 'Agendada',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Clock,
  },
  in_progress: {
    label: 'Em Andamento',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: Video,
  },
  completed: {
    label: 'Concluída',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelada',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
  },
}

export function TeleconsultaStatusBadge({ status, className = '' }: TeleconsultaStatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={`${config.color} ${className} flex items-center gap-1 px-2 py-1`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}
