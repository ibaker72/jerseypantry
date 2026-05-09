'use client'

import { memo, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Minus } from 'lucide-react'
import { useCart } from '@/components/cart/CartContext'
import { formatPrice } from '@/lib/utils/format'
import type { Product } from '@/types'

const CATEGORY_EMOJI: Record<string, string> = {
  'drinks': '🥤',
  'energy-hydration': '⚡',
  'chips-salty-snacks': '🍟',
  'candy-chocolate': '🍫',
  'cookies-sweets': '🍪',
  'coffee-tea': '☕',
  'middle-eastern-favorites': '🫒',
  'household-essentials': '🧻',
  'personal-care': '🧴',
  'bundles': '📦',
  'office-refill': '🏢',
  'local-delivery-deals': '🛵',
}

interface ProductCellProps {
  product: Product
}

export const ProductCell = memo(function ProductCell({ product }: ProductCellProps) {
  const { cart, addToCart, updateItemQuantity } = useCart()
  const cartItem = cart.items.find((i) => i.product_id === product.id)
  const isOutOfStock = product.inventory_quantity === 0
  const onSale =
    product.compare_at_price != null &&
    product.compare_at_price > product.retail_price

  const handleAdd = useCallback(() => {
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
  }, [addToCart, product])

  return (
    <div className="group border border-gray-200 hover:border-orange-400 bg-white flex flex-col transition-colors">
      {/* Strict-square image */}
      <Link
        href={`/shop/${product.slug}`}
        className="relative block aspect-square bg-gray-50 overflow-hidden"
      >
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 17vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FAF8F3] via-[#EFF1F7] to-[#E8EBF4]">
            <span className="text-4xl select-none leading-none">
              {CATEGORY_EMOJI[product.category?.slug ?? ''] ?? '🛍️'}
            </span>
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/75 flex items-center justify-center">
            <span className="text-[10px] font-bold text-gray-600 border border-gray-400 px-2 py-0.5 uppercase tracking-wide">
              Out of Stock
            </span>
          </div>
        )}

        {onSale && !isOutOfStock && (
          <div className="absolute top-1.5 left-1.5 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wide">
            Sale
          </div>
        )}
      </Link>

      {/* Info block */}
      <div className="flex flex-col gap-0.5 p-2 flex-1">
        {/* Brand */}
        {product.brand && (
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide truncate">
            {product.brand}
          </p>
        )}

        {/* Product title — 2-line clamp */}
        <Link href={`/shop/${product.slug}`} className="block">
          <h3 className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Size */}
        {product.size && (
          <p className="text-[10px] text-gray-400">{product.size}</p>
        )}

        {/* Price row */}
        <div className="flex items-baseline gap-1.5 mt-auto pt-1">
          <span className="text-sm font-bold text-gray-900">
            {formatPrice(product.retail_price)}
          </span>
          {onSale && (
            <span className="text-[10px] text-gray-400 line-through">
              {formatPrice(product.compare_at_price!)}
            </span>
          )}
        </div>

        {/* Cart controls */}
        {isOutOfStock ? (
          <button
            disabled
            className="mt-1.5 w-full bg-gray-100 text-gray-400 text-[11px] font-medium py-1.5 cursor-not-allowed"
          >
            Out of Stock
          </button>
        ) : cartItem ? (
          <div className="mt-1.5 flex items-center justify-between border border-orange-400 bg-orange-50">
            <button
              onClick={() =>
                updateItemQuantity(product.id, cartItem.quantity - 1)
              }
              className="p-1.5 hover:bg-orange-100 transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3 text-orange-600" />
            </button>
            <span className="text-xs font-bold text-orange-700">
              {cartItem.quantity}
            </span>
            <button
              onClick={() =>
                updateItemQuantity(product.id, cartItem.quantity + 1)
              }
              disabled={cartItem.quantity >= product.inventory_quantity}
              className="p-1.5 hover:bg-orange-100 transition-colors disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3 text-orange-600" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleAdd}
            className="mt-1.5 w-full bg-orange-400 hover:bg-orange-500 text-slate-900 text-[11px] font-bold py-1.5 transition-colors"
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  )
})
