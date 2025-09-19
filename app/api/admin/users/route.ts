import { NextRequest } from 'next/server'
import { withErrorHandling, createApiResponse } from '@/lib/api-middleware'
import { requireAdmin } from '@/lib/auth-utils'
import { getAllUsers } from '@/lib/admin-data-service'

export const GET = withErrorHandling(async (req: NextRequest) => {
  // Verificar se o usuário é admin
  await requireAdmin()
  
  // Buscar todos os usuários
  const users = await getAllUsers()
  
  return createApiResponse(users)
})
