'use client'

import { useRef, useState } from 'react'

type DiffNew = { status: 'NEW'; name: string; change: string }
type DiffUpdated = { status: 'UPDATED'; dbName: string; uploadedName: string; change: string; dbId: string }
type DiffMissing = { name: string; id: string }

type DiffResult = {
  new: DiffNew[]
  updated: DiffUpdated[]
  unchanged: number
  missing: DiffMissing[]
  hasLastOnline: boolean
}

type ApplyResult = {
  added: number
  updated: number
  errors: string[]
  total: number
}

type Step = 'upload' | 'preview' | 'done'

const sectionHeading: React.CSSProperties = {
  fontFamily: "'Cinzel', serif",
  color: '#c9961a',
  fontSize: '1.1rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  marginBottom: '1rem',
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#1a1208',
  border: '1px solid #3d2e15',
  borderRadius: 12,
  padding: '1.5rem',
}

export function OfficersClient() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [rawData, setRawData] = useState<object | null>(null)
  const [fileReady, setFileReady] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const [parseError, setParseError] = useState<string | null>(null)
  const [diff, setDiff] = useState<DiffResult | null>(null)
  const [diffLoading, setDiffLoading] = useState(false)
  const [diffError, setDiffError] = useState<string | null>(null)
  const [applyLoading, setApplyLoading] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [applyResult, setApplyResult] = useState<ApplyResult | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setParseError(null)
    setDiff(null)
    setApplyResult(null)
    setStep('upload')
    setFileReady(false)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chars: any[] = parsed.characters ?? (Array.isArray(parsed) ? parsed : [])
        if (chars.length === 0) {
          setParseError('No characters array found in file.')
          setRawData(null)
          setFileReady(false)
          return
        }
        setRawData(parsed as object)
        setCharCount(chars.length)
        setFileReady(true)
      } catch {
        setParseError('Invalid JSON — could not parse file.')
        setRawData(null)
        setFileReady(false)
      }
    }
    reader.readAsText(file)
  }

  async function handlePreview() {
    if (!rawData) return
    setDiffLoading(true)
    setDiffError(null)
    try {
      const res = await fetch('/api/officers/roster-diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rawData),
      })
      const data = await res.json()
      if (!res.ok) {
        setDiffError(data.error ?? 'Failed to compute diff')
      } else {
        setDiff(data)
        setStep('preview')
      }
    } catch {
      setDiffError('Network error — check your connection.')
    } finally {
      setDiffLoading(false)
    }
  }

  async function handleApply() {
    if (!rawData) return
    setApplyLoading(true)
    setApplyError(null)
    try {
      const res = await fetch('/api/officers/roster-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rawData),
      })
      const data = await res.json()
      if (!res.ok) {
        setApplyError(data.error ?? 'Apply failed')
      } else {
        setApplyResult(data)
        setStep('done')
        setRawData(null)
        setFileReady(false)
        if (fileRef.current) fileRef.current.value = ''
      }
    } catch {
      setApplyError('Network error — check your connection.')
    } finally {
      setApplyLoading(false)
    }
  }

  function handleCancel() {
    setStep('upload')
    setDiff(null)
    setRawData(null)
    setFileReady(false)
    setParseError(null)
    setDiffError(null)
    setApplyError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const hasChanges = diff && (diff.new.length > 0 || diff.updated.length > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

      {/* ── ROSTER SYNC ── */}
      <section>
        <p style={sectionHeading}>Roster Sync</p>

        {/* Step 1: Upload */}
        {(step === 'upload' || step === 'preview') && (
          <div style={{ ...cardStyle, marginBottom: step === 'preview' ? '1.5rem' : 0 }}>
            <div
              style={{
                border: '2px dashed #c9961a',
                borderRadius: 8,
                backgroundColor: '#241a0e',
                padding: '1.5rem',
                textAlign: 'center',
                position: 'relative',
                cursor: 'pointer',
              }}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                onChange={handleFile}
                style={{ display: 'none' }}
              />
              <p style={{ fontFamily: "'Cinzel', serif", color: '#c9961a', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                Drop your roster JSON here or click to browse
              </p>
              <p style={{ fontFamily: "'Spectral', serif", color: '#8a7a5a', fontSize: '0.8rem', fontStyle: 'italic' }}>
                Generate this file by uploading your GRM .lua to Claude
              </p>
            </div>

            {parseError && (
              <p style={{ color: '#f87171', fontFamily: "'Spectral', serif", fontSize: '0.85rem', marginTop: '0.75rem' }}>
                {parseError}
              </p>
            )}

            {fileReady && !parseError && (
              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <p style={{ fontFamily: "'Spectral', serif", color: '#1aff6e', fontSize: '0.9rem' }}>
                  {charCount} characters found in file
                </p>
                {diffError && (
                  <p style={{ color: '#f87171', fontFamily: "'Spectral', serif", fontSize: '0.85rem' }}>
                    {diffError}
                  </p>
                )}
                <button
                  onClick={handlePreview}
                  disabled={diffLoading}
                  style={{
                    backgroundColor: '#c9961a',
                    color: '#0d0b07',
                    border: 'none',
                    borderRadius: 6,
                    padding: '0.5rem 1.25rem',
                    fontFamily: "'Cinzel', serif",
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: diffLoading ? 'not-allowed' : 'pointer',
                    opacity: diffLoading ? 0.6 : 1,
                  }}
                >
                  {diffLoading ? 'Computing diff…' : 'Preview Changes →'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Diff Preview */}
        {step === 'preview' && diff && (
          <div style={cardStyle}>
            {/* Summary */}
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.8rem', color: '#1aff6e' }}>
                {diff.new.length} new
              </span>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.8rem', color: '#c9961a' }}>
                {diff.updated.length} updated
              </span>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.8rem', color: '#8a7a5a' }}>
                {diff.missing.length} missing
              </span>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.8rem', color: '#3d2e15' }}>
                {diff.unchanged} unchanged
              </span>
            </div>

            {!hasChanges && diff.missing.length === 0 ? (
              <p style={{ fontFamily: "'Spectral', serif", color: '#8a7a5a', fontSize: '0.9rem', fontStyle: 'italic', marginBottom: '1rem' }}>
                Everything is up to date — nothing to apply.
              </p>
            ) : (
              <div
                style={{
                  border: '1px solid #3d2e15',
                  borderRadius: 6,
                  overflow: 'hidden',
                  maxHeight: 400,
                  overflowY: 'auto',
                  marginBottom: '1.25rem',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0d0b07', position: 'sticky', top: 0 }}>
                      <th style={{ textAlign: 'left', padding: '8px 12px', fontFamily: "'Cinzel', serif", color: '#8a7a5a', fontSize: '0.75rem', fontWeight: 600 }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', fontFamily: "'Cinzel', serif", color: '#8a7a5a', fontSize: '0.75rem', fontWeight: 600 }}>Name</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', fontFamily: "'Cinzel', serif", color: '#8a7a5a', fontSize: '0.75rem', fontWeight: 600 }}>Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diff.new.map((entry, i) => (
                      <tr key={`new-${i}`} style={{ borderTop: '1px solid #3d2e15' }}>
                        <td style={{ padding: '7px 12px', color: '#1aff6e', fontFamily: "'Cinzel', serif", fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                          🟢 NEW
                        </td>
                        <td style={{ padding: '7px 12px', color: '#f0e6c8', fontFamily: "'Cinzel', serif", fontSize: '0.8rem' }}>
                          {entry.name}
                        </td>
                        <td style={{ padding: '7px 12px', color: '#8a7a5a', fontFamily: "'Spectral', serif", fontSize: '0.82rem' }}>
                          {entry.change}
                        </td>
                      </tr>
                    ))}
                    {diff.updated.map((entry, i) => (
                      <tr key={`upd-${i}`} style={{ borderTop: '1px solid #3d2e15' }}>
                        <td style={{ padding: '7px 12px', color: '#c9961a', fontFamily: "'Cinzel', serif", fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                          🟡 UPDATED
                        </td>
                        <td style={{ padding: '7px 12px', color: '#f0e6c8', fontFamily: "'Cinzel', serif", fontSize: '0.8rem' }}>
                          {entry.dbName}
                        </td>
                        <td style={{ padding: '7px 12px', color: '#c9961a', fontFamily: "'Spectral', serif", fontSize: '0.82rem' }}>
                          {entry.change}
                        </td>
                      </tr>
                    ))}
                    {diff.missing.map((entry, i) => (
                      <tr key={`mis-${i}`} style={{ borderTop: '1px solid #3d2e15' }}>
                        <td style={{ padding: '7px 12px', color: '#ef4444', fontFamily: "'Cinzel', serif", fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                          🔴 MISSING
                        </td>
                        <td style={{ padding: '7px 12px', color: '#f0e6c8', fontFamily: "'Cinzel', serif", fontSize: '0.8rem' }}>
                          {entry.name}
                        </td>
                        <td style={{ padding: '7px 12px', color: '#8a7a5a', fontFamily: "'Spectral', serif", fontSize: '0.82rem', fontStyle: 'italic' }}>
                          Not in export — may have left
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {applyError && (
              <p style={{ color: '#f87171', fontFamily: "'Spectral', serif", fontSize: '0.85rem', marginBottom: '1rem' }}>
                {applyError}
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {hasChanges && (
                <button
                  onClick={handleApply}
                  disabled={applyLoading}
                  style={{
                    backgroundColor: '#c9961a',
                    color: '#0d0b07',
                    border: 'none',
                    borderRadius: 6,
                    padding: '0.5rem 1.25rem',
                    fontFamily: "'Cinzel', serif",
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: applyLoading ? 'not-allowed' : 'pointer',
                    opacity: applyLoading ? 0.6 : 1,
                  }}
                >
                  {applyLoading ? 'Applying…' : 'Apply Changes'}
                </button>
              )}
              <button
                onClick={handleCancel}
                disabled={applyLoading}
                style={{
                  backgroundColor: 'transparent',
                  color: '#8a7a5a',
                  border: '1px solid #3d2e15',
                  borderRadius: 6,
                  padding: '0.5rem 1.25rem',
                  fontFamily: "'Cinzel', serif",
                  fontSize: '0.8rem',
                  cursor: applyLoading ? 'not-allowed' : 'pointer',
                  opacity: applyLoading ? 0.6 : 1,
                }}
              >
                {hasChanges ? 'Cancel' : 'Reset'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 'done' && applyResult && (
          <div style={cardStyle}>
            <p style={{ fontFamily: "'Cinzel', serif", color: '#1aff6e', fontSize: '1rem', marginBottom: '0.75rem' }}>
              Import complete. {applyResult.added} added, {applyResult.updated} updated.
            </p>
            {applyResult.errors.length > 0 && (
              <details style={{ marginBottom: '0.75rem' }}>
                <summary style={{ fontFamily: "'Spectral', serif", color: '#8a7a5a', fontSize: '0.85rem', cursor: 'pointer' }}>
                  {applyResult.errors.length} warning{applyResult.errors.length !== 1 ? 's' : ''}
                </summary>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
                  {applyResult.errors.map((e, i) => (
                    <li key={i} style={{ color: '#f87171', fontSize: '0.8rem', fontFamily: "'Spectral', serif" }}>{e}</li>
                  ))}
                </ul>
              </details>
            )}
            <button
              onClick={() => { setStep('upload'); setApplyResult(null); setDiff(null) }}
              style={{
                background: 'none',
                border: 'none',
                color: '#8a7a5a',
                fontFamily: "'Spectral', serif",
                fontSize: '0.85rem',
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              Import another file
            </button>
          </div>
        )}
      </section>

      {/* ── MEMBER APPROVALS (placeholder) ── */}
      <section>
        <p style={sectionHeading}>Member Approvals</p>
        <div style={{ ...cardStyle, opacity: 0.6 }}>
          <p style={{ fontFamily: "'Spectral', serif", color: '#8a7a5a', fontSize: '0.9rem', fontStyle: 'italic' }}>
            Approval queue and character claims — coming soon.
          </p>
        </div>
      </section>
    </div>
  )
}
