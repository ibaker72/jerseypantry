'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { X, Minus, Plus, ShoppingCart, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useCart, useCartUI } from './CartContext'
import { formatPrice } from '@/lib/utils/format'
import { EmptyState } from '@/components/shop/EmptyState'
import Link from 'next/link'

export function CartDrawer() {
  const { cart, itemCount, subtotal, removeFromCart, updateItemQuantity } = useCart()
  const { isOpen, closeCart } = useCartUI()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleCheckout = () => {
    closeCart()
    router.push('/cart')
  }

  const freeDeliveryRemaining = Math.max(0, 50 - subtotal)

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent side="right" className="flex flex-col p-0 w-full sm:max-w-md">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-brand-green" />
            Cart {itemCount > 0 && <span className="text-sm font-normal text-gray-500">({itemCount} item{itemCount !== 1 ? 's' : ''})</span>}
          </SheetTitle>
        </SheetHeader>

        {/* Free delivery progress */}
        {subtotal > 0 && (
          <div className="px-6 py-3 bg-brand-cream border-b">
            {freeDeliveryRemaining > 0 ? (
              <>
                <p className="text-xs text-gray-600 mb-1.5">
                  Add <span className="font-semibold text-brand-green">{formatPrice(freeDeliveryRemaining)}</span> more for free local delivery
                </p>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-green rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (subtotal / 50) * 100)}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="text-xs font-semibold text-brand-green">🎉 You qualify for free local delivery!</p>
            )}
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-2">
          {cart.items.length === 0 ? (
            <EmptyState
              title="Your cart is empty"
              description="Add some items to get started!"
              icon="🛒"
              action={
                <Button asChild onClick={closeCart}>
                  <Link href="/shop">Browse Products</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-gray-50">
              {cart.items.map((item) => (
                <li key={item.product_id} className="flex gap-3 px-6 py-4">
                  {/* Image */}
                  <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-brand-cream shrink-0">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-charcoal line-clamp-2 leading-tight">
                      {item.name}
                    </p>
                    <p className="text-sm font-bold text-brand-charcoal mt-0.5">
                      {formatPrice(item.retail_price)}
                    </p>
                    {/* Qty controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateItemQuantity(item.product_id, item.quantity - 1)}
                        className="h-6 w-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-semibold w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateItemQuantity(item.product_id, item.quantity + 1)}
                        disabled={item.quantity >= item.inventory_quantity}
                        className="h-6 w-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-40"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Remove */}
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label={`Remove ${item.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <p className="text-sm font-semibold text-brand-charcoal">
                      {formatPrice(item.retail_price * item.quantity)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="border-t px-6 py-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-gray-400">Delivery fee, tax & discounts calculated at checkout</p>
            <Button
              onClick={handleCheckout}
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'View Cart & Checkout'}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
