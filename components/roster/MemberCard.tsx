import { Badge } from '@/components/ui/badge'
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
      className="relative rounded-md overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
      style={{
        backgroundColor: '#0d1326',
        borderLeft: `3px solid ${classColor}`,
        border: `1px solid #1e2a45`,
        borderLeftColor: classColor,
        borderLeftWidth: '3px',
      }}
    >
      {!isReturned && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: 'rgba(60,80,120,0.18)' }}
        />
      )}

      <div className="p-3 relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: classColor }}
          />
          <span className="font-semibold text-sm text-white truncate">{name}</span>
        </div>

        <div className="flex items-center justify-between gap-1">
          <span className="text-xs" style={{ color: classColor }}>
            {charClass}
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ backgroundColor: '#1e2a45', color: '#8fa3c8' }}
          >
            Lvl {level}
          </span>
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-1">
          <span className="text-xs truncate" style={{ color: '#8fa3c8' }}>
            {rank}
          </span>
          {isReturned ? (
            <Badge
              className="text-xs px-1.5 py-0 h-5"
              style={{ backgroundColor: '#166534', color: '#4ade80', border: 'none' }}
            >
              Returned
            </Badge>
          ) : (
            <Badge
              className="text-xs px-1.5 py-0 h-5"
              style={{ backgroundColor: '#1e2a45', color: '#6b82a8', border: 'none' }}
            >
              MIA
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
