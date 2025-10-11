import { NextRequest } from 'next/server'
import { withErrorHandling, createApiResponse } from '@/lib/api-middleware'
import { requireAdmin } from '@/lib/auth-utils'
import { createAdminClient } from '@/lib/supabase/server'

export const DELETE = withErrorHandling(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  await requireAdmin()
  const admin = createAdminClient()

  // Apagar usuário de autenticação
  const { error: delError } = await admin.auth.admin.deleteUser(params.id)
  if (delError) {
    return createApiResponse({ success: false, error: delError.message })
  }

  // Limpar registro da tabela pública de usuários
  try {
    await admin.from('users').delete().eq('id', params.id)
  } catch {
    // Ignorar falha ao excluir linha auxiliar
  }

  return createApiResponse({ success: true })
})