import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { OfficersClient } from './OfficersClient'

export default async function OfficersPage() {
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
  if (!user) redirect('/login')

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await admin
    .from('users')
    .select('role, claimed_character_id')
    .eq('id', user.id)
    .single()

  let isOfficer = ['admin', 'gm', 'officer'].includes(profile?.role ?? '')

  if (!isOfficer && profile?.claimed_character_id) {
    const { data: char } = await admin
      .from('characters')
      .select('rank_index')
      .eq('id', profile.claimed_character_id)
      .single()
    if (char?.rank_index != null && char.rank_index <= 3) isOfficer = true
  }

  if (!isOfficer) redirect('/dashboard')

  return <OfficersClient />
}
