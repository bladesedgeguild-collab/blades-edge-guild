import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await admin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'gm'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { name, realm = 'Dreamscythe', status } = body as {
    name: string
    realm?: string
    status: string
  }

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Character name is required' }, { status: 400 })
  }

  if (!['returned', 'mia', 'new'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { error, count } = await admin
    .from('characters')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('name', name.trim())
    .eq('realm', realm)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (count === 0) {
    return NextResponse.json({ error: `Character "${name}" not found in ${realm}` }, { status: 404 })
  }

  return NextResponse.json({ success: true, name: name.trim(), status })
}
