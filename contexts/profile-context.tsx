'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { User as SupabaseUser } from '@supabase/supabase-js'

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

  const refreshProfile = async () => {
    if (!initialUser?.id) return
    
    setLoading(true)
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) throw error
      
      if (user) {
        setProfileData({
          full_name: user.user_metadata?.full_name || '',
          email: user.email || '',
          avatar_url: user.user_metadata?.avatar_url || '',
        })
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  // Listen for auth changes
  useEffect(() => {
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