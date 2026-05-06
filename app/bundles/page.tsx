import Link from 'next/link'
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

      {/* Bundle Builder CTA */}
      <div className="mb-8 rounded-2xl bg-amber-50 border border-amber-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-bold text-amber-800 text-lg">Build Your Own Bundle</p>
          <p className="text-amber-700 text-sm mt-1">Pick any 4+ products and automatically save 10% on your custom selection.</p>
        </div>
        <Link
          href="/bundles/build"
          className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          Build a Bundle →
        </Link>
      </div>

      {prods.length === 0 ? (
        <EmptyState title="No curated bundles yet" description="Try the Bundle Builder above to create your own!" icon="📦" />
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
