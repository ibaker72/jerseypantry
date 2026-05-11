import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductBadgeList } from '@/components/shop/ProductBadge'
import { ProductCard } from '@/components/shop/ProductCard'
import { getWholesaleMode } from '@/lib/wholesale/mode'
import { buildWholesaleMap } from '@/lib/wholesale/enrich'
import { AddToCartButton } from './AddToCartButton'
import { SubscribeButton } from './SubscribeButton'
import { formatPrice } from '@/lib/utils/format'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildMetadata, productSchema, breadcrumbSchema, SITE_URL } from '@/lib/seo/metadata'
import { Truck, Package, CheckCircle, XCircle } from 'lucide-react'
import type { Product, Category } from '@/types'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('name, description, image_url, price')
    .eq('slug', slug)
    .single()
  if (!data) return {}
  return buildMetadata({
    title: data.name,
    description: data.description ?? undefined,
    path: `/shop/${slug}`,
    image: data.image_url ?? undefined,
  })
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const wholesaleMode = await getWholesaleMode()
  const productsTable = wholesaleMode ? 'products_with_wholesale' : 'products'

  const { data: product } = await supabase
    .from(productsTable)
    .select('*, category:categories(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!product) notFound()

  const p = product as Product & { category: Category | null }

  const { data: related } = await supabase
    .from(productsTable)
    .select('*, category:categories(*)')
    .eq('is_active', true)
    .eq('category_id', p.category_id ?? '')
    .neq('id', p.id)
    .limit(4)

  const relatedProducts = (related ?? []) as Product[]
  const wholesaleMap = wholesaleMode
    ? await buildWholesaleMap([p, ...relatedProducts])
    : {}
  const pWholesale = wholesaleMode ? wholesaleMap[p.id] : null

  const breadcrumbs = [
    { name: 'Home', url: SITE_URL },
    { name: 'Shop', url: `${SITE_URL}/shop` },
    ...(p.category ? [{ name: p.category.name, url: `${SITE_URL}/categories/${p.category.slug}` }] : []),
    { name: p.name, url: `${SITE_URL}/shop/${p.slug}` },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <JsonLd data={[
        productSchema({ name: p.name, description: p.description, price: p.retail_price, image: p.image_url, slug: p.slug, inStock: (p.inventory_quantity ?? 0) > 0, brand: p.brand }),
        breadcrumbSchema(breadcrumbs),
      ]} />
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-brand-green">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-brand-green">Shop</Link>
        {p.category && (
          <>
            <span>/</span>
            <Link href={`/categories/${p.category.slug}`} className="hover:text-brand-green">{p.category.name}</Link>
          </>
        )}
        <span>/</span>
        <span className="text-brand-charcoal font-medium truncate">{p.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Image */}
        <div className="relative aspect-square rounded-3xl overflow-hidden bg-brand-cream">
          {p.image_url ? (
            <Image
              src={p.image_url}
              alt={p.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl">🛍️</div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5">
          <div>
            <ProductBadgeList badges={p.badges} />
            <h1 className="text-2xl sm:text-3xl font-bold text-brand-charcoal mt-3">{p.name}</h1>
            {p.brand && (
              <p className="text-gray-500 mt-1">{p.brand}{p.size ? ` · ${p.size}` : ''}</p>
            )}
          </div>

          {pWholesale ? (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-brand-charcoal">
                  {formatPrice(pWholesale.wholesale_price * pWholesale.case_size)}
                </span>
                <span className="text-sm text-gray-500">/ case</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {formatPrice(pWholesale.wholesale_price)} per unit · Case of {pWholesale.case_size}
              </p>
              {pWholesale.verdict === 'stock_now' && (
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 bg-emerald-100 text-emerald-700">
                  ⚡ Instant Delivery
                </span>
              )}
              {pWholesale.verdict === 'virtual' && (
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 bg-amber-100 text-amber-700">
                  📅 24hr Pre-order
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-brand-charcoal">{formatPrice(p.retail_price)}</span>
              {p.compare_at_price && p.compare_at_price > p.retail_price && (
                <span className="text-lg text-gray-400 line-through">{formatPrice(p.compare_at_price)}</span>
              )}
            </div>
          )}

          {p.description && (
            <p className="text-gray-600 leading-relaxed">{p.description}</p>
          )}

          {/* Stock */}
          <div className="flex items-center gap-2">
            {p.inventory_quantity > 0 ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-700 font-medium">
                  In Stock{p.inventory_quantity <= 5 ? ` · Only ${p.inventory_quantity} left!` : ''}
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600 font-medium">Out of Stock</span>
              </>
            )}
          </div>

          {/* Fulfillment */}
          <div className="rounded-xl bg-brand-cream border border-gray-100 p-4 space-y-2">
            {p.delivery_eligible && (
              <div className="flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4 text-brand-green" />
                <span className="text-gray-700">Available for <strong>local delivery</strong> · Free over $50</span>
              </div>
            )}
            {p.shipping_eligible && (
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-brand-green" />
                <span className="text-gray-700">Available for <strong>shipping</strong> · $8.99 flat rate</span>
              </div>
            )}
          </div>

          <AddToCartButton product={p as Product} wholesale={pWholesale ?? null} />

          {/* Subscribe & Save — only for delivery/shipping eligible products */}
          {p.inventory_quantity > 0 && (p.delivery_eligible || p.shipping_eligible) && (
            <SubscribeButton product={p as Product} />
          )}
        </div>
      </div>

      {/* Related */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl font-bold text-brand-charcoal mb-6">You might also like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedProducts.map((rp) => (
              <ProductCard
                key={rp.id}
                product={rp}
                wholesale={wholesaleMode ? wholesaleMap[rp.id] : null}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
