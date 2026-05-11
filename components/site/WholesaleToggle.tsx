'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Warehouse, X } from 'lucide-react'
import { useCart } from '@/components/cart/CartContext'
import { setWholesaleMode } from '@/lib/wholesale/mode'
import { toast } from '@/components/ui/use-toast'

interface WholesaleToggleProps {
  initialOn: boolean
}

export function WholesaleToggle({ initialOn }: WholesaleToggleProps) {
  const router = useRouter()
  const { itemCount, clearCart } = useCart()
  const [on, setOn] = useState(initialOn)
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  const commitFlip = (next: boolean) => {
    startTransition(async () => {
      const res = await setWholesaleMode(next)
      if (!res.success) {
        toast({ title: 'Unable to switch', description: res.error, variant: 'destructive' })
        return
      }
      setOn(next)
      router.refresh()
    })
  }

  const handleClick = () => {
    const next = !on
    if (itemCount > 0) {
      setConfirming(true)
      return
    }
    commitFlip(next)
  }

  const handleConfirm = () => {
    clearCart()
    setConfirming(false)
    commitFlip(!on)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        title={on ? 'Wholesale Mode is ON' : 'Switch to Wholesale Mode'}
        className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 whitespace-nowrap rounded-sm transition-colors disabled:opacity-60 ${
          on
            ? 'bg-amber-400 text-slate-900 hover:bg-amber-300'
            : 'border border-amber-400/60 text-amber-300 hover:bg-amber-400/10'
        }`}
      >
        <Warehouse className="h-3 w-3" />
        {on ? 'Wholesale: ON' : 'Wholesale Mode'}
      </button>

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setConfirming(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-brand-charcoal text-lg">Switch modes?</h3>
              <button
                onClick={() => setConfirming(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Switching to {on ? 'retail' : 'wholesale'} pricing will clear your current cart
              ({itemCount} {itemCount === 1 ? 'item' : 'items'}). Retail and wholesale orders
              can&apos;t be mixed in one checkout.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 text-sm font-semibold border border-gray-200 text-gray-700 rounded-xl py-2.5 hover:bg-gray-50"
              >
                Keep cart
              </button>
              <button
                onClick={handleConfirm}
                disabled={pending}
                className="flex-1 text-sm font-semibold bg-amber-500 text-white rounded-xl py-2.5 hover:bg-amber-600 disabled:opacity-60"
              >
                Clear &amp; switch
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
