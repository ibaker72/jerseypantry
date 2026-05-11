'use client'

import { useState } from 'react'
import { ShoppingCart, Minus, Plus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/components/cart/CartContext'
import type { Product, WholesaleDisplay } from '@/types'

interface AddToCartButtonProps {
  product: Product
  wholesale?: WholesaleDisplay | null
}

export function AddToCartButton({ product, wholesale }: AddToCartButtonProps) {
  const { cart, addToCart, updateItemQuantity } = useCart()
  const [added, setAdded] = useState(false)
  const cartItem = cart.items.find((i) => i.product_id === product.id)
  const isOutOfStock = product.inventory_quantity === 0
  const isWholesale = Boolean(wholesale)
  const unitPrice = isWholesale ? wholesale!.wholesale_price : product.retail_price

  const handleAdd = () => {
    addToCart({
      id: product.id,
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      image_url: product.image_url,
      retail_price: unitPrice,
      quantity: 1,
      inventory_quantity: product.inventory_quantity,
      shipping_eligible: product.shipping_eligible,
      delivery_eligible: product.delivery_eligible,
      sku: product.sku,
      is_wholesale: isWholesale || undefined,
      case_size: isWholesale ? wholesale!.case_size : undefined,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (isOutOfStock) {
    return (
      <Button size="lg" disabled className="w-full">
        Out of Stock
      </Button>
    )
  }

  if (cartItem) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-xl border-2 border-brand-green overflow-hidden">
          <button
            onClick={() => updateItemQuantity(product.id, cartItem.quantity - 1)}
            className="px-4 py-3 hover:bg-brand-green/10 transition-colors"
          >
            <Minus className="h-4 w-4 text-brand-green" />
          </button>
          <span className="px-4 font-semibold text-brand-green text-lg min-w-[2.5rem] text-center">
            {cartItem.quantity}
          </span>
          <button
            onClick={() => updateItemQuantity(product.id, cartItem.quantity + 1)}
            disabled={cartItem.quantity >= product.inventory_quantity}
            className="px-4 py-3 hover:bg-brand-green/10 transition-colors disabled:opacity-40"
          >
            <Plus className="h-4 w-4 text-brand-green" />
          </button>
        </div>
        <Button size="lg" className="flex-1" variant="outline" onClick={handleAdd}>
          <Check className="h-4 w-4" /> In Cart — Add More
        </Button>
      </div>
    )
  }

  return (
    <Button size="lg" className="w-full" onClick={handleAdd}>
      {added ? (
        <>
          <Check className="h-5 w-5" /> Added to Cart!
        </>
      ) : (
        <>
          <ShoppingCart className="h-5 w-5" />
          {isWholesale ? `Add Case (×${wholesale!.case_size})` : 'Add to Cart'}
        </>
      )}
    </Button>
  )
}
