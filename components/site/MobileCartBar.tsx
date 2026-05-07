'use client'

import Link from 'next/link'
import { ShoppingCart, ArrowRight } from 'lucide-react'
import { useCart } from '@/components/cart/CartContext'
import { formatPrice } from '@/lib/utils/format'

export function MobileCartBar() {
  const { itemCount, subtotal } = useCart()

  if (itemCount === 0) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 lg:hidden">
      <div className="bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-xl px-4 py-3">
        <Link
          href="/cart"
          className="flex items-center justify-between w-full bg-brand-orange hover:bg-brand-orange/90 text-white rounded-xl px-5 py-3.5 font-semibold text-sm transition-colors active:scale-[0.98]"
        >
          <div className="flex items-center gap-2.5">
            <div className="bg-white/20 rounded-lg p-1.5">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <span>
              {itemCount} {itemCount === 1 ? 'item' : 'items'} in cart
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold">{formatPrice(subtotal)}</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>
      </div>
    </div>
  )
}
