'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Minus, Plus, X, Truck, Package, ShoppingBag, Loader2, Tag, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/components/cart/CartContext'
import { EmptyState } from '@/components/shop/EmptyState'
import { formatPrice } from '@/lib/utils/format'
import { calculatePricing } from '@/lib/pricing/calculate'
import type { FulfillmentMethod, DeliveryZone } from '@/types'

const FULFILLMENT_OPTIONS: { value: FulfillmentMethod; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'local_delivery', label: 'Local Delivery', desc: 'Same-day delivery · $4.99 (free over $50)', icon: <Truck className="h-4 w-4" /> },
  { value: 'pickup', label: 'Pickup', desc: 'Pick up in North Jersey · Free', icon: <ShoppingBag className="h-4 w-4" /> },
  { value: 'shipping', label: 'Shipping', desc: 'Standard shipping · $8.99', icon: <Package className="h-4 w-4" /> },
]

export function CartPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const canceled = searchParams.get('canceled') === 'true'
  const { cart, itemCount, subtotal, removeFromCart, updateItemQuantity, setFulfillmentMethod, setPostalCode, setCouponCode } = useCart()
  const [zip, setZip] = useState(cart.postal_code)
  const [zone, setZone] = useState<DeliveryZone | null>(null)
  const [zoneLoading, setZoneLoading] = useState(false)
  const [couponInput, setCouponInput] = useState(cart.coupon_code)
  const [coupon, setCoupon] = useState<{ type: 'percent' | 'fixed'; value: number } | null>(null)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [email, setEmail] = useState('')

  const checkZone = async (zipCode: string) => {
    if (!zipCode || zipCode.length < 5) return
    setZoneLoading(true)
    try {
      const res = await fetch(`/api/delivery/check?zip=${zipCode}`)
      const data = await res.json()
      if (data.available) setZone(data.zone)
      else setZone(null)
    } catch {
      setZone(null)
    } finally {
      setZoneLoading(false)
    }
  }

  useEffect(() => {
    if (cart.fulfillment_method === 'local_delivery' && cart.postal_code) {
      checkZone(cart.postal_code)
    }
  }, [cart.fulfillment_method, cart.postal_code])

  const applyCoupon = async () => {
    if (!couponInput) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await fetch(`/api/coupon/validate?code=${encodeURIComponent(couponInput)}`)
      const data = await res.json()
      if (data.valid) {
        setCoupon({ type: data.type, value: data.value })
        setCouponCode(couponInput)
        setCouponError('')
      } else {
        setCoupon(null)
        setCouponError(data.error ?? 'Invalid coupon code')
      }
    } catch {
      setCouponError('Could not validate coupon')
    } finally {
      setCouponLoading(false)
    }
  }

  const pricing = calculatePricing(
    cart.items,
    cart.fulfillment_method,
    zone?.delivery_fee,
    zone?.free_delivery_minimum,
    coupon?.type,
    coupon?.value
  )

  const handleCheckout = async () => {
    if (!email) { setCheckoutError('Please enter your email address.'); return }
    setCheckoutLoading(true)
    setCheckoutError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
          fulfillment_method: cart.fulfillment_method,
          email,
          postal_code: cart.postal_code,
          coupon_code: coupon ? couponInput : undefined,
        }),
      })
      const data = await res.json()
      if (data.url) {
        router.push(data.url)
      } else {
        setCheckoutError(data.error ?? 'Checkout failed. Please try again.')
      }
    } catch {
      setCheckoutError('Something went wrong. Please try again.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (itemCount === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <EmptyState
          title="Your cart is empty"
          description="Add some snacks, drinks, or essentials to get started!"
          icon="🛒"
          action={
            <Button asChild size="lg">
              <Link href="/shop">Browse Products</Link>
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-brand-charcoal mb-2">Your Cart</h1>
      <p className="text-gray-500 mb-8">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>

      {canceled && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-yellow-50 border border-yellow-100 p-4 text-sm text-yellow-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Checkout was canceled. Your cart is still saved.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div key={item.product_id} className="flex gap-4 rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
              <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-brand-cream shrink-0">
                {item.image_url ? (
                  <Image src={item.image_url} alt={item.name} fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/shop/${item.slug}`} className="font-semibold text-brand-charcoal hover:text-brand-green line-clamp-2 text-sm leading-tight">
                  {item.name}
                </Link>
                <p className="text-sm font-bold text-brand-charcoal mt-1">{formatPrice(item.retail_price)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => updateItemQuantity(item.product_id, item.quantity - 1)} className="h-7 w-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-sm font-semibold w-8 text-center">{item.quantity}</span>
                  <button onClick={() => updateItemQuantity(item.product_id, item.quantity + 1)} disabled={item.quantity >= item.inventory_quantity} className="h-7 w-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-40">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => removeFromCart(item.product_id)} className="p-1 text-gray-400 hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
                <p className="font-semibold text-brand-charcoal text-sm">{formatPrice(item.retail_price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="space-y-4">
          {/* Fulfillment */}
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-brand-charcoal mb-4">Delivery Method</h2>
            <div className="space-y-2">
              {FULFILLMENT_OPTIONS.map((opt) => (
                <label key={opt.value} className={`flex items-center gap-3 rounded-xl border-2 p-3 cursor-pointer transition-colors ${cart.fulfillment_method === opt.value ? 'border-brand-green bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}>
                  <input type="radio" name="fulfillment" value={opt.value} checked={cart.fulfillment_method === opt.value} onChange={() => setFulfillmentMethod(opt.value)} className="sr-only" />
                  <span className={cart.fulfillment_method === opt.value ? 'text-brand-green' : 'text-gray-400'}>{opt.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-brand-charcoal">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {cart.fulfillment_method === 'local_delivery' && (
              <div className="mt-4 space-y-2">
                <Label className="text-xs">Your ZIP Code</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="07501"
                    value={zip}
                    maxLength={5}
                    onChange={(e) => setZip(e.target.value)}
                    className="flex-1 text-sm"
                  />
                  <Button size="sm" onClick={() => { setPostalCode(zip); checkZone(zip); }} disabled={zoneLoading || zip.length < 5}>
                    {zoneLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Check'}
                  </Button>
                </div>
                {zone && (
                  <p className="text-xs text-green-700 font-medium">✓ Delivery available in {zone.city}</p>
                )}
                {cart.postal_code && !zone && !zoneLoading && (
                  <p className="text-xs text-red-600">ZIP not in delivery zone</p>
                )}
              </div>
            )}
          </div>

          {/* Coupon */}
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-brand-charcoal mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4 text-brand-green" /> Coupon Code
            </h2>
            <div className="flex gap-2">
              <Input placeholder="CORNER10" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} className="flex-1 text-sm" />
              <Button size="sm" variant="outline" onClick={applyCoupon} disabled={couponLoading || !couponInput}>
                {couponLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
              </Button>
            </div>
            {couponError && <p className="text-xs text-red-600 mt-2">{couponError}</p>}
            {coupon && <p className="text-xs text-green-700 font-medium mt-2">✓ Coupon applied!</p>}
          </div>

          {/* Order summary */}
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-brand-charcoal">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span><span>{formatPrice(pricing.subtotal)}</span>
              </div>
              {pricing.delivery_fee > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span><span>{formatPrice(pricing.delivery_fee)}</span>
                </div>
              )}
              {pricing.delivery_fee === 0 && cart.fulfillment_method === 'local_delivery' && (
                <div className="flex justify-between text-green-700 font-medium">
                  <span>Delivery</span><span>FREE</span>
                </div>
              )}
              {pricing.shipping_fee > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span><span>{formatPrice(pricing.shipping_fee)}</span>
                </div>
              )}
              {pricing.discount_amount > 0 && (
                <div className="flex justify-between text-green-700 font-medium">
                  <span>Discount</span><span>−{formatPrice(pricing.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-gray-400">
                <span>Tax</span><span>Calculated at checkout</span>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-brand-charcoal">
              <span>Total</span><span>{formatPrice(pricing.total)}</span>
            </div>

            <div className="space-y-2 pt-1">
              <Label htmlFor="email" className="text-xs">Email for order confirmation</Label>
              <Input id="email" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="text-sm" />
            </div>

            {checkoutError && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg p-2">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {checkoutError}
              </div>
            )}

            <Button size="lg" className="w-full" onClick={handleCheckout} disabled={checkoutLoading}>
              {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Proceed to Checkout'}
            </Button>
            <p className="text-xs text-center text-gray-400">Secure checkout powered by Stripe</p>
          </div>
        </div>
      </div>
    </div>
  )
}
