'use client'

import { useState } from 'react'
import { DollarSign, TrendingUp, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const MARGINS = [
  { label: '35% Margin', margin: 0.35, color: 'bg-blue-50 border-blue-100', badge: 'bg-blue-100 text-blue-700', accent: 'text-blue-700' },
  { label: '40% Margin', margin: 0.40, color: 'bg-green-50 border-green-100', badge: 'bg-green-100 text-green-700', accent: 'text-green-700' },
  { label: '45% Margin', margin: 0.45, color: 'bg-orange-50 border-orange-100', badge: 'bg-orange-100 text-orange-700', accent: 'text-orange-700' },
]

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export default function MarginCalculatorPage() {
  const [cost, setCost] = useState('')
  const [qty, setQty] = useState('')

  const wholesale = parseFloat(cost)
  const quantity = parseInt(qty) || 1
  const isValid = !isNaN(wholesale) && wholesale > 0

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-brand-green" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-brand-charcoal">Margin Calculator</h1>
          <p className="text-gray-500 text-sm mt-0.5">Calculate retail price at 35%, 40%, and 45% margin</p>
        </div>
      </div>

      {/* Inputs */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 mb-6 max-w-md">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cost" className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-gray-400" />
              Wholesale Cost (per unit)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <Input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="qty">
              Units (optional — for total profit view)
            </Label>
            <Input
              id="qty"
              type="number"
              min="1"
              placeholder="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {isValid ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
          {MARGINS.map(({ label, margin, color, badge, accent }) => {
            const retail = wholesale / (1 - margin)
            const profit = retail - wholesale
            const totalProfit = profit * quantity
            const totalRevenue = retail * quantity
            const markupPct = (profit / wholesale) * 100

            return (
              <div key={label} className={`rounded-2xl border ${color} p-5 space-y-4`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-brand-charcoal">{label}</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge}`}>
                    {(margin * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Wholesale</span>
                    <span className="font-medium text-brand-charcoal">{fmt(wholesale)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">Retail price</span>
                    <span className={`text-lg font-bold ${accent}`}>{fmt(retail)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Markup</span>
                    <span className="font-medium text-brand-charcoal">{markupPct.toFixed(1)}%</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex items-center justify-between text-sm">
                    <span className="text-gray-500">Profit / unit</span>
                    <span className="font-bold text-green-700">{fmt(profit)}</span>
                  </div>
                </div>

                {quantity > 1 && (
                  <div className={`rounded-xl p-3 space-y-1.5 ${badge.replace('text-', 'bg-').split(' ')[0]}/20`}>
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      {quantity.toLocaleString()} units
                    </p>
                    <div className="flex items-center gap-1 text-sm">
                      <ArrowRight className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-500">Revenue:</span>
                      <span className="font-bold text-brand-charcoal ml-auto">{fmt(totalRevenue)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <ArrowRight className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-500">Profit:</span>
                      <span className="font-bold text-green-700 ml-auto">{fmt(totalProfit)}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-10 text-center max-w-3xl">
          <div className="text-4xl mb-3">💰</div>
          <p className="text-gray-500 text-sm">Enter a wholesale cost above to see retail price recommendations.</p>
        </div>
      )}

      {/* Formula reference */}
      <div className="mt-6 rounded-xl bg-gray-50 border border-gray-100 p-4 max-w-3xl">
        <p className="text-xs text-gray-500">
          <strong className="text-gray-700">Formula:</strong>{' '}
          Retail Price = Wholesale Cost ÷ (1 − Margin%). Example: $1.00 cost at 40% margin → $1.00 ÷ 0.60 = <strong>$1.67 retail</strong>.
          Markup % = Profit ÷ Wholesale Cost × 100.
        </p>
      </div>
    </div>
  )
}
