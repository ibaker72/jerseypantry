import { ShopLayout } from '@/components/site/ShopLayout'
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
  // Resolve category_id from slug when filtering
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

  // Sorting
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
      // featured: featured items first, then by creation date
      productQuery = productQuery
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
  }

  productQuery = productQuery.limit(96)

  const { data: productsData } = await productQuery
  const products: Product[] = (productsData as Product[] | null) ?? []

  return (
    <>
      <JsonLd data={localBusinessSchema()} />
      <ShopLayout products={products} categories={categories} />
    </>
  )
}
