import { redirect } from 'next/navigation'
import { Boxes, TrendingUp, Repeat, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils/format'

export const metadata = { title: 'SKU Velocity — Admin' }
export const dynamic = 'force-dynamic'

type SkuRow = {
  product_id: string
  product_name: string
  sku: string | null
  category_name: string | null
  retail_price: number
  wholesale_cost: number
  margin_per_unit: number
  margin_pct: number
  inventory_quantity: number
  units_w1: number
  units_w2: number
  units_w3: number
  units_w4: number
  units_total: number
  revenue_total: number
  margin_total: number
  subscription_monthly_units: number
  consecutive_weeks_above: number
  recommendation: 'stock_now' | 'watch' | 'virtual'
}

type SearchParams = {
  window_days?: string
  min_weekly_units?: string
  consecutive_weeks?: string
  filter?: 'all' | 'stock_now' | 'watch' | 'virtual'
}

const RECOMMENDATION_STYLES: Record<
  SkuRow['recommendation'],
  { label: string; classes: string }
> = {
  stock_now: { label: 'Stock now',  classes: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  watch:     { label: 'Watch',      classes: 'bg-amber-100 text-amber-800 border-amber-200' },
  virtual:   { label: 'Stay virtual', classes: 'bg-gray-100 text-gray-600 border-gray-200' },
}

export default async function SkuVelocityPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/sku-velocity')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') redirect('/')

  const params = await searchParams
  const windowDays      = Math.min(Math.max(parseInt(params.window_days       ?? '28') || 28, 7),  90)
  const minWeeklyUnits  = Math.min(Math.max(parseInt(params.min_weekly_units  ?? '5')  || 5,  1),  100)
  const consecutiveWks  = Math.min(Math.max(parseInt(params.consecutive_weeks ?? '3')  || 3,  1),  4)
  const filter          = (params.filter ?? 'stock_now') as NonNullable<SearchParams['filter']>

  const { data, error } = await supabase.rpc('get_sku_velocity_ranking', {
    p_window_days:       windowDays,
    p_min_weekly_units:  minWeeklyUnits,
    p_consecutive_weeks: consecutiveWks,
  })

  const rows: SkuRow[] = (data ?? []) as SkuRow[]
  const filtered = filter === 'all' ? rows : rows.filter((r) => r.recommendation === filter)

  const counts = {
    stock_now: rows.filter((r) => r.recommendation === 'stock_now').length,
    watch:     rows.filter((r) => r.recommendation === 'watch').length,
    virtual:   rows.filter((r) => r.recommendation === 'virtual').length,
  }

  const stockNowMarginTotal = rows
    .filter((r) => r.recommendation === 'stock_now')
    .reduce((sum, r) => sum + Number(r.margin_total ?? 0), 0)

  const stockNowBuyEstimate = rows
    .filter((r) => r.recommendation === 'stock_now')
    .reduce((sum, r) => {
      const weeklyVelocity = (r.units_w1 + r.units_w2) / 2
      const subscriptionWeekly = r.subscription_monthly_units / 4
      const weekly = Math.max(weeklyVelocity, subscriptionWeekly)
      return sum + weekly * 2 * Number(r.wholesale_cost ?? 0)
    }, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-charcoal flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-brand-green" />
          SKU Velocity Ranking
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Which products earn a shelf slot. Graduates to <em>Stock now</em> after{' '}
          <strong>{minWeeklyUnits}+ units/week for {consecutiveWks} consecutive weeks</strong>{' '}
          (or enough subscription-locked monthly demand).
        </p>
      </div>

      {/* Filter form */}
      <form className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 flex flex-wrap items-end gap-3 text-sm">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Window (days)</label>
          <input
            type="number"
            name="window_days"
            defaultValue={windowDays}
            min={7}
            max={90}
            className="w-24 rounded-lg border border-gray-200 px-2.5 py-1.5"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Min units / week</label>
          <input
            type="number"
            name="min_weekly_units"
            defaultValue={minWeeklyUnits}
            min={1}
            max={100}
            className="w-24 rounded-lg border border-gray-200 px-2.5 py-1.5"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Consecutive weeks</label>
          <input
            type="number"
            name="consecutive_weeks"
            defaultValue={consecutiveWks}
            min={1}
            max={4}
            className="w-24 rounded-lg border border-gray-200 px-2.5 py-1.5"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Show</label>
          <select
            name="filter"
            defaultValue={filter}
            className="rounded-lg border border-gray-200 px-2.5 py-1.5"
          >
            <option value="stock_now">Stock now ({counts.stock_now})</option>
            <option value="watch">Watch ({counts.watch})</option>
            <option value="virtual">Stay virtual ({counts.virtual})</option>
            <option value="all">All ({rows.length})</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-brand-green text-white text-xs font-semibold rounded-lg px-4 py-2 hover:bg-brand-green/90"
        >
          Apply
        </button>
      </form>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5">
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wide mb-1">
            <Sparkles className="w-4 h-4" /> Recommended Buy
          </div>
          <p className="text-2xl font-bold text-brand-charcoal">
            {formatPrice(stockNowBuyEstimate)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ~2 weeks of forecasted demand across {counts.stock_now} stock-now SKUs
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 p-5">
          <div className="flex items-center gap-2 text-brand-charcoal text-xs font-bold uppercase tracking-wide mb-1">
            <Boxes className="w-4 h-4 text-brand-green" /> Stock-now Margin ({windowDays}d)
          </div>
          <p className="text-2xl font-bold text-brand-charcoal">
            {formatPrice(stockNowMarginTotal)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Gross margin already proven on these SKUs in the window
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 p-5">
          <div className="flex items-center gap-2 text-brand-charcoal text-xs font-bold uppercase tracking-wide mb-1">
            <Repeat className="w-4 h-4 text-brand-orange" /> Subscription-locked SKUs
          </div>
          <p className="text-2xl font-bold text-brand-charcoal">
            {rows.filter((r) => r.subscription_monthly_units > 0).length}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Products with recurring monthly demand from active B2B plans
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error.message}
        </div>
      )}

      {/* Ranked table */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Product</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-right px-3 py-3 font-medium" title="Most recent 7d">W1</th>
                <th className="text-right px-3 py-3 font-medium">W2</th>
                <th className="text-right px-3 py-3 font-medium">W3</th>
                <th className="text-right px-3 py-3 font-medium">W4</th>
                <th className="text-right px-3 py-3 font-medium" title="Streak of weeks at or above threshold (starting W1)">Streak</th>
                <th className="text-right px-3 py-3 font-medium" title="Monthly units locked in by active subscriptions">Sub/mo</th>
                <th className="text-right px-3 py-3 font-medium">Margin %</th>
                <th className="text-right px-3 py-3 font-medium">Margin {windowDays}d</th>
                <th className="text-right px-3 py-3 font-medium" title="Current inventory on hand">On hand</th>
                <th className="text-left px-3 py-3 font-medium">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center text-gray-400 py-10">
                    No SKUs match this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const style = RECOMMENDATION_STYLES[r.recommendation]
                  return (
                    <tr key={r.product_id} className="border-b border-gray-50 hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <p className="font-medium text-brand-charcoal">{r.product_name}</p>
                        {r.sku && <p className="text-xs text-gray-400 mt-0.5">{r.sku}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {r.category_name ?? '—'}
                      </td>
                      <WeekCell value={r.units_w1} threshold={minWeeklyUnits} />
                      <WeekCell value={r.units_w2} threshold={minWeeklyUnits} />
                      <WeekCell value={r.units_w3} threshold={minWeeklyUnits} />
                      <WeekCell value={r.units_w4} threshold={minWeeklyUnits} />
                      <td className="text-right px-3 py-3 font-semibold text-gray-700">
                        {r.consecutive_weeks_above}
                      </td>
                      <td className="text-right px-3 py-3 text-gray-700">
                        {r.subscription_monthly_units > 0 ? r.subscription_monthly_units : '—'}
                      </td>
                      <td className="text-right px-3 py-3 text-gray-700">
                        {Number(r.margin_pct).toFixed(0)}%
                      </td>
                      <td className="text-right px-3 py-3 font-medium text-brand-charcoal">
                        {formatPrice(Number(r.margin_total))}
                      </td>
                      <td className="text-right px-3 py-3 text-gray-500">
                        {r.inventory_quantity}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-block text-[10px] font-bold uppercase tracking-wide border rounded-full px-2 py-0.5 ${style.classes}`}
                        >
                          {style.label}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Tip: refresh weekly and use the <em>Stock now</em> list as your shopping list. Re-rank in 30
        days; SKUs that drop below the threshold for {consecutiveWks} weeks should fall back to virtual.
      </p>
    </div>
  )
}

function WeekCell({ value, threshold }: { value: number; threshold: number }) {
  const hit = value >= threshold
  return (
    <td
      className={`text-right px-3 py-3 tabular-nums ${
        hit ? 'text-emerald-700 font-semibold' : 'text-gray-400'
      }`}
    >
      {value}
    </td>
  )
}
