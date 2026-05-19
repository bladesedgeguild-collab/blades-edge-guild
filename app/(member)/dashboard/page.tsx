import { createClient } from '@/lib/supabase/server'
import { CLASS_COLORS, CharacterClass } from '@/types'

type MainChar = {
  id: string
  name: string
  class: CharacterClass
  level: number
  rank_name: string | null
  last_zone: string | null
  professions: { name: string; skill_level: number; is_primary: boolean }[]
}

type AltChar = { id: string; name: string; class: CharacterClass; level: number }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profileRaw } = await supabase
    .from('users')
    .select('display_name, discord_username, role, has_completed_onboarding, claimed_character_id')
    .eq('id', user?.id ?? '')
    .single()

  const profile = profileRaw as {
    display_name: string | null
    discord_username: string | null
    role: string | null
    has_completed_onboarding: boolean | null
    claimed_character_id: string | null
  } | null

  let mainChar: MainChar | null = null
  let alts: AltChar[] = []

  if (profile?.claimed_character_id) {
    const { data: charData } = await supabase
      .from('characters')
      .select('id, name, class, level, rank_name, last_zone, professions(name, skill_level, is_primary)')
      .eq('id', profile.claimed_character_id)
      .single()
    mainChar = charData as unknown as MainChar

    const { data: altData } = await supabase
      .from('characters')
      .select('id, name, class, level')
      .eq('claimed_by', user?.id ?? '')
      .neq('id', profile.claimed_character_id)
    alts = (altData ?? []) as unknown as AltChar[]
  }

  const hasOnboarded = profile?.has_completed_onboarding === true
  const displayName = profile?.display_name ?? profile?.discord_username ?? 'Adventurer'

  return (
    <div>
      {mainChar && hasOnboarded ? (
        <>
          <h1
            className="text-3xl font-bold mb-2"
            style={{ fontFamily: "'Cinzel Decorative', serif", color: '#c9961a' }}
          >
            Welcome back to Blådes Edge, {mainChar.name}. Stoked to see you again!
          </h1>

          {/* Main character card */}
          <div
            className="mt-6 rounded-lg p-5"
            style={{
              backgroundColor: '#241a0e',
              border: '1px solid #3d2e15',
              borderLeft: `4px solid ${CLASS_COLORS[mainChar.class] ?? '#c9961a'}`,
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: CLASS_COLORS[mainChar.class] }}
              />
              <span
                className="text-xl font-bold"
                style={{ fontFamily: "'Cinzel', serif", color: '#f0e6c8' }}
              >
                {mainChar.name}
              </span>
              <span
                className="text-sm ml-auto"
                style={{ fontFamily: "'Crimson Pro', serif", color: CLASS_COLORS[mainChar.class] }}
              >
                {mainChar.class}
              </span>
            </div>
            <div
              className="flex gap-4 text-sm mb-2"
              style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
            >
              <span>Level {mainChar.level}</span>
              {mainChar.rank_name && <span>Rank: {mainChar.rank_name}</span>}
              {mainChar.last_zone && <span>Last seen: {mainChar.last_zone}</span>}
            </div>
            {mainChar.professions.filter((p) => p.is_primary).length > 0 && (
              <p
                className="text-sm italic"
                style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
              >
                {mainChar.professions
                  .filter((p) => p.is_primary)
                  .map((p) => `${p.name} (${p.skill_level})`)
                  .join(' · ')}
              </p>
            )}
          </div>

          {/* Alts */}
          {alts.length > 0 && (
            <div className="mt-6">
              <h2
                className="text-sm font-semibold uppercase tracking-widest mb-3"
                style={{ fontFamily: "'Cinzel', serif", color: '#8a7a5a' }}
              >
                Your Alts
              </h2>
              <div className="flex flex-wrap gap-3">
                {alts.map((alt) => (
                  <div
                    key={alt.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{ backgroundColor: '#241a0e', border: '1px solid #3d2e15' }}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CLASS_COLORS[alt.class] ?? '#888' }}
                    />
                    <span
                      className="text-sm"
                      style={{ fontFamily: "'Cinzel', serif", color: '#f0e6c8' }}
                    >
                      {alt.name}
                    </span>
                    <span
                      className="text-xs"
                      style={{ fontFamily: "'Crimson Pro', serif", color: CLASS_COLORS[alt.class] }}
                    >
                      {alt.class}
                    </span>
                    <span
                      className="text-xs"
                      style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
                    >
                      Lvl {alt.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <h1
            className="text-3xl font-bold mb-2"
            style={{ fontFamily: "'Cinzel Decorative', serif", color: '#c9961a' }}
          >
            Welcome, {displayName}
          </h1>
          <div
            className="mt-6 rounded-lg border p-6"
            style={{ backgroundColor: '#241a0e', borderColor: '#3d2e15' }}
          >
            {profile?.role === 'pending' ? (
              <>
                <h2
                  className="text-lg font-semibold mb-2"
                  style={{ fontFamily: "'Cinzel', serif", color: '#c9961a' }}
                >
                  Awaiting Approval
                </h2>
                <p style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}>
                  Your account is pending officer approval. You will be notified once access is granted.
                </p>
              </>
            ) : (
              <p style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}>
                You&apos;re logged in. More guild features coming soon.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
