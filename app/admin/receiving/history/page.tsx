import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils/format'
import type { ReceivingSession } from '@/types'

export const metadata = { title: 'Receiving History — Admin' }

interface SessionRow extends ReceivingSession {
  lot_count: number
  total_cost: number
  total_units: number
}

export default async function ReceivingHistoryPage() {
  const supabase = await createClient()

  const { data: sessions } = await supabase
    .from('receiving_sessions')
    .select('*, supplier:suppliers(id, name)')
    .order('started_at', { ascending: false })
    .limit(100)

  const ids = (sessions ?? []).map((s) => s.id)
  let totals = new Map<string, { count: number; total: number; units: number }>()

  if (ids.length > 0) {
    const { data: lots } = await supabase
      .from('inventory_lots')
      .select('receiving_session_id, total_cost, quantity_received')
      .in('receiving_session_id', ids)

    for (const lot of lots ?? []) {
      const key = lot.receiving_session_id as string
      const cur = totals.get(key) ?? { count: 0, total: 0, units: 0 }
      cur.count += 1
      cur.total += Number(lot.total_cost)
      cur.units += lot.quantity_received
      totals.set(key, cur)
    }
  }

  const rows: SessionRow[] = (sessions ?? []).map((s) => {
    const t = totals.get(s.id) ?? { count: 0, total: 0, units: 0 }
    return {
      ...(s as ReceivingSession),
      lot_count: t.count,
      total_cost: t.total,
      total_units: t.units,
    }
  })

  return (
    <div>
      <Link
        href="/admin/receiving"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-green mb-3"
      >
        <ArrowLeft className="h-4 w-4" /> Back to receiving
      </Link>
      <h1 className="text-2xl font-bold text-brand-charcoal mb-6">
        Receiving history
      </h1>

      {rows.length === 0 ? (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-12 text-center">
          <div className="text-5xl mb-3">📋</div>
          <p className="font-semibold text-brand-charcoal">No sessions yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Start a session to track your wholesale runs.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">When</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Supplier</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Lots</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Units</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/receiving/${row.id}`}
                      className="font-medium text-brand-green hover:underline"
                    >
                      {new Date(row.started_at).toLocaleString()}
                    </Link>
                    {row.notes && (
                      <p className="text-xs text-gray-400 mt-0.5 italic">
                        {row.notes}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {row.supplier?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">{row.lot_count}</td>
                  <td className="px-4 py-3 text-right">{row.total_units}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatPrice(row.total_cost)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-xs font-medium rounded-full px-2 py-0.5 ${
                        row.status === 'open'
                          ? 'bg-orange-100 text-orange-700'
                          : row.status === 'finalized'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
