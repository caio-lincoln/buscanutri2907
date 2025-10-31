import { NextRequest } from 'next/server'
import { withErrorHandling, createApiResponse, createErrorResponse } from '@/lib/api-middleware'
import { requireAdmin } from '@/lib/auth-utils'
import { createAdminClient } from '@/lib/supabase/server'

export const DELETE = withErrorHandling(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  // Garantir que a chave de service role está configurada
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createErrorResponse('Service role key não configurada no ambiente', 500)
  }
  await requireAdmin()
  const admin = createAdminClient()

  // Apagar usuário de autenticação
  const { error: delError } = await admin.auth.admin.deleteUser(params.id)
  if (delError) {
    // Retornar erro com status adequado para o cliente reagir corretamente
    const msg = delError.message || 'Falha ao excluir usuário'
    const isUnauthorized = /unauthorized/i.test(msg) || /permission/i.test(msg)
    const status = isUnauthorized ? 403 : 500
    return createErrorResponse(msg, status)
  }

  // Limpar registro da tabela pública de usuários
  try {
    await admin.from('users').delete().eq('id', params.id)
  } catch {
    // Ignorar falha ao excluir linha auxiliar
  }

  return createApiResponse({ success: true })
})
