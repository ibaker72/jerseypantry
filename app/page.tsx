import Link from 'next/link'
import { Truck, ShoppingBag, Zap, MapPin, Star, Clock } from 'lucide-react'
import { ShopLayout } from '@/components/site/ShopLayout'
import { ProductCard } from '@/components/shop/ProductCard'
import { JsonLd } from '@/components/seo/JsonLd'
import { createClient } from '@/lib/supabase/server'
import { buildMetadata, localBusinessSchema } from '@/lib/seo/metadata'
import type { Category, Product } from '@/types'

export const metadata = buildMetadata({
  description:
    'Same-day delivery of snacks, drinks, and household essentials across Passaic, Clifton, Paterson, Rutherford, and surrounding North Jersey towns.',
})

// ── Fallback categories (shown if DB is empty) ───────────────────────────────
const FALLBACK_CATEGORIES: Category[] = [
  { id: 'fb-drinks', name: 'Drinks', slug: 'drinks', description: null, sort_order: 1, is_active: true, created_at: '' },
  { id: 'fb-energy', name: 'Energy', slug: 'energy-hydration', description: null, sort_order: 2, is_active: true, created_at: '' },
  { id: 'fb-snacks', name: 'Chips & Snacks', slug: 'chips-salty-snacks', description: null, sort_order: 3, is_active: true, created_at: '' },
  { id: 'fb-candy', name: 'Candy', slug: 'candy-chocolate', description: null, sort_order: 4, is_active: true, created_at: '' },
  { id: 'fb-coffee', name: 'Coffee & Tea', slug: 'coffee-tea', description: null, sort_order: 5, is_active: true, created_at: '' },
  { id: 'fb-me', name: 'Middle Eastern', slug: 'middle-eastern-favorites', description: null, sort_order: 6, is_active: true, created_at: '' },
  { id: 'fb-household', name: 'Household', slug: 'household-essentials', description: null, sort_order: 7, is_active: true, created_at: '' },
  { id: 'fb-personal', name: 'Personal Care', slug: 'personal-care', description: null, sort_order: 8, is_active: true, created_at: '' },
  { id: 'fb-cookies', name: 'Cookies & Sweets', slug: 'cookies-sweets', description: null, sort_order: 9, is_active: true, created_at: '' },
  { id: 'fb-bundles', name: 'Bundles', slug: 'bundles', description: null, sort_order: 10, is_active: true, created_at: '' },
]

interface PageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    inStock?: string
    price?: string
    brand?: string
    sort?: string
  }>
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams
  const { q, category, inStock, price, brand, sort } = params

  const supabase = await createClient()

  // ── Categories ────────────────────────────────────────────────────────────
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  const categories: Category[] =
    (categoriesData as Category[] | null)?.length
      ? (categoriesData as Category[])
      : FALLBACK_CATEGORIES

  // ── Product query ─────────────────────────────────────────────────────────
  let categoryId: string | null = null
  if (category) {
    const { data: catRow } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', category)
      .single()
    categoryId = catRow?.id ?? null
  }

  let productQuery = supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_active', true)

  if (categoryId) {
    productQuery = productQuery.eq('category_id', categoryId)
  }

  if (inStock === '1') {
    productQuery = productQuery.gt('inventory_quantity', 0)
  }

  if (price) {
    const parts = price.split('-').map(Number)
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      productQuery = productQuery
        .gte('retail_price', parts[0])
        .lte('retail_price', parts[1])
    }
  }

  if (brand) {
    productQuery = productQuery.eq('brand', brand)
  }

  if (q) {
    productQuery = productQuery.ilike('name', `%${q}%`)
  }

  switch (sort) {
    case 'price_asc':
      productQuery = productQuery.order('retail_price', { ascending: true })
      break
    case 'price_desc':
      productQuery = productQuery.order('retail_price', { ascending: false })
      break
    case 'newest':
      productQuery = productQuery.order('created_at', { ascending: false })
      break
    default:
      productQuery = productQuery
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
  }

  productQuery = productQuery.limit(96)

  const { data: productsData } = await productQuery
  const products: Product[] = (productsData as Product[] | null) ?? []

  const hasFilters = !!(q || category || inStock || price || brand)
  const featuredProducts = products.filter((p) => p.is_featured).slice(0, 8)

  return (
    <>
      <JsonLd data={localBusinessSchema()} />

      {/* ── Promo Banner ─────────────────────────────────────────────────────── */}
      <div className="bg-brand-orange text-white text-center py-2 px-4 text-sm font-semibold">
        <Truck className="inline h-4 w-4 mr-1.5 -mt-0.5" />
        Free delivery on orders over $50 — North Jersey&apos;s corner store, online.{' '}
        <Link href="/local-delivery" className="underline hover:no-underline ml-1">
          Check your ZIP →
        </Link>
      </div>

      {/* ── Homepage hero sections (hidden when filtering) ────────────────────── */}
      {!hasFilters && (
        <div className="bg-[#FAF8F3]">

          {/* ── Social proof strip ──────────────────────────────────────────── */}
          <div className="border-b border-gray-200 bg-white">
            <div className="max-w-screen-xl mx-auto px-4 py-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              {[
                { icon: ShoppingBag, text: '50+ orders delivered' },
                { icon: Zap, text: 'Same-day guarantee' },
                { icon: MapPin, text: 'North Jersey local' },
                { icon: Star, text: 'No minimum order' },
                { icon: Clock, text: 'Mon–Sat · 10am–3pm' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                  <Icon className="h-3.5 w-3.5 text-brand-orange shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* ── Featured products ────────────────────────────────────────────── */}
          {featuredProducts.length > 0 && (
            <section className="max-w-screen-2xl mx-auto px-3 lg:px-6 pt-5 pb-2">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-brand-charcoal flex items-center gap-2">
                  <Star className="h-4 w-4 text-brand-orange" />
                  Featured Products
                </h2>
                <Link href="/?sort=featured" className="text-xs text-brand-orange hover:underline font-medium">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}

          {/* ── How It Works ─────────────────────────────────────────────────── */}
          <section className="max-w-screen-xl mx-auto px-4 py-6">
            <h2 className="text-base font-bold text-brand-charcoal mb-4 text-center">How It Works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  emoji: '🛒',
                  step: '1',
                  title: 'Shop Online',
                  desc: 'Browse snacks, drinks, and essentials. Look for the "Delivery Eligible" badge.',
                },
                {
                  emoji: '📍',
                  step: '2',
                  title: 'Enter Your ZIP',
                  desc: 'We deliver to Paterson, Clifton, Wayne, Passaic, and surrounding towns.',
                },
                {
                  emoji: '🚚',
                  step: '3',
                  title: 'Same-Day Delivery',
                  desc: 'Orders placed by 2pm ship today. $4.99 fee, free over $50.',
                },
              ].map((s) => (
                <div key={s.step} className="flex gap-3 rounded-xl bg-white border border-gray-100 shadow-sm p-4">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-brand-cream flex items-center justify-center text-2xl">
                      {s.emoji}
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brand-orange text-white text-[10px] font-bold flex items-center justify-center">
                      {s.step}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-brand-charcoal">{s.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="border-t border-gray-200 mx-4" />
        </div>
      )}

      {/* ── Full Shop Grid ────────────────────────────────────────────────────── */}
      <ShopLayout products={products} categories={categories} />
    </>
  )
}
