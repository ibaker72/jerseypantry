'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'

export function B2BBillingPortalButton() {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/b2b/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error ?? 'Could not open billing portal')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-2 text-sm font-medium text-brand-green border border-brand-green px-3 py-1.5 rounded-lg hover:bg-green-50 disabled:opacity-50 transition-colors"
    >
      <ExternalLink className="w-4 h-4" />
      {loading ? 'Opening…' : 'Manage billing'}
    </button>
  )
}
