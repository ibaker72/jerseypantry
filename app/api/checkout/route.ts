import { NextRequest, NextResponse } from 'next/server'
import { checkoutSchema } from '@/lib/validators/cart'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/client'
import { calculatePricing, applyPromotions, LOYALTY_POINTS_PER_DOLLAR } from '@/lib/pricing/calculate'
import { checkDeliveryEligibility, validateFulfillmentItems } from '@/lib/delivery/zones'
import type { CartItem, DeliveryZone, Product, Coupon, Promotion } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = checkoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const { items, fulfillment_method, email, postal_code, coupon_code, delivery_address, loyalty_points_to_redeem } = parsed.data
    const supabase = createAdminClient()

    // Detect logged-in user (best-effort — checkout works for guests too)
    const serverClient = await createClient()
    const { data: { user } } = await serverClient.auth.getUser()

    // Detect wholesale checkout. Cart is enforced homogeneous by the toggle
    // modal, so any item with is_wholesale flips the whole order.
    const isWholesaleCheckout = items.some((i) => i.is_wholesale === true)

    if (isWholesaleCheckout) {
      if (!user) {
        return NextResponse.json({ error: 'Sign in to place a wholesale order' }, { status: 401 })
      }
      const { data: approved } = await supabase.rpc('is_wholesale_approved', { uid: user.id })
      if (!approved) {
        return NextResponse.json({ error: 'Your account is not approved for wholesale pricing' }, { status: 403 })
      }
    }

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

    // For wholesale orders, fetch the gated price + case size for each item.
    type WholesaleRow = { product_id: string; wholesale_price: number | null; unit_count: number | null }
    let wholesaleByProductId: Record<string, WholesaleRow> = {}
    if (isWholesaleCheckout) {
      const { data: wholesaleRows, error: wholesaleError } = await supabase
        .from('wholesale_inventory')
        .select('product_id, wholesale_price, unit_count')
        .in('product_id', productIds)

      if (wholesaleError || !wholesaleRows) {
        return NextResponse.json({ error: 'Failed to load wholesale pricing' }, { status: 500 })
      }
      wholesaleByProductId = Object.fromEntries(
        (wholesaleRows as WholesaleRow[]).map((r) => [r.product_id, r])
      )
    }

    const cartItems: CartItem[] = []
    for (const orderItem of items) {
      const product = products.find((p) => p.id === orderItem.product_id) as Product | undefined
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${orderItem.product_id}` }, { status: 400 })
      }

      let unitPrice = product.retail_price
      let caseSize: number | undefined
      if (isWholesaleCheckout) {
        const w = wholesaleByProductId[product.id]
        if (!w || !w.wholesale_price || w.wholesale_price <= 0) {
          return NextResponse.json({ error: `No wholesale price configured for ${product.name}` }, { status: 400 })
        }
        unitPrice = Number(w.wholesale_price)
        caseSize = w.unit_count ?? 12
      }

      cartItems.push({
        id: product.id,
        product_id: product.id,
        name: product.name,
        slug: product.slug,
        image_url: product.image_url ?? null,
        retail_price: unitPrice,
        quantity: orderItem.quantity,
        inventory_quantity: product.inventory_quantity,
        shipping_eligible: product.shipping_eligible,
        delivery_eligible: product.delivery_eligible,
        sku: product.sku ?? null,
        is_wholesale: isWholesaleCheckout || undefined,
        case_size: caseSize,
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
      const { data: zones } = await supabase.from('delivery_zones').select('*').eq('is_active', true)
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

    // Load active promotions (auto-apply)
    const { data: activePromos } = await supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .or('starts_at.is.null,starts_at.lte.' + new Date().toISOString())
      .or('ends_at.is.null,ends_at.gte.' + new Date().toISOString())
    const promotions = (activePromos ?? []) as Promotion[]

    // Loyalty redemption validation
    let validatedLoyaltyPoints = 0
    if (loyalty_points_to_redeem > 0 && user) {
      const { data: profile } = await supabase.from('profiles').select('loyalty_points').eq('id', user.id).single()
      const balance = profile?.loyalty_points ?? 0
      if (loyalty_points_to_redeem > balance) {
        return NextResponse.json({ error: 'Insufficient loyalty points' }, { status: 400 })
      }
      validatedLoyaltyPoints = loyalty_points_to_redeem
    }

    const pricing = calculatePricing(
      cartItems,
      fulfillment_method,
      zoneDeliveryFee,
      zoneFreeMinimum,
      couponType,
      couponValue,
      validatedLoyaltyPoints,
      promotions
    )

    // Track which promos were applied (for DB + increment usage)
    const { appliedIds: appliedPromoIds } = applyPromotions(
      cartItems,
      pricing.subtotal,
      fulfillment_method === 'shipping' ? 8.99 : 0,
      promotions
    )

    // Upsert customer record for logged-in users
    let customerId: string | null = null
    if (user) {
      const { data: existing } = await supabase.from('customers').select('id').eq('user_id', user.id).single()
      if (existing) {
        customerId = existing.id
      } else {
        const { data: newCust } = await supabase
          .from('customers')
          .insert({ user_id: user.id, email })
          .select('id')
          .single()
        customerId = newCust?.id ?? null
      }
    }

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
        loyalty_redemption_amount: pricing.loyalty_redemption_amount,
        loyalty_points_redeemed: validatedLoyaltyPoints,
        total: pricing.total,
        delivery_address: delivery_address ?? null,
        notes: coupon_code ? `Coupon: ${coupon_code}` : null,
        customer_id: customerId,
        user_id: user?.id ?? null,
        promotion_ids: appliedPromoIds,
      })
      .select('id')
      .single()

    if (orderError || !order) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Insert order items. For wholesale orders, the order_items table records
    // the per-CASE total (unit_price * case_size * quantity) and quantity is
    // the number of cases, matching how Stripe will charge.
    await supabase.from('order_items').insert(
      cartItems.map((item) => {
        const unitsPerLine = item.is_wholesale ? (item.case_size ?? 1) : 1
        const linePrice = item.retail_price * unitsPerLine
        return {
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.is_wholesale
            ? `${item.name} — Case of ${item.case_size}`
            : item.name,
          sku: item.sku,
          quantity: item.quantity,
          unit_price: linePrice,
          line_total: linePrice * item.quantity,
        }
      })
    )

    // Atomic inventory reservation
    const reservationInput = cartItems.map((i) => ({ product_id: i.product_id, quantity: i.quantity }))
    const { data: reservationResult, error: reservationError } = await supabase
      .rpc('reserve_inventory', { p_items: JSON.stringify(reservationInput) })

    if (reservationError) {
      await supabase.from('orders').update({ status: 'canceled' }).eq('id', order.id)
      console.error('Inventory reservation error:', reservationError)
      return NextResponse.json({ error: 'Could not reserve inventory. Please try again.' }, { status: 409 })
    }

    const failedReservations = (reservationResult as Array<{ reserved: boolean; product_id: string }> ?? [])
      .filter((r) => !r.reserved)

    if (failedReservations.length > 0) {
      const toRestore = (reservationResult as Array<{ reserved: boolean; product_id: string; requested: number }> ?? [])
        .filter((r) => r.reserved)
        .map((r) => ({ product_id: r.product_id, quantity: r.requested }))
      if (toRestore.length > 0) {
        await supabase.rpc('restore_inventory', { p_items: JSON.stringify(toRestore) })
      }
      await supabase.from('orders').update({ status: 'canceled' }).eq('id', order.id)
      const outOfStockNames = failedReservations
        .map((r) => cartItems.find((i) => i.product_id === r.product_id)?.name ?? r.product_id)
        .join(', ')
      return NextResponse.json({
        error: `Sorry, some items are no longer available: ${outOfStockNames}`,
        out_of_stock: failedReservations.map((r) => r.product_id),
      }, { status: 409 })
    }

    // Deduct loyalty points atomically
    if (validatedLoyaltyPoints > 0 && user) {
      const { data: redeemed } = await supabase.rpc('redeem_loyalty_points', {
        p_user_id: user.id,
        p_points: validatedLoyaltyPoints,
      })
      if (!redeemed) {
        await supabase.rpc('restore_inventory', { p_items: JSON.stringify(reservationInput) })
        await supabase.from('orders').update({ status: 'canceled' }).eq('id', order.id)
        return NextResponse.json({ error: 'Loyalty points balance changed. Please try again.' }, { status: 409 })
      }
    }

    // Save cart for abandoned cart recovery (upsert by email)
    if (email) {
      await supabase.from('saved_carts').upsert(
        { user_id: user?.id ?? null, email, items: cartItems, fulfillment_method, updated_at: new Date().toISOString() },
        { onConflict: 'email' }
      )
    }

    // Build Stripe Checkout session. For wholesale: unit_amount is the
    // per-case price (unit_price × case_size); Stripe quantity is the number
    // of cases.
    const stripe = getStripe()
    const lineItems = cartItems.map((item) => {
      const unitsPerLine = item.is_wholesale ? (item.case_size ?? 1) : 1
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.is_wholesale ? `${item.name} — Case of ${item.case_size}` : item.name,
            ...(item.image_url ? { images: [item.image_url] } : {}),
          },
          unit_amount: Math.round(item.retail_price * unitsPerLine * 100),
          tax_behavior: 'exclusive' as const,
        },
        quantity: item.quantity,
      }
    })

    if (pricing.delivery_fee > 0) {
      lineItems.push({ price_data: { currency: 'usd', product_data: { name: 'Local Delivery Fee' }, unit_amount: Math.round(pricing.delivery_fee * 100), tax_behavior: 'exclusive' as const }, quantity: 1 })
    }
    if (pricing.shipping_fee > 0) {
      lineItems.push({ price_data: { currency: 'usd', product_data: { name: 'Standard Shipping' }, unit_amount: Math.round(pricing.shipping_fee * 100), tax_behavior: 'exclusive' as const }, quantity: 1 })
    }
    if (pricing.loyalty_redemption_amount > 0) {
      // Show loyalty as a negative line item so Stripe total reflects actual charge
      lineItems.push({ price_data: { currency: 'usd', product_data: { name: `Corner Points (${validatedLoyaltyPoints} pts)` }, unit_amount: -Math.round(pricing.loyalty_redemption_amount * 100), tax_behavior: 'exclusive' as const }, quantity: 1 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    const taxEnabled = process.env.STRIPE_TAX_ENABLED === 'true'

    let wholesaleBusinessId: string | null = null
    if (isWholesaleCheckout && user) {
      const { data: member } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', user.id)
        .not('accepted_at', 'is', null)
        .single()
      wholesaleBusinessId = member?.business_id ?? null
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: lineItems,
      metadata: {
        order_id: order.id,
        order_number: orderNumber,
        inventory_reserved: 'true',
        user_id: user?.id ?? '',
        loyalty_points_redeemed: String(validatedLoyaltyPoints),
        order_type: isWholesaleCheckout ? 'wholesale_b2b' : 'retail',
        ...(wholesaleBusinessId ? { business_id: wholesaleBusinessId } : {}),
      },
      success_url: `${siteUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cart?canceled=true`,
      billing_address_collection: taxEnabled ? 'required' : 'auto',
      ...(taxEnabled ? { automatic_tax: { enabled: true } } : {}),
      ...(pricing.discount_amount > 0 && coupon_code && couponType
        ? { discounts: [{ coupon: await getOrCreateStripeCoupon(stripe, coupon_code, couponType, couponValue) }] }
        : {}),
    })

    await supabase.from('orders').update({ stripe_checkout_session_id: session.id }).eq('id', order.id)

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
): Promise<string> {
  try {
    const existing = await stripe.coupons.retrieve(code)
    return existing.id
  } catch {
    const coupon = await stripe.coupons.create({
      id: code,
      ...(type === 'percent' ? { percent_off: value } : { amount_off: Math.round(value * 100), currency: 'usd' }),
      duration: 'once',
    })
    return coupon.id
  }
}

