'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { getUserProfile } from '@/lib/auth'

interface ProfileData {
  full_name: string
  email: string
  avatar_url?: string
}

interface ProfileContextType {
  profileData: ProfileData
  updateProfile: (data: Partial<ProfileData>) => void
  refreshProfile: () => Promise<void>
  loading: boolean
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

interface ProfileProviderProps {
  children: ReactNode
  initialUser?: Pick<SupabaseUser, 'id' | 'email' | 'user_metadata' | 'app_metadata'>
}

export function ProfileProvider({ children, initialUser }: ProfileProviderProps) {
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: initialUser?.user_metadata?.full_name || '',
    email: initialUser?.email || '',
    avatar_url: initialUser?.user_metadata?.avatar_url || '',
  })
  const [loading, setLoading] = useState(false)
  const supabase = createSupabaseClient()

  const updateProfile = (data: Partial<ProfileData>) => {
    setProfileData(prev => ({ ...prev, ...data }))
  }

  const loadProfileFromDatabase = async (userId: string, userType?: string) => {
    try {
      // Primeiro, buscar o tipo de usuário se não foi fornecido
      let resolvedUserType = userType
      if (!resolvedUserType) {
        const { data: userData } = await supabase
          .from('users')
          .select('user_type')
          .eq('id', userId)
          .single()
        
        resolvedUserType = userData?.user_type
      }

      if (!resolvedUserType) return null

      // Buscar dados da tabela de perfil específica
      const { data: profileData } = await getUserProfile(userId, resolvedUserType as any)
      
      if (profileData) {
        return {
          full_name: profileData.full_name || profileData.company_name || '',
          email: profileData.email || initialUser?.email || '',
          avatar_url: profileData.profile_image_url || profileData.avatar_url || profileData.logo_url || '',
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil do banco:', error)
    }
    
    return null
  }

  const refreshProfile = async () => {
    if (!initialUser?.id || typeof window === 'undefined') return
    
    setLoading(true)
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) throw error
      
      if (user) {
        // Primeiro tentar carregar do banco de dados
        const dbProfile = await loadProfileFromDatabase(user.id, user.user_metadata?.user_type)
        
        if (dbProfile) {
          setProfileData(dbProfile)
        } else {
          // Fallback para user_metadata se não encontrar no banco
          setProfileData({
            full_name: user.user_metadata?.full_name || '',
            email: user.email || '',
            avatar_url: user.user_metadata?.avatar_url || '',
          })
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  // Carregar perfil inicial do banco de dados
  useEffect(() => {
    const loadInitialProfile = async () => {
      if (!initialUser?.id || typeof window === 'undefined') return
      
      const dbProfile = await loadProfileFromDatabase(
        initialUser.id, 
        initialUser.user_metadata?.user_type
      )
      
      if (dbProfile) {
        setProfileData(dbProfile)
      }
    }

    loadInitialProfile()
  }, [initialUser?.id, initialUser?.user_metadata?.user_type])

  // Listen for auth changes - only on client side
  useEffect(() => {
    if (typeof window === 'undefined') return

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'USER_UPDATED' && session?.user) {
          setProfileData({
            full_name: session.user.user_metadata?.full_name || '',
            email: session.user.email || '',
            avatar_url: session.user.user_metadata?.avatar_url || '',
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  return (
    <ProfileContext.Provider value={{ profileData, updateProfile, refreshProfile, loading }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}

export { ProfileContext }