'use client'

import { useMemo } from 'react'
import { ShoppingCart, Weight, Box, ChevronRight, Trash2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'
import type { WholesaleOrderItem, WholesaleOrderSummary } from '@/types/wholesale'

// ── Thresholds for courier upgrade alert ─────────────────────────────────────

const COURIER_WEIGHT_THRESHOLD = 50
const COURIER_DISTANCE_THRESHOLD = 5

interface OrderSummarySidebarProps {
  items: WholesaleOrderItem[]
  onSubmit?: (summary: WholesaleOrderSummary) => void
  onClear?: () => void
  submitting?: boolean
}

export function OrderSummarySidebar({
  items,
  onSubmit,
  onClear,
  submitting = false,
}: OrderSummarySidebarProps) {
  const summary = useMemo<WholesaleOrderSummary>(() => {
    const subtotal = items.reduce((s, i) => s + i.line_total, 0)
    const total_weight_lbs = items.reduce((s, i) => s + i.weight_lbs, 0)
    const total_volume_cubic_ft = items.reduce((s, i) => s + i.volume_cubic_ft, 0)
    return {
      items,
      subtotal: +subtotal.toFixed(2),
      total_weight_lbs: +total_weight_lbs.toFixed(2),
      total_volume_cubic_ft: +total_volume_cubic_ft.toFixed(2),
      item_count: items.reduce((s, i) => s + i.quantity, 0),
    }
  }, [items])

  const isBulk = summary.total_weight_lbs >= COURIER_WEIGHT_THRESHOLD
  const isEmpty = items.length === 0

  return (
    <aside className="sticky top-4 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-brand-green px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <ShoppingCart className="w-4 h-4" />
          <span className="font-semibold text-sm">Order Summary</span>
        </div>
        {!isEmpty && (
          <span className="bg-white/20 text-white text-xs font-bold rounded-full px-2 py-0.5">
            {summary.item_count} {summary.item_count === 1 ? 'case' : 'cases'}
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {isEmpty ? (
          <div className="text-center py-6">
            <ShoppingCart className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Add items to start your order</p>
          </div>
        ) : (
          <>
            {/* Line items */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.product_id} className="flex justify-between gap-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-brand-charcoal text-xs leading-snug truncate">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {item.quantity}× {item.wholesale_unit} @ {formatPrice(item.unit_price)}
                    </p>
                  </div>
                  <span className="font-semibold text-brand-charcoal shrink-0 text-xs">
                    {formatPrice(item.line_total)}
                  </span>
                </div>
              ))}
            </div>

            <hr className="border-gray-100" />

            {/* Weight & Volume */}
            <div className="grid grid-cols-2 gap-2">
              <div className={`rounded-lg p-2.5 text-center ${isBulk ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
                <Weight className={`w-4 h-4 mx-auto mb-1 ${isBulk ? 'text-amber-600' : 'text-gray-400'}`} />
                <p className={`text-xs font-bold ${isBulk ? 'text-amber-700' : 'text-gray-700'}`}>
                  {summary.total_weight_lbs.toFixed(1)} lbs
                </p>
                <p className="text-xs text-gray-400">Total Weight</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                <Box className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                <p className="text-xs font-bold text-gray-700">
                  {summary.total_volume_cubic_ft.toFixed(1)} ft³
                </p>
                <p className="text-xs text-gray-400">Total Volume</p>
              </div>
            </div>

            {/* Bulk warning */}
            {isBulk && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
                <strong>Bulk order:</strong> Over {COURIER_WEIGHT_THRESHOLD} lbs — a courier
                quote will be required at checkout.
              </div>
            )}

            {/* Delivery hint */}
            {!isBulk && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-800">
                <strong>Self-delivery eligible</strong> for addresses within {COURIER_DISTANCE_THRESHOLD} miles · North Jersey
              </div>
            )}

            {/* Subtotal */}
            <div className="flex items-center justify-between text-sm font-semibold border-t border-gray-100 pt-3">
              <span className="text-gray-700">Subtotal</span>
              <span className="text-brand-charcoal text-base">{formatPrice(summary.subtotal)}</span>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={() => onSubmit?.(summary)}
                disabled={submitting || isEmpty}
                className="w-full bg-brand-green text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {submitting ? 'Processing…' : 'Place Wholesale Order'}
                {!submitting && <ChevronRight className="w-4 h-4" />}
              </button>

              {onClear && (
                <button
                  onClick={onClear}
                  disabled={submitting}
                  className="w-full text-xs text-gray-400 hover:text-red-500 flex items-center justify-center gap-1 py-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Clear order
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
