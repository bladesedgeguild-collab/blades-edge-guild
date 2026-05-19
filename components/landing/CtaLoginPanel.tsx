'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const DiscordIcon = () => (
  <svg width="18" height="18" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.44077 45.4204 0.52529C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.52529C25.5141 0.44359 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978Z" fill="white" />
  </svg>
)

function humanizeError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Wrong email or password.'
  if (msg.includes('Email not confirmed')) return 'Please confirm your email before signing in.'
  if (msg.includes('User already registered')) return 'An account with this email already exists. Try signing in.'
  if (msg.includes('Password should be')) return 'Password must be at least 6 characters.'
  return msg
}

export function CtaLoginPanel() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'signin' | 'forgot' | 'reset_sent'>('signin')

  async function handleDiscordLogin() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  async function afterEmailAuth() {
    await fetch('/api/auth/sync-user', { method: 'POST' })
    router.push('/dashboard')
    router.refresh()
  }

  async function handleSignIn() {
    if (!email || !password) return
    setAuthError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setAuthError(humanizeError(error.message)); return }
    await afterEmailAuth()
  }

  async function handleCreateAccount() {
    if (!email || !password) return
    setAuthError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) { setAuthError(humanizeError(error.message)); return }
    await afterEmailAuth()
  }

  async function handleForgotPassword() {
    if (!email) { setAuthError('Enter your email first.'); return }
    setAuthError(null)
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    })
    setLoading(false)
    setMode('reset_sent')
  }

  const inputBase = 'w-full px-3 py-2 rounded text-sm outline-none focus:ring-1 focus:ring-[#c9961a]'
  const inputStyle = {
    backgroundColor: '#0d0b07',
    border: '1px solid #3d2e15',
    color: '#f0e6c8',
    fontFamily: "'Crimson Pro', serif",
  }

  return (
    <div
      className="w-full max-w-xl mx-auto rounded-lg overflow-hidden"
      style={{ backgroundColor: '#1a1208', border: '1px solid #3d2e15' }}
    >
      <div className="flex flex-col sm:flex-row">

        {/* Discord column */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
          <button
            onClick={handleDiscordLogin}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-5 rounded text-white font-semibold transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{ backgroundColor: '#5865F2', fontFamily: "'Cinzel', serif", fontSize: '0.85rem' }}
          >
            <DiscordIcon />
            Continue with Discord
          </button>
          <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: '0.8rem', color: '#8a7a5a' }}>
            Fastest way back
          </p>
        </div>

        {/* Divider */}
        <div className="flex sm:flex-col items-center justify-center py-0 sm:py-4 px-4 sm:px-0">
          <div
            className="flex-1 h-px sm:h-auto sm:w-px sm:flex-1"
            style={{ backgroundColor: '#3d2e15' }}
          />
          <span
            className="px-3 py-1 text-xs"
            style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
          >
            or
          </span>
          <div
            className="flex-1 h-px sm:h-auto sm:w-px sm:flex-1"
            style={{ backgroundColor: '#3d2e15' }}
          />
        </div>

        {/* Email column */}
        <div className="flex-1 flex flex-col gap-3 p-6">
          {authError && (
            <p className="text-sm text-red-400">{authError}</p>
          )}

          {mode === 'reset_sent' ? (
            <div className="flex flex-col gap-3">
              <p style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a', fontSize: '0.9rem' }}>
                Check your email for a reset link.
              </p>
              <button
                onClick={() => { setMode('signin'); setAuthError(null) }}
                className="text-xs hover:text-white transition-colors"
                style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a', textAlign: 'left' }}
              >
                ← Back to sign in
              </button>
            </div>
          ) : mode === 'forgot' ? (
            <div className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputBase}
                style={inputStyle}
              />
              <button
                onClick={handleForgotPassword}
                disabled={loading}
                className="w-full py-2 rounded text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#c9961a', color: '#0d0b07', fontFamily: "'Cinzel', serif" }}
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
              <button
                onClick={() => { setMode('signin'); setAuthError(null) }}
                className="text-xs hover:text-white transition-colors text-left"
                style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
              >
                ← Back to sign in
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputBase}
                style={inputStyle}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                className={inputBase}
                style={inputStyle}
              />
              <button
                onClick={handleSignIn}
                disabled={loading}
                className="w-full py-2 rounded text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#c9961a', color: '#0d0b07', fontFamily: "'Cinzel', serif" }}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
              <div className="flex flex-col gap-1">
                <button
                  onClick={handleCreateAccount}
                  disabled={loading}
                  className="text-xs hover:text-white transition-colors text-left disabled:opacity-50"
                  style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
                >
                  New here? Create account
                </button>
                <button
                  onClick={() => { setMode('forgot'); setAuthError(null) }}
                  className="text-xs hover:text-white transition-colors text-left"
                  style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
                >
                  Forgot password?
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
