# Current Task: Fix ERR_TOO_MANY_REDIRECTS

## Problem
After Discord OAuth completes, the site shows "redirected you too many times" error.
This is a redirect loop caused by the middleware not correctly reading the Supabase
session cookie, so it keeps redirecting to /login even after auth succeeds.

## Fix required

### 1. Rewrite middleware.ts completely

Replace the contents of middleware.ts with this correct pattern for @supabase/ssr:

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

  // Protected member routes
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/roster') ||
    pathname.startsWith('/dungeons') ||
    pathname.startsWith('/characters')
  ) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
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

### 2. Fix the redirect in app/auth/callback/route.ts

Change the final success redirect to use:
  return NextResponse.redirect(new URL('/dashboard', request.url))

And the failure redirect to:
  return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))

Do NOT use string interpolation with origin variable.

### 3. Remove any redirect logic from layout files

Check app/(member)/layout.tsx and app/(admin)/layout.tsx.
If either file has session checks or redirects, remove them.
Middleware handles all auth redirects - layout files must not duplicate this.

### 4. Remove any redirect logic from page files

Check app/(member)/dashboard/page.tsx.
Remove any redirect or session check logic from it.

## After fixing
1. Run npm run build
2. Fix any TypeScript errors
3. git add -A && git commit -m "fix: redirect loop — correct middleware cookie pattern and remove duplicate redirects" && git push origin main
