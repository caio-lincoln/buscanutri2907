// Tipos centralizados para o sistema

export interface UserData {
  id: string
  numericId?: number
  name: string
  email: string
  type: 'paciente' | 'nutricionista' | 'empresa'
  status: 'ativo' | 'inativo' | 'pendente' | 'banido'
  createdAt: string
  lastLogin?: string
  is_banned?: boolean
  banned_at?: string | null
  banned_reason?: string | null
  banned_by?: string | null
  nutritionist_profiles?: {
    id: string
    full_name: string
    is_verified?: string
  }
}

export interface NutritionistDocument {
  id: string
  nutritionist_id: string
  document_type: string
  title: string | null
  file_name: string
  public_url: string
   storage_path?: string
   mime_type?: string | null
   file_size?: number | null
   is_verified?: boolean | null
   verification_notes?: string | null
   created_at?: string | null
}

export interface TransactionData {
  id: string
  type: 'receita' | 'despesa'
  amount: number
  description: string
  date: string
  status: 'concluída' | 'pendente' | 'cancelada'
  userId?: string
  userName?: string
}

export interface ReportMetric {
  id: string
  title: string
  value: number
  change: number
  period: string
  type: 'users' | 'revenue' | 'consultations' | 'posts'
}

export interface ReportData {
  id: string
  type: 'spam' | 'conteudo_inadequado' | 'perfil_falso' | 'outros'
  reportedItem: string
  reportedBy: string
  reason: string
  status: 'pendente' | 'resolvido' | 'rejeitado'
  createdAt: string
}

export interface ServiceStatus {
  id: string
  name: string
  status: 'online' | 'offline' | 'manutencao'
  uptime: number
  lastCheck: string
}
