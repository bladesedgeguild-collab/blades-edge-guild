import { CLASS_COLORS, CharacterClass, CharacterStatus } from '@/types'

interface MemberCardProps {
  name: string
  class: CharacterClass
  level: number
  rank: string
  status: CharacterStatus
}

export function MemberCard({ name, class: charClass, level, rank, status }: MemberCardProps) {
  const classColor = CLASS_COLORS[charClass] ?? '#888'
  const isReturned = status === 'returned'

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
            {name}
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

        {/* Rank + Status */}
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-xs truncate"
            style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
          >
            {rank}
          </span>
          {isReturned ? (
            <span className="flex items-center gap-1 flex-shrink-0">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: '#1aff6e' }}
              />
              <span
                className="text-xs"
                style={{ fontFamily: "'Cinzel', serif", color: '#1aff6e' }}
              >
                Returned
              </span>
            </span>
          ) : (
            <span
              className="text-xs flex-shrink-0"
              style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
            >
              · MIA
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
