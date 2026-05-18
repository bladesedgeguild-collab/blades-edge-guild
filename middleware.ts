import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
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

  const { pathname } = request.nextUrl

  const isMemberRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/roster')
  const isAdminRoute = pathname.startsWith('/approvals')

  if (isMemberRoute || isAdminRoute) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role ?? 'pending'

    if (isAdminRoute && role !== 'admin' && role !== 'gm') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (isMemberRoute && role === 'pending') {
      return NextResponse.redirect(new URL('/dashboard?pending=true', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/roster/:path*', '/approvals/:path*'],
}
