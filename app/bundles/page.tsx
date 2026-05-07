import Link from 'next/link'
import { ArrowRight, Gift, Package, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/shop/ProductCard'
import type { Product } from '@/types'

export const metadata = {
  title: 'Curated Bundles',
  description:
    'Curated snack and essential bundles at great value. Movie Night, Office Snacks, Middle Eastern Pantry Starter, and more.',
}

const SAMPLE_BUNDLES = [
  {
    id: 'sample-1',
    emoji: '🎬',
    title: 'Movie Night Bundle',
    description:
      'Popcorn, candy, soda, and salty snacks for the perfect night in. Everything you need for movie magic.',
    price: 'from $24.99',
    items: ['Microwave Popcorn ×2', 'Sour Patch Kids', "Reese's Cups", 'Sprite 2L', 'Lays Classic'],
    badge: 'Most Popular',
    badgeClass: 'bg-brand-orange text-white',
  },
  {
    id: 'sample-2',
    emoji: '💼',
    title: 'Office Snack Box',
    description:
      'Energy drinks, protein bars, mixed nuts, and coffee essentials. Fuel your team through the workday.',
    price: 'from $34.99',
    items: ['Celsius ×4', 'Kind Bars ×4', 'Mixed Nuts', 'Coffee Pods ×12', 'Granola Bars ×4'],
    badge: 'B2B Favorite',
    badgeClass: 'bg-blue-600 text-white',
  },
  {
    id: 'sample-3',
    emoji: '🌿',
    title: 'Middle Eastern Pantry Starter',
    description:
      'Authentic pantry staples to get you started — Zaatar, Tahini, Medjool Dates, Turkish Coffee, and more.',
    price: 'from $44.99',
    items: ['Zaatar 200g', 'Tahini 16oz', 'Medjool Dates 1lb', 'Turkish Coffee', 'Olive Oil 500ml'],
    badge: 'Local Fav',
    badgeClass: 'bg-brand-green text-white',
  },
  {
    id: 'sample-4',
    emoji: '💪',
    title: 'Gym Bag Refill',
    description:
      'Protein bars, electrolytes, and healthy snacks to power your workouts and recovery.',
    price: 'from $29.99',
    items: ['Quest Bars ×4', 'Gatorade ×4', 'Cliff Bars ×2', 'Almonds', 'Protein Shake'],
    badge: 'Best Value',
    badgeClass: 'bg-amber-500 text-white',
  },
]

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
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-brand-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-5">
              <Gift className="h-4 w-4 text-brand-orange" />
              Save more, snack better
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold mb-4">Curated Bundles</h1>
            <p className="text-blue-100 max-w-lg leading-relaxed text-lg">
              We&apos;ve put together the perfect combinations — movie nights, gym bags, office snacks, Middle Eastern pantry
              starters. Better value, zero hassle.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Bundle Builder CTA */}
        <div className="mb-10 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-amber-600" />
              <p className="font-bold text-amber-900 text-lg">Build Your Own Bundle</p>
            </div>
            <p className="text-amber-700 text-sm leading-relaxed">
              Pick any 4+ products and automatically save 10% on your custom selection. Mix &amp; match from our full catalog.
            </p>
          </div>
          <Link
            href="/bundles/build"
            className="shrink-0 inline-flex items-center gap-2 bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
          >
            Build a Bundle <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {prods.length > 0 ? (
          <>
            <h2 className="text-xl font-bold text-brand-charcoal mb-5">Ready-Made Bundles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {prods.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-brand-charcoal">Coming Soon</h2>
              <span className="text-xs font-semibold bg-brand-green/10 text-brand-green rounded-full px-3 py-1.5 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Bundles launching soon
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {SAMPLE_BUNDLES.map((bundle) => (
                <div
                  key={bundle.id}
                  className="group rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col overflow-hidden"
                >
                  <div className="p-6 pb-4 flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-4xl">{bundle.emoji}</span>
                      <span className={`text-[11px] font-bold rounded-full px-2.5 py-1 ${bundle.badgeClass}`}>
                        {bundle.badge}
                      </span>
                    </div>
                    <h3 className="font-bold text-brand-charcoal text-base mb-2">{bundle.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed mb-4">{bundle.description}</p>
                    <ul className="space-y-1.5">
                      {bundle.items.map((item) => (
                        <li key={item} className="text-xs text-gray-600 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-green shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="px-6 pb-5 pt-3 border-t border-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-brand-green">{bundle.price}</span>
                      <span className="text-xs text-gray-400">Est. value</span>
                    </div>
                    <Link
                      href="/bundles/build"
                      className="block w-full text-center text-sm font-semibold bg-brand-green text-white rounded-xl py-2.5 hover:bg-brand-green/90 transition-colors"
                    >
                      Build Similar Bundle
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 rounded-2xl bg-brand-green text-white p-8 sm:p-10 text-center">
          <h3 className="text-xl sm:text-2xl font-bold mb-2">Not seeing what you need?</h3>
          <p className="text-green-200 mb-5 text-sm sm:text-base">
            Use our Bundle Builder to create a fully custom snack box — exactly what you want.
          </p>
          <Button variant="orange" size="lg" asChild>
            <Link href="/bundles/build">
              Start Building <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
