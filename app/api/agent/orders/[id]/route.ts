import { NextRequest, NextResponse } from 'next/server'
import { requireAgentKey, agentSupabase } from '@/lib/agent/auth'

const VALID_STATUSES = ['pending', 'processing', 'out_for_delivery', 'delivered', 'canceled', 'refunded']

// GET /api/agent/orders/:id
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = requireAgentKey(req)
  if (deny) return deny

  const { id } = await params
  const supabase = agentSupabase()

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(name, slug))')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ order: data })
}

// PATCH /api/agent/orders/:id  { status, note }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = requireAgentKey(req)
  if (deny) return deny

  const { id } = await params
  const body = await req.json()
  const { status, note } = body

  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: `Invalid status. Valid: ${VALID_STATUSES.join(', ')}` }, { status: 400 })
  }

  const supabase = agentSupabase()
  const updates: Record<string, unknown> = {}
  if (status) updates.status = status
  if (note) updates.admin_note = note
  if (status === 'delivered') updates.delivered_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ order: data })
}
