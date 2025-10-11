import { NextRequest } from 'next/server'
import { withErrorHandling, createApiResponse } from '@/lib/api-middleware'
import { requireAdmin } from '@/lib/auth-utils'
import { createAdminClient } from '@/lib/supabase/server'

export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await requireAdmin()
  const admin = createAdminClient()

  const { duration } = await req.json().catch(() => ({ duration: undefined }))
  const banDuration: string = typeof duration === 'string' && duration.length > 0 ? duration : '720h' // 30 dias

  const { error } = await admin.auth.admin.updateUserById(params.id, { ban_duration: banDuration })

  if (error) {
    return createApiResponse({ success: false, error: error.message })
  }
  return createApiResponse({ success: true })
})