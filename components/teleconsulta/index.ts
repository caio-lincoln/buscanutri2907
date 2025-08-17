// Componentes principais de teleconsulta
export { VideoCall } from './VideoCall'
export { ChatPanel } from './ChatPanel'
export { MediaControls, MobileMediaControls } from './MediaControls'
export { ParticipantStatus } from './ParticipantStatus'
export { TeleconsultaCard } from './TeleconsultaCard'
export { TeleconsultaFilters } from './TeleconsultaFilters'
export { AvailabilityManager } from './AvailabilityManager'

// Tipos e interfaces
export type {
  VideoCallProps,
  VideoStream,
  CallStatus
} from './VideoCall'

export type {
  ChatMessage,
  ChatPanelProps
} from './ChatPanel'

export type {
  MediaControlsProps
} from './MediaControls'

export type {
  Participant,
  ParticipantStatusProps
} from './ParticipantStatus'

export type {
  TeleconsultaSession,
  TeleconsultaCardProps
} from './TeleconsultaCard'

export type {
  TeleconsultaFilters as TeleconsultaFiltersType,
  TeleconsultaFiltersProps
} from './TeleconsultaFilters'

export type {
  TimeSlot,
  DayAvailability,
  AvailabilityData,
  AvailabilityManagerProps
} from './AvailabilityManager'