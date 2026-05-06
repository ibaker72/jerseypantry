'use client'

import { useState } from 'react'
import { MapPin, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { DeliveryZone } from '@/types'

interface DeliveryZoneCheckerProps {
  onZoneFound?: (zone: DeliveryZone) => void
}

export function DeliveryZoneChecker({ onZoneFound }: DeliveryZoneCheckerProps) {
  const [zip, setZip] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ available: boolean; zone?: DeliveryZone; reason?: string } | null>(null)

  const check = async () => {
    if (!zip || zip.length < 5) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/delivery/check?zip=${zip}`)
      const data = await res.json()
      setResult(data)
      if (data.available && data.zone) {
        onZoneFound?.(data.zone)
      }
    } catch {
      setResult({ available: false, reason: 'Unable to check delivery. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5 text-brand-green" />
        <h3 className="font-semibold text-brand-charcoal">Check Local Delivery</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Enter your ZIP code to see if we deliver to your area in North Jersey.
      </p>
      <div className="flex gap-2">
        <Input
          placeholder="Enter ZIP code"
          value={zip}
          onChange={(e) => setZip(e.target.value.slice(0, 5))}
          onKeyDown={(e) => e.key === 'Enter' && check()}
          maxLength={5}
          className="flex-1"
        />
        <Button onClick={check} disabled={loading || zip.length < 5}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check'}
        </Button>
      </div>

      {result && (
        <div className={`mt-4 flex items-start gap-3 rounded-xl p-4 ${result.available ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
          {result.available ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-800">
                  We deliver to {result.zone?.city ?? zip}!
                </p>
                <p className="text-xs text-green-700 mt-0.5">
                  {result.zone?.delivery_fee === 0
                    ? 'Free delivery available'
                    : `Delivery fee: $${result.zone?.delivery_fee.toFixed(2)} · Free over $${result.zone?.free_delivery_minimum}`}
                </p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{result.reason}</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
