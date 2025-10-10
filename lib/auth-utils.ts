import { createClient } from '@/lib/supabase/server'
import { User } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  email: string
  name: string
  user_type: 'paciente' | 'nutricionista' | 'empresa' | 'admin'
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface NutritionistProfile extends UserProfile {
  user_type: 'nutricionista'
  full_name?: string;
  nutritionist_specialties?: {
    specialties: {
      id: string;
      name: string;
    }
    specialty_id: string;
  }[];
  location?: string
  profile_image_url?: string
  rating?: string;
  reviews?: number;
  total_reviews?: number
  experience_years?: number
  nutritionist_services?: Array<any>
  crn: string
  specialty: string
  bio?: string
  phone?: string
  is_verified: boolean
}

export interface PatientProfile extends UserProfile {
  user_type: 'paciente'
  birth_date?: string
  phone?: string
  gender?: 'M' | 'F' | 'O'
}

export interface CompanyProfile extends UserProfile {
  user_type: 'empresa'
  cnpj: string
  company_name: string
  phone?: string
  is_verified: boolean
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()

  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error('Error getting current user:', error)
      return null
    }

    return user
  } catch (error) {
    console.error('Error in getCurrentUser:', error)
    return null
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error getting user profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    return null
  }
}

export async function getNutritionistProfile(userId: string): Promise<NutritionistProfile | null> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        nutritionist_profiles(*)
      `)
      .eq('id', userId)
      .eq('user_type', 'nutricionista')
      .single()

    if (error) {
      console.error('Error getting nutritionist profile:', error)
      return null
    }

    return {
      ...data,
      ...data.nutritionist_profiles[ 0 ]
    }
  } catch (error) {
    console.error('Error in getNutritionistProfile:', error)
    return null
  }
}

export async function getPatientProfile(userId: string): Promise<PatientProfile | null> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        patient_profiles(*)
      `)
      .eq('id', userId)
      .eq('user_type', 'paciente')
      .single()

    if (error) {
      console.error('Error getting patient profile:', error)
      return null
    }

    return {
      ...data,
      ...data.patient_profiles[ 0 ]
    }
  } catch (error) {
    console.error('Error in getPatientProfile:', error)
    return null
  }
}

export async function getCompanyProfile(userId: string): Promise<CompanyProfile | null> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        company_profiles(*)
      `)
      .eq('id', userId)
      .eq('user_type', 'empresa')
      .single()

    if (error) {
      console.error('Error getting company profile:', error)
      return null
    }

    return {
      ...data,
      ...data.company_profiles[ 0 ]
    }
  } catch (error) {
    console.error('Error in getCompanyProfile:', error)
    return null
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  return user
}

export async function requireUserType(allowedTypes: string[]): Promise<UserProfile> {
  const user = await requireAuth()
  const profile = await getUserProfile(user.id)

  if (!profile) {
    throw new Error('User profile not found')
  }

  if (!allowedTypes.includes(profile.user_type)) {
    throw new Error(`Access denied. Required user types: ${allowedTypes.join(', ')}`)
  }

  return profile
}

export async function requireNutritionist(): Promise<NutritionistProfile> {
  const user = await requireAuth()
  const profile = await getNutritionistProfile(user.id)

  if (!profile) {
    throw new Error('Nutritionist profile not found')
  }

  return profile
}

export async function requirePatient(): Promise<PatientProfile> {
  const user = await requireAuth()
  const profile = await getPatientProfile(user.id)

  if (!profile) {
    throw new Error('Patient profile not found')
  }

  return profile
}

export async function requireCompany(): Promise<CompanyProfile> {
  const user = await requireAuth()
  const profile = await getCompanyProfile(user.id)

  if (!profile) {
    throw new Error('Company profile not found')
  }

  return profile
}

export async function requireAdmin(): Promise<UserProfile> {
  // Development bypass: allow requests to proceed as admin when enabled
  if (process.env['DEV_ADMIN_BYPASS'] === 'true') {
    // Return a minimal admin-like profile for local testing
    return {
      id: 'dev-admin-bypass',
      email: 'dev-admin@example.com',
      name: 'Dev Admin',
      user_type: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }
  return requireUserType([ 'admin' ])
}

export function hasPermission(userType: string, requiredPermissions: string[]): boolean {
  const permissions: Record<string, string[]> = {
    admin: [ 'read', 'write', 'delete', 'manage_users', 'manage_system' ],
    nutricionista: [ 'read', 'write', 'manage_consultations', 'manage_agenda' ],
    empresa: [ 'read', 'write', 'manage_jobs', 'view_candidates' ],
    paciente: [ 'read', 'write', 'book_consultations' ]
  }

  const userPermissions = permissions[ userType ] || []

  return requiredPermissions.every(permission => userPermissions.includes(permission))
}

export function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function validateSessionToken(token: string): boolean {
  // Implementar validação de token se necessário
  return token && token.length > 10
}
