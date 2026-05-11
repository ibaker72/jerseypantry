'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface ReceiveLotInput {
  product_id: string
  supplier_id: string | null
  quantity: number
  unit_cost: number
  lot_number: string | null
  expiration_date: string | null
  notes: string | null
}

export async function receiveLot(input: ReceiveLotInput) {
  if (!input.product_id) return { ok: false as const, error: 'Product is required' }
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    return { ok: false as const, error: 'Quantity must be greater than 0' }
  }
  if (!Number.isFinite(input.unit_cost) || input.unit_cost < 0) {
    return { ok: false as const, error: 'Unit cost must be ≥ 0' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('receive_lot', {
    p_product_id: input.product_id,
    p_supplier_id: input.supplier_id,
    p_quantity: input.quantity,
    p_unit_cost: input.unit_cost,
    p_lot_number: input.lot_number ?? '',
    p_expiration_date: input.expiration_date,
    p_notes: input.notes ?? '',
  })

  if (error) return { ok: false as const, error: error.message }

  revalidatePath('/admin/inventory/receive')
  revalidatePath('/admin/inventory/lots')
  revalidatePath('/admin/inventory')
  revalidatePath('/admin/products')
  return { ok: true as const, lot_id: data as string }
}
