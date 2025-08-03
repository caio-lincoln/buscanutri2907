import { createClient } from "@supabase/supabase-js"
import { createBrowserClient } from "@supabase/ssr"

// Certifique-se de que estas variáveis de ambiente estão configuradas no seu projeto Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "As variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY devem ser definidas.",
  )
}

// Cliente antigo para compatibilidade
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Novo cliente para autenticação
export const createSupabaseClient = () => createBrowserClient<Database>(
  supabaseUrl!,
  supabaseAnonKey!
)

// Export UserType for use in other files
export type UserType = "patient" | "nutritionist" | "company" | "admin"

// ────────────────────────────────────────────────────────────────────────────────
// Interfaces de Perfil
// ────────────────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  user_id: string
  full_name: string
  email: string
  phone?: string | null
  profile_image_url?: string | null
  created_at: string
  updated_at: string
  user_type: "patient" | "nutritionist" | "company" | "admin"
  // Preferências de notificação
  email_notifications_enabled?: boolean
  in_app_notifications_enabled?: boolean
}

export interface PatientProfile extends UserProfile {
  birth_date?: string | null
  cpf?: string | null
  rg?: string | null
  health_conditions?: string[] | null
  allergies?: string[] | null
  dietary_preferences?: string[] | null
  rating?: number | null
  total_reviews?: number | null
}

export interface NutritionistProfile extends UserProfile {
  crn_number: string
  bio?: string | null
  location?: string | null // Para atendimento presencial
  rating?: number | null
  total_reviews?: number | null
  experience_years?: number | null
  is_verified: boolean
  crn_document_url?: string | null
  identity_document_url?: string | null
  // Novas configurações de atendimento
  consultation_mode?: "online_only" | "presential_only" | "online_and_presential"
  default_consultation_duration?: number // em minutos (ex: 30, 45, 60)
  min_time_between_appointments?: number // em minutos
  address?: string | null // Endereço completo para consultas presenciais
  cancellation_policy?: string | null // Política de cancelamento
  // Campos adicionais usados no código
  specialties?: string[] | null // Especialidades do nutricionista
  services?: any[] | null // Serviços oferecidos
  consultation_price?: number | null // Preço da consulta
  online_consultation?: boolean | null // Se oferece consulta online
  crn?: string | null // Alias para crn_number
  profile_image_url?: string | null // URL da imagem de perfil
  badges?: Badge[] | null // Badges/insígnias do nutricionista
  // Estatísticas de visualização
  totalViews?: number | null // Total de visualizações do perfil
  uniqueViews?: number | null // Visualizações únicas do perfil
  lastViewAt?: string | null // Data da última visualização
  viewStats?: {
    totalViews: number
    uniqueViews: number
    lastViewAt: string | null
  } | null // Estatísticas completas de visualização
}

export interface CompanyProfile extends UserProfile {
  cnpj: string
  company_name: string
  industry?: string | null
  company_size?: number | null
  website?: string | null
}

// ────────────────────────────────────────────────────────────────────────────────
// Interfaces de Telemedicina
// ────────────────────────────────────────────────────────────────────────────────

export interface TelemedicineConsultation {
  id: string
  nutritionist_id: string
  patient_id: string | null // Pode ser null para slots bloqueados
  start_time: string
  end_time: string
  status: "scheduled" | "completed" | "cancelled" | "pending" | "rescheduled" | "in-progress"
  consultation_type: "online" | "presential"
  notes: string | null
  recording_url: string | null
  room_id: string | null
  patient_notes: string | null
  nutritionist_notes: string | null
  is_blocked_slot: boolean
  block_reason: string | null
  price: number
  payment_status: "pending" | "paid" | "refunded"
  created_at: string
  updated_at: string
  // Novos campos para cancelamento/reagendamento
  cancelled_by_user_id?: string | null
  cancel_reason?: string | null
  rescheduled_by_user_id?: string | null
  reschedule_reason?: string | null
}

export interface TelemedicineMessage {
  id: string
  consultation_id: string
  sender_id: string
  message: string
  message_type: "text" | "file" | "image"
  file_url?: string
  file_name?: string
  sent_at: string
  read_at?: string
  delivered_at: string
}

export interface TelemedicineNote {
  id: string
  consultation_id: string
  author_id: string
  title: string
  content: string
  category: "symptoms" | "diagnosis" | "treatment" | "followup" | "general"
  created_at: string
  updated_at: string
}

export interface TelemedicineReview {
  id: string
  consultation_id: string
  patient_id: string
  nutritionist_id: string
  rating: number
  comment?: string
  created_at: string
}

// ────────────────────────────────────────────────────────────────────────────────
// Outras Interfaces
// ────────────────────────────────────────────────────────────────────────────────

export interface JobPosting {
  id: string
  company_id: string
  title: string
  description: string
  requirements: string[]
  benefits: string[]
  location: string
  salary_min: number
  salary_max: number
  job_type: string
  level: string
  status: string
  applications_count: number
  created_at: string
  updated_at: string
}

export interface JobApplication {
  id: string
  job_id: string
  applicant_id: string
  status: "pending" | "reviewed" | "interview" | "rejected" | "hired"
  applied_at: string
  resume_url?: string
  cover_letter_url?: string
}

export interface ForumQuestion {
  id: string
  author_id: string
  title: string
  content: string
  tags: string[]
  views: number
  answers_count: number
  likes_count: number
  is_answered: boolean
  best_answer_id?: string
  created_at: string
  updated_at: string
  last_activity_at: string
}

export interface ForumAnswer {
  id: string
  question_id: string
  author_id: string
  content: string
  is_accepted: boolean
  likes_count: number
  created_at: string
  updated_at: string
}

export interface BlogPost {
  id: string
  author_id: string
  title: string
  content: string
  tags: string[]
  published_at: string
  updated_at: string
  views: number
  image_url?: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon_url: string
  criteria: string // JSONB ou TEXT descrevendo os critérios
  created_at: string
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  awarded_at: string
}

export interface Specialty {
  id: string
  name: string
}

export interface NutritionistService {
  id: string
  nutritionist_id: string
  name: string
  description: string
  price: number
  online_available: boolean
  presential_available: boolean
  duration_minutes: number
}

// ────────────────────────────────────────────────────────────────────────────────
// Database Type Definition
// ────────────────────────────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>
      }
      patient_profiles: {
        Row: PatientProfile
        Insert: Omit<PatientProfile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PatientProfile, 'id' | 'created_at' | 'updated_at'>>
      }
      nutritionist_profiles: {
        Row: NutritionistProfile
        Insert: Omit<NutritionistProfile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<NutritionistProfile, 'id' | 'created_at' | 'updated_at'>>
      }
      company_profiles: {
        Row: CompanyProfile
        Insert: Omit<CompanyProfile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CompanyProfile, 'id' | 'created_at' | 'updated_at'>>
      }
      consultations: {
        Row: TelemedicineConsultation
        Insert: Omit<TelemedicineConsultation, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<TelemedicineConsultation, 'id' | 'created_at' | 'updated_at'>>
      }
      job_postings: {
        Row: JobPosting
        Insert: Omit<JobPosting, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<JobPosting, 'id' | 'created_at' | 'updated_at'>>
      }
      forum_questions: {
        Row: ForumQuestion
        Insert: Omit<ForumQuestion, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ForumQuestion, 'id' | 'created_at' | 'updated_at'>>
      }
      forum_answers: {
        Row: ForumAnswer
        Insert: Omit<ForumAnswer, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ForumAnswer, 'id' | 'created_at' | 'updated_at'>>
      }
      blog_posts: {
        Row: BlogPost
        Insert: Omit<BlogPost, 'id' | 'updated_at'>
        Update: Partial<Omit<BlogPost, 'id' | 'updated_at'>>
      }
      badges: {
        Row: Badge
        Insert: Omit<Badge, 'id' | 'created_at'>
        Update: Partial<Omit<Badge, 'id' | 'created_at'>>
      }
      user_badges: {
        Row: UserBadge
        Insert: Omit<UserBadge, 'id'>
        Update: Partial<Omit<UserBadge, 'id'>>
      }
      specialties: {
        Row: Specialty
        Insert: Omit<Specialty, 'id'>
        Update: Partial<Omit<Specialty, 'id'>>
      }
      nutritionist_services: {
        Row: NutritionistService
        Insert: Omit<NutritionistService, 'id'>
        Update: Partial<Omit<NutritionistService, 'id'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
