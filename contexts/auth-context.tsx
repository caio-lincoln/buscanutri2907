'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import { useIsClient } from '@/hooks/use-local-storage'
import { useAuthSync } from '@/hooks/use-auth-sync'
import type { User } from '@supabase/supabase-js'
import type { UserProfile, NutritionistProfile, PatientProfile, CompanyProfile } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  nutritionistProfile: NutritionistProfile | null
  patientProfile: PatientProfile | null
  companyProfile: CompanyProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [nutritionistProfile, setNutritionistProfile] = useState<NutritionistProfile | null>(null)
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null)
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()
  const isClient = useIsClient()

  // Função para recarregar dados do usuário
  const refreshUserData = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      
      if (currentUser) {
        const profile = await getUserProfile(currentUser.id)
        setUserProfile(profile)
        
        // Carregar perfis específicos baseado no tipo de usuário
        if (profile?.user_type === 'nutritionist') {
          const { data: nutritionist } = await supabase
            .from('nutritionist_profiles')
            .select('*')
            .eq('user_id', currentUser.id)
            .single()
          setNutritionistProfile(nutritionist)
        } else if (profile?.user_type === 'patient') {
          const { data: patient } = await supabase
            .from('patient_profiles')
            .select('*')
            .eq('user_id', currentUser.id)
            .single()
          setPatientProfile(patient)
        } else if (profile?.user_type === 'company') {
          const { data: company } = await supabase
            .from('company_profiles')
            .select('*')
            .eq('user_id', currentUser.id)
            .single()
          setCompanyProfile(company)
        }
      } else {
        setUserProfile(null)
        setNutritionistProfile(null)
        setPatientProfile(null)
        setCompanyProfile(null)
      }
    } catch (error) {
      console.error('Erro ao recarregar dados do usuário:', error)
      setUser(null)
      setUserProfile(null)
      setNutritionistProfile(null)
      setPatientProfile(null)
      setCompanyProfile(null)
    }
  }, [supabase])

  // Hook para sincronização entre abas
  const { broadcastAuthChange } = useAuthSync(refreshUserData)

  const loadUser = useCallback(async () => {
    try {
      setLoading(true)
      await refreshUserData()
    } catch (error) {
      console.error('Erro ao carregar usuário:', error)
    } finally {
      setLoading(false)
    }
  }, [refreshUserData])

  const handleSignOut = useCallback(async () => {
    try {
      // Remove admin session if exists
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('admin_session')
      }
      
      // Broadcast logout para outras abas
      broadcastAuthChange('SIGN_OUT')
      
      await supabase.auth.signOut()
      setUser(null)
      setUserProfile(null)
      setNutritionistProfile(null)
      setPatientProfile(null)
      setCompanyProfile(null)
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }, [supabase, broadcastAuthChange])

  const refreshUser = useCallback(async () => {
    await refreshUserData()
  }, [refreshUserData])

  useEffect(() => {
    if (!isClient) return

    // Carregar usuário inicial
    loadUser()

    // Escutar mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.id)

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await refreshUserData()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserProfile(null)
        setNutritionistProfile(null)
        setPatientProfile(null)
        setCompanyProfile(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [isClient, loadUser, supabase, refreshUserData])

  const value = useMemo(
    () => ({
      user,
      userProfile,
      nutritionistProfile,
      patientProfile,
      companyProfile,
      loading,
      signOut: handleSignOut,
      refreshUser,
    }),
    [user, userProfile, nutritionistProfile, patientProfile, companyProfile, loading, handleSignOut, refreshUser]
  )

  return (
    <AuthContext.Provider value={value} suppressHydrationWarning>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
