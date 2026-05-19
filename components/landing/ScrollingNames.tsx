'use client'

export type NameEntry = { name: string; color: string }

interface ScrollingNamesProps {
  entries: NameEntry[]
  speed?: number
  emptyMessage?: string
}

export function ScrollingNames({
  entries,
  speed = 25,
  emptyMessage = 'Be the first to answer.',
}: ScrollingNamesProps) {
  if (entries.length === 0) {
    return (
      <p
        className="text-sm italic text-center mt-4 px-2"
        style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
      >
        {emptyMessage}
      </p>
    )
  }

  // Pad to at least 12 entries so short lists still look like a continuous scroll
  const padded = entries.length < 12
    ? [...Array(Math.ceil(12 / entries.length))].flatMap(() => entries)
    : entries

  // Duplicate for seamless loop: animate from 0 to -50%
  const doubled = [...padded, ...padded]

  return (
    <div style={{ height: '280px', overflow: 'hidden' }}>
      <div style={{ animation: `scroll-names ${speed}s linear infinite`, willChange: 'transform' }}>
        {doubled.map((e, i) => (
          <div
            key={i}
            className="py-1 px-2 text-sm"
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '0.78rem',
              color: e.color,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {e.name}
          </div>
        ))}
      </div>
    </div>
  )
}
