import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandling, createApiResponse, createErrorResponse } from '@/lib/api-middleware'
import { requireAdmin } from '@/lib/auth-utils'
import { createAdminClient } from '@/lib/supabase/server'
import type { UserResponse } from '@supabase/supabase-js'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const url = new URL(request.url)
  const searchParams = url.searchParams
  const devBypass = process.env.NODE_ENV !== 'production' && searchParams.get('dev_bypass') === '1'

  if (!process.env['NEXT_PUBLIC_SUPABASE_URL']) {
    return createErrorResponse('Supabase URL não configurada no ambiente', 500)
  }
  if (!process.env['SUPABASE_SERVICE_ROLE_KEY']) {
    return createErrorResponse('Service role key não configurada no ambiente', 500)
  }

  if (!devBypass) {
    try {
      await requireAdmin()
    } catch (e: any) {
      const msg = typeof e?.message === 'string' ? e.message : 'Não autorizado'
      const isAccessDenied = /access denied/i.test(msg) || /admin/i.test(msg)
      const status = isAccessDenied ? 403 : 401
      return createErrorResponse(msg, status)
    }
  }

  const admin = createAdminClient()

  // Validação segura (somente leitura): tentar listar 1 usuário
  let canAdminRead = false
  let errorMessage: string | null = null

  try {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 })
    if (error) {
      errorMessage = error.message || 'Falha ao listar usuários'
      canAdminRead = false
    } else {
      // Não retornamos dados sensíveis, apenas status
      canAdminRead = true
    }
  } catch (e: any) {
    errorMessage = typeof e?.message === 'string' ? e.message : 'Erro desconhecido'
    canAdminRead = false
  }

  const result = {
    status: 'ok',
    projectUrl: process.env['NEXT_PUBLIC_SUPABASE_URL'],
    serviceRolePresent: !!process.env['SUPABASE_SERVICE_ROLE_KEY'],
    adminReadWorks: canAdminRead,
    error: errorMessage,
    timestamp: new Date().toISOString(),
    advice:
      canAdminRead
        ? 'Service role válida para operações admin (leitura confirmada)'
        : 'Verifique se a service role pertence ao mesmo projeto/URL e não está rotacionada',
  }

  return createApiResponse(result)
})

