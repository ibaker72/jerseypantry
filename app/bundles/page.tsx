import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/shop/ProductCard'
import { EmptyState } from '@/components/shop/EmptyState'
import type { Product } from '@/types'

export const metadata = {
  title: 'Bundles',
  description: 'Curated snack and essential bundles at great value.',
}

export default async function BundlesPage() {
  const supabase = await createClient()

  const { data: bundles } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_active', true)
    .eq('is_bundle', true)
    .order('is_featured', { ascending: false })
    .order('name')

  const prods = (bundles ?? []) as Product[]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero */}
      <div className="rounded-3xl bg-gradient-to-br from-brand-navy to-[#2c3e6b] text-white p-8 sm:p-12 mb-10">
        <p className="text-blue-300 text-sm font-medium mb-2">Save more, snack better</p>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Curated Bundles</h1>
        <p className="text-blue-100 max-w-lg leading-relaxed">
          We&apos;ve put together the perfect combinations — movie nights, gym bags, office snacks, Middle Eastern pantry starters, and more. Better value, zero hassle.
        </p>
      </div>

      {prods.length === 0 ? (
        <EmptyState title="No bundles yet" description="Check back soon!" icon="📦" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {prods.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
