import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandling, createApiResponse, createErrorResponse } from '@/lib/api-middleware'
import { requireAdmin } from '@/lib/auth-utils'
import { createAdminClient } from '@/lib/supabase/server'

const schema = z.object({
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Inclua letra maiúscula')
    .regex(/[a-z]/, 'Inclua letra minúscula')
    .regex(/[0-9]/, 'Inclua número'),
})

export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
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
  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return createErrorResponse('Senha inválida', 400)
  }

  const rawId = (await params).id
  let targetUuid = rawId
  if (/^\d+$/.test(rawId)) {
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

  const { error } = await admin.auth.admin.updateUserById(targetUuid, {
    password: parsed.data.password,
  })

  if (error) {
    const msg = error.message || 'Falha ao alterar senha'
    const isUnauthorized = /unauthorized/i.test(msg) || /permission/i.test(msg)
    const status = isUnauthorized ? 403 : 500
    return createErrorResponse(msg, status)
  }

  return createApiResponse({
    ok: true,
    edited: true,
    rowsAffected: 1,
    success: true,
  })
})

