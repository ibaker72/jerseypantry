import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const schema = z.object({
  product_name: z.string().trim().min(1).max(200),
  brand: z.string().trim().max(100).optional().or(z.literal('')),
  size: z.string().trim().max(50).optional().or(z.literal('')),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  email: z.string().trim().email().optional().or(z.literal('')),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  product_id: z.string().uuid().optional().nullable(),
  source: z
    .enum(['storefront', 'product_page', 'search', 'admin'])
    .default('storefront'),
})

function blank(s: string | undefined | null) {
  if (!s) return null
  const t = s.trim()
  return t.length ? t : null
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', issues: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  const payload = {
    product_id: parsed.data.product_id ?? null,
    product_name: parsed.data.product_name.trim(),
    brand: blank(parsed.data.brand),
    size: blank(parsed.data.size),
    notes: blank(parsed.data.notes),
    email: blank(parsed.data.email),
    phone: blank(parsed.data.phone),
    source: parsed.data.source,
  }

  // De-dupe: if a matching open request already exists, bump its count
  // instead of piling up new rows.
  const dedupe = supabase
    .from('stock_requests')
    .select('id, request_count')
    .in('status', ['new', 'reviewing'])
    .ilike('product_name', payload.product_name)
    .limit(1)

  const { data: existing } = payload.product_id
    ? await supabase
        .from('stock_requests')
        .select('id, request_count')
        .in('status', ['new', 'reviewing'])
        .eq('product_id', payload.product_id)
        .limit(1)
    : await dedupe

  if (existing && existing.length > 0) {
    const row = existing[0]
    await supabase
      .from('stock_requests')
      .update({ request_count: row.request_count + 1 })
      .eq('id', row.id)
    return NextResponse.json({ success: true, deduped: true })
  }

  const { error } = await supabase.from('stock_requests').insert(payload)
  if (error) {
    console.error('Failed to save stock request:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
