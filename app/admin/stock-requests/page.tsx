import { createClient } from '@/lib/supabase/server'
import { StockRequestRow } from '@/components/admin/StockRequestRow'
import type { StockRequest } from '@/types'

export const metadata = { title: 'Stock Requests — Admin' }

const STATUS_LABEL: Record<string, string> = {
  new: 'New',
  reviewing: 'Reviewing',
  sourced: 'Sourced',
  declined: 'Declined',
}

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function AdminStockRequestsPage({ searchParams }: PageProps) {
  const { status } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('stock_requests')
    .select('*')
    .order('request_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(500)

  if (status && status in STATUS_LABEL) {
    query = query.eq('status', status)
  }

  const { data } = await query
  const requests = (data ?? []) as StockRequest[]

  // tally for filter chips
  const { data: tallyData } = await supabase
    .from('stock_requests')
    .select('status')

  const tally = (tallyData ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1
    return acc
  }, {})

  const totalRequests = requests.reduce((sum, r) => sum + r.request_count, 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-charcoal">Stock Requests</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          What customers wish you stocked — your sourcing backlog, ranked by demand.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <FilterChip label="All" href="/admin/stock-requests" active={!status} count={Object.values(tally).reduce((a, b) => a + b, 0)} />
        {(['new', 'reviewing', 'sourced', 'declined'] as const).map((s) => (
          <FilterChip
            key={s}
            label={STATUS_LABEL[s]}
            href={`/admin/stock-requests?status=${s}`}
            active={status === s}
            count={tally[s] ?? 0}
          />
        ))}
        <div className="ml-auto text-sm text-gray-500">
          <span className="font-semibold text-brand-charcoal">{totalRequests}</span> total upvotes across{' '}
          <span className="font-semibold text-brand-charcoal">{requests.length}</span> items
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-12 text-center">
          <div className="text-5xl mb-3">📭</div>
          <p className="font-semibold text-brand-charcoal">No stock requests yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Customers can request items from the storefront footer.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Item</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Requests</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Contact</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Source</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 min-w-[180px]">Internal notes</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((r) => (
                  <StockRequestRow key={r.id} request={r} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterChip({
  label,
  href,
  active,
  count,
}: {
  label: string
  href: string
  active: boolean
  count: number
}) {
  return (
    <a
      href={href}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? 'bg-brand-green text-white border-brand-green'
          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
      }`}
    >
      {label}
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
          active ? 'bg-white/20' : 'bg-gray-100 text-gray-500'
        }`}
      >
        {count}
      </span>
    </a>
  )
}
