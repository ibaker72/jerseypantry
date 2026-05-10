import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { B2BPlan } from '@/types'

const VALID_PLAN = new Set<B2BPlan>(['starter', 'standard', 'premium'])

async function requireAdmin() {
  const serverClient = await createClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return null
  const supabase = createAdminClient()
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? supabase : null
}

export async function POST(req: NextRequest) {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const plan_name = body.plan_name as B2BPlan
  const product_id = body.product_id as string
  const quantity = parseInt(body.quantity, 10)

  if (!VALID_PLAN.has(plan_name) || !product_id || !Number.isFinite(quantity) || quantity < 1) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('b2b_plan_items')
    .insert({ plan_name, product_id, quantity })
    .select('*, product:products(id, name, retail_price, sku)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data }, { status: 201 })
}
