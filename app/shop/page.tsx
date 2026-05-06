import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/shop/ProductCard'
import { EmptyState } from '@/components/shop/EmptyState'
import { ShopFilters } from './ShopFilters'
import type { Product, Category, FlashSale } from '@/types'

interface ShopPageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    sort?: string
  }>
}

export const metadata = {
  title: 'Shop All Products',
  description: 'Browse all snacks, drinks, household essentials, and local favorites.',
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams
  const { q, category: categorySlug, sort } = params

  const supabase = await createClient()

  const [{ data: categories }, productsResult, { data: flashSalesRaw }] = await Promise.all([
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
    (async () => {
      let query = supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('is_active', true)

      if (q) {
        query = query.ilike('name', `%${q}%`)
      }

      if (categorySlug && categorySlug !== 'all') {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', categorySlug)
          .single()
        if (cat) {
          query = query.eq('category_id', cat.id)
        }
      }

      switch (sort) {
        case 'price_asc':
          query = query.order('retail_price', { ascending: true })
          break
        case 'price_desc':
          query = query.order('retail_price', { ascending: false })
          break
        case 'newest':
          query = query.order('created_at', { ascending: false })
          break
        default:
          query = query.order('is_featured', { ascending: false }).order('name')
      }

      return query
    })(),
    supabase
      .from('flash_sales')
      .select('*')
      .eq('is_active', true)
      .lte('starts_at', new Date().toISOString())
      .gte('ends_at', new Date().toISOString()),
  ])

  const products = (productsResult.data ?? []) as Product[]
  const cats = (categories ?? []) as Category[]
  const flashSales = (flashSalesRaw ?? []) as FlashSale[]

  // Build lookup: product_id -> best flash sale
  function getFlashSale(product: Product): FlashSale | null {
    return (
      flashSales.find((s) => s.product_id === product.id) ??
      flashSales.find((s) => s.category_id === product.category_id) ??
      flashSales.find((s) => !s.product_id && !s.category_id) ??
      null
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-charcoal">Shop All Products</h1>
        <p className="text-gray-500 mt-1">{products.length} product{products.length !== 1 ? 's' : ''}</p>
      </div>

      <Suspense>
        <ShopFilters categories={cats} />
      </Suspense>

      {products.length === 0 ? (
        <EmptyState
          title="No products found"
          description={q ? `No products match "${q}". Try a different search.` : 'No products in this category yet.'}
          icon="🔍"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 mt-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} flashSale={getFlashSale(product)} />
          ))}
        </div>
      )}
    </div>
  )
}
