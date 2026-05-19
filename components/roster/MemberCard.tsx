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
        backgroundColor: '#241a0e',
        border: '1px solid #3d2e15',
        borderLeft: `3px solid ${classColor}`,
      }}
    >
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: classColor }}
          />
          <span
            className="font-semibold text-sm truncate"
            style={{ fontFamily: "'Cinzel', serif", color: '#f0e6c8' }}
          >
            {name}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1">
          <span
            className="text-xs"
            style={{ fontFamily: "'Crimson Pro', serif", color: classColor }}
          >
            {charClass}
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{
              fontFamily: "'Crimson Pro', serif",
              backgroundColor: '#1a1208',
              color: '#8a7a5a',
            }}
          >
            Lvl {level}
          </span>
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-1">
          <span
            className="text-xs truncate"
            style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
          >
            {rank}
          </span>
          {isReturned ? (
            <span
              className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
              style={{
                fontFamily: "'Cinzel', serif",
                backgroundColor: 'rgba(26,255,110,0.12)',
                color: '#1aff6e',
                border: '1px solid rgba(26,255,110,0.3)',
              }}
            >
              Returned
            </span>
          ) : (
            <span
              className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
              style={{
                fontFamily: "'Crimson Pro', serif",
                backgroundColor: 'transparent',
                color: '#8a7a5a',
                border: '1px solid #3d2e15',
              }}
            >
              MIA
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
