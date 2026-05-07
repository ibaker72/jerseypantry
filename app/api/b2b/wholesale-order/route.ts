import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { reserveWholesaleStock } from '@/lib/wholesale/inventory'
import { dispatchOrder } from '@/lib/actions/dispatch'
import type { WholesaleOrderItem } from '@/types/wholesale'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Verify business membership
  const { data: member } = await admin
    .from('business_members')
    .select('business_id, business_accounts(contact_email, business_name)')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .maybeSingle()

  if (!member) return NextResponse.json({ error: 'No business account' }, { status: 403 })

  const body = await req.json() as { items: WholesaleOrderItem[] }
  const { items } = body

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'No items provided' }, { status: 400 })
  }

  const subtotal = items.reduce((sum, i) => sum + i.line_total, 0)
  const total_weight_lbs = items.reduce((sum, i) => sum + i.weight_lbs, 0)

  // Reserve stock for all items atomically
  const reservationResults = await Promise.all(
    items.map((item) =>
      reserveWholesaleStock(item.product_id, item.quantity)
        .then((r) => ({ ...r, product_id: item.product_id, product_name: item.product_name }))
    )
  )

  const failed = reservationResults.filter((r) => !r.success)
  if (failed.length > 0) {
    return NextResponse.json({
      error: 'Some items are out of stock',
      failures: failed.map((f) => ({ product_id: f.product_id, product_name: f.product_name, reason: f.error })),
    }, { status: 409 })
  }

  // Create order record
  const orderNumber = `WS-${Date.now().toString(36).toUpperCase()}`
  const ba = member.business_accounts as { contact_email: string; business_name: string } | null

  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({
      order_number: orderNumber,
      email: ba?.contact_email ?? user.email ?? '',
      subtotal,
      delivery_fee: 0,
      shipping_fee: 0,
      discount_amount: 0,
      total: subtotal,
      status: 'paid',
      fulfillment_method: 'local_delivery',
      business_account_id: member.business_id,
    })
    .select()
    .single()

  if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 500 })

  // Insert order items
  await admin.from('order_items').insert(
    items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.line_total,
    }))
  )

  // Update reservation records with order_id
  await admin
    .from('inventory_reservations')
    .update({ order_id: order.id })
    .in('product_id', items.map((i) => i.product_id))
    .eq('status', 'active')
    .is('order_id', null)

  // Auto-create dispatch record
  await dispatchOrder(order.id, total_weight_lbs, null)

  return NextResponse.json({ success: true, order_id: order.id, order_number: orderNumber })
}
