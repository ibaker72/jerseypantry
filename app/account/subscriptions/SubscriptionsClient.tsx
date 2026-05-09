'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { RefreshCw, Pause, Play, Trash2, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils/format'
import type { Subscription, SubscriptionFrequency } from '@/types'

interface Props {
  initialSubs: Subscription[]
}

const FREQ_LABELS: Record<SubscriptionFrequency, string> = {
  weekly:   'Every week',
  biweekly: 'Every 2 weeks',
  monthly:  'Every month',
}

const DISCOUNT = 0.10

export function SubscriptionsClient({ initialSubs }: Props) {
  const [subs, setSubs] = useState(initialSubs)

  async function updateStatus(id: string, status: 'active' | 'paused' | 'canceled') {
    if (status === 'canceled' && !confirm('Cancel this subscription?')) return
    const res = await fetch(`/api/subscriptions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setSubs((prev) =>
        status === 'canceled'
          ? prev.filter((s) => s.id !== id)
          : prev.map((s) => s.id === id ? { ...s, status } : s)
      )
    }
  }

  if (subs.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-brand-charcoal flex items-center gap-2">
          <RefreshCw className="h-6 w-6 text-brand-green" /> Auto-Refill Subscriptions
        </h1>
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-10 text-center">
          <ShoppingBag className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No active subscriptions yet.</p>
          <p className="text-sm text-gray-400 mb-6">Subscribe to household essentials and save 10% on every auto-refill order.</p>
          <Link href="/shop">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-charcoal flex items-center gap-2">
          <RefreshCw className="h-6 w-6 text-brand-green" /> Auto-Refill Subscriptions
        </h1>
        <Link href="/shop">
          <Button variant="outline" size="sm">+ Add Item</Button>
        </Link>
      </div>

      <div className="space-y-4">
        {subs.map((sub) => {
          const product = sub.product
          const unitPrice = product ? product.retail_price * (1 - DISCOUNT) : 0
          const lineTotal = unitPrice * sub.quantity

          return (
            <div key={sub.id} className={`rounded-2xl bg-white border shadow-sm p-5 ${sub.status === 'paused' ? 'border-yellow-200 opacity-75' : 'border-gray-100'}`}>
              <div className="flex gap-4">
                {/* Product image */}
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-brand-cream shrink-0">
                  {product?.image_url ? (
                    <Image src={product.image_url} alt={product.name ?? ''} fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-brand-charcoal line-clamp-1">{product?.name ?? 'Product'}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {FREQ_LABELS[sub.frequency]} · Qty {sub.quantity}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-brand-green">{formatPrice(lineTotal)}</span>
                    <span className="text-xs text-gray-400 line-through">{product ? formatPrice(product.retail_price * sub.quantity) : ''}</span>
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">10% off</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Next order: {new Date(sub.next_order_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Status badge */}
                <div className="shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {sub.status}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
                {sub.status === 'active' ? (
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => updateStatus(sub.id, 'paused')}>
                    <Pause className="h-3.5 w-3.5" /> Pause
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => updateStatus(sub.id, 'active')}>
                    <Play className="h-3.5 w-3.5" /> Resume
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs text-red-500 border-red-200 hover:bg-red-50"
                  onClick={() => updateStatus(sub.id, 'canceled')}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Cancel
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-center text-gray-400">
        Subscriptions process automatically. You&apos;ll receive an order confirmation each time.
      </p>
    </div>
  )
}
