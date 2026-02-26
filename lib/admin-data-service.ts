import { createSupabaseClient } from './supabase'
import type {
  UserData,
  TransactionData,
  ReportMetric,
  ReportData,
  ServiceStatus,
  NutritionistDocument
} from './types'

const supabase = createSupabaseClient()

// Re-exportar tipos para compatibilidade
export type {
  UserData,
  TransactionData,
  ReportMetric,
  ReportData,
  ServiceStatus,
  NutritionistDocument
}

// Funções para buscar dados reais

/**
 * Buscar todos os usuários do sistema
 */
export async function getAllUsers(): Promise<UserData[]> {
  // Preferir endpoint admin para status real quando disponível no cliente
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch('/api/admin/users', { cache: 'no-store' })
      if (response.ok) {
        const { data } = await response.json()
        return data as UserData[]
      }
    } catch {
      // Ignorar erro e fazer fallback
    }
  }

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        "ID",
        email,
        user_type,
        created_at,
        patient_profiles:patient_profiles!patient_profiles_user_id_fkey(full_name),
        nutritionist_profiles:nutritionist_profiles!nutritionist_profiles_user_id_fkey(id, full_name, is_verified, verification_status),
        company_profiles:company_profiles!company_profiles_user_id_fkey(company_name)
      `)
      .order('created_at', { ascending: false })

    if (error || !users) {
      return []
    }

    return users.map(user => {
      let displayName = 'Nome não disponível'
      const userType = user.user_type as 'paciente' | 'nutricionista' | 'empresa'

      if (userType === 'nutricionista') {
        displayName = user.nutritionist_profiles?.full_name || user.patient_profiles?.full_name || user.company_profiles?.company_name || 'Nome não disponível'
      } else if (userType === 'empresa') {
        displayName = user.company_profiles?.company_name || user.patient_profiles?.full_name || user.nutritionist_profiles?.full_name || 'Nome não disponível'
      } else {
        displayName = user.patient_profiles?.full_name || user.nutritionist_profiles?.full_name || user.company_profiles?.company_name || 'Nome não disponível'
      }

      let status: 'ativo' | 'inativo' | 'pendente' | 'banido' = 'ativo'
      if (userType === 'nutricionista') {
        const rawStatus = (user.nutritionist_profiles?.verification_status as string | undefined) || ''
        const normalized = rawStatus.toLowerCase()
        if (normalized === 'aprovado' || normalized === 'verificado') {
          status = 'ativo'
        } else if (normalized === 'reprovado' || normalized === 'rejected') {
          status = 'inativo'
        } else if (!user.nutritionist_profiles?.is_verified) {
          status = 'pendente'
        }
      }

      return {
        id: user.id,
        numericId: (user as any)?.ID,
        name: displayName,
        email: user.email,
        type: userType,
        status,
        createdAt: user.created_at,
        is_verified: user.nutritionist_profiles?.verification_status
          ? String(user.nutritionist_profiles.verification_status).toLowerCase() === 'aprovado'
          : user.nutritionist_profiles?.is_verified,
        nutritionist_profiles: user.nutritionist_profiles,
      }
    })
  } catch {
    return []
  }
}

/**
 * Buscar métricas de relatórios
 */
export async function getReportMetrics(): Promise<ReportMetric[]> {
  try {
    // Buscar contagem de usuários
    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Buscar contagem de consultas (Teleconsultas)
    // DOMAIN RULE: Usar teleconsulta_sessions
    const { count: consultationsCount } = await supabase
      .from('teleconsulta_sessions')
      .select('*', { count: 'exact', head: true })

    // Buscar contagem de posts do blog
    const { count: postsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })

    // Calcular receita total (exemplo - adaptar conforme necessário)
    // DOMAIN RULE: Usar teleconsulta_sessions
    const { data: appointments } = await supabase
      .from('teleconsulta_sessions')
      .select('price')
      .eq('status', 'completed')

    const totalRevenue =
      appointments?.reduce((sum, apt) => sum + (Number(apt.price) || 0), 0) || 0

    return [
      {
        id: '1',
        title: 'Total de Usuários',
        value: usersCount || 0,
        change: 12, // Calcular baseado em período anterior
        period: 'último mês',
        type: 'users',
      },
      {
        id: '2',
        title: 'Receita Total',
        value: totalRevenue,
        change: 8,
        period: 'último mês',
        type: 'revenue',
      },
      {
        id: '3',
        title: 'Consultas Realizadas',
        value: consultationsCount || 0,
        change: 15,
        period: 'último mês',
        type: 'consultations',
      },
      {
        id: '4',
        title: 'Posts Publicados',
        value: postsCount || 0,
        change: 5,
        period: 'último mês',
        type: 'posts',
      },
    ]
  } catch {
    // Silent error handling: Error in getReportMetrics
    return []
  }
}

/**
 * Buscar transações financeiras
 */
export async function getTransactions(): Promise<TransactionData[]> {
  try {
    // Buscar consultas como transações de receita
    // DOMAIN RULE: Usar teleconsulta_sessions
    const { data: appointments, error } = await supabase
      .from('teleconsulta_sessions')
      .select(
        `
        id,
        price,
        status,
        scheduled_at,
        patient:patient_profiles(full_name),
        nutritionist:nutritionist_profiles(full_name)
      `
      )
      .not('price', 'is', null)
      .order('scheduled_at', { ascending: false })
      .limit(50)

    if (error) {
      // Silent error handling: Error fetching transactions
      return []
    }
    
    // Mapear para o formato TransactionData
    return appointments.map((apt: any) => ({
      id: apt.id,
      type: 'receita' as const,
      amount: Number(apt.price) || 0,
      description: `Consulta - ${apt.patient?.full_name || 'Paciente'} com ${apt.nutritionist?.full_name || 'Nutricionista'}`,
      date: apt.scheduled_at,
      status:
        apt.status === 'completed'
          ? 'concluída'
          : ['scheduled', 'in_progress', 'pending_payment'].includes(apt.status)
            ? 'pendente'
            : 'cancelada',
      userName: apt.patient?.full_name || 'Usuário',
    }))
  } catch {
    // Silent error handling: Error in getTransactions
    return []
  }
}

/**
 * Buscar status dos serviços do sistema
 */
export async function getSystemServices(): Promise<ServiceStatus[]> {
  try {
    // Para serviços do sistema, podemos verificar a conectividade com diferentes partes
    const services: ServiceStatus[] = [
      {
        id: '1',
        name: 'Banco de Dados',
        status: 'online',
        uptime: 99.9,
        lastCheck: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Autenticação',
        status: 'online',
        uptime: 99.8,
        lastCheck: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Notificações',
        status: 'online',
        uptime: 98.5,
        lastCheck: new Date().toISOString(),
      },
      {
        id: '4',
        name: 'Upload de Arquivos',
        status: 'online',
        uptime: 99.2,
        lastCheck: new Date().toISOString(),
      },
    ]

    // Testar conectividade com o banco
    try {
      await supabase.from('users').select('id').limit(1)
    } catch {
      if (services[ 0 ]) {
        services[ 0 ].status = 'offline'
        services[ 0 ].uptime = 0
      }
    }

    return services
  } catch {
    // Silent error handling: Error in getSystemServices
    return []
  }
}

/**
 * Buscar relatórios de moderação
 */
export async function getModerationReports(): Promise<ReportData[]> {
  try {
    // Por enquanto, retornar array vazio já que não temos tabela de reports ainda
    // Quando implementar, buscar da tabela de reports
    return []
  } catch {
    // Silent error handling: Error in getModerationReports
    return []
  }
}

/**
 * Buscar documentos de um nutricionista
 */
export async function getNutritionistDocuments(userId: string): Promise<NutritionistDocument[]> {
  try {
    const { data: documents, error } = await supabase
    .from('nutritionist_documents')
    .select('id, nutritionist_id, document_type, title, file_url, file_name, storage_path, file_size, mime_type, is_verified, verification_notes, created_at')
      .eq('nutritionist_id', userId)
      .order('created_at', { ascending: true })
      
    if (error || !documents?.length) return []

    const paths = documents.map(d => d.storage_path)
    const res = await fetch('/api/admin/storage/signed-urls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucket: 'nutritionist-documents', paths, expiresIn: 60 * 5 })
    })
    const j = await res.json().catch(() => ({}))
    const map: Record<string, string> = j?.results ?? {}

    // return documents.map(doc => {
    //   // const response  = supabase.storage.from('nutritionist-documents').createSignedUrl(doc.storage_path, 60 * 5)
    //   return {
    //     ...doc,
    //     public_url: doc?.file_url ?? ''
    //   }
    // })
    return documents.map(doc => ({
      ...doc,
      public_url: map[ doc.storage_path ] ?? ''
    }))
  } catch {
    return []
  }
}

// export async function getNutritionistDocuments(nutritionistProfileId: string): Promise<NutritionistDocument[]> {
//   try {
//     const { data: documents, error } = await supabase
//       .from('nutritionist_documents')
//       .select('*')
//       .eq('nutritionist_id', nutritionistProfileId)
//       .order('created_at', { ascending: true })

//     if (error) {
//       // Silent error handling: Error fetching nutritionist documents
//       return []
//     }

//     // Transformar file_name em public_url
//     return documents.map(doc => {
//       // const { data } = supabase.storage.from('nutritionist_documents').getPublicUrl(doc.file_name)
//       return {
//         ...doc,
//         public_url: doc?.file_url ?? ''
//       }
//     })
//   } catch {
//     // Silent error handling: Error in getNutritionistDocuments
//     return []
//   }
// }

/**
 * Aprovar nutricionista
 */
export async function approveNutritionist(nutritionistProfileId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/nutritionists/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nutritionistProfileId }),
    })
    if (!res.ok) return false
    const j = await res.json()
    return !!j?.ok
  } catch {
    return false
  }
}

/**
 * Rejeitar nutricionista
 */
export async function rejectNutritionist(
  nutritionistProfileId: string,
  reason: string
): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await fetch('/api/admin/nutritionists/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nutritionistProfileId, reason }),
    })

    const text = await res.text()
    let json: any = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = null
    }

    if (!res.ok || !json?.ok) {
      const message =
        typeof json?.message === 'string'
          ? json.message
          : json?.error?.message || 'Falha ao rejeitar nutricionista'
      console.error('Erro ao rejeitar nutricionista:', {
        status: res.status,
        body: json,
      })
      return { ok: false, message }
    }

    return { ok: true, message: typeof json?.message === 'string' ? json.message : undefined }
  } catch (err) {
    console.error('Erro em rejectNutritionist:', err)
    return { ok: false, message: 'Erro inesperado ao rejeitar nutricionista' }
  }
}

/**
 * Desverificar nutricionista (voltar para pendente)
 */
export async function unverifyNutritionist(nutritionistProfileId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/nutritionists/unverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nutritionistProfileId }),
    })
    if (!res.ok) return false
    const j = await res.json()
    return !!j?.ok
  } catch {
    return false
  }
}

/**
 * Buscar detalhes completos do nutricionista para verificação
 */
export async function getNutritionistDetails(nutritionistProfileId: string, userId?: string) {
  try {
    const { data, error } = await supabase
      .from('nutritionist_profiles')
      .select(`
        id,
        user_id,
        full_name,
        crn,
        phone,
        specialties,
        location,
        academic_background,
        crn_document_url,
        identity_document_url
      `)
      .eq('id', nutritionistProfileId)
      .single()

    if (error) return null

    // Se tiver userId, buscar endereço principal e especialidades
    // Nota: As tabelas relacionais usam o ID do perfil de nutricionista, não o ID do usuário
    if (nutritionistProfileId) {
      // Buscar endereço principal
      const { data: addressData } = await supabase
        .from('nutritionist_addresses')
        .select('*')
        .eq('nutritionist_id', nutritionistProfileId)
        .eq('is_main', true)
        .single()
      
      if (addressData) {
        // Formatar endereço completo
        const fullAddress = [
          addressData.street,
          addressData.number,
          addressData.neighborhood,
          addressData.city,
          addressData.state
        ].filter(Boolean).join(', ')
        
        if (fullAddress) {
          data.location = fullAddress
        }
      }

      // Buscar especialidades da tabela relacional
      const { data: specialtiesData } = await supabase
        .from('nutritionist_specialties')
        .select('specialties(name)')
        .eq('nutritionist_id', nutritionistProfileId)
      
      if (specialtiesData && specialtiesData.length > 0) {
        data.specialties = specialtiesData.map((s: any) => s.specialties?.name).filter(Boolean)
      } else {
        // Fallback: tentar buscar do campo JSON se a tabela relacional estiver vazia
        // e converter para array se for string
        if (typeof data.specialties === 'string') {
          try {
            data.specialties = JSON.parse(data.specialties)
          } catch {
            data.specialties = [data.specialties]
          }
        } else if (!data.specialties) {
          data.specialties = []
        }
      }
    }

    return data
  } catch {
    return null
  }
}
