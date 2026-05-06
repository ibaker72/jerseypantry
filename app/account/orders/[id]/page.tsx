import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Package, Star } from 'lucide-react'
import type { Order } from '@/types'

export const metadata = { title: 'Order Detail — My Corner Store' }

export default async function AccountOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/account/orders')

  const { data } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!data) notFound()

  const order = data as Order

  const subtotalAfterLoyalty = order.subtotal - order.loyalty_redemption_amount
  const total = subtotalAfterLoyalty + order.delivery_fee + order.shipping_fee + order.tax_amount - order.discount_amount

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/account/orders" className="text-sm text-gray-400 hover:text-brand-green flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
      </div>

      {/* Header */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-bold text-lg text-brand-charcoal flex items-center gap-2">
              <Package className="h-5 w-5 text-brand-green" />
              {order.order_number}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {new Date(order.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${
            order.status === 'completed' ? 'bg-green-100 text-green-700' :
            order.status === 'canceled'  ? 'bg-red-100 text-red-600' :
            order.status === 'paid'      ? 'bg-blue-100 text-blue-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>{order.status.replace('_', ' ')}</span>
        </div>

        <dl className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-gray-400">Fulfillment</dt>
            <dd className="font-medium capitalize">{order.fulfillment_method.replace('_', ' ')}</dd>
          </div>
          {order.delivery_address && (
            <div className="sm:col-span-2">
              <dt className="text-gray-400">Delivery to</dt>
              <dd className="font-medium">{(order.delivery_address as { line1: string }).line1}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Items */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-brand-charcoal mb-4">Items</h3>
        <div className="divide-y divide-gray-50">
          {(order.order_items ?? []).map((item) => (
            <div key={item.id} className="flex justify-between py-3 text-sm">
              <div>
                <p className="font-medium text-brand-charcoal">{item.product_name}</p>
                <p className="text-gray-400">Qty {item.quantity} × ${item.unit_price.toFixed(2)}</p>
              </div>
              <p className="font-semibold">${item.line_total.toFixed(2)}</p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span>
          </div>
          {order.delivery_fee > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Delivery fee</span><span>${order.delivery_fee.toFixed(2)}</span>
            </div>
          )}
          {order.shipping_fee > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Shipping</span><span>${order.shipping_fee.toFixed(2)}</span>
            </div>
          )}
          {order.tax_amount > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Tax</span><span>${order.tax_amount.toFixed(2)}</span>
            </div>
          )}
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-brand-orange">
              <span>Coupon discount</span><span>-${order.discount_amount.toFixed(2)}</span>
            </div>
          )}
          {order.loyalty_redemption_amount > 0 && (
            <div className="flex justify-between text-brand-green">
              <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5" /> Points redeemed ({order.loyalty_points_redeemed} pts)</span>
              <span>-${order.loyalty_redemption_amount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
            <span>Total</span><span>${order.total.toFixed(2)}</span>
          </div>
        </div>

        {(order.loyalty_points_earned ?? 0) > 0 && (
          <div className="mt-4 flex items-center gap-2 text-sm text-brand-green bg-green-50 rounded-xl px-4 py-3">
            <Star className="h-4 w-4" />
            You earned <strong>{order.loyalty_points_earned} Corner Points</strong> on this order!
          </div>
        )}
      </div>
    </div>
  )
}
