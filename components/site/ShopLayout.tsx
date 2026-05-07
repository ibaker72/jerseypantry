'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react'
import { InventoryGrid } from '@/components/shop/InventoryGrid'
import type { Product, Category } from '@/types'

interface ShopLayoutProps {
  products: Product[]
  categories: Category[]
}

const PRICE_RANGES = [
  { label: 'Under $5', value: '0-5' },
  { label: '$5 – $10', value: '5-10' },
  { label: '$10 – $25', value: '10-25' },
  { label: 'Over $25', value: '25-9999' },
]

const SORT_OPTIONS = [
  { label: 'Featured', value: 'featured' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Newest', value: 'newest' },
]

export function ShopLayout({ products, categories }: ShopLayoutProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [brandExpanded, setBrandExpanded] = useState(true)

  const activeCategory = searchParams.get('category') ?? ''
  const inStockOnly = searchParams.get('inStock') === '1'
  const activePrice = searchParams.get('price') ?? ''
  const activeBrand = searchParams.get('brand') ?? ''
  const activeSort = searchParams.get('sort') ?? 'featured'
  const searchQuery = searchParams.get('q') ?? ''

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null || value === '') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`/?${params.toString()}`, { scroll: false })
  }

  const clearAllFilters = () => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    router.push(`/?${params.toString()}`, { scroll: false })
  }

  const hasActiveFilters =
    activeCategory || inStockOnly || activePrice || activeBrand

  const brands = Array.from(
    new Set(
      products
        .map((p) => p.brand)
        .filter((b): b is string => Boolean(b))
    )
  ).sort()

  const activeCategoryName =
    categories.find((c) => c.slug === activeCategory)?.name ?? ''

  function SidebarContent() {
    return (
      <div className="flex flex-col gap-5 text-sm">
        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700"
          >
            <X className="h-3.5 w-3.5" />
            Clear all filters
          </button>
        )}

        {/* Department */}
        <div>
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Department
          </h3>
          <ul>
            <li>
              <button
                onClick={() => setParam('category', null)}
                suppressHydrationWarning
                className={`w-full text-left px-1.5 py-1 text-sm rounded-sm transition-colors ${
                  !activeCategory
                    ? 'font-bold text-orange-600'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                All Products
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() =>
                    setParam(
                      'category',
                      activeCategory === cat.slug ? null : cat.slug
                    )
                  }
                  suppressHydrationWarning
                  className={`w-full text-left px-1.5 py-1 text-sm rounded-sm transition-colors ${
                    activeCategory === cat.slug
                      ? 'font-bold text-orange-600'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {cat.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-gray-200" />

        {/* Price */}
        <div>
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Price
          </h3>
          <ul>
            {PRICE_RANGES.map((range) => (
              <li key={range.value}>
                <button
                  onClick={() =>
                    setParam(
                      'price',
                      activePrice === range.value ? null : range.value
                    )
                  }
                  suppressHydrationWarning
                  className={`w-full text-left px-1.5 py-1 text-sm rounded-sm transition-colors ${
                    activePrice === range.value
                      ? 'font-bold text-orange-600'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {range.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-gray-200" />

        {/* Availability */}
        <div>
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Availability
          </h3>
          <label className="flex items-center gap-2.5 cursor-pointer px-1.5 py-1 rounded-sm hover:bg-gray-50">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setParam('inStock', e.target.checked ? '1' : null)}
              className="accent-orange-500 h-4 w-4 shrink-0"
            />
            <span className="text-sm text-gray-700">In Stock Only</span>
          </label>
        </div>

        {/* Brand — only show if brands exist */}
        {brands.length > 0 && (
          <>
            <div className="border-t border-gray-200" />
            <div>
              <button
                onClick={() => setBrandExpanded(!brandExpanded)}
                className="flex items-center justify-between w-full px-1.5 mb-1.5"
              >
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Brand
                </h3>
                {brandExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                )}
              </button>
              {brandExpanded && (
                <ul className="max-h-52 overflow-y-auto">
                  {brands.map((brand) => (
                    <li key={brand}>
                      <button
                        onClick={() =>
                          setParam(
                            'brand',
                            activeBrand === brand ? null : brand
                          )
                        }
                        className={`w-full text-left px-1.5 py-1 text-sm rounded-sm transition-colors ${
                          activeBrand === brand
                            ? 'font-bold text-orange-600'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        {brand}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ── Mobile: category pill bar ── */}
      <div className="lg:hidden sticky top-[82px] z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="shrink-0 flex items-center gap-1.5 border border-gray-300 text-xs font-semibold text-gray-700 px-3 py-1.5 bg-white hover:bg-gray-50"
          >
            <Filter className="h-3.5 w-3.5" />
            Filter
            {hasActiveFilters && (
              <span className="ml-0.5 bg-orange-500 text-white rounded-full text-[9px] w-4 h-4 flex items-center justify-center font-bold">
                !
              </span>
            )}
          </button>
          <button
            onClick={() => setParam('category', null)}
            className={`shrink-0 text-xs font-semibold px-3 py-1.5 border whitespace-nowrap transition-colors ${
              !activeCategory
                ? 'bg-slate-900 text-white border-slate-900'
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                setParam(
                  'category',
                  activeCategory === cat.slug ? null : cat.slug
                )
              }
              className={`shrink-0 text-xs font-semibold px-3 py-1.5 border whitespace-nowrap transition-colors ${
                activeCategory === cat.slug
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Mobile filter drawer ── */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-white h-full overflow-y-auto p-5 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">Filters</h2>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* ── Desktop: sidebar + main ── */}
      <div className="flex max-w-screen-2xl mx-auto">
        {/* Sticky sidebar */}
        <aside className="hidden lg:block w-56 xl:w-64 shrink-0">
          <div className="sticky top-[82px] h-[calc(100vh-82px)] overflow-y-auto bg-white border-r border-gray-200 p-4">
            <SidebarContent />
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-1 min-w-0 p-3 lg:p-4">
          {/* Toolbar: result count + sort */}
          <div className="flex items-center justify-between mb-3 gap-3">
            <p className="text-xs text-gray-500 min-w-0">
              {searchQuery && (
                <span className="mr-1">
                  Results for{' '}
                  <span className="font-semibold text-gray-800">
                    &ldquo;{searchQuery}&rdquo;
                  </span>
                </span>
              )}
              <span className="font-semibold text-gray-700">
                {products.length}
              </span>{' '}
              {activeCategoryName ? (
                <>
                  results in{' '}
                  <span className="font-semibold text-gray-700">
                    {activeCategoryName}
                  </span>
                </>
              ) : (
                'results'
              )}
            </p>

            <select
              value={activeSort}
              onChange={(e) => setParam('sort', e.target.value)}
              suppressHydrationWarning
              className="shrink-0 text-xs border border-gray-300 bg-white text-gray-700 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-400"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <InventoryGrid products={products} />
        </main>
      </div>
    </div>
  )
}
