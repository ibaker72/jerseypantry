import { NextRequest, NextResponse } from 'next/server'
import { checkoutSchema } from '@/lib/validators/cart'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe/client'
import { calculatePricing } from '@/lib/pricing/calculate'
import { checkDeliveryEligibility, validateFulfillmentItems } from '@/lib/delivery/zones'
import type { CartItem, DeliveryZone, Product, Coupon } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = checkoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const { items, fulfillment_method, email, postal_code, coupon_code, delivery_address } = parsed.data
    const supabase = createAdminClient()

    // Validate products server-side — never trust client prices
    const productIds = items.map((i) => i.product_id)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, slug, retail_price, inventory_quantity, shipping_eligible, delivery_eligible, sku, image_url')
      .in('id', productIds)
      .eq('is_active', true)

    if (productsError || !products) {
      return NextResponse.json({ error: 'Failed to validate products' }, { status: 500 })
    }

    // Build cart items from server-side data
    const cartItems: CartItem[] = []
    for (const orderItem of items) {
      const product = products.find((p) => p.id === orderItem.product_id) as Product | undefined
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${orderItem.product_id}` }, { status: 400 })
      }
      if (product.inventory_quantity < orderItem.quantity) {
        return NextResponse.json({ error: `Insufficient inventory for: ${product.name}` }, { status: 400 })
      }
      cartItems.push({
        id: product.id,
        product_id: product.id,
        name: product.name,
        slug: product.slug,
        image_url: product.image_url ?? null,
        retail_price: product.retail_price,
        quantity: orderItem.quantity,
        inventory_quantity: product.inventory_quantity,
        shipping_eligible: product.shipping_eligible,
        delivery_eligible: product.delivery_eligible,
        sku: product.sku ?? null,
      })
    }

    // Validate fulfillment eligibility
    const { valid: fulfillmentValid, invalidItems } = validateFulfillmentItems(cartItems, fulfillment_method)
    if (!fulfillmentValid) {
      return NextResponse.json({
        error: `These items are not eligible for ${fulfillment_method.replace('_', ' ')}: ${invalidItems.join(', ')}`,
      }, { status: 400 })
    }

    // Delivery zone check
    let zoneDeliveryFee: number | undefined
    let zoneFreeMinimum: number | undefined

    if (fulfillment_method === 'local_delivery') {
      if (!postal_code) {
        return NextResponse.json({ error: 'ZIP code required for local delivery' }, { status: 400 })
      }
      const { data: zones } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('is_active', true)

      const zoneCheck = checkDeliveryEligibility(postal_code, (zones ?? []) as DeliveryZone[])
      if (!zoneCheck.available) {
        return NextResponse.json({ error: zoneCheck.reason }, { status: 400 })
      }
      zoneDeliveryFee = zoneCheck.zone!.delivery_fee
      zoneFreeMinimum = zoneCheck.zone!.free_delivery_minimum
    }

    // Coupon validation
    let couponType: 'percent' | 'fixed' | null = null
    let couponValue = 0
    if (coupon_code) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', coupon_code.toUpperCase())
        .eq('is_active', true)
        .single()

      if (coupon) {
        const c = coupon as Coupon
        if (!c.expires_at || new Date(c.expires_at) > new Date()) {
          couponType = c.type
          couponValue = c.value
        }
      }
    }

    // Server-side pricing
    const pricing = calculatePricing(
      cartItems,
      fulfillment_method,
      zoneDeliveryFee,
      zoneFreeMinimum,
      couponType,
      couponValue
    )

    // Generate order number
    const orderNumber = `CS-${Date.now().toString(36).toUpperCase()}`

    // Create pending order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        email,
        status: 'pending',
        fulfillment_method,
        subtotal: pricing.subtotal,
        delivery_fee: pricing.delivery_fee,
        shipping_fee: pricing.shipping_fee,
        tax_amount: pricing.tax_amount,
        discount_amount: pricing.discount_amount,
        total: pricing.total,
        delivery_address: delivery_address ?? null,
        notes: coupon_code ? `Coupon: ${coupon_code}` : null,
      })
      .select('id')
      .single()

    if (orderError || !order) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Insert order items
    const orderItems = cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      unit_price: item.retail_price,
      line_total: item.retail_price * item.quantity,
    }))

    await supabase.from('order_items').insert(orderItems)

    // Build Stripe line items
    const stripe = getStripe()
    const lineItems = cartItems.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          ...(item.image_url ? { images: [item.image_url] } : {}),
        },
        unit_amount: Math.round(item.retail_price * 100),
      },
      quantity: item.quantity,
    }))

    // Add delivery/shipping as line item if applicable
    if (pricing.delivery_fee > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Local Delivery Fee' },
          unit_amount: Math.round(pricing.delivery_fee * 100),
        },
        quantity: 1,
      })
    }
    if (pricing.shipping_fee > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Standard Shipping' },
          unit_amount: Math.round(pricing.shipping_fee * 100),
        },
        quantity: 1,
      })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: lineItems,
      metadata: { order_id: order.id, order_number: orderNumber },
      success_url: `${siteUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cart?canceled=true`,
      ...(pricing.discount_amount > 0 && coupon_code
        ? {
            discounts: [{
              coupon: await getOrCreateStripeCoupon(stripe, coupon_code, couponType!, couponValue, pricing.subtotal),
            }],
          }
        : {}),
    })

    // Save Stripe session ID to order
    await supabase
      .from('orders')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', order.id)

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getOrCreateStripeCoupon(
  stripe: ReturnType<typeof getStripe>,
  code: string,
  type: 'percent' | 'fixed',
  value: number,
  _subtotal: number
): Promise<string> {
  try {
    const existing = await stripe.coupons.retrieve(code)
    return existing.id
  } catch {
    const coupon = await stripe.coupons.create({
      id: code,
      ...(type === 'percent'
        ? { percent_off: value }
        : { amount_off: Math.round(value * 100), currency: 'usd' }),
      duration: 'once',
    })
    return coupon.id
  }
}
