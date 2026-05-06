import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { formatPrice } from "@/lib/utils/format"
import { ShoppingCart, CheckCircle, Clock, Truck } from 'lucide-react'

const STATUS_ICONS: Record<string, React.ReactNode> = {
  delivered: <CheckCircle className="w-4 h-4 text-green-500" />,
  out_for_delivery: <Truck className="w-4 h-4 text-blue-500" />,
  processing: <Clock className="w-4 h-4 text-yellow-500" />,
}

export default async function B2BOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/b2b/orders')

  const admin = createAdminClient()

  const { data: member } = await admin
    .from('business_members')
    .select('business_id')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .single()

  if (!member) redirect('/office-refill?no_account=1')

  const { data: orders } = await admin
    .from('orders')
    .select('id, created_at, total, status, order_items(id, quantity, unit_price, products(name))')
    .eq('business_account_id', member.business_id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-charcoal">Orders</h1>

      {!orders || orders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <ShoppingCart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-600">No orders yet</p>
          <p className="text-sm text-gray-400 mt-1">Orders placed through your account will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const items = (order.order_items ?? []) as any[]
            return (
              <div key={order.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div>
                    <p className="font-mono text-xs text-gray-400">#{order.id.slice(0, 8)}</p>
                    <p className="text-sm font-medium text-brand-charcoal mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-brand-charcoal">{formatPrice(order.total)}</p>
                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 mt-0.5 capitalize">
                      {STATUS_ICONS[order.status] ?? <Clock className="w-4 h-4 text-gray-400" />}
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <ul className="divide-y divide-gray-50 px-5">
                  {items.slice(0, 4).map((oi: any) => (
                    <li key={oi.id} className="flex items-center justify-between py-2.5 text-sm">
                      <span className="text-gray-700">{oi.products?.name ?? 'Product'}</span>
                      <span className="text-gray-500">
                        {oi.quantity} × {formatPrice(oi.unit_price)}
                      </span>
                    </li>
                  ))}
                  {items.length > 4 && (
                    <li className="py-2.5 text-sm text-gray-400">
                      +{items.length - 4} more items
                    </li>
                  )}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
