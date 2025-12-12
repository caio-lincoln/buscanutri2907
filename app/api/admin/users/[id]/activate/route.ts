import { NextRequest } from 'next/server'
import { withErrorHandling, createApiResponse, createErrorResponse } from '@/lib/api-middleware'
import { requireAdmin } from '@/lib/auth-utils'
import { createAdminClient } from '@/lib/supabase/server'

export const POST = withErrorHandling(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  if (!process.env['NEXT_PUBLIC_SUPABASE_URL']) {
    return createErrorResponse('Supabase URL não configurada no ambiente', 500)
  }
  if (!process.env['SUPABASE_SERVICE_ROLE_KEY']) {
    return createErrorResponse('Service role key não configurada no ambiente', 500)
  }

  try {
    await requireAdmin()
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Não autorizado'
    const isAccessDenied = /access denied/i.test(msg) || /admin/i.test(msg)
    const status = isAccessDenied ? 403 : 401
    return createErrorResponse(msg, status)
  }

  const admin = createAdminClient()
  const rawId = params.id
  let targetUuid = rawId
  if (/^\\d+$/.test(rawId)) {
    const { data: row } = await admin
      .from('users')
      .select('id')
      .eq('ID', Number(rawId))
      .maybeSingle()
    if (!row?.id) {
      return createErrorResponse('Usuário não encontrado', 404)
    }
    targetUuid = row.id as string
  }

  const precheck = await admin.auth.admin.getUserById(targetUuid)
  if (precheck.error || !precheck.data) {
    return createErrorResponse('Usuário não encontrado na autenticação', 404)
  }

  const { error } = await admin.auth.admin.updateUserById(targetUuid, { ban_duration: 'none' })
  if (error) {
    const msg = error.message || 'Falha ao ativar usuário'
    const isUnauthorized = /unauthorized/i.test(msg) || /permission/i.test(msg)
    const status = isUnauthorized ? 403 : 500
    return createErrorResponse(msg, status)
  }
  return createApiResponse({ success: true })
})
