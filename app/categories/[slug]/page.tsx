import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/shop/ProductCard'
import { EmptyState } from '@/components/shop/EmptyState'
import type { Product, Category } from '@/types'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('categories').select('name, description').eq('slug', slug).single()
  if (!data) return {}
  return { title: data.name, description: data.description ?? undefined }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!category) notFound()

  const { data: products } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_active', true)
    .eq('category_id', (category as Category).id)
    .order('is_featured', { ascending: false })
    .order('name')

  const cat = category as Category
  const prods = (products ?? []) as Product[]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-brand-green">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-brand-green">Shop</Link>
        <span>/</span>
        <span className="text-brand-charcoal font-medium">{cat.name}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-charcoal">{cat.name}</h1>
        {cat.description && <p className="text-gray-500 mt-1">{cat.description}</p>}
        <p className="text-sm text-gray-400 mt-1">{prods.length} product{prods.length !== 1 ? 's' : ''}</p>
      </div>

      {prods.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Check back soon — we're stocking up!"
          icon="📦"
          action={
            <Link href="/shop" className="text-brand-green font-medium hover:underline">
              Browse all products
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {prods.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
