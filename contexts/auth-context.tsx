'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
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
  setUser: (value: React.SetStateAction<User | null>) => void
  setUserProfile: (value: React.SetStateAction<UserProfile | null>) => void
  refreshUser: (user?: User) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ user, setUser ] = useState<User | null>(null)
  const [ userProfile, setUserProfile ] = useState<UserProfile | null>(null)
  const [ nutritionistProfile, setNutritionistProfile ] = useState<NutritionistProfile | null>(null)
  const [ patientProfile, setPatientProfile ] = useState<PatientProfile | null>(null)
  const [ companyProfile, setCompanyProfile ] = useState<CompanyProfile | null>(null)
  const [ loading, setLoading ] = useState(true)
  const supabase = createSupabaseClient()
  const isClient = useIsClient()

  // Função para recarregar dados do usuário
  const refreshUserData = useCallback(async (user?: User) => {
    try {
      const currentUser = user ? user : await getCurrentUser()

      if (currentUser) {
        // Usar o currentUser como userProfile se não houver perfil específico
        setUserProfile(currentUser)
        setUser(currentUser)

        // Carregar perfis específicos baseado no tipo de usuário
        if (currentUser.user_type === 'nutricionista' || user?.user_metadata?.user_type === 'nutricionista') {
          try {
            const { data: nutritionist } = await supabase
            .from('nutritionist_profiles')
            .select('*')
            .eq('user_id', currentUser.id)
            .single()
            setNutritionistProfile(nutritionist)
          } catch (error) {
            console.warn('Perfil de nutricionista não encontrado:', error)
            setNutritionistProfile(null)
          }
        } else if (currentUser.user_type === 'paciente' || user?.user_metadata?.user_type === 'paciente') {
          try {
            const { data: patient } = await supabase
              .from('patient_profiles')
              .select('*')
              .eq('user_id', currentUser.id)
              .single()
            setPatientProfile(patient)
          } catch (error) {
            console.warn('Perfil de paciente não encontrado:', error)
            setPatientProfile(null)
          }
        } else if (currentUser.user_type === 'empresa' || user?.user_metadata?.user_type === 'empresa') {
          try {
            const { data: company } = await supabase
              .from('company_profiles')
              .select('*')
              .eq('user_id', currentUser.id)
              .single()
            setCompanyProfile(company)
          } catch (error) {
            console.warn('Perfil de empresa não encontrado:', error)
            setCompanyProfile(null)
          }
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
  }, [ supabase ])

  // Hook para sincronização entre abas
  const { broadcastAuthChange } = useAuthSync()

  const loadUser = useCallback(async () => {
    try {
      setLoading(true)
      await refreshUserData()
    } catch (error) {
      console.error('Erro ao carregar usuário:', error)
    } finally {
      setLoading(false)
    }
  }, [ refreshUserData ])

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
  }, [ supabase, broadcastAuthChange ])

  const refreshUser = useCallback(async (user?: User) => {
    await refreshUserData(user)
  }, [ refreshUserData ])

  const subscribedRef = useRef(false);
  const handledSignOutRef = useRef(false);

useEffect(() => {
  if (!isClient || subscribedRef.current) return;
  subscribedRef.current = true;

  loadUser?.();

  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      handledSignOutRef.current = false; // reset
      await refreshUserData?.();
    } else if (event === 'SIGNED_OUT') {
      if (handledSignOutRef.current) return; // dedupe do SIGNED_OUT
      handledSignOutRef.current = true;
      setUser(null);
      setUserProfile(null);
      setNutritionistProfile(null);
      setPatientProfile(null);
      setCompanyProfile(null);
      setLoading(false);
    }
  });

  return () => {
    subscribedRef.current = false;
    subscription.unsubscribe();
  };
}, [isClient, supabase]);

  const value = useMemo(
    () => ({
      user,
      userProfile,
      nutritionistProfile,
      patientProfile,
      companyProfile,
      loading,
      setUserProfile,
      setUser,
      signOut: handleSignOut,
      refreshUser,
    }),
    [ user, userProfile, nutritionistProfile, patientProfile, companyProfile, loading, handleSignOut, refreshUser ]
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
