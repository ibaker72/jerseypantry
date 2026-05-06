import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    await handleCheckoutComplete(session)
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id
  if (!orderId) {
    console.error('No order_id in Stripe session metadata')
    return
  }

  const supabase = createAdminClient()

  // Mark order as paid
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string ?? null,
    })
    .eq('id', orderId)
    .select('*, order_items(*)')
    .single()

  if (orderError || !order) {
    console.error('Failed to update order:', orderError)
    return
  }

  // Decrement inventory and create inventory_movements
  const orderItems = order.order_items ?? []
  for (const item of orderItems) {
    if (!item.product_id) continue

    // Decrement
    const { data: product } = await supabase
      .from('products')
      .select('inventory_quantity')
      .eq('id', item.product_id)
      .single()

    if (product) {
      const newQty = Math.max(0, product.inventory_quantity - item.quantity)
      await supabase
        .from('products')
        .update({ inventory_quantity: newQty })
        .eq('id', item.product_id)

      // Record movement
      await supabase.from('inventory_movements').insert({
        product_id: item.product_id,
        movement_type: 'order_sale',
        quantity_change: -item.quantity,
        note: `Order ${order.order_number}`,
      })
    }
  }

  // TODO: Send order confirmation email via Resend when RESEND_API_KEY is set
  console.log(`Order ${order.order_number} marked paid. Inventory decremented.`)
}
