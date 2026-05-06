'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Package, Truck, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/components/cart/CartContext'

export function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const { clearCart } = useCart()
  const [cleared, setCleared] = useState(false)

  useEffect(() => {
    if (!cleared) {
      clearCart()
      setCleared(true)
    }
  }, [clearCart, cleared])

  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>

      <h1 className="text-3xl font-bold text-brand-charcoal mb-3">Order Confirmed!</h1>
      <p className="text-gray-500 mb-2">
        Thank you for your order. You'll receive a confirmation email shortly.
      </p>
      {sessionId && (
        <p className="text-xs text-gray-400 mb-8 font-mono">{sessionId.slice(0, 24)}…</p>
      )}

      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 mb-8 text-left space-y-4">
        <h3 className="font-semibold text-brand-charcoal">What happens next?</h3>
        {[
          { icon: <Package className="h-5 w-5 text-brand-green" />, text: "We're preparing your order" },
          { icon: <Truck className="h-5 w-5 text-brand-green" />, text: 'Your order will be delivered or ready for pickup' },
          { icon: <ShoppingBag className="h-5 w-5 text-brand-green" />, text: "You'll receive updates via email" },
        ].map((step) => (
          <div key={step.text} className="flex items-center gap-3">
            {step.icon}
            <span className="text-sm text-gray-600">{step.text}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild size="lg">
          <Link href="/shop">Continue Shopping</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  )
}
