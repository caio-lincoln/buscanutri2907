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
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        user_type,
        created_at,
        patient_profiles:patient_profiles!patient_profiles_user_id_fkey(full_name),
        nutritionist_profiles:nutritionist_profiles!nutritionist_profiles_user_id_fkey(id, full_name, is_verified),
        company_profiles:company_profiles!company_profiles_user_id_fkey(company_name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      // Silent error handling: Error fetching users
      return []
    }

    return users.map(user => ({
      id: user.id,
      name:
        user.patient_profiles?.full_name ||
        user.nutritionist_profiles?.full_name ||
        user.company_profiles?.company_name ||
        'Nome não disponível',
      email: user.email,
      type: user.user_type as 'paciente' | 'nutricionista' | 'empresa',
      status: 'ativo',
      createdAt: user.created_at,
      is_verified: user.nutritionist_profiles?.is_verified,
      nutritionist_profiles: user.nutritionist_profiles,
    }))
  } catch {
    // Silent error handling: Error in getAllUsers
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

    // Buscar contagem de consultas
    const { count: consultationsCount } = await supabase
      .from('consultations')
      .select('*', { count: 'exact', head: true })

    // Buscar contagem de posts do blog
    const { count: postsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })

    // Calcular receita total (exemplo - adaptar conforme necessário)
    const { data: appointments } = await supabase
      .from('consultations')
      .select('price')
      .eq('status', 'completed')

    const totalRevenue =
      appointments?.reduce((sum, apt) => sum + (apt.price || 0), 0) || 0

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
    const { data: appointments, error } = await supabase
      .from('consultations')
      .select(
        `
        id,
        price,
        status,
        start_time,
        patient_profiles(full_name),
        nutritionist_profiles(full_name)
      `
      )
      .not('price', 'is', null)
      .order('start_time', { ascending: false })
      .limit(50)

    if (error) {
      // Silent error handling: Error fetching transactions
      return []
    }

    return appointments.map(apt => ({
      id: apt.id,
      type: 'receita' as const,
      amount: apt.price || 0,
      description: `Consulta - ${apt.patient_profiles?.[ 0 ]?.full_name || 'Paciente'} com ${apt.nutritionist_profiles?.[ 0 ]?.full_name || 'Nutricionista'}`,
      date: apt.start_time,
      status:
        apt.status === 'completed'
          ? 'concluída'
          : apt.status === 'scheduled'
            ? 'pendente'
            : 'cancelada',
      userName: apt.patient_profiles?.[ 0 ]?.full_name || 'Usuário',
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
export async function getNutritionistDocuments(nutritionistProfileId: string): Promise<NutritionistDocument[]> {
  try {
    const { data: documents, error } = await supabase
    .from('nutritionist_documents')
    .select('id, nutritionist_id, document_type, title, file_url, file_name, storage_path, created_at')
      .eq('nutritionist_id', nutritionistProfileId)
      .order('created_at', { ascending: true })
      
      console.log("🚀 ~ getNutritionistDocuments ~ documents:", documents)
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
      public_url: map[ doc.storage_path ] ?? ''   // use isso no <img src> e no botão "Abrir"
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
export async function rejectNutritionist(): Promise<boolean> {
  try {
    // MVP: apenas log do motivo
    // TODO: Implementar envio de e-mail e registro de log
    // - Criar tabela verification_logs
    // - Enviar e-mail para o nutricionista

    return true
  } catch {
    // Silent error handling: Error in rejectNutritionist
    return false
  }
}
