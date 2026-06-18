import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

interface Params {
  params: Promise<{ id: string }>
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: post } = await service
    .from('dungeon_lfg')
    .select('user_id')
    .eq('id', id)
    .single()

  const { data: userRecord } = await service
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isOwner = post?.user_id === user.id
  const isAdmin = ['admin', 'officer', 'gm'].includes(userRecord?.role ?? '')

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await service
    .from('dungeon_lfg')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('LFG delete error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
