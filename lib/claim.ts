import { fullName } from '@/lib/names'

type ClaimResult =
  | { ok: true; character: { id: string; name: string; last_name: string | null; class: string; race: string | null; level: number } }
  | { ok: false; status: number; error: string }

/**
 * Claim an existing, unclaimed character row (normally one imported from the
 * GRM roster) for a user, as their main or as an alt. Never overwrites a row
 * someone else already claimed.
 */
export async function claimExistingCharacter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  userId: string,
  characterId: string,
  asMain: boolean,
  fill?: { race?: string | null; class?: string | null; level?: number | null },
): Promise<ClaimResult> {
  const { data: char } = await admin
    .from('characters')
    .select('id, name, last_name, class, race, level, claimed_by, user_id')
    .eq('id', characterId)
    .maybeSingle()

  if (!char) return { ok: false, status: 404, error: 'Character not found' }
  if (char.claimed_by === userId) return { ok: false, status: 409, error: 'You already claimed this character' }
  if (char.claimed_by || char.user_id) {
    return { ok: false, status: 409, error: 'Someone already claimed this character. If it is yours, ask an officer to release it.' }
  }

  if (asMain) {
    const { data: u } = await admin.from('users').select('claimed_character_id').eq('id', userId).single()
    if (u?.claimed_character_id) return { ok: false, status: 409, error: 'You already have a main character' }
  }

  const update: Record<string, unknown> = {
    user_id: userId,
    claimed_by: userId,
    claimed_at: new Date().toISOString(),
    is_main: asMain,
    updated_at: new Date().toISOString(),
  }
  // Only fill gaps the roster export left blank; roster data wins otherwise
  if (!char.race && fill?.race) update.race = fill.race
  if (!char.class && fill?.class) update.class = fill.class.toUpperCase()

  // Conditional update so two people can't claim the same row at once
  const { data: updatedRows, error } = await admin
    .from('characters')
    .update(update)
    .eq('id', characterId)
    .is('claimed_by', null)
    .select('id, name, last_name, class, race, level')

  if (error) return { ok: false, status: 500, error: error.message }
  if (!updatedRows || updatedRows.length === 0) {
    return { ok: false, status: 409, error: 'Someone just claimed this character' }
  }
  const claimed = updatedRows[0]

  if (asMain) {
    const { error: userError } = await admin
      .from('users')
      .update({ claimed_character_id: claimed.id, display_name: fullName(claimed.name, claimed.last_name) })
      .eq('id', userId)
    if (userError) return { ok: false, status: 500, error: userError.message }
  }

  return { ok: true, character: claimed }
}
