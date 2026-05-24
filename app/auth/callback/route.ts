import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url))
  }

  // Create the redirect response FIRST so cookies can be written onto it
  const response = NextResponse.redirect(new URL('/dashboard', request.url))

  // Supabase client whose setAll writes session cookies directly onto the response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Auth callback error:', error.message)
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Explicit branch: never use upsert — it can silently merge/overwrite display_name.
    // display_name is NEVER written here; onboarding owns it exclusively.
    const { data: existingUser } = await adminClient
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (existingUser) {
      // Existing user — touch only updated_at; never overwrite display_name or any profile field
      await adminClient
        .from('users')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', user.id)
    } else {
      // Brand-new user — bare row only; onboarding owns display_name exclusively
      await adminClient
        .from('users')
        .insert({
          id: user.id,
          role: 'member',
          has_completed_onboarding: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
    }
  }

  // Return the response WITH the session cookies already set on it
  return response
}
