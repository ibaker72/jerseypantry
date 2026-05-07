'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { CheckCircle2, Clock, AlertTriangle, XCircle, Package } from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'
import type { WholesaleProduct, WholesaleOrderItem, AvailabilityStatus } from '@/types/wholesale'

// ── Availability Badge ────────────────────────────────────────────────────────

const AVAILABILITY_CONFIG: Record<
  AvailabilityStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  same_day_pickup: {
    label: 'Available for Same-Day Pickup',
    icon: CheckCircle2,
    className: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  wholesale_verified: {
    label: 'Wholesale Verified',
    icon: Clock,
    className: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  limited: {
    label: 'Limited Stock',
    icon: AlertTriangle,
    className: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  unavailable: {
    label: 'Currently Unavailable',
    icon: XCircle,
    className: 'text-gray-500 bg-gray-50 border-gray-200',
  },
}

function AvailabilityBadge({ status }: { status: AvailabilityStatus }) {
  const cfg = AVAILABILITY_CONFIG[status]
  const Icon = cfg.icon
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.className}`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      {cfg.label}
    </span>
  )
}

// ── Quick Add Input ───────────────────────────────────────────────────────────

interface QuickAddProps {
  product: WholesaleProduct
  currentQty: number
  onChange: (product: WholesaleProduct, qty: number) => void
}

function QuickAddInput({ product, currentQty, onChange }: QuickAddProps) {
  const unavailable = product.availability_status === 'unavailable'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(0, parseInt(e.target.value, 10) || 0)
    onChange(product, val)
  }

  const adjust = (delta: number) => {
    onChange(product, Math.max(0, currentQty + delta))
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => adjust(-1)}
        disabled={unavailable || currentQty === 0}
        className="w-7 h-7 rounded border border-gray-200 text-gray-600 hover:border-brand-green hover:text-brand-green disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-sm font-bold transition-colors"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        type="number"
        min={0}
        value={currentQty || ''}
        onChange={handleChange}
        disabled={unavailable}
        placeholder="0"
        className="w-14 text-center text-sm border border-gray-200 rounded h-7 focus:outline-none focus:border-brand-green disabled:bg-gray-50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        onClick={() => adjust(1)}
        disabled={unavailable}
        className="w-7 h-7 rounded border border-gray-200 text-gray-600 hover:border-brand-green hover:text-brand-green disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-sm font-bold transition-colors"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  )
}

// ── Main Table ────────────────────────────────────────────────────────────────

interface WholesaleTableProps {
  products: WholesaleProduct[]
  onOrderChange: (items: WholesaleOrderItem[]) => void
}

export function WholesaleTable({ products, onOrderChange }: WholesaleTableProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const handleQtyChange = useCallback(
    (product: WholesaleProduct, qty: number) => {
      const next = { ...quantities, [product.id]: qty }
      if (qty === 0) delete next[product.id]
      setQuantities(next)

      const items: WholesaleOrderItem[] = products
        .filter((p) => (next[p.id] ?? 0) > 0)
        .map((p) => {
          const q = next[p.id]
          const unitPrice = p.custom_price ?? p.wholesale_price
          return {
            product_id: p.id,
            product_name: p.name,
            wholesale_unit: p.wholesale_unit,
            quantity: q,
            unit_price: unitPrice,
            line_total: +(unitPrice * q).toFixed(2),
            weight_lbs: +(p.weight_lbs * q).toFixed(2),
            volume_cubic_ft: +(p.volume_cubic_ft * q).toFixed(2),
          }
        })

      onOrderChange(items)
    },
    [quantities, products, onOrderChange]
  )

  const categories = Array.from(new Set(products.map((p) => p.category))).sort()

  if (products.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="font-medium text-gray-600">No products in your wholesale catalog</p>
        <p className="text-sm text-gray-400 mt-1">Contact your account manager to configure your catalog.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {categories.map((cat) => {
        const catProducts = products.filter((p) => p.category === cat)
        return (
          <div key={cat}>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 px-1">
              {cat}
            </h2>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {/* Table header */}
              <div className="hidden md:grid grid-cols-[2fr_1.2fr_1fr_1fr_1.4fr] gap-4 px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-400">
                <span>Product</span>
                <span>Wholesale Unit</span>
                <span className="text-right">Market Price</span>
                <span className="text-right">Your Price</span>
                <span className="text-center">Qty (Cases)</span>
              </div>

              <div className="divide-y divide-gray-50">
                {catProducts.map((product) => {
                  const qty = quantities[product.id] ?? 0
                  const displayPrice = product.custom_price ?? product.wholesale_price
                  const hasContractPrice =
                    product.custom_price !== null && product.custom_price < product.market_price

                  return (
                    <div
                      key={product.id}
                      className={`grid grid-cols-1 md:grid-cols-[2fr_1.2fr_1fr_1fr_1.4fr] gap-3 md:gap-4 items-center px-4 py-3 transition-colors ${
                        qty > 0 ? 'bg-emerald-50/40' : 'hover:bg-gray-50/60'
                      }`}
                    >
                      {/* Product Name + Thumbnail + Badge */}
                      <div className="flex items-center gap-3 min-w-0">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="rounded-lg object-cover shrink-0 border border-gray-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center">
                            <Package className="w-4 h-4 text-gray-300" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-brand-charcoal text-sm leading-tight truncate">
                            {product.name}
                          </p>
                          {product.sku && (
                            <p className="text-xs text-gray-400 font-mono">SKU: {product.sku}</p>
                          )}
                          <div className="mt-0.5">
                            <AvailabilityBadge status={product.availability_status} />
                          </div>
                        </div>
                      </div>

                      {/* Wholesale Unit */}
                      <div className="flex items-center md:block">
                        <span className="md:hidden text-xs text-gray-400 w-28 shrink-0">Unit:</span>
                        <span className="text-sm text-gray-700 font-medium">
                          {product.wholesale_unit}
                        </span>
                        {product.weight_lbs > 0 && (
                          <span className="text-xs text-gray-400 block">
                            {product.weight_lbs} lbs / {product.volume_cubic_ft.toFixed(1)} ft³
                          </span>
                        )}
                      </div>

                      {/* Market Price */}
                      <div className="flex items-center md:justify-end">
                        <span className="md:hidden text-xs text-gray-400 w-28 shrink-0">Market:</span>
                        <span className="text-sm text-gray-500">{formatPrice(product.market_price)}</span>
                      </div>

                      {/* Your Price */}
                      <div className="flex items-center md:justify-end">
                        <span className="md:hidden text-xs text-gray-400 w-28 shrink-0">Your Price:</span>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-brand-charcoal">
                            {formatPrice(displayPrice)}
                          </span>
                          {hasContractPrice && (
                            <span className="block text-xs text-brand-green font-medium">Contract</span>
                          )}
                        </div>
                      </div>

                      {/* Quick Add */}
                      <div className="flex items-center md:justify-center">
                        <span className="md:hidden text-xs text-gray-400 w-28 shrink-0">Order Qty:</span>
                        <QuickAddInput
                          product={product}
                          currentQty={qty}
                          onChange={handleQtyChange}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
