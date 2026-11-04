import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { isOfficerUser } from '@/lib/officer'


export async function POST(request: NextRequest) {
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

  if (!(await isOfficerUser(admin, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { user_id } = await request.json() as { user_id: string }
  if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

  // Prevent self-deletion
  if (user_id === user.id) {
    return NextResponse.json({ error: 'Cannot delete your own account from here' }, { status: 400 })
  }

  // Release all character claims
  await admin
    .from('characters')
    .update({ claimed_by: null, claimed_at: null })
    .eq('claimed_by', user_id)

  // Delete from public.users
  await admin.from('users').delete().eq('id', user_id)

  // Delete from Supabase auth
  await admin.auth.admin.deleteUser(user_id)

  return NextResponse.json({ success: true })
}
