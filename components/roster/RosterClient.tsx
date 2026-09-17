'use client'

import { useMemo, useState } from 'react'
import { MemberCard } from '@/components/roster/MemberCard'
import { CharacterClass } from '@/types'

type Char = {
  id: string
  name: string
  last_name: string | null
  class: CharacterClass
  level: number
  rank_name: string | null
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[åàáâãäæ]/g, 'a')
    .replace(/[ðď]/g, 'd')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[øòóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ýÿ]/g, 'y')
    .replace(/[ß]/g, 'b')
    .replace(/[þ]/g, 't')
    .replace(/[ñ]/g, 'n')
}

export function RosterClient({ characters }: { characters: Char[] }) {
  const [query, setQuery] = useState('')
  const [classFilter, setClassFilter] = useState<string | null>(null)

  const classes = useMemo(
    () => [...new Set(characters.map((c) => c.class))].sort(),
    [characters]
  )

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    return characters.filter((c) => {
      if (classFilter && c.class !== classFilter) return false
      if (!q) return true
      return normalize(`${c.name} ${c.last_name ?? ''}`).includes(q)
    })
  }, [characters, query, classFilter])

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name…"
          className="px-3 py-2 rounded text-sm outline-none focus:ring-1 focus:ring-[#c9961a]"
          style={{ backgroundColor: '#0d0b07', border: '1px solid #3d2e15', color: '#f0e6c8', fontFamily: "'Crimson Pro', serif", flex: 1 }}
        />
        <select
          value={classFilter ?? ''}
          onChange={(e) => setClassFilter(e.target.value || null)}
          className="px-3 py-2 rounded text-sm outline-none focus:ring-1 focus:ring-[#c9961a] cursor-pointer"
          style={{ backgroundColor: '#0d0b07', border: '1px solid #3d2e15', color: '#f0e6c8', fontFamily: "'Crimson Pro', serif", minWidth: 160 }}
        >
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase().replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: '#6b7a99' }}>No characters match.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((c) => (
            <MemberCard
              key={c.id}
              name={c.name}
              lastName={c.last_name}
              class={c.class}
              level={c.level}
              rank={c.rank_name ?? 'Member'}
            />
          ))}
        </div>
      )}
    </div>
  )
}
