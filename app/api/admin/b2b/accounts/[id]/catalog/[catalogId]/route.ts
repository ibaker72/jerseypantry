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

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; catalogId: string }> }) {
  const { catalogId } = await params
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase.from('business_catalogs').delete().eq('id', catalogId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; catalogId: string }> }) {
  const { catalogId } = await params
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { data, error } = await supabase
    .from('business_catalogs').update({ custom_price: body.custom_price }).eq('id', catalogId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}
