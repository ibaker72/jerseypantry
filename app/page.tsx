import Link from 'next/link'
import { ArrowRight, Truck, Shield, MapPin, Gift, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategoryCard } from '@/components/shop/CategoryCard'
import { ProductCard } from '@/components/shop/ProductCard'
import { DeliveryZoneChecker } from '@/components/shop/DeliveryZoneChecker'
import { createClient } from '@/lib/supabase/server'
import type { Category, Product } from '@/types'

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: categories }, { data: featuredProducts }, { data: bundles }] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_active', true)
      .eq('is_featured', true)
      .eq('is_bundle', false)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_active', true)
      .eq('is_bundle', true)
      .order('created_at', { ascending: false })
      .limit(4),
  ])

  const meProducts = (featuredProducts as Product[] ?? []).filter(
    (p) => p.category && (p.category as Category).slug === 'middle-eastern-favorites'
  ).slice(0, 4)

  return (
    <div className="flex flex-col gap-0">
      {/* Hero */}
      <section className="relative bg-brand-green text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-brand-orange blur-3xl -translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-sm font-medium mb-6">
              <span className="h-2 w-2 rounded-full bg-brand-orange animate-pulse" />
              Now delivering in North Jersey
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Your corner store,{' '}
              <span className="text-brand-orange">online.</span>
            </h1>
            <p className="text-lg sm:text-xl text-green-100 leading-relaxed mb-8 max-w-xl">
              Snacks, drinks, household essentials, and local favorites delivered same-day around North Jersey.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="xl" variant="orange" asChild>
                <Link href="/local-delivery">
                  <Truck className="h-5 w-5" />
                  Shop Local Delivery
                </Link>
              </Button>
              <Button size="xl" variant="outline" className="border-white text-white hover:bg-white hover:text-brand-green" asChild>
                <Link href="/bundles">
                  <Gift className="h-5 w-5" />
                  Build a Snack Bundle
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="bg-brand-orange text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-1 text-sm font-medium">
            <span className="flex items-center gap-1.5">🚚 Same-day local delivery</span>
            <span className="flex items-center gap-1.5">🔒 Secure checkout</span>
            <span className="flex items-center gap-1.5">📍 Local NJ inventory</span>
            <span className="flex items-center gap-1.5">🎁 Free delivery over $50</span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-14 bg-[#FAF8F3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-charcoal">Shop by Category</h2>
            <Link href="/shop" className="text-sm font-medium text-brand-green hover:text-brand-green/80 flex items-center gap-1">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {(categories as Category[] ?? []).slice(0, 12).map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-charcoal">
              Best Sellers
            </h2>
            <Link href="/shop" className="text-sm font-medium text-brand-green hover:text-brand-green/80 flex items-center gap-1">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(featuredProducts as Product[] ?? []).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Bundles */}
      {(bundles as Product[] ?? []).length > 0 && (
        <section className="py-14 bg-[#FAF8F3]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-brand-charcoal">Curated Bundles</h2>
                <p className="text-gray-500 mt-1">Save more when you bundle your favorites</p>
              </div>
              <Link href="/bundles" className="text-sm font-medium text-brand-green hover:text-brand-green/80 flex items-center gap-1">
                See all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {(bundles as Product[] ?? []).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Middle Eastern Feature */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-brand-green to-[#2d6a4f] text-white p-8 sm:p-12">
            <div className="max-w-2xl mb-8">
              <p className="text-green-200 text-sm font-medium mb-2">A taste of home</p>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">Middle Eastern Favorites</h2>
              <p className="text-green-100 leading-relaxed">
                Authentic pantry staples — Zaatar, Tahini, Medjool Dates, Turkish Coffee, and more. Sourced from trusted brands and delivered fresh.
              </p>
            </div>
            <Button size="lg" variant="orange" asChild>
              <Link href="/categories/middle-eastern-favorites">
                Shop Middle Eastern <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Delivery Zone Checker */}
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

      {/* Office Refill CTA */}
      <section className="py-14 bg-brand-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-blue-300 text-sm font-medium mb-1">For businesses</p>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Office Refill Program</h2>
              <p className="text-blue-200 max-w-md">
                Keep your office stocked with snacks and drinks. Weekly or monthly refill plans starting at $99/mo for dealerships, barbershops, gyms, and more.
              </p>
            </div>
            <Button size="xl" variant="orange" asChild className="shrink-0">
              <Link href="/office-refill">
                Learn More <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-charcoal">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { emoji: '🛒', step: '1', title: 'Shop Online', desc: 'Browse our selection of snacks, drinks, essentials, and local favorites.' },
              { emoji: '📦', step: '2', title: 'Choose Delivery', desc: 'Pick same-day local delivery, in-store pickup, or standard shipping.' },
              { emoji: '⚡', step: '3', title: 'Get It Fast', desc: 'Receive your order same-day locally or enjoy fast shipping anywhere.' },
            ].map((step) => (
              <div key={step.step} className="flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-brand-cream flex items-center justify-center text-3xl shadow-sm">
                  {step.emoji}
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-orange mb-1">STEP {step.step}</p>
                  <h3 className="font-bold text-brand-charcoal mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
