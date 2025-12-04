import { NextRequest } from 'next/server'
import { withAuth, createApiResponse } from '@/lib/api-middleware'
import { createClient } from '@/lib/supabase/server'

export const POST = withAuth(async (req: NextRequest, user: any) => {
  const supabase = await createClient()
  const body = await req.json().catch(() => ({}))
  const { session_id, page_views, session_start, session_end, duration_seconds } = body as {
    session_id?: string
    page_views?: number
    session_start?: string
    session_end?: string
    duration_seconds?: number
  }

  if (!session_id) {
    return createApiResponse({ success: false, error: 'session_id required' }, 400)
  }

  let dur = typeof duration_seconds === 'number' ? duration_seconds : undefined
  if (!dur && session_start && session_end) {
    try {
      const start = new Date(session_start).getTime()
      const end = new Date(session_end).getTime()
      if (!isNaN(start) && !isNaN(end)) {
        dur = Math.max(0, Math.floor((end - start) / 1000))
      }
    } catch {}
  }

  const endIso = session_end || new Date().toISOString()

  const { error } = await supabase
    .from('user_sessions')
    .update({ session_end: endIso, duration_seconds: dur, page_views })
    .eq('id', session_id)
    .eq('user_id', user.id)

  if (error) {
    return createApiResponse({ success: false, error: error.message }, 500)
  }

  return createApiResponse({ success: true })
})
