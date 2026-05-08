'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, MapPin, ShoppingCart } from 'lucide-react'
import { useCart, useCartUI } from '@/components/cart/CartContext'
import { CartDrawer } from '@/components/cart/CartDrawer'

const CATEGORY_OPTIONS = [
  'All Departments',
  'Drinks',
  'Energy & Hydration',
  'Chips & Snacks',
  'Candy & Chocolate',
  'Coffee & Tea',
  'Middle Eastern',
  'Household',
  'Personal Care',
  'Cookies & Sweets',
  'Bundles',
]

const CATEGORY_SLUGS: Record<string, string> = {
  'Drinks': 'drinks',
  'Energy & Hydration': 'energy-hydration',
  'Chips & Snacks': 'chips-salty-snacks',
  'Candy & Chocolate': 'candy-chocolate',
  'Coffee & Tea': 'coffee-tea',
  'Middle Eastern': 'middle-eastern-favorites',
  'Household': 'household-essentials',
  'Personal Care': 'personal-care',
  'Cookies & Sweets': 'cookies-sweets',
  'Bundles': 'bundles',
}

const SUB_NAV = [
  { label: 'All', slug: null },
  { label: 'Drinks', slug: 'drinks' },
  { label: 'Snacks', slug: 'chips-salty-snacks' },
  { label: 'Energy', slug: 'energy-hydration' },
  { label: 'Middle Eastern', slug: 'middle-eastern-favorites' },
  { label: 'Household', slug: 'household-essentials' },
  { label: 'Candy', slug: 'candy-chocolate' },
  { label: 'Coffee', slug: 'coffee-tea' },
  { label: 'Bundles', slug: 'bundles' },
]

export function Header() {
  const { itemCount } = useCart()
  const { openCart } = useCartUI()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [selectedCat, setSelectedCat] = useState('All Departments')
  const zip = '07055'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (selectedCat !== 'All Departments') {
      params.set('category', CATEGORY_SLUGS[selectedCat] ?? '')
    }
    router.push(`/?${params.toString()}`)
  }

  const handleSubNav = (slug: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (slug) {
      params.set('category', slug)
    } else {
      params.delete('category')
    }
    router.push(`/?${params.toString()}`, { scroll: false })
  }

  const activeCategory = searchParams.get('category') ?? null

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-slate-900">
        {/* ── Main row ── */}
        <div className="flex items-center gap-3 lg:gap-4 px-3 lg:px-6 py-2.5">
          {/* Logo */}
          <Link
            href="/"
            className="shrink-0 flex items-center gap-1.5 text-white hover:opacity-90"
          >
            <span className="text-xl">🏪</span>
            <div className="hidden sm:block leading-tight">
              <span className="text-xs font-bold text-white block">My Corner</span>
              <span className="text-xs font-bold text-orange-400 block">Store</span>
            </div>
          </Link>

          {/* Deliver to */}
          <div className="hidden md:flex flex-col shrink-0 text-left border border-slate-700 hover:border-white px-2 py-1 cursor-pointer rounded-sm">
            <span className="text-[9px] text-gray-400 leading-none uppercase tracking-wide">
              Deliver to
            </span>
            <span className="text-white text-xs font-bold flex items-center gap-0.5 mt-0.5">
              <MapPin className="h-3 w-3 text-white shrink-0" />
              {zip}
            </span>
          </div>

          {/* Search bar — takes remaining width */}
          <form
            onSubmit={handleSearch}
            className="flex flex-1 h-10 min-w-0"
          >
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              suppressHydrationWarning
              className="hidden sm:block h-full rounded-l-sm bg-gray-200 text-gray-800 text-[11px] font-semibold px-2 border-r border-gray-300 focus:outline-none cursor-pointer shrink-0 max-w-[130px]"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, brands, and categories…"
              suppressHydrationWarning
              className="flex-1 h-full min-w-0 px-3 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 sm:rounded-none rounded-l-sm"
            />
            <button
              type="submit"
              suppressHydrationWarning
              className="h-full px-4 bg-orange-400 hover:bg-orange-500 rounded-r-sm flex items-center justify-center shrink-0"
              aria-label="Search"
            >
              <Search className="h-5 w-5 text-slate-900" />
            </button>
          </form>

          {/* Cart */}
          <button
            onClick={openCart}
            suppressHydrationWarning
            className="shrink-0 flex items-center gap-2 text-white hover:text-orange-400 border border-slate-700 hover:border-orange-400 px-2 py-1 rounded-sm"
            aria-label="Open cart"
          >
            <div className="relative">
              <ShoppingCart className="h-6 w-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-400 text-[10px] font-bold text-slate-900 leading-none">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </div>
            <div className="hidden sm:flex flex-col items-start leading-tight">
              <span className="text-[9px] text-gray-400 uppercase tracking-wide">
                {itemCount === 0 ? 'Empty' : `${itemCount} item${itemCount !== 1 ? 's' : ''}`}
              </span>
              <span className="text-xs font-bold">Cart</span>
            </div>
          </button>
        </div>

        {/* ── Sub-nav strip ── */}
        <div className="bg-slate-800 flex items-center gap-0.5 px-3 lg:px-6 py-1 overflow-x-auto no-scrollbar">
          {SUB_NAV.map((item) => (
            <button
              key={item.label}
              onClick={() => handleSubNav(item.slug)}
              suppressHydrationWarning
              className={`shrink-0 text-xs font-medium px-2.5 py-1 whitespace-nowrap rounded-sm transition-colors ${
                activeCategory === item.slug
                  ? 'text-white bg-slate-700'
                  : 'text-gray-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
          <span className="mx-1.5 text-slate-600 text-xs">|</span>
          <Link
            href="/local-delivery"
            className="shrink-0 text-xs font-semibold text-orange-400 hover:text-orange-300 px-2.5 py-1 whitespace-nowrap"
          >
            Same-Day Delivery
          </Link>
          <Link
            href="/office-refill"
            className="shrink-0 text-xs font-medium text-gray-300 hover:text-white px-2.5 py-1 whitespace-nowrap"
          >
            Office Refill
          </Link>
        </div>
      </header>
      <CartDrawer />
    </>
  )
}
