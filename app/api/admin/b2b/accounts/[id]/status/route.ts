import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const serverClient = await createClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return null
  const supabase = createAdminClient()
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? supabase : null
}

const VALID_STATUSES = new Set(['active', 'suspended', 'canceled'])

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const status = body.status as string
  if (!VALID_STATUSES.has(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

  const update: Record<string, unknown> = { status }
  if (status === 'suspended') update.suspended_at = new Date().toISOString()
  if (status === 'active') {
    update.suspended_at = null
    update.dunning_stage = 0
  }

  const { data, error } = await supabase.from('business_accounts').update(update).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ account: data })
}
