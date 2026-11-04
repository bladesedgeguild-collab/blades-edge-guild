/**
 * Officer access is granted ONLY by users.role (admin / gm / officer).
 *
 * It used to also trust the claimed character's in-game rank_index (≤ 3).
 * Now that members can claim imported roster characters, that would let
 * anyone claim an officer's character and unlock officer tools, so rank
 * no longer grants access. Promote officers by setting users.role.
 */
export const OFFICER_ROLES = ['admin', 'gm', 'officer'] as const

export function isOfficerRole(role: string | null | undefined): boolean {
  return (OFFICER_ROLES as readonly string[]).includes(role ?? '')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function isOfficerUser(admin: any, userId: string): Promise<boolean> {
  const { data } = await admin.from('users').select('role').eq('id', userId).single()
  return isOfficerRole((data as { role: string | null } | null)?.role)
}
