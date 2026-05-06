'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductBadgeList } from './ProductBadge'
import { useCart } from '@/components/cart/CartContext'
import { formatPrice } from '@/lib/utils/format'
import type { Product } from '@/types'
import { cn } from '@/lib/utils/cn'

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { cart, addToCart, updateItemQuantity } = useCart()
  const cartItem = cart.items.find((i) => i.product_id === product.id)
  const isOutOfStock = product.inventory_quantity === 0

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      image_url: product.image_url,
      retail_price: product.retail_price,
      quantity: 1,
      inventory_quantity: product.inventory_quantity,
      shipping_eligible: product.shipping_eligible,
      delivery_eligible: product.delivery_eligible,
      sku: product.sku,
    })
  }

  return (
    <div className={cn('group relative flex flex-col rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden', className)}>
      {/* Image */}
      <Link href={`/shop/${product.slug}`} className="relative block aspect-square overflow-hidden bg-brand-cream">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🛍️</div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-brand-charcoal text-xs font-bold px-3 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
        {product.compare_at_price && product.compare_at_price > product.retail_price && (
          <div className="absolute top-2 left-2 bg-brand-orange text-white text-xs font-bold px-2 py-1 rounded-full">
            SALE
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-col gap-2 p-3 flex-1">
        <ProductBadgeList badges={product.badges} max={2} />

        <Link href={`/shop/${product.slug}`} className="hover:text-brand-green transition-colors">
          <h3 className="text-sm font-semibold text-brand-charcoal leading-tight line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {product.brand && (
          <p className="text-xs text-gray-500">{product.brand}{product.size ? ` · ${product.size}` : ''}</p>
        )}

        <div className="flex items-center gap-2 mt-auto">
          <span className="text-base font-bold text-brand-charcoal">
            {formatPrice(product.retail_price)}
          </span>
          {product.compare_at_price && product.compare_at_price > product.retail_price && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>

        {/* Cart controls */}
        {!isOutOfStock && (
          <>
            {cartItem ? (
              <div className="flex items-center justify-between rounded-xl bg-brand-green/10 border border-brand-green/20">
                <button
                  onClick={() => updateItemQuantity(product.id, cartItem.quantity - 1)}
                  className="p-2 hover:bg-brand-green/10 rounded-l-xl transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4 text-brand-green" />
                </button>
                <span className="text-sm font-semibold text-brand-green px-2">
                  {cartItem.quantity}
                </span>
                <button
                  onClick={() => updateItemQuantity(product.id, cartItem.quantity + 1)}
                  disabled={cartItem.quantity >= product.inventory_quantity}
                  className="p-2 hover:bg-brand-green/10 rounded-r-xl transition-colors disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4 text-brand-green" />
                </button>
              </div>
            ) : (
              <Button
                onClick={handleAddToCart}
                size="sm"
                className="w-full gap-1.5"
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </Button>
            )}
          </>
        )}
        {isOutOfStock && (
          <Button size="sm" disabled className="w-full">
            Out of Stock
          </Button>
        )}
      </div>
    </div>
  )
}
