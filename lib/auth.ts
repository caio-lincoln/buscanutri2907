import { createSupabaseClient, type UserType } from "./supabase"

// Usar o novo cliente para autenticação
const supabase = createSupabaseClient()

export async function signUp(email: string, password: string, userType: UserType, additionalData: any) {
  try {
    console.log("🚀 Iniciando cadastro com auto-confirmação:", { email, userType })

    // 1. Verificar se o usuário já existe
    const { data: existingUser } = await supabase.from("users").select("email").eq("email", email).single()

    if (existingUser) {
      throw new Error("Este email já está cadastrado")
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
      console.error("❌ Erro no auth.signUp:", authError)
      throw new Error(authError.message)
    }

    if (!authData.user) {
      throw new Error("Usuário não foi criado no sistema de autenticação")
    }

    console.log("✅ Usuário criado e auto-confirmado:", authData.user.id)

    // 3. Aguardar um pouco para o trigger processar
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // 4. Fazer login automático (agora deve funcionar pois o usuário está confirmado)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      console.error("❌ Erro no login automático:", signInError)
      // Se o login falhar, pode ser que o usuário ainda não esteja confirmado
      // Vamos tentar confirmar manualmente
      console.log("🔄 Tentando confirmar usuário manualmente...")

      const { error: confirmError } = await supabase.auth.admin.updateUserById(authData.user.id, {
        email_confirm: true,
      })

      if (confirmError) {
        console.error("❌ Erro ao confirmar manualmente:", confirmError)
      }

      // Tentar login novamente
      const { data: retrySignIn, error: retryError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (retryError) {
        throw new Error("Erro ao fazer login automático: " + retryError.message)
      }

      console.log("✅ Login automático realizado após confirmação manual")
    } else {
      console.log("✅ Login automático realizado com sucesso")
    }

    // 5. Criar registro na tabela users
    const { data: userData, error: userError } = await supabase
      .from("users")
      .upsert({
        id: authData.user.id,
        email: authData.user.email,
        user_type: userType,
      })
      .select()
      .single()

    if (userError) {
      console.error("⚠️ Erro ao criar registro de usuário:", userError)
    } else {
      console.log("✅ Registro de usuário criado na tabela users")
    }

    // 6. Criar perfil específico baseado no tipo de usuário
    try {
      if (userType === "nutricionista") {
        const { data: profileData, error: profileError } = await supabase
          .from("nutritionist_profiles")
          .insert({
            user_id: authData.user.id,
            full_name: additionalData.full_name,
            crn: additionalData.crn,
            phone: additionalData.phone || null,
            accepts_corporate_plans: additionalData.accepts_corporate_plans || false,
            in_person_pricing_type: additionalData.in_person_pricing_type || null,
            online_pricing_type: additionalData.online_pricing_type || null,
            in_person_combined_price: additionalData.in_person_combined_price || null,
            online_combined_price: additionalData.online_combined_price || null,
            in_person_consultation_price: additionalData.in_person_consultation_price || null,
            in_person_followup_price: additionalData.in_person_followup_price || null,
            online_consultation_price: additionalData.online_consultation_price || null,
            online_followup_price: additionalData.online_followup_price || null,
          })
          .select()
          .single()

        if (profileError) {
          console.error("⚠️ Erro ao criar perfil nutricionista:", profileError)
        } else {
          console.log("✅ Perfil nutricionista criado:", profileData)
        }
      } else if (userType === "paciente") {
        const { data: profileData, error: profileError } = await supabase
          .from("patient_profiles")
          .insert({
            user_id: authData.user.id,
            full_name: additionalData.full_name,
            birth_date: additionalData.birth_date || null,
            phone: additionalData.phone || null,
          })
          .select()
          .single()

        if (profileError) {
          console.error("⚠️ Erro ao criar perfil paciente:", profileError)
        } else {
          console.log("✅ Perfil paciente criado:", profileData)
        }
      } else if (userType === "empresa") {
        const { data: profileData, error: profileError } = await supabase
          .from("company_profiles")
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

        if (profileError) {
          console.error("⚠️ Erro ao criar perfil empresa:", profileError)
        } else {
          console.log("✅ Perfil empresa criado:", profileData)
        }
      }
    } catch (profileError) {
      console.error("⚠️ Erro geral ao criar perfil:", profileError)
    }

    console.log("🎉 Cadastro com auto-confirmação concluído com sucesso!")
    return { data: authData, error: null }
  } catch (error: any) {
    console.error("💥 Erro geral no cadastro:", error)
    return { data: null, error: error.message || "Erro desconhecido no cadastro" }
  }
}

export async function signIn(email: string, password: string) {
  try {
    console.log("🔑 Tentando fazer login:", email)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("❌ Erro no login:", error)
      throw error
    }

    if (!data.user) {
      throw new Error("Usuário não encontrado")
    }

    console.log("✅ Login realizado com sucesso:", data.user.id)

    // Aguardar um pouco para garantir que a sessão seja estabelecida
    await new Promise((resolve) => setTimeout(resolve, 500))

    return { data, error: null }
  } catch (error: any) {
    console.error("💥 Erro geral no login:", error)
    return { data: null, error: error.message }
  }
}

export async function signOut() {
  try {
    console.log("🚪 Fazendo logout...")

    // Limpar localStorage se existir
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin_session")
    }

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("❌ Erro no logout:", error)
      throw error
    }

    console.log("✅ Logout realizado com sucesso")
    return { error: null }
  } catch (error: any) {
    console.error("💥 Erro geral no logout:", error)
    return { error: error.message }
  }
}

export async function isAdmin(email: string): Promise<boolean> {
  return email === "iris@buscanutri.com"
}

export async function signInAdmin(email: string, password: string) {
  if (email === "iris@buscanutri.com" && password === "iris123456") {
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_session", "iris@buscanutri.com")
    }
    console.log("✅ Login admin realizado")
    return {
      data: {
        user: {
          id: "admin-001",
          email: "iris@buscanutri.com",
          user_type: "admin" as UserType,
        },
      },
      error: null,
    }
  }

  return signIn(email, password)
}

export async function getCurrentUser() {
  try {
    // Verificar se é admin primeiro
    if (typeof window !== "undefined") {
      const adminSession = localStorage.getItem("admin_session")
      if (adminSession === "iris@buscanutri.com") {
        return {
          id: "admin-001",
          email: "iris@buscanutri.com",
          user_type: "admin" as UserType,
        }
      }
    }

    // Verificar se há uma sessão ativa primeiro
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("❌ Erro ao obter sessão:", sessionError)
      return null
    }

    if (!session) {
      console.log("ℹ️ Nenhuma sessão ativa")
      return null
    }

    // Obter usuário atual do Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("❌ Erro ao obter usuário:", authError)
      // Se o erro for de sessão ausente, retornar null silenciosamente
      if (authError.message?.includes('session') || authError.message?.includes('Auth')) {
        return null
      }
      return null
    }

    if (!user) {
      console.log("ℹ️ Nenhum usuário logado")
      return null
    }

    console.log("✅ Usuário encontrado:", user.id)

    // Buscar dados do usuário na tabela users
    const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (userError) {
      console.error("⚠️ Erro ao buscar dados do usuário:", userError)
      // Se não encontrar na tabela users, tentar obter do user_metadata
      const userType = user.user_metadata?.user_type || user.app_metadata?.user_type || "paciente"
      console.log("📋 Usando user_type dos metadados:", userType)
      return {
        id: user.id,
        email: user.email,
        user_type: userType as UserType,
      }
    }

    console.log("✅ Dados do usuário carregados:", userData)
    // Garantir que user_type sempre tenha um valor
    if (!userData.user_type) {
      userData.user_type = "paciente"
      console.log("⚠️ user_type estava undefined, definindo como paciente")
    }
    return userData
  } catch (error: any) {
    console.error("💥 Erro geral ao obter usuário atual:", error)
    // Se for erro de sessão, não logar como erro crítico
    if (error.message?.includes('AuthSessionMissingError') || error.message?.includes('session')) {
      console.log("ℹ️ Sessão não encontrada - usuário não logado")
      return null
    }
    return null
  }
}

export async function getUserProfile(userId: string, userType: UserType) {
  let tableName = ""

  switch (userType) {
    case "nutricionista":
      tableName = "nutritionist_profiles"
      break
    case "paciente":
      tableName = "patient_profiles"
      break
    case "empresa":
      tableName = "company_profiles"
      break
    default:
      return { data: null, error: "Tipo de usuário inválido" }
  }

  const { data, error } = await supabase.from(tableName).select("*").eq("user_id", userId).single()

  if (error) {
    console.error(`Erro ao buscar perfil de ${userType}:`, error)
    throw error
  }

  // Processar dados para garantir tipos corretos, especialmente para nutricionistas
  let processedData: any = data // Usar "any" temporariamente para flexibilidade no processamento

  if (userType === "nutricionista") {
    const nutritionistProfile = processedData as any // Cast para any para acessar propriedades dinamicamente

    // Função helper para processar campos que podem estar com escape duplo
    const processField = (field: any): string[] => {
      if (!field) return []
      
      if (Array.isArray(field)) {
        return field.map(item => typeof item === "string" ? item.replace(/\\"/g, '"') : item)
      }
      
      if (typeof field === "string") {
        // Remover escapes duplos se existirem
        const cleanField = field.replace(/\\"/g, '"')
        
        // Tentar fazer parse JSON primeiro
        try {
          const parsed = JSON.parse(cleanField)
          if (Array.isArray(parsed)) {
            return parsed
          }
        } catch {
          // Se não for JSON válido, tratar como string separada por vírgulas
        }
        
        return cleanField
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      }
      
      return []
    }

    // Campos que podem vir como string separada por vírgulas e devem ser arrays
    nutritionistProfile.specialties = processField(nutritionistProfile.specialties)
    nutritionistProfile.languages = processField(nutritionistProfile.languages)
    nutritionistProfile.certifications = processField(nutritionistProfile.certifications)
    nutritionistProfile.achievements = processField(nutritionistProfile.achievements)

    // Campos JSON removidos - agora usando campos individuais
    // Os campos services, testimonials, working_hours e social_media foram
    // convertidos para campos individuais para evitar erros de parsing JSON
    processedData = nutritionistProfile
  }

  return { data: processedData, error: null }
}

