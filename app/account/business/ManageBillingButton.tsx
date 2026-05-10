'use client'

import { useState } from 'react'
import { Loader2, CreditCard } from 'lucide-react'

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function open() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/b2b/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to open portal')
      window.location.href = data.url
    } catch (err) {
      setError((err as Error).message)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={open}
        disabled={loading}
        className="inline-flex items-center gap-2 bg-brand-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        Manage Billing
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
