'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

const GuildCrest = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Guild crest">
    <path d="M32 4L8 16V36C8 48.15 18.4 59.45 32 62C45.6 59.45 56 48.15 56 36V16L32 4Z" fill="#0d1326" stroke="#c9a84c" strokeWidth="2" />
    <path d="M32 12V52" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" />
    <path d="M22 22H42" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" />
    <path d="M26 32L32 20L38 32" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M24 42H40" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const DiscordIcon = () => (
  <svg width="20" height="20" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
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

function LoginCard() {
  const params = useSearchParams()
  const router = useRouter()
  const oauthError = params.get('error')

  const [mode, setMode] = useState<'main' | 'forgot'>('main')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

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
    // Supabase project must have "Enable email confirmations" disabled for immediate login
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
    setResetSent(true)
  }

  const inputClass = 'w-full px-3 py-2 rounded-md text-sm text-white outline-none focus:ring-1 focus:ring-[#c9a84c]'
  const inputStyle = { backgroundColor: '#0a0f1e', border: '1px solid #1e2a45' }

  return (
    <div
      className="w-full max-w-sm rounded-xl border p-8 flex flex-col items-center gap-5"
      style={{ backgroundColor: '#0d1326', borderColor: '#1e2a45' }}
    >
      <GuildCrest />

      <div className="text-center">
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#c9a84c' }}>
          Welcome back to Blades Edge
        </h1>
        <p className="text-sm" style={{ color: '#6b7a99' }}>
          Log in to register your return
        </p>
      </div>

      {oauthError === 'auth_failed' && (
        <p className="text-sm text-red-400 text-center">Authentication failed. Please try again.</p>
      )}

      {mode === 'main' ? (
        <>
          {/* Discord */}
          <button
            onClick={handleDiscordLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-md font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.02]"
            style={{ backgroundColor: '#5865F2' }}
          >
            <DiscordIcon />
            Continue with Discord
          </button>

          {/* Divider */}
          <div className="w-full flex items-center gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: '#1e2a45' }} />
            <span className="text-xs" style={{ color: '#3d4f6e' }}>or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: '#1e2a45' }} />
          </div>

          {/* Email/password */}
          <div className="w-full flex flex-col gap-3">
            {authError && (
              <p className="text-sm text-red-400 text-center">{authError}</p>
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
              className={inputClass}
              style={inputStyle}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSignIn}
                disabled={loading}
                className="flex-1 py-2 rounded-md text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#c9a84c', color: '#0a0f1e' }}
              >
                Sign In
              </button>
              <button
                onClick={handleCreateAccount}
                disabled={loading}
                className="flex-1 py-2 rounded-md text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#1e2a45', color: '#8fa3c8' }}
              >
                Create Account
              </button>
            </div>
            <button
              onClick={() => { setMode('forgot'); setAuthError(null) }}
              className="text-xs text-center hover:text-white transition-colors"
              style={{ color: '#3d4f6e' }}
            >
              Forgot password?
            </button>
          </div>
        </>
      ) : (
        <div className="w-full flex flex-col gap-3">
          <p className="text-sm text-center" style={{ color: '#8fa3c8' }}>
            {resetSent
              ? 'Check your email for a reset link.'
              : 'Enter your email to receive a reset link.'}
          </p>
          {!resetSent && (
            <>
              {authError && <p className="text-sm text-red-400 text-center">{authError}</p>}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
              <button
                onClick={handleForgotPassword}
                disabled={loading}
                className="w-full py-2 rounded-md text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#c9a84c', color: '#0a0f1e' }}
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </>
          )}
          <button
            onClick={() => { setMode('main'); setResetSent(false); setAuthError(null) }}
            className="text-xs text-center hover:text-white transition-colors"
            style={{ color: '#3d4f6e' }}
          >
            Back to login
          </button>
        </div>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#0a0f1e' }}
    >
      <Suspense>
        <LoginCard />
      </Suspense>
    </div>
  )
}
