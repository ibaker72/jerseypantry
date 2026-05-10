'use client'

import { useState, useMemo } from 'react'
import { Plus, Trash2, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils/format'
import type { B2BPlan, B2BPlanItem } from '@/types'

interface ProductRow { id: string; name: string; retail_price: number; sku: string | null }

interface Props {
  plan: B2BPlan
  items: B2BPlanItem[]
  allProducts: ProductRow[]
}

export function PlanBasketEditor({ plan, items: initialItems, allProducts }: Props) {
  const [items, setItems] = useState(initialItems)
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState<string | null>(null)
  const [qtyInput, setQtyInput] = useState('1')
  const [busy, setBusy] = useState(false)

  const inBasket = useMemo(() => new Set(items.map((i) => i.product_id)), [items])

  const candidates = useMemo(
    () =>
      allProducts.filter(
        (p) => !inBasket.has(p.id) && p.name.toLowerCase().includes(search.toLowerCase())
      ),
    [allProducts, inBasket, search]
  )

  async function addItem(productId: string) {
    setBusy(true)
    const qty = parseInt(qtyInput, 10) || 1
    const res = await fetch('/api/admin/b2b/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_name: plan, product_id: productId, quantity: qty }),
    })
    if (res.ok) {
      const data = await res.json()
      setItems((prev) => [...prev, data.item])
      setAdding(null)
      setQtyInput('1')
    }
    setBusy(false)
  }

  async function updateQty(id: string, qty: number) {
    if (qty < 1) return
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)))
    await fetch(`/api/admin/b2b/plans/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: qty }),
    })
  }

  async function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    await fetch(`/api/admin/b2b/plans/${id}`, { method: 'DELETE' })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-brand-charcoal mb-4">In Basket ({items.length})</h2>
        {items.length === 0 ? (
          <p className="text-sm text-gray-400">No items yet — add products below.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map((item) => {
              const product = (item as B2BPlanItem & { product?: ProductRow | null }).product ?? null
              return (
                <div key={item.id} className="flex items-center gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-charcoal truncate">{product?.name ?? item.product_id}</p>
                    <p className="text-xs text-gray-400">
                      {product ? `${product.sku ?? '—'} · ${formatPrice(product.retail_price)}` : '—'}
                    </p>
                  </div>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateQty(item.id, parseInt(e.target.value, 10))}
                    className="w-20 text-center"
                  />
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-brand-charcoal mb-4">Add Product</h2>
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3"
        />
        <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
          {candidates.slice(0, 30).map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2">
              <div className="min-w-0">
                <p className="text-sm text-brand-charcoal truncate">{p.name}</p>
                <p className="text-xs text-gray-400">{formatPrice(p.retail_price)}</p>
              </div>
              {adding === p.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={qtyInput}
                    onChange={(e) => setQtyInput(e.target.value)}
                    className="w-20 text-center"
                  />
                  <Button size="sm" onClick={() => addItem(p.id)} disabled={busy}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <button
                    onClick={() => { setAdding(null); setQtyInput('1') }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAdding(p.id)}
                  className="text-brand-green hover:text-green-700"
                  aria-label="Add"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {candidates.length === 0 && (
            <p className="text-sm text-gray-400 py-3 text-center">No matching products.</p>
          )}
        </div>
      </div>
    </div>
  )
}
