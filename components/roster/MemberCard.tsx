import { CLASS_COLORS, CharacterClass } from '@/types'

interface MemberCardProps {
  name: string
  lastName: string | null
  class: CharacterClass
  level: number
  rank: string
}

export function MemberCard({ name, lastName, class: charClass, level, rank }: MemberCardProps) {
  const classColor = CLASS_COLORS[charClass] ?? '#888'

  return (
    <div
      className="member-card relative rounded-md overflow-hidden"
      style={{
        backgroundColor: '#1a1208',
        border: '1px solid #3d2e15',
        borderLeft: `3px solid ${classColor}`,
      }}
    >
      <div className="p-3 flex flex-col gap-1.5">
        {/* Name + Level */}
        <div className="flex items-baseline justify-between gap-2">
          <span
            className="font-semibold truncate"
            style={{ fontFamily: "'Cinzel', serif", fontSize: '1.05rem', color: '#f0e6c8' }}
          >
            {name}{lastName && <span style={{ opacity: 0.65 }}> {lastName}</span>}
          </span>
          <span
            className="flex-shrink-0 text-xs"
            style={{ fontFamily: "'Cinzel', serif", color: '#c9961a' }}
          >
            Lvl {level}
          </span>
        </div>

        {/* Class */}
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: classColor }}
          />
          <span
            className="text-sm font-semibold"
            style={{ fontFamily: "'Crimson Pro', serif", color: classColor }}
          >
            {charClass}
          </span>
        </div>

        {/* Rank */}
        <span
          className="text-xs truncate"
          style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
        >
          {rank}
        </span>
      </div>
    </div>
  )
}
