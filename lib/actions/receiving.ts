'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils/format'

// ── Sessions ────────────────────────────────────────────────────

export async function startReceivingSession(form: FormData): Promise<void> {
  const supabase = await createClient()
  const supplierId = (form.get('supplier_id') as string) || null
  const notes = ((form.get('notes') as string) || '').trim() || null

  const { data, error } = await supabase
    .from('receiving_sessions')
    .insert({
      supplier_id: supplierId,
      notes,
      status: 'open',
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to start session')
  }

  revalidatePath('/admin/receiving')
  redirect(`/admin/receiving/${data.id}`)
}

export async function finalizeReceivingSession(sessionId: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('finalize_receiving_session', {
    p_session_id: sessionId,
  })
  if (error) return { ok: false as const, error: error.message }

  revalidatePath('/admin/receiving')
  revalidatePath(`/admin/receiving/${sessionId}`)
  revalidatePath('/admin/inventory/lots')
  revalidatePath('/admin/products')
  return { ok: true as const }
}

export async function cancelReceivingSession(sessionId: string) {
  const supabase = await createClient()
  // Cancel only if no lots received yet — otherwise force finalize.
  const { count } = await supabase
    .from('inventory_lots')
    .select('*', { count: 'exact', head: true })
    .eq('receiving_session_id', sessionId)

  if ((count ?? 0) > 0) {
    return { ok: false as const, error: 'Session has items — finalize instead.' }
  }

  const { error } = await supabase
    .from('receiving_sessions')
    .update({ status: 'canceled', finalized_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('status', 'open')

  if (error) return { ok: false as const, error: error.message }

  revalidatePath('/admin/receiving')
  return { ok: true as const }
}

// ── Add an item (existing product) ──────────────────────────────

export interface AddItemInput {
  session_id: string
  product_id: string
  quantity: number
  unit_cost: number
  expiration_date: string | null
  lot_number: string | null
  notes: string | null
}

export async function addItemToSession(input: AddItemInput) {
  if (!input.session_id) return { ok: false as const, error: 'Missing session' }
  if (!input.product_id) return { ok: false as const, error: 'Missing product' }
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    return { ok: false as const, error: 'Quantity must be > 0' }
  }
  if (!Number.isFinite(input.unit_cost) || input.unit_cost < 0) {
    return { ok: false as const, error: 'Unit cost must be ≥ 0' }
  }

  const supabase = await createClient()

  // Confirm session is still open.
  const { data: session } = await supabase
    .from('receiving_sessions')
    .select('status, supplier_id')
    .eq('id', input.session_id)
    .single()
  if (!session || session.status !== 'open') {
    return { ok: false as const, error: 'Session is not open' }
  }

  const { data, error } = await supabase.rpc('receive_lot', {
    p_product_id: input.product_id,
    p_supplier_id: session.supplier_id,
    p_quantity: input.quantity,
    p_unit_cost: input.unit_cost,
    p_lot_number: input.lot_number ?? '',
    p_expiration_date: input.expiration_date,
    p_notes: input.notes ?? '',
    p_receiving_session_id: input.session_id,
  })

  if (error) return { ok: false as const, error: error.message }

  revalidatePath(`/admin/receiving/${input.session_id}`)
  return { ok: true as const, lot_id: data as string }
}

// ── Create a new product (from a scan) and receive it ───────────

export interface CreateProductAndReceiveInput {
  session_id: string
  barcode: string | null
  name: string
  brand: string | null
  size: string | null
  image_url: string | null
  description: string | null
  category_id: string | null
  wholesale_cost: number
  retail_price: number
  quantity: number
  expiration_date: string | null
}

export async function createProductAndReceive(input: CreateProductAndReceiveInput) {
  if (!input.session_id) return { ok: false as const, error: 'Missing session' }
  if (!input.name.trim()) return { ok: false as const, error: 'Name is required' }
  if (!Number.isFinite(input.retail_price) || input.retail_price < 0) {
    return { ok: false as const, error: 'Retail price required' }
  }
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    return { ok: false as const, error: 'Quantity must be > 0' }
  }

  const supabase = await createClient()

  // Ensure the session is open.
  const { data: session } = await supabase
    .from('receiving_sessions')
    .select('status, supplier_id')
    .eq('id', input.session_id)
    .single()
  if (!session || session.status !== 'open') {
    return { ok: false as const, error: 'Session is not open' }
  }

  // Uniquify the slug if collision.
  const baseSlug = slugify(input.name)
  let slug = baseSlug
  for (let i = 1; i < 50; i++) {
    const { data: clash } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .limit(1)
      .maybeSingle()
    if (!clash) break
    slug = `${baseSlug}-${i}`
  }

  const { data: product, error: insertErr } = await supabase
    .from('products')
    .insert({
      name: input.name.trim(),
      slug,
      brand: input.brand?.trim() || null,
      size: input.size?.trim() || null,
      barcode: input.barcode?.trim() || null,
      image_url: input.image_url?.trim() || null,
      description: input.description?.trim() || null,
      category_id: input.category_id || null,
      wholesale_cost: input.wholesale_cost ?? 0,
      retail_price: input.retail_price,
      inventory_quantity: 0,
      is_active: true,
    })
    .select('id')
    .single()

  if (insertErr || !product) {
    return { ok: false as const, error: insertErr?.message ?? 'Failed to create product' }
  }

  const { error: rpcErr } = await supabase.rpc('receive_lot', {
    p_product_id: product.id,
    p_supplier_id: session.supplier_id,
    p_quantity: input.quantity,
    p_unit_cost: input.wholesale_cost ?? 0,
    p_lot_number: '',
    p_expiration_date: input.expiration_date,
    p_notes: '',
    p_receiving_session_id: input.session_id,
  })

  if (rpcErr) {
    return { ok: false as const, error: rpcErr.message, product_id: product.id }
  }

  revalidatePath(`/admin/receiving/${input.session_id}`)
  return { ok: true as const, product_id: product.id }
}
