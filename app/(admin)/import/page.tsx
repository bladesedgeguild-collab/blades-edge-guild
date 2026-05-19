'use client'

import { useRef, useState } from 'react'

type ImportResult = {
  added: number
  updated: number
  professions: number
  errors: string[]
  total: number
}

type ParsedPreview = {
  count: number
  sample: { name: string; class: string; level: number }[]
  raw: unknown
}

function extractMembers(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    for (const key of ['members', 'roster', 'characters', 'data', 'guild']) {
      if (Array.isArray(obj[key])) return obj[key] as unknown[]
    }
  }
  return []
}

function parseRoster(text: string): ParsedPreview | { error: string } {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { error: 'Invalid JSON — check for syntax errors.' }
  }

  const members = extractMembers(raw)
  if (members.length === 0) {
    return { error: 'No characters found. Expected an array or an object with a "members" / "roster" key.' }
  }

  const sample = members.slice(0, 3).map((m) => {
    const o = m as Record<string, unknown>
    return {
      name: String(o.name ?? ''),
      class: String(o.class ?? o.className ?? ''),
      level: Number(o.level ?? 0),
    }
  })

  return { count: members.length, sample, raw }
}

export default function ImportPage() {
  const [jsonText, setJsonText] = useState('')
  const [preview, setPreview] = useState<ParsedPreview | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleParse() {
    if (!jsonText.trim()) { setParseError('Paste your JSON first.'); return }
    const parsed = parseRoster(jsonText)
    if ('error' in parsed) {
      setParseError(parsed.error)
      setPreview(null)
    } else {
      setParseError(null)
      setPreview(parsed)
      setResult(null)
      setImportError(null)
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setJsonText(text)
      setResult(null)
      setPreview(null)
      setParseError(null)
      setImportError(null)
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (!preview) return
    setImporting(true)
    setImportError(null)
    try {
      const res = await fetch('/api/import/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: preview.raw }),
      })
      const data = await res.json()
      if (!res.ok) {
        setImportError(data.error ?? 'Import failed')
      } else {
        setResult(data)
        setPreview(null)
      }
    } catch {
      setImportError('Network error — check your connection and try again.')
    } finally {
      setImporting(false)
    }
  }

  const inputStyle = { backgroundColor: '#0a0f1e', border: '1px solid #1e2a45', color: '#e2e8f0' }

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold mb-2" style={{ color: '#c9a84c' }}>
        Import Roster
      </h1>
      <p className="text-sm mb-8" style={{ color: '#6b7a99' }}>
        Paste or upload <code className="px-1 py-0.5 rounded text-xs" style={{ backgroundColor: '#1e2a45', color: '#c9a84c' }}>blades_edge_roster.json</code> to
        upsert characters and professions. Existing returned characters keep their status and claims.
      </p>

      {/* ── Input ── */}
      <div
        className="rounded-xl border p-6 flex flex-col gap-4 mb-6"
        style={{ backgroundColor: '#0d1326', borderColor: '#1e2a45' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">Roster JSON</span>
          <label
            className="text-xs px-3 py-1.5 rounded cursor-pointer font-medium hover:opacity-80 transition-opacity"
            style={{ backgroundColor: '#1e2a45', color: '#8fa3c8' }}
          >
            Upload file
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFile}
            />
          </label>
        </div>

        <textarea
          value={jsonText}
          onChange={(e) => { setJsonText(e.target.value); setPreview(null); setResult(null) }}
          placeholder={'[\n  {\n    "name": "Åvatarødys",\n    "class": "MAGE",\n    "level": 60,\n    "rankName": "Guild Master",\n    "rankIndex": 0,\n    "professions": [...]\n  }\n]'}
          rows={14}
          className="w-full rounded-md px-3 py-2 text-sm font-mono resize-y outline-none focus:ring-1 focus:ring-[#c9a84c]"
          style={inputStyle}
          spellCheck={false}
        />

        {parseError && (
          <p className="text-sm text-red-400">{parseError}</p>
        )}

        <button
          onClick={handleParse}
          disabled={!jsonText.trim()}
          className="self-start px-5 py-2 rounded-md text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
          style={{ backgroundColor: '#1e2a45', color: '#c9a84c' }}
        >
          Preview import
        </button>
      </div>

      {/* ── Preview ── */}
      {preview && (
        <div
          className="rounded-xl border p-6 flex flex-col gap-4 mb-6"
          style={{ backgroundColor: '#0d1326', borderColor: '#c9a84c' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">
                {preview.count} character{preview.count !== 1 ? 's' : ''} ready to import
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#6b7a99' }}>
                New characters will be added as MIA. Existing ones will be updated (status preserved).
              </p>
            </div>
          </div>

          {/* Sample rows */}
          <div className="rounded-md overflow-hidden" style={{ border: '1px solid #1e2a45' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#060b18', color: '#6b7a99' }}>
                  <th className="text-left px-3 py-2 font-medium">Name</th>
                  <th className="text-left px-3 py-2 font-medium">Class</th>
                  <th className="text-left px-3 py-2 font-medium">Level</th>
                </tr>
              </thead>
              <tbody>
                {preview.sample.map((c, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #1e2a45' }}>
                    <td className="px-3 py-2 text-white">{c.name || '—'}</td>
                    <td className="px-3 py-2" style={{ color: '#8fa3c8' }}>{c.class || '—'}</td>
                    <td className="px-3 py-2" style={{ color: '#8fa3c8' }}>{c.level || '—'}</td>
                  </tr>
                ))}
                {preview.count > 3 && (
                  <tr style={{ borderTop: '1px solid #1e2a45' }}>
                    <td colSpan={3} className="px-3 py-2 text-xs" style={{ color: '#6b7a99' }}>
                      … and {preview.count - 3} more
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {importError && (
            <p className="text-sm text-red-400">{importError}</p>
          )}

          <button
            onClick={handleImport}
            disabled={importing}
            className="self-start px-6 py-2.5 rounded-md text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: '#c9a84c', color: '#0a0f1e' }}
          >
            {importing
              ? `Importing ${preview.count} characters…`
              : `Import ${preview.count} characters`}
          </button>
        </div>
      )}

      {/* ── Result ── */}
      {result && (
        <div
          className="rounded-xl border p-6 flex flex-col gap-4"
          style={{ backgroundColor: '#0d1326', borderColor: '#166534' }}
        >
          <p className="text-lg font-bold" style={{ color: '#4ade80' }}>
            Import complete
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total processed', value: result.total },
              { label: 'Characters added', value: result.added },
              { label: 'Characters updated', value: result.updated },
              { label: 'Professions saved', value: result.professions },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-lg p-3 text-center"
                style={{ backgroundColor: '#060b18' }}
              >
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs mt-0.5" style={{ color: '#6b7a99' }}>{label}</p>
              </div>
            ))}
          </div>

          {result.errors.length > 0 && (
            <details className="mt-2">
              <summary
                className="text-sm cursor-pointer hover:text-white transition-colors"
                style={{ color: '#6b7a99' }}
              >
                {result.errors.length} warning{result.errors.length !== 1 ? 's' : ''}
              </summary>
              <ul className="mt-2 text-xs space-y-1" style={{ color: '#f87171' }}>
                {result.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </details>
          )}

          <button
            onClick={() => { setResult(null); setJsonText(''); setParseError(null) }}
            className="self-start text-xs hover:text-white transition-colors"
            style={{ color: '#6b7a99' }}
          >
            Import another file
          </button>
        </div>
      )}
    </div>
  )
}
