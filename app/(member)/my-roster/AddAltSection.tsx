'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AddAltModal } from '@/components/AddAltModal'

const CLASS_COLORS: Record<string, string> = {
  MAGE: '#3fc7eb', PALADIN: '#f48cba', WARRIOR: '#c69b3a',
  PRIEST: '#ffffff', DRUID: '#ff7c0a', HUNTER: '#aad372',
  ROGUE: '#fff468', WARLOCK: '#8788ee', SHAMAN: '#0070dd',
  DEATH_KNIGHT: '#c41e3a', MONK: '#00ff98', DEMON_HUNTER: '#a330c9',
}

type AltChar = {
  id: string; name: string; class: string; race: string | null; level: number; rank_name: string | null
  professions: { name: string; skill_level: number; is_primary: boolean }[]
}

function altProfessions(profs: { name: string; skill_level: number; is_primary: boolean }[]): string {
  const primary = profs.filter(p => p.is_primary).slice(0, 2)
  const p1 = primary[0]
    ? `${primary[0].skill_level} ${primary[0].name}`
    : 'Prof 1 TBD'
  const p2 = primary[1]
    ? `${primary[1].skill_level} ${primary[1].name}`
    : 'Prof 2 TBD'
  return `${p1}  ${p2}`
}

export function AddAltSection({ alts, mainCharId }: { alts: AltChar[]; mainCharId: string }) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)

  const excludeIds = useMemo(
    () => [mainCharId, ...alts.map(a => a.id)],
    [mainCharId, alts]
  )

  return (
    <>
      {/* Tile: Your Alts */}
      <div style={{ background: 'rgba(26,18,8,0.6)', border: '1px solid rgba(61,46,21,0.5)', borderRadius: 4 }}>

        {/* Header row */}
        <div className="alts-tile-header" style={{ padding: '24px 40px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontFamily: 'var(--be-font-display)', fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(201,150,26,0.85)', margin: 0 }}>
            Your Alts
          </p>
          <button
            onClick={() => setModalOpen(true)}
            style={{ padding: '4px 12px', background: 'transparent', border: '1px solid rgba(201,150,26,0.3)', borderRadius: 4, color: 'rgba(201,150,26,0.8)', fontFamily: 'var(--be-font-display)', fontSize: '0.62rem', letterSpacing: '0.12em', cursor: 'pointer' }}
            onMouseEnter={(e) => { ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,150,26,0.7)'; (e.currentTarget as HTMLElement).style.color = '#c9961a' }}
            onMouseLeave={(e) => { ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,150,26,0.3)'; (e.currentTarget as HTMLElement).style.color = 'rgba(201,150,26,0.8)' }}
          >
            + ADD ALT
          </button>
        </div>

        {/* Alt cards — two-column grid */}
        {alts.length > 0 && (
          <div className="alts-grid">
            {alts.map((alt) => {
              const color = CLASS_COLORS[alt.class] ?? '#888'
              console.log('Alt name from DB:', alt.name, 'charCodes:', [...alt.name].map(c => c.charCodeAt(0)))
              return (
                <div key={alt.id} className="alt-card" style={{ borderLeft: `4px solid ${color}` }}>
                  <div className="alt-card-left">
                    <span className="alt-card-name" data-character-name style={{ color, textTransform: 'none', fontVariant: 'normal', fontVariantCaps: 'normal', fontVariantLigatures: 'none', WebkitFontFeatureSettings: '"case" 0', fontFeatureSettings: '"case" 0' }}>
                      {alt.name}
                    </span>
                    <span className="alt-card-sub">
                      {[alt.class.charAt(0) + alt.class.slice(1).toLowerCase().replace('_', ' '), alt.race, `Level ${alt.level}`].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                  <div className="alt-card-professions">{altProfessions(alt.professions)}</div>
                </div>
              )
            })}
          </div>
        )}

        {/* Add Alt big button */}
        <div className="alts-tile-footer" style={{ padding: alts.length === 0 ? '0 40px 32px' : '8px 40px 32px' }}>
          {alts.length === 0 && (
            <p style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', color: 'rgba(138,122,90,0.55)', fontSize: '0.9rem', textAlign: 'center', marginBottom: 20 }}>
              Your allies await. Bring your alts into the fold.
            </p>
          )}
          <button className="add-alt-btn" onClick={() => setModalOpen(true)}>
            <div className="alt-btn-figures">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/characters/Gnome_Warrior_M.png"   className="alt-fig alt-fig-1" alt="" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/characters/Human_Priest_M.png"    className="alt-fig alt-fig-2" alt="" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/characters/Draenei_Shaman_M.png"  className="alt-fig alt-fig-3" alt="" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/characters/NightElf_Druid_F.png"  className="alt-fig alt-fig-4" alt="" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/characters/Dwarf_Rogue_F.png"     className="alt-fig alt-fig-5" alt="" />
            </div>
            <div className="alt-btn-label">
              <span className="alt-btn-title">Add an Alt</span>
              <span className="alt-btn-sub">Bring another character into the guild</span>
            </div>
          </button>
        </div>
      </div>

      {modalOpen && (
        <AddAltModal
          excludeIds={excludeIds}
          onClose={() => setModalOpen(false)}
          onSuccess={() => { setModalOpen(false); router.refresh() }}
        />
      )}
    </>
  )
}
