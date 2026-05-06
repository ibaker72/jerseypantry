import { NextRequest, NextResponse } from 'next/server'
import { requireAgentKey, agentSupabase } from '@/lib/agent/auth'

// GET /api/agent/inventory?low_stock=true&category=drinks&limit=50
export async function GET(req: NextRequest) {
  const deny = requireAgentKey(req)
  if (deny) return deny

  const supabase = agentSupabase()
  const { searchParams } = req.nextUrl
  const lowStock = searchParams.get('low_stock') === 'true'
  const category = searchParams.get('category')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)

  let query = supabase
    .from('products')
    .select('id, name, slug, stock_quantity, price, is_active, category:categories(name)', { count: 'exact' })
    .eq('is_active', true)
    .order('stock_quantity', { ascending: true })
    .limit(limit)

  if (lowStock) query = query.lt('stock_quantity', 10)
  if (category) query = query.eq('categories.slug', category)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ products: data, total: count })
}

// PATCH /api/agent/inventory  { product_id, adjustment, reason }
// adjustment is a delta (+10 restocked, -2 damaged)
export async function PATCH(req: NextRequest) {
  const deny = requireAgentKey(req)
  if (deny) return deny

  const supabase = agentSupabase()
  const body = await req.json()
  const { product_id, adjustment, set_quantity, reason } = body

  if (!product_id) return NextResponse.json({ error: 'product_id required' }, { status: 400 })
  if (adjustment === undefined && set_quantity === undefined) {
    return NextResponse.json({ error: 'adjustment or set_quantity required' }, { status: 400 })
  }

  const { data: product } = await supabase
    .from('products')
    .select('id, name, stock_quantity')
    .eq('id', product_id)
    .single()

  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const newQty = set_quantity !== undefined
    ? set_quantity
    : Math.max(0, (product.stock_quantity ?? 0) + adjustment)

  const { data, error } = await supabase
    .from('products')
    .update({ stock_quantity: newQty })
    .eq('id', product_id)
    .select('id, name, stock_quantity')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    product: data,
    previous_quantity: product.stock_quantity,
    reason: reason ?? null,
  })
}
