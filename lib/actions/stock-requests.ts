'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { StockRequestStatus } from '@/types'

const VALID_STATUSES: StockRequestStatus[] = [
  'new',
  'reviewing',
  'sourced',
  'declined',
]

export async function updateStockRequestStatus(
  id: string,
  status: StockRequestStatus
) {
  if (!VALID_STATUSES.includes(status)) {
    return { ok: false, error: 'Invalid status' as const }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('stock_requests')
    .update({ status })
    .eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/stock-requests')
  return { ok: true as const }
}

export async function updateStockRequestNotes(id: string, notes: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('stock_requests')
    .update({ admin_notes: notes.trim() || null })
    .eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/stock-requests')
  return { ok: true as const }
}
