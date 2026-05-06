import { createAdminClient } from '@/lib/supabase/admin'
import { RefreshCw } from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'
import type { Subscription } from '@/types'

export const metadata = { title: 'Subscriptions — Admin' }

const FREQ_LABELS: Record<string, string> = {
  weekly: 'Weekly', biweekly: 'Bi-weekly', monthly: 'Monthly',
}

export default async function AdminSubscriptionsPage() {
  const supabase = createAdminClient()
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('*, product:products(id, name, retail_price), profiles:profiles!subscriptions_user_id_fkey(email, full_name)')
    .neq('status', 'canceled')
    .order('created_at', { ascending: false })

  const subscriptions = (subs ?? []) as (Subscription & { profiles: { email: string; full_name: string | null } | null })[]

  const active = subscriptions.filter((s) => s.status === 'active').length
  const paused = subscriptions.filter((s) => s.status === 'paused').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-charcoal flex items-center gap-2">
          <RefreshCw className="h-6 w-6 text-brand-green" /> Subscriptions
        </h1>
        <p className="text-gray-500 text-sm mt-1">Active auto-refill subscriptions across all customers</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: subscriptions.length },
          { label: 'Active', value: active },
          { label: 'Paused', value: paused },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-brand-charcoal">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase">
              <th className="text-left px-6 py-3">Customer</th>
              <th className="text-left px-6 py-3">Product</th>
              <th className="text-left px-6 py-3">Freq</th>
              <th className="text-right px-6 py-3">Qty</th>
              <th className="text-right px-6 py-3">Value</th>
              <th className="text-left px-6 py-3">Next Order</th>
              <th className="text-left px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {subscriptions.map((sub) => {
              const discountedPrice = sub.product ? sub.product.retail_price * 0.9 : 0
              return (
                <tr key={sub.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-3">
                    <p className="font-medium text-brand-charcoal">{sub.profiles?.full_name ?? '—'}</p>
                    <p className="text-xs text-gray-400">{sub.profiles?.email}</p>
                  </td>
                  <td className="px-6 py-3 text-gray-700">{sub.product?.name ?? '—'}</td>
                  <td className="px-6 py-3 text-gray-500">{FREQ_LABELS[sub.frequency] ?? sub.frequency}</td>
                  <td className="px-6 py-3 text-right text-gray-700">{sub.quantity}</td>
                  <td className="px-6 py-3 text-right font-medium text-brand-charcoal">
                    {formatPrice(discountedPrice * sub.quantity)}<span className="text-xs text-gray-400">/order</span>
                  </td>
                  <td className="px-6 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(sub.next_order_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{sub.status}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {subscriptions.length === 0 && (
          <p className="text-gray-400 text-sm p-6 text-center">No active subscriptions yet.</p>
        )}
      </div>
    </div>
  )
}
