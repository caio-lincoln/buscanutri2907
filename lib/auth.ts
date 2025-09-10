import { createSupabaseClient, type UserType } from './supabase'
import {
  normalizeStringArray,
  normalizeSpecialties,
  normalizeLanguages,
  logNormalizationEvent,
} from './structured-data-utils'

// Usar o novo cliente para autenticação
const supabase = createSupabaseClient()

export async function signUp(
  email: string,
  password: string,
  userType: UserType,
  additionalData: any
) {
  try {
    // Silent logging: Starting signup with auto-confirmation

    // 1. Verificar se o usuário já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single()

    if (existingUser) {
      throw new Error('Este email já está cadastrado')
    }

    // 2. Cadastrar usuário no Supabase Auth (será auto-confirmado pelo trigger)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_type: userType,
          auto_confirm: true, // Indicador para auto-confirmação
        },
      },
    })
    
    if (authError) {
      // Silent error handling: Error in auth.signUp
      throw new Error(authError.message)
    }

    if (!authData.user) {
      throw new Error('Usuário não foi criado no sistema de autenticação')
    }

    // Silent logging: User created and auto-confirmed

    // 3. Aguardar um pouco para o trigger processar
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 4. Fazer login automático (agora deve funcionar pois o usuário está confirmado)
    const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (signInError) {
      console.log("🚀 ~ signUp ~ signInError:", signInError)
      // Silent error handling: Error in automatic login
      // Se o login falhar, pode ser que o usuário ainda não esteja confirmado
      // Vamos tentar confirmar manualmente
      // Silent logging: Trying to confirm user manually

      const { error: confirmError } = await supabase.auth.admin.updateUserById(
        authData.user.id,
        {
          email_confirm: true,
        }
      )

      if (confirmError) {
        // Silent error handling: Error confirming manually
      }

      // Tentar login novamente
      const { data: retrySignIn, error: retryError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        })

      if (retryError) {
        throw new Error('Erro ao fazer login automático: ' + retryError.message)
      }

      // Silent logging: Automatic login performed after manual confirmation
    } else {
      // Silent logging: Automatic login performed successfully
    }

    // 5. Criar registro na tabela users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
        email: authData.user.email,
        user_type: userType,
      })
      .select()
      .single()

      if (userError) {
      console.log("🚀 ~ signUp ~ userError:", userError)
      // Silent error handling: Error creating user record
    } else {
      // Silent logging: User record created in users table
    }

    // 6. Criar perfil específico baseado no tipo de usuário
    let outProfileData: any = ''
    try {
      if (userType === 'nutricionista') {
        const { data: profileData, error: profileError } = await supabase
          .from('nutritionist_profiles')
          .insert({
            user_id: authData.user.id,
            full_name: additionalData.full_name,
            crn: additionalData.crn,
            phone: additionalData.phone || null,
            accepts_corporate_plans:
              additionalData.accepts_corporate_plans || false,
            in_person_pricing_type:
              additionalData.in_person_pricing_type || null,
            online_pricing_type: additionalData.online_pricing_type || null,
            in_person_combined_price:
              additionalData.in_person_combined_price || null,
            online_combined_price: additionalData.online_combined_price || null,
            in_person_consultation_price:
              additionalData.in_person_consultation_price || null,
            in_person_followup_price:
              additionalData.in_person_followup_price || null,
            online_consultation_price:
              additionalData.online_consultation_price || null,
            online_followup_price: additionalData.online_followup_price || null,
            aceita_cupons: additionalData.aceita_cupons || false,
          })
          .select()
          .single()
          outProfileData = profileData
        if (profileError) {
            
          // Silent error handling: Error creating nutritionist profile
        } else {
          // Silent logging: Nutritionist profile created
        }
      } else if (userType === 'paciente') {
        const { data: profileData, error: profileError } = await supabase
          .from('patient_profiles')
          .insert({
            user_id: authData.user.id,
            full_name: additionalData.full_name,
            birth_date: additionalData.birth_date || null,
            phone: additionalData.phone || null,
          })
          .select()
          .single()
          outProfileData = profileData
        if (profileError) {
          // Silent error handling: Error creating patient profile
        } else {
          // Silent logging: Patient profile created
        }
      } else if (userType === 'empresa') {
        const { data: profileData, error: profileError } = await supabase
          .from('company_profiles')
          .insert({
            user_id: authData.user.id,
            company_name: additionalData.company_name,
            cnpj: additionalData.cnpj,
            responsible_name: additionalData.responsible_name,
            responsible_position: additionalData.responsible_position || null,
            phone: additionalData.phone || null,
          })
          .select()
          .single()
        
          outProfileData = profileData
        if (profileError) {
          // Silent error handling: Error creating company profile
        } else {
          // Silent logging: Company profile created
        }
      }
    } catch (profileError) {
      console.log("🚀 ~ signUp ~ profileError:", profileError)
      // Silent error handling: General error creating profile
    }

    // Silent logging: Signup with auto-confirmation completed successfully
    return { data: authData, profileData: outProfileData, error: null }
  } catch (error: any) {
    // Silent error handling: General signup error
    return {
      data: null,
      error: error.message || 'Erro desconhecido no cadastro',
    }
  }
}

export async function signIn(email: string, password: string) {
  try {
    // Silent logging: Attempting login

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Silent error handling: Login error
      // Silent error handling: Error fetching user profile
      throw error
    }

    if (!data.user) {
      throw new Error('Usuário não encontrado')
    }

    // Silent logging: Login successful

    // Aguardar um pouco para garantir que a sessão seja estabelecida
    await new Promise(resolve => setTimeout(resolve, 500))

    return { data, error: null }
  } catch (error: any) {
    // Silent error handling: General login error
    return { data: null, error: error.message }
  }
}

export async function signOut() {
  try {
    // Silent logging: Performing logout

    // Limpar sessionStorage se existir (verificação segura para SSR)
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        sessionStorage.removeItem('admin_session')
      } catch (error) {
        // Ignorar erros de sessionStorage em modo privado/incógnito
        console.warn('Erro ao limpar sessionStorage:', error)
      }
    }

    const { error } = await supabase.auth.signOut()

    if (error) {
      // Silent error handling: Logout error
      throw error
    }

    // Silent logging: Logout successful
    return { error: null }
  } catch (error: any) {
    // Silent error handling: General logout error
    return { error: error.message }
  }
}

export async function isAdmin(email: string): Promise<boolean> {
  return email === 'iris@buscanutri.com'
}

export async function signInAdmin(email: string, password: string) {
  if (email === 'iris@buscanutri.com' && password === 'iris123456') {
    // Verificação segura para SSR
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        sessionStorage.setItem('admin_session', 'iris@buscanutri.com')
      } catch (error) {
        // Ignorar erros de sessionStorage em modo privado/incógnito
        console.warn('Erro ao salvar no sessionStorage:', error)
      }
    }
    // Silent logging: Admin login performed
    return {
      data: {
        user: {
          id: 'admin-001',
          email: 'iris@buscanutri.com',
          user_type: 'admin' as UserType,
          user_metadata: {
            user_type: 'admin' as UserType,
          },
        },
      },
      error: null,
    }
  }

  return signIn(email, password)
}

export async function getCurrentUser() {
  try {
    // Verificar se é admin primeiro (verificação segura para SSR)
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const adminSession = sessionStorage.getItem('admin_session')
        if (adminSession === 'iris@buscanutri.com') {
          return {
            id: 'admin-001',
            email: 'iris@buscanutri.com',
            user_type: 'admin' as UserType,
          }
        }
      } catch (error) {
        // Ignorar erros de sessionStorage em modo privado/incógnito
        console.warn('Erro ao acessar sessionStorage:', error)
      }
    }

    // Obter usuário atual do Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      // Silent error handling: Error getting user
      // Se o erro for de sessão ausente, retornar null silenciosamente
      if (
        authError.message?.includes('session') ||
        authError.message?.includes('Auth')
      ) {
        return null
      }
      return null
    }

    if (!user) {
      // Silent logging: No user logged in
      return null
    }

    // Silent logging: User found

    // Buscar dados do usuário na tabela users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (userError) {
      // Silent error handling: Error fetching user data
      // Se não encontrar na tabela users, tentar obter do user_metadata
      const userType =
        user.user_metadata?.user_type ||
        user.app_metadata?.user_type ||
        'paciente'
      // Silent logging: Using user_type from metadata
      return {
        id: user.id,
        email: user.email,
        user_type: userType as UserType,
      }
    }

    // Silent logging: User data loaded
    // Garantir que user_type sempre tenha um valor
    if (!userData.user_type) {
      userData.user_type = 'paciente'
      // Silent logging: user_type was undefined, setting as patient
    }
    return userData
  } catch (error: any) {
    // Silent error handling: General error getting current user
    // Se for erro de sessão, não logar como erro crítico
    if (
      error.message?.includes('AuthSessionMissingError') ||
      error.message?.includes('session')
    ) {
      // Silent logging: Session not found - user not logged in
      return null
    }
    return null
  }
}

export async function getUserProfile(userId: string, userType?: UserType) {
  // Se userType não foi fornecido, buscar na tabela users
  let resolvedUserType = userType
  if (!resolvedUserType) {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', userId)
      .single()
    
    if (userError || !userData) {
      return { data: null, error: 'Usuário não encontrado' }
    }
    
    resolvedUserType = userData.user_type as UserType
  }

  let tableName = ''

  switch (resolvedUserType) {
    case 'nutricionista':
      tableName = 'nutritionist_profiles'
      break
    case 'paciente':
      tableName = 'patient_profiles'
      break
    case 'empresa':
      tableName = 'company_profiles'
      break
    case 'admin':
      // Admin não tem perfil específico
      return { data: null, error: null }
    default:
      return { data: null, error: 'Tipo de usuário inválido' }
  }

  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    // Silent error handling: Error fetching user profile
    throw error
  }

  // Processar dados para garantir tipos corretos, especialmente para nutricionistas
  let processedData: any = data // Usar "any" temporariamente para flexibilidade no processamento

  if (resolvedUserType === 'nutricionista') {
    const nutritionistProfile = processedData as any // Cast para any para acessar propriedades dinamicamente

    // Função helper para processar campos que podem estar com escape duplo
    const processField = (field: any, fieldName?: string): string[] => {
      let result

      // Usar normalizadores específicos quando disponível
      if (fieldName === 'languages') {
        result = normalizeLanguages(field)
      } else if (fieldName === 'specialties') {
        result = normalizeSpecialties(field)
      } else {
        result = normalizeStringArray(field)
      }

      // Log eventos de normalização para telemetria
      if (result.wasCorrupted) {
        logNormalizationEvent(
          fieldName || 'unknown_field',
          result.originalValue,
          result.data,
          result.wasCorrupted
        )
      }

      return result.data
    }

    // Campos que podem vir como string separada por vírgulas e devem ser arrays
    nutritionistProfile.specialties = processField(
      nutritionistProfile.specialties,
      'specialties'
    )
    nutritionistProfile.languages = processField(
      nutritionistProfile.languages,
      'languages'
    )
    nutritionistProfile.certifications = processField(
      nutritionistProfile.certifications,
      'certifications'
    )
    nutritionistProfile.achievements = processField(
      nutritionistProfile.achievements,
      'achievements'
    )

    // Campos JSON removidos - agora usando campos individuais
    // Os campos services, testimonials, working_hours e social_media foram
    // convertidos para campos individuais para evitar erros de parsing JSON
    processedData = nutritionistProfile
  }

  return { data: processedData, error: null }
}
