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
import type { User } from '@supabase/supabase-js'

interface ExtendedUser extends User {
  user_type?: string
  companyProfile?: any
  nutritionistProfile?: any
  patientProfile?: any
}

interface AuthContextType {
  user: ExtendedUser | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null)
  const [loading, setLoading] = useState(true)
  const isClient = useIsClient()
  const supabase = useMemo(() => createSupabaseClient(), [])

  const loadUser = useCallback(async () => {
    try {
      setLoading(true)
      const currentUser = await getCurrentUser()

      if (currentUser) {
        const extendedUser: ExtendedUser = currentUser

        // Carregar perfil específico baseado no tipo de usuário
        if (currentUser.user_type === 'empresa') {
          try {
            const { data: companyProfile } = await getUserProfile(
              currentUser.id,
              'empresa'
            )
            extendedUser.companyProfile = companyProfile
          } catch (error) {
            console.error('Erro ao carregar perfil da empresa:', error)
          }
        } else if (currentUser.user_type === 'nutricionista') {
          try {
            const { data: nutritionistProfile } = await getUserProfile(
              currentUser.id,
              'nutricionista'
            )
            extendedUser.nutritionistProfile = nutritionistProfile
          } catch (error) {
            console.error('Erro ao carregar perfil do nutricionista:', error)
          }
        } else if (currentUser.user_type === 'paciente') {
          try {
            const { data: patientProfile } = await getUserProfile(
              currentUser.id,
              'paciente'
            )
            extendedUser.patientProfile = patientProfile
          } catch (error) {
            console.error('Erro ao carregar perfil do paciente:', error)
          }
        }

        setUser(extendedUser)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSignOut = useCallback(async () => {
    try {
      // Limpar localStorage se existir
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_session')
      }

      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('❌ Erro no logout:', error)
        throw error
      }

      setUser(null)
      console.log('✅ Logout realizado com sucesso')
    } catch (error: any) {
      console.error('💥 Erro geral no logout:', error)
      throw error
    }
  }, [supabase])

  const refreshUser = useCallback(async () => {
    await loadUser()
  }, [loadUser])

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
        await loadUser()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [isClient, loadUser, supabase])

  const value = useMemo(
    () => ({
      user,
      loading,
      signOut: handleSignOut,
      refreshUser,
    }),
    [user, loading, handleSignOut, refreshUser]
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
