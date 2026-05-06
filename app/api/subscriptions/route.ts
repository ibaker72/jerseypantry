import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SubscriptionFrequency, FulfillmentMethod } from '@/types'

function nextOrderDate(frequency: SubscriptionFrequency): Date {
  const d = new Date()
  switch (frequency) {
    case 'weekly':    d.setDate(d.getDate() + 7); break
    case 'biweekly':  d.setDate(d.getDate() + 14); break
    case 'monthly':   d.setMonth(d.getMonth() + 1); break
  }
  return d
}

export async function POST(req: NextRequest) {
  const serverClient = await createClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { product_id, quantity = 1, frequency, fulfillment_method, delivery_address, postal_code } = body

  if (!product_id || !frequency) {
    return NextResponse.json({ error: 'product_id and frequency are required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Verify product is active
  const { data: product } = await supabase
    .from('products')
    .select('id, is_active, inventory_quantity')
    .eq('id', product_id)
    .single()

  if (!product || !product.is_active) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const { data: sub, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: user.id,
      product_id,
      quantity,
      frequency,
      fulfillment_method: fulfillment_method as FulfillmentMethod ?? 'local_delivery',
      delivery_address: delivery_address ?? null,
      postal_code: postal_code ?? null,
      status: 'active',
      next_order_at: nextOrderDate(frequency as SubscriptionFrequency).toISOString(),
    })
    .select('*, product:products(id, name, image_url, retail_price, slug)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ subscription: sub }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const serverClient = await createClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select('*, product:products(id, name, image_url, retail_price, slug)')
    .eq('user_id', user.id)
    .neq('status', 'canceled')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ subscriptions: subs ?? [] })
}
