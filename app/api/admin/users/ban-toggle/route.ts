import { NextRequest } from 'next/server'
import { withErrorHandling, createApiResponse } from '@/lib/api-middleware'
import { requireAdmin } from '@/lib/auth-utils'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface BanTogglePayload {
  userId?: string
  action?: 'ban' | 'unban'
  reason?: string | null
}

export const POST = withErrorHandling(async (req: NextRequest) => {
  await requireAdmin()

  const admin = createAdminClient()
  const body = (await req.json().catch(() => null)) as BanTogglePayload | null

  if (!body || !body.userId || !body.action) {
    return createApiResponse(null, {
      status: 400,
      error: { message: 'Parâmetros inválidos' },
    })
  }

  const targetId = body.userId.trim()
  if (!targetId) {
    return createApiResponse(null, {
      status: 400,
      error: { message: 'ID de usuário inválido' },
    })
  }

  const { data: targetUser, error: fetchError } = await admin
    .from('users')
    .select('id, user_type, is_banned, banned_at, banned_reason, banned_by')
    .eq('id', targetId)
    .maybeSingle()

  if (fetchError || !targetUser) {
    return createApiResponse(null, {
      status: 404,
      error: { message: 'Usuário não encontrado' },
    })
  }

  if (targetUser.user_type === 'admin') {
    return createApiResponse(null, {
      status: 403,
      error: { message: 'Não é permitido banir administradores.' },
    })
  }

  const authUser = await requireAdmin()
  const adminId = authUser.id

  if (body.action === 'ban') {
    const { error: updateError } = await admin
      .from('users')
      .update({
        is_banned: true,
        banned_at: new Date().toISOString(),
        banned_reason: body.reason || null,
        banned_by: adminId,
      })
      .eq('id', targetId)

    if (updateError) {
      return createApiResponse(null, {
        status: 500,
        error: { message: 'Falha ao banir usuário' },
      })
    }

    return createApiResponse({
      ok: true,
      action: 'ban',
    })
  }

  const { error: unbanError } = await admin
    .from('users')
    .update({
      is_banned: false,
      banned_at: null,
      banned_reason: null,
      banned_by: null,
    })
    .eq('id', targetId)

  if (unbanError) {
    return createApiResponse(null, {
      status: 500,
      error: { message: 'Falha ao desbanir usuário' },
    })
  }

  return createApiResponse({
    ok: true,
    action: 'unban',
  })
})

