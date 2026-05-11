import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ReceivingSessionClient } from '@/components/admin/ReceivingSessionClient'
import { formatPrice } from '@/lib/utils/format'
import type { Category, InventoryLot, ReceivingSession } from '@/types'

export const metadata = { title: 'Receiving Session — Admin' }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ReceivingSessionPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: sessionData } = await supabase
    .from('receiving_sessions')
    .select('*, supplier:suppliers(id, name)')
    .eq('id', id)
    .single()

  if (!sessionData) notFound()
  const session = sessionData as ReceivingSession

  const { data: lotsData } = await supabase
    .from('inventory_lots')
    .select('*, product:products(id, name, sku)')
    .eq('receiving_session_id', id)
    .order('received_at', { ascending: false })

  const lots = (lotsData ?? []) as (InventoryLot & {
    product: { id: string; name: string; sku: string | null } | null
  })[]

  const { data: catsData } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  const categories = (catsData ?? []) as Category[]

  // Read-only view for finalized/canceled sessions.
  if (session.status !== 'open') {
    const totalCost = lots.reduce((sum, l) => sum + Number(l.total_cost), 0)
    return (
      <div className="max-w-3xl">
        <Link
          href="/admin/receiving/history"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-green mb-3"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sessions
        </Link>
        <h1 className="text-2xl font-bold text-brand-charcoal">
          Session — {new Date(session.started_at).toLocaleString()}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          <span className="inline-flex items-center gap-1.5 mr-3">
            <CheckCircle2 className="h-4 w-4 text-brand-green" />
            {session.status}
          </span>
          {session.supplier?.name ?? 'No supplier'} · total{' '}
          <strong>{formatPrice(totalCost)}</strong>
        </p>
        <div className="mt-6 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Product</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Qty</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Unit</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lots.map((lot) => (
                <tr key={lot.id}>
                  <td className="px-4 py-3">{lot.product?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right">{lot.quantity_received}</td>
                  <td className="px-4 py-3 text-right">{formatPrice(Number(lot.unit_cost))}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatPrice(Number(lot.total_cost))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Link
        href="/admin/receiving"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-green mb-3"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-brand-charcoal">
          Receiving session
        </h1>
        <p className="text-xs text-gray-400">
          started {new Date(session.started_at).toLocaleString()}
        </p>
      </div>
      <ReceivingSessionClient
        session={session}
        initialLots={lots}
        categories={categories}
      />
    </div>
  )
}
