'use client'

import { useEffect, useRef, useState } from 'react'

type RosterPreview = {
  total: number
  returned: number
  newCount: number
  mia: number
  sample: { name: string; class: string; status: string }[]
}

type ImportResult = {
  imported: number
  errors: string[]
  total: number
}

const STATUS_COLORS: Record<string, string> = {
  returned: '#1aff6e',
  new: '#3fc7eb',
  mia: '#8a7a5a',
}

const inputStyle = {
  backgroundColor: '#0d0b07',
  border: '1px solid #3d2e15',
  color: '#f0e6c8',
  fontFamily: "'Crimson Pro', serif",
}

export default function ImportPage() {
  // ── Section 1: Roster Import ──
  const fileRef = useRef<HTMLInputElement>(null)
  const [rosterData, setRosterData] = useState<unknown>(null)
  const [preview, setPreview] = useState<RosterPreview | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  // ── Section 2: Manual Status Update ──
  const [charName, setCharName] = useState('')
  const [newStatus, setNewStatus] = useState('returned')
  const [updating, setUpdating] = useState(false)
  const [updateMsg, setUpdateMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setParseError(null)
    setResult(null)
    setImportError(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chars: any[] = parsed.characters ?? (Array.isArray(parsed) ? parsed : [])
        if (chars.length === 0) {
          setParseError('No characters array found in file.')
          setPreview(null)
          setRosterData(null)
          return
        }
        setRosterData(parsed)
        setPreview({
          total: chars.length,
          returned: chars.filter((c) => c.status === 'returned').length,
          newCount: chars.filter((c) => c.status === 'new').length,
          mia: chars.filter((c) => c.status === 'mia').length,
          sample: chars.slice(0, 20).map((c) => ({
            name: String(c.name ?? ''),
            class: String(c.class ?? ''),
            status: String(c.status ?? 'mia'),
          })),
        })
      } catch {
        setParseError('Invalid JSON — could not parse file.')
        setPreview(null)
        setRosterData(null)
      }
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (!rosterData) return
    setImporting(true)
    setImportError(null)
    try {
      const res = await fetch('/api/admin/import-roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rosterData),
      })
      const data = await res.json()
      if (!res.ok) {
        setImportError(data.error ?? 'Import failed')
      } else {
        setResult(data)
        setPreview(null)
        setRosterData(null)
        if (fileRef.current) fileRef.current.value = ''
      }
    } catch {
      setImportError('Network error — check your connection.')
    } finally {
      setImporting(false)
    }
  }

  // Autocomplete for character name
  useEffect(() => {
    if (charName.length < 2) { setSuggestions([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/characters/search?q=${encodeURIComponent(charName)}`)
        if (res.ok) {
          const data = (await res.json()) as { name: string }[]
          setSuggestions(data.map((c) => c.name).slice(0, 8))
        }
      } catch { /* ignore */ }
    }, 300)
    return () => clearTimeout(t)
  }, [charName])

  async function handleStatusUpdate() {
    if (!charName.trim()) return
    setUpdating(true)
    setUpdateMsg(null)
    try {
      const res = await fetch('/api/admin/characters', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: charName.trim(), realm: 'Dreamscythe', status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) {
        setUpdateMsg({ text: data.error ?? 'Update failed', ok: false })
      } else {
        setUpdateMsg({ text: `${charName.trim()} updated to ${newStatus}.`, ok: true })
        setCharName('')
        setSuggestions([])
      }
    } catch {
      setUpdateMsg({ text: 'Network error.', ok: false })
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-10">

      {/* ── Section 1: Roster Import ── */}
      <section>
        <h1
          className="text-3xl font-bold mb-1"
          style={{ fontFamily: "'Cinzel', serif", color: '#c9961a' }}
        >
          Import Guild Roster
        </h1>
        <p
          className="text-sm mb-6"
          style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
        >
          Upload <code className="px-1 rounded text-xs" style={{ backgroundColor: '#241a0e', color: '#c9961a' }}>blades_edge_roster.json</code> to
          seed the character database. Existing characters are updated; new ones are inserted.
          <span className="block mt-1" style={{ color: '#3d2e15' }}>
            Requires migration 003_hide_from_roster.sql to be applied in Supabase first.
          </span>
        </p>

        <div
          className="rounded-xl border p-6 flex flex-col gap-5"
          style={{ backgroundColor: '#241a0e', borderColor: '#3d2e15' }}
        >
          {/* File picker */}
          <div className="flex items-center gap-4">
            <label
              className="px-4 py-2 rounded text-sm font-semibold cursor-pointer transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#3d2e15', color: '#c9961a', fontFamily: "'Cinzel', serif" }}
            >
              Choose file
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFile}
              />
            </label>
            <span
              className="text-sm italic"
              style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
            >
              {rosterData ? 'File loaded — see preview below' : 'No file selected'}
            </span>
          </div>

          {parseError && (
            <p className="text-sm text-red-400">{parseError}</p>
          )}

          {/* Preview */}
          {preview && (
            <div className="flex flex-col gap-4">
              {/* Status counts */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Total', value: preview.total, color: '#f0e6c8' },
                  { label: 'Returned', value: preview.returned, color: '#1aff6e' },
                  { label: 'New', value: preview.newCount, color: '#3fc7eb' },
                  { label: 'MIA', value: preview.mia, color: '#8a7a5a' },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="rounded-lg p-3 text-center"
                    style={{ backgroundColor: '#1a1208' }}
                  >
                    <p className="text-xl font-bold" style={{ color }}>{value}</p>
                    <p className="text-xs mt-0.5" style={{ fontFamily: "'Cinzel', serif", color: '#8a7a5a' }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Sample list */}
              <div
                className="rounded-md overflow-hidden"
                style={{ border: '1px solid #3d2e15', maxHeight: '220px', overflowY: 'auto' }}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: '#1a1208', position: 'sticky', top: 0 }}>
                      <th className="text-left px-3 py-2 text-xs font-semibold" style={{ fontFamily: "'Cinzel', serif", color: '#8a7a5a' }}>Name</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold" style={{ fontFamily: "'Cinzel', serif", color: '#8a7a5a' }}>Class</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold" style={{ fontFamily: "'Cinzel', serif", color: '#8a7a5a' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sample.map((c, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #3d2e15' }}>
                        <td className="px-3 py-1.5" style={{ fontFamily: "'Cinzel', serif", fontSize: '0.8rem', color: '#f0e6c8' }}>{c.name}</td>
                        <td className="px-3 py-1.5" style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}>{c.class}</td>
                        <td className="px-3 py-1.5">
                          <span
                            className="text-xs"
                            style={{ fontFamily: "'Cinzel', serif", color: STATUS_COLORS[c.status] ?? '#8a7a5a' }}
                          >
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {preview.total > 20 && (
                      <tr style={{ borderTop: '1px solid #3d2e15' }}>
                        <td colSpan={3} className="px-3 py-2 text-xs italic" style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}>
                          … and {preview.total - 20} more characters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {importError && <p className="text-sm text-red-400">{importError}</p>}

              <button
                onClick={handleImport}
                disabled={importing}
                className="self-start px-6 py-2.5 rounded text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#c9961a', color: '#0d0b07', fontFamily: "'Cinzel', serif" }}
              >
                {importing ? `Importing ${preview.total} characters…` : `Import ${preview.total} characters`}
              </button>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="flex flex-col gap-3">
              <p
                className="font-semibold"
                style={{ fontFamily: "'Cinzel', serif", color: '#1aff6e' }}
              >
                Imported {result.imported} of {result.total} characters successfully.
              </p>
              {result.errors.length > 0 && (
                <details>
                  <summary
                    className="text-sm cursor-pointer"
                    style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
                  >
                    {result.errors.length} warning{result.errors.length !== 1 ? 's' : ''}
                  </summary>
                  <ul className="mt-2 space-y-1">
                    {result.errors.map((e, i) => (
                      <li key={i} className="text-xs text-red-400">{e}</li>
                    ))}
                  </ul>
                </details>
              )}
              <button
                onClick={() => setResult(null)}
                className="self-start text-xs hover:text-white transition-colors"
                style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
              >
                Import another file
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Section 2: Manual Status Update ── */}
      <section>
        <h2
          className="text-xl font-bold mb-1"
          style={{ fontFamily: "'Cinzel', serif", color: '#c9961a' }}
        >
          Update Character Status
        </h2>
        <p
          className="text-sm mb-6"
          style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
        >
          Manually set a single character&apos;s status in the Dreamscythe realm.
        </p>

        <div
          className="rounded-xl border p-6 flex flex-col gap-4"
          style={{ backgroundColor: '#241a0e', borderColor: '#3d2e15' }}
        >
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Character name with autocomplete */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Character name"
                value={charName}
                onChange={(e) => { setCharName(e.target.value); setShowSuggestions(true) }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onFocus={() => setShowSuggestions(true)}
                className="w-full px-3 py-2 rounded text-sm outline-none focus:ring-1 focus:ring-[#c9961a]"
                style={inputStyle}
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul
                  className="absolute z-20 w-full mt-1 rounded shadow-lg overflow-hidden"
                  style={{ backgroundColor: '#1a1208', border: '1px solid #3d2e15' }}
                >
                  {suggestions.map((s) => (
                    <li
                      key={s}
                      className="px-3 py-2 cursor-pointer text-sm hover:opacity-80"
                      style={{ fontFamily: "'Cinzel', serif", color: '#f0e6c8', fontSize: '0.85rem' }}
                      onMouseDown={() => { setCharName(s); setSuggestions([]); setShowSuggestions(false) }}
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Status dropdown */}
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="px-3 py-2 rounded text-sm outline-none focus:ring-1 focus:ring-[#c9961a] cursor-pointer"
              style={{ ...inputStyle, minWidth: '130px' }}
            >
              <option value="returned">Returned</option>
              <option value="mia">MIA</option>
              <option value="new">New</option>
            </select>

            <button
              onClick={handleStatusUpdate}
              disabled={updating || !charName.trim()}
              className="px-5 py-2 rounded text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: '#c9961a', color: '#0d0b07', fontFamily: "'Cinzel', serif" }}
            >
              {updating ? 'Updating…' : 'Update'}
            </button>
          </div>

          {updateMsg && (
            <p
              className="text-sm"
              style={{ color: updateMsg.ok ? '#1aff6e' : '#f87171', fontFamily: "'Crimson Pro', serif" }}
            >
              {updateMsg.text}
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
