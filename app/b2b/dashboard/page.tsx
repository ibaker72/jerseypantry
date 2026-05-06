import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from "@/lib/utils/format"
import { B2B_PLANS } from '@/types'
import { Package, Calendar, Receipt, AlertCircle, CheckCircle, Clock } from 'lucide-react'

function statusBadge(status: string) {
  const map: Record<string, { label: string; class: string }> = {
    active: { label: 'Active', class: 'bg-green-100 text-green-800' },
    trialing: { label: 'Trial', class: 'bg-blue-100 text-blue-800' },
    past_due: { label: 'Past Due', class: 'bg-red-100 text-red-800' },
    pending: { label: 'Pending', class: 'bg-yellow-100 text-yellow-800' },
    paused: { label: 'Paused', class: 'bg-gray-100 text-gray-600' },
    canceled: { label: 'Canceled', class: 'bg-red-100 text-red-700' },
  }
  const s = map[status] ?? { label: status, class: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.class}`}>
      {s.label}
    </span>
  )
}

export default async function B2BDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/b2b/dashboard')

  const admin = createAdminClient()

  const { data: member } = await admin
    .from('business_members')
    .select('business_id, role')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .single()

  if (!member) redirect('/office-refill?no_account=1')

  const [{ data: account }, { data: recentOrders }, { data: nextSchedule }, { data: openInvoice }] =
    await Promise.all([
      admin
        .from('business_accounts')
        .select('*')
        .eq('id', member.business_id)
        .single(),
      admin
        .from('orders')
        .select('id, created_at, total, status')
        .eq('business_account_id', member.business_id)
        .order('created_at', { ascending: false })
        .limit(5),
      admin
        .from('delivery_schedules')
        .select('*')
        .eq('business_id', member.business_id)
        .eq('is_active', true)
        .order('next_delivery_at', { ascending: true })
        .limit(1)
        .single(),
      admin
        .from('business_invoices')
        .select('*')
        .eq('business_id', member.business_id)
        .eq('status', 'open')
        .order('due_date', { ascending: true })
        .limit(1)
        .single(),
    ])

  const plan = account ? B2B_PLANS[account.plan_name as keyof typeof B2B_PLANS] : null

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-charcoal">{account?.business_name}</h1>
        {account && statusBadge(account.subscription_status)}
      </div>

      {account?.subscription_status === 'past_due' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-red-800">Payment past due</p>
            <p className="text-sm text-red-600 mt-0.5">
              Please update your payment method to keep your account active.{' '}
              <Link href="/b2b/billing" className="underline font-medium">Update billing →</Link>
            </p>
          </div>
        </div>
      )}

      {/* Plan overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Current Plan</p>
          <p className="text-xl font-bold text-brand-charcoal">{plan?.name ?? account?.plan_name}</p>
          <p className="text-sm text-gray-500 mt-1">{plan?.priceLabel ?? '—'} / month</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Next Renewal</p>
          <p className="text-xl font-bold text-brand-charcoal">
            {account?.current_period_end
              ? new Date(account.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : '—'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {account?.billing_type === 'net30' ? 'Net-30 invoice' : 'Card on file'}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Next Delivery</p>
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
          </div>
          {nextSchedule ? (
            <>
              <p className="text-xl font-bold text-brand-charcoal">
                {nextSchedule.next_delivery_at
                  ? new Date(nextSchedule.next_delivery_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : dayNames[nextSchedule.day_of_week ?? 0]}
              </p>
              <p className="text-sm text-gray-500 mt-1 capitalize">{nextSchedule.frequency.replace('_', ' ')}</p>
            </>
          ) : (
            <>
              <p className="text-xl font-bold text-gray-300">—</p>
              <Link href="/b2b/schedule" className="text-sm text-brand-green hover:underline">Set up schedule →</Link>
            </>
          )}
        </div>
      </div>

      {/* Open invoice alert */}
      {openInvoice && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <Receipt className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-yellow-900">
              Invoice due {openInvoice.due_date ? new Date(openInvoice.due_date).toLocaleDateString() : 'soon'}
            </p>
            <p className="text-sm text-yellow-700 mt-0.5">
              {formatPrice(openInvoice.amount_due / 100)} outstanding
            </p>
          </div>
          <Link href="/b2b/billing" className="text-sm font-medium text-yellow-900 underline">View billing</Link>
        </div>
      )}

      {/* Recent orders */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-brand-charcoal">Recent Orders</h2>
          <Link href="/b2b/orders" className="text-sm text-brand-green hover:underline">View all →</Link>
        </div>
        {recentOrders && recentOrders.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-2.5">Order</th>
                <th className="text-left px-5 py-2.5">Date</th>
                <th className="text-right px-5 py-2.5">Total</th>
                <th className="text-right px-5 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">{order.id.slice(0, 8)}…</td>
                  <td className="px-5 py-3 text-gray-600">
                    {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-5 py-3 text-right font-medium">{formatPrice(order.total)}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                      order.status === 'delivered' ? 'text-green-700' :
                      order.status === 'processing' ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      {order.status === 'delivered' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-5 py-10 text-center">
            <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No orders yet</p>
            <Link href="/b2b/catalog" className="text-sm text-brand-green hover:underline mt-1 block">
              Browse your catalog →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
