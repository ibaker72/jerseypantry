'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Package2, RefreshCw } from 'lucide-react'
import { WholesaleTable } from '@/components/b2b/WholesaleTable'
import { OrderSummarySidebar } from '@/components/b2b/OrderSummarySidebar'
import type { WholesaleProduct, WholesaleOrderItem, WholesaleOrderSummary } from '@/types/wholesale'

export default function WholesaleCatalogPage() {
  const router = useRouter()
  const [products, setProducts] = useState<WholesaleProduct[]>([])
  const [orderItems, setOrderItems] = useState<WholesaleOrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/b2b/wholesale-catalog')
      .then(async (res) => {
        if (res.status === 401) { router.push('/login?next=/b2b/catalog'); return }
        if (res.status === 403) { router.push('/office-refill?no_account=1'); return }
        const json = await res.json()
        setProducts(json.products ?? [])
      })
      .catch(() => setError('Failed to load catalog'))
      .finally(() => setLoading(false))
  }, [router])

  const handleOrderChange = useCallback((items: WholesaleOrderItem[]) => {
    setOrderItems(items)
  }, [])

  const handleClear = useCallback(() => setOrderItems([]), [])

  const handleSubmit = async (summary: WholesaleOrderSummary) => {
    if (summary.items.length === 0) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/b2b/wholesale-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: summary.items }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Order failed')
      router.push(`/b2b/orders?new_order=${json.order_id}`)
    } catch (err) {
      setError(String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-charcoal flex items-center gap-2">
            <Package2 className="w-6 h-6 text-brand-green" />
            Wholesale Catalog
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            North Jersey · Bulk-first pricing · Same-day wholesale pickup
          </p>
        </div>
        {!loading && (
          <button
            onClick={() => { setLoading(true); setError(null); fetch('/api/b2b/wholesale-catalog').then(r => r.json()).then(j => setProducts(j.products ?? [])).finally(() => setLoading(false)) }}
            className="text-xs text-gray-400 hover:text-brand-green flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
          {/* Wholesale product table */}
          <WholesaleTable products={products} onOrderChange={handleOrderChange} />

          {/* Sticky order summary */}
          <OrderSummarySidebar
            items={orderItems}
            onSubmit={handleSubmit}
            onClear={handleClear}
            submitting={submitting}
          />
        </div>
      )}
    </div>
  )
}
