'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type MainChar = {
  id: string
  name: string
  class: string
  race: string | null
  level: number
  rank_name: string | null
}

type AltChar = {
  id: string
  name: string
  class: string
  race: string | null
  level: number
}

interface SettingsClientProps {
  userId: string
  email: string
  isEmailUser: boolean
  discordId: string | null
  discordUsername: string | null
  discordAvatar: string | null
  mainChar: MainChar | null
  alts: AltChar[]
  classColors: Record<string, string>
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  const masked = local.charAt(0) + '****'
  return `${masked}@${domain}`
}

export function SettingsClient({
  email,
  isEmailUser,
  discordId,
  discordUsername,
  discordAvatar,
  mainChar,
  alts: initialAlts,
  classColors,
}: SettingsClientProps) {
  const supabase = createClient()
  const [toast, setToast] = useState<string | null>(null)
  const [alts, setAlts] = useState<AltChar[]>(initialAlts)

  // Release claim state
  const [showRelease, setShowRelease] = useState(false)
  const [releasingClaim, setReleasingClaim] = useState(false)

  // Remove alt state
  const [pendingRemoveAlt, setPendingRemoveAlt] = useState<AltChar | null>(null)
  const [removingAlt, setRemovingAlt] = useState(false)

  // Delete account state
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  async function handlePasswordReset() {
    await supabase.auth.resetPasswordForEmail(email)
    showToast('Password reset email sent.')
  }

  async function handleConnectDiscord() {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?mode=link`,
      },
    })
  }

  async function handleReleaseClaim() {
    setReleasingClaim(true)
    try {
      await fetch('/api/users/release-claim', { method: 'POST' })
      window.location.href = '/onboarding'
    } catch {
      showToast('Something went wrong. Please try again.')
      setReleasingClaim(false)
      setShowRelease(false)
    }
  }

  async function handleRemoveAlt(alt: AltChar) {
    setRemovingAlt(true)
    try {
      const res = await fetch('/api/users/remove-alt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ altId: alt.id }),
      })
      if (res.ok) {
        setAlts(prev => prev.filter(a => a.id !== alt.id))
        showToast(`${alt.name} removed as your alt.`)
      } else {
        showToast('Failed to remove alt. Please try again.')
      }
    } catch {
      showToast('Something went wrong. Please try again.')
    }
    setRemovingAlt(false)
    setPendingRemoveAlt(null)
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true)
    try {
      await fetch('/api/users/delete-account', { method: 'POST' })
      window.location.href = '/'
    } catch {
      showToast('Something went wrong. Please try again.')
      setDeletingAccount(false)
      setShowDeleteAccount(false)
    }
  }

  const maskedEmail = maskEmail(email)

  return (
    <div className="page-container" style={{ paddingTop: '1.75rem', paddingBottom: '3rem' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed', top: 80, right: 24, zIndex: 200,
            background: '#1a1208', border: '1px solid rgba(201,150,26,0.4)',
            borderRadius: 6, padding: '0.75rem 1.25rem',
            fontFamily: "'Spectral', serif", color: '#f0e6c8', fontSize: '0.9rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}>
            {toast}
          </div>
        )}

        {/* Page heading */}
        <h1 style={{
          fontFamily: "'Cinzel', serif", fontSize: '1.1rem', letterSpacing: '0.18em',
          textTransform: 'uppercase', color: 'var(--be-gold)', margin: '0 0 2rem',
        }}>
          Settings
        </h1>

        {/* ── Section 1: Account ── */}
        <section className="settings-section">
          <h2 className="settings-heading">Account</h2>
          <div className="settings-row">
            <span className="settings-label">Email</span>
            <span className="settings-value">{maskedEmail}</span>
          </div>
          {isEmailUser && (
            <div className="settings-row">
              <span className="settings-label">Password</span>
              <button className="settings-btn-secondary" onClick={handlePasswordReset}>
                Send Reset Email
              </button>
            </div>
          )}
          {!isEmailUser && (
            <div className="settings-row">
              <span className="settings-label">Password</span>
              <span className="settings-hint">Signed in via Discord. No password set.</span>
            </div>
          )}
        </section>

        {/* ── Section 2: Discord Connection ── */}
        <section className="settings-section">
          <h2 className="settings-heading">Discord</h2>
          {discordId ? (
            <div className="settings-discord-connected">
              {discordAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={discordAvatar} className="discord-avatar" alt="" />
              ) : (
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: '#5865F2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Cinzel', serif", fontSize: '1rem', color: '#fff',
                }}>
                  {(discordUsername ?? '?').charAt(0)}
                </div>
              )}
              <div>
                <span className="settings-value">Connected as {discordUsername}</span>
                <span className="settings-hint">Discord notifications enabled</span>
              </div>
            </div>
          ) : (
            <div className="settings-row">
              <span className="settings-label">Discord</span>
              <button className="settings-btn-discord" onClick={handleConnectDiscord}>
                Connect Discord
              </button>
            </div>
          )}
        </section>

        {/* ── Section 3: Your Main Character ── */}
        <section className="settings-section">
          <h2 className="settings-heading">Your Main Character</h2>
          {mainChar ? (
            <>
              <div style={{
                background: 'rgba(26,18,8,0.6)', border: '1px solid rgba(61,46,21,0.5)',
                borderRadius: 6, padding: '1.25rem 1.5rem', marginBottom: '1.25rem',
              }}>
                <p style={{
                  fontFamily: "'Cinzel Decorative', serif", fontSize: '1.5rem',
                  color: classColors[mainChar.class] ?? '#c9961a',
                  margin: '0 0 0.4rem', lineHeight: 1.2,
                }}>
                  {mainChar.name}
                </p>
                <p style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', color: 'rgba(138,122,90,0.8)', margin: '0 0 0.5rem', fontSize: '0.9rem' }}>
                  {[mainChar.race, mainChar.class.charAt(0) + mainChar.class.slice(1).toLowerCase().replace('_', ' '), `Level ${mainChar.level}`].filter(Boolean).join(' · ')}
                </p>
                {mainChar.rank_name && (
                  <div className="be-rank-pill" style={{ display: 'inline-block', fontSize: '0.6rem', padding: '2px 10px' }}>
                    {mainChar.rank_name}
                  </div>
                )}
              </div>

              {!showRelease ? (
                <button
                  className="settings-btn-secondary"
                  onClick={() => setShowRelease(true)}
                >
                  Release Claim
                </button>
              ) : (
                <div style={{
                  background: 'rgba(201,150,26,0.05)', border: '1px solid rgba(201,150,26,0.2)',
                  borderRadius: 6, padding: '1rem 1.25rem',
                }}>
                  <p style={{ fontFamily: "'Spectral', serif", color: '#f0e6c8', margin: '0 0 1rem', fontSize: '0.95rem' }}>
                    Are you sure? You will need to go through onboarding again.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      className="settings-btn-danger"
                      onClick={handleReleaseClaim}
                      disabled={releasingClaim}
                    >
                      {releasingClaim ? 'Releasing…' : 'Yes, release my claim'}
                    </button>
                    <button
                      className="settings-btn-secondary"
                      onClick={() => setShowRelease(false)}
                      disabled={releasingClaim}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', color: 'rgba(138,122,90,0.6)', margin: 0 }}>
              No main character claimed.
            </p>
          )}
        </section>

        {/* ── Section 4: Your Alts ── */}
        <section className="settings-section">
          <h2 className="settings-heading">Your Alts</h2>
          {alts.length === 0 ? (
            <p style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', color: 'rgba(138,122,90,0.6)', margin: 0 }}>
              No alts registered.{' '}
              <a href="/my-roster" style={{ color: 'var(--be-gold)', textDecoration: 'underline' }}>
                Add them from My Roster.
              </a>
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {alts.map(alt => (
                <div key={alt.id}>
                  <div className="settings-row" style={{ borderBottom: pendingRemoveAlt?.id === alt.id ? 'none' : undefined }}>
                    <div>
                      <span style={{
                        fontFamily: "'Cinzel', serif", fontSize: '0.85rem',
                        color: classColors[alt.class] ?? '#c9961a',
                      }}>
                        {alt.name}
                      </span>
                      <span style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', color: 'rgba(138,122,90,0.7)', fontSize: '0.8rem', marginLeft: '0.75rem' }}>
                        {[alt.race, alt.class.charAt(0) + alt.class.slice(1).toLowerCase().replace('_', ' '), `Level ${alt.level}`].filter(Boolean).join(' · ')}
                      </span>
                    </div>
                    {pendingRemoveAlt?.id !== alt.id && (
                      <button
                        className="settings-btn-secondary"
                        style={{ fontSize: '0.7rem', padding: '0.3rem 0.75rem' }}
                        onClick={() => setPendingRemoveAlt(alt)}
                      >
                        Remove Alt
                      </button>
                    )}
                  </div>
                  {pendingRemoveAlt?.id === alt.id && (
                    <div style={{
                      background: 'rgba(201,150,26,0.05)', border: '1px solid rgba(201,150,26,0.15)',
                      borderRadius: '0 0 6px 6px', padding: '0.75rem 1rem',
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                    }}>
                      <span style={{ fontFamily: "'Spectral', serif", color: '#f0e6c8', fontSize: '0.9rem' }}>
                        Remove {alt.name} as your alt?
                      </span>
                      <button
                        className="settings-btn-danger"
                        style={{ fontSize: '0.7rem', padding: '0.3rem 0.75rem' }}
                        onClick={() => handleRemoveAlt(alt)}
                        disabled={removingAlt}
                      >
                        {removingAlt ? 'Removing…' : 'Yes, remove'}
                      </button>
                      <button
                        className="settings-btn-secondary"
                        style={{ fontSize: '0.7rem', padding: '0.3rem 0.75rem' }}
                        onClick={() => setPendingRemoveAlt(null)}
                        disabled={removingAlt}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Section 5: Danger Zone ── */}
        <section className="settings-section settings-danger">
          <h2 className="settings-heading">Danger Zone</h2>
          <div className="settings-row">
            <div>
              <span className="settings-label" style={{ color: '#dc3c3c' }}>Delete Account</span>
              <span className="settings-hint">Permanently removes your account and releases all character claims.</span>
            </div>
            {!showDeleteAccount && (
              <button
                className="settings-btn-danger"
                onClick={() => setShowDeleteAccount(true)}
              >
                Delete My Account
              </button>
            )}
          </div>
          {showDeleteAccount && (
            <div style={{
              background: 'rgba(220,60,60,0.05)', border: '1px solid rgba(220,60,60,0.2)',
              borderRadius: 6, padding: '1rem 1.25rem', marginTop: '1rem',
            }}>
              <p style={{ fontFamily: "'Spectral', serif", color: '#f0e6c8', margin: '0 0 1rem', fontSize: '0.95rem', lineHeight: 1.6 }}>
                This will permanently delete your account and release all your character claims. This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  className="settings-btn-danger"
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                >
                  {deletingAccount ? 'Deleting…' : 'Yes, delete my account'}
                </button>
                <button
                  className="settings-btn-secondary"
                  onClick={() => setShowDeleteAccount(false)}
                  disabled={deletingAccount}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
