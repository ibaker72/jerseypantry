import type { SupabaseClient } from '@supabase/supabase-js'
import type { BusinessAccount } from '@/types'

export type GenerateResult =
  | { status: 'created'; order_id: string; order_number: string }
  | { status: 'skipped'; reason: string }

interface PlanItemRow {
  product_id: string
  quantity: number
  product: {
    id: string
    name: string
    sku: string | null
    retail_price: number
    inventory_quantity: number
  } | null
}

interface CatalogOverride {
  product_id: string
  custom_price: number | null
  is_active: boolean
}

interface ScheduleRow {
  delivery_address: Record<string, string> | null
  frequency: 'weekly' | 'biweekly' | 'monthly'
}

const SKIP_STATUSES = new Set(['past_due', 'canceled', 'suspended', 'pending', 'paused'])

export async function generateB2BOrderForAccount(
  supabase: SupabaseClient,
  account: BusinessAccount,
  options: { runDate?: Date; schedule?: ScheduleRow | null } = {}
): Promise<GenerateResult> {
  const runDate = options.runDate ?? new Date()
  const runDateKey = runDate.toISOString().slice(0, 10)

  if (account.status !== 'active') {
    return { status: 'skipped', reason: `account.status=${account.status}` }
  }
  if (SKIP_STATUSES.has(account.subscription_status)) {
    return { status: 'skipped', reason: `subscription=${account.subscription_status}` }
  }

  // Idempotency guard — INSERT and bail if a run already exists for today.
  const { error: claimErr } = await supabase
    .from('b2b_order_runs')
    .insert({ business_id: account.id, run_date: runDateKey })

  if (claimErr) {
    if ((claimErr as { code?: string }).code === '23505') {
      return { status: 'skipped', reason: 'already_run_today' }
    }
    return { status: 'skipped', reason: `claim_failed: ${claimErr.message}` }
  }

  // Plan basket
  const { data: items, error: itemsErr } = await supabase
    .from('b2b_plan_items')
    .select('product_id, quantity, product:products(id, name, sku, retail_price, inventory_quantity)')
    .eq('plan_name', account.plan_name)
    .order('sort_order', { ascending: true })
    .returns<PlanItemRow[]>()

  if (itemsErr || !items || items.length === 0) {
    await supabase.from('b2b_order_runs').delete()
      .eq('business_id', account.id).eq('run_date', runDateKey)
    return { status: 'skipped', reason: 'empty_basket' }
  }

  // Custom-price overrides from business catalog
  const { data: overrides } = await supabase
    .from('business_catalogs')
    .select('product_id, custom_price, is_active')
    .eq('business_id', account.id)
    .returns<CatalogOverride[]>()

  const overrideMap = new Map<string, CatalogOverride>()
  for (const o of overrides ?? []) overrideMap.set(o.product_id, o)

  // Resolve owner user_id
  const { data: ownerRow } = await supabase
    .from('business_members')
    .select('user_id')
    .eq('business_id', account.id)
    .eq('role', 'owner')
    .not('user_id', 'is', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  // Build line items with effective price
  type Line = { product_id: string; product_name: string; sku: string | null; quantity: number; unit_price: number; line_total: number }
  const lines: Line[] = []
  for (const it of items) {
    if (!it.product) continue
    const override = overrideMap.get(it.product_id)
    if (override && override.is_active === false) continue
    const unit = override?.custom_price ?? it.product.retail_price
    const qty = it.quantity
    lines.push({
      product_id: it.product_id,
      product_name: it.product.name,
      sku: it.product.sku,
      quantity: qty,
      unit_price: unit,
      line_total: parseFloat((unit * qty).toFixed(2)),
    })
  }

  if (lines.length === 0) {
    await supabase.from('b2b_order_runs').delete()
      .eq('business_id', account.id).eq('run_date', runDateKey)
    return { status: 'skipped', reason: 'all_items_disabled' }
  }

  const subtotal = parseFloat(lines.reduce((s, l) => s + l.line_total, 0).toFixed(2))
  const orderNumber = `CS-B2B-${Date.now().toString(36).toUpperCase()}`

  const deliveryAddress =
    options.schedule?.delivery_address ??
    (account.billing_address as Record<string, string> | null) ??
    null

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      email: account.contact_email,
      user_id: ownerRow?.user_id ?? null,
      status: 'paid',
      fulfillment_method: 'local_delivery',
      subtotal,
      delivery_fee: 0,
      shipping_fee: 0,
      tax_amount: 0,
      discount_amount: 0,
      total: subtotal,
      delivery_address: deliveryAddress,
      notes: `B2B Office Refill — ${account.plan_name}`,
      business_account_id: account.id,
    })
    .select('id, order_number')
    .single()

  if (orderErr || !order) {
    await supabase.from('b2b_order_runs').delete()
      .eq('business_id', account.id).eq('run_date', runDateKey)
    return { status: 'skipped', reason: orderErr?.message ?? 'order_insert_failed' }
  }

  await supabase.from('order_items').insert(
    lines.map((l) => ({
      order_id: order.id,
      product_id: l.product_id,
      product_name: l.product_name,
      sku: l.sku,
      quantity: l.quantity,
      unit_price: l.unit_price,
      line_total: l.line_total,
    }))
  )

  await supabase.rpc('reserve_inventory', {
    p_items: JSON.stringify(lines.map((l) => ({ product_id: l.product_id, quantity: l.quantity }))),
  })

  await supabase
    .from('b2b_order_runs')
    .update({ order_id: order.id })
    .eq('business_id', account.id)
    .eq('run_date', runDateKey)

  return { status: 'created', order_id: order.id, order_number: order.order_number }
}
