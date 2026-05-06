import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge'
import { formatPrice } from '@/lib/utils/format'
import type { Order, OrderStatus } from '@/types'

export const metadata = { title: 'Orders — Admin' }

interface AdminOrdersPageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const { status } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data: orders } = await query

  const statuses: OrderStatus[] = ['pending','paid','preparing','out_for_delivery','completed','canceled','refunded']

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-charcoal mb-6">Orders</h1>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link href="/admin/orders" className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${!status ? 'bg-brand-green text-white border-brand-green' : 'bg-white border-gray-200 text-gray-600 hover:border-brand-green'}`}>
          All
        </Link>
        {statuses.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${status === s ? 'bg-brand-green text-white border-brand-green' : 'bg-white border-gray-200 text-gray-600 hover:border-brand-green'}`}>
            {s.replace('_', ' ')}
          </Link>
        ))}
      </div>

      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Order</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Method</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(orders as Order[] ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">No orders found.</td>
                </tr>
              )}
              {(orders as Order[] ?? []).map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium text-brand-green hover:underline">
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500 truncate max-w-[200px]">{order.email}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{order.fulfillment_method.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatPrice(order.total)}</td>
                  <td className="px-4 py-3 text-center">
                    <OrderStatusBadge status={order.status as OrderStatus} />
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
