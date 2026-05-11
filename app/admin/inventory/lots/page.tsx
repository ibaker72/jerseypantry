import Link from 'next/link'
import { Plus, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils/format'
import type { InventoryLot } from '@/types'

export const metadata = { title: 'Inventory Lots — Admin' }

function daysUntil(date: string | null): number | null {
  if (!date) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exp = new Date(date)
  const ms = exp.getTime() - today.getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

interface PageProps {
  searchParams: Promise<{ filter?: string }>
}

export default async function InventoryLotsPage({ searchParams }: PageProps) {
  const { filter } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('inventory_lots')
    .select('*, product:products(id, name, sku), supplier:suppliers(id, name)')
    .order('received_at', { ascending: false })
    .limit(300)

  if (filter === 'remaining') {
    query = query.gt('quantity_remaining', 0)
  } else if (filter === 'expiring') {
    const thirtyDays = new Date()
    thirtyDays.setDate(thirtyDays.getDate() + 30)
    query = query
      .gt('quantity_remaining', 0)
      .not('expiration_date', 'is', null)
      .lte('expiration_date', thirtyDays.toISOString().slice(0, 10))
  }

  const { data } = await query
  const lots = (data ?? []) as InventoryLot[]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-charcoal">Inventory Lots</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Received shipments with cost, lot #, and expiration tracking.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/inventory/receive">
            <Plus className="h-4 w-4" /> Receive shipment
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <FilterChip label="All" href="/admin/inventory/lots" active={!filter} />
        <FilterChip
          label="With remaining stock"
          href="/admin/inventory/lots?filter=remaining"
          active={filter === 'remaining'}
        />
        <FilterChip
          label="Expiring within 30 days"
          href="/admin/inventory/lots?filter=expiring"
          active={filter === 'expiring'}
        />
      </div>

      {lots.length === 0 ? (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-12 text-center">
          <div className="text-5xl mb-3">📦</div>
          <p className="font-semibold text-brand-charcoal">No lots yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Record your first shipment to start tracking cost & expiration.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Supplier</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Remaining</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Unit cost</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Total cost</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Lot #</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Expires</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lots.map((lot) => {
                  const days = daysUntil(lot.expiration_date)
                  const isUrgent = days !== null && days <= 14 && lot.quantity_remaining > 0
                  return (
                    <tr key={lot.id} className={isUrgent ? 'bg-orange-50/40' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3 text-brand-charcoal font-medium">
                        {lot.product?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {lot.supplier ? (
                          <Link href={`/admin/suppliers/${lot.supplier.id}`} className="hover:text-brand-green">
                            {lot.supplier.name}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {lot.quantity_remaining}
                        <span className="text-gray-400"> / {lot.quantity_received}</span>
                      </td>
                      <td className="px-4 py-3 text-right">{formatPrice(lot.unit_cost)}</td>
                      <td className="px-4 py-3 text-right">{formatPrice(lot.total_cost)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs font-mono">
                        {lot.lot_number ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {lot.expiration_date ? (
                          <span className={isUrgent ? 'text-orange-600 font-medium inline-flex items-center gap-1' : 'text-gray-500'}>
                            {isUrgent && <AlertTriangle className="h-3.5 w-3.5" />}
                            {new Date(lot.expiration_date).toLocaleDateString()}
                            {days !== null && (
                              <span className="text-gray-400 ml-1">
                                ({days < 0 ? `${-days}d ago` : `${days}d`})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(lot.received_at).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
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
}: {
  label: string
  href: string
  active: boolean
}) {
  return (
    <a
      href={href}
      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? 'bg-brand-green text-white border-brand-green'
          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
      }`}
    >
      {label}
    </a>
  )
}
