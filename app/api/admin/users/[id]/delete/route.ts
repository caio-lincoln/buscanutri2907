import { NextRequest } from 'next/server'
import { withErrorHandling, createApiResponse, createErrorResponse } from '@/lib/api-middleware'
import { requireAdmin } from '@/lib/auth-utils'
import { createAdminClient } from '@/lib/supabase/server'
import { requireProductionAuth } from '@/lib/production-auth'

export const DELETE = withErrorHandling(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
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
  try {
    requireProductionAuth(req, { production_auth: req.headers.get('x-production-auth') }, 'exclusão de usuário')
  } catch (e: any) {
    return createErrorResponse(e?.message || 'Operação não autorizada em produção', 403)
  }
  const admin = createAdminClient()
  const rawId = (await params).id
  let targetUuid = rawId
  let targetNumeric: number | null = null
  let existedInUsers = false
  if (/^\d+$/.test(rawId)) {
    targetNumeric = Number(rawId)
    const { data: row, error: mapErr } = await admin
      .from('users')
      .select('id')
      .eq('ID', targetNumeric)
      .maybeSingle()
    if (row?.id) {
      targetUuid = row.id as string
      existedInUsers = true
    } else if (mapErr) {
      return createErrorResponse('Usuário não encontrado', 404)
    } else {
      return createErrorResponse('Usuário não encontrado', 404)
    }
  } else {
    const { data: row } = await admin
      .from('users')
      .select('id')
      .eq('id', targetUuid)
      .maybeSingle()
    existedInUsers = !!row?.id
  }
  let dbDeleted: 'deleted' | 'not_found' | 'error' = existedInUsers ? 'deleted' : 'not_found'
  try {
    if (targetNumeric !== null) {
      const { error } = await admin.from('users').delete().eq('ID', targetNumeric)
      dbDeleted = error ? 'error' : 'deleted'
    } else {
      const { error } = await admin.from('users').delete().eq('id', targetUuid)
      dbDeleted = error ? 'error' : (existedInUsers ? 'deleted' : 'not_found')
    }
  } catch {
    dbDeleted = 'error'
  }
  let authDeleted: 'deleted' | 'not_found' | 'error' = 'deleted'
  try {
    const res = await admin.auth.admin.deleteUser(targetUuid)
    if (res?.error) {
      const msg = res.error.message || ''
      const isUnauthorized = /unauthorized/i.test(msg) || /permission/i.test(msg)
      const isNotFound = /not found/i.test(msg)
      if (isUnauthorized) {
        return createErrorResponse(msg || 'Não autorizado', 403)
      }
      authDeleted = isNotFound ? 'not_found' : 'error'
    } else {
      authDeleted = 'deleted'
    }
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : ''
    const isUnauthorized = /unauthorized/i.test(msg) || /permission/i.test(msg)
    const isNotFound = /not found/i.test(msg)
    if (isUnauthorized) {
      return createErrorResponse(msg || 'Não autorizado', 403)
    }
    authDeleted = isNotFound ? 'not_found' : 'error'
  }
  const success = (dbDeleted === 'deleted' || dbDeleted === 'not_found') && (authDeleted === 'deleted' || authDeleted === 'not_found')
  return createApiResponse({ success, auth: authDeleted, db: dbDeleted })
})
