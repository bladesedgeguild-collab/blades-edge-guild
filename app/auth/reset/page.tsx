'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase exchanges the recovery token from the URL hash automatically
    const supabase = createClient()
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleReset() {
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setSuccess(true)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#0a0f1e' }}
    >
      <div
        className="w-full max-w-sm rounded-xl border p-8 flex flex-col gap-6"
        style={{ backgroundColor: '#0d1326', borderColor: '#1e2a45' }}
      >
        <h1 className="text-xl font-bold text-center" style={{ color: '#c9a84c' }}>
          Set New Password
        </h1>

        {success ? (
          <p className="text-sm text-center text-green-400">
            Password updated! Redirecting…
          </p>
        ) : !ready ? (
          <p className="text-sm text-center" style={{ color: '#6b7a99' }}>
            Verifying reset link…
          </p>
        ) : (
          <>
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-md text-sm text-white outline-none focus:ring-1 focus:ring-[#c9a84c]"
              style={{ backgroundColor: '#0a0f1e', border: '1px solid #1e2a45' }}
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2 rounded-md text-sm text-white outline-none focus:ring-1 focus:ring-[#c9a84c]"
              style={{ backgroundColor: '#0a0f1e', border: '1px solid #1e2a45' }}
            />
            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full py-2 rounded-md text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#c9a84c', color: '#0a0f1e' }}
            >
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
