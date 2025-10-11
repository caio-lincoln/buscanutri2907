import { NextRequest } from 'next/server'
import { withErrorHandling, createApiResponse } from '@/lib/api-middleware'
import { requireAdmin } from '@/lib/auth-utils'
import { createAdminClient } from '@/lib/supabase/server'

export const POST = withErrorHandling(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin.auth.admin.updateUserById(params.id, { ban_duration: 'none' })
  if (error) {
    return createApiResponse({ success: false, error: error.message })
  }
  return createApiResponse({ success: true })
})