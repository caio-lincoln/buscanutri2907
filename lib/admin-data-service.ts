import { createSupabaseClient } from "./supabase"

const supabase = createSupabaseClient()

// Tipos para dados administrativos
export interface UserData {
  id: string
  name: string
  email: string
  type: "paciente" | "nutricionista" | "empresa"
  status: "ativo" | "inativo" | "pendente"
  createdAt: string
  lastLogin?: string
}

export interface TransactionData {
  id: string
  type: "receita" | "despesa"
  amount: number
  description: string
  date: string
  status: "concluída" | "pendente" | "cancelada"
  userId?: string
  userName?: string
}

export interface ReportMetric {
  id: string
  title: string
  value: number
  change: number
  period: string
  type: "users" | "revenue" | "consultations" | "posts"
}

export interface ReportData {
  id: string
  type: "spam" | "conteudo_inadequado" | "perfil_falso" | "outros"
  reportedItem: string
  reportedBy: string
  reason: string
  status: "pendente" | "resolvido" | "rejeitado"
  createdAt: string
}

export interface ServiceStatus {
  id: string
  name: string
  status: "online" | "offline" | "manutencao"
  uptime: number
  lastCheck: string
}

// Funções para buscar dados reais

/**
 * Buscar todos os usuários do sistema
 */
export async function getAllUsers(): Promise<UserData[]> {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select(`
        id,
        email,
        user_type,
        created_at,
        last_sign_in_at,
        patient_profiles(full_name),
        nutritionist_profiles(full_name),
        company_profiles(company_name)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching users:", error)
      return []
    }

    return users.map(user => ({
      id: user.id,
      name: user.patient_profiles?.[0]?.full_name || 
            user.nutritionist_profiles?.[0]?.full_name || 
            user.company_profiles?.[0]?.company_name || 
            "Nome não disponível",
      email: user.email,
      type: user.user_type as "paciente" | "nutricionista" | "empresa",
      status: "ativo", // Pode ser determinado por lógica de negócio
      createdAt: user.created_at,
      lastLogin: user.last_sign_in_at
    }))
  } catch (error) {
    console.error("Error in getAllUsers:", error)
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
      .from("users")
      .select("*", { count: "exact", head: true })

    // Buscar contagem de consultas
    const { count: consultationsCount } = await supabase
      .from("consultations")
      .select("*", { count: "exact", head: true })

    // Buscar contagem de posts do blog
    const { count: postsCount } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })

    // Calcular receita total (exemplo - adaptar conforme necessário)
    const { data: appointments } = await supabase
      .from("consultations")
      .select("price")
      .eq("status", "completed")

    const totalRevenue = appointments?.reduce((sum, apt) => sum + (apt.price || 0), 0) || 0

    return [
      {
        id: "1",
        title: "Total de Usuários",
        value: usersCount || 0,
        change: 12, // Calcular baseado em período anterior
        period: "último mês",
        type: "users"
      },
      {
        id: "2",
        title: "Receita Total",
        value: totalRevenue,
        change: 8,
        period: "último mês",
        type: "revenue"
      },
      {
        id: "3",
        title: "Consultas Realizadas",
        value: consultationsCount || 0,
        change: 15,
        period: "último mês",
        type: "consultations"
      },
      {
        id: "4",
        title: "Posts Publicados",
        value: postsCount || 0,
        change: 5,
        period: "último mês",
        type: "posts"
      }
    ]
  } catch (error) {
    console.error("Error in getReportMetrics:", error)
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
      .from("consultations")
      .select(`
        id,
        price,
        status,
        start_time,
        patient_profiles(full_name),
        nutritionist_profiles(full_name)
      `)
      .not("price", "is", null)
      .order("start_time", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching transactions:", error)
      return []
    }

    return appointments.map(apt => ({
      id: apt.id,
      type: "receita" as const,
      amount: apt.price || 0,
      description: `Consulta - ${apt.patient_profiles?.full_name || "Paciente"} com ${apt.nutritionist_profiles?.full_name || "Nutricionista"}`,
      date: apt.start_time,
      status: apt.status === "completed" ? "concluída" : 
              apt.status === "scheduled" ? "pendente" : "cancelada",
      userName: apt.patient_profiles?.full_name || "Usuário"
    }))
  } catch (error) {
    console.error("Error in getTransactions:", error)
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
        id: "1",
        name: "Banco de Dados",
        status: "online",
        uptime: 99.9,
        lastCheck: new Date().toISOString()
      },
      {
        id: "2",
        name: "Autenticação",
        status: "online",
        uptime: 99.8,
        lastCheck: new Date().toISOString()
      },
      {
        id: "3",
        name: "Notificações",
        status: "online",
        uptime: 98.5,
        lastCheck: new Date().toISOString()
      },
      {
        id: "4",
        name: "Upload de Arquivos",
        status: "online",
        uptime: 99.2,
        lastCheck: new Date().toISOString()
      }
    ]

    // Testar conectividade com o banco
    try {
      await supabase.from("users").select("id").limit(1)
    } catch (error) {
      services[0].status = "offline"
      services[0].uptime = 0
    }

    return services
  } catch (error) {
    console.error("Error in getSystemServices:", error)
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
  } catch (error) {
    console.error("Error in getModerationReports:", error)
    return []
  }
}
