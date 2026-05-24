import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Auth routes must ALWAYS pass through - never redirect them
  if (pathname.startsWith('/auth')) {
    return supabaseResponse
  }

  // Public routes - always allow
  if (pathname === '/' || pathname.startsWith('/login')) {
    return supabaseResponse
  }

  // Protected member routes (including onboarding)
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/roster') ||
    pathname.startsWith('/dungeons') ||
    pathname.startsWith('/characters') ||
    pathname.startsWith('/onboarding')
  ) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Check onboarding completion using service role to bypass RLS.
    // The anon client query is gated on !profileError — if RLS blocks the read
    // the error silently skips the redirect. Service role has no such risk.
    if (!pathname.startsWith('/onboarding')) {
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const { data: profile } = await admin
        .from('users')
        .select('has_completed_onboarding')
        .eq('id', user.id)
        .single()

      if (profile?.has_completed_onboarding !== true) {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
      }
    }

    return supabaseResponse
  }

  // Protected admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/approvals')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
