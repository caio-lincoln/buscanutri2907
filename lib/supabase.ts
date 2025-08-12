import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

// Certifique-se de que estas variáveis de ambiente estão configuradas no seu projeto Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Durante o build, use valores padrão para evitar erros
const defaultUrl = 'https://placeholder.supabase.co'
const defaultKey = 'placeholder-key'

// Use valores padrão durante o build se as variáveis não estiverem definidas
const finalUrl = supabaseUrl || defaultUrl
const finalKey = supabaseAnonKey || defaultKey

// Só lance erro em runtime se as variáveis não estiverem definidas
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  // Silent error handling: Environment variables not defined
}

// Cliente antigo para compatibilidade com sessionStorage
export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Novo cliente para autenticação com sessionStorage (expira ao fechar o navegador)
export const createSupabaseClient = () =>
  createBrowserClient<Database>(finalUrl, finalKey, {
    auth: {
      storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })

// Export UserType for use in other files
export type UserType = 'paciente' | 'nutricionista' | 'empresa' | 'admin'

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
  user_type: 'patient' | 'nutritionist' | 'company' | 'admin'
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
  consultation_mode?:
    | 'online_only'
    | 'presential_only'
    | 'online_and_presential'
  default_consultation_duration?: number // em minutos (ex: 30, 45, 60)
  min_time_between_appointments?: number // em minutos
  // Campo online_only_consultation removido - simplificado para service_online_available
  address?: string | null // Endereço completo para consultas presenciais
  cancellation_policy?: string | null // Política de cancelamento
  // Campos adicionais usados no código
  specialties?: string[] | null // Especialidades do nutricionista
  consultation_price?: number | null // Preço da consulta
  // Campo online_consultation removido - substituído por service_online_available
  crn?: string | null // Alias para crn_number
  profile_image_url?: string | null // URL da imagem de perfil
  cover_image_url?: string | null // URL da imagem de capa
  badges?: any[] | null // Badges/insígnias do nutricionista

  // Redes sociais (campos individuais)
  instagram_username?: string | null
  linkedin_username?: string | null
  facebook_username?: string | null
  youtube_channel?: string | null
  tiktok_username?: string | null
  website_url?: string | null

  // Serviços (campos individuais)
  service_consultation_price?: number | null
  service_followup_price?: number | null
  service_meal_plan_price?: number | null
  service_group_consultation?: boolean | null
  service_online_available?: boolean | null
  service_presential_available?: boolean | null

  // Horários de trabalho (campos individuais)
  monday_hours?: string | null
  tuesday_hours?: string | null
  wednesday_hours?: string | null
  thursday_hours?: string | null
  friday_hours?: string | null
  saturday_hours?: string | null
  sunday_hours?: string | null
  break_time?: string | null

  // Preferências e configurações
  accepts_insurance?: boolean | null
  emergency_consultation?: boolean | null
  consultation_languages?: string | null // separado por vírgula
  payment_methods?: string | null // separado por vírgula
  max_patients_per_day?: number | null
  aceita_cupons?: boolean | null // Consentimento para participar de campanhas com cupons de desconto

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
  logo_url?: string | null
}

// ────────────────────────────────────────────────────────────────────────────────
// Interfaces de Telemedicina - REMOVIDAS
// ────────────────────────────────────────────────────────────────────────────────

// Funcionalidade de telemedicina removida temporariamente

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
  status: 'pending' | 'reviewed' | 'interview' | 'rejected' | 'hired'
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

export interface NutritionistAddress {
  id: string
  nutritionist_id: string
  type: 'in_person' | 'teleconsultation'
  status: 'active' | 'inactive'
  is_main: boolean

  // Structured address fields
  country: string
  state: string
  city: string
  neighborhood?: string | null
  zip_code?: string | null
  street?: string | null
  number?: string | null
  complement?: string | null

  // Geocoding for search and maps
  latitude?: number | null
  longitude?: number | null

  // Service radius in kilometers (optional)
  service_radius_km?: number | null

  // Generated fields
  city_slug: string // normalized city + state for filtering
  full_address: string // complete address for display

  created_at: string
  updated_at: string
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
        Update: Partial<
          Omit<PatientProfile, 'id' | 'created_at' | 'updated_at'>
        >
      }
      nutritionist_profiles: {
        Row: NutritionistProfile
        Insert: Omit<NutritionistProfile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<
          Omit<NutritionistProfile, 'id' | 'created_at' | 'updated_at'>
        >
      }
      company_profiles: {
        Row: CompanyProfile
        Insert: Omit<CompanyProfile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<
          Omit<CompanyProfile, 'id' | 'created_at' | 'updated_at'>
        >
      }
      // consultations: Tabela removida - funcionalidade de telemedicina desabilitada
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
      nutritionist_addresses: {
        Row: NutritionistAddress
        Insert: Omit<
          NutritionistAddress,
          'id' | 'city_slug' | 'full_address' | 'created_at' | 'updated_at'
        >
        Update: Partial<
          Omit<
            NutritionistAddress,
            'id' | 'city_slug' | 'full_address' | 'created_at' | 'updated_at'
          >
        >
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
