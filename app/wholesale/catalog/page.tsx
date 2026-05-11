import Link from 'next/link'
import { ArrowRight, Zap, CalendarClock, ShieldCheck, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { buildMetadata } from '@/lib/seo/metadata'
import { formatPrice } from '@/lib/utils/format'
import { getWholesaleMode, isCurrentUserWholesaleApproved } from '@/lib/wholesale/mode'
import type { Product, VelocityVerdict } from '@/types'

export const metadata = buildMetadata({
  title: 'Wholesale Catalog Preview',
  description:
    'Preview wholesale pricing across our entire catalog. Approved business accounts unlock live pricing, case-size ordering, and same-day delivery across North Jersey.',
  path: '/wholesale/catalog',
})

// Mock pricing heuristic — replace once wholesale_inventory is fully populated.
const MOCK_WHOLESALE_MARKUP = 0.65
const DEFAULT_CASE_SIZE = 12

interface CatalogPageProps {
  searchParams: Promise<{ q?: string; category?: string }>
}

type ProductRow = Product & { wholesale_price?: number | null; case_size?: number | null }

export default async function WholesaleCatalogPreview({ searchParams }: CatalogPageProps) {
  const params = await searchParams
  const supabase = await createClient()

  const [
    isApproved,
    wholesaleMode,
    productsRes,
    categoriesRes,
    velocityRes,
  ] = await Promise.all([
    isCurrentUserWholesaleApproved(),
    getWholesaleMode(),
    supabase
      .from('products_with_wholesale')
      .select('*, category:categories(*)')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('name')
      .limit(200),
    supabase.from('categories').select('id, name, slug').eq('is_active', true).order('sort_order'),
    supabase.rpc('get_product_velocity'),
  ])

  const allProducts = (productsRes.data ?? []) as ProductRow[]
  const categories = (categoriesRes.data ?? []) as { id: string; name: string; slug: string }[]
  const verdicts: Record<string, VelocityVerdict> = Object.fromEntries(
    ((velocityRes.data ?? []) as { product_id: string; recommendation: VelocityVerdict }[])
      .map((r) => [r.product_id, r.recommendation])
  )

  // Filter
  const q = params.q?.toLowerCase().trim() ?? ''
  const categoryFilter = params.category ?? ''
  const products = allProducts.filter((p) => {
    if (categoryFilter && p.category?.slug !== categoryFilter) return false
    if (q && !p.name.toLowerCase().includes(q) && !(p.brand ?? '').toLowerCase().includes(q)) return false
    return true
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-brand-charcoal">Wholesale Catalog</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {wholesaleMode
              ? 'Live wholesale pricing for your account.'
              : 'Preview — sample case-pricing across our active catalog.'}
            {' '}
            <span className="text-gray-400">·</span> {products.length} product{products.length !== 1 ? 's' : ''}
          </p>
        </div>
        {!isApproved && (
          <Link
            href="/wholesale#apply"
            className="inline-flex items-center gap-1.5 bg-brand-orange text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-brand-orange/90 transition-colors"
          >
            Apply for an account <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* ── Preview banner ── */}
      {!isApproved && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900">You&apos;re viewing sample pricing.</p>
            <p className="text-amber-800 mt-0.5">
              Mock per-case prices are computed for preview only. Approved business accounts see live
              wholesale pricing on every retail page via the <strong>Wholesale Mode</strong> toggle.
            </p>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <form className="mb-6 flex flex-wrap items-end gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            name="q"
            defaultValue={params.q ?? ''}
            placeholder="Search products or brands…"
            className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
          />
        </div>
        <select
          name="category"
          defaultValue={categoryFilter}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-brand-green text-white text-sm font-semibold rounded-xl px-4 py-2 hover:bg-brand-green/90"
        >
          Filter
        </button>
      </form>

      {/* ── Table ── */}
      {products.length === 0 ? (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-2xl mb-3">📦</p>
          <p className="font-semibold text-brand-charcoal">No products match those filters.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Product</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-right px-3 py-3 font-medium">Retail</th>
                  <th className="text-right px-3 py-3 font-medium">Wholesale / unit</th>
                  <th className="text-right px-3 py-3 font-medium">Case</th>
                  <th className="text-right px-3 py-3 font-medium">Per case</th>
                  <th className="text-left px-3 py-3 font-medium">Delivery</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const wholesaleUnit = p.wholesale_price
                    ? Number(p.wholesale_price)
                    : Number((p.retail_price * MOCK_WHOLESALE_MARKUP).toFixed(2))
                  const caseSize = p.case_size ?? DEFAULT_CASE_SIZE
                  const casePrice = wholesaleUnit * caseSize
                  const verdict = verdicts[p.id]
                  const usingMock = !p.wholesale_price

                  return (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <Link href={`/shop/${p.slug}`} className="font-medium text-brand-charcoal hover:text-brand-green">
                          {p.name}
                        </Link>
                        {p.brand && <p className="text-xs text-gray-400 mt-0.5">{p.brand}{p.size ? ` · ${p.size}` : ''}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{p.category?.name ?? '—'}</td>
                      <td className="text-right px-3 py-3 text-gray-500 tabular-nums">
                        {formatPrice(p.retail_price)}
                      </td>
                      <td className="text-right px-3 py-3 text-brand-charcoal tabular-nums">
                        {formatPrice(wholesaleUnit)}
                        {usingMock && <span className="ml-1 text-[10px] uppercase text-amber-600 font-bold">mock</span>}
                      </td>
                      <td className="text-right px-3 py-3 text-gray-500 tabular-nums">{caseSize}</td>
                      <td className="text-right px-3 py-3 font-semibold text-brand-charcoal tabular-nums">
                        {formatPrice(casePrice)}
                      </td>
                      <td className="px-3 py-3">
                        <VerdictPill verdict={verdict} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Bottom CTA ── */}
      {!isApproved && (
        <div className="mt-10 rounded-3xl bg-brand-navy text-white p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Ready to order at wholesale?</h2>
          <p className="text-blue-100 max-w-lg mx-auto mb-5">
            Apply for an account and we&apos;ll switch on live pricing, case-size ordering, and Net-30 billing within 24 hours.
          </p>
          <Link
            href="/wholesale#apply"
            className="inline-flex items-center gap-2 bg-brand-orange text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-brand-orange/90 transition-colors"
          >
            Apply for Wholesale <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  )
}

function VerdictPill({ verdict }: { verdict: VelocityVerdict | undefined }) {
  if (verdict === 'stock_now') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5 bg-emerald-100 text-emerald-700">
        <Zap className="h-3 w-3" /> Instant
      </span>
    )
  }
  if (verdict === 'virtual') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5 bg-amber-100 text-amber-700">
        <CalendarClock className="h-3 w-3" /> 24hr
      </span>
    )
  }
  return <span className="text-[11px] text-gray-400">Available</span>
}
