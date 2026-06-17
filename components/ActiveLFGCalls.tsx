import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { DUNGEONS } from '@/data/dungeons/index'

const TankIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 1L2 5v6c0 4.5 3.3 8.7 8 9.9C14.7 19.7 18 15.5 18 11V5L10 1z"
      stroke="currentColor" strokeWidth="1.5" fill="rgba(201,150,26,0.2)" />
    <line x1="10" y1="6" x2="10" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="6" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const HealerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="8" y="2" width="4" height="16" rx="2" fill="currentColor" opacity="0.85"/>
    <rect x="2" y="8" width="16" height="4" rx="2" fill="currentColor" opacity="0.85"/>
  </svg>
)

const DPSIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <line x1="4" y1="16" x2="16" y2="4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M14 3l3 0 0 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 17l2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

type NameGroup = { tank: string[]; healer: string[]; dps: string[] }
type NumberGroup = { tank: number; healer: number; dps: number }

type LFGPost = {
  id: string
  dungeon_slug: string
  character_name: string
  role: string
  available_window: string | null
  days_available: string[] | null
  time_start: string | null
  time_end: string | null
  notes: string | null
  current_group: NameGroup | NumberGroup | null
}

function getNames(group: LFGPost['current_group'], slot: 'tank' | 'healer' | 'dps'): string[] {
  if (!group) return []
  const val = group[slot]
  if (Array.isArray(val)) return val
  return []
}

function formatWindow(post: LFGPost): string {
  const days = post.days_available?.length
    ? post.days_available.join(', ')
    : post.days_available !== null && post.days_available !== undefined
    ? 'Any day' : null
  if (post.time_start && post.time_end)
    return `${days || 'Any day'}, ${post.time_start}–${post.time_end} Server Time`
  if (days) return days
  return post.available_window ?? ''
}

function formatDungeonName(slug: string): string {
  return DUNGEONS.find(d => d.id === slug)?.name ?? slug.replace(/-/g, ' ')
}

export default async function ActiveLFGCalls() {
  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await service
    .from('dungeon_lfg')
    .select('id, dungeon_slug, character_name, role, available_window, days_available, time_start, time_end, notes, current_group')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) console.error('ActiveLFGCalls fetch error:', error)

  const posts = (data ?? []) as LFGPost[]
  if (posts.length === 0) return null

  return (
    <section className="lfg-big-section">
      <h2 className="lfg-big-heading">Active Dungeon Calls</h2>
      {posts.map(post => {
        const tanks = getNames(post.current_group, 'tank')
        const healers = getNames(post.current_group, 'healer')
        const dps = getNames(post.current_group, 'dps')
        const window = formatWindow(post)

        return (
          <div key={post.id} className="lfg-big-card">
            <h3 className="lfg-big-dungeon">{formatDungeonName(post.dungeon_slug)}</h3>
            <div className="lfg-big-meta">
              <span>{post.character_name} is calling for a group</span>
              {window && <span>{window}</span>}
            </div>

            <div className="lfg-big-roles">
              <div className="lfg-role-block">
                <div className="lfg-role-header">
                  <span className="lfg-role-icon lfg-role-icon--tank"><TankIcon /></span>
                  <span className="lfg-role-label">Tank</span>
                </div>
                <div className="lfg-role-slot">
                  {tanks[0]
                    ? <span className="lfg-slot-name">{tanks[0]}</span>
                    : <span className="lfg-slot-need">NEED</span>
                  }
                </div>
              </div>

              <div className="lfg-role-block">
                <div className="lfg-role-header">
                  <span className="lfg-role-icon lfg-role-icon--healer"><HealerIcon /></span>
                  <span className="lfg-role-label">Healer</span>
                </div>
                <div className="lfg-role-slot">
                  {healers[0]
                    ? <span className="lfg-slot-name">{healers[0]}</span>
                    : <span className="lfg-slot-need">NEED</span>
                  }
                </div>
              </div>

              <div className="lfg-role-block lfg-role-block--dps">
                <div className="lfg-role-header">
                  <span className="lfg-role-icon lfg-role-icon--dps"><DPSIcon /></span>
                  <span className="lfg-role-label">DPS</span>
                </div>
                {[0, 1, 2].map(i => (
                  <div key={i} className="lfg-role-slot">
                    <span className="lfg-dps-label">DPS {i + 1}:</span>
                    {dps[i]
                      ? <span className="lfg-slot-name">{dps[i]}</span>
                      : <span className="lfg-slot-need">NEED</span>
                    }
                  </div>
                ))}
              </div>
            </div>

            {post.notes && <p className="lfg-big-notes">{post.notes}</p>}

            <Link href={`/dungeons/${post.dungeon_slug}`} className="lfg-big-link">
              Answer the Call
            </Link>
          </div>
        )
      })}
    </section>
  )
}
