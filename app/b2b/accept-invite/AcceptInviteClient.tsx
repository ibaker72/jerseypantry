'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Loader2, Building2 } from 'lucide-react'
import Link from 'next/link'

type Stage = 'loading' | 'sign-in' | 'accepting' | 'success' | 'error'

export function AcceptInviteClient() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token') ?? ''

  const [stage, setStage] = useState<Stage>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const acceptInvite = async () => {
    setStage('accepting')
    const res = await fetch('/api/b2b/accept-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const data = await res.json()
    if (res.ok) {
      setStage('success')
      setTimeout(() => router.push('/b2b/dashboard'), 2000)
    } else {
      setStage('error')
      setErrorMsg(data.error ?? 'Could not accept invite')
    }
  }

  useEffect(() => {
    if (!token) {
      setStage('error')
      setErrorMsg('Missing invite token')
      return
    }
    const supabase = createClient()
    supabase.auth.getUser().then((result) => {
      if (result.data.user) {
        acceptInvite()
      } else {
        setStage('sign-in')
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setAuthError(error.message)
      setAuthLoading(false)
    } else {
      await acceptInvite()
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
      <div className="text-center mb-6">
        <Building2 className="w-10 h-10 text-brand-green mx-auto mb-3" />
        <h1 className="text-xl font-bold text-brand-charcoal">You've been invited</h1>
        <p className="text-sm text-gray-500 mt-1">Join your company's Corner Store business account</p>
      </div>

      {stage === 'loading' && (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 text-brand-green animate-spin" />
        </div>
      )}

      {stage === 'sign-in' && (
        <form onSubmit={handleSignIn} className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            Sign in to accept your invitation
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            />
          </div>
          {authError && <p className="text-sm text-red-600">{authError}</p>}
          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-brand-green text-white py-2.5 rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {authLoading ? 'Signing in…' : 'Sign in & accept invite'}
          </button>
          <p className="text-xs text-center text-gray-400">
            New here?{' '}
            <Link
              href={`/signup?next=/b2b/accept-invite%3Ftoken%3D${token}`}
              className="text-brand-green hover:underline"
            >
              Create an account
            </Link>
          </p>
        </form>
      )}

      {stage === 'accepting' && (
        <div className="flex flex-col items-center gap-3 py-6">
          <Loader2 className="w-6 h-6 text-brand-green animate-spin" />
          <p className="text-sm text-gray-500">Accepting your invite…</p>
        </div>
      )}

      {stage === 'success' && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CheckCircle className="w-10 h-10 text-green-500" />
          <p className="font-semibold text-brand-charcoal">You're in!</p>
          <p className="text-sm text-gray-500">Redirecting to your business portal…</p>
        </div>
      )}

      {stage === 'error' && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <XCircle className="w-10 h-10 text-red-400" />
          <p className="font-semibold text-brand-charcoal">Invite failed</p>
          <p className="text-sm text-gray-500">{errorMsg}</p>
          <Link href="/" className="text-sm text-brand-green hover:underline">Go to homepage</Link>
        </div>
      )}
    </div>
  )
}
