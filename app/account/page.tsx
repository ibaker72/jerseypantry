import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Star, Package, ArrowRight, Gift, DollarSign, Users } from 'lucide-react'
import type { Order, Profile } from '@/types'

export const metadata = { title: 'My Account — My Corner Store' }

const POINTS_PER_DOLLAR = 1
const POINTS_TO_DOLLAR  = 100  // 100 pts = $1

export default async function AccountDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/account')

  const [{ data: profile }, { data: recentOrders }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('orders')
      .select('id, order_number, status, total, created_at, fulfillment_method')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  const p = profile as Profile | null
  const orders = (recentOrders ?? []) as Order[]
  const points = p?.loyalty_points ?? 0
  const dollarValue = (points / POINTS_TO_DOLLAR).toFixed(2)

  return (
    <div className="space-y-6">
      {/* Loyalty card */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-green to-green-700 text-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-green-200 text-sm font-medium flex items-center gap-1">
              <Star className="h-3.5 w-3.5" /> Corner Points
            </p>
            <p className="text-4xl font-bold mt-1">{points.toLocaleString()}</p>
            <p className="text-green-200 text-sm mt-1">≈ ${dollarValue} in store credit</p>
          </div>
          <Gift className="h-10 w-10 text-green-300 opacity-60" />
        </div>
        <div className="mt-4 pt-4 border-t border-green-600 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-green-300">Earn rate</p>
            <p className="font-medium">{POINTS_PER_DOLLAR} pt per $1 spent</p>
          </div>
          <div>
            <p className="text-green-300">Redeem</p>
            <p className="font-medium">{POINTS_TO_DOLLAR} pts = $1 off</p>
          </div>
        </div>
      </div>

      {/* Store credit */}
      {(p?.store_credit ?? 0) > 0 && (
        <div className="rounded-2xl bg-white border border-brand-green/30 shadow-sm p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-green/10 rounded-xl p-3">
              <DollarSign className="h-5 w-5 text-brand-green" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Store Credit</p>
              <p className="text-2xl font-bold text-brand-green">${(p.store_credit).toFixed(2)}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-right">Applied automatically<br />at checkout</p>
        </div>
      )}

      {/* Welcome */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
        <p className="text-gray-500 text-sm">Welcome back,</p>
        <p className="text-xl font-bold text-brand-charcoal">{p?.full_name || user.email}</p>
      </div>

      {/* Referral CTA */}
      <Link href="/account/referrals" className="block rounded-2xl bg-amber-50 border border-amber-200 shadow-sm p-4 hover:border-amber-400 transition-colors">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800 text-sm">Refer a friend — get $10 store credit</p>
            <p className="text-xs text-amber-600 mt-0.5">They get $5 off their first order too</p>
          </div>
          <ArrowRight className="h-4 w-4 text-amber-600" />
        </div>
      </Link>

      {/* Recent orders */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-brand-charcoal flex items-center gap-2">
            <Package className="h-4 w-4" /> Recent Orders
          </h2>
          <Link href="/account/orders" className="text-sm text-brand-green hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <p className="text-gray-400 text-sm">No orders yet. <Link href="/shop" className="text-brand-green hover:underline">Start shopping →</Link></p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-brand-green transition-colors"
              >
                <div>
                  <p className="font-medium text-sm text-brand-charcoal">{order.order_number}</p>
                  <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">${order.total.toFixed(2)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    order.status === 'completed' ? 'bg-green-100 text-green-700' :
                    order.status === 'canceled'  ? 'bg-red-100 text-red-600' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{order.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
