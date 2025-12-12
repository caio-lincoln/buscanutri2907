import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { cookies, headers } from 'next/headers'

export const createClient = async () => {
  return createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        async getAll() {
          try {
            const cookieStore = await cookies()
            const anyStore = cookieStore as unknown as { getAll?: () => Array<{ name: string; value: string }> }
            if (typeof anyStore.getAll === 'function') {
              return anyStore.getAll()
            }
            const headersList = await headers()
            const cookieHeader: string = headersList.get('cookie') ?? ''
            const pairs: string[] = cookieHeader.split(';').map((s: string) => s.trim()).filter(Boolean)
            return pairs.map((p: string) => {
              const i = p.indexOf('=')
              const name = i >= 0 ? p.slice(0, i) : p
              const value = i >= 0 ? p.slice(i + 1) : ''
              return { name, value }
            })
          } catch {
            return []
          }
        },
        async setAll(cookiesToSet) {
          try {
            const cookieStore = await cookies()
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                ;(cookieStore as any).set(name, value, options)
              } catch {}
            })
          } catch {}
        },
      },
    }
  )
}

// Cliente para uso administrativo com service role key
export const createAdminClient = () => {
  return createSupabaseAdminClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!
  )
}
