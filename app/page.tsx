import Link from 'next/link'
import {
  ArrowRight,
  Truck,
  Shield,
  MapPin,
  Gift,
  ChevronRight,
  Check,
  Package,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategoryCard } from '@/components/shop/CategoryCard'
import { ProductCard } from '@/components/shop/ProductCard'
import { DeliveryZoneChecker } from '@/components/shop/DeliveryZoneChecker'
import { JsonLd } from '@/components/seo/JsonLd'
import { createClient } from '@/lib/supabase/server'
import { buildMetadata, localBusinessSchema } from '@/lib/seo/metadata'
import type { Category, Product } from '@/types'

export const metadata = buildMetadata({
  description:
    'Same-day delivery of snacks, drinks, and household essentials across Passaic, Clifton, Paterson, Rutherford, and surrounding North Jersey towns.',
})

const FALLBACK_CATEGORIES: Category[] = [
  { id: 'fb-drinks', name: 'Drinks', slug: 'drinks', description: 'Water, soda, juice & more', sort_order: 1, is_active: true, created_at: '' },
  { id: 'fb-energy', name: 'Energy', slug: 'energy-hydration', description: 'Celsius, Red Bull, Gatorade', sort_order: 2, is_active: true, created_at: '' },
  { id: 'fb-snacks', name: 'Chips & Snacks', slug: 'chips-salty-snacks', description: 'Lays, Doritos, popcorn', sort_order: 3, is_active: true, created_at: '' },
  { id: 'fb-candy', name: 'Candy', slug: 'candy-chocolate', description: 'Chocolate & candy bars', sort_order: 4, is_active: true, created_at: '' },
  { id: 'fb-coffee', name: 'Coffee & Tea', slug: 'coffee-tea', description: 'Turkish coffee, teas', sort_order: 5, is_active: true, created_at: '' },
  { id: 'fb-me', name: 'Middle Eastern', slug: 'middle-eastern-favorites', description: 'Zaatar, tahini, dates', sort_order: 6, is_active: true, created_at: '' },
  { id: 'fb-household', name: 'Household', slug: 'household-essentials', description: 'Cleaning & paper goods', sort_order: 7, is_active: true, created_at: '' },
  { id: 'fb-personal', name: 'Personal Care', slug: 'personal-care', description: 'Health & beauty', sort_order: 8, is_active: true, created_at: '' },
  { id: 'fb-cookies', name: 'Cookies & Sweets', slug: 'cookies-sweets', description: 'Baked goods & sweets', sort_order: 9, is_active: true, created_at: '' },
  { id: 'fb-bundles', name: 'Bundles', slug: 'bundles', description: 'Save with curated sets', sort_order: 10, is_active: true, created_at: '' },
]

const HERO_PRODUCTS = [
  { emoji: '⚡', name: 'Celsius Energy', price: '$3.49', badge: 'Popular' },
  { emoji: '🌿', name: 'Tahini & Zaatar', price: '$5.99', badge: 'Local Fav' },
  { emoji: '🍟', name: 'Salty Snacks', price: 'from $1.99', badge: 'In Stock' },
  { emoji: '☕', name: 'Turkish Coffee', price: '$8.99', badge: 'Premium' },
]

const SAMPLE_BUNDLES = [
  { emoji: '🎬', title: 'Movie Night Bundle', desc: 'Popcorn, candy, drinks & snacks for the perfect night in.', price: 'from $24.99' },
  { emoji: '💼', title: 'Office Snack Box', desc: 'Energy drinks, healthy snacks & coffee for the whole team.', price: 'from $34.99' },
  { emoji: '🌿', title: 'Middle Eastern Pantry', desc: 'Tahini, Zaatar, dates, olive oil & more.', price: 'from $44.99' },
  { emoji: '💪', title: 'Gym Bag Refill', desc: 'Protein bars, electrolytes & healthy snacks for your workout.', price: 'from $29.99' },
]

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: categories }, { data: featuredProducts }, { data: bundles }] = await Promise.all([
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('products').select('*, category:categories(*)').eq('is_active', true).eq('is_featured', true).eq('is_bundle', false).order('created_at', { ascending: false }).limit(8),
    supabase.from('products').select('*, category:categories(*)').eq('is_active', true).eq('is_bundle', true).order('created_at', { ascending: false }).limit(4),
  ])

  const displayCategories =
    (categories as Category[] ?? []).length > 0
      ? (categories as Category[] ?? []).slice(0, 12)
      : FALLBACK_CATEGORIES

  const featured = (featuredProducts as Product[] ?? [])
  const bundleList = (bundles as Product[] ?? [])

  return (
    <div className="flex flex-col">
      <JsonLd data={localBusinessSchema()} />

      {/* ── Hero ── */}
      <section className="relative bg-brand-green text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full bg-white/5 blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-brand-orange/10 blur-3xl -translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="grid lg:grid-cols-[1fr,420px] gap-10 xl:gap-16 items-center">
            {/* Copy */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-sm font-medium mb-6">
                <span className="h-2 w-2 rounded-full bg-brand-orange animate-pulse" />
                Now delivering in North Jersey
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-5">
                Your corner store,{' '}
                <span className="text-brand-orange">online.</span>
              </h1>
              <p className="text-lg sm:text-xl text-green-100 leading-relaxed mb-8 max-w-xl">
                Snacks, drinks, household essentials, Middle Eastern favorites, and local picks — delivered same-day around North Jersey.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Button size="xl" variant="orange" asChild>
                  <Link href="/local-delivery">
                    <Truck className="h-5 w-5" />
                    Shop Local Delivery
                  </Link>
                </Button>
                <Button
                  size="xl"
                  variant="outline"
                  className="border-white/40 text-white hover:bg-white/10 hover:border-white/60"
                  asChild
                >
                  <Link href="/bundles">
                    <Gift className="h-5 w-5" />
                    Build a Bundle
                  </Link>
                </Button>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-green-200">
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-green-400" /> Same-day delivery
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-green-400" /> Free over $50
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-green-400" /> Local NJ inventory
                </span>
              </div>
            </div>

            {/* Product showcase (desktop only) */}
            <div className="hidden lg:grid grid-cols-2 gap-3">
              {HERO_PRODUCTS.map((item) => (
                <Link
                  key={item.name}
                  href="/shop"
                  className="group bg-white/10 hover:bg-white/15 border border-white/20 rounded-2xl p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className="text-4xl mb-3">{item.emoji}</div>
                  <span className="text-[11px] font-bold bg-brand-orange/90 text-white rounded-full px-2.5 py-0.5">
                    {item.badge}
                  </span>
                  <p className="text-sm font-bold text-white mt-2.5">{item.name}</p>
                  <p className="text-xs text-green-300 mt-0.5">{item.price}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Strip ── */}
      <section className="bg-brand-orange text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-1.5 text-sm font-semibold">
            <span className="flex items-center gap-2">
              <Truck className="h-4 w-4" /> Same-day local delivery
            </span>
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> Secure checkout
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Local NJ inventory
            </span>
            <span className="flex items-center gap-2">
              <Gift className="h-4 w-4" /> Free delivery over $50
            </span>
          </div>
        </div>
      </section>

      {/* ── Shop by Category ── */}
      <section className="py-14 bg-[#FAF8F3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-charcoal">Shop by Category</h2>
              <p className="text-sm text-gray-500 mt-1">Everything you need, organized for you</p>
            </div>
            <Link
              href="/shop"
              className="text-sm font-semibold text-brand-green hover:text-brand-green/80 flex items-center gap-1"
            >
              All products <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {displayCategories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Best Sellers ── */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-charcoal">Best Sellers</h2>
              <p className="text-sm text-gray-500 mt-1">Top picks from our local customers</p>
            </div>
            <Link
              href="/shop"
              className="text-sm font-semibold text-brand-green hover:text-brand-green/80 flex items-center gap-1"
            >
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {featured.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/40 py-14 px-6 text-center">
              <div className="text-5xl mb-4">🛒</div>
              <h3 className="text-lg font-bold text-brand-charcoal mb-2">
                New inventory arriving soon
              </h3>
              <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                Our shelves are being stocked with curated local favorites. Browse categories to explore what&apos;s available.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  { label: 'Drinks', slug: 'drinks' },
                  { label: 'Snacks', slug: 'chips-salty-snacks' },
                  { label: 'Middle Eastern', slug: 'middle-eastern-favorites' },
                  { label: 'Bundles', slug: 'bundles' },
                ].map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/categories/${cat.slug}`}
                    className="text-sm font-semibold bg-white border-2 border-brand-green/20 text-brand-green rounded-xl px-4 py-2 hover:bg-brand-green hover:text-white transition-colors"
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Editorial 2-col: North Jersey + Middle Eastern ── */}
      <section className="py-14 bg-[#FAF8F3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 gap-5">
            {/* NJ Local Favorites */}
            <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-100 p-8 flex flex-col justify-between min-h-[260px]">
              <div>
                <p className="text-xs font-bold text-brand-orange uppercase tracking-wider mb-3">
                  🚚 North Jersey Picks
                </p>
                <h3 className="text-2xl font-bold text-brand-charcoal mb-3">Popular in Your Area</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Everyday essentials your neighbors are ordering — from Passaic to Clifton to Paterson. Fast delivery, local inventory.
                </p>
              </div>
              <Button variant="orange" className="mt-6 self-start" asChild>
                <Link href="/shop">
                  Shop Now <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Middle Eastern */}
            <div className="rounded-3xl bg-gradient-to-br from-brand-green to-[#2d6a4f] text-white p-8 flex flex-col justify-between min-h-[260px]">
              <div>
                <p className="text-green-300 text-xs font-bold uppercase tracking-wider mb-3">
                  🌿 A Taste of Home
                </p>
                <h3 className="text-2xl font-bold text-white mb-3">Middle Eastern Favorites</h3>
                <p className="text-green-100 text-sm leading-relaxed">
                  Authentic pantry staples — Zaatar, Tahini, Medjool Dates, Turkish Coffee, and more. Sourced from trusted brands.
                </p>
              </div>
              <Button variant="orange" className="mt-6 self-start" asChild>
                <Link href="/categories/middle-eastern-favorites">
                  Shop Middle Eastern <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Drinks & Energy ── */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-8 sm:p-12">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="max-w-sm">
                <p className="text-blue-200 text-sm font-medium mb-2">🥤 Refreshment Section</p>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">Drinks & Energy</h2>
                <p className="text-blue-100 leading-relaxed">
                  Celsius, Red Bull, Gatorade, Sparkling Water, Snapple, and local favorites. Always cold. Always in stock.
                </p>
                <Button className="mt-5 bg-white text-blue-600 hover:bg-blue-50 font-bold" asChild>
                  <Link href="/categories/drinks">
                    Shop All Drinks <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="flex gap-3 flex-wrap">
                {[
                  { emoji: '⚡', label: 'Energy Drinks' },
                  { emoji: '💧', label: 'Water & Sparkling' },
                  { emoji: '🥤', label: 'Sodas & Juice' },
                  { emoji: '🍵', label: 'Tea & Coffee' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-white/10 border border-white/20 rounded-2xl p-4 text-center min-w-[90px]"
                  >
                    <div className="text-3xl mb-1.5">{item.emoji}</div>
                    <p className="text-xs font-semibold text-blue-100">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bulk & Value Packs / Bundles ── */}
      <section className="py-14 bg-[#FAF8F3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {bundleList.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-brand-charcoal">Curated Bundles</h2>
                  <p className="text-gray-500 mt-1">Save more when you bundle your favorites</p>
                </div>
                <Link
                  href="/bundles"
                  className="text-sm font-semibold text-brand-green hover:text-brand-green/80 flex items-center gap-1"
                >
                  See all <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {bundleList.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-brand-charcoal">Bulk & Value Packs</h2>
                <p className="text-gray-500 mt-2">Stock up and save with our curated bundles</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {SAMPLE_BUNDLES.map((bundle) => (
                  <Link
                    key={bundle.title}
                    href="/bundles/build"
                    className="group rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 p-6 flex flex-col gap-3"
                  >
                    <div className="text-4xl">{bundle.emoji}</div>
                    <span className="text-xs font-bold bg-brand-green/10 text-brand-green rounded-full px-2.5 py-0.5 self-start">
                      Coming Soon
                    </span>
                    <h3 className="font-bold text-brand-charcoal">{bundle.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed flex-1">{bundle.desc}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-bold text-brand-green">{bundle.price}</span>
                      <span className="text-xs font-semibold text-brand-orange group-hover:underline">
                        Build Similar →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-6">
                <Button variant="outline" asChild>
                  <Link href="/bundles">
                    View All Bundles <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Office Refill CTA ── */}
      <section className="py-14 bg-brand-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr,auto] items-center gap-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-xs font-semibold text-blue-300 mb-4">
                <Package className="h-3.5 w-3.5" />
                For businesses
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">Office Refill Program</h2>
              <p className="text-blue-200 max-w-lg leading-relaxed mb-4">
                Keep your office stocked with snacks and drinks on a recurring schedule. Weekly or monthly plans for dealerships, barbershops, gyms, and more. Starting at $99/mo.
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-blue-300">
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-green-400" /> Weekly or monthly delivery
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-green-400" /> Custom product selection
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-green-400" /> Invoicing available
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3 shrink-0">
              <Button size="xl" variant="orange" asChild>
                <Link href="/office-refill">
                  Learn More <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/office-refill#contact-form">Request Custom Quote</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── How Local Delivery Works ── */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-charcoal">How Local Delivery Works</h2>
            <p className="text-gray-500 mt-2">Same-day delivery, stress-free</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 max-w-4xl mx-auto">
            {[
              {
                emoji: '🛒',
                step: '1',
                title: 'Browse & Shop',
                desc: 'Browse our full selection of snacks, drinks, household essentials, and local favorites online.',
              },
              {
                emoji: '📦',
                step: '2',
                title: 'Choose Delivery',
                desc: 'Select same-day local delivery, in-store pickup, or standard shipping at checkout.',
              },
              {
                emoji: '⚡',
                step: '3',
                title: 'Get It Fast',
                desc: 'Your order is packed and delivered same-day locally, or ships fast anywhere in the US.',
              },
            ].map((step) => (
              <div key={step.step} className="flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <div className="w-20 h-20 rounded-2xl bg-brand-cream border-2 border-gray-100 shadow-sm flex items-center justify-center text-4xl">
                    {step.emoji}
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-brand-orange text-white text-xs font-bold flex items-center justify-center shadow-md">
                    {step.step}
                  </div>
                </div>
                <h3 className="font-bold text-brand-charcoal text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button size="lg" variant="orange" asChild>
              <Link href="/local-delivery">
                <Truck className="h-5 w-5" /> Check Delivery Availability
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Delivery Zone Checker ── */}
      <section className="py-14 bg-[#FAF8F3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mx-auto text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-charcoal mb-3">
              Do We Deliver to You?
            </h2>
            <p className="text-gray-500">
              Check if your ZIP code is in our same-day delivery zone across North Jersey.
            </p>
          </div>
          <div className="max-w-md mx-auto">
            <DeliveryZoneChecker />
          </div>
        </div>
      </section>
    </div>
  )
}
