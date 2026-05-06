import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge'
import { OrderStatusUpdater } from './OrderStatusUpdater'
import { formatPrice } from '@/lib/utils/format'
import type { Order, OrderItem, OrderStatus } from '@/types'

export const metadata = { title: 'Order Detail — Admin' }

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .single()

  if (!order) notFound()

  const o = order as Order & { order_items: OrderItem[] }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-charcoal">{o.order_number}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{new Date(o.created_at).toLocaleString()}</p>
        </div>
        <OrderStatusBadge status={o.status as OrderStatus} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        {/* Customer info */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-2">
          <h2 className="font-semibold text-brand-charcoal mb-3">Customer</h2>
          <p className="text-sm text-gray-700">{o.email}</p>
          {o.phone && <p className="text-sm text-gray-700">{o.phone}</p>}
          <p className="text-sm text-gray-500 capitalize">
            Method: {o.fulfillment_method.replace('_', ' ')}
          </p>
        </div>

        {/* Delivery address */}
        {o.delivery_address && (
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-1">
            <h2 className="font-semibold text-brand-charcoal mb-3">Delivery Address</h2>
            <p className="text-sm text-gray-700">{o.delivery_address.line1}</p>
            {o.delivery_address.line2 && <p className="text-sm text-gray-700">{o.delivery_address.line2}</p>}
            <p className="text-sm text-gray-700">
              {o.delivery_address.city}, {o.delivery_address.state} {o.delivery_address.postal_code}
            </p>
            {o.delivery_address.delivery_instructions && (
              <p className="text-sm text-gray-500 italic">{o.delivery_address.delivery_instructions}</p>
            )}
          </div>
        )}
      </div>

      {/* Order items */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden mb-6">
        <h2 className="font-semibold text-brand-charcoal p-5 border-b">Items</h2>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-50">
            {o.order_items.map((item) => (
              <tr key={item.id}>
                <td className="px-5 py-3">
                  <p className="font-medium text-brand-charcoal">{item.product_name}</p>
                  {item.sku && <p className="text-xs text-gray-400">SKU: {item.sku}</p>}
                </td>
                <td className="px-5 py-3 text-center text-gray-500">×{item.quantity}</td>
                <td className="px-5 py-3 text-right">
                  <p className="text-gray-500 text-xs">{formatPrice(item.unit_price)} each</p>
                  <p className="font-semibold">{formatPrice(item.line_total)}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-4 border-t bg-gray-50 space-y-1 text-sm">
          <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatPrice(o.subtotal)}</span></div>
          {o.delivery_fee > 0 && <div className="flex justify-between text-gray-500"><span>Delivery</span><span>{formatPrice(o.delivery_fee)}</span></div>}
          {o.shipping_fee > 0 && <div className="flex justify-between text-gray-500"><span>Shipping</span><span>{formatPrice(o.shipping_fee)}</span></div>}
          {o.discount_amount > 0 && <div className="flex justify-between text-green-700"><span>Discount</span><span>−{formatPrice(o.discount_amount)}</span></div>}
          <div className="flex justify-between font-bold text-brand-charcoal text-base pt-1 border-t"><span>Total</span><span>{formatPrice(o.total)}</span></div>
        </div>
      </div>

      <OrderStatusUpdater orderId={o.id} currentStatus={o.status as OrderStatus} />
    </div>
  )
}
