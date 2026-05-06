import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Package, ChevronRight } from 'lucide-react'
import type { Order } from '@/types'

export const metadata = { title: 'Order History — My Corner Store' }

export default async function OrderHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/account/orders')

  const { data } = await supabase
    .from('orders')
    .select('id, order_number, status, total, subtotal, created_at, fulfillment_method, loyalty_points_earned')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const orders = (data ?? []) as Order[]

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
      <h2 className="font-semibold text-brand-charcoal mb-5 flex items-center gap-2">
        <Package className="h-4 w-4" /> Order History
      </h2>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No orders yet.</p>
          <Link href="/shop" className="text-brand-green text-sm hover:underline mt-1 inline-block">Start shopping →</Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="flex items-center justify-between py-4 hover:bg-gray-50 -mx-2 px-2 rounded-xl transition-colors group"
            >
              <div className="space-y-1">
                <p className="font-semibold text-sm text-brand-charcoal">{order.order_number}</p>
                <p className="text-xs text-gray-400">
                  {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {' · '}
                  {order.fulfillment_method.replace('_', ' ')}
                </p>
                {(order.loyalty_points_earned ?? 0) > 0 && (
                  <p className="text-xs text-brand-green">+{order.loyalty_points_earned} pts earned</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-bold text-sm">${order.total.toFixed(2)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    order.status === 'completed' ? 'bg-green-100 text-green-700' :
                    order.status === 'canceled'  ? 'bg-red-100 text-red-600' :
                    order.status === 'paid'      ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{order.status.replace('_', ' ')}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-brand-green transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
