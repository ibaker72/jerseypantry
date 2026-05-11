'use client'

import { memo, useCallback, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Plus, Minus, Zap, CalendarClock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductBadgeList } from './ProductBadge'
import { FlashSaleCountdown } from './FlashSaleCountdown'
import { useCart } from '@/components/cart/CartContext'
import { formatPrice } from '@/lib/utils/format'
import { getCategoryFallback } from '@/lib/utils/imageFallback'
import type { Product, FlashSale, WholesaleDisplay } from '@/types'
import { cn } from '@/lib/utils/cn'

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

interface ProductCardProps {
  product: Product
  flashSale?: FlashSale | null
  wholesale?: WholesaleDisplay | null
  className?: string
}

export const ProductCard = memo(function ProductCard({ product, flashSale, wholesale, className }: ProductCardProps) {
  const { cart, addToCart, updateItemQuantity } = useCart()
  const cartItem = cart.items.find((i) => i.product_id === product.id)
  const isOutOfStock = product.inventory_quantity === 0
  const [imgSrc, setImgSrc] = useState(product.image_url)

  // Wholesale mode short-circuits flash sales and compare-at pricing.
  const isWholesale = Boolean(wholesale)
  const effectiveFlashSale = isWholesale ? null : flashSale
  const showCompareAt = !isWholesale && product.compare_at_price && product.compare_at_price > product.retail_price

  const salePrice = effectiveFlashSale
    ? effectiveFlashSale.discount_type === 'percent'
      ? Math.max(
          0,
          product.retail_price - Math.min(
            (product.retail_price * effectiveFlashSale.discount_value) / 100,
            effectiveFlashSale.max_discount ?? Infinity
          )
        )
      : Math.max(0, product.retail_price - effectiveFlashSale.discount_value)
    : null
  const retailDisplayPrice = salePrice ?? product.retail_price
  const unitPrice = isWholesale ? wholesale!.wholesale_price : retailDisplayPrice
  const casePrice = isWholesale ? wholesale!.wholesale_price * wholesale!.case_size : null

  const handleAddToCart = useCallback(() => {
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
  }, [addToCart, product, unitPrice, isWholesale, wholesale])

  return (
    <div className={cn('group relative flex flex-col rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden min-h-[340px]', className)}>
      {/* Image */}
      <Link href={`/shop/${product.slug}`} className="relative block aspect-square overflow-hidden bg-brand-cream">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={() => setImgSrc(getCategoryFallback(product.category?.slug))}
            unoptimized={imgSrc.includes('placehold.co')}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#FAF8F3] via-[#EFF1F7] to-[#E8EBF4] border border-[#DDE0EA]">
            <span className="text-5xl select-none leading-none">
              {CATEGORY_EMOJI[product.category?.slug ?? ''] ?? '🛍️'}
            </span>
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-brand-charcoal text-xs font-bold px-3 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
        {isWholesale ? (
          <div className="absolute top-2 left-2 bg-amber-400 text-slate-900 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full">
            Wholesale
          </div>
        ) : (
          (effectiveFlashSale || showCompareAt) && (
            <div className="absolute top-2 left-2 bg-brand-orange text-white text-xs font-bold px-2 py-1 rounded-full">
              {effectiveFlashSale ? effectiveFlashSale.badge_label : 'SALE'}
            </div>
          )
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
          <p className="text-[11px] text-gray-400 tracking-wide truncate">{product.brand}{product.size ? ` · ${product.size}` : ''}</p>
        )}

        {effectiveFlashSale && (
          <FlashSaleCountdown endsAt={effectiveFlashSale.ends_at} badgeLabel="" className="text-xs py-1 px-2" />
        )}

        {isWholesale ? (
          <div className="mt-auto">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold text-brand-navy">
                {formatPrice(casePrice!)}
              </span>
              <span className="text-[11px] text-gray-500">/ case</span>
            </div>
            <p className="text-[11px] text-gray-500">
              {formatPrice(unitPrice)} / unit · {wholesale!.case_size}/case
            </p>
            <VerdictBadge verdict={wholesale!.verdict} />
          </div>
        ) : (
          <div className="flex items-baseline gap-2 mt-auto">
            <span className={`text-lg font-extrabold ${effectiveFlashSale ? 'text-brand-orange' : 'text-brand-navy'}`}>
              {formatPrice(retailDisplayPrice)}
            </span>
            {(effectiveFlashSale || showCompareAt) && (
              <span className="text-xs text-gray-400 line-through font-medium">
                {formatPrice(effectiveFlashSale ? product.retail_price : product.compare_at_price!)}
              </span>
            )}
          </div>
        )}

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
                className={`w-full gap-1.5 font-semibold text-white ${
                  isWholesale
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-brand-orange hover:bg-brand-orange/90'
                }`}
              >
                <ShoppingCart className="h-4 w-4" />
                {isWholesale ? `Add Case (×${wholesale!.case_size})` : 'Add to Cart'}
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
})

function VerdictBadge({ verdict }: { verdict: WholesaleDisplay['verdict'] }) {
  if (!verdict) return null
  if (verdict === 'stock_now') {
    return (
      <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 bg-emerald-100 text-emerald-700">
        <Zap className="h-3 w-3" /> Instant Delivery
      </span>
    )
  }
  if (verdict === 'virtual') {
    return (
      <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 bg-amber-100 text-amber-700">
        <CalendarClock className="h-3 w-3" /> 24hr Pre-order
      </span>
    )
  }
  return (
    <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 bg-gray-100 text-gray-600">
      <CheckCircle className="h-3 w-3" /> Available
    </span>
  )
}
