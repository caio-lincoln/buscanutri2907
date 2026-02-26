import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect Dashboard
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Protect Admin Dashboard
    if (request.nextUrl.pathname.startsWith('/dashboard/admin')) {
      const userType = 
        user.user_metadata?.user_type || 
        user.app_metadata?.user_type

      if (userType !== 'admin') {
        // Redirect non-admins to their respective dashboards or home
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  // Protect API Routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Whitelist public API routes
    const publicApiRoutes = [
      '/api/auth', // Login, Register, Recover
      '/api/stripe/webhook', // Stripe Webhook
      '/api/geo', // Public Geo Data (States, Cities)
      '/api/specialties', // Public Specialties List
    ]

    const isPublic = publicApiRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route)
    )

    // Allow GET requests for Nutritionist public profiles and availability
    const isPublicNutritionistRoute = 
      request.method === 'GET' && 
      request.nextUrl.pathname.startsWith('/api/nutritionists')

    if (!user && !isPublic && !isPublicNutritionistRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
