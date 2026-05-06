'use client'

import { useState } from 'react'
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils/format'
import type { Product, SubscriptionFrequency } from '@/types'

const FREQ_OPTIONS: { value: SubscriptionFrequency; label: string }[] = [
  { value: 'weekly',   label: 'Every week' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly',  label: 'Every month' },
]

const DISCOUNT = 0.10

interface Props {
  product: Product
}

export function SubscribeButton({ product }: Props) {
  const [open, setOpen] = useState(false)
  const [frequency, setFrequency] = useState<SubscriptionFrequency>('monthly')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const discountedPrice = parseFloat((product.retail_price * (1 - DISCOUNT)).toFixed(2))

  async function subscribe() {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: product.id,
        quantity: 1,
        frequency,
        fulfillment_method: product.delivery_eligible ? 'local_delivery' : 'shipping',
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      if (res.status === 401) {
        setError('Sign in to subscribe. Create a free account first.')
      } else {
        setError(data.error ?? 'Failed to subscribe')
      }
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-center">
        <RefreshCw className="h-5 w-5 text-green-600 mx-auto mb-2" />
        <p className="font-semibold text-green-800">Subscribed!</p>
        <p className="text-sm text-green-600 mt-1">
          You&apos;ll receive this product automatically. Manage in{' '}
          <a href="/account/subscriptions" className="underline">My Subscriptions</a>.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-dashed border-brand-green/40 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-brand-green/5 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-brand-green" />
          <span className="text-sm font-semibold text-brand-green">Subscribe &amp; Save 10%</span>
          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
            {formatPrice(discountedPrice)}/order
          </span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-brand-green/10">
          <p className="text-sm text-gray-500 pt-3">
            Auto-refill at <strong className="text-brand-green">{formatPrice(discountedPrice)}</strong> instead of {formatPrice(product.retail_price)} — cancel anytime.
          </p>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Delivery frequency</label>
            <div className="grid grid-cols-3 gap-2">
              {FREQ_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFrequency(opt.value)}
                  className={`text-xs rounded-lg py-2 px-2 border transition-colors font-medium ${
                    frequency === opt.value
                      ? 'bg-brand-green text-white border-brand-green'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-brand-green/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            className="w-full gap-2"
            onClick={subscribe}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
            {loading ? 'Setting up…' : 'Subscribe & Save 10%'}
          </Button>
        </div>
      )}
    </div>
  )
}
