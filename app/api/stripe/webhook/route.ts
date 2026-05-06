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
    // B2B subscription lifecycle
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpsert(event.data.object as Stripe.Subscription)
      break
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
      break
    case 'invoice.payment_succeeded':
      await handleInvoicePaid(event.data.object as Stripe.Invoice)
      break
    case 'invoice.payment_failed':
      await handleInvoiceFailed(event.data.object as Stripe.Invoice)
      break
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  // Route B2B subscription checkouts separately
  if (session.metadata?.b2b === 'true') {
    await handleB2BCheckoutComplete(session)
    return
  }

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

async function handleB2BCheckoutComplete(session: Stripe.Checkout.Session) {
  const { user_id, plan, billing_type, business_name, contact_name, contact_phone, business_type } = session.metadata ?? {}
  if (!user_id || !plan || !business_name) return

  const supabase = createAdminClient()
  const stripeCustomerId = typeof session.customer === 'string' ? session.customer : null
  const stripeSubscriptionId = typeof session.subscription === 'string' ? session.subscription : null

  // Upsert business account
  const { data: existing } = await supabase
    .from('business_accounts')
    .select('id')
    .eq('contact_email', session.customer_email ?? '')
    .single()

  let businessId: string
  if (existing) {
    await supabase.from('business_accounts').update({
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      subscription_status: stripeSubscriptionId ? 'active' : 'pending',
      plan_name: plan as 'starter' | 'standard' | 'premium',
      billing_type: (billing_type ?? 'card') as 'card' | 'net30',
    }).eq('id', existing.id)
    businessId = existing.id
  } else {
    const { data: newBA } = await supabase.from('business_accounts').insert({
      business_name,
      contact_name: contact_name || null,
      contact_email: session.customer_email ?? '',
      contact_phone: contact_phone || null,
      business_type: business_type || null,
      plan_name: plan as 'starter' | 'standard' | 'premium',
      billing_type: (billing_type ?? 'card') as 'card' | 'net30',
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      subscription_status: stripeSubscriptionId ? 'active' : 'pending',
    }).select('id').single()
    businessId = newBA!.id
  }

  // Add user as owner if not already a member
  await supabase.from('business_members').upsert({
    business_id: businessId,
    user_id,
    email: session.customer_email ?? '',
    role: 'owner',
    accepted_at: new Date().toISOString(),
  }, { onConflict: 'business_id,user_id', ignoreDuplicates: true })

  console.log(`🏢 B2B account provisioned: ${business_name} (${plan})`)
}

async function handleSubscriptionUpsert(subscription: Stripe.Subscription) {
  const supabase = createAdminClient()
  const stripeCustomerId = typeof subscription.customer === 'string' ? subscription.customer : null
  if (!stripeCustomerId) return

  const statusMap: Record<string, string> = {
    active: 'active', trialing: 'trialing', past_due: 'past_due',
    canceled: 'canceled', unpaid: 'past_due', paused: 'paused',
  }

  await supabase.from('business_accounts').update({
    stripe_subscription_id: subscription.id,
    subscription_status: statusMap[subscription.status] ?? 'pending',
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  }).eq('stripe_customer_id', stripeCustomerId)

  console.log(`🔄 B2B subscription updated: ${subscription.id} → ${subscription.status}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = createAdminClient()
  const stripeCustomerId = typeof subscription.customer === 'string' ? subscription.customer : null
  if (!stripeCustomerId) return

  await supabase.from('business_accounts').update({
    subscription_status: 'canceled',
    stripe_subscription_id: null,
  }).eq('stripe_customer_id', stripeCustomerId)

  console.log(`❌ B2B subscription canceled: ${subscription.id}`)
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const supabase = createAdminClient()
  const stripeCustomerId = typeof invoice.customer === 'string' ? invoice.customer : null
  if (!stripeCustomerId) return

  const { data: ba } = await supabase
    .from('business_accounts')
    .select('id')
    .eq('stripe_customer_id', stripeCustomerId)
    .single()

  if (!ba) return

  await supabase.from('business_invoices').upsert({
    business_id: ba.id,
    stripe_invoice_id: invoice.id,
    amount_due: (invoice.amount_due ?? 0) / 100,
    amount_paid: (invoice.amount_paid ?? 0) / 100,
    status: 'paid',
    paid_at: new Date().toISOString(),
    invoice_pdf_url: invoice.invoice_pdf,
  }, { onConflict: 'stripe_invoice_id' })

  console.log(`💰 B2B invoice paid: ${invoice.id}`)
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const supabase = createAdminClient()
  const stripeCustomerId = typeof invoice.customer === 'string' ? invoice.customer : null
  if (!stripeCustomerId) return

  const { data: ba } = await supabase
    .from('business_accounts')
    .select('id')
    .eq('stripe_customer_id', stripeCustomerId)
    .single()

  if (!ba) return

  await supabase.from('business_accounts').update({ subscription_status: 'past_due' })
    .eq('stripe_customer_id', stripeCustomerId)

  await supabase.from('business_invoices').upsert({
    business_id: ba.id,
    stripe_invoice_id: invoice.id,
    amount_due: (invoice.amount_due ?? 0) / 100,
    amount_paid: 0,
    status: 'open',
    due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
    invoice_pdf_url: invoice.invoice_pdf,
  }, { onConflict: 'stripe_invoice_id' })

  console.log(`⚠️  B2B invoice payment failed: ${invoice.id}`)
}
