import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Subscription } from '@/types'

// Run daily via Vercel Cron / external scheduler.
// Creates a pending order for each active subscription due today.
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  // Find all active subscriptions due now (next_order_at <= now)
  const { data: dueSubs, error } = await supabase
    .from('subscriptions')
    .select('*, product:products(id, name, retail_price, sku, image_url, inventory_quantity, shipping_eligible, delivery_eligible, slug)')
    .eq('status', 'active')
    .lte('next_order_at', now)
    .limit(100)

  if (error) {
    console.error('process-subscriptions error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let processed = 0
  const results: Array<{ subscription_id: string; status: 'order_created' | 'skipped'; reason?: string }> = []

  for (const sub of (dueSubs ?? []) as Subscription[]) {
    const product = sub.product
    if (!product) {
      results.push({ subscription_id: sub.id, status: 'skipped', reason: 'Product not found' })
      continue
    }

    // Check inventory
    if (product.inventory_quantity < sub.quantity) {
      results.push({ subscription_id: sub.id, status: 'skipped', reason: 'Insufficient inventory' })
      continue
    }

    // Get user email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', sub.user_id)
      .single()

    if (!profile?.email) {
      results.push({ subscription_id: sub.id, status: 'skipped', reason: 'No user email' })
      continue
    }

    const discountedPrice = parseFloat((product.retail_price * 0.9).toFixed(2))
    const lineTotal = discountedPrice * sub.quantity
    const orderNumber = `CS-SUB-${Date.now().toString(36).toUpperCase()}`

    // Create the order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        email: profile.email,
        user_id: sub.user_id,
        status: 'pending',
        fulfillment_method: sub.fulfillment_method,
        subtotal: lineTotal,
        delivery_fee: 0,
        shipping_fee: 0,
        tax_amount: 0,
        discount_amount: parseFloat((product.retail_price * 0.1 * sub.quantity).toFixed(2)),
        loyalty_redemption_amount: 0,
        store_credit_redeemed: 0,
        total: lineTotal,
        delivery_address: sub.delivery_address ?? null,
        notes: `Auto-refill subscription — ${product.name}`,
      })
      .select('id')
      .single()

    if (orderErr || !order) {
      results.push({ subscription_id: sub.id, status: 'skipped', reason: orderErr?.message })
      continue
    }

    await supabase.from('order_items').insert({
      order_id: order.id,
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      quantity: sub.quantity,
      unit_price: discountedPrice,
      line_total: lineTotal,
    })

    // Reserve inventory
    await supabase.rpc('reserve_inventory', {
      p_items: JSON.stringify([{ product_id: product.id, quantity: sub.quantity }]),
    })

    // Advance next_order_at
    const nextDate = new Date(sub.next_order_at)
    switch (sub.frequency) {
      case 'weekly':   nextDate.setDate(nextDate.getDate() + 7); break
      case 'biweekly': nextDate.setDate(nextDate.getDate() + 14); break
      case 'monthly':  nextDate.setMonth(nextDate.getMonth() + 1); break
    }

    await supabase
      .from('subscriptions')
      .update({
        last_order_at: now,
        last_order_id: order.id,
        next_order_at: nextDate.toISOString(),
      })
      .eq('id', sub.id)

    results.push({ subscription_id: sub.id, status: 'order_created' })
    processed++
  }

  return NextResponse.json({ total: dueSubs?.length ?? 0, processed, results })
}
