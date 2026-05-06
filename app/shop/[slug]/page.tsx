import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductBadgeList } from '@/components/shop/ProductBadge'
import { ProductCard } from '@/components/shop/ProductCard'
import { AddToCartButton } from './AddToCartButton'
import { formatPrice } from '@/lib/utils/format'
import { Truck, Package, CheckCircle, XCircle } from 'lucide-react'
import type { Product, Category } from '@/types'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('products').select('name, description').eq('slug', slug).single()
  if (!data) return {}
  return { title: data.name, description: data.description ?? undefined }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!product) notFound()

  const p = product as Product & { category: Category | null }

  const { data: related } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_active', true)
    .eq('category_id', p.category_id ?? '')
    .neq('id', p.id)
    .limit(4)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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

          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-brand-charcoal">{formatPrice(p.retail_price)}</span>
            {p.compare_at_price && p.compare_at_price > p.retail_price && (
              <span className="text-lg text-gray-400 line-through">{formatPrice(p.compare_at_price)}</span>
            )}
          </div>

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

          <AddToCartButton product={p as Product} />
        </div>
      </div>

      {/* Related */}
      {(related ?? []).length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl font-bold text-brand-charcoal mb-6">You might also like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(related as Product[]).map((rp) => (
              <ProductCard key={rp.id} product={rp} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
