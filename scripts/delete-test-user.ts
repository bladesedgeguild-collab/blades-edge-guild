import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local so this script works without pre-setting env vars
try {
  const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx < 0) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (key) process.env[key] = val
  }
} catch {
  // env vars may already be set in the shell
}

const TARGET_EMAIL = 'odys_sc2@gmail.com'

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Step 1: find the auth user by email
  const { data: { users }, error: listError } = await admin.auth.admin.listUsers()
  if (listError) {
    console.error('Error listing auth users:', listError.message)
    process.exit(1)
  }

  const target = users.find((u) => u.email === TARGET_EMAIL)
  if (!target) {
    console.log(`No auth user found for ${TARGET_EMAIL} — may already be deleted.`)
  } else {
    console.log(`Found auth user ${target.id} (${TARGET_EMAIL})`)

    // Step 2: unclaim Guildßank
    const { error: unclaimErr } = await admin
      .from('characters')
      .update({ claimed_by: null, claimed_at: null })
      .eq('name', 'Guildßank')
    if (unclaimErr) {
      console.error('Error unclaiming Guildßank:', unclaimErr.message)
    } else {
      console.log('Unclaimed Guildßank in characters table.')
    }

    // Step 3: delete from public.users
    const { error: pubDeleteErr } = await admin
      .from('users')
      .delete()
      .eq('id', target.id)
    if (pubDeleteErr) {
      console.error('Error deleting from public.users:', pubDeleteErr.message)
    } else {
      console.log(`Deleted from public.users: ${target.id}`)
    }

    // Step 4: delete from auth.users
    const { error: authDeleteErr } = await admin.auth.admin.deleteUser(target.id)
    if (authDeleteErr) {
      console.error('Error deleting auth user:', authDeleteErr.message)
    } else {
      console.log(`Deleted auth user: ${target.id}`)
    }
  }

  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
