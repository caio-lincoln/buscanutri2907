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
import { useRouter } from 'next/navigation'

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
type UserType = 'nutricionista' | 'paciente' | 'empresa'

const PROFILE_TABLE_BY_TYPE: Record<Exclude<UserType, 'admin'>, string> = {
  nutricionista: 'nutritionist_profiles',
  paciente: 'patient_profiles',
  empresa: 'company_profiles',
}

const NUTRI_PUBLIC_COLS = `
  id,user_id,full_name,crn,phone,bio,profile_image_url,verification_status,trust_seal,
  rating,total_reviews,consultation_price,online_consultation_available,created_at,updated_at,
  specialties,consultation_fee,experience_years,location,education,languages,home_visit,crn_number,
  birth_date,rg,cpf,rg_document_url,cpf_document_url,gender,crn_document_url,specialties_documents,
  academic_background,experience,curriculum_pdf_url,lattes_url,services_offered,service_locations,
  availability,price_range,certifications,website,instagram,linkedin,online_consultation,achievements,
  available_times,total_views,unique_views,last_view_at,is_verified,cancellation_policy,
  default_consultation_duration,identity_document_url,min_time_between_appointments,online_only_consultation,
  instagram_username,linkedin_username,facebook_username,youtube_channel,tiktok_username,website_url,
  service_consultation_price,service_followup_price,service_meal_plan_price,service_group_consultation,
  service_online_available,service_home_visit,monday_hours,tuesday_hours,wednesday_hours,thursday_hours,
  friday_hours,saturday_hours,sunday_hours,break_time,accepts_insurance,emergency_consultation,
  consultation_languages,payment_methods,max_patients_per_day,accepts_corporate_plans,
  in_person_consultation_price,online_consultation_price,in_person_followup_price,online_followup_price,
  pricing_strategy,in_person_pricing_type,online_pricing_type,in_person_combined_price,online_combined_price,
  cover_image_url,aceita_cupons,address,is_listed,verified_at
`.replace(/\s+/g, '')

const SELECT_BY_TYPE = {
  nutricionista: NUTRI_PUBLIC_COLS,
  paciente: '*',  // ajuste depois se precisar
  empresa: '*',   // idem
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ user, setUser ] = useState<User | null>(null)
  const [ userProfile, setUserProfile ] = useState<UserProfile | null>(null)
  const [ nutritionistProfile, setNutritionistProfile ] = useState<NutritionistProfile | null>(null)
  const [ patientProfile, setPatientProfile ] = useState<PatientProfile | null>(null)
  const [ companyProfile, setCompanyProfile ] = useState<CompanyProfile | null>(null)
  const [ loading, setLoading ] = useState(true)
  const supabase = useMemo(() => createSupabaseClient(), [])
  const isClient = useIsClient()
  const resetSubProfiles = useCallback(() => {
    setNutritionistProfile(null)
    setPatientProfile(null)
    setCompanyProfile(null)
  }, [])
  const router = useRouter()
  // const refreshUserData = useCallback(async (user?: User) => {
  //   try {
  //     const currentUser = supabase.auth.getUser()
  //     console.log("🚀 ~ AuthProvider ~ currentUser:", currentUser)

  //     if (currentUser) {
  //       setUserProfile(currentUser)
  //       setUser(currentUser)

  //       // Carregar perfis específicos baseado no tipo de usuário
  //       if (currentUser.user_type === 'nutricionista' || user?.user_metadata?.user_type === 'nutricionista') {
  //         try {
  //           const { data: nutritionist } = await supabase
  //           .from('nutritionist_profiles')
  //           .select('*')
  //           .eq('user_id', currentUser.id)
  //           .single()
  //           setNutritionistProfile(nutritionist)
  //         } catch (error) {
  //           console.warn('Perfil de nutricionista não encontrado:', error)
  //           setNutritionistProfile(null)
  //         }
  //       } else if (currentUser.user_type === 'paciente' || user?.user_metadata?.user_type === 'paciente') {
  //         try {
  //           const { data: patient } = await supabase
  //             .from('patient_profiles')
  //             .select('*')
  //             .eq('user_id', currentUser.id)
  //             .single()
  //           setPatientProfile(patient)
  //         } catch (error) {
  //           console.warn('Perfil de paciente não encontrado:', error)
  //           setPatientProfile(null)
  //         }
  //       } else if (currentUser.user_type === 'empresa' || user?.user_metadata?.user_type === 'empresa') {
  //         try {
  //           const { data: company } = await supabase
  //             .from('company_profiles')
  //             .select('*')
  //             .eq('user_id', currentUser.id)
  //             .single()
  //           setCompanyProfile(company)
  //         } catch (error) {
  //           console.warn('Perfil de empresa não encontrado:', error)
  //           setCompanyProfile(null)
  //         }
  //       }
  //     } else {
  //       setUserProfile(null)
  //       setNutritionistProfile(null)
  //       setPatientProfile(null)
  //       setCompanyProfile(null)
  //     }
  //   } catch (error) {
  //     console.error('Erro ao recarregar dados do usuário:', error)
  //     setUser(null)
  //     setUserProfile(null)
  //     setNutritionistProfile(null)
  //     setPatientProfile(null)
  //     setCompanyProfile(null)
  //   }
  // }, [ supabase ])

  const { broadcastAuthChange } = useAuthSync()

  const loadUser = useCallback(async () => {
    try {
      const sessionUser = await supabase.auth.getUser()

      if (!sessionUser.data?.user) {
        setUser(null)
        setUserProfile(null)
        resetSubProfiles()
        return
      }

      setUser(sessionUser.data.user)
      setUserProfile(sessionUser.data.user as User)
      const { data: row } = await supabase
      .from('users')
      .select('*')
      .eq('id', sessionUser.data.user.id)
      .maybeSingle()
      
      const utype = row?.user_type
      if (utype) {
        const table = PROFILE_TABLE_BY_TYPE[ utype as UserType ]
  
        if (table) {
          const { data: spec } = await supabase
            .from(table)
            .select(SELECT_BY_TYPE[utype as 'nutricionista'|'paciente'|'empresa'])
            .eq('user_id', row.id)
            .maybeSingle()
  
          if (utype === 'nutricionista') setNutritionistProfile(spec ?? null)
          if (utype === 'paciente') setPatientProfile(spec ?? null)
          if (utype === 'empresa') setCompanyProfile(spec ?? null)
        }
        
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error)
    } finally {
      setLoading(false)
    }
  }, [ supabase, resetSubProfiles ])

  const handleSignOut = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('admin_session')
      }
      broadcastAuthChange('SIGN_OUT')
      
      await supabase.auth.signOut()
      setUser(null)
      setUserProfile(null)
      setNutritionistProfile(null)
      setPatientProfile(null)
      setCompanyProfile(null)
      
      router.replace('/')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }, [ supabase, broadcastAuthChange ])

  const refreshUser = useCallback(async (user?: User) => {
    await loadUser()
  }, [ loadUser ])

  const subscribedRef = useRef(false);
  const handledSignOutRef = useRef(false);

  useEffect(() => {
    if (!isClient || subscribedRef.current) return;
    subscribedRef.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {

      if (event === 'SIGNED_IN') {
        setLoading(true)

        loadUser()
        handledSignOutRef.current = false; // reset
      } else if (event === 'SIGNED_OUT') {
        console.log("Antes")
        if (handledSignOutRef.current) return; // dedupe do SIGNED_OUT
        handledSignOutRef.current = true;
        console.log("Depois")
        setUser(null);
        setUserProfile(null);
        setNutritionistProfile(null);
        setPatientProfile(null);
        setCompanyProfile(null);
      }
    });

    return () => {
      subscribedRef.current = false;
      subscription.unsubscribe();
    };
  }, [ isClient, supabase ]);

  useEffect(() => {
    loadUser()
  }, [])

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
      refreshUser: async () => { refreshUser()},
    }),
    [ user, userProfile, nutritionistProfile, patientProfile, companyProfile, loading, handleSignOut, loadUser]
  )

  return (
    <AuthContext.Provider value={value} >
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
