import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendOrderConfirmationEmail } from '@/lib/email/resend'
import { LOYALTY_POINTS_PER_DOLLAR } from '@/lib/pricing/calculate'
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
  const userId = session.metadata?.user_id || null
  const loyaltyPointsRedeemed = parseInt(session.metadata?.loyalty_points_redeemed ?? '0', 10)

  if (!orderId) {
    console.error('No order_id in Stripe session metadata')
    return
  }

  const supabase = createAdminClient()
  const stripe = getStripe()

  // Retrieve session with tax details from Stripe Tax
  let actualTaxAmount = 0
  try {
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, { expand: ['total_details'] })
    actualTaxAmount = (fullSession.total_details?.amount_tax ?? 0) / 100
  } catch (e) {
    console.warn('Could not retrieve tax details:', e)
  }

  // Mark order paid
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
      tax_amount: actualTaxAmount,
    })
    .eq('id', orderId)
    .select('*, order_items(*)')
    .single()

  if (orderError || !order) {
    console.error('Failed to update order:', orderError)
    return
  }

  // Update final total with actual tax
  const finalTotal = Math.max(
    0,
    order.subtotal + order.delivery_fee + order.shipping_fee + actualTaxAmount
      - order.discount_amount - (order.loyalty_redemption_amount ?? 0)
  )
  await supabase.from('orders').update({ total: finalTotal }).eq('id', orderId)

  const orderItems = order.order_items ?? []

  // Decrement inventory if not pre-reserved (old sessions)
  if (!inventoryAlreadyReserved) {
    for (const item of orderItems) {
      if (!item.product_id) continue
      const { data: product } = await supabase
        .from('products').select('inventory_quantity').eq('id', item.product_id).single()
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

  // Award loyalty points: 1 pt per $1 of subtotal after coupon discount
  const earnableSubtotal = Math.max(0, order.subtotal - order.discount_amount)
  const pointsEarned = Math.floor(earnableSubtotal * LOYALTY_POINTS_PER_DOLLAR)
  if (pointsEarned > 0 && userId) {
    await supabase.rpc('award_loyalty_points', { p_user_id: userId, p_points: pointsEarned })
    await supabase.from('orders').update({ loyalty_points_earned: pointsEarned }).eq('id', orderId)
    console.log(`⭐ Awarded ${pointsEarned} pts to user ${userId}`)
  }

  // Increment promotion usage counts
  if (Array.isArray(order.promotion_ids) && order.promotion_ids.length > 0) {
    for (const promoId of order.promotion_ids) {
      await supabase.rpc('increment_promotion_usage', { p_promotion_id: promoId })
    }
  }

  // Credit referral on user's first completed order
  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('referred_by')
      .eq('id', userId)
      .single()

    if (profile?.referred_by) {
      // Check if this is their first paid order
      const { count } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'paid')

      if (count === 1) {
        // Find the pending referral
        const { data: referral } = await supabase
          .from('referrals')
          .select('id, referrer_id, referrer_credit, referred_credit')
          .eq('referred_user_id', userId)
          .eq('status', 'pending')
          .single()

        if (referral) {
          await Promise.all([
            supabase.rpc('add_store_credit', { p_user_id: referral.referrer_id, p_amount: referral.referrer_credit }),
            supabase.rpc('add_store_credit', { p_user_id: userId, p_amount: referral.referred_credit }),
            supabase.from('referrals').update({ status: 'credited', credited_at: new Date().toISOString() }).eq('id', referral.id),
          ])
          console.log(`🎁 Referral credited: referrer ${referral.referrer_id} +$${referral.referrer_credit}, referred ${userId} +$${referral.referred_credit}`)
        }
      }
    }
  }

  // Clear saved cart so abandoned-cart email won't fire for paid orders
  if (order.email) {
    await supabase.from('saved_carts').delete().eq('email', order.email)
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
    total: finalTotal,
    fulfillment_method: order.fulfillment_method,
  })

  console.log(`✅ Order ${order.order_number} paid. Tax: $${actualTaxAmount.toFixed(2)}. Loyalty redeemed: ${loyaltyPointsRedeemed} pts.`)
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id
  const userId = session.metadata?.user_id || null
  const loyaltyPointsRedeemed = parseInt(session.metadata?.loyalty_points_redeemed ?? '0', 10)
  if (!orderId) return

  const supabase = createAdminClient()

  const { data: order } = await supabase
    .from('orders')
    .select('status, email, order_items(*)')
    .eq('id', orderId)
    .single()

  if (!order || order.status !== 'pending') return

  // Restore pre-reserved inventory
  if (session.metadata?.inventory_reserved === 'true') {
    const itemsToRestore = (order.order_items ?? [])
      .filter((i: { product_id: string | null; quantity: number }) => i.product_id)
      .map((i: { product_id: string; quantity: number }) => ({ product_id: i.product_id, quantity: i.quantity }))
    if (itemsToRestore.length > 0) {
      await supabase.rpc('restore_inventory', { p_items: JSON.stringify(itemsToRestore) })
      console.log(`🔄 Inventory restored for expired order ${orderId}`)
    }
  }

  // Restore redeemed loyalty points
  if (loyaltyPointsRedeemed > 0 && userId) {
    await supabase.rpc('restore_loyalty_points', { p_user_id: userId, p_points: loyaltyPointsRedeemed })
    console.log(`⭐ Restored ${loyaltyPointsRedeemed} loyalty pts to user ${userId}`)
  }

  await supabase.from('orders').update({ status: 'canceled' }).eq('id', orderId)
  console.log(`❌ Order ${orderId} canceled (checkout expired)`)
}
