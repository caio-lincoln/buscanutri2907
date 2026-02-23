import { NextRequest } from 'next/server'
import { withErrorHandling, createApiResponse } from '@/lib/api-middleware'

export const dynamic = 'force-dynamic'

import { requireAdmin } from '@/lib/auth-utils'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const GET = withErrorHandling(async (req: NextRequest) => {
  // Verificar se o usuário é admin
  await requireAdmin()
  
  // Buscar todos os usuários com cliente administrativo (contorna RLS)
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('users')
    .select(`
      id,
      "ID",
      email,
      user_type,
      created_at,
      is_deleted,
      is_banned,
      banned_at,
      banned_reason,
      banned_by,
      patient_profiles:patient_profiles!patient_profiles_user_id_fkey(full_name, phone, birth_date, gender),
      nutritionist_profiles:nutritionist_profiles!nutritionist_profiles_user_id_fkey(id, full_name, is_verified, verification_status, crn, phone),
      company_profiles:company_profiles!company_profiles_user_id_fkey(company_name)
    `)
    .eq('is_deleted', false) // Filter out soft deleted users
    .order('created_at', { ascending: false })

  if (error || !data) {
    return createApiResponse([])
  }

  const enriched = await Promise.all(
    data.map(async (u: any) => {
      let status: 'ativo' | 'inativo' | 'pendente' | 'suspenso' | 'banido' = 'ativo'

      // Se marcado como banido na tabela de usuários, tem prioridade máxima
      if (u.is_banned) {
        status = 'banido'
      }

      if (!u.is_banned && u.user_type === 'nutricionista') {
        const rawStatus = (u.nutritionist_profiles?.verification_status as string | undefined) || ''
        const normalized = rawStatus.toLowerCase()
        if (normalized === 'aprovado' || normalized === 'verificado') {
          status = 'ativo'
        } else if (normalized === 'reprovado' || normalized === 'rejected') {
          status = 'inativo'
        } else if (!u.nutritionist_profiles?.is_verified) {
          status = 'pendente'
        }
      }

      // Status adicional via Auth Admin mantido apenas para suspensão temporária
      if (!u.is_banned) {
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
        }
      }

      let displayName = 'Nome não disponível'
      
      if (u.user_type === 'nutricionista') {
        displayName = u.nutritionist_profiles?.full_name || u.patient_profiles?.full_name || u.company_profiles?.company_name || 'Nome não disponível'
      } else if (u.user_type === 'empresa') {
        displayName = u.company_profiles?.company_name || u.patient_profiles?.full_name || u.nutritionist_profiles?.full_name || 'Nome não disponível'
      } else {
        displayName = u.patient_profiles?.full_name || u.nutritionist_profiles?.full_name || u.company_profiles?.company_name || 'Nome não disponível'
      }

      return {
        id: u.id,
        numericId: (u as any)?.ID,
        name: displayName,
        email: u.email,
        type: u.user_type as 'paciente' | 'nutricionista' | 'empresa',
        status,
        createdAt: u.created_at,
        is_banned: u.is_banned,
        banned_at: u.banned_at,
        banned_reason: u.banned_reason,
        banned_by: u.banned_by,
        is_verified: u.nutritionist_profiles?.verification_status
          ? String(u.nutritionist_profiles.verification_status).toLowerCase() === 'aprovado'
          : u.nutritionist_profiles?.is_verified,
        nutritionist_profiles: u.nutritionist_profiles,
      }
    })
  )

  return createApiResponse(enriched)
})
