'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { PaymentTerms } from '@/types'

const TERMS: PaymentTerms[] = ['prepaid', 'cash', 'net15', 'net30', 'net60', 'other']

function read(form: FormData, key: string) {
  const v = form.get(key)
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t.length ? t : null
}

function payload(form: FormData) {
  const termsRaw = read(form, 'payment_terms')
  const payment_terms: PaymentTerms =
    termsRaw && (TERMS as string[]).includes(termsRaw)
      ? (termsRaw as PaymentTerms)
      : 'prepaid'

  return {
    name: read(form, 'name') ?? '',
    contact_name: read(form, 'contact_name'),
    email: read(form, 'email'),
    phone: read(form, 'phone'),
    address: read(form, 'address'),
    website: read(form, 'website'),
    payment_terms,
    notes: read(form, 'notes'),
    is_active: form.get('is_active') === 'on',
  }
}

export async function createSupplier(form: FormData) {
  const data = payload(form)
  if (!data.name) {
    return { ok: false as const, error: 'Name is required' }
  }
  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from('suppliers')
    .insert(data)
    .select('id')
    .single()
  if (error) return { ok: false as const, error: error.message }
  revalidatePath('/admin/suppliers')
  redirect(`/admin/suppliers/${row.id}`)
}

export async function updateSupplier(id: string, form: FormData) {
  const data = payload(form)
  if (!data.name) {
    return { ok: false as const, error: 'Name is required' }
  }
  const supabase = await createClient()
  const { error } = await supabase.from('suppliers').update(data).eq('id', id)
  if (error) return { ok: false as const, error: error.message }
  revalidatePath('/admin/suppliers')
  revalidatePath(`/admin/suppliers/${id}`)
  return { ok: true as const }
}

export async function archiveSupplier(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('suppliers')
    .update({ is_active: false })
    .eq('id', id)
  if (error) return { ok: false as const, error: error.message }
  revalidatePath('/admin/suppliers')
  redirect('/admin/suppliers')
}
