import { NextRequest } from 'next/server'
import { withErrorHandling, createApiResponse } from '@/lib/api-middleware'
import { requireAdmin } from '@/lib/auth-utils'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const GET = withErrorHandling(async (req: NextRequest) => {
  // Verificar se o usuário é admin
  await requireAdmin()
  
  // Buscar todos os usuários (dados públicos) e enriquecer com status real
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data, error } = await supabase
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

  if (error || !data) {
    return createApiResponse([])
  }

  const enriched = await Promise.all(
    data.map(async (u: any) => {
      let status: 'ativo' | 'inativo' | 'pendente' | 'suspenso' = 'ativo'

      // Verificação de nutricionista pendente
      if (u.user_type === 'nutricionista' && !u.nutritionist_profiles?.is_verified) {
        status = 'pendente'
      }

      // Consultar status de banimento via Auth Admin
      try {
        const { data: authUser } = await admin.auth.admin.getUserById(u.id)
        const bannedUntil: string | undefined = (authUser as any)?.banned_until
        if (bannedUntil) {
          const bannedDate = new Date(bannedUntil)
          if (!isNaN(bannedDate.getTime()) && bannedDate.getTime() > Date.now()) {
            const diffDays = (bannedDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            status = diffDays >= 365 ? 'inativo' : 'suspenso'
          }
        }
      } catch {
        // Ignorar erros ao buscar auth user
      }

      return {
        id: u.id,
        name:
          u.patient_profiles?.full_name ||
          u.nutritionist_profiles?.full_name ||
          u.company_profiles?.company_name ||
          'Nome não disponível',
        email: u.email,
        type: u.user_type as 'paciente' | 'nutricionista' | 'empresa',
        status,
        createdAt: u.created_at,
        is_verified: u.nutritionist_profiles?.is_verified,
        nutritionist_profiles: u.nutritionist_profiles,
      }
    })
  )

  return createApiResponse(enriched)
})
