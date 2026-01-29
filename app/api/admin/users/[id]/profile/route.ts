import { NextRequest } from 'next/server'
import { withErrorHandling, createApiResponse } from '@/lib/api-middleware'
import { requireAdmin } from '@/lib/auth-utils'
import { createAdminClient } from '@/lib/supabase/server'

type UserType = 'paciente' | 'nutricionista' | 'empresa' | 'admin'

export const GET = withErrorHandling(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin()
  const admin = createAdminClient()

  const url = new URL(req.url)
  const typeParam = url.searchParams.get('type') as UserType | null

  const rawId = (await params).id
  let targetUuid = rawId
  if (/^\\d+$/.test(rawId)) {
    const { data: row } = await admin
      .from('users')
      .select('id')
      .eq('ID', Number(rawId))
      .maybeSingle()
    if (!row?.id) {
      return createApiResponse({ profile: null, type: null, error: 'Usuário não encontrado' })
    }
    targetUuid = row.id as string
  }

  // Resolver tipo do usuário quando não fornecido
  let userType: UserType | null = typeParam
  if (!userType) {
    const { data: userRow } = await admin
      .from('users')
      .select('user_type')
      .eq('id', targetUuid)
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

  let { data, error } = await admin
    .from(table)
    .select('*')
    .eq('user_id', targetUuid)
    .maybeSingle()

  // Fallback: alguns registros podem referenciar o próprio id do perfil
  if ((!data || error?.code === 'PGRST116')) {
    const alt = await admin
      .from(table)
      .select('*')
      .eq('id', targetUuid)
      .maybeSingle()
    if (!data && alt.data) data = alt.data
    if (!error && alt.error) error = alt.error
  }

  if (error) {
    return createApiResponse({ profile: null, type: userType, error: error.message })
  }

  return createApiResponse({ profile: data, type: userType })
})
