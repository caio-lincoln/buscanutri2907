import { supabase } from "@/lib/supabase"

export interface DashboardStats {
  upcomingAppointments: number
  availableJobs: number
  unreadNotifications: number
  pendingReports?: number
  pendingModerations?: number
}

/**
 * Busca estatísticas do dashboard para nutricionistas
 */
export async function getNutritionistStats(userId: string): Promise<DashboardStats> {
  try {
    // Consultas agendadas (próximas) - Funcionalidade de telemedicina removida
    const appointments = null // Telemedicina desabilitada temporariamente

    // Vagas disponíveis
    const { data: jobs, error: jobsError } = await supabase
      .from("job_postings")
      .select("id")
      .eq("status", "active")

    if (jobsError) {
      console.error("Erro ao buscar vagas:", jobsError)
    }

    // Notificações não lidas
    const { data: notifications, error: notificationsError } = await supabase
      .from("realtime_notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("read", false)

    if (notificationsError) {
      console.error("Erro ao buscar notificações:", notificationsError)
    }

    return {
      upcomingAppointments: appointments?.length || 0,
      availableJobs: jobs?.length || 0,
      unreadNotifications: notifications?.length || 0,
    }
  } catch (error) {
    console.error("Erro ao buscar estatísticas do nutricionista:", error)
    return {
      upcomingAppointments: 0,
      availableJobs: 0,
      unreadNotifications: 0,
    }
  }
}

/**
 * Busca estatísticas do dashboard para pacientes
 */
export async function getPatientStats(userId: string): Promise<DashboardStats> {
  try {
    // Consultas agendadas (próximas) - Funcionalidade de telemedicina removida
    const appointments = null // Telemedicina desabilitada temporariamente

    // Notificações não lidas
    const { data: notifications, error: notificationsError } = await supabase
      .from("realtime_notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("read", false)

    if (notificationsError) {
      console.error("Erro ao buscar notificações:", notificationsError)
    }

    return {
      upcomingAppointments: appointments?.length || 0,
      availableJobs: 0, // Pacientes não veem vagas
      unreadNotifications: notifications?.length || 0,
    }
  } catch (error) {
    console.error("Erro ao buscar estatísticas do paciente:", error)
    return {
      upcomingAppointments: 0,
      availableJobs: 0,
      unreadNotifications: 0,
    }
  }
}

/**
 * Busca estatísticas do dashboard para empresas
 */
export async function getCompanyStats(userId: string): Promise<DashboardStats> {
  try {
    // Vagas ativas da empresa
    const { data: jobs, error: jobsError } = await supabase
      .from("job_postings")
      .select("id")
      .eq("company_id", userId)
      .eq("status", "active")

    if (jobsError) {
      console.error("Erro ao buscar vagas da empresa:", jobsError)
    }

    // Notificações não lidas
    const { data: notifications, error: notificationsError } = await supabase
      .from("realtime_notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("read", false)

    if (notificationsError) {
      console.error("Erro ao buscar notificações:", notificationsError)
    }

    return {
      upcomingAppointments: 0, // Empresas não têm consultas
      availableJobs: jobs?.length || 0,
      unreadNotifications: notifications?.length || 0,
    }
  } catch (error) {
    console.error("Erro ao buscar estatísticas da empresa:", error)
    return {
      upcomingAppointments: 0,
      availableJobs: 0,
      unreadNotifications: 0,
    }
  }
}

/**
 * Busca estatísticas do dashboard para administradores
 */
export async function getAdminStats(): Promise<DashboardStats> {
  try {
    // Relatórios pendentes (posts do blog aguardando aprovação)
    const { data: pendingPosts, error: postsError } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("status", "pending")

    if (postsError) {
      console.error("Erro ao buscar posts pendentes:", postsError)
    }

    // Moderações pendentes (denúncias ou conteúdo para revisar)
    const { data: pendingModerations, error: moderationsError } = await supabase
      .from("forum_posts")
      .select("id")
      .eq("status", "reported")

    if (moderationsError) {
      console.error("Erro ao buscar moderações pendentes:", moderationsError)
    }

    // Notificações não lidas do sistema
    const { data: notifications, error: notificationsError } = await supabase
      .from("realtime_notifications")
      .select("id")
      .eq("notification_type", "system")
      .eq("read", false)

    if (notificationsError) {
      console.error("Erro ao buscar notificações do sistema:", notificationsError)
    }

    return {
      upcomingAppointments: 0,
      availableJobs: 0,
      unreadNotifications: notifications?.length || 0,
      pendingReports: pendingPosts?.length || 0,
      pendingModerations: pendingModerations?.length || 0,
    }
  } catch (error) {
    console.error("Erro ao buscar estatísticas do admin:", error)
    return {
      upcomingAppointments: 0,
      availableJobs: 0,
      unreadNotifications: 0,
      pendingReports: 0,
      pendingModerations: 0,
    }
  }
}

/**
 * Função principal para buscar estatísticas baseadas no tipo de usuário
 */
export async function getDashboardStats(userType: string, userId: string): Promise<DashboardStats> {
  switch (userType) {
    case "nutricionista":
      return getNutritionistStats(userId)
    case "paciente":
      return getPatientStats(userId)
    case "empresa":
      return getCompanyStats(userId)
    case "admin":
      return getAdminStats()
    default:
      return {
        upcomingAppointments: 0,
        availableJobs: 0,
        unreadNotifications: 0,
      }
  }
}
