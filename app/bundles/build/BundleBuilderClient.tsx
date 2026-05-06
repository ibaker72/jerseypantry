'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Plus, Minus, ShoppingCart, Package, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCart } from '@/components/cart/CartContext'
import { formatPrice } from '@/lib/utils/format'
import type { Product, Category } from '@/types'

const BUNDLE_MIN_ITEMS = 4
const BUNDLE_DISCOUNT  = 0.10  // 10%

interface Props {
  products: Product[]
  categories: Category[]
}

type Selection = Record<string, number>
type SelectionEntry = [string, number]

export function BundleBuilderClient({ products, categories }: Props) {
  const { addToCart } = useCart()
  const [selection, setSelection] = useState<Selection>({})
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [added, setAdded] = useState(false)

  function adjust(productId: string, delta: number) {
    setSelection((prev) => {
      const next = { ...prev }
      const cur = next[productId] ?? 0
      const nxt = Math.max(0, cur + delta)
      if (nxt === 0) delete next[productId]
      else next[productId] = nxt
      return next
    })
  }

  const selectedEntries = (Object.entries(selection) as SelectionEntry[]).filter(([, q]) => q > 0)
  const totalItems = selectedEntries.reduce((s, [, q]) => s + q, 0)
  const bundleActive = totalItems >= BUNDLE_MIN_ITEMS

  const subtotal = useMemo(
    () => selectedEntries.reduce((s, [id, q]) => {
      const p = products.find((pr) => pr.id === id)
      return s + (p?.retail_price ?? 0) * q
    }, 0),
    [selectedEntries, products]
  )

  const discountAmount = bundleActive ? parseFloat((subtotal * BUNDLE_DISCOUNT).toFixed(2)) : 0
  const finalTotal = subtotal - discountAmount

  const filtered = products.filter((p) => {
    const matchCat = filterCat === 'all' || p.category_id === filterCat
    const matchQ   = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.brand ?? '').toLowerCase().includes(search.toLowerCase())
    return matchCat && matchQ
  })

  function addAllToCart() {
    for (const [id, qty] of selectedEntries) {
      const product = products.find((p) => p.id === id)
      if (!product) continue
      const discountedPrice = bundleActive
        ? parseFloat((product.retail_price * (1 - BUNDLE_DISCOUNT)).toFixed(2))
        : product.retail_price
      addToCart({
        id: product.id,
        product_id: product.id,
        name: `${product.name} (Bundle)`,
        slug: product.slug,
        image_url: product.image_url,
        retail_price: discountedPrice,
        quantity: qty,
        inventory_quantity: product.inventory_quantity,
        shipping_eligible: product.shipping_eligible,
        delivery_eligible: product.delivery_eligible,
        sku: product.sku,
      })
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 3000)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Product grid */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex gap-3">
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((product) => {
            const qty = selection[product.id] ?? 0
            return (
              <div
                key={product.id}
                className={`rounded-2xl border bg-white p-3 flex flex-col gap-2 transition-all ${qty > 0 ? 'border-brand-green shadow-md' : 'border-gray-100 shadow-sm'}`}
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-brand-cream">
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.name} fill className="object-cover" sizes="150px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🛍️</div>
                  )}
                  {qty > 0 && (
                    <div className="absolute top-2 right-2 bg-brand-green text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                      {qty}
                    </div>
                  )}
                </div>
                <p className="text-xs font-semibold text-brand-charcoal leading-tight line-clamp-2">{product.name}</p>
                <p className="text-xs font-bold text-brand-charcoal">{formatPrice(product.retail_price)}</p>

                {qty === 0 ? (
                  <Button size="sm" variant="outline" className="w-full gap-1 text-xs" onClick={() => adjust(product.id, 1)}>
                    <Plus className="h-3 w-3" /> Add
                  </Button>
                ) : (
                  <div className="flex items-center justify-between rounded-xl bg-brand-green/10 border border-brand-green/20">
                    <button className="p-1.5 rounded-l-xl hover:bg-brand-green/10" onClick={() => adjust(product.id, -1)}>
                      <Minus className="h-3.5 w-3.5 text-brand-green" />
                    </button>
                    <span className="text-sm font-semibold text-brand-green">{qty}</span>
                    <button
                      className="p-1.5 rounded-r-xl hover:bg-brand-green/10 disabled:opacity-40"
                      onClick={() => adjust(product.id, 1)}
                      disabled={qty >= product.inventory_quantity}
                    >
                      <Plus className="h-3.5 w-3.5 text-brand-green" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary panel */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-4">
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-brand-charcoal text-lg flex items-center gap-2">
              <Package className="h-5 w-5" /> Your Bundle
            </h2>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>{totalItems} item{totalItems !== 1 ? 's' : ''} selected</span>
                <span>{bundleActive ? '10% discount active!' : `Add ${BUNDLE_MIN_ITEMS - totalItems} more to unlock 10% off`}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${bundleActive ? 'bg-brand-green' : 'bg-amber-400'}`}
                  style={{ width: `${Math.min(100, (totalItems / BUNDLE_MIN_ITEMS) * 100)}%` }}
                />
              </div>
            </div>

            {/* Selected items */}
            {selectedEntries.length > 0 ? (
              <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                {(selectedEntries as SelectionEntry[]).map(([id, qty]) => {
                  const p = products.find((pr) => pr.id === id)
                  if (!p) return null
                  return (
                    <div key={id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 line-clamp-1 flex-1">{p.name}</span>
                      <span className="text-gray-500 shrink-0 ml-2 tabular-nums">×{qty} · {formatPrice(p.retail_price * qty)}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-400">No items yet. Add products from the left.</p>
            )}

            {/* Pricing */}
            {selectedEntries.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {bundleActive && (
                  <div className="flex justify-between text-brand-green font-semibold">
                    <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> 10% Bundle Discount</span>
                    <span>−{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-brand-charcoal text-base pt-1 border-t border-gray-100">
                  <span>Total</span>
                  <span className={bundleActive ? 'text-brand-green' : ''}>{formatPrice(finalTotal)}</span>
                </div>
              </div>
            )}

            <Button
              className="w-full mt-4 gap-2"
              disabled={totalItems === 0}
              onClick={addAllToCart}
            >
              {added ? (
                'Added to Cart!'
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  {bundleActive ? `Add Bundle to Cart (10% off)` : 'Add to Cart'}
                </>
              )}
            </Button>
          </div>

          {!bundleActive && totalItems > 0 && (
            <p className="text-xs text-center text-amber-700 bg-amber-50 rounded-xl p-3">
              Add {BUNDLE_MIN_ITEMS - totalItems} more item{BUNDLE_MIN_ITEMS - totalItems !== 1 ? 's' : ''} to unlock your 10% discount!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
