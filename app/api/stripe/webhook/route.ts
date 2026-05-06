import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendOrderConfirmationEmail } from '@/lib/email/resend'
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

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session)
      break
    case 'checkout.session.expired':
      await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session)
      break
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id
  const inventoryAlreadyReserved = session.metadata?.inventory_reserved === 'true'

  if (!orderId) {
    console.error('No order_id in Stripe session metadata')
    return
  }

  const supabase = createAdminClient()
  const stripe = getStripe()

  // Retrieve session with line items to get actual tax amount from Stripe Tax
  let actualTaxAmount = 0
  try {
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['total_details'],
    })
    // Stripe Tax returns tax_amount_exclusive in cents
    actualTaxAmount = (fullSession.total_details?.amount_tax ?? 0) / 100
  } catch (e) {
    console.warn('Could not retrieve tax details:', e)
  }

  // Mark order paid + store actual tax
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: typeof session.payment_intent === 'string'
        ? session.payment_intent
        : null,
      tax_amount: actualTaxAmount,
      // Update total to include actual tax
      total: supabase
        .from('orders')
        .select('total')  // placeholder — done below
    })
    .eq('id', orderId)
    .select('*, order_items(*)')
    .single()

  if (orderError || !order) {
    console.error('Failed to update order:', orderError)
    return
  }

  // Update total with actual tax
  await supabase
    .from('orders')
    .update({ total: order.subtotal + order.delivery_fee + order.shipping_fee + actualTaxAmount - order.discount_amount })
    .eq('id', orderId)

  const orderItems = order.order_items ?? []

  // If inventory was NOT pre-reserved (fallback for older sessions), decrement now
  if (!inventoryAlreadyReserved) {
    for (const item of orderItems) {
      if (!item.product_id) continue
      const { data: product } = await supabase
        .from('products')
        .select('inventory_quantity')
        .eq('id', item.product_id)
        .single()
      if (product) {
        await supabase
          .from('products')
          .update({ inventory_quantity: Math.max(0, product.inventory_quantity - item.quantity) })
          .eq('id', item.product_id)
      }
    }
  }

  // Record inventory movements
  for (const item of orderItems) {
    if (!item.product_id) continue
    await supabase.from('inventory_movements').insert({
      product_id: item.product_id,
      movement_type: 'order_sale',
      quantity_change: -item.quantity,
      note: `Order ${order.order_number}`,
    })
  }

  // Send order confirmation email
  await sendOrderConfirmationEmail({
    order_id: orderId,
    order_number: order.order_number,
    email: order.email,
    items: orderItems,
    subtotal: order.subtotal,
    delivery_fee: order.delivery_fee,
    shipping_fee: order.shipping_fee,
    tax_amount: actualTaxAmount,
    discount_amount: order.discount_amount,
    total: order.subtotal + order.delivery_fee + order.shipping_fee + actualTaxAmount - order.discount_amount,
    fulfillment_method: order.fulfillment_method,
  })

  console.log(`✅ Order ${order.order_number} paid. Tax: $${actualTaxAmount.toFixed(2)}`)
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id
  if (!orderId) return

  const supabase = createAdminClient()

  // Get order items to restore inventory that was pre-reserved
  const { data: order } = await supabase
    .from('orders')
    .select('status, order_items(*)')
    .eq('id', orderId)
    .single()

  if (!order || order.status !== 'pending') return

  // Restore inventory reserved at checkout
  if (session.metadata?.inventory_reserved === 'true') {
    const itemsToRestore = (order.order_items ?? [])
      .filter((i: { product_id: string | null; quantity: number }) => i.product_id)
      .map((i: { product_id: string; quantity: number }) => ({ product_id: i.product_id, quantity: i.quantity }))

    if (itemsToRestore.length > 0) {
      await supabase.rpc('restore_inventory', { p_items: JSON.stringify(itemsToRestore) })
      console.log(`🔄 Inventory restored for expired order ${orderId}`)
    }
  }

  await supabase.from('orders').update({ status: 'canceled' }).eq('id', orderId)
  console.log(`❌ Order ${orderId} canceled (checkout expired)`)
}
