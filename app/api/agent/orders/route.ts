import { NextRequest, NextResponse } from 'next/server'
import { requireAgentKey, agentSupabase } from '@/lib/agent/auth'

// GET /api/agent/orders?status=pending&limit=20&page=1
export async function GET(req: NextRequest) {
  const deny = requireAgentKey(req)
  if (deny) return deny

  const supabase = agentSupabase()
  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)
  const page = Math.max(parseInt(searchParams.get('page') ?? '1'), 1)
  const from = (page - 1) * limit

  let query = supabase
    .from('orders')
    .select('id, created_at, status, total, subtotal, delivery_address, user_id, business_account_id, order_items(quantity, unit_price, products(name))', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (status) query = query.eq('status', status)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ orders: data, total: count, page, limit })
}
