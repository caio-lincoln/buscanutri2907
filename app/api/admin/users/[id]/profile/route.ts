import { NextRequest } from 'next/server'
import { withErrorHandling, createApiResponse } from '@/lib/api-middleware'
import { requireAdmin } from '@/lib/auth-utils'
import { createAdminClient } from '@/lib/supabase/server'

type UserType = 'paciente' | 'nutricionista' | 'empresa' | 'admin'

export const GET = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await requireAdmin()
  const admin = createAdminClient()

  const url = new URL(req.url)
  const typeParam = url.searchParams.get('type') as UserType | null

  // Resolver tipo do usuário quando não fornecido
  let userType: UserType | null = typeParam
  if (!userType) {
    const { data: userRow } = await admin
      .from('users')
      .select('user_type')
      .eq('id', params.id)
      .single()
    userType = (userRow?.user_type as UserType) ?? null
  }

  if (!userType || userType === 'admin') {
    return createApiResponse({ profile: null, type: userType ?? null })
  }

  const tableMap: Record<Exclude<UserType, 'admin'>, string> = {
    nutricionista: 'nutritionist_profiles',
    paciente: 'patient_profiles',
    empresa: 'company_profiles',
  }
  const table = tableMap[userType]

  const { data, error } = await admin
    .from(table)
    .select('*')
    .eq('user_id', params.id)
    .maybeSingle()

  if (error) {
    return createApiResponse({ profile: null, type: userType, error: error.message })
  }

  return createApiResponse({ profile: data, type: userType })
})