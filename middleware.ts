// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  if (!req.nextUrl.pathname.startsWith('/dashboard/admin')) {
    return res
  }

  const supabase = createServerClient(
    process.env[ 'NEXT_PUBLIC_SUPABASE_URL' ]!,
    process.env[ 'NEXT_PUBLIC_SUPABASE_ANON_KEY' ]!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value
        },
        set(name, value, options) {
          res.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data } = await supabase.auth.getUser()
  const user = data?.user

  if (!user) {
    const url = new URL('/login', req.url)
    url.searchParams.set('next', req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  const role =
    (user.user_metadata && (user.user_metadata as any).user_type) ||
    (user.app_metadata && (user.app_metadata as any).user_type)

  if (role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

export const config = {
  matcher: [ '/dashboard/admin/:path*' ],
}
